import { roomExhibit } from './exhibits.js';

const code = /\.(?:[cm]?js|jsx|[cm]?ts|tsx|py)$/i;
const unwanted = /(^|\/)(?:node_modules|dist|build|vendor|\.github|test|tests|__tests__|fixtures|docs|examples|benchmarks|coverage)(\/|$)|\.(?:test|spec|d)\.[^.]+$/i;
export const isSourceFile = (path) => code.test(path) && !unwanted.test(path);

export function classify(path) {
  if (/(^|[\/_.-])(db|database|models?|schema|storage|persistence|migrations?|dao|repositories|cache)([\/_.-]|$)/i.test(path)) return 0;
  if (/(^|[\/_.-])(api|routes?|controllers?|middleware|handlers?|server|blueprints|request|response)([\/_.-]|$)/i.test(path)) return 2;
  if (/\.[jt]sx$|(^|[\/_.-])(ui|components?|pages?|templates?|views?|client|frontend|public|app|forms?|cli)([\/_.-]|$)/i.test(path)) return 3;
  return 1;
}

function humanize(input) {
  return input.replace(/\.[^.]+$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[^a-z\d]+/gi, ' ')
    .trim().replace(/(^| )\w/g, (match) => match.toUpperCase()) || 'Core';
}

export function githubURL(input) {
  const url = new URL(/^https?:\/\//i.test(input) ? input : 'https://' + input);
  const chunks = url.pathname.split('/').filter(Boolean);
  if (!/^github\.com$/i.test(url.host) || chunks.length !== 2 || url.username || url.password) throw new Error('Enter a GitHub repository URL, such as github.com/expressjs/express.');
  const slug = chunks[0] + '/' + chunks[1].replace(/\.git$/i, '');
  if (!/^[\w-]+\/[\w.-]+$/.test(slug)) throw new Error('GitHub expects an owner and repository name.');
  return slug;
}

async function request(url, signal, json = true) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) throw new Error('GitHub’s request limit was reached. Try an example or import architecture JSON.');
    if (response.status === 404) throw new Error('GitHub could not find that public repository.');
    throw new Error('GitHub returned ' + response.status + '. Please try again.');
  }
  return json ? response.json() : response.text();
}

export function scanSource(path, source) {
  const js = !path.endsWith('.py');
  const functions = new Set();
  const imports = new Set();
  const declarations = js
    ? /\b(?:async\s+)?function\s+([\w$]+)\s*\(|\b(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^\n]*?\)|[\w$]+)\s*=>/g
    : /^\s*(?:async\s+)?def\s+([\w]+)\s*\(/gm;
  for (const m of source.matchAll(declarations)) functions.add((m[1] || m[2]) + '()');
  const references = js
    ? /(?:\bfrom\s*|\b(?:require|import)\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g
    : /^\s*(?:from\s+([.\w]+)\s+import\s+([\w, ]+)|import\s+([.\w]+))/gm;
  for (const m of source.matchAll(references)) {
    const base = m[1] || m[3];
    imports.add(base);
    if (!js && m[2]) {
      for (const name of m[2].split(',').map((entry) => entry.trim().split(' ')[0]).filter(Boolean)) {
        imports.add(base + (base.endsWith('.') ? '' : '.') + name);
      }
    }
  }
  return { path, functions: [...functions].slice(0, 12), imports: [...imports], loc: source.split('\n').length };
}

function resolve(path, ref, known) {
  const directories = path.split('/').slice(0, -1);
  const extensions = ['', '.js', '.ts', '.tsx', '.jsx', '.mjs', '.py', '/index.js', '/index.ts', '/__init__.py'];
  if (path.endsWith('.py') && !ref.startsWith('.')) {
    const end = ref.replaceAll('.', '/');
    for (const suffix of ['.py', '/__init__.py']) {
      const match = [...known.keys()].find((key) => key === end + suffix || key.endsWith('/' + end + suffix));
      if (match) return known.get(match);
    }
    return null;
  }
  if (!ref.startsWith('.')) return null;
  if (path.endsWith('.py')) {
    const [prefix] = ref.match(/^\.+/);
    directories.splice(Math.max(0, directories.length - prefix.length + 1), prefix.length - 1);
    directories.push(ref.slice(prefix.length).replaceAll('.', '/'));
  } else {
    for (const part of ref.split('/')) {
      if (part === '..') directories.pop();
      else if (part !== '.') directories.push(part);
    }
  }
  const absolute = directories.join('/').replace(/\/$/, '');
  for (const suffix of extensions) {
    if (known.has(absolute + suffix)) return known.get(absolute + suffix);
  }
  return null;
}

function groupPaths(paths) {
  return [0, 1, 2, 3].flatMap((floor) => {
    const groups = new Map();
    const candidates = paths.filter((file) => classify(file.path) === floor);
    const strip = /^(?:src|lib|packages?)$/i;
    for (const file of candidates) {
      const parts = file.path.split('/');
      const ancestors = parts.slice(0, -1).filter((part) => !strip.test(part));
      const key = ancestors.at(-1) || parts.at(-1).replace(/\.[^.]+$/, '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(file);
    }
    const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    const visible = ordered.length > 4 ? [...ordered.slice(0, 3), ['other modules', ordered.slice(3).flatMap(([, list]) => list)]] : ordered;
    return visible.map(([name, files], slot) => ({
      id: floor + '-' + slot, name: humanize(name), floor,
      files: files.sort((a, b) => Number(!/(^|\/)(index|__init__|main)\./.test(a.path)) - Number(!/(^|\/)(index|__init__|main)\./.test(b.path)) || b.size - a.size),
    }));
  });
}

function cycleNodes(rooms) {
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const reaches = (start, target, visited) => {
    if (start === target) return true;
    if (visited.has(start)) return false;
    visited.add(start);
    return roomsById.get(start)?.dependencies.some((id) => reaches(id, target, visited)) ?? false;
  };
  return rooms.filter((room) => room.dependencies.some((id) => reaches(id, room.id, new Set()))).map((room) => room.id);
}

export async function mapLimited(items, limit, task) {
  let cursor = 0;
  const results = [];
  await Promise.all(Array.from({ length: Math.min(items.length, limit) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try { results[index] = await task(items[index]); }
      catch { results[index] = null; }
    }
  }));
  return results.filter(Boolean);
}

export function timelineFromCommits(commits, paths, roomIDs) {
  const initialPaths = new Set(paths.keys());
  for (const commit of commits) {
    for (const file of commit.files) if (file.status === 'added') initialPaths.delete(file.filename);
  }
  const fileState = new Set(initialPaths);
  const hits = new Map();
  return commits.map((commit) => {
    const changed = new Set();
    for (const file of commit.files) {
      const id = paths.get(file.filename);
      if (!id) continue;
      changed.add(id);
      if (file.status === 'removed') fileState.delete(file.filename);
      else fileState.add(file.filename);
    }
    for (const id of changed) hits.set(id, (hits.get(id) || 0) + 1);
    const active = new Set([...fileState].map((path) => paths.get(path)));
    return {
      sha: commit.sha, title: commit.commit.message.split('\n')[0].slice(0, 180), date: commit.commit.author?.date || '',
      rooms: roomIDs.filter((id) => active.has(id)), changed: [...changed],
      hot: roomIDs.filter((id) => active.has(id) && (hits.get(id) || 0) >= 2),
    };
  });
}

export async function scanGitHub(input, progress, signal) {
  const slug = githubURL(input.trim());
  const api = 'https://api.github.com/repos/' + slug;
  progress('Reading the repository tree…');
  const repo = await request(api, signal);
  const branch = encodeURIComponent(repo.default_branch);
  const tree = await request(api + '/git/trees/' + branch + '?recursive=1', signal);
  const allCode = tree.tree.filter((node) => node.type === 'blob' && isSourceFile(node.path));
  if (!allCode.length) throw new Error('This repository has no supported JavaScript, TypeScript, or Python source files.');
  const groups = groupPaths(allCode);
  const paths = new Map(groups.flatMap((group) => group.files.map((node) => [node.path, group.id])));
  const desired = groups.flatMap((group) => group.files
    .filter((file) => file.size <= 220_000).slice(0, allCode.length <= 240 ? undefined : 6));
  progress('Reading ' + desired.length + ' source files and recent commits…');
  const raw = 'https://raw.githubusercontent.com/' + slug + '/' + branch + '/';
  const recent = request(api + '/commits?per_page=12', signal).then((commits) =>
    mapLimited(commits.slice().reverse(), 5, (entry) => request(api + '/commits/' + entry.sha, signal))).catch(() => []);
  const parsed = await mapLimited(desired, 10, async (file) =>
    scanSource(file.path, await request(raw + file.path.split('/').map(encodeURIComponent).join('/'), signal, false)));
  signal?.throwIfAborted();
  const byRoom = new Map();
  for (const file of parsed) {
    const id = paths.get(file.path);
    if (!byRoom.has(id)) byRoom.set(id, []);
    byRoom.get(id).push(file);
  }
  const rooms = groups.map((group) => {
    const source = byRoom.get(group.id) || [];
    const dependencies = [...new Set(source.flatMap((file) => file.imports.map((link) => resolve(file.path, link, paths))))].filter((id) => id && id !== group.id);
    const functions = [...new Set(source.flatMap((file) => file.functions))].slice(0, 5);
    const sources = Object.fromEntries(functions.map((fn) => [fn, source.find((file) => file.functions.includes(fn))?.path]));
    const coverage = source.length + ' of ' + group.files.length + ' source files read in this room.';
    return { id: group.id, name: group.name, floor: group.floor, path: group.files[0].path, files: group.files.length,
      functions, functionSources: sources, dependencies, status: 'normal',
      loc: source.length ? source.reduce((a, file) => a + file.loc, 0) : null,
      description: coverage + ' Detected ' + dependencies.length + ' internal ' + (dependencies.length === 1 ? 'dependency' : 'dependencies') + '.' };
  });
  const commits = await recent;
  signal?.throwIfAborted();
  const history = timelineFromCommits(commits, paths, rooms.map((room) => room.id));
  const changed = new Map();
  for (const frame of history) for (const id of frame.changed) changed.set(id, (changed.get(id) || 0) + 1);
  const cyclic = new Set(cycleNodes(rooms));
  const inbound = new Set(rooms.flatMap((room) => room.dependencies));
  for (const room of rooms) {
    room.changed = changed.get(room.id) || 0;
    if (room.changed >= 2 && room.changed === Math.max(...changed.values())) room.status = 'hot';
    if (cyclic.has(room.id)) room.status = 'cycle';
    if (parsed.length === allCode.length && /(^|[\/_.-])(legacy|unused|deprecated)([\/_.-]|$)/i.test(room.path) &&
      !inbound.has(room.id) && room.status === 'normal') {
      room.status = 'dust';
      room.description += ' No incoming references were detected. This is an unused-code candidate.';
    }
    Object.assign(room, roomExhibit(room));
  }
  const discovered = new Map(parsed.map((entry) => [entry.path, entry.functions]));
  const testPaths = tree.tree.filter((node) => node.type === 'blob' && code.test(node.path) &&
    /(^|\/)(?:tests?|__tests__)(\/|$)|\.(test|spec)\.[^.]+$/.test(node.path)).map((node) => node.path);
  const sourceIndex = [...new Set([...parsed.map((entry) => entry.path), ...paths.keys(), ...testPaths])].slice(0, 1400)
    .map((path) => ({ path, room: paths.get(path), functions: discovered.get(path) || [] }));
  return { name: humanize(repo.name), slug, branch: repo.default_branch, kind: 'github', rooms, sourceIndex, fileCount: allCode.length,
    readCount: parsed.length, history, truncated: tree.truncated };
}

export function importModel(data) {
  if (!data || typeof data.name !== 'string' || !Array.isArray(data.rooms) || !data.rooms.length || data.rooms.length > 24) {
    throw new Error('Include a name and 1–24 rooms in your architecture JSON.');
  }
  const validText = (value, max = 150) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const ids = new Set();
  const counts = [0, 0, 0, 0];
  const rooms = data.rooms.map((room) => {
    const id = validText(room?.id, 70);
    const name = validText(room?.name, 60);
    const floor = room?.floor;
    if (!id || !name || ids.has(id) || !Number.isInteger(floor) || floor < 0 || floor > 3 || ++counts[floor] > 6) {
      throw new Error('Rooms need unique IDs and names, with up to six rooms per floor. Use a floor number from 0 to 3.');
    }
    ids.add(id);
    const status = ['hot', 'dust', 'cycle'].includes(room.status) ? room.status : 'normal';
    const path = validText(room.path) || name;
    const functions = Array.isArray(room.functions) ? room.functions.map((x) => validText(x, 100)).filter(Boolean).slice(0, 8) : [];
    const exhibit = roomExhibit({ name, floor, path, functions, status, prop: room.prop,
      cue: validText(room.cue), mnemonic: validText(room.mnemonic, 500) });
    return { id, name, floor, status, path, ...exhibit,
      description: validText(room.description, 2200) || 'Inspect the file and any linked rooms to explore this module.',
      loc: Number.isFinite(room.loc) && room.loc >= 0 ? Math.trunc(room.loc) : null,
      functions,
      dependencies: Array.isArray(room.dependencies) ? [...new Set(room.dependencies.map((x) => validText(x, 70)).filter(Boolean))].slice(0, 24) : [] };
  });
  for (const room of rooms) room.dependencies = room.dependencies.filter((id) => ids.has(id) && id !== room.id);
  const history = Array.isArray(data.history) ? data.history.slice(-120).map((frame) => {
    const keys = (field) => Array.isArray(frame?.[field]) ? frame[field].filter((value) => ids.has(value)) : [];
    return { sha: validText(frame?.sha, 64), title: validText(frame?.title, 180),
      date: validText(frame?.date, 50), rooms: keys('rooms'), changed: keys('changed'), hot: keys('hot') };
  }).filter((frame) => frame.sha && frame.title) : [];
  const sourceIndex = Array.isArray(data.sourceIndex) ? data.sourceIndex.slice(0, 1400).map((entry) => ({
    path: validText(entry?.path, 320), room: ids.has(entry?.room) ? entry.room : null,
    functions: Array.isArray(entry?.functions) ? entry.functions.slice(0, 24).map((fn) => validText(fn, 100)).filter(Boolean) : [],
  })).filter((entry) => entry.path) : [];
  return { name: validText(data.name, 80) || 'Imported building', slug: validText(data.slug, 120) || 'local / architecture.json',
    branch: validText(data.branch, 130), kind: 'import', rooms, history, sourceIndex };
}
