import * as T from './vendor/three.module.min.js';
import { box, material, prop } from './geometry.js';

const blockMaterial = new T.MeshLambertMaterial();
const exhibitMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: .68, metalness: .07 });
const exhibitGeometry = new Map();

export function rendererScale(density = 1) {
  return Math.min(1.75, Math.max(1, density));
}

export function roundedGeometry(width, height, depth, radius) {
  const bevel = Math.min(radius, width / 2, height / 2, depth / 2);
  const geometry = new T.BoxGeometry(1, 1, 1, 5, 5, 5);
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const corner = new T.Vector3();
  const inset = new T.Vector3(width / 2 - bevel, height / 2 - bevel, depth / 2 - bevel);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const sideX = Math.sign(x), sideY = Math.sign(y), sideZ = Math.sign(z);
    corner.set(x - sideX * .1, y - sideY * .1, z - sideZ * .1).normalize();
    positions.setXYZ(i, sideX * inset.x + corner.x * bevel, sideY * inset.y + corner.y * bevel, sideZ * inset.z + corner.z * bevel);
    normals.setXYZ(i, corner.x, corner.y, corner.z);
  }
  return geometry;
}

function shaped(parent, geometry, finish, x, y, z) {
  const item = new T.Mesh(geometry, typeof finish === 'string' ? material(finish) : finish);
  item.position.set(x, y, z);
  item.userData.ownedGeometry = true;
  parent.add(item);
  return item;
}

export function rounded(parent, finish, x, y, z, width, height, depth, radius) {
  return shaped(parent, roundedGeometry(width, height, depth, radius), finish, x, y, z);
}

export function slab(parent, { x = 0, top = 0, z = 0, width, depth, height, color, radius = .04 }) {
  return rounded(parent, color, x, top - height / 2, z, width, height, depth, radius);
}

export function archway(parent, color, width, height, z) {
  const edge = width / 2;
  const radius = .24;
  const band = .13;
  const spring = height - radius;
  const start = edge - radius;
  const shape = new T.Shape();
  shape.moveTo(-edge - band, 0);
  shape.lineTo(-edge - band, spring);
  shape.quadraticCurveTo(-edge - band, height + band, -start, height + band);
  shape.lineTo(start, height + band);
  shape.quadraticCurveTo(edge + band, height + band, edge + band, spring);
  shape.lineTo(edge + band, 0);
  shape.lineTo(edge, 0);
  shape.lineTo(edge, spring);
  shape.quadraticCurveTo(edge, height, start, height);
  shape.lineTo(-start, height);
  shape.quadraticCurveTo(-edge, height, -edge, spring);
  shape.lineTo(-edge, 0);
  shape.closePath();
  return shaped(parent, new T.ExtrudeGeometry(shape, {
    depth: .17, steps: 1, curveSegments: 9, bevelSegments: 2, bevelSize: .016, bevelThickness: .014,
  }), color, 0, 0, z - .085);
}

const arrow = new T.Shape();
arrow.moveTo(0, .20);
arrow.lineTo(-.17, .015);
arrow.lineTo(-.055, .015);
arrow.lineTo(-.055, -.19);
arrow.lineTo(.055, -.19);
arrow.lineTo(.055, .015);
arrow.lineTo(.17, .015);
arrow.closePath();
const arrowGeometry = new T.ShapeGeometry(arrow);
arrowGeometry.rotateX(-Math.PI / 2);

export function wayfindingArrow(parent, color, x, z, up) {
  const mesh = new T.Mesh(arrowGeometry, material(color));
  mesh.position.set(x, .009, z);
  mesh.rotation.y = up ? 0 : Math.PI;
  parent.add(mesh);
}

export function studioExhibit(key) {
  if (!exhibitGeometry.has(key)) {
    const source = prop(key);
    const positions = [], normals = [], colors = [], indices = [];
    const point = new T.Vector3();
    const normalMatrix = new T.Matrix3();
    source.traverse((part) => {
      if (!part.isMesh) return;
      const { x, y, z } = part.scale;
      const soften = part.geometry.type === 'BoxGeometry' && Math.min(x, y, z) >= .095;
      const geometry = soften ? roundedGeometry(x, y, z, Math.min(.065, x / 6, y / 6, z / 6)) : part.geometry;
      if (soften) part.scale.set(1, 1, 1);
      part.updateWorldMatrix(true, false);
      normalMatrix.getNormalMatrix(part.matrixWorld);
      const points = geometry.getAttribute('position');
      const directions = geometry.getAttribute('normal');
      const base = positions.length / 3;
      const color = part.material.color;
      for (let i = 0; i < points.count; i++) {
        point.fromBufferAttribute(points, i).applyMatrix4(part.matrixWorld);
        positions.push(point.x, point.y, point.z);
        point.fromBufferAttribute(directions, i).applyNormalMatrix(normalMatrix);
        normals.push(point.x, point.y, point.z);
        colors.push(color.r, color.g, color.b);
      }
      for (const index of geometry.index.array) indices.push(base + index);
      if (soften) geometry.dispose();
    });
    if (!positions.length) return new T.Group();
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    exhibitGeometry.set(key, geometry);
  }
  return new T.Mesh(exhibitGeometry.get(key), exhibitMaterial);
}

export function batchBlocks(group) {
  const parts = group.children.filter((part) => part.geometry?.type === 'BoxGeometry' &&
    !part.userData.ownedGeometry && part.material?.isMeshLambertMaterial);
  if (parts.length < 2) return;
  const batch = new T.InstancedMesh(parts[0].geometry, blockMaterial, parts.length);
  parts.forEach((part, index) => {
    part.updateMatrix();
    batch.setMatrixAt(index, part.matrix);
    batch.setColorAt(index, part.material.color);
  });
  group.remove(...parts);
  group.add(batch);
}
