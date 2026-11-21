import { execFile } from 'node:child_process';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { fixed, getFault } from '../dist/shop/faults.js';

const exec = promisify(execFile);

export function readPRTarget(repo, base, file = 'dist/auth.js') {
  if (!repo) return null;
  if (!/^[\w-]+\/[\w.-]+$/.test(repo) || !/^[a-zA-Z0-9][\w/.-]{0,110}$/.test(base) || base.includes('..')) {
    throw new Error('WALKTHROUGH_PR_REPO must be owner/repo and WALKTHROUGH_PR_BASE must be a branch.');
  }
  if (typeof file !== 'string' || !/^(?:[\w-]+\/)*dist\/auth\.js$/.test(file)) {
    throw new Error('WALKTHROUGH_PR_FILE must identify the demo dist/auth.js inside the repository.');
  }
  return { repo, base, file };
}

export async function openRepairPR(target, faultName, proposal) {
  const faulty = getFault(faultName);
  if (!target || !faulty || proposal.replacement !== fixed) throw new Error('A verified repair and configured GitHub base branch are required.');
  const work = await mkdtemp(join(tmpdir(), 'walkthrough-pr-'));
  const checkout = join(work, 'checkout');
  const timeout = 35_000;
  const env = { ...process.env, GH_PROMPT_DISABLED: '1', GIT_TERMINAL_PROMPT: '0' };
  const gh = (args, cwd = work) => exec('gh', args, { cwd, timeout, env });
  const git = (args) => exec('git', args, { cwd: checkout, timeout, env });
  try {
    await gh(['auth', 'status', '--hostname', 'github.com']);
    await gh(['repo', 'clone', target.repo, checkout, '--', '--no-tags', '--depth=1', '--branch', target.base]);
    const file = join(checkout, target.file);
    const trusted = await readFile(new URL('../dist/auth.js', import.meta.url), 'utf8');
    const changes = (await git(['status', '--porcelain'])).stdout;
    if (changes.trim() || await realpath(file) !== join(await realpath(checkout), target.file) || await readFile(file, 'utf8') !== trusted.replace(fixed, faulty.line)) {
      throw new Error('The configured base must contain the exact Tiny Shop fault in dist/auth.js.');
    }
    const head = 'walkthrough/repair-' + faultName + '-' + Date.now().toString(36);
    await git(['switch', '-c', head]);
    await writeFile(file, trusted);
    await git(['diff', '--check']);
    await git(['add', '--', target.file]);
    await git(['-c', 'user.name=WalkThrough', '-c', 'user.email=walkthrough@users.noreply.github.com',
      'commit', '-m', 'Restore Tiny Shop login normalization']);
    await git(['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', 'push', 'origin', 'HEAD:refs/heads/' + head]);
    const result = await gh(['pr', 'create', '--draft', '--repo', target.repo, '--base', target.base, '--head', head,
      '--title', 'Restore Tiny Shop login normalization', '--body',
      'The WalkThrough login regression passed after restoring email normalization.\n\n' + proposal.diagnosis], checkout);
    return result.stdout.trim().split('\n').at(-1);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
