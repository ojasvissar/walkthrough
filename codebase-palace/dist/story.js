const stations = [
  [/payment|chargeorder/, 'payments', 'Payment checks'],
  [/createorder|postcheckout|requestcheckout/, 'checkout', 'Checkout flow'],
  [/saveorder|findorder/, 'boxes', 'Stored orders'],
  [/finduser|getuser|createuser/, 'records', 'User records'],
  [/password|authenticat|credential|normalizeemail/, 'auth', 'Credential checks'],
  [/sessionheader|readheader|requiresession/, 'gates', 'Request headers and access'],
  [/session|token/, 'lockers', 'Session keys'],
  [/catalog|readproduct/, 'store', 'Product listing'],
  [/additem|removeitem/, 'cart', 'Cart items'],
  [/handlelogin|handlerequest/, 'gates', 'Incoming requests'],
  [/submitlogin|showresult/, 'terminal', 'Sign-in form'],
  [/^respond\(|^send\(|^redirect\(|^json\(/, 'response', 'Outgoing response'],
  [/render|template/, 'templates', 'Rendered view'],
  [/cache|initdb/, 'servers', 'Stored data'],
  [/build|compile|bundle/, 'build', 'Build step'],
];

export function memoryStation(fn, room) {
  const name = fn.toLowerCase().replaceAll('_', '');
  const match = stations.find(([pattern]) => pattern.test(name));
  if (match) return { prop: match[1], title: match[2] };
  return { prop: room.prop, title: room.cue };
}

const demoStops = [
  ['login', 'Start at the interface. A login submission sends the request down to the API.'],
  ['routes', 'The intake sends POST /login to Auth Service. The looping staircase nearby marks the middleware import cycle.'],
  ['auth', 'At the credential checkpoint, the code normalizes the email and checks the password against the user record.'],
  ['users', 'The profile cards represent records indexed by email. The request waits here during the lookup.'],
  ['checkout', 'The register totals cart items, calls Payments and saves the order. The flames mark frequent changes.'],
  ['payments', 'The card terminal checks the amount and currency. The dark Legacy Cache downstairs has no incoming imports.'],
];

export function tourStops(model) {
  if (model.kind === 'demo') return demoStops.map(([id, note]) => ({ id, note }));
  const ordered = model.rooms.slice().sort((a, b) => b.floor - a.floor);
  return ordered.slice(0, 6).map((room) => ({
    id: room.id, note: room.mnemonic || room.description,
  }));
}

export const demoHistory = [
  { sha: 'demo-01', title: 'Build the storefront', rooms: ['catalog', 'login', 'cart'], changed: ['catalog'], hot: [] },
  { sha: 'demo-02', title: 'Connect login and user storage', rooms: ['catalog', 'login', 'cart', 'routes', 'auth', 'users', 'sessions'], changed: ['login', 'auth'], hot: [] },
  { sha: 'demo-03', title: 'Open checkout and payments', rooms: ['catalog', 'login', 'cart', 'routes', 'auth', 'users', 'sessions', 'checkout', 'payments', 'orders'], changed: ['checkout', 'payments'], hot: [] },
  { sha: 'demo-04', title: 'Add middleware and the old cache', rooms: ['catalog', 'login', 'cart', 'routes', 'auth', 'users', 'sessions', 'checkout', 'payments', 'orders', 'middleware', 'headers', 'legacy'], changed: ['middleware', 'legacy'], hot: [] },
  { sha: 'demo-05', title: 'Rework the checkout flow', rooms: ['catalog', 'login', 'cart', 'routes', 'auth', 'users', 'sessions', 'checkout', 'payments', 'orders', 'middleware', 'headers', 'legacy'], changed: ['checkout'], hot: ['checkout'] },
];
