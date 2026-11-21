const orders = new Map();
export function saveOrder(order) {
  orders.set(order.id, order);
  return order;
}

export function findOrder(id) {
  return orders.get(id);
}
