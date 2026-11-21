import { scanSource } from './repository.js';

const stop = new Set(('a about all also an and are as at be building by can code could do does file find for from function functions get how i in is it me main my of on or please repo repository show source tell that the this to use used what when where which who why will with would you').split(' '));
const githubKinds = ['github', 'codex', 'snapshot', 'import'];
const sourceExtension = /\.(?:[cm]?js|jsx|[cm]?ts|tsx|py)$/i;

export function sourceWords(text) {
  return [...new Set((String(text).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ')
    .toLowerCase().match(/[a-z0-9_$]+/g) || []).filter((word) => word.length > 1 && !stop.has(word)))];
}

export function safeSourcePath(path) {
  return typeof path === 'string' && path.length <= 320 && !path.includes('\\') &&
    path.split('/').every((part) => part && part !== '.' && part !== '..') &&
    !/[\u0000-\u001f]/.test(path);
}

function gitLocation(model, path, domain) {
  if (!githubKinds.includes(model.kind) || !/^[\w-]+\/[\w.-]+$/.test(model.slug) ||
      !safeSourcePath(path)) return '';
  const slug = model.slug.split('/').map(encodeURIComponent).join('/');
  const ref = typeof model.branch === 'string' && /^[\w/.-]{1,130}$/.test(model.branch) ? model.branch : 'HEAD';
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return domain === 'raw'
    ? 'https://raw.githubusercontent.com/' + slug + '/' + encodeURIComponent(ref) + '/' + encoded
    : 'https://github.com/' + slug + '/blob/' + encodeURIComponent(ref) + '/' + encoded;
}

function baseline(model) {
  const items = new Map();
  const add = (path, room, functions = []) => {
    if (!safeSourcePath(path) || !sourceExtension.test(path)) return;
    const current = items.get(path);
    if (current) {
      current.functions = [...new Set([...current.functions, ...functions])].slice(0, 32);
      current.room ||= room;
    } else items.set(path, { path, room, functions: functions.slice(0, 32) });
  };
  for (const room of model.rooms) {
    add(room.path, room, room.functions);
    for (const [fn, path] of Object.entries(room.functionSources || {})) add(path, room, [fn]);
  }
  const rooms = new Map(model.rooms.map((room) => [room.id, room]));
  for (const entry of model.sourceIndex || []) add(entry.path, rooms.get(entry.room), entry.functions || []);
  if (model.kind === 'demo') add('dist/runtime.js', rooms.get('routes'), ['Shop', 'instrument', 'login']);
  return items;
}

function overlap(needle, haystack) {
  return needle.reduce((sum, word) => sum + (haystack.has(word) ? 1 : 0), 0);
}

function rank(files, query, selected, prior) {
  const terms = sourceWords(query);
  const followUp = terms.length <= 2 && /\b(it|there|they|that|this|callers?|usage|used)\b/i.test(query);
  const priorWords = followUp ? sourceWords(prior).slice(0, 8) : [];
  return files.map((item) => {
    const path = new Set(sourceWords(item.path));
    const names = new Set(sourceWords(item.functions.join(' ')));
    const room = new Set(sourceWords([item.room?.name, item.room?.description, item.room?.cue].filter(Boolean).join(' ')));
    const source = item.attached ? new Set(sourceWords(item.attached)) : new Set();
    const score = overlap(terms, path) * 8 + overlap(terms, names) * 11 + overlap(terms, room) * 2 +
      Math.min(8, overlap(terms, source) * 2) + overlap(priorWords, new Set([...path, ...names])) * 3 +
      (item.room?.id === selected ? (followUp || !terms.length ? 10 : .65) : 0);
    return { ...item, score };
  }).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}

function excerpt(code, query, prior, fn) {
  const lines = code.replace(/\r\n?/g, '\n').split('\n');
  const terms = sourceWords(query);
  const extra = terms.length <= 2 ? sourceWords(prior) : [];
  let best = 0;
  let bestScore = 0;
  for (let i = 0; i < lines.length; i++) {
    const words = new Set(sourceWords(lines[i]));
    const relevance = overlap(terms, words) * 3 + overlap(extra, words);
    const decl = /\b(function|def|class|export)\b/.test(lines[i]);
    const score = relevance * (decl ? 1.45 : 1) + (fn && lines[i].includes(fn) ? 3 : 0);
    if (score > bestScore) { bestScore = score; best = i; }
  }
  const start = Math.max(0, best - 6);
  const window = lines.slice(start, start + 25);
  while (window.length > 1 && window.join('\n').length > 2680) window.pop();
  const body = window.join('\n').slice(0, 2680);
  return { line: start + 1, end: start + window.length, code: body, relevance: bestScore };
}

async function readCode(item, model, fetcher, signal) {
  if (item.attached) return item.attached;
  const path = item.path;
  const url = model.kind === 'demo' && path.startsWith('dist/') ? './' + path.slice(5)
    : gitLocation(model, path, 'raw');
  if (!url) return '';
  const response = await fetcher(url, { signal });
  if (!response.ok || Number(response.headers.get('Content-Length')) > 430_000 ||
      response.headers.get('Content-Type')?.includes('text/html')) return '';
  const body = await response.text();
  return body.length <= 430_000 && !body.includes('\0') ? body : '';
}

export function createSourceContext(model, fetcher = fetch) {
  const files = baseline(model);
  const cache = new Map();
  return {
    attach(path, code) {
      if (!safeSourcePath(path) || !sourceExtension.test(path) || !code || code.length > 320_000) return false;
      const base = path.split('/').at(-1);
      const matches = [...files.keys()].filter((other) => other.split('/').at(-1) === base);
      const id = files.has(path) ? path : matches.length === 1 ? matches[0] : path;
      const item = files.get(id);
      const { functions } = scanSource(path, code);
      files.set(id, { ...item, path: id, functions, attached: code });
      cache.delete(id);
      return true;
    },
    async search(question, { selected, previousQuestion = '', signal } = {}) {
      const ranked = rank([...files.values()], question, selected, previousQuestion);
      const candidates = ranked.slice(0, 16);
      const evidence = [];
      for (let i = 0; i < candidates.length; i += 5) {
        signal?.throwIfAborted();
        const results = await Promise.allSettled(candidates.slice(i, i + 5).map(async (item) => {
          const code = cache.get(item.path) || await readCode(item, model, fetcher, signal);
          if (!code) return null;
          cache.set(item.path, code);
          const piece = excerpt(code, question, previousQuestion, item.functions.find((fn) =>
            sourceWords(fn).some((word) => sourceWords(question).includes(word)))?.replace(/\(\)$/, ''));
          const source = item.attached ? '' : model.kind === 'demo' ? './' + item.path.slice(5) : gitLocation(model, item.path, 'web');
          const href = source && (model.kind === 'demo' ? source : source + '#L' + piece.line + '-L' + piece.end);
          return { ...piece, path: item.path, href, room: item.room, score: item.score + piece.relevance };
        }));
        evidence.push(...results.filter((item) => item.status === 'fulfilled' && item.value).map((item) => item.value));
        if (evidence.length >= 7) break;
      }
      signal?.throwIfAborted();
      return evidence.sort((a, b) => b.score - a.score).slice(0, 6).map((item, i) => ({ ...item, id: 'S' + (i + 1) }));
    },
  };
}

export function sourceFallback(question, evidence) {
  const top = evidence.filter((item) => item.relevance > 0).slice(0, 3);
  if (!top.length) return { answer: 'I didn’t find a matching definition in the loaded source. Try a function or file name.', citations: [], provider: 'Source excerpts' };
  const cited = top.map((item) => {
    const { functions } = scanSource(item.path, item.code);
    const matching = functions.filter((name) => overlap(sourceWords(question), new Set(sourceWords(name))) > 0);
    const definitions = matching.length ? matching : functions;
    const label = item.room?.name ? item.room.name + ' · ' : '';
    return label + item.path + (definitions.length ? ' defines ' + definitions.slice(0, 4).join(', ') : '') + ' [' + item.id + ']';
  });
  return { answer: 'These source excerpts match your question:\n\n' + cited.join('\n'), citations: top.map((item) => item.id), provider: 'Source excerpts' };
}
