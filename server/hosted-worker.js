import { answerOpenAI, parseAsk } from './ask-service.js';

const answerPath = '/api/palace/ask';
const maxBody = 26_000;

function responseJSON(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function workerAsk(request, env) {
  if (!request.headers.get('oai-authenticated-user-id')) return responseJSON({ error: 'Sign in to ask about this repository.' }, 401);
  if (request.method !== 'POST' || request.headers.get('x-palace-demo') !== 'trace' ||
      request.headers.get('origin') !== new URL(request.url).origin) {
    return responseJSON({ error: 'Use Ask the building from the site.' }, 405);
  }
  if (!env.OPENAI_API_KEY) return responseJSON({ error: 'The site’s OpenAI secret hasn’t been configured.' }, 503);
  if (Number(request.headers.get('Content-Length')) > maxBody) return responseJSON({ error: 'Source context is too large.' }, 413);
  let input;
  try {
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let body = '';
    let length = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBody) {
        await reader.cancel();
        return responseJSON({ error: 'Source context is too large.' }, 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    input = parseAsk(JSON.parse(body + decoder.decode()));
  } catch {
    return responseJSON({ error: 'Enter a question with source context.' }, 400);
  }
  try {
    return responseJSON(await answerOpenAI(input, { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL || undefined }));
  } catch {
    return responseJSON({ error: 'OpenAI could not answer this question.' }, 502);
  }
}

function readRange(value, length) {
  const match = value.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || !match[1] && !match[2]) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(length - 1, Number(match[2])) : length - 1;
  return start <= end && start >= 0 ? { start, end } : null;
}

function serveAsset(request, asset) {
  if (!asset) return new Response('Not found', { status: 404 });
  if (!['HEAD', 'GET'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
  const headers = {
    'Content-Type': asset.type, 'Content-Length': String(asset.length), 'Cache-Control': 'private, no-cache',
    'ETag': asset.etag, 'X-Content-Type-Options': 'nosniff',
  };
  if (asset.type === 'video/mp4') headers['Accept-Ranges'] = 'bytes';
  const range = request.headers.get('Range');
  if (!range && request.headers.get('If-None-Match') === asset.etag) return new Response(null, { status: 304, headers });
  let status = 200;
  let first = 0;
  let last = asset.length - 1;
  if (range && asset.type === 'video/mp4') {
    const selection = readRange(range, asset.length);
    if (!selection) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + asset.length } });
    first = selection.start;
    last = selection.end;
    headers['Content-Range'] = 'bytes ' + first + '-' + last + '/' + asset.length;
    headers['Content-Length'] = String(last - first + 1);
    status = 206;
  }
  if (request.method === 'HEAD') return new Response(null, { status, headers });
  const raw = atob(asset.data);
  const bytes = new Uint8Array(last - first + 1);
  for (let i = first; i <= last; i++) bytes[i - first] = raw.charCodeAt(i);
  return new Response(bytes, { status, headers });
}

export function createWorker(assets) {
  return {
    async fetch(request, env) {
      const path = new URL(request.url).pathname;
      if (path === answerPath) return workerAsk(request, env);
      let file;
      try { file = path === '/' ? '/index.html' : decodeURIComponent(path); }
      catch { return new Response('Bad request', { status: 400 }); }
      return serveAsset(request, Object.hasOwn(assets, file) ? assets[file] : null);
    },
  };
}
