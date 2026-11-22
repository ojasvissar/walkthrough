import { chargeOrder } from './payments.js';
import { saveOrder } from './orders.js';

export function createOrder(items, payment) {
  return saveOrder({ id: crypto.randomUUID(), items, payment });
}

export function postCheckout(items, currency = 'USD') {
  const cents = items.reduce((total, item) => total + item.cents * item.quantity, 0);
  return createOrder(items, chargeOrder(cents, currency));
}
