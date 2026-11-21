import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4',
};

async function readAssets(parent = '') {
  const result = [];
  for (const entry of (await readdir(join(root, parent), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.') || !parent && entry.name === 'server') continue;
    const path = join(parent, entry.name);
    if (entry.isDirectory()) result.push(...await readAssets(path));
    if (!entry.isFile() || !mime[extname(path)]) continue;
    const source = await readFile(join(root, path));
    result.push(['/' + path, {
      type: mime[extname(path)], length: source.length,
      etag: '"' + createHash('sha256').update(source).digest('hex').slice(0, 24) + '"',
      data: source.toString('base64'),
    }]);
  }
  return result;
}

const assets = Object.fromEntries(await readAssets());
const provider = await readFile(new URL('../server/ask-service.js', import.meta.url), 'utf8');
const handler = await readFile(new URL('../server/worker.js', import.meta.url), 'utf8');
const bundled = handler.replace("import { answerOpenAI, parseAsk } from './ask-service.js';", '');
if (bundled === handler) throw new Error('The worker’s provider import could not be bundled.');
await mkdir(join(root, 'server'), { recursive: true });
const entry = join(root, 'server', 'index.js');
await writeFile(entry + '.tmp', provider + '\n' + bundled + '\nexport default createWorker(' + JSON.stringify(assets) + ');\n');
await rename(entry + '.tmp', entry);
console.log('Built WalkThrough Worker with ' + Object.keys(assets).length + ' static assets.');
