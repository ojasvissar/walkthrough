const catalog = [
  { id: 'mug', name: 'Mug', cents: 1400 },
  { id: 'shirt', name: 'Shirt', cents: 2600 },
];

export function readProduct(id) {
  return catalog.find((product) => product.id === id);
}

export function renderCatalog() {
  return catalog.map((product) => ({ ...product }));
}
