import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tiny } from '../dist/data.js';
import { createSourceContext, safeSourcePath, sourceFallback, sourceWords } from '../dist/source-context.js';
import { answerOpenAI, parseAsk, validateAnswer } from '../server/ask-service.js';
import { createWorker } from '../server/worker.js';

const source = createSourceContext(tiny, async (url) => {
  try { return new Response(await readFile(new URL('../dist/' + url.slice(2), import.meta.url), 'utf8')); }
  catch { return new Response('', { status: 404 }); }
});
const question = 'Where does payment validation happen?';
const evidence = await source.search(question, { selected: 'auth' });
assert.equal(evidence[0].path, 'dist/shop/payments.js');
assert.match(evidence[0].code, /function validatePayment/);
assert.ok(evidence[0].line > 0 && evidence[0].end > evidence[0].line);
assert.ok(sourceFallback(question, evidence).citations.includes(evidence[0].id));
assert.ok(sourceWords('get_user_by_email').includes('email'));
assert.equal(safeSourcePath('../evil.js'), false);
assert.equal(safeSourcePath('src/file.js'), true);

const foreign = createSourceContext({ name: 'Imported code', kind: 'import', slug: 'local / architecture.json', rooms: [] },
  () => { throw new Error('Local attachments do not fetch a URL.'); });
assert.ok(foreign.attach('src/auth/login.py', 'def find_user_by_email(email):\n    return user_store.get(email)'));
assert.ok(foreign.attach('tests/test_auth.py', 'def test_login():\n    assert login()'));
assert.equal((await foreign.search('Where is find user by email?'))[0].path, 'src/auth/login.py');

const input = parseAsk({ question, repository: tiny.slug, evidence });
assert.throws(() => parseAsk({ question, evidence: [] }));
assert.deepEqual(validateAnswer({ answer: 'In [S1], not [S9].', citations: ['S9'] }, input, 'Test').citations, ['S1']);
const token = 'sk-proj-' + 'a'.repeat(24);
const redacted = parseAsk({ question, evidence: [{ id: 'S1', line: 3, path: 'source.js', code: 'token = "' + token + '"' }] });
assert.ok(!redacted.evidence[0].code.includes(token));

const reply = await answerOpenAI(input, { apiKey: 'mock-key', fetcher: async (url, req) => {
  const post = JSON.parse(req.body);
  assert.equal(url, 'https://api.openai.com/v1/responses');
  assert.equal(post.store, false);
  assert.equal(post.text.format.type, 'json_schema');
  assert.ok(post.input.includes('validatePayment'));
  return Response.json({ output: [{ content: [{ type: 'output_text', text: '{"answer":"Payment validation is in validatePayment. [S1]","citations":["S1","S9"]}' }] }] });
} });
assert.deepEqual(reply.citations, ['S1']);
assert.equal(reply.provider, 'OpenAI');

const html = '<title>WalkThrough</title>';
const assets = { '/index.html': { data: btoa(html), type: 'text/html', etag: '"test"', length: html.length } };
const worker = createWorker(assets);
assert.equal(await (await worker.fetch(new Request('https://walk.invalid/'), {})).text(), html);
assert.equal((await worker.fetch(new Request('https://walk.invalid/api/palace/ask'), {})).status, 401);
const headers = { 'oai-authenticated-user-id': 'owner', 'x-palace-demo': 'trace', origin: 'https://walk.invalid' };
const request = new Request('https://walk.invalid/api/palace/ask', { method: 'POST', headers, body: JSON.stringify(input) });
assert.equal((await worker.fetch(request, {})).status, 503);
assert.equal((await worker.fetch(new Request('https://walk.invalid/api/palace/ask', {
  method: 'POST', headers: { ...headers, origin: 'https://outside.invalid' },
}), { OPENAI_API_KEY: 'mock' })).status, 405);
console.log('Repository excerpts, attachments, key redaction, OpenAI request and citations, and hosted route guards passed.');
