import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { codexMap } from './codex-map.mjs';

const [, , repository, output = 'architecture.json'] = process.argv;
if (!repository) {
  console.error('Usage: node tools/map-with-codex.mjs /path/to/checkout [architecture.json]');
  process.exit(1);
}

try {
  const model = await codexMap({ directory: repository });
  await writeFile(resolve(output), JSON.stringify(model, null, 2) + '\n', { flag: 'wx' });
  console.log('Import ' + resolve(output) + ' from the Example repos menu.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
