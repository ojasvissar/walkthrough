export const exhibits = {
  store: ['Product display', 'The shelves show the products available to browse.'],
  terminal: ['Sign-in terminal', 'The sign-in form collects credentials and shows the result.'],
  cart: ['Shopping cart', 'The cart holds the selected items and their quantities.'],
  gates: ['Request intake', 'Packets arrive here before being routed to a handler.'],
  checkout: ['Checkout counter', 'The register totals the cart, sends the charge to Payments and passes the receipt to Order Store.'],
  payments: ['Payment verification', 'The card reader and receipt represent the amount and currency checks.'],
  auth: ['Credential checkpoint', 'The scanner compares submitted credentials with a user record.'],
  lockers: ['Session key cabinet', 'The cabinet represents keys issued to signed-in users.'],
  records: ['User records', 'The profile cards are records that can be looked up by email.'],
  boxes: ['Record archive', 'The shelves hold stored records for later lookup.'],
  servers: ['Storage rack', 'The rack represents the underlying storage or cache.'],
  schemas: ['Data model table', 'Rows and columns show how records are structured.'],
  graph: ['Dependency board', 'The links show which modules refer to one another.'],
  response: ['Response dispatch', 'The outgoing packet carries the result back to the caller.'],
  templates: ['Template preview', 'The frame represents a template filled with data for display.'],
  build: ['Build workbench', 'Source files feed into the build and come out as a packaged artifact.'],
  control: ['Control panel', 'The panel represents the settings and connections managed here.'],
  workbench: ['Module workbench', 'Inspect the tools and source files for this module’s responsibilities.'],
  stairs: ['Import loop', 'The steps lead back to the start, like modules that import each other.'],
  dust: ['Inactive archive', 'The dark shelves mark code with no incoming references detected.'],
};

const legacyExhibits = { duck: 'checkout', coins: 'payments', penguin: 'auth' };
const layerExhibits = ['boxes', 'workbench', 'gates', 'templates'];
const signals = [
  [/\b(?:checkout)\b/, 'checkout'],
  [/\b(?:payments?|billing|charge)\b/, 'payments'],
  [/\b(?:session|token|cookie)\b/, 'lockers'],
  [/\b(?:auth|authentication|credential|credentials|password|security)\b/, 'auth'],
  [/\b(?:middleware|route|routes|request|controller|controllers|blueprint|blueprints)\b/, 'gates'],
  [/\b(?:response|respond|dispatch)\b/, 'response'],
  [/\b(?:login|signin|signup)\b/, 'terminal'],
  [/\b(?:cart|basket)\b/, 'cart'],
  [/\b(?:catalog|storefront)\b/, 'store'],
  [/\b(?:module|dependency|import) graph\b/, 'graph'],
  [/\b(?:schema|schemas|models|migrations)\b/, 'schemas'],
  [/\b(?:build|compile|bundle|bundler)\b/, 'build'],
  [/\b(?:config|settings|server|cli|plugins)\b/, 'control'],
  [/\b(?:view|views|template|templates|render|component|components)\b/, 'templates'],
  [/\b(?:users|profiles)\b/, 'records'],
  [/\b(?:cache|database|db|storage)\b/, 'servers'],
  [/\b(?:archive|orders|repository)\b/, 'boxes'],
];

export function inferredExhibit(room, fallback = layerExhibits[room.floor] || 'workbench') {
  if (room.status === 'cycle') return 'stairs';
  if (room.status === 'dust') return 'dust';
  const words = (value) => value.replace(/([a-z\d])([A-Z])/g, '$1 $2').replaceAll(/[^\w]+|_+/g, ' ').toLowerCase();
  for (const field of [room.name, room.path?.split('/').at(-1), room.functions?.join(' ')]) {
    if (!field) continue;
    const label = words(field);
    if (room.floor === 2 && /\b(?:login|sign in|sign up)\b/.test(label)) return 'gates';
    const rule = signals.find(([signal]) => signal.test(label));
    if (rule) return rule[1];
  }
  return fallback;
}

export function roomExhibit(room) {
  const migrated = Object.hasOwn(legacyExhibits, room.prop);
  const known = Object.hasOwn(exhibits, room.prop);
  const prop = known ? room.prop : inferredExhibit(room, migrated ? legacyExhibits[room.prop] : undefined);
  const [cue, mnemonic] = exhibits[prop];
  return { prop, cue: migrated ? cue : room.cue || cue, mnemonic: migrated ? mnemonic : room.mnemonic || mnemonic };
}
