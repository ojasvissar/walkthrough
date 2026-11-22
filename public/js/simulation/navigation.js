export const floorGap = 3.37;
export const buildingWidth = 14.55;
export const doorway = { z: 1.81, width: 1.38, height: 2.07 };
export const corridorZ = 2.73;
export const stairs = {
  left: 7.38, right: 10.92, front: 2.02, turn: -1.16, back: -2.75,
  inner: 8.29, outer: 10.01, laneWidth: 1.57, treads: 10,
};
const radius = .22;
const leftEdge = -7.40;
const backEdge = -3.02;
const frontEdge = 3.43;

export function roomWalls(center, width) {
  const left = center - width / 2;
  const right = center + width / 2;
  const opening = Math.min(doorway.width, width - .22);
  const insets = [center - opening / 2, center + opening / 2];
  return {
    left, right, opening,
    walls: [
      [left - .055, left + .055, backEdge, doorway.z + .05],
      [right - .055, right + .055, backEdge, doorway.z + .05],
      [left, insets[0], doorway.z - .05, doorway.z + .05],
      [insets[1], right, doorway.z - .05, doorway.z + .05],
    ],
  };
}

export function overlaps(x, z, [left, right, back, front], buffer = radius) {
  const dx = Math.max(left - x, x - right, 0);
  const dz = Math.max(back - z, z - front, 0);
  return dx * dx + dz * dz < buffer * buffer;
}

function stairLane(x) {
  return [stairs.inner, stairs.outer].findIndex((middle) => Math.abs(x - middle) <= stairs.laneWidth / 2 - radius);
}

function stepHeight(floor, lane, z) {
  const progress = Math.max(0, Math.min(1, (stairs.front - z) / (stairs.front - stairs.turn)));
  const tread = Math.min(stairs.treads, Math.max(0, Math.round(progress * stairs.treads)));
  const halfway = floorGap / 2;
  return floor * floorGap + (lane === 0 ? tread : 2 * stairs.treads - tread) * halfway / stairs.treads;
}

export function movePoint(player, x, z, rooms, floorCount) {
  if (x < leftEdge + radius || x > stairs.right - radius || z > frontEdge - radius || z < backEdge + radius) return null;
  const floor = player.floor;
  const lane = stairLane(x);
  if (player.stair != null) {
    if (z >= stairs.front) {
      if (lane < 0) return null;
      const landing = player.stair + lane;
      return { x, z, y: landing * floorGap, floor: landing, stair: null };
    }
    if (x < stairs.left + radius || z < stairs.back + radius || (z > stairs.turn && lane < 0)) return null;
    const height = stepHeight(player.stair, lane, z);
    return { x, z, y: height, floor: Math.round(height / floorGap), stair: player.stair };
  }
  if (x > buildingWidth / 2 + .10 - radius && z < stairs.front - radius && lane < 0) return null;
  if (x > stairs.left && z < stairs.front) {
    if (lane < 0) return null;
    const below = floor - lane;
    if (below < 0 || below >= floorCount - 1) return null;
    const y = stepHeight(below, lane, z);
    return { x, z, y, floor: Math.round(y / floorGap), stair: below };
  }
  if (rooms.some((room) => room.floor === floor && room.colliders.some((bounds) => overlaps(x, z, bounds)))) return null;
  return { x, z, y: floor * floorGap, floor, stair: null };
}

export function getRoom(player, rooms, nearDoor = false) {
  if (player.stair != null) return;
  return rooms.find((room) => room.floor === player.floor && player.x > room.left && player.x < room.right &&
    (player.z < doorway.z - .13 || nearDoor && Math.abs(player.x - room.center) < room.opening / 2 + .12 && player.z < doorway.z + .87));
}
