import * as T from '../../vendor/three/three.module.min.js';

export const ink = '#2e4241';
export const cream = '#f9eacc';
export const jade = '#457c68';
export const gold = '#f4c052';
const boxShape = new T.BoxGeometry(1, 1, 1);
const sphereShape = new T.SphereGeometry(1, 12, 8);
const cylinderShape = new T.CylinderGeometry(1, 1, 1, 14);
const materials = new Map();

export function material(color) {
  if (!materials.has(color)) materials.set(color, new T.MeshLambertMaterial({ color }));
  return materials.get(color);
}

function mesh(group, shape, color, x, y, z, w, h, d) {
  const item = new T.Mesh(shape, typeof color === 'string' ? material(color) : color);
  item.position.set(x, y, z);
  item.scale.set(w, h, d);
  group.add(item);
  return item;
}

export function box(g, c, x, y, z, w, h, d) {
  return mesh(g, boxShape, c, x, y, z, w, h, d);
}

export function oval(g, c, x, y, z, w, h, d) {
  return mesh(g, sphereShape, c, x, y, z, w, h, d);
}

export function cylinder(g, c, x, y, z, r, h) {
  return mesh(g, cylinderShape, c, x, y, z, r, h, r);
}

export function rod(g, c, from, to, radius) {
  const a = new T.Vector3(...from);
  const b = new T.Vector3(...to);
  const center = a.clone().add(b).multiplyScalar(.5);
  const result = cylinder(g, c, center.x, center.y, center.z, radius, a.distanceTo(b));
  result.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.sub(a).normalize());
  return result;
}

export function plant(g, x, z, color = '#508067', size = 1) {
  cylinder(g, '#b57959', x, .15 * size, z, .22 * size, .3 * size);
  cylinder(g, '#765845', x, .29 * size, z, .24 * size, .06 * size);
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4;
    const leaf = oval(g, i % 2 ? color : '#79a772', x + Math.cos(a) * .14 * size,
      (.5 + i * .037) * size, z + Math.sin(a) * .14 * size, .15 * size, .28 * size, .11 * size);
    leaf.rotation.z = Math.cos(a) * .6;
  }
}

function desk(g, color, x = 0, z = .05, w = 2) {
  box(g, color, x, .72, z, w, .16, .66);
  for (const side of [-1, 1]) box(g, ink, x + side * (w / 2 - .12), .34, z, .12, .68, .51);
}

function screen(g, x, y, z, color = '#a8dcba') {
  box(g, ink, x, y, z, .68, .45, .11);
  box(g, color, x, y + .012, z + .061, .57, .33, .015);
  box(g, '#e2f7cf', x - .09, y + .03, z + .071, .26, .024, .013);
  box(g, '#e2f7cf', x - .15, y - .04, z + .071, .13, .024, .013);
  box(g, ink, x, y - .3, z, .09, .2, .11);
}

function stackedBox(g, x, y, z, w, c = '#c79a70') {
  box(g, c, x, y + w * .41, z, w, w * .82, w * .85);
  box(g, '#eee0ad', x + w * .05, y + w * .825, z, w * .16, .018, w * .85);
  box(g, '#eee0ad', x + w * .05, y + w * .64, z + w * .43, w * .16, w * .35, .018);
}

function sheet(g, x, y, z, width = .57, height = .72, color = '#f3e6bd') {
  box(g, color, x, y, z, width, height, .08);
  box(g, '#5b7b76', x, y + height * .26, z + .063, width * .71, .078, .05);
  for (let i = 0; i < 3; i++) {
    box(g, '#87988a', x - width * i * .049, y + height * (.08 - i * .16), z + .063, width * (.73 - i * .10), .049, .05);
  }
}

function credential(g, x, y, z, color) {
  box(g, color, x, y, z, .71, .49, .11);
  box(g, '#e6d2a6', x - .19, y + .045, z + .073, .16, .18, .047);
  box(g, '#e6d2a6', x - .19, y - .09, z + .073, .24, .088, .047);
  for (const dy of [.07, -.04]) box(g, '#e9e9c5', x + .11, y + dy, z + .073, .23, .054, .05);
}

function reader(g, x, y, z) {
  box(g, '#384b53', x, y + .16, z, .49, .32, .44);
  box(g, '#9bd3a8', x, y + .326, z - .053, .33, .048, .17);
  for (const col of [-1, 0, 1]) {
    box(g, col === 1 ? '#d2ba70' : '#829596', x + col * .09, y + .326, z + .10, .060, .049, .060);
  }
  box(g, '#222f38', x, y + .21, z + .233, .31, .057, .044);
}

function stair(g) {
  const count = 18;
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2;
    const x = Math.sin(angle) * .85;
    const z = Math.cos(angle) * .85;
    const y = .99 - Math.cos(angle) * .82;
    const step = box(g, i % 3 ? '#a284b6' : '#d0b7d7', x, y, z, .46, .12, .68);
    step.rotation.y = angle;
    if (i % 2 === 0) cylinder(g, '#705d89', x * 1.32, y + .21, z * 1.32, .028, .48);
  }
  cylinder(g, '#6e6484', 0, .9, 0, .105, 1.8);
}

export function prop(key) {
  const g = new T.Group();
  switch (key) {
    case 'auth':
      desk(g, '#588988', 0, .10, 2.1);
      credential(g, -.62, 1.10, .20, '#456f90');
      box(g, '#314a56', .37, 1.14, .11, .64, .69, .45);
      box(g, '#74b99b', .37, 1.20, .36, .48, .45, .069);
      box(g, '#205b50', .30, 1.14, .415, .16, .083, .052);
      box(g, '#205b50', .38, 1.22, .415, .083, .17, .052);
      box(g, '#d4a85e', .53, .95, .37, .086, .072, .055);
      box(g, '#8be4b1', .37, .83, .39, .33, .067, .066);
      break;
    case 'store':
      desk(g, '#d49870', 0, .18, 2.5);
      for (const side of [-1, 1]) box(g, jade, side * 1.15, 1.26, .19, .09, 1.42, .1);
      for (let i = 0; i < 10; i++) {
        const canvas = box(g, i % 2 ? '#f4ead2' : '#db795f', -1.11 + i * .247, 1.91, .22, .25, .096, 1);
        canvas.rotation.x = .23;
        box(g, i % 2 ? '#f4ead2' : '#db795f', -1.11 + i * .247, 1.77, .716, .248, .18, .06);
      }
      for (let i = 0; i < 6; i++) oval(g, i % 2 ? '#f0ac55' : '#729649', -1 + i * .33, .94, .33, .12, .13, .12);
      break;
    case 'terminal':
      desk(g, '#6f928e');
      box(g, '#405961', 0, 1.33, .06, 1.18, .80, .16);
      box(g, '#c0dcbb', 0, 1.33, .17, 1.02, .66, .073);
      box(g, '#648f85', -.18, 1.55, .226, .46, .072, .048);
      for (const y of [1.39, 1.25]) box(g, '#f3e8c9', 0, y, .225, .71, .082, .05);
      for (const x of [-.27, -.16, -.05, .06]) box(g, '#4a6d76', x, 1.25, .264, .046, .041, .04);
      box(g, '#4d8275', .18, 1.12, .230, .33, .085, .058);
      box(g, '#465962', 0, .94, .06, .17, .27, .17);
      box(g, '#edf0ce', 0, .82, .36, .67, .05, .2);
      oval(g, '#557370', -.25, .44, .76, .3, .07, .27);
      cylinder(g, ink, -.25, .22, .76, .045, .43);
      break;
    case 'cart':
      for (const side of [-1, 1]) {
        for (const z of [-.52, .52]) {
          const wheel = cylinder(g, ink, side * .42, .16, z, .14, .10);
          wheel.rotation.z = Math.PI / 2;
          rod(g, '#669048', [side * .34, .23, z], [side * .42, .62, z], .045);
        }
        for (let i = 0; i < 6; i++) {
          rod(g, '#85aa55', [side * .44, .53, -.65 + i * .24], [side * .54, 1.0, -.68 + i * .25], .025);
        }
        rod(g, '#759e55', [side * .55, 1, -.68], [side * .55, 1, .65], .055);
      }
      box(g, '#a6c663', 0, .57, 0, .94, .08, 1.29);
      rod(g, '#da9d65', [-.55, 1.12, .74], [.55, 1.12, .74], .052);
      stackedBox(g, .02, .61, .16, .44, '#d29162');
      oval(g, '#f2ad54', -.21, .72, -.28, .15, .15, .15);
      g.rotation.y = -.53;
      break;
    case 'gates':
      for (const x of [-.63, .63]) {
        box(g, '#69877c', x, .49, .27, .34, .98, .83);
        box(g, '#3f655c', x, .84, .71, .35, .18, .04);
        box(g, '#cbec83', x, .86, .734, .13, .052, .012);
      }
      rod(g, '#9ca95e', [-.47, .72, .49], [.43, .72, .49], .045);
      box(g, '#9ebbb0', 0, .028, .55, .89, .052, .95);
      for (let i = 0; i < 3; i++) box(g, '#648978', 0, .057, .88 - .12 * i, .14 + .11 * i, .028, .057);
      sheet(g, -.61, 1.23, .41, .38, .45);
      screen(g, .62, 1.23, .16, '#b1d48b');
      break;
    case 'checkout':
      desk(g, '#bb794e', 0, .02, 2.3);
      box(g, '#465e63', -.57, .841, .10, .91, .092, .52);
      for (let i = 0; i < 4; i++) box(g, '#658d87', -.92 + i * .23, .891, .10, .114, .043, .42);
      stackedBox(g, -.74, .92, .10, .31, '#daa875');
      stackedBox(g, -.38, .92, .06, .25, '#87b182');
      reader(g, .27, .80, .22);
      screen(g, .34, 1.41, -.15, '#f6d09b');
      sheet(g, .83, 1.04, .14, .31, .48);
      break;
    case 'payments':
      desk(g, '#548b77', 0, .06, 1.95);
      reader(g, 0, .80, .25);
      credential(g, -.61, 1.14, .08, '#4e7aa2');
      sheet(g, .62, 1.10, .16, .40, .60);
      break;
    case 'stairs':
      stair(g);
      break;
    case 'records':
      box(g, '#56698d', 0, .10, .02, 2.09, .19, .74);
      for (const x of [-.64, 0, .64]) {
        box(g, '#526986', x, .80, .02, .59, 1.32, .65);
        box(g, '#839bb2', x, 1.45, .02, .60, .095, .70);
        credential(g, x, 1.13, .37, '#627b9d');
        for (const y of [.40, .66]) {
          box(g, '#8aa1b1', x, y, .36, .47, .20, .065);
          box(g, '#4d6078', x, y, .414, .18, .058, .062);
        }
      }
      break;
    case 'schemas':
      desk(g, '#667a9f', 0, .05, 2.2);
      box(g, '#4f607f', 0, 1.33, .03, 1.93, 1.05, .17);
      box(g, '#93b4c4', 0, 1.34, .141, 1.76, .87, .08);
      for (const x of [-.58, 0, .58]) {
        box(g, '#6387a5', x, 1.62, .20, .48, .12, .054);
        for (const y of [1.08, 1.23, 1.39]) box(g, '#c2d7ce', x, y, .20, .46, .074, .054);
      }
      break;
    case 'graph':
      desk(g, '#667a9f', 0, .05, 2.2);
      box(g, '#4e647f', 0, 1.35, .05, 1.96, 1.08, .18);
      box(g, '#364d63', 0, 1.35, .162, 1.79, .90, .064);
      box(g, '#8bafba', 0, 1.35, .22, 1.32, .065, .064);
      for (const x of [-.62, .62]) {
        box(g, '#8bafba', x, 1.35, .22, .065, .54, .064);
        for (const y of [1.11, 1.61]) box(g, '#a1c8b5', x, y, .263, .30, .19, .087);
      }
      box(g, '#f0bb75', 0, 1.35, .27, .32, .24, .10);
      break;
    case 'response':
      desk(g, '#a47a66', 0, .04, 1.95);
      box(g, '#547a88', 0, .92, .13, 1.57, .19, .63);
      sheet(g, -.42, 1.19, .14, .43, .51);
      box(g, '#74b071', .46, 1.04, .13, .50, .12, .13);
      box(g, '#74b071', .65, 1.04, .13, .16, .12, .34);
      sheet(g, .11, 1.29, -.09, .42, .62, '#d6e5c5');
      break;
    case 'templates':
      desk(g, '#678da0', 0, .041, 2.05);
      box(g, '#415c77', 0, 1.34, .05, 1.78, 1.01, .18);
      box(g, '#dbe4d2', 0, 1.34, .173, 1.61, .83, .08);
      box(g, '#749cba', 0, 1.65, .237, 1.61, .16, .073);
      box(g, '#91b889', -.39, 1.28, .237, .62, .39, .073);
      for (const y of [1.13, 1.28, 1.43]) box(g, '#7b9094', .36, y, .238, .55, .067, .073);
      break;
    case 'build':
      desk(g, '#a88358', 0, .02, 2.20);
      sheet(g, -.72, 1.12, .12, .46, .52);
      box(g, '#4f656a', 0, 1.17, .0, .72, .74, .72);
      box(g, '#7baa85', 0, 1.35, .40, .52, .25, .10);
      box(g, '#233e4a', 0, 1.02, .41, .42, .18, .10);
      stackedBox(g, .75, .80, .13, .47);
      break;
    case 'control':
      desk(g, '#638495', 0, .04, 2.08);
      screen(g, -.50, 1.40, .03);
      for (let i = 0; i < 3; i++) {
        const x = .14 + i * .24;
        box(g, '#465e67', x, 1.08, .06, .15, .55, .26);
        box(g, i === 1 ? '#e4b96f' : '#8ac1b3', x, .97 + i * .13, .23, .18, .11, .096);
      }
      break;
    case 'workbench':
      desk(g, '#a98066', 0, .04, 1.95);
      sheet(g, -.60, 1.10, .12, .49, .55);
      box(g, '#536a7b', .40, .96, -.02, .76, .32, .46);
      for (const x of [.16, .41, .66]) box(g, '#adbf85', x, 1.15, -.02, .10, .15, .24);
      break;
    case 'lockers':
      for (let i = 0; i < 4; i++) {
        const x = (i - 1.5) * .51;
        box(g, i % 2 ? '#8172a7' : '#9c83b4', x, .8, .02, .49, 1.6, .55);
        for (const y of [.44, 1.2]) {
          box(g, '#b6a1c7', x, y, .305, .43, .69, .045);
          box(g, '#f4cf7e', x + .135, y, .338, .028, .1, .03);
          box(g, '#6a628e', x, y + .22, .335, .16, .035, .022);
        }
      }
      break;
    case 'servers':
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * .65;
        box(g, '#4c5064', x, .78 + i * .065, .035, .55, 1.56 + i * .13, .71);
        for (let j = 0; j < 7; j++) {
          box(g, '#333e52', x, .26 + j * .18, .406, .46, .135, .05);
          box(g, j % 3 === 1 ? '#ecc274' : '#a3da9a', x - .13, .27 + j * .18, .437, .055, .032, .01);
          box(g, '#8a8ca4', x + .096, .27 + j * .18, .435, .095, .027, .009);
        }
      }
      break;
    case 'boxes':
    case 'dust': {
      const dim = key === 'dust';
      const wood = dim ? '#645d72' : '#9a745c';
      for (const side of [-1, 1]) box(g, wood, side * .95, .77, .045, .12, 1.54, .64);
      for (const y of [.17, .72, 1.37]) {
        box(g, wood, 0, y, .05, 2.04, .11, .7);
        for (let i = 0; i < 3; i++) {
          if (dim && i === 1) continue;
          stackedBox(g, (i - 1) * .53, y + .056, .1, .32 + i * .044, dim ? '#776779' : i % 2 ? '#d2a77a' : '#b78d65');
        }
      }
      break;
    }
  }
  return g;
}
