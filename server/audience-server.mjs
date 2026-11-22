import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const colors = ['#eaf461', '#60ddbd', '#eaa68f', '#bba6ff', '#87c4ff', '#ff9cae'];
const assets = {
  '/join': ['audience.html', 'text/html; charset=utf-8'],
  '/js/audience/guest-page.js': ['js/audience/guest-page.js', 'text/javascript; charset=utf-8'],
  '/js/theme.js': ['js/theme.js', 'text/javascript; charset=utf-8'],
  '/styles/audience.css': ['styles/audience.css', 'text/css; charset=utf-8'],
  '/styles/theme.css': ['styles/theme.css', 'text/css; charset=utf-8'],
  '/styles/brutalist.css': ['styles/brutalist.css', 'text/css; charset=utf-8'],
  '/assets/icons/walkthrough.svg': ['assets/icons/walkthrough.svg', 'image/svg+xml'],
};
const token = () => randomBytes(16).toString('base64url');
const clamp = (number, start, end) => Math.min(end, Math.max(start, number));

export async function startAudience({ port, bind, address }) {
  const guestKey = token();
  const hostKey = token();
  const people = new Map();
  const hosts = new Set();
  const browserHost = address || Object.values(networkInterfaces()).flat().find((x) => x.family === 'IPv4' && !x.internal)?.address || '127.0.0.1';
  const server = createServer((req, res) => {
    const page = new URL(req.url, 'http://localhost').pathname;
    const asset = assets[page];
    if (req.method !== 'GET' || !asset) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-store' });
    return createReadStream(fileURLToPath(new URL('../public/' + asset[0], import.meta.url))).pipe(res);
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1000 });
  const broadcast = () => {
    const packet = JSON.stringify({ people: [...people.values()] });
    for (const host of hosts) if (host.readyState === WebSocket.OPEN && host.bufferedAmount < 12_000) host.send(packet);
  };
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    const host = url.searchParams.get('key') === hostKey;
    if (url.pathname !== '/live' || !host && (people.size >= 120 || url.searchParams.get('key') !== guestKey)) {
      return socket.destroy();
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.on('error', () => {});
      if (host) {
        hosts.add(ws);
        ws.on('close', () => hosts.delete(ws));
        broadcast();
        return;
      }
      const id = randomUUID();
      const person = { id, floor: 1, x: .5, z: .85, color: colors[people.size % colors.length] };
      people.set(id, person);
      ws.send(JSON.stringify({ joined: true }));
      broadcast();
      let last = 0;
      ws.on('message', (raw) => {
        const now = Date.now();
        if (now - last < 60) return;
        last = now;
        try {
          const { x, z, floor } = JSON.parse(raw);
          if (![x, z, floor].every(Number.isFinite)) return;
          Object.assign(person, { x: clamp(x, 0, 1), z: clamp(z, 0, 1), floor: clamp(Math.round(floor), 0, 3) });
          broadcast();
        } catch { /* Ignore incomplete movement packets. */ }
      });
      ws.on('close', () => { people.delete(id); broadcast(); });
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, bind, resolve);
  });
  const chosen = server.address().port;
  const base = 'http://' + browserHost + ':' + chosen;
  return {
    join: base + '/join?session=' + guestKey,
    host: 'ws://127.0.0.1:' + chosen + '/live?key=' + hostKey,
    close: () => { for (const socket of wss.clients) socket.terminate(); wss.close(); server.close(); },
  };
}
