import * as T from './vendor/three.module.min.js';
import { box } from './geometry.js';

const humanColors = {
  man: {
    skin: '#bd8059', shade: '#a96548', hair: '#302936', highlight: '#57414b', lip: '#824933',
    coat: '#277d79', trim: '#53ad9c', seam: '#174e54', shirt: '#e7c78e', pants: '#344260',
    boot: '#313548', sole: '#c9c5ac', bag: '#ab7348', pocket: '#d9a16c',
  },
  woman: {
    skin: '#dfa883', shade: '#b8745f', hair: '#24243d', highlight: '#464465', lip: '#9b544f',
    coat: '#8668c1', trim: '#ad90e0', seam: '#594781', shirt: '#f3d6a8', pants: '#33545c',
    boot: '#343447', sole: '#c8c0bd', bag: '#b87953', pocket: '#e3a478',
  },
};

function pivot(parent, x, y, z = 0) {
  const group = new T.Group();
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

function humanHead(body, colors, woman) {
  const head = pivot(body, 0, 1.61);
  box(head, colors.shade, 0, -.165, .005, .102, .11, .10);
  box(head, colors.skin, 0, 0, .015, .258, .26, .218);
  box(head, colors.shade, 0, -.111, -.035, .237, .046, .185);
  box(head, colors.hair, 0, .12, -.01, .29, .075, .25);
  box(head, colors.highlight, -.038, .157, -.019, .184, .018, .194);
  box(head, colors.hair, 0, .025, -.109, .274, woman ? .23 : .12, .075);
  box(head, colors.hair, -.085, .071, .111, .125, .072, .043);
  box(head, colors.highlight, -.108, .103, .132, .082, .016, .012);
  for (const side of [-1, 1]) {
    box(head, colors.shade, side * .133, -.014, .006, .030, .064, .061);
    box(head, colors.hair, side * .125, .042, -.045, .043, .10, .111);
    box(head, '#eee1d1', side * .058, .013, .126, .050, .026, .010);
    box(head, '#302c43', side * .054, .013, .133, .018, .027, .010);
    box(head, colors.hair, side * .058, .041, .128, .045, .012, .011);
  }
  box(head, colors.shade, 0, -.031, .132, .037, .051, .038);
  box(head, colors.lip, .008, -.075, .128, .061, .014, .012);
  if (woman) {
    for (const side of [-1, 1]) {
      box(head, colors.hair, side * .129, -.051, -.065, .054, .23, .10);
      box(head, colors.highlight, side * .154, -.009, -.057, .009, .121, .064);
      box(head, '#efb969', side * .15, -.082, .039, .013, .033, .02);
    }
    box(head, colors.hair, .052, -.123, -.129, .119, .172, .083);
  } else {
    box(head, colors.hair, -.102, .157, -.021, .068, .04, .169);
    box(head, colors.highlight, -.062, .175, -.014, .088, .012, .132);
  }
}

function humanTorso(body, colors) {
  box(body, colors.pants, 0, .888, 0, .307, .15, .190);
  box(body, colors.seam, 0, .978, 0, .337, .085, .206);
  box(body, colors.coat, 0, 1.172, 0, .346, .365, .215);
  box(body, colors.trim, 0, 1.319, -.01, .374, .103, .228);
  box(body, colors.shirt, 0, 1.214, .111, .083, .265, .027);
  box(body, colors.seam, 0, 1.113, .132, .015, .162, .007);
  for (const side of [-1, 1]) {
    box(body, colors.trim, side * .067, 1.312, .133, .032, .138, .014);
    box(body, colors.seam, side * .106, 1.118, .114, .080, .073, .018);
    box(body, colors.trim, side * .106, 1.153, .129, .079, .014, .013);
    box(body, colors.bag, side * .12, 1.266, .132, .034, .243, .009);
    box(body, '#e4ba74', side * .12, 1.256, .141, .030, .027, .013);
  }
  box(body, colors.bag, 0, 1.185, -.164, .251, .306, .123);
  box(body, colors.pocket, 0, 1.171, -.236, .192, .162, .034);
  box(body, '#efd098', 0, 1.222, -.258, .146, .016, .009);
  box(body, colors.seam, 0, 1.352, -.180, .116, .043, .056);
}

function robotHead(body) {
  const head = pivot(body, 0, 1.245);
  box(head, '#354eb7', 0, -.257, -.008, .214, .118, .17);
  box(head, '#4563d4', 0, -.015, 0, .624, .385, .404);
  box(head, '#6b8df5', 0, .134, -.002, .510, .163, .368);
  box(head, '#88a6ff', -.061, .217, -.025, .306, .086, .292);
  box(head, '#a4bdff', -.073, .257, -.043, .218, .021, .218);
  for (const side of [-1, 1]) {
    box(head, '#597de3', side * .295, .038, -.026, .111, .249, .298);
    box(head, '#7ca1fa', side * .270, .154, -.004, .125, .089, .277);
    box(head, '#779af5', side * .23, -.08, .205, .111, .241, .047);
  }
  box(head, '#99afff', 0, -.015, .218, .454, .269, .046);
  box(head, '#243350', 0, -.01, .245, .404, .204, .030);
  box(head, '#172640', 0, .012, .264, .361, .144, .010);
  const glyph = ['1000000', '0100000', '0010000', '0100000', '1000111'];
  glyph.forEach((row, y) => [...row].forEach((bit, x) => {
    if (bit === '1') box(head, '#93effa', -.123 + x * .037, .065 - y * .032, .277, .032, .030, .012);
  }));
  box(head, '#799cff', 0, .002, -.217, .337, .252, .029);
  for (const x of [-.105, 0, .105]) box(head, '#3c59b4', x, -.023, -.235, .038, .119, .017);
}

function robotTorso(body) {
  box(body, '#3353ba', 0, .526, 0, .292, .131, .192);
  box(body, '#4568dc', 0, .733, 0, .368, .322, .253);
  box(body, '#739afa', 0, .854, -.012, .416, .112, .244);
  box(body, '#a5bcff', 0, .756, .129, .203, .116, .029);
  box(body, '#4d70da', 0, .756, .147, .163, .070, .015);
  for (const x of [-.043, 0, .043]) box(body, '#a9eef2', x, .758, .158, .022, .017, .011);
  box(body, '#2e418e', 0, .747, -.159, .273, .283, .098);
  box(body, '#88a2ff', 0, .753, -.212, .183, .162, .029);
  for (const x of [-.055, .055]) {
    box(body, '#344aa2', x, .753, -.234, .031, .109, .016);
    box(body, '#a9ecff', x, .790, -.243, .029, .029, .010);
  }
  box(body, '#9aafff', 0, .900, -.193, .162, .033, .047);
}

function rigLeg(body, x, hipHeight, upper, lower, palette) {
  const hip = pivot(body, x, hipHeight);
  const knee = pivot(hip, 0, -upper);
  const foot = pivot(knee, 0, -lower);
  const width = palette.robot ? .133 : .132;
  const ankle = palette.robot ? .052 : .057;
  box(hip, palette.pants, 0, -upper * .49, 0, width, upper * .95, width + .015);
  box(knee, palette.coat, 0, -.011, .043, width + .008, .142, width * .63);
  box(knee, palette.pants, 0, -lower * .48, -.005, width * .92, lower * .88, width * .91);
  box(foot, palette.boot, 0, -.019, .049, width + .013, .065, .231);
  box(foot, palette.sole, 0, -ankle + .010, .049, width + .019, .020, .237);
  box(foot, palette.trim, 0, .013, .103, width * .73, .015, .072);
  return { hip, knee, foot, upper, lower, ankle };
}

function rigArm(body, side, x, y, palette) {
  const shoulder = pivot(body, side * x, y);
  const robot = palette.robot;
  const upper = robot ? .177 : .246;
  const lower = robot ? .151 : .234;
  const width = robot ? .133 : .112;
  const elbow = pivot(shoulder, 0, -upper);
  shoulder.rotation.z = side * .11;
  box(shoulder, palette.coat, 0, -upper * .48, 0, width, upper, width);
  box(shoulder, palette.trim, 0, -upper * .18, .007, width + .014, .063, width + .014);
  box(elbow, palette.coat, 0, -lower * .50, 0, width * .84, lower * .93, width * .86);
  box(elbow, palette.trim, 0, -lower * .95, .001, width * .87, .033, width * .88);
  box(elbow, palette.skin, 0, -lower - .040, .011, width * .79, .084, width * .76);
  if (robot) box(elbow, '#a6efff', 0, -lower - .029, .068, .052, .025, .015);
  return { shoulder, elbow };
}

export function createAvatar(kind) {
  const robot = kind === 'codex';
  const woman = kind === 'woman';
  const colors = robot ? {
    robot: true, pants: '#4665d1', coat: '#638bea', trim: '#8bacff', boot: '#3655bd', sole: '#abc8ff', skin: '#809df4',
  } : humanColors[kind];
  if (!colors) throw new Error('Unknown avatar: ' + kind);
  const root = new T.Group();
  root.scale.setScalar(woman ? .954 : 1);
  const body = pivot(root, 0, 0);
  const legs = [-1, 1].map((side) => rigLeg(body, side * (robot ? .105 : .094),
    robot ? .529 : .89, robot ? .238 : .416, robot ? .239 : .417, colors));
  const arms = [-1, 1].map((side) => rigArm(body, side, robot ? .232 : .205, robot ? .860 : 1.311, colors));
  if (robot) {
    robotTorso(body);
    robotHead(body);
  } else {
    humanTorso(body, colors);
    humanHead(body, colors, woman);
  }
  return { root, body, legs, arms, robot, cameraHeight: robot ? .83 : woman ? 1.12 : 1.18, phase: 0, gait: 0, wave: 0 };
}

function poseLeg(leg, bodyHeight, z, height) {
  const down = Math.max(.06, leg.hip.position.y + bodyHeight - height);
  const reach = Math.min(Math.hypot(down, z), leg.upper + leg.lower - .00001);
  const knee = Math.acos(T.MathUtils.clamp((reach * reach - leg.upper ** 2 - leg.lower ** 2) /
    (2 * leg.upper * leg.lower), -1, 1));
  const hip = -Math.atan2(z, down) - Math.atan2(leg.lower * Math.sin(knee), leg.upper + leg.lower * Math.cos(knee));
  leg.hip.rotation.x = hip;
  leg.knee.rotation.x = knee;
  leg.foot.rotation.x = -hip - knee;
}

export function waveAvatar(avatar) {
  avatar.wave = .72;
}

export function animateAvatar(avatar, { distance, speed, climbing, seconds, reducedMotion = false, ground }) {
  const { body, arms, legs, robot } = avatar;
  avatar.gait = reducedMotion ? 0 : T.MathUtils.damp(avatar.gait, Math.min(1, speed / 1.1), 12, seconds);
  const run = T.MathUtils.clamp((speed - 1.8) / 1.5, 0, 1);
  const stride = robot ? climbing ? .58 : .88 + .30 * run : climbing ? .86 : 1.25 + .36 * run;
  avatar.phase = (avatar.phase + distance / stride) % 1;
  const gait = avatar.gait;
  const timing = avatar.phase * Math.PI * 2;
  body.position.y = gait * ((robot ? -.049 : -.062) + .017 * Math.cos(timing * 2));
  body.rotation.z = Math.sin(timing) * gait * .027;
  body.rotation.x = gait * (climbing ? .067 : .023);
  avatar.wave = reducedMotion ? 0 : Math.max(0, avatar.wave - seconds);
  const waving = Math.sin(avatar.wave / .72 * Math.PI) * (1 - gait);

  for (let i = 0; i < legs.length; i++) {
    const phase = (avatar.phase + i * .5) % 1;
    const swing = phase > .60 ? (phase - .60) / .40 : 0;
    const travel = phase <= .60 ? .5 - phase / .60 : -.5 + swing * swing * (3 - 2 * swing);
    const z = travel * stride * .56 * gait;
    const lift = Math.sin(swing * Math.PI) * gait * (climbing ? .18 : .095);
    const groundHeight = ground?.(legs[i].hip.position.x, z) || 0;
    poseLeg(legs[i], body.position.y, z, legs[i].ankle + lift + groundHeight);
    const armSwing = Math.cos(phase * Math.PI * 2) * .34 * gait;
    arms[i].shoulder.rotation.x = armSwing - (i === 1 ? waving * .62 : 0);
    arms[i].shoulder.rotation.z = (i ? .12 : -.12) + (i === 1 ? waving * .86 : 0);
    arms[i].elbow.rotation.x = -.11 - Math.max(0, armSwing) * .4 - (i === 1 ? waving * .52 : 0);
  }
}
