const cache = new Map();

export function readLegacyCache(id) {
  return cache.get(id);
}
