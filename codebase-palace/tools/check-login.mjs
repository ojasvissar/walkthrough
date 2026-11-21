import assert from 'node:assert/strict';
import { useAuthSource } from './demo-source.mjs';
import { fixed, patchFor } from '../dist/shop/faults.js';
import { credentials } from '../dist/runtime.js';

const runTest = (shop) => shop.test(() => {}, { animated: false });
const result = await useAuthSource(null, null, (shop) =>
  shop.login(credentials.email, credentials.password, () => {}, { slow: true, animated: false }));
assert.equal(result.status, 200);
assert.deepEqual(result.trace.events.map(({ room }) => room),
  ['login', 'routes', 'auth', 'users', 'auth', 'sessions', 'routes', 'login']);
assert.ok(result.trace.events.some(({ status, room, delay }) => room === 'users' && status === 'waiting' && delay === 2350));

for (const fault of ['case', 'space']) {
  const broken = await useAuthSource(fault, null, runTest);
  assert.equal(broken.status, 401);
  assert.equal(broken.trace.events.at(-1).room, 'auth');
  assert.equal(broken.trace.events.at(-1).status, 'failed');
  const repaired = await useAuthSource(fault, fixed, runTest);
  assert.equal(repaired.status, 200);
  assert.equal(repaired.trace.result, 'pass');
  assert.match(patchFor(fault), /^diff --git a\/dist\/auth\.js/m);
}
console.log('The real login traced successfully. Both isolated source faults failed and both patched tests passed.');
