import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as T from '../public/vendor/three/three.module.min.js';
import { createAvatar } from '../public/js/simulation/avatars.js';

const directory = fileURLToPath(new URL('../public/assets/avatars/', import.meta.url));
await mkdir(directory, { recursive: true });
const light = new T.Vector3(-.42, .84, .65).normalize();
const colors = { codex: '#334c79', man: '#316264', woman: '#564875' };

function portrait(kind) {
  const { root } = createAvatar(kind);
  root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(root);
  const height = bounds.max.y;
  const eye = new T.Vector3(3.1, height + 1.15, 5);
  const camera = new T.PerspectiveCamera();
  camera.position.copy(eye);
  camera.lookAt(0, height * .69, 0);
  camera.updateMatrixWorld(true);
  const faces = [];
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const vertices = mesh.geometry.getAttribute('position');
    const indices = mesh.geometry.index;
    const color = mesh.material.color.getHexString(T.SRGBColorSpace);
    for (let i = 0; i < indices.count; i += 3) {
      const world = [0, 1, 2].map((j) => new T.Vector3()
        .fromBufferAttribute(vertices, indices.getX(i + j)).applyMatrix4(mesh.matrixWorld));
      const center = world[0].clone().add(world[1]).add(world[2]).multiplyScalar(1 / 3);
      if (center.y < height * .51) continue;
      const normal = world[1].clone().sub(world[0]).cross(world[2].clone().sub(world[0])).normalize();
      if (normal.dot(eye.clone().sub(center)) <= 0) continue;
      const points = world.map((p) => p.applyMatrix4(camera.matrixWorldInverse));
      const depth = points.reduce((sum, p) => sum + p.z, 0) / 3;
      faces.push({ points: points.map((p) => [p.x, -p.y]), depth, color,
        shade: .71 + .29 * Math.max(0, normal.dot(light)) });
    }
  });
  return { kind, background: colors[kind], faces: faces.sort((a, b) => a.depth - b.depth) };
}

execFileSync('python3', ['-c', `
import json, sys
from pathlib import Path
from PIL import Image, ImageColor, ImageDraw

out = Path(sys.argv[1])
for model in json.load(sys.stdin):
    faces = model["faces"]
    points = [p for face in faces for p in face["points"]]
    min_x, min_y = map(min, zip(*points))
    max_x, max_y = map(max, zip(*points))
    scale = min(47/(max_x-min_x), 56/(max_y-min_y))
    x0 = (64-(max_x-min_x)*scale)/2
    y0 = (64-(max_y-min_y)*scale)/2+2
    base = ImageColor.getrgb(model["background"])
    im = Image.new("RGB", (64,64), base)
    draw = ImageDraw.Draw(im)
    for y in range(0,64,5):
        for x in range(0,64,5):
            draw.rectangle((x,y,x+4,y+4), fill=tuple(max(0,c-(x+y)//18) for c in base))
    for f in faces:
        q = [(round(x0+(x-min_x)*scale),round(y0+(y-min_y)*scale)) for x,y in f["points"]]
        draw.polygon(q, fill=tuple(round(c*f["shade"]) for c in ImageColor.getrgb("#"+f["color"])))
    im.save(out / (model["kind"]+".png"), optimize=True)
`, directory], { input: JSON.stringify(Object.keys(colors).map(portrait)), stdio: ['pipe', 'inherit', 'inherit'] });
