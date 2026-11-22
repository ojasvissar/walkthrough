import { readFile } from 'node:fs/promises';
import { fixed, getFault } from '../../public/js/shop/faults.js';
import { askCodex } from './runner.mjs';

const schema = {
  type: 'object', additionalProperties: false, required: ['diagnosis', 'replacement'],
  properties: { diagnosis: { type: 'string' }, replacement: { type: 'string' } },
};

export async function proposeRepair(name = 'case', trace = []) {
  const fault = getFault(name);
  if (!fault) throw new Error('Choose a Tiny Shop fault to repair.');
  const base = await readFile(new URL('../../public/js/shop/auth.js', import.meta.url), 'utf8');
  const faulty = base.replace(fixed, fault.line);
  const prompt = [
    'Diagnose this controlled Tiny Shop regression. Here is the actual faulty module:',
    faulty,
    'Regression input: "  Shopper@TinyShop.Test  ". The user store key is "shopper@tinyshop.test".',
    'The expected result is a signed-in session. Observed trace:',
    trace.filter((event) => typeof event.operation === 'string').map(({ room, operation }) => room + ' ' + operation).join('\n') ||
      'Normalize email, query the in-memory user store, then reject the credentials.',
    'Return a short diagnosis and only the corrected return statement for normalizeEmail. Use a single return statement and no Markdown.',
  ].join('\n');
  const proposal = await askCodex(prompt, schema);
  if (typeof proposal.diagnosis !== 'string' || proposal.replacement?.trim() !== fixed) {
    throw new Error('The proposal did not match the controlled regression.');
  }
  return { diagnosis: proposal.diagnosis.trim().slice(0, 600), replacement: proposal.replacement.trim() };
}
