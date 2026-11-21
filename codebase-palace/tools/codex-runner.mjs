import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function askCodex(prompt, schema, { cwd, timeout = 60_000 } = {}) {
  const scratch = await mkdtemp(join(tmpdir(), 'walkthrough-codex-'));
  const result = join(scratch, 'response.json');
  const schemaPath = join(scratch, 'schema.json');
  try {
    await writeFile(schemaPath, JSON.stringify(schema));
    await new Promise((resolve, reject) => {
      const child = spawn('codex', [
        '-a', 'never', 'exec', '--skip-git-repo-check', '--sandbox', 'read-only', '--ephemeral',
        '--output-schema', schemaPath, '--output-last-message', result, '-',
      ], { cwd: cwd || scratch, stdio: ['pipe', 'ignore', 'ignore'], timeout });
      child.stdin.on('error', () => {});
      child.stdin.end(prompt);
      child.once('error', reject);
      child.once('close', (code) => code === 0 ? resolve() : reject(new Error('Codex did not return a result.')));
    });
    return JSON.parse(await readFile(result, 'utf8'));
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
