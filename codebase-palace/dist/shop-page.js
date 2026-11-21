import { Shop, credentials, detectRuntime, streamRuntime } from './runtime.js';
import { renderCatalog } from './shop/catalog.js';
import { addItem, requestCheckout } from './shop/cart.js';

const form = document.querySelector('#shop-login');
const feedback = document.querySelector('#shop-login-status');
const catalog = document.querySelector('#shop-catalog');
const cart = document.querySelector('#shop-cart');
const checkout = document.querySelector('#checkout');
const runtime = detectRuntime();
const shop = new Shop();
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('walkthrough-tiny-shop') : null;
let items = [];
let signedIn = false;
form.elements.email.value = credentials.email;
form.elements.password.value = credentials.password;

form.onsubmit = async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const submit = form.querySelector('[type=submit]');
  const request = crypto.randomUUID();
  submit.disabled = true;
  feedback.textContent = 'Signing in…';
  channel?.postMessage({ type: 'begin', request });
  const onEvent = (item) => channel?.postMessage({ type: 'event', request, event: item });
  try {
    const input = { email: data.get('email'), password: data.get('password'), slow: data.has('slow') };
    const result = await runtime ? await streamRuntime('login', input, onEvent, 1) :
      await shop.login(input.email, input.password, onEvent, { slow: input.slow });
    signedIn = result.status === 200;
    feedback.textContent = signedIn ? 'Signed in. Watch the request in WalkThrough.' : 'Use the demo email and password to sign in.';
    channel?.postMessage({ type: 'done', request, status: result.status });
  } catch {
    feedback.textContent = 'The demo login could not be completed.';
    channel?.postMessage({ type: 'done', request, status: 503 });
  } finally {
    submit.disabled = false;
  }
};

function updateCart() {
  const quantity = items.reduce((total, item) => total + item.quantity, 0);
  cart.textContent = quantity ? quantity + (quantity === 1 ? ' item' : ' items') + ' in the cart' : 'The cart is empty.';
  checkout.disabled = !quantity;
}
for (const product of renderCatalog()) {
  const row = document.createElement('div');
  row.className = 'catalog-row';
  const label = document.createElement('span');
  label.textContent = product.name + ' · $' + (product.cents / 100).toFixed(2);
  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = 'Add';
  button.onclick = () => { items = addItem(items, product.id); updateCart(); };
  row.append(label, button);
  catalog.append(row);
}
checkout.onclick = () => {
  const info = document.querySelector('#checkout-status');
  if (!signedIn) { info.textContent = 'Sign in to check out.'; return; }
  try {
    const order = requestCheckout(items);
    info.textContent = 'Demo order received · $' + (order.payment.total / 100).toFixed(2);
    items = [];
    updateCart();
  } catch (error) { info.textContent = error.message; }
};
updateCart();
