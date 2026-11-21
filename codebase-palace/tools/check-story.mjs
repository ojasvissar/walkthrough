import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { tiny } from '../dist/data.js';
import { exhibits } from '../dist/exhibits.js';
import { demoHistory, memoryStation, tourStops } from '../dist/story.js';
import { importModel, timelineFromCommits } from '../dist/repository.js';
import { addItem, requestCheckout } from '../dist/shop/cart.js';

const ids = new Set(tiny.rooms.map(({ id }) => id));
for (const room of tiny.rooms) {
  assert.ok((await stat(new URL('../' + room.path, import.meta.url))).isFile());
  for (const fn of room.functions) assert.ok(Object.hasOwn(exhibits, memoryStation(fn, room).prop));
  assert.ok(room.dependencies.every((id) => ids.has(id)));
}
assert.deepEqual(new Set(demoHistory.at(-1).rooms), ids);
assert.ok(tourStops(tiny).every(({ id, note }) => ids.has(id) && note.length));

const frame = (sha, status, filename) => ({ sha, commit: { message: sha }, files: [{ status, filename }] });
const commits = timelineFromCommits([
  frame('first', 'modified', 'api.ts'),
  frame('add', 'added', 'db.py'),
  frame('hot', 'modified', 'db.py'),
], new Map([['api.ts', 'api'], ['db.py', 'db']]), ['api', 'db']);
assert.deepEqual(commits[0].rooms, ['api']);
assert.deepEqual(commits[1].rooms, ['api', 'db']);
assert.deepEqual(commits[2].hot, ['db']);
assert.equal(importModel({ ...tiny, history: demoHistory }).history.length, demoHistory.length);
const imported = importModel({ name: 'Room exhibits', rooms: [
  { id: 'checkout', name: 'Checkout API', prop: 'duck', cue: 'Old exhibit', floor: 2 },
  { id: 'response', name: 'Response', prop: 'duck', floor: 2 },
  { id: 'login', name: 'Login Screen', floor: 3 },
  { id: 'payment', name: 'Core', path: 'src/payment_service.ts', floor: 1 },
  { id: 'cycle', name: 'Routes', status: 'cycle', floor: 2 },
  { id: 'custom', name: 'Core', prop: 'control', cue: 'Custom cue', floor: 1 },
] });
assert.deepEqual(imported.rooms.map((room) => room.prop), ['checkout', 'response', 'terminal', 'payments', 'stairs', 'control']);
assert.equal(imported.rooms[0].cue, 'Checkout counter');
assert.equal(imported.rooms.at(-1).cue, 'Custom cue');
assert.equal(memoryStation('validatePayment()', tiny.rooms.find(({ id }) => id === 'payments')).prop, 'payments');
const schema = JSON.parse(await readFile(new URL('architecture-schema.json', import.meta.url), 'utf8'));
assert.deepEqual(new Set(schema.properties.rooms.items.properties.prop.enum), new Set(Object.keys(exhibits)));
assert.equal(requestCheckout(addItem([], 'mug')).payment.total, 1400);
assert.throws(() => requestCheckout([]));

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
assert.match(html, /<title>WalkThrough/);
assert.ok(['start-tour', 'git-history', 'audience', 'show-backup'].every((id) => html.includes('id="' + id + '"')));
console.log('All demo source links, tour stops, function mnemonics, commit replay, and demo checkout passed.');
