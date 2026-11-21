import { useAuthSource } from './demo-source.mjs';
import { credentials } from '../dist/runtime.js';
import { tiny, floors } from '../dist/data.js';
import { fixed } from '../dist/shop/faults.js';

const login = (shop) => shop.login(credentials.email, credentials.password, () => {}, { slow: true, animated: false });
const test = (shop) => shop.test(() => {}, { animated: false });
const stages = await Promise.all([
  useAuthSource(null, null, login),
  useAuthSource('case', null, test),
  useAuthSource('case', fixed, test),
]);
if (stages.map((stage) => stage.status).join(',') !== '200,401,200') throw new Error('The backup needs a passing login, a failed test, and a passing repair.');
console.log(JSON.stringify({ stages, rooms: tiny.rooms, floors }));
