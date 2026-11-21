import { readProduct } from './catalog.js';
import { postCheckout } from './checkout.js';

export function addItem(items, id) {
  const product = readProduct(id);
  if (!product) throw new Error('Unknown product');
  const existing = items.find((item) => item.id === id);
  return existing
    ? items.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item)
    : [...items, { ...product, quantity: 1 }];
}

export function requestCheckout(items) {
  return postCheckout(items);
}
