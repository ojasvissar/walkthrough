export const credentials = { email: 'shopper@tinyshop.test', password: 'tiny-shop-demo' };
const users = new Map([[credentials.email, { ...credentials }]]);
export function findUser(email) {
  return users.get(email);
}
