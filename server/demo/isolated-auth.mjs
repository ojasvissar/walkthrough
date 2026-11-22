import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Shop } from '../../public/js/shop/runtime.js';
import { fixed, getFault } from '../../public/js/shop/faults.js';

export async function useAuthSource(name, replacement, run) {
  const temporary = await mkdtemp(join(tmpdir(), 'walkthrough-shop-'));
  const path = join(temporary, 'auth.mjs');
  try {
    const base = await readFile(new URL('../../public/js/shop/auth.js', import.meta.url), 'utf8');
    const fault = name && getFault(name);
    if (name && !fault) throw new Error('Unknown demo fault.');
    if (replacement && replacement !== fixed) throw new Error('The repair must restore Tiny Shop email normalization.');
    const broken = fault ? base.replace(fixed, fault.line) : base;
    await writeFile(path, broken);
    if (replacement && fault) await writeFile(path, broken.replace(fault.line, replacement));
    const auth = await import(pathToFileURL(path).href);
    return await run(new Shop(auth));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
