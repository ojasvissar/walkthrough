import * as T from '../../vendor/three/three.module.min.js';
import { floors } from '../architecture/presets.js';
import { box, cylinder, oval, plant, rod } from './geometry.js';
import { createAvatar, animateAvatar, waveAvatar } from './avatars.js';
import { memoryStation } from '../demo/story.js';
import { archway, batchBlocks, rendererScale, rounded, slab, studioExhibit, wayfindingArrow } from './studio-world.js';
import { buildingWidth, corridorZ, doorway, floorGap, getRoom, movePoint, overlaps, roomWalls, stairs } from './navigation.js';

const hallY = 5.39;
const roomZoom = 2.05;
const initial = { yaw: .48, pitch: .46, zoom: 1 };
const limestone = '#e5d9c3';
const brass = '#ab8865';
const railing = '#445869';
const toVec = (x, y, z) => new T.Vector3(x, y, z);
const motionSetting = window.matchMedia('(prefers-reduced-motion: reduce)');

function lights(scene) {
  const ambient = new T.HemisphereLight('#fff1dd', '#7d97b3', 1.74);
  const sun = new T.DirectionalLight('#ffe4c3', 2.09);
  sun.position.set(-11, 21, 16);
  const fill = new T.DirectionalLight('#a6d3f9', .81);
  fill.position.set(10, 6, -9);
  scene.add(ambient, sun, fill);
  return { ambient, sun, fill };
}

function softShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, '#070b16a3');
  gradient.addColorStop(.58, '#090f2338');
  gradient.addColorStop(1, '#090f2300');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
}

function shadow(group, shadowMaterial, x, y, z, width, length) {
  const plane = new T.Mesh(new T.PlaneGeometry(width, length), shadowMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y, z);
  group.add(plane);
}

function floorBase(group, floor, index) {
  const accent = new T.Color(floor.color);
  const base = accent.clone().lerp(new T.Color('#263747'), .69).getStyle();
  const surface = new T.Color(floor.tint).lerp(new T.Color('#cfc5b6'), .54).getStyle();
  const landingWidth = stairs.right - stairs.left + .045;
  const landingZ = (stairs.front + 3.49) / 2;
  const landingDepth = 3.49 - stairs.front;
  const wingX = (stairs.left + stairs.right) / 2;

  if (index === 0) slab(group, { x: 1.73, z: .10, top: -.35, width: 18.82, depth: 7.63,
    height: .36, radius: .17, color: '#354959' });
  slab(group, { top: -.09, width: 14.83, depth: 7.04, height: .34, radius: .105, color: base });
  slab(group, { width: 14.84, depth: 7.05, height: .19, radius: .088, color: surface });
  slab(group, { x: wingX, z: landingZ, width: landingWidth, depth: landingDepth, height: .31, radius: .078, color: surface });
  rounded(group, floor.color, 1.73, -.22, 3.514, 18.30, .053, .062, .023);
  rounded(group, '#faf0d6', 1.73, -.123, 3.532, 18.28, .016, .035, .006);
  box(group, '#cbc1a7', 1.67, .002, corridorZ, 18.04, .008, .037);
  box(group, limestone, 1.67, .002, corridorZ - .10, 18.04, .008, .022);

  rod(group, railing, [-7.34, .72, -3.33], [-7.34, .72, 3.41], .043);
  for (const z of [-3.29, -1.05, 1.15, 3.40]) cylinder(group, '#61717b', -7.34, .35, z, .025, .70);
  rod(group, railing, [7.42, .74, 3.41], [stairs.right - .04, .74, 3.41], .042);
  rod(group, railing, [stairs.right - .04, .74, 3.41], [stairs.right - .04, .74, stairs.front], .042);
  for (const [x, z] of [[7.43, 3.41], [wingX, 3.41], [stairs.right - .04, 3.41], [stairs.right - .04, stairs.front]]) {
    cylinder(group, '#61717b', x, .37, z, .025, .74);
  }
  for (const [x, up] of [[stairs.inner, true], [stairs.outer, false]]) {
    if (up ? index === floors.length - 1 : index === 0) {
      const z = stairs.front + .025;
      rod(group, railing, [x - .72, .84, z], [x + .72, .84, z], .036);
      for (const side of [-1, 1]) cylinder(group, '#61717b', x + side * .70, .42, z, .027, .84);
    } else {
      wayfindingArrow(group, up ? '#426e60' : '#8b664c', x, up ? 2.38 : 2.89, up);
    }
  }
  batchBlocks(group);
}

function windowBay(group, width, floor, dim) {
  const paneWidth = Math.min(width - .57, 5.25);
  const frame = dim ? '#777085' : limestone;
  const light = new T.MeshBasicMaterial({ color: dim ? '#526077' : '#9ebcc5' });
  const glow = new T.MeshBasicMaterial({ color: dim ? '#62677a' : '#ecdbb6' });
  rounded(group, frame, 0, 1.51, -2.906, paneWidth, 1.18, .13, .061);
  rounded(group, light, 0, 1.53, -2.827, paneWidth - .16, 1.01, .044, .018);
  rounded(group, glow, 0, 1.17, -2.80, paneWidth - .19, .13, .016, .006);
  const divisions = paneWidth > 3.3 ? 3 : 2;
  for (let i = 1; i < divisions; i++) {
    box(group, frame, (i / divisions - .5) * (paneWidth - .15), 1.53, -2.79, .046, 1.03, .057);
  }
  rounded(group, frame, 0, .94, -2.82, paneWidth + .04, .085, .22, .032);
  if (!dim) rounded(group, floor.color, 0, .875, -2.821, paneWidth - .10, .024, .15, .010);
}

function addRoom(parent, room, slot, count, width, x, shadowMaterial) {
  const floor = floors[room.floor];
  const g = new T.Group();
  const dim = room.status === 'dust';
  const space = roomWalls(x, width);
  const wall = dim ? '#716b80' : new T.Color(floor.surface).lerp(new T.Color('#f1e7d5'), .29).getStyle();
  const trim = dim ? '#91849c' : limestone;
  g.position.x = x;
  g.userData.room = room.id;
  parent.add(g);
  const floorColor = dim ? '#858097' : new T.Color(floor.tint).lerp(new T.Color('#eee3cd'), .34).getStyle();
  slab(g, { top: .051, z: -.61, width: width - .11, depth: 4.85, height: .082, radius: .031, color: floorColor });
  rounded(g, trim, 0, .032, doorway.z, width - .12, .032, .088, .011);
  rounded(g, wall, 0, 1.185, -3.03, width - .067, 2.40, .23, .075);
  rounded(g, trim, 0, 2.385, -3.03, width - .033, .116, .275, .032);
  box(g, trim, 0, .135, -2.896, width - .16, .120, .061);
  windowBay(g, width, floor, dim);

  const partition = (side) => {
    const edgeX = side * (width / 2 - .046);
    rounded(g, wall, edgeX, .54, -.60, .118, 1.08, 4.81, .038);
    rounded(g, trim, edgeX, 1.087, -.60, .167, .059, 4.83, .023);
    box(g, trim, edgeX, .126, -.60, .144, .087, 4.78);
  };
  partition(-1);
  if (slot === count - 1) partition(1);

  const cheek = (width - space.opening) / 2;
  for (const side of [-1, 1]) {
    const cheekX = side * (space.opening / 2 + cheek / 2);
    rounded(g, wall, cheekX, .32, doorway.z, cheek, .64, .12, .037);
    rounded(g, trim, cheekX, .639, doorway.z, cheek, .060, .16, .022);
    box(g, trim, cheekX, .12, doorway.z, cheek, .09, .144);
  }
  archway(g, dim ? '#89809b' : floor.color, space.opening, doorway.height, doorway.z);
  rounded(g, dim ? '#ada0b5' : '#f5e8c5', 0, doorway.height + .096, doorway.z + .112,
    Math.min(.73, space.opening - .08), .063, .042, .017);
  const volume = Math.min(1.16, Math.max(.73, .68 + (room.loc || 130) / 475));
  const rugWidth = Math.min(width - .42, 2.95 * volume);
  const rug = dim ? '#736782' : new T.Color(floor.surface).lerp(new T.Color('#b7b4a7'), .27).getStyle();
  slab(g, { top: .077, z: .025, width: rugWidth, depth: 2.46, height: .036, radius: .018, color: trim });
  slab(g, { top: .092, z: .025, width: rugWidth - .11, depth: 2.35, height: .031, radius: .015, color: rug });
  shadow(g, shadowMaterial, .14, .102, -.15, Math.min(width - .21, 3.42), 2.08);
  const sculpture = studioExhibit(room.prop);
  sculpture.position.set(0, .093, -.12);
  sculpture.scale.setScalar(Math.min(volume, width / 2.88));
  g.add(sculpture);
  const stationBounds = [];
  const stations = room.functions.slice(0, 8);
  stations.forEach((name, index) => {
    const display = new T.Group();
    display.userData.memoryFunction = name;
    const stationWidth = (width - .40) / stations.length;
    display.position.set(-width / 2 + .20 + stationWidth * (index + .5), .12, -2.31);
    const stationCenter = x + display.position.x;
    const half = Math.min(.17, stationWidth * .32);
    stationBounds.push([stationCenter - half, stationCenter + half, -2.47, -2.17]);
    const plinth = Math.min(.175, stationWidth * .30);
    cylinder(display, '#657b7b', 0, .30, 0, plinth * .85, .54);
    cylinder(display, brass, 0, .070, 0, plinth, .073);
    cylinder(display, limestone, 0, .615, 0, plinth * 1.15, .093);
    rounded(display, '#dbe2b9', 0, .425, plinth * .81, plinth * .83, .061, .024, .009);
    const object = studioExhibit(memoryStation(name, room).prop);
    object.scale.setScalar(Math.min(.26, stationWidth / 2.9));
    object.position.y = .666;
    display.add(object);
    g.add(display);
  });
  g.updateWorldMatrix(true, true);
  const objectBounds = new T.Box3().setFromObject(sculpture);
  const colliders = [...space.walls, ...stationBounds];
  if (!objectBounds.isEmpty()) colliders.push([objectBounds.min.x, objectBounds.max.x, objectBounds.min.z, objectBounds.max.z]);
  if (width >= 3.6 && !dim) {
    const plantX = (slot === 0 ? -1 : 1) * (width / 2 - .42);
    plant(g, plantX, -2.29, '#578971', .88);
    colliders.push([x + plantX - .15, x + plantX + .15, -2.44, -2.14]);
    if ((room.loc || 0) > 130) {
      rounded(g, trim, width / 2 - .72, .34, -1.76, .36, .68, .49, .062);
      box(g, '#eae2b9', width / 2 - .72, .7, -1.76, .32, .046, .39);
      colliders.push([x + width / 2 - .90, x + width / 2 - .54, -2.01, -1.51]);
    }
    const support = slot === count - 1 ? -1 : 1;
    box(g, '#71817b', support * (width / 2 - .26), .27, 1.57, .058, .54, .062);
    box(g, '#eee2c7', support * (width / 2 - .26), .58, 1.57, .37, .14, .067);
  }
  const border = new T.Group();
  const selectionMat = new T.MeshBasicMaterial({ color: '#b9f064' });
  for (const z of [-2.92, 1.91]) box(border, selectionMat, 0, .114, z, width - .075, .065, .061);
  for (const side of [-1, 1]) box(border, selectionMat, side * (width / 2 - .06), .11, -.50, .061, .055, 4.8);
  border.visible = false;
  g.add(border);
  batchBlocks(g);
  return {
    group: g, border, selectionMat,
    id: room.id, floor: room.floor, center: x, ...space, colliders,
    labelAt: toVec(x, room.floor * floorGap + .14, 2.04),
    doorLabelAt: toVec(x, room.floor * floorGap + doorway.height + .24, doorway.z + .14),
    point: toVec(x, room.floor * floorGap + .055, doorway.z - .30),
  };
}

function stairsBetween(index) {
  const group = new T.Group();
  const bottom = index * floorGap;
  const rise = floorGap / (stairs.treads * 2);
  const run = (stairs.front - stairs.turn) / stairs.treads;
  const centerX = (stairs.left + stairs.right) / 2;
  const middle = bottom + floorGap / 2;
  slab(group, { x: centerX, top: middle, z: (stairs.back + stairs.turn) / 2, width: stairs.right - stairs.left - .04,
    depth: stairs.turn - stairs.back, height: .22, color: '#c1b8a8', radius: .066 });
  for (const [lane, x] of [[0, stairs.inner], [1, stairs.outer]]) {
    const yAt = (i) => bottom + (lane ? stairs.treads * 2 - i : i) * rise;
    for (let i = 0; i <= stairs.treads; i++) {
      const a = Math.max(0, i - .5);
      const b = Math.min(stairs.treads, i + .5);
      const z = stairs.front - (a + b) * run / 2;
      slab(group, { x, top: yAt(i), z, width: stairs.laneWidth, depth: (b - a) * run, height: .183,
        color: lane ? '#b6a99a' : '#d3c3ae', radius: .022 });
    }
    for (const side of [-1, 1]) {
      const railX = x + side * (stairs.laneWidth / 2 - .042);
      rod(group, brass, [railX, yAt(0) + .86, stairs.front], [railX, yAt(stairs.treads) + .86, stairs.turn], .036);
      rod(group, railing, [railX, yAt(0) - .16, stairs.front], [railX, yAt(stairs.treads) - .16, stairs.turn], .053);
      for (const i of [0, 3, 6, stairs.treads]) {
        cylinder(group, railing, railX, yAt(i) + .43, stairs.front - i * run, .023, .86);
      }
    }
  }
  const far = stairs.back + .08;
  for (const x of [stairs.left + .07, stairs.right - .07]) {
    rod(group, brass, [x, middle + .86, stairs.turn], [x, middle + .86, far], .036);
    cylinder(group, railing, x, middle + .43, far, .024, .86);
  }
  rod(group, brass, [stairs.left + .07, middle + .86, far], [stairs.right - .07, middle + .86, far], .036);
  cylinder(group, railing, centerX, middle + .43, far, .024, .86);
  return group;
}

function particleSystem(parent, position, type) {
  const group = new T.Group();
  group.position.copy(position);
  parent.add(group);
  const palette = type === 'dust'
    ? ['#b2a7af', '#d9c8ba', '#8d8193']
    : type === 'incident' ? ['#ec7a54', '#eea477', '#8a635e'] : ['#ffca60', '#f28b4c', '#dc6144'];
  const count = type === 'dust' ? 15 : 25;
  const sparks = [];
  for (let i = 0; i < count; i++) {
    const c = palette[i % palette.length];
    const mat = new T.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false });
    const particle = oval(group, mat, 0, 0, 0, 1, 1, 1);
    sparks.push({ particle, mat, offset: ((i * 37) % 31) / 31, radius: ((i * 11) % 17) / 17, angle: i * 2.4 });
  }
  return {
    group,
    step(time) {
      const dust = type === 'dust';
      const smoke = type === 'incident';
      for (const { particle, mat, offset, radius, angle } of sparks) {
        const part = (offset + time * (dust ? .19 : smoke ? .47 : .72)) % 1;
        const rg = (dust ? 1.35 : .62) * radius * (smoke ? 1 + part : 1);
        particle.position.set(Math.cos(angle) * rg + (smoke ? part * .4 : 0), .09 + part * (dust ? 1.35 : 2.55), Math.sin(angle) * rg);
        const scale = dust ? .012 + radius * .016 : (1 - part) * (smoke ? .16 : .104) + .019;
        particle.scale.set(scale * (smoke ? 1.4 : 1.0), scale * (dust || smoke ? 1 : 1.75), scale);
        mat.opacity = (1 - part) * (dust ? .56 : smoke ? .68 : .94);
      }
    },
  };
}

function requestFigure(parent) {
  const root = new T.Group();
  root.visible = false;
  parent.add(root);
  const color = new T.MeshBasicMaterial({ color: '#d9ff61' });
  const edge = new T.MeshBasicMaterial({ color: '#426f63' });
  const ring = new T.Mesh(new T.RingGeometry(.275, .309, 32), color);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .024;
  root.add(ring);
  const body = new T.Group();
  root.add(body);
  oval(body, edge, 0, .88, 0, .194, .191, .156);
  oval(body, color, 0, .88, .066, .15, .128, .112);
  rounded(body, color, 0, .55, 0, .34, .32, .24, .071);
  const limbs = [];
  for (const side of [-1, 1]) {
    oval(body, edge, side * .052, .895, .17, .023, .037, .017);
    const leg = new T.Group();
    leg.position.set(side * .09, .40, 0);
    oval(leg, color, 0, -.145, 0, .064, .17, .060);
    oval(leg, color, 0, -.326, .040, .072, .056, .083);
    body.add(leg);
    limbs.push(leg);
    rod(body, color, [side * .15, .64, 0], [side * .23, .42, .025], .055);
  }
  return { root, color, limbs, body };
}

function routeLine(group, points, color, opacity, dash = .17) {
  const mat = new T.LineDashedMaterial({ color, opacity, transparent: true, dashSize: dash, gapSize: .15, depthTest: false });
  const line = new T.Line(new T.BufferGeometry().setFromPoints(points), mat);
  line.computeLineDistances();
  line.renderOrder = 1;
  group.add(line);
  return line;
}

function corridor(from, to) {
  const points = [from, toVec(from.x, from.y, corridorZ)];
  const first = Math.round(from.y / floorGap);
  const last = Math.round(to.y / floorGap);
  const direction = Math.sign(last - first);
  for (let level = first; level !== last; level += direction) {
    const start = direction > 0 ? stairs.inner : stairs.outer;
    const end = direction > 0 ? stairs.outer : stairs.inner;
    const y = level * floorGap + .055;
    const nextY = y + direction * floorGap;
    const midY = (y + nextY) / 2;
    const bend = (stairs.turn + stairs.back) / 2;
    points.push(toVec(start, y, corridorZ), toVec(start, y, stairs.front),
      toVec(start, midY, stairs.turn), toVec(start, midY, bend),
      toVec(end, midY, bend), toVec(end, midY, stairs.turn),
      toVec(end, nextY, stairs.front), toVec(end, nextY, corridorZ));
  }
  points.push(toVec(to.x, to.y, corridorZ), to);
  return points;
}

let thumbRenderer;
const thumbs = new Map();

export function drawMnemonic(canvas, key) {
  try {
    if (!thumbs.has(key)) {
      thumbRenderer ||= new T.WebGLRenderer({ alpha: true, antialias: true });
      thumbRenderer.toneMapping = T.ACESFilmicToneMapping;
      thumbRenderer.setSize(196, 196);
      thumbRenderer.setClearColor(0, 0);
      const scene = new T.Scene();
      lights(scene);
      const camera = new T.OrthographicCamera(-1.62, 1.62, 1.62, -1.62, .1, 25);
      camera.position.set(3.9, 3.2, 7);
      camera.lookAt(0, .88, 0);
      slab(scene, { width: 2.31, depth: 2.20, height: .21, color: '#716b66', radius: .071 });
      slab(scene, { top: .02, width: 2.28, depth: 2.16, height: .073, color: '#d6c9ae', radius: .028 });
      scene.add(studioExhibit(key));
      thumbRenderer.render(scene, camera);
      const image = document.createElement('canvas');
      image.width = image.height = 196;
      const preview = image.getContext('2d');
      preview.drawImage(thumbRenderer.domElement, 0, 0, image.width, image.height);
      thumbs.set(key, image);
      scene.traverse((part) => { if (part.userData.ownedGeometry) part.geometry.dispose(); });
    }
    canvas.getContext('2d').drawImage(thumbs.get(key), 0, 0);
  } catch {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#77956c';
    ctx.fillRect(66, 77, 64, 64);
  }
}

export class Palace {
  constructor(mount, labelMount, onSelect, onLocation, onInteract) {
    this.mount = mount;
    this.labelMount = labelMount;
    this.onSelect = onSelect;
    this.onLocation = onLocation;
    this.onInteract = onInteract;
    this.scene = new T.Scene();
    this.lighting = lights(this.scene);
    this.shadowMaterial = softShadow();
    this.camera = new T.OrthographicCamera(-10, 10, 10, -10, .1, 150);
    this.walkCamera = new T.PerspectiveCamera(63, 1, .045, 85);
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0, 0);
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.setTheme(document.documentElement.dataset.theme);
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute('aria-label', '3D palace. Drag to orbit, or play with WASD and inspect rooms with E.');
    mount.append(this.renderer.domElement);
    this.figure = requestFigure(this.scene);
    this.target = toVec(.20, hallY, 0);
    this.players = Object.fromEntries(['codex', 'man', 'woman'].map((kind) => [kind, createAvatar(kind)]));
    this.actor = new T.Group();
    this.actor.add(...Object.values(this.players).map((player) => player.root));
    shadow(this.actor, this.shadowMaterial, 0, .012, 0, 1.0, .82);
    this.actor.visible = false;
    this.scene.add(this.actor);
    this.chooseAvatar('codex');
    this.audienceDots = new Map();
    this.audienceLayer = new T.Group();
    this.scene.add(this.audienceLayer);
    this.walkAim = toVec(0, 0, 0);
    this.state = { ...initial };
    this.mode = 'orbit';
    this.keys = new Set();
    this.raycaster = new T.Raycaster();
    this.projected = new T.Vector3();
    this.resize = new ResizeObserver(() => this.size());
    this.resize.observe(mount);
    this.bind();
    const frame = (time) => {
      this.render(time);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  setTheme(theme) {
    const dark = theme === 'dark';
    const { ambient, sun, fill } = this.lighting;
    ambient.intensity = dark ? 1.17 : 1.74;
    sun.intensity = dark ? 2.02 : 2.09;
    fill.intensity = dark ? .97 : .81;
    this.renderer.toneMappingExposure = dark ? .94 : 1.02;
  }

  load(model) {
    this.keys.clear();
    this.mode = 'orbit';
    this.actor.visible = false;
    if (this.building) {
      this.building.traverse((obj) => {
        if (obj.isInstancedMesh) obj.dispose();
        if (obj.isLine || obj.userData.ownedGeometry || obj.geometry?.type === 'PlaneGeometry') obj.geometry?.dispose();
        if (obj.isLine || obj.material?.isMeshBasicMaterial && obj.material !== this.shadowMaterial) obj.material.dispose();
      });
      this.scene.remove(this.building);
    }
    this.model = model;
    this.building = new T.Group();
    this.scene.add(this.building);
    this.rooms = new Map();
    this.particles = [];
    this.historyEffects = new Map();
    this.historyFrame = null;
    this.shot = null;
    this.edges = [];
    this.labels = new Map();
    this.labelMount.replaceChildren();
    shadow(this.building, this.shadowMaterial, 1.2, -.765, .55, 28, 15);
    this.stairs = new T.Group();
    this.building.add(this.stairs);
    this.flights = floors.slice(1).map((_, i) => stairsBetween(i));
    this.stairs.add(...this.flights);
    this.floors = floors.map((floor, index) => {
      const group = new T.Group();
      group.position.y = index * floorGap;
      this.building.add(group);
      floorBase(group, floor, index);
      const rooms = model.rooms.filter((r) => r.floor === index);
      const weights = rooms.map((room) => {
        const complexity = (room.loc ?? 110) + room.functions.length * 12 + room.dependencies.length * 9;
        return Math.min(1.25, Math.max(.79, Math.sqrt(complexity / 108)));
      });
      const total = weights.reduce((a, b) => a + b, 0);
      let roomStart = -buildingWidth / 2;
      rooms.forEach((room, i) => {
        const width = buildingWidth * weights[i] / total;
        const sceneRoom = addRoom(group, room, i, rooms.length, width, roomStart + width / 2, this.shadowMaterial);
        roomStart += width;
        this.rooms.set(room.id, sceneRoom);
        const label = document.createElement('button');
        label.className = 'room-label ' + room.status;
        label.textContent = room.name;
        label.title = room.path;
        label.onclick = () => this.onSelect(room.id);
        this.labelMount.append(label);
        this.labels.set(room.id, label);
        if (room.status === 'hot' || room.status === 'dust') {
          const effect = particleSystem(this.building, sceneRoom.point.clone().add(toVec(.60, .04, -2.10)), room.status);
          this.particles.push({ ...effect, id: room.id, status: room.status });
        }
      });
      return group;
    });
    for (const room of model.rooms) {
      for (const to of room.dependencies) {
        const target = this.rooms.get(to);
        if (!target) continue;
        const from = this.rooms.get(room.id);
        const cycle = room.status === 'cycle' && model.rooms.find((r) => r.id === to)?.status === 'cycle';
        const line = routeLine(this.building, corridor(from.point, target.point), cycle ? '#8659a2' : '#668c64', .62);
        line.visible = cycle;
        this.edges.push({ from: room.id, to, line, cycle });
      }
    }
    this.roomSpaces = [...this.rooms.values()];
    this.playerPosition = null;
    this.traceLayer = new T.Group();
    this.building.add(this.traceLayer);
    this.incident = null;
    this.reset();
    this.hideFigure();
  }

  size() {
    this.width = this.mount.clientWidth || 1;
    this.height = this.mount.clientHeight || 1;
    this.renderer.setPixelRatio(rendererScale(window.devicePixelRatio));
    this.renderer.setSize(this.width, this.height, false);
    this.walkCamera.aspect = this.width / this.height;
    this.walkCamera.updateProjectionMatrix();
  }

  select(id) {
    this.selected = id;
    for (const [room, view] of this.rooms) {
      view.border.visible = id === room;
      this.labels.get(room).classList.toggle('selected', id === room);
    }
    for (const { from, to, line, cycle } of this.edges) {
      line.visible = this.mode !== 'walk' && this.activeFloor == null && (cycle || from === id || to === id) &&
        this.rooms.get(from).group.visible && this.rooms.get(to).group.visible;
    }
  }

  focus(floor) {
    if (this.mode === 'walk') return;
    this.activeFloor = this.activeFloor === floor ? null : floor;
    this.target.y = this.activeFloor == null ? hallY : floor * floorGap + .7;
    this.state.zoom = this.activeFloor == null ? 1 : 1.95;
    this.stairs.visible = this.activeFloor == null;
    for (let i = 0; i < this.floors.length; i++) this.floors[i].visible = this.activeFloor == null || this.activeFloor === i;
    if (this.selected) this.select(this.selected);
  }

  reset() {
    if (this.mode === 'walk') {
      this.spawn(this.spawnFloor);
      return;
    }
    this.state = { ...initial };
    this.shot = null;
    this.activeFloor = null;
    this.target.set(.20, hallY, 0);
    if (this.stairs) this.stairs.visible = true;
    this.flights?.forEach((g) => { g.visible = true; });
    this.floors?.forEach((g) => { g.visible = true; });
    if (this.selected && this.rooms?.has(this.selected)) this.select(this.selected);
  }

  setMode(mode, floor = 1) {
    if (mode === this.mode) {
      if (mode === 'orbit') this.reset();
      return;
    }
    this.keys.clear();
    this.mode = mode;
    this.actor.visible = mode === 'walk';
    this.activeFloor = null;
    if (mode === 'walk') this.spawn(floor);
    else this.reset();
    if (this.selected && this.rooms?.has(this.selected)) this.select(this.selected);
  }

  spawn(floor) {
    this.spawnFloor = floor;
    this.playerVelocity = toVec(0, 0, 0);
    this.playerPosition = { x: 5.57, y: floor * floorGap, z: corridorZ + .10, floor, stair: null };
    this.walkYaw = Math.PI;
    this.walkPitch = .23;
    this.walkDistance = 3.04;
    this.actor.rotation.y = this.walkYaw;
    this.actor.position.set(this.playerPosition.x, this.playerPosition.y, this.playerPosition.z);
    this.playerLocation = '';
    this.stairs.visible = true;
    this.updateWalk(0);
  }

  chooseAvatar(kind) {
    if (!this.players[kind]) return;
    for (const [id, player] of Object.entries(this.players)) player.root.visible = id === kind;
    this.walkAvatar = this.players[kind];
  }

  interact() {
    if (this.mode !== 'walk' || !this.playerPosition) return;
    const room = getRoom(this.playerPosition, this.roomSpaces, true);
    if (!room) return;
    if (!motionSetting.matches) waveAvatar(this.walkAvatar);
    this.onInteract(room.id);
  }

  zoom(dir) {
    if (dir === 'reset') this.reset();
    else if (this.mode === 'walk') this.walkDistance = T.MathUtils.clamp(this.walkDistance + (dir === 'in' ? -.52 : .52), 1.90, 5.04);
    else this.state.zoom = T.MathUtils.clamp(this.state.zoom * (dir === 'in' ? 1.18 : .85), .61, 2.85);
  }

  tourFocus(id) {
    const room = this.rooms.get(id);
    if (!room || this.mode === 'walk') return;
    const target = room.point.clone().add(toVec(-.40, .98, -.56));
    const yaw = .30 + room.floor * .10;
    if (motionSetting.matches) {
      this.target.copy(target);
      this.state = { yaw, pitch: .34, zoom: roomZoom };
      return;
    }
    this.shot = { from: this.target.clone(), target, initial: { ...this.state }, yaw, start: performance.now() };
  }

  setTimeline(frame) {
    this.historyFrame = frame;
    for (const [id, room] of this.rooms) {
      room.group.visible = !frame || frame.rooms.includes(id);
      const label = this.labels.get(id);
      label.classList.toggle('history-change', Boolean(frame?.changed.includes(id)));
      if (frame?.hot.includes(id) && !this.historyEffects.has(id)) {
        const effect = particleSystem(this.building, room.point.clone().add(toVec(.6, .02, -2.10)), 'hot');
        this.historyEffects.set(id, { ...effect, id });
      }
    }
    if (this.selected) this.select(this.selected);
  }

  setAudience(people) {
    const active = new Set();
    for (const person of people) {
      active.add(person.id);
      let entry = this.audienceDots.get(person.id);
      if (!entry) {
        const mat = new T.MeshBasicMaterial({ color: person.color });
        const dot = oval(this.audienceLayer, mat, 0, 0, 0, .17, .17, .17);
        entry = { dot, target: new T.Vector3() };
        this.audienceDots.set(person.id, entry);
        entry.fresh = true;
      }
      entry.floor = person.floor;
      entry.target.set((person.x - .5) * 14.2, person.floor * floorGap + .26, person.z * 6.25 - 3.02);
      if (entry.fresh) entry.dot.position.copy(entry.target);
      entry.fresh = false;
    }
    for (const [id, { dot }] of this.audienceDots) {
      if (active.has(id)) continue;
      this.audienceLayer.remove(dot);
      dot.material.dispose();
      this.audienceDots.delete(id);
    }
  }

  revive(id) {
    this.clearFailure();
    const room = this.rooms.get(id);
    if (!room) return;
    this.figure.root.visible = true;
    this.figure.root.position.copy(room.point);
  }

  fail(id) {
    this.clearFailure();
    const room = this.rooms.get(id);
    if (!room) return;
    this.incident = particleSystem(this.building, room.point.clone().add(toVec(.35, 0, -1.92)), 'incident');
    room.selectionMat.color.set('#ff8e59');
    this.labels.get(id).classList.add('failed');
    this.failure = id;
    this.figure.color.color.set('#ff9a6d');
    this.figure.body.rotation.z = Math.PI / 2;
    this.figure.body.position.y = .17;
  }

  clearFailure() {
    if (this.incident) {
      this.incident.group.traverse((o) => o.isMesh && o.material.dispose());
      this.building.remove(this.incident.group);
      this.incident = null;
    }
    if (this.failure) {
      this.rooms.get(this.failure)?.selectionMat.color.set('#b9f064');
      this.labels.get(this.failure)?.classList.remove('failed');
    }
    this.failure = null;
    this.figure.color.color.set('#d9ff61');
    this.figure.body.rotation.z = 0;
    this.figure.body.position.y = 0;
  }

  trace(id, previous, milliseconds = 620) {
    const to = this.rooms.get(id)?.point;
    if (!to) return;
    const from = this.rooms.get(previous)?.point;
    const start = from || to.clone().add(toVec(0, 0, 1.53));
    const points = previous === id ? [to, to.clone()] : corridor(start, to);
    if (from && previous !== id) routeLine(this.traceLayer, points, '#a9d747', .92, .25);
    this.figure.root.visible = true;
    this.movement = { path: new T.CurvePath(), start: performance.now(), length: motionSetting.matches ? 1 : milliseconds };
    for (let i = 1; i < points.length; i++) this.movement.path.add(new T.LineCurve3(points[i - 1], points[i]));
  }

  hideFigure() {
    this.figure.root.visible = false;
    this.movement = null;
    this.clearFailure();
    if (this.traceLayer) {
      for (const child of this.traceLayer.children) {
        child.geometry.dispose();
        child.material.dispose();
      }
      this.traceLayer.clear();
    }
  }

  bind() {
    const canvas = this.renderer.domElement;
    let pointer;
    canvas.addEventListener('pointerdown', (e) => {
      canvas.focus({ preventScroll: true });
      this.shot = null;
      canvas.setPointerCapture(e.pointerId);
      pointer = { x: e.clientX, y: e.clientY, travel: 0 };
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!pointer) return;
      const dx = e.clientX - pointer.x;
      const dy = e.clientY - pointer.y;
      pointer = { x: e.clientX, y: e.clientY, travel: pointer.travel + Math.abs(dx) + Math.abs(dy) };
      if (this.mode === 'walk') {
        this.walkYaw -= dx * .005;
        this.walkPitch = T.MathUtils.clamp(this.walkPitch + dy * .005, -.05, .83);
      } else {
        this.state.yaw -= dx * .006;
        this.state.pitch = T.MathUtils.clamp(this.state.pitch + dy * .004, .12, 1.36);
      }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (pointer && pointer.travel < 8) this.pick(e);
      pointer = null;
    });
    canvas.addEventListener('pointercancel', () => { pointer = null; });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom(e.deltaY < 0 ? 'in' : 'out');
    }, { passive: false });
    canvas.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (this.mode === 'walk' && key === 'e' && !e.repeat) {
        e.preventDefault();
        this.interact();
        return;
      }
      if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) return;
      if (key === 'shift' && this.mode !== 'walk') return;
      e.preventDefault();
      if (this.mode === 'walk') this.keys.add(key);
      else {
        if (key === 'arrowleft' || key === 'a') this.state.yaw += .13;
        if (key === 'arrowright' || key === 'd') this.state.yaw -= .13;
        if (key === 'arrowup' || key === 'w') this.state.pitch = Math.min(1.36, this.state.pitch + .08);
        if (key === 'arrowdown' || key === 's') this.state.pitch = Math.max(.12, this.state.pitch - .08);
      }
    });
    canvas.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('blur', () => this.keys.clear());
  }

  pick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const xy = new T.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(xy, this.mode === 'walk' ? this.walkCamera : this.camera);
    const candidates = [...this.rooms.values()].filter((room) => room.group.visible && room.group.parent.visible).map((room) => room.group);
    const hit = this.raycaster.intersectObjects(candidates, true)[0];
    if (!hit) return;
    let object = hit.object;
    let fn;
    while (object && object.userData.room == null) {
      fn ||= object.userData.memoryFunction;
      object = object.parent;
    }
    if (object && fn) this.onInteract(object.userData.room, fn);
    else if (object) this.onSelect(object.userData.room);
  }

  updateWalk(dt) {
    const old = this.playerPosition;
    if (!old) return;
    const forward = toVec(Math.sin(this.walkYaw), 0, Math.cos(this.walkYaw));
    const right = toVec(-forward.z, 0, forward.x);
    const axis = (plus, minus) => Number(plus.some((key) => this.keys.has(key))) - Number(minus.some((key) => this.keys.has(key)));
    const longitudinal = axis(['w', 'arrowup'], ['s', 'arrowdown']);
    const lateral = axis(['d', 'arrowright'], ['a', 'arrowleft']);
    const requested = forward.clone().multiplyScalar(longitudinal).addScaledVector(right, lateral).normalize();
    const sprint = this.keys.has('shift');
    const topSpeed = old.stair != null ? 1.74 : sprint ? 3.35 : 2.0;
    const velocity = this.playerVelocity;
    const response = requested.lengthSq() ? 18 : 22;
    velocity.lerp(requested.multiplyScalar(topSpeed), 1 - Math.exp(-dt * response));
    if (velocity.lengthSq() < .00012) velocity.set(0, 0, 0);
    let place = old;
    if (velocity.lengthSq()) {
      const horizontal = movePoint(place, place.x + velocity.x * dt, place.z, this.roomSpaces, floors.length);
      if (horizontal) place = horizontal;
      else velocity.x = 0;
      const depth = movePoint(place, place.x, place.z + velocity.z * dt, this.roomSpaces, floors.length);
      if (depth) place = depth;
      else velocity.z = 0;
    }
    this.playerPosition = place;
    const dx = place.x - old.x, dz = place.z - old.z;
    const distance = Math.hypot(dx, dz);
    const blend = dt ? 1 - Math.exp(-dt * 21) : 1;
    this.actor.position.set(place.x, T.MathUtils.lerp(this.actor.position.y, place.y, blend), place.z);
    if (distance > .00025) {
      const targetYaw = Math.atan2(dx, dz);
      const yaw = this.actor.rotation.y;
      const turn = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw));
      this.actor.rotation.y += turn * (1 - Math.exp(-dt * 21));
    }
    const climbing = place.stair != null;
    const ground = climbing ? (x, z) => {
      const turn = this.actor.rotation.y;
      const dx = x * Math.cos(turn) + z * Math.sin(turn);
      const dz = z * Math.cos(turn) - x * Math.sin(turn);
      const step = movePoint(place, place.x + dx, place.z + dz, this.roomSpaces, floors.length);
      return step ? T.MathUtils.clamp((step.y - this.actor.position.y) / this.walkAvatar.root.scale.y, -.15, .19) : 0;
    } : undefined;
    animateAvatar(this.walkAvatar, {
      distance, speed: dt ? distance / dt : 0, climbing, seconds: dt, ground, reducedMotion: motionSetting.matches,
    });
    const inside = getRoom(place, this.roomSpaces);
    const nearby = getRoom(place, this.roomSpaces, true);
    const change = [place.floor, place.stair, inside?.id, nearby?.id].join('|');
    if (this.playerLocation !== change) {
      this.playerLocation = change;
      const highest = place.stair == null ? place.floor : place.stair + 1;
      this.floors.forEach((group, i) => { group.visible = i <= highest; });
      this.flights.forEach((group, i) => { group.visible = i <= highest; });
      this.onLocation({
        floor: place.floor, stair: place.stair, inside: inside?.id, nearby: nearby?.id,
      });
    }
    this.updateWalkCamera(forward, dt);
  }

  updateWalkCamera(forward, dt) {
    const place = this.playerPosition;
    const shoulder = this.actor.position.clone().add(toVec(0, this.walkAvatar.cameraHeight ?? 1.18, 0));
    const aim = shoulder.clone().addScaledVector(forward, .48);
    const boom = forward.clone().multiplyScalar(-Math.cos(this.walkPitch) * this.walkDistance);
    boom.y = .44 + Math.sin(this.walkPitch) * this.walkDistance;
    const rooms = this.roomSpaces.filter((room) => room.floor === place.floor);
    const y = place.floor * floorGap;
    let available = 1;
    if (place.stair == null) {
      for (let i = 3; i <= 12; i++) {
        const ratio = i / 12;
        const sample = shoulder.clone().addScaledVector(boom, ratio);
        if (sample.y > y + 2.40) continue;
        const back = sample.z < -2.90 && sample.z > -3.25 &&
          rooms.some((room) => sample.x > room.left && sample.x < room.right);
        const fixture = rooms.some((room) => room.colliders.slice(4).some((bounds) => overlaps(sample.x, sample.z, bounds, .12)));
        if (back || fixture) {
          available = Math.max(.33, (i - 1) / 12);
          break;
        }
      }
    }
    const desired = shoulder.addScaledVector(boom, available);
    const smooth = !dt || motionSetting.matches ? 1 : 1 - Math.exp(-dt * 13);
    this.walkCamera.position.lerp(desired, smooth);
    this.walkAim.lerp(aim, smooth);
    this.walkCamera.lookAt(this.walkAim);
  }

  render(time) {
    if (!this.building || !this.width) return;
    const delta = Math.min(.04, (time - (this.lastTime || time)) / 1000);
    if (this.mode !== 'walk' && this.lastTime && time - this.lastTime < 1000 / 42 - 3) return;
    this.lastTime = time;
    if (this.shot) {
      const shot = this.shot;
      const t = Math.min(1, (time - shot.start) / 1450);
      const pace = 1 - (1 - Math.max(0, t)) ** 3;
      this.target.lerpVectors(shot.from, shot.target, pace);
      this.state = { yaw: T.MathUtils.lerp(shot.initial.yaw, shot.yaw, pace),
        pitch: T.MathUtils.lerp(shot.initial.pitch, .37, pace), zoom: T.MathUtils.lerp(shot.initial.zoom, roomZoom, pace) };
      if (t >= 1) this.shot = null;
    }
    const aspect = this.width / this.height;
    const { yaw, pitch, zoom } = this.state;
    const half = Math.max(9.85, 10.8 / aspect) / zoom;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.position.copy(this.target).add(toVec(29 * Math.cos(pitch) * Math.sin(yaw), 29 * Math.sin(pitch), 29 * Math.cos(pitch) * Math.cos(yaw)));
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
    const camera = this.mode === 'walk' ? this.walkCamera : this.camera;
    if (this.mode === 'walk') this.updateWalk(delta);
    if (this.movement) {
      const { path, start, length } = this.movement;
      const t = Math.min(1, Math.max(0, (time - start) / length));
      this.figure.root.position.copy(path.getPointAt(t) || this.figure.root.position);
      this.figure.limbs.forEach((limb, i) => { limb.rotation.x = t < 1 ? Math.sin(time * .025 + i * Math.PI) * .6 : 0; });
      const direction = path.getTangentAt(t);
      if (direction.lengthSq() > .01) this.figure.root.rotation.y = Math.atan2(direction.x, direction.z);
      if (t === 1) this.movement = null;
    }
    const visibleFloor = (level) => this.mode === 'walk' ? this.floors[level]?.visible : this.activeFloor == null || level === this.activeFloor;
    const frame = this.historyFrame;
    for (const p of [...this.particles, ...this.historyEffects.values(), this.incident].filter(Boolean)) {
      const level = Math.round(p.group.position.y / floorGap);
      const historical = !frame || p.status === 'dust' && frame.rooms.includes(p.id) || !p.status && frame.hot.includes(p.id);
      const extra = p.status || p === this.incident || frame;
      p.group.visible = Boolean(extra && historical && visibleFloor(level));
      if (p.group.visible) p.step(motionSetting.matches ? .75 : time / 1000);
    }
    for (const { dot, target, floor } of this.audienceDots.values()) {
      dot.visible = visibleFloor(floor);
      dot.position.lerp(target, Math.min(1, delta * 12));
    }
    this.renderer.render(this.scene, camera);
    this.positionLabels(camera);
  }

  positionLabels(camera) {
    const visible = [];
    const reserved = [];
    const ordered = [...this.rooms.keys()].sort((a, b) => Number(b === this.selected) - Number(a === this.selected));
    for (const id of ordered) {
      const room = this.rooms.get(id);
      const label = this.labels.get(id);
      const walking = this.mode === 'walk';
      const visibleDoor = walking && this.playerPosition?.floor === room.floor &&
        Math.abs(this.playerPosition.x - room.center) < 5.2;
      this.projected.copy(walking ? room.doorLabelAt : room.labelAt).project(camera);
      const x = (this.projected.x * .5 + .5) * this.width;
      const y = (.5 - this.projected.y * .5) * this.height;
      const w = 19 + label.textContent.length * (this.width < 550 ? 5.5 : 6.7);
      const overlaps = reserved.some((r) => Math.abs(r.x - x) < (r.w + w) / 2 && Math.abs(r.y - y) < 21);
      const outside = x - w / 2 < 11 || x + w / 2 > this.width - 11 || y < 56 || y > this.height - 41;
      const floorCollision = this.width > 710 && x - w / 2 < 130 && Math.abs(y - this.height / 2) < 77;
      if (room.group.visible && room.group.parent.visible && (!walking || visibleDoor) && Math.abs(this.projected.z) <= 1 &&
        !outside && !floorCollision && !overlaps) {
        reserved.push({ x, y, w });
        label.style.left = x + 'px';
        label.style.top = y + 'px';
        visible.push(id);
      }
    }
    for (const [id, label] of this.labels) label.hidden = !visible.includes(id);
  }
}
