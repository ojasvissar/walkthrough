import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import { animateAvatar, createAvatar, waveAvatar } from '../dist/avatars.js';
import { corridorZ, doorway, floorGap, getRoom, movePoint, roomWalls, stairs } from '../dist/navigation.js';
import { exampleModel } from '../dist/data.js';
import { archway, rendererScale, roundedGeometry, studioExhibit } from '../dist/studio-world.js';
import { exhibits } from '../dist/exhibits.js';

const model = exampleModel('fastapi');
assert.deepEqual([...new Set(model.rooms.map(({ floor }) => floor))].sort(), [0, 1, 2, 3]);

const spaces = [-2.1, 2.1].map((center, index) => {
  const bounds = roomWalls(center, 4.2);
  return { ...bounds, center, floor: 1, id: 'room-' + index, colliders: [...bounds.walls, [center - .5, center + .5, -.7, .6]] };
});
let player = { x: spaces[0].center, y: floorGap, z: corridorZ, floor: 1, stair: null };
const walk = (x, z) => {
  const start = player;
  const length = Math.hypot(x - start.x, z - start.z);
  const steps = Math.max(1, Math.ceil(length / .064));
  for (let i = 1; i <= steps; i++) {
    const next = movePoint(player, start.x + (x - start.x) * i / steps, start.z + (z - start.z) * i / steps, spaces, 4);
    assert.ok(next, 'Expected a path to ' + x + ', ' + z + ' from ' + JSON.stringify(player));
    player = next;
  }
};
assert.equal(getRoom(player, spaces), undefined);
walk(player.x, doorway.z + .32);
assert.equal(getRoom(player, spaces, true).id, 'room-0');
assert.equal(movePoint(player, -.34, doorway.z, spaces, 4), null);
walk(player.x, doorway.z - .53);
assert.equal(getRoom(player, spaces).id, 'room-0');
assert.equal(movePoint(player, player.x, .67, spaces, 4), null);
assert.equal(movePoint(player, 0, player.z, spaces, 4), null);
walk(player.x, corridorZ);

function flight(up, from) {
  const departure = up ? stairs.inner : stairs.outer;
  const arrival = up ? stairs.outer : stairs.inner;
  walk(departure, corridorZ);
  walk(departure, (stairs.front + stairs.turn) / 2);
  assert.equal(player.stair, from + (up ? 0 : -1));
  assert.equal(movePoint(player, (stairs.inner + stairs.outer) / 2, player.z, spaces, 4), null);
  walk(departure, stairs.turn - .48);
  assert.equal(player.y, floorGap * (from + (up ? .5 : -.5)));
  walk(arrival, player.z);
  walk(arrival, corridorZ);
  assert.equal(player.stair, null);
  assert.equal(player.floor, from + (up ? 1 : -1));
  assert.equal(player.y, player.floor * floorGap);
}
for (const from of [1, 2]) flight(true, from);
for (const from of [3, 2, 1]) flight(false, from);
flight(true, 0);
walk(stairs.outer, corridorZ);
flight(false, 1);
assert.equal(movePoint(player, stairs.outer, stairs.front - .04, spaces, 4), null);

const motion = { distance: .036, speed: 1.8, climbing: false, seconds: .02 };
for (const kind of ['man', 'woman', 'codex']) {
  const avatar = createAvatar(kind);
  const dimensions = new T.Box3().setFromObject(avatar.root).getSize(new T.Vector3());
  const robot = kind === 'codex';
  assert.ok(dimensions.y > (robot ? 1.42 : 1.62) && dimensions.y < (robot ? 1.60 : 1.84));
  let triangles = 0;
  avatar.root.traverse((part) => { if (part.isMesh) triangles += part.geometry.index.count / 3; });
  assert.ok(triangles > 300 && triangles <= 2500, kind + ' exceeds the upstream voxel preset budget');
  for (let frame = 0; frame < 32; frame++) animateAvatar(avatar, { ...motion, climbing: true, ground: () => .1 });
  assert.ok(avatar.legs.some(({ knee }) => knee.rotation.x > .1));
  assert.ok(avatar.arms.some(({ shoulder }) => Math.abs(shoulder.rotation.x) > .13));
  for (const { foot } of avatar.legs) assert.ok(Number.isFinite(foot.rotation.x));
  animateAvatar(avatar, { ...motion, reducedMotion: true, distance: 0, speed: 0 });
  assert.equal(avatar.gait, 0);
  waveAvatar(avatar);
  animateAvatar(avatar, { ...motion, distance: 0, speed: 0, seconds: .28 });
  assert.ok(avatar.arms[1].shoulder.rotation.z > .5);
  animateAvatar(avatar, { ...motion, distance: 0, speed: 0, seconds: .8 });
  assert.equal(avatar.wave, 0);
}
const coarse = createAvatar('man');
const fine = createAvatar('man');
for (let n = 0; n < 50; n++) {
  animateAvatar(coarse, motion);
  for (let step = 0; step < 2; step++) animateAvatar(fine, { ...motion, distance: motion.distance / 2, seconds: motion.seconds / 2 });
}
assert.ok(Math.abs(coarse.legs[0].knee.rotation.x - fine.legs[0].knee.rotation.x) < 1e-6);
console.log('Room and stair navigation, three voxel rigs, triangle budgets, and frame-rate independent animation passed.');

assert.equal(rendererScale(), 1);
assert.equal(rendererScale(1.5), 1.5);
assert.equal(rendererScale(3), 1.75);
const carved = roundedGeometry(4, 2, 3, .13);
const center = new T.Mesh(carved, new T.MeshLambertMaterial());
const fromAbove = new T.Raycaster(new T.Vector3(.4, 4, .5), new T.Vector3(0, -1, 0));
assert.equal(fromAbove.intersectObject(center)[0].point.y, 1, 'A rounded slab must keep its walkable top level');
fromAbove.ray.origin.set(1.99, 4, 1.49);
assert.ok(fromAbove.intersectObject(center).every((hit) => hit.point.y < .99), 'Corners should be beveled in geometry');
const entry = new T.Group();
const frame = archway(entry, '#d0b691', doorway.width, doorway.height, doorway.z);
entry.updateMatrixWorld();
const fromHall = new T.Raycaster(new T.Vector3(0, 1.84, 3), new T.Vector3(0, 0, -1));
assert.equal(fromHall.intersectObject(frame).length, 0, 'The arch must leave headroom');
fromHall.ray.origin.set(0, doorway.height + .05, 3);
assert.ok(fromHall.intersectObject(frame).length, 'The arch must have a visible lintel');
for (const key of Object.keys(exhibits)) {
  const prop = studioExhibit(key);
  assert.equal(studioExhibit(key).geometry, prop.geometry, 'Repeated props should reuse their mesh data');
  assert.ok(prop.geometry.getAttribute('color').count > 100, key + ' has no exhibit mesh');
}

globalThis.window = { matchMedia: () => ({ matches: false }) };
globalThis.document = { createElement: () => ({}) };
const { Palace } = await import('../dist/scene.js');
const palace = Object.assign(Object.create(Palace.prototype), {
  actor: new T.Group(),
  scene: new T.Scene(),
  target: new T.Vector3(),
  keys: new Set(),
  labelMount: { replaceChildren() {}, append() {} },
  shadowMaterial: new T.MeshBasicMaterial(),
  figure: { root: new T.Group(), body: new T.Group(), color: new T.MeshBasicMaterial() },
});

for (const example of ['tiny', 'fastapi', 'express', 'flask', 'vite']) {
  palace.load(exampleModel(example));
  for (const room of palace.roomSpaces) {
    let position = { x: room.center, y: room.floor * floorGap, z: corridorZ, floor: room.floor, stair: null };
    for (let z = corridorZ; z >= doorway.z - .26; z -= .04) {
      position = movePoint(position, room.center, z, palace.roomSpaces, 4);
      assert.ok(position, example + ' entrance obstructed at ' + room.id);
    }
    assert.equal(getRoom(position, palace.roomSpaces)?.id, room.id);
  }
}
palace.scene.updateMatrixWorld(true);
const treadMeshes = palace.flights[0].children.filter((child) => child.userData.ownedGeometry);
const run = (stairs.front - stairs.turn) / stairs.treads;
for (const [lane, x] of [[0, stairs.inner], [1, stairs.outer]]) {
  for (let tread = 1; tread < stairs.treads; tread++) {
    const z = stairs.front - tread * run;
    const position = movePoint({ floor: 0, stair: 0 }, x, z, palace.roomSpaces, 4);
    fromAbove.ray.origin.set(x, floorGap + 1, z);
    const hit = fromAbove.intersectObjects(treadMeshes)[0];
    assert.ok(hit && Math.abs(hit.point.y - position.y) < 1e-6, 'Rendered tread height must match lane ' + lane);
  }
}
console.log('Stylized exhibits, arch clearance, room entrances across all presets, and rendered tread heights passed.');
