import { exhibits } from './exhibits.js';

export const floors = [
  { title: 'Database', color: '#8b78c9', surface: '#b3a2d5', tint: '#d0c0ec' },
  { title: 'Services', color: '#4cae90', surface: '#9bcab1', tint: '#c9e6ca' },
  { title: 'API', color: '#d89458', surface: '#e5b780', tint: '#efd4a6' },
  { title: 'Interface', color: '#569fbb', surface: '#98c8d3', tint: '#bbdfe8' },
];

function room(id, name, floor, path, prop, cue, mnemonic, status, loc, functions, description, dependencies = []) {
  return { id, name, floor, path, prop, cue, mnemonic, status, loc, functions, description, dependencies };
}

export const tiny = {
  name: 'The Tiny Shop', slug: 'walkthrough/tiny-shop', kind: 'demo', rooms: [
    room('catalog', 'Storefront', 3, 'public/js/shop/catalog.js', 'store', 'Product display', 'The shelves show the products that render in the storefront.', 'normal', 12, ['renderCatalog()', 'readProduct()'], 'Renders the product catalog and starts a shopping or sign-in session.', ['login', 'cart']),
    room('login', 'Login Screen', 3, 'public/js/shop/login.js', 'terminal', 'Sign-in terminal', 'Enter credentials in the form. Submitting sends them to the Login Route.', 'normal', 7, ['submitLogin()', 'showResult()'], 'Collects an email and password and calls the login endpoint. The returned session allows the user to continue.', ['routes']),
    room('cart', 'Shopping Cart', 3, 'public/js/shop/cart.js', 'cart', 'Shopping cart', 'The boxes show the items and quantities sent to Checkout API.', 'normal', 15, ['addItem()', 'requestCheckout()'], 'Tracks items and quantities and sends the order to the checkout endpoint.', ['checkout']),
    room('routes', 'Login Route', 2, 'public/js/shop/routes.js', 'gates', 'Login request intake', 'The intake routes POST /login to authentication and sends back the result.', 'normal', 11, ['handleLogin()', 'respond()'], 'Handles POST /login and passes credentials to the Auth Service. It returns a session on success or an error on failure.', ['auth']),
    room('checkout', 'Checkout API', 2, 'public/js/shop/checkout.js', 'checkout', 'Checkout counter', 'The register totals the cart, sends the charge to Payments and sends the order to Order Store.', 'hot', 11, ['postCheckout()', 'createOrder()'], 'Accepts the checkout request, delegates validation to Payments and persists a successful order. This is the demo’s most frequently changed module.', ['payments', 'orders']),
    room('middleware', 'Middleware', 2, 'public/js/shop/middleware.js', 'stairs', 'Middleware import loop', 'Middleware imports Session Headers, which imports Middleware back.', 'cycle', 10, ['requireSession()', 'readHeader()'], 'Reads request headers and guards private routes. Its session-header helper imports the middleware back, forming a cycle.', ['sessions', 'headers']),
    room('headers', 'Session Headers', 2, 'public/js/shop/session-headers.js', 'stairs', 'Session header import loop', 'The session header reader imports Middleware, completing the cycle.', 'cycle', 9, ['sessionHeader()', 'hasSessionHeader()'], 'Exports the header name and uses the Middleware reader, closing the import cycle.', ['middleware']),
    room('payments', 'Payments', 1, 'public/js/shop/payments.js', 'payments', 'Payment verification', 'The reader accepts a positive whole number of cents in USD and issues a receipt.', 'normal', 8, ['validatePayment()', 'chargeOrder()'], 'Validates the payment total and currency before the checkout route creates an order.', ['orders']),
    room('auth', 'Auth Service', 1, 'public/js/shop/auth.js', 'auth', 'Credential checkpoint', 'The scanner represents normalizing the email and checking the password against a user record.', 'normal', 7, ['normalizeEmail()', 'validateCredentials()'], 'Normalizes the submitted email and checks the password against the user record. The login flow can issue a session after these checks pass.', ['users', 'sessions']),
    room('sessions', 'Sessions', 1, 'public/js/shop/sessions.js', 'lockers', 'Session key cabinet', 'The keys represent the session IDs that the code issues and looks up.', 'normal', 14, ['issueSession()', 'readSession()', 'revokeSession()'], 'Issues, reads, and revokes session identifiers.', []),
    room('users', 'User Store', 0, 'public/js/shop/users.js', 'records', 'User record lookup', 'The profile cards are indexed by email. A slow lookup holds the login request here.', 'normal', 5, ['findUser()'], 'Fetches the demo user and verifies their password. The trace highlights time spent waiting on this lookup.'),
    room('orders', 'Order Store', 0, 'public/js/shop/orders.js', 'boxes', 'Order archive', 'The labeled boxes represent orders saved at checkout and retrieved by ID.', 'normal', 9, ['saveOrder()', 'findOrder()'], 'Persists orders and looks them up after checkout.'),
    room('legacy', 'Legacy Cache', 0, 'public/js/shop/legacy-cache.js', 'dust', 'Inactive cache', 'The dark shelves represent a leftover cache with no incoming imports in the demo.', 'dust', 5, ['readLegacyCache()'], 'A leftover cache module with no incoming references in the demo architecture.'),
  ],
};

export const quiz = [
  { question: 'Where does payment validation happen?', choices: ['Checkout API', 'Payments', 'Order Store'], answer: 1, room: 'payments', explanation: 'The card reader is in Payments, where validatePayment() checks the total and currency.' },
  { question: 'Which room was already on fire when you arrived?', choices: ['Auth Service', 'Legacy Cache', 'Checkout API'], answer: 2, room: 'checkout', explanation: 'Checkout API is a hotspot in the demo history. The flames are beside the checkout counter.' },
  { question: 'Where did the credential checkpoint verify the password?', choices: ['Auth Service', 'Login Screen', 'User Store'], answer: 0, room: 'auth', explanation: 'Auth Service compares the submitted password to the user record.' },
];

export const examples = {
  fastapi: { name: 'Full Stack FastAPI', slug: 'fastapi/full-stack-fastapi-template', groups: [
    ['Login Screen', 'frontend/src/routes/login.tsx', 3, 'terminal', ['Login()', 'onSubmit()'], 'Renders the React login form and submits credentials through the authentication hook.', [2]],
    ['Sign-up Screen', 'frontend/src/routes/signup.tsx', 3, 'terminal', [], 'Lets a new user create an account.', [3], 'Account registration form'],
    ['Login API', 'backend/app/api/routes/login.py', 2, 'gates', ['login_access_token()', 'test_token()', 'recover_password()'], 'Receives login data, calls the authentication service, and returns an access token for an active user.', [4, 5, 6]],
    ['User API', 'backend/app/api/routes/users.py', 2, 'records', [], 'Handles registration, account details, and user administration.', [4, 6]],
    ['Authentication & CRUD', 'backend/app/crud.py', 1, 'auth', ['authenticate()', 'get_user_by_email()', 'create_user()'], 'Looks up users by email and verifies their password. This module also owns the core database write helpers.', [5, 6]],
    ['Token & Password Helpers', 'backend/app/core/security.py', 1, 'auth', ['create_access_token()', 'verify_password()', 'get_password_hash()'], 'Creates access tokens and provides password hashing and verification for the API and data helpers.', [], 'Token and credential tools'],
    ['Data Models', 'backend/app/models.py', 0, 'schemas', [], 'Defines SQLModel user and item models plus the API data shapes derived from them.', []],
    ['Database Session', 'backend/app/core/db.py', 0, 'servers', ['init_db()'], 'Configures the database engine and initializes the first user when needed.', [4, 6]],
  ] },
  express: { name: 'Express', slug: 'expressjs/express', groups: [
    ['Application', 'lib/application.js', 3, 'control', ['init()', 'use()', 'listen()'], 'Owns the application lifecycle and mounts middleware.', [1, 2, 3]],
    ['Request', 'lib/request.js', 2, 'gates', ['get()', 'accepts()', 'is()'], 'Adds request header, content negotiation and URL helpers.', [4]],
    ['Response', 'lib/response.js', 2, 'response', ['send()', 'json()', 'redirect()'], 'Formats and sends responses, JSON and redirects.', [4]],
    ['View', 'lib/view.js', 1, 'templates', ['View()', 'render()', 'lookup()'], 'Resolves templates and invokes the render engine.', []],
    ['Utilities', 'lib/utils.js', 1, 'workbench', ['normalizeType()', 'compileETag()', 'compileQueryParser()'], 'Shares normalization and configuration helpers across Express.', []],
  ] },
  flask: { name: 'Flask', slug: 'pallets/flask', groups: [
    ['Application', 'src/flask/app.py', 3, 'control', ['Flask()', 'run()', 'full_dispatch_request()'], 'Dispatches requests and handles application lifecycle.', [1, 2, 3]],
    ['Blueprints', 'src/flask/blueprints.py', 2, 'gates', ['Blueprint()', 'register()'], 'Registers reusable groups of routes and callbacks.', [0]],
    ['Templating', 'src/flask/templating.py', 3, 'templates', ['render_template()', 'stream_template()'], 'Renders and streams Jinja templates.', []],
    ['Sessions', 'src/flask/sessions.py', 0, 'lockers', ['open_session()', 'save_session()'], 'Loads and saves signed cookie sessions through its session interface.', []],
    ['Helpers', 'src/flask/helpers.py', 1, 'workbench', ['url_for()', 'get_flashed_messages()'], 'Provides commonly used request and response utilities.', []],
    ['Wrappers', 'src/flask/wrappers.py', 2, 'gates', ['Request()', 'Response()'], 'Extends the Werkzeug request and response classes.', []],
  ] },
  vite: { name: 'Vite', slug: 'vitejs/vite', groups: [
    ['CLI', 'packages/vite/src/node/cli.ts', 3, 'control', ['dev()', 'build()', 'preview()'], 'Exposes the dev, build, and preview commands.', [1, 2, 4]],
    ['Dev Server', 'packages/vite/src/node/server/index.ts', 2, 'gates', ['createServer()', 'restartServer()'], 'Sets up middleware and runs the development server.', [3, 4, 5]],
    ['Build', 'packages/vite/src/node/build.ts', 1, 'build', ['build()', 'createBuilder()'], 'Configures and runs the production build.', [4]],
    ['Plugins', 'packages/vite/src/node/plugins/index.ts', 1, 'control', ['resolvePlugins()'], 'Assembles the plugin pipeline from built-in and user plugins.', []],
    ['Config', 'packages/vite/src/node/config.ts', 1, 'control', ['resolveConfig()', 'loadConfigFromFile()'], 'Loads project configuration and resolves build and server options.', []],
    ['Module Graph', 'packages/vite/src/node/server/moduleGraph.ts', 0, 'graph', ['getModuleByUrl()', 'invalidateModule()'], 'Tracks module relationships and invalidation for the dev server.', []],
  ] },
};

export function exampleModel(key) {
  if (key === 'tiny') return tiny;
  const { name, slug, groups } = examples[key];
  return {
    name, slug, kind: 'snapshot', rooms: groups.map(([title, path, floor, prop, functions, description, deps, cue = exhibits[prop][0]], i) => {
      return room(String(i), title, floor, path, prop, cue, description, 'normal', null, functions, description, deps.map(String));
    }),
  };
}
