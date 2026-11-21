import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixed, getFault } from '../dist/shop/faults.js';
import { proposeRepair } from './codex-repair.mjs';
import { codexExplain, codexMap } from './codex-map.mjs';
import { useAuthSource } from './demo-source.mjs';
import { openRepairPR, readPRTarget } from './github-pr.mjs';
import { askCodex } from './codex-runner.mjs';
import { answerOpenAI, answerSchema, codexAskPrompt, parseAsk, validateAnswer } from '../server/ask-service.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const env = process.env;
const port = Number(env.WALKTHROUGH_PORT || env.PALACE_PORT || 8765);
const codex = (env.WALKTHROUGH_CODEX || env.PALACE_CODEX) === '1';
const audience = env.WALKTHROUGH_AUDIENCE === '1';
const target = readPRTarget(env.WALKTHROUGH_PR_REPO, env.WALKTHROUGH_PR_BASE || 'demo-broken', env.WALKTHROUGH_PR_FILE);
const pending = new Set();
let lastFailure;
let proposal;
let verified;
let audienceSession;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png' };

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

async function requestBody(req, maxLength = 8192) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > maxLength) throw new Error('Request too large.');
  }
  return JSON.parse(text || '{}');
}

function presenter(req) {
  const expected = 'http://' + req.headers.host;
  return req.method === 'POST' && req.headers['x-palace-demo'] === 'trace' &&
    (!req.headers.origin || req.headers.origin === expected);
}

async function once(res, action, run, errorMessage) {
  if (pending.has(action)) return json(res, 409, { error: 'That action is already running.' });
  pending.add(action);
  try { return json(res, 200, await run()); }
  catch { return json(res, 502, { error: errorMessage }); }
  finally { pending.delete(action); }
}

async function runShop(res, operation, input) {
  const fault = input.fault || (input.broken === true ? 'case' : null);
  if (fault && !getFault(fault)) return json(res, 400, { error: 'Choose a Tiny Shop fault.' });
  const repairing = operation === 'test' && fault && input.repair === true;
  const repair = repairing && proposal?.fault === fault ? proposal : { replacement: fixed, diagnosis: 'Restored email normalization.' };
  const replacement = repairing ? repair.replacement : null;
  if (operation === 'test' && !repairing) {
    proposal = null;
    verified = null;
  }
  return useAuthSource(fault, replacement, async (shop) => {
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
    res.flushHeaders();
    const receive = (event, trace) => res.write(JSON.stringify({ event, trace: { id: trace.id, label: trace.label, result: trace.result } }) + '\n');
    const result = operation === 'test' ? await shop.test(receive) :
      await shop.login(String(input.email || ''), String(input.password || ''), receive, { slow: input.slow === true });
    if (operation === 'test' && fault && result.status === 401) lastFailure = { fault, trace: result.trace.events };
    if (repairing && result.status === 200) verified = { fault, proposal: repair };
    return res.end(JSON.stringify({ status: result.status, done: true, trace: { result: result.trace.result } }) + '\n');
  });
}

async function api(req, res, path) {
  if (path === 'runtime' && req.method === 'GET') return json(res, 200, { engine: 'node', codex, audience, pr: target });
  if (!presenter(req)) return json(res, 405, { error: 'Use the presenter session.' });
  const input = await requestBody(req, path === 'ask' ? 26_000 : undefined);
  switch (path) {
    case 'ask': {
      let request;
      try { request = parseAsk(input); }
      catch (error) { return json(res, 400, { error: error.message }); }
      if (!env.OPENAI_API_KEY && !codex) return json(res, 503, { error: 'There is no answer provider in this local session.' });
      return once(res, 'ask', async () => {
        if (env.OPENAI_API_KEY) {
          try { return await answerOpenAI(request, { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL || undefined }); }
          catch (error) { if (!codex) throw error; }
        }
        const value = await askCodex(codexAskPrompt(request), answerSchema, { timeout: 43_000 });
        return validateAnswer(value, request, 'Codex');
      }, 'The AI answer could not be completed.');
    }
    case 'login':
    case 'test':
      return runShop(res, path, input);
    case 'repair': {
      if (!codex) break;
      const fault = input.fault || 'case';
      if (!getFault(fault)) return json(res, 400, { error: 'Choose a Tiny Shop fault.' });
      return once(res, 'repair', async () => {
        const trace = lastFailure?.fault === fault ? lastFailure.trace : [];
        proposal = { ...await proposeRepair(fault, trace), fault };
        return proposal;
      }, 'Codex did not return a verified proposal. The demo patch is available as a fallback.');
    }
    case 'map':
      if (!codex) break;
      if (typeof input.url !== 'string' || input.url.length > 240) return json(res, 400, { error: 'Enter a public GitHub repository URL.' });
      return once(res, 'map', () => codexMap({ url: input.url }), 'Codex could not map this repository. Try the browser scan.');
    case 'explain':
      if (!codex) break;
      return once(res, 'explain', async () => ({ explanation: await codexExplain(input) }), 'Codex could not explain this room.');
    case 'pr':
      if (!target) break;
      if (!verified) return json(res, 409, { error: 'Run the repair and pass the regression test before opening a pull request.' });
      if (verified.url) return json(res, 200, { url: verified.url });
      return once(res, 'pr', async () => {
        const fix = verified;
        fix.url = await openRepairPR(target, fix.fault, fix.proposal);
        return { url: fix.url };
      }, 'GitHub did not open a pull request. Check authentication, write access, and the configured faulty base branch.');
    case 'audience':
      if (!audience) break;
      return once(res, 'audience', async () => {
        if (!audienceSession) {
          const { startAudience } = await import('./audience.mjs');
          audienceSession = await startAudience({
            port: Number(env.WALKTHROUGH_AUDIENCE_PORT || 8767),
            bind: env.WALKTHROUGH_AUDIENCE_BIND || '0.0.0.0',
            address: env.WALKTHROUGH_AUDIENCE_ADDRESS,
          });
        }
        return { join: audienceSession.join, host: audienceSession.host };
      }, 'The audience server did not start. Check the port and the installed dependencies.');
  }
  return json(res, 404, { error: 'This capability is not enabled in the presenter runtime.' });
}

async function serveAsset(req, res, path) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  const file = resolve(root, '.' + decodeURIComponent(path === '/' ? '/index.html' : path));
  if (!file.startsWith(resolve(root) + sep)) { res.writeHead(404); return res.end(); }
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) { res.writeHead(404); return res.end(); }
  const type = mime[extname(file)] || 'text/plain; charset=utf-8';
  const headers = { 'Content-Type': type, 'Content-Length': info.size, 'Cache-Control': 'no-cache' };
  const range = type === 'video/mp4' && req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  let options;
  if (range) {
    const start = Number(range[1]);
    const end = Math.min(info.size - 1, Number(range[2] || info.size - 1));
    if (start > end) { res.writeHead(416, { 'Content-Range': 'bytes */' + info.size }); return res.end(); }
    options = { start, end };
    headers['Content-Length'] = end - start + 1;
    headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + info.size;
  }
  if (type === 'video/mp4') headers['Accept-Ranges'] = 'bytes';
  res.writeHead(options ? 206 : 200, headers);
  if (req.method === 'HEAD') return res.end();
  return createReadStream(file, options).pipe(res);
}

createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const run = path.startsWith('/api/palace/') ? api(req, res, path.slice('/api/palace/'.length)) : serveAsset(req, res, path);
  run.catch(() => {
    if (!res.headersSent) return json(res, 400, { error: 'WalkThrough could not process this request.' });
    res.end();
  });
}).listen(port, '127.0.0.1', () => console.log('WalkThrough at http://127.0.0.1:' + port));
