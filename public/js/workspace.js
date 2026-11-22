import { tiny, floors, quiz, exampleModel } from './architecture/presets.js';
import { Palace, drawMnemonic } from './simulation/building-scene.js';
import { importModel, scanGitHub } from './architecture/repository.js';
import { Shop, apiAction, credentials, detectRuntime, patchFor, streamRuntime } from './shop/runtime.js';
import { fixed, faults } from './shop/faults.js';
import { setupExperience } from './demo/presentation.js';
import { memoryStation } from './demo/story.js';
import { setupAsk } from './ask/ask-panel.js';

const paths = {
  'door-logo': '<path d="M2.8 21h18.4M5.4 20.8V4.5a2 2 0 0 1 2-2h8.9a2 2 0 0 1 2 2v16.3M10.5 17.2h2.3" stroke-width="1.7"/><path d="M8.4 6.3h2.4v2.4H8.4zm4.8 3.4h2.4v2.4h-2.4zm-4.8 4.1h2.4v2.4H8.4z" fill="#a8bcf9" stroke="none"/>',
  flag: '<path d="M6 21V3m0 1h12l-2.6 4.5L18 13H6"/>',
  building: '<rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M4.5 9h15m-15 5h15"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 6-2 7.5-2 9h16c0-1.5-2-3-2-9m-8 12a2.2 2.2 0 0 0 4 0"/>',
  'small-spark': '<path d="M12 3c.8 5.2 3.8 8.2 9 9-5.2.8-8.2 3.8-9 9-.8-5.2-3.8-8.2-9-9 5.2-.8 8.2-3.8 9-9Z"/>',
  mark: '<path fill="currentColor" stroke="none" d="m12 2 10 5.5L12 13 2 7.5 12 2ZM2 11l10 5.5L22 11v3l-10 5.5L2 14v-3Zm0 5.5 10 5.5 10-5.5v2.5L12 24 2 19v-2.5Z"/>',
  cube: '<path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 10 9-5M3 8l9 5v8"/>',
  github: '<path d="M9 19c-4.3 1.3-4.3-2-6-2.5m12 4v-3.4c0-1 .1-1.4-.5-2 2.8-.3 5.7-1.4 5.7-6.2 0-1.4-.5-2.5-1.3-3.4.2-.3.6-1.6-.1-3.3 0 0-1-.3-3.4 1.3a12 12 0 0 0-6.2 0C6.8 1.9 5.8 2.2 5.8 2.2c-.7 1.7-.3 3-.1 3.3-.8.9-1.3 2-1.3 3.4 0 4.8 2.9 5.7 5.7 6.1-.4.4-.6 1-.6 2v3.5"/>',
  trace: '<path d="M2 12h4l3-7 4 14 3-7h6"/>',
  quiz: '<path d="M9 9a3 3 0 0 1 6 0c0 2-3 2.5-3 5m0 3h.01"/><circle cx="12" cy="12" r="9"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  help: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M14 10h.01M17 10h.01M8 14h8"/>',
  orbit: '<ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="2"/>',
  walk: '<circle cx="14" cy="4" r="1.5"/><path d="m5 12 4-3 4-1 3 4 3 1m-8-3-2 6-4 4m5-7 4 4 1 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  reset: '<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6"/>',
  expand: '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>',
  spark: '<path d="M12 2c1 6 4 9 10 10-6 1-9 4-10 10C11 16 8 13 2 12c6-1 9-4 10-10Z"/>',
  bug: '<rect x="7" y="7" width="10" height="13" rx="5"/><path d="M9 3l2 4m4-4-2 4m-6 4-4-2m4 6H3m4 3-3 3m13-10 4-2m-4 6h4m-4 3 3 3m-8-11v9"/>',
  tool: '<path d="M14 6a5 5 0 0 0-6 6L3 17a2.8 2.8 0 1 0 4 4l5-5a5 5 0 0 0 6-6l-3 3-4-4 3-3Z"/>',
  play: '<path d="m8 5 12 7-12 7Z"/>',
  cross: '<path d="m6 6 12 12m0-12L6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  signpost: '<path d="M12 2v20M5 5h12l3 3-3 3H5zm14 8H7l-3 3 3 3h12z"/>',
};
const icon = (name) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || '') + '</svg>';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const fillIcons = (root) => $$('[data-icon]', root).forEach((node) => { node.innerHTML = icon(node.dataset.icon); });
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]);
fillIcons(document);

const stage = $('#stage');
const viewport = $('#viewport');
const inspector = $('#room-inspector');
const picker = $('#floor-picker');
const modal = $('#modal');
const message = $('#repo-message');
const exampleMenu = $('#example-menu');
const shop = new Shop();
const liveNode = detectRuntime();
let palace;
try {
  palace = new Palace(viewport, $('#room-labels'), (id) => selectRoom(id), showGameLocation, inspectGameRoom);
} catch {
  stage.dataset.fallback = 'true';
}
window.addEventListener('walkthrough:theme', (event) => palace?.setTheme(event.detail));

let model;
let selected;
let step = 0;
let incident;
let activeTrace;
let activeFloor;
let busy = false;
let scan;
let camera = 'orbit';
let tab = 'tour';
let view = 'room';
const history = [];
const visited = new Set();
let gameLocation;
let activeFault;
let repairingFault;
let experience;
let pullRequest;
let askPanel;

function badge(room) {
  if (incident === room.id) return '<span class="room-chip alert">TEST FAILING</span>';
  const status = { hot: ['HOTSPOT', 'alert'], dust: ['UNUSED', 'dim'], cycle: ['IMPORT CYCLE', 'dim'] }[room.status];
  if (!status) return '';
  return '<span class="room-chip ' + status[1] + '">' + status[0] + '</span>';
}

function loadModel(next) {
  askPanel?.cancel();
  experience?.reset();
  scan?.abort();
  scan = null;
  $('#build-button').disabled = false;
  model = next;
  visited.clear();
  gameLocation = null;
  incident = null;
  activeFault = null;
  repairingFault = null;
  pullRequest = null;
  activeFloor = null;
  setAct(0);
  setNav('tour');
  updateTopIndicators();
  if (shop.broken) shop.repair();
  palace?.load(model);
  setCamera('orbit');
  const imported = ['github', 'codex'].includes(model.kind);
  const coverage = imported ? model.readCount.toLocaleString() + ' of ' + model.fileCount.toLocaleString() + ' supported source files read' : '';
  const title = $('#repo-title');
  title.replaceChildren(document.createTextNode(model.name), Object.assign(document.createElement('span'), { textContent: '.' }));
  title.title = model.name;
  document.title = 'WalkThrough — ' + model.name;
  const slug = $('#repo-slug');
  slug.textContent = model.slug;
  slug.title = imported ? model.slug + ' · ' + coverage + (model.truncated ? ' from a partial repository tree' : '') : model.slug;
  $('#repo-mode').textContent = { demo: 'DEMO REPOSITORY', snapshot: 'PRELOADED SNAPSHOT', github: 'GITHUB REPOSITORY', codex: 'CODEX ARCHITECTURE', import: 'IMPORTED MODEL' }[model.kind];
  $('#stage-summary').textContent = '4 floors · ' + model.rooms.length + ' ' + (model.rooms.length === 1 ? 'room' : 'rooms');
  $('#footer-state').textContent = model.kind === 'demo' ? 'Demo runtime ready' : 'Architecture ready';
  $('#show-history').hidden = model.kind !== 'demo';
  setStageStatus(palace ? '' : '3D is unavailable. Select a room from the list.');
  if (model.kind === 'demo') liveNode.then((local) => {
    if (local && model === next && !busy && step === 0) $('#footer-state').textContent = 'Local Node runtime ready';
  });
  renderFloorPicker();
  if (!palace) renderFallback();
  selectRoom(model.rooms.some((r) => r.id === 'auth') ? 'auth' : model.rooms[0].id);
}

function renderFallback() {
  viewport.innerHTML = '<div class="fallback">' + floors.map((floor, i) => {
    if (activeFloor != null && activeFloor !== i) return '';
    const rooms = model.rooms.filter((room) => room.floor === i);
    return rooms.length ? '<p>' + floor.title + '</p><div>' + rooms.map((room) => '<button class="btn" data-room="' + escape(room.id) + '">' + escape(room.name) + '</button>').join('') + '</div>' : '';
  }).reverse().join('') + '</div>';
  $$('[data-room]', viewport).forEach((button) => button.onclick = () => selectRoom(button.dataset.room));
}

function renderFloorPicker() {
  picker.innerHTML = floors.map((floor, i) => '<button class="floor-button" data-floor="' + i +
    '" aria-pressed="false" aria-label="' + floor.title + ' floor" title="' + floor.title + ' floor" style="--floor:' + floor.surface +
    '"><span>0' + (i + 1) + '</span><b class="floor-name">' + floor.title + '</b></button>').reverse().join('');
  $$('[data-floor]', picker).forEach((button) => button.onclick = () => {
    const floor = Number(button.dataset.floor);
    if (camera === 'walk') return;
    activeFloor = activeFloor === floor ? null : floor;
    palace?.focus(floor);
    if (!palace) renderFallback();
    syncFloorButtons();
    const first = model.rooms.find((entry) => entry.floor === floor);
    if (first && activeFloor != null) selectRoom(model.rooms.find((entry) => entry.floor === floor && entry.id === selected)?.id || first.id);
  });
}
function syncFloorButtons() {
  const playing = camera === 'walk';
  const floor = playing ? gameLocation?.floor : activeFloor;
  $$('[data-floor]', picker).forEach((button) => {
    button.disabled = playing;
    button.setAttribute('aria-pressed', String(floor === Number(button.dataset.floor)));
  });
}

function selectRoom(id, showRoom = true) {
  if (!model.rooms.some((r) => r.id === id)) return;
  selected = id;
  palace?.select(id);
  if (showRoom) view = 'room';
  renderInspector();
}

function renderInspector() {
  if (view === 'trace' && activeTrace) {
    renderTraceInspector(activeTrace);
    return;
  }
  const room = model.rooms.find((r) => r.id === selected);
  const floor = floors[room.floor];
  const index = model.rooms.indexOf(room) + 1;
  const pad = (n) => String(n).padStart(2, '0');
  $('#room-count').textContent = pad(index) + ' / ' + pad(model.rooms.length);
  const action = incident === room.id
    ? '<button class="btn danger" id="room-repair">' + icon('tool') + 'Repair</button>' : '';
  inspector.innerHTML = '<div class="room-meta"><span class="room-chip">F' + pad(room.floor + 1) + ' · ' +
    floor.title.toUpperCase() + '</span>' + badge(room) + '</div><h2>' + escape(room.name) +
    '</h2><p class="room-path">' + icon('file') + '<span>' + escape(room.path) + '</span></p>' +
    '<div class="mnemonic"><div class="mnemonic-text"><small>Inside the room</small><strong>' + escape(room.cue) +
    '</strong><p>' + escape(room.mnemonic) + '</p></div><canvas width="196" height="196" aria-hidden="true"></canvas></div>' +
    '<p class="section-label">Key functions</p>' + (room.functions.length
      ? '<ul class="fn-list">' + room.functions.map((fn, i) => '<li><button data-fn="' + i + '"><span>' + icon('code') + escape(fn) +
        '</span><small>' + escape(memoryStation(fn, room).title) + '</small></button></li>').join('') + '</ul>'
      : '<p class="room-instruction">No function names were captured for this room.</p>') +
    '<div class="room-footer ' + (action ? '' : 'one') + '"><button class="btn dark" id="explain">' + icon('spark') + 'Explain room</button>' + action + '</div>';
  drawMnemonic($('canvas', inspector), room.prop);
  $('#explain', inspector).onclick = () => explain(room);
  $('#room-repair', inspector)?.addEventListener('click', openRepair);
  $$('[data-fn]', inspector).forEach((button) => button.onclick = () => explain(room, room.functions[Number(button.dataset.fn)]));
}

const functionDetails = {
  'validateCredentials()': 'Checks the submitted password against the user record. If the record lookup returns nothing, validation fails and no session is created.',
  'issueSession()': 'Creates and stores a fresh session for the authenticated shopper.',
  'revokeSession()': 'Represents the session cleanup path in the demo architecture.',
  'normalizeEmail()': 'Trims whitespace and lowercases the address before the user lookup.',
  'validatePayment()': 'Checks the amount and currency before the checkout flow can persist the order.',
  'findUser()': 'Uses the normalized email as the lookup key. Turn on the slow lookup in the login form to see the request wait here.',
  'handleLogin()': 'Receives the login request, calls the authentication flow and produces the response.',
};

function explain(room, fn) {
  const linked = room.dependencies.map((id) => model.rooms.find((other) => other.id === id)).filter(Boolean);
  const origin = { demo: 'Demo architecture', github: 'GitHub scan', codex: 'Codex architecture', snapshot: 'Preloaded snapshot', import: 'Imported architecture' }[model.kind];
  const file = room.functionSources?.[fn] || room.path;
  const source = ['github', 'codex', 'snapshot'].includes(model.kind)
    ? '<a class="btn" target="_blank" rel="noopener noreferrer" href="https://github.com/' + model.slug.split('/').map(encodeURIComponent).join('/') +
      '/blob/' + (model.branch ? encodeURIComponent(model.branch) : 'HEAD') + '/' + file.split('/').map(encodeURIComponent).join('/') + '">' + icon('github') + 'View source</a>' : '';
  const stats = [room.files && room.files + ' mapped files', room.loc && room.loc + (model.kind === 'github' ? ' sampled lines' : ' lines'), room.changed && room.changed + ' recent commits'].filter(Boolean);
  openDialog(fn || room.name, origin,
    '<p>' + escape(fn && model.kind === 'demo' && functionDetails[fn] ? functionDetails[fn] : room.description) + '</p>' +
    (fn ? '<p><strong>Room exhibit.</strong> ' + escape(memoryStation(fn, room).title) + '.</p>' : '') +
    (stats.length ? '<p class="room-path">' + escape(stats.join(' · ')) + '</p>' : '') +
    (linked.length ? '<div><p class="section-label">Doors to dependencies</p><div class="dialog-actions">' +
      linked.map((entry) => '<button class="btn" data-jump="' + escape(entry.id) + '">' + icon('folder') + escape(entry.name) + '</button>').join('') + '</div></div>' : '') +
    '<div class="dialog-actions">' + source + '<button class="btn primary" id="explain-codex" hidden>' + icon('spark') +
    'Explain with Codex</button></div><p id="explain-result" role="status" hidden></p>', (content) => {
      const button = $('#explain-codex', content);
      const result = $('#explain-result', content);
      const repo = model;
      liveNode.then((runtime) => { button.hidden = !runtime?.codex; });
      button.onclick = async () => {
        button.disabled = true;
        result.hidden = false;
        result.textContent = 'Codex is reading this module…';
        try {
          const reply = await apiAction('explain', { slug: repo.slug, branch: repo.branch || 'HEAD', file, fn, description: room.description });
          result.textContent = reply.explanation;
        } catch (error) { result.textContent = error.message; }
        finally { button.disabled = false; }
      };
      $$('[data-jump]', content).forEach((button) => button.onclick = () => {
        modal.close();
        if (activeFloor != null && camera === 'orbit') resetView();
        selectRoom(button.dataset.jump);
      });
    });
}

function setStageStatus(status, failed = false) {
  const box = $('#stage-status');
  box.textContent = status;
  box.hidden = !status;
  box.classList.toggle('failed', failed);
}

function setAct(index) {
  step = index;
  for (const button of $$('[data-act]')) {
    const act = Number(button.dataset.act);
    const needsDemo = act > 0 && model?.kind !== 'demo';
    button.classList.toggle('active', step === act);
    button.setAttribute('aria-pressed', String(step === act));
    button.disabled = act > 0 && (busy || needsDemo);
    button.title = needsDemo ? 'Available in The Tiny Shop' : '';
  }
}

function setNav(name) {
  tab = name;
  for (const button of $$('[data-nav]')) {
    button.classList.toggle('current', button.dataset.nav === name);
    if (button.dataset.nav === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
}

function setCamera(mode) {
  if (camera !== mode || mode === 'orbit') {
    activeFloor = null;
    gameLocation = null;
  }
  camera = mode;
  const playing = mode === 'walk' && palace;
  stage.dataset.camera = mode;
  palace?.setMode(mode, model?.rooms.find((room) => room.id === selected)?.floor ?? 1);
  $('#stage-title-text').textContent = playing ? 'Palace walkthrough' : 'Architecture view';
  $('#stage-summary').textContent = playing ? 'Third-person exploration' : '4 floors · ' + model.rooms.length + ' ' + (model.rooms.length === 1 ? 'room' : 'rooms');
  $$('[data-camera]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.camera === mode));
  });
  syncFloorButtons();
  if (playing) {
    viewport.querySelector('canvas')?.focus({ preventScroll: true });
    setStageStatus('');
  } else if (!busy && !incident) setStageStatus(palace ? '' : '3D is unavailable. Select a room from the list.');
}

function showGameLocation(location) {
  const wasInside = gameLocation?.inside;
  gameLocation = location;
  const room = model.rooms.find((entry) => entry.id === location.inside);
  const nearby = model.rooms.find((entry) => entry.id === location.nearby);
  const floor = location.floor + 1;
  const climbing = location.stair != null;
  $('#game-floor').textContent = climbing ? 'F0' + (location.stair + 1) + ' / F0' + (location.stair + 2) : 'F0' + floor + ' · ' + floors[location.floor].title;
  $('#game-area').textContent = climbing ? 'Stairwell' : room?.name || 'Hallway';
  $('#game-detail').textContent = climbing ? 'Follow the rail around the landing.' : room
    ? room.cue + ' · E to inspect' : nearby ? 'Walk through the doorway to ' + nearby.name + '.' : 'Stairs at the right end of the hall.';
  $('#inspect-nearby').hidden = !nearby;
  if (room && room.id !== wasInside) {
    visited.add(room.id);
    selectRoom(room.id);
  }
  $('#game-progress').textContent = visited.size + ' / ' + model.rooms.length + ' rooms visited';
  syncFloorButtons();
}

function inspectGameRoom(id, fn) {
  const room = model.rooms.find((entry) => entry.id === id);
  if (!room) return;
  selectRoom(id);
  explain(room, fn);
}

function resetView() {
  activeFloor = null;
  palace?.reset();
  syncFloorButtons();
  if (!palace) renderFallback();
}

function openDialog(title, kicker, markup, bind, surface = '') {
  modal.dataset.surface = surface;
  if (!modal.open) {
    modal.replaceChildren($('#dialog-shell').content.cloneNode(true));
    fillIcons(modal);
  }
  const head = $('.dialog-head>div', modal);
  const content = $('.dialog-content', modal);
  head.innerHTML = '<p class="section-label">' + escape(kicker) + '</p><h2 id="dialog-title">' + escape(title) + '</h2>';
  modal.setAttribute('aria-labelledby', 'dialog-title');
  content.innerHTML = markup;
  bind?.(content);
  if (!modal.open) modal.showModal();
}

function offerDemo(action) {
  openDialog('Use The Tiny Shop', 'Demo runtime', '<p>The Tiny Shop is the runnable demo. Load it to trace a request, break the login test, or repair it.</p>' +
    '<button class="btn primary" id="load-demo">' + icon('cube') + 'Load The Tiny Shop</button>', (content) => {
    $('#load-demo', content).onclick = () => {
      modal.close();
      loadModel(tiny);
      action();
    };
  });
}
function isDemo(action) {
  if (model.kind === 'demo') return true;
  offerDemo(action);
  return false;
}

function openLogin() {
  if (!isDemo(openLogin)) return;
  if (busy && activeTrace) {
    view = 'trace';
    return renderInspector();
  }
  openDialog('Sign in to The Tiny Shop', 'Live request', '<p>Submit the demo account and follow its request through the building.</p>' +
    '<form id="login-form"><label>Email<input name="email" required value="' + credentials.email + '"></label>' +
    '<label>Password<input name="password" type="password" required value="' + credentials.password + '"></label>' +
    '<label class="check"><input type="checkbox" name="slow">Simulate a slow user lookup</label>' +
    '<button class="btn primary" type="submit">' + icon('trace') + 'Log in and trace</button></form>' +
    '<a class="text-btn" href="./shop.html" target="_blank" rel="noopener">' + icon('cube') + 'Open The Tiny Shop in a new tab</a>', (content) => {
    $('#login-form', content).onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      modal.close();
      runAct(1, (receive) => runLogin('login', receive, { email: form.get('email'), password: form.get('password'), slow: form.has('slow') }));
    };
  });
}

function openBreak() {
  if (!isDemo(openBreak) || busy) return;
  openDialog('Break the login test', 'Pick a line to break', '<p>Choose which operation to remove from the email normalizer. The same regression test runs either way.</p>' +
    '<label>Fault<select id="fault-choice"><option value="case">Remove lowercasing</option><option value="space">Remove trimming</option></select></label>' +
    '<pre class="patch" id="fault-diff"></pre><button id="break-confirm" class="btn danger">' + icon('bug') + 'Break and run test</button>', (content) => {
    const choice = $('#fault-choice', content);
    const display = $('#fault-diff', content);
    const show = () => { display.innerHTML = '<span class="del">- ' + fixed + '</span>\n<span class="add">+ ' + faults[choice.value].line + '</span>'; };
    choice.onchange = show;
    show();
    $('#break-confirm', content).onclick = () => {
      modal.close();
      activeFault = choice.value;
      repairingFault = null;
      pullRequest = null;
      shop.breakLogin(activeFault);
      runAct(2, (receive) => runLogin('test', receive, { fault: activeFault }));
    };
  });
}

function openRepair() {
  if (!isDemo(openRepair) || busy) return;
  if (!shop.broken || !activeFault) {
    openDialog('Start with a failing test', 'Repair', '<p>The login regression test is ready. Trigger the fault to see the repair and its verification.</p>' +
      '<button class="btn danger" id="trigger-fault">' + icon('bug') + 'Trigger the fault</button>', (content) => {
      $('#trigger-fault', content).onclick = openBreak;
    });
    return;
  }
  const fault = activeFault;
  const failedTrace = history.find((record) => record.label === 'Login regression test' && record.result === 'failed');
  openDialog('Restore email normalization', 'Repair Auth Service',
    '<p>' + (failedTrace ? 'Trace ' + failedTrace.id + ' failed in Auth Service. ' : '') + 'Restore the lookup key and rerun the same test.</p>' +
    '<pre class="patch"><span class="del">- ' + faults[fault].line + '</span>\n<span class="add">+ ' + fixed + '</span></pre>' +
    '<p id="codex-diagnosis" role="status" hidden></p><div class="dialog-actions">' +
    '<button class="btn primary" id="apply-repair">' + icon('tool') + 'Apply patch and verify</button>' +
    '<button class="btn" id="codex-repair" hidden>' + icon('spark') + 'Ask Codex</button></div>', (content) => {
    const ask = $('#codex-repair', content);
    const apply = $('#apply-repair', content);
    const diagnosis = $('#codex-diagnosis', content);
    let proposed = false;
    let attempted = false;
    const getProposal = async () => {
      attempted = true;
      diagnosis.hidden = false;
      diagnosis.textContent = 'Codex is reading the failing source and trace…';
      ask.disabled = true;
      apply.disabled = true;
      try {
        const result = await apiAction('repair', { fault });
        diagnosis.textContent = result.diagnosis;
        proposed = true;
        return true;
      } catch (error) {
        diagnosis.textContent = error.message;
        return false;
      } finally { ask.disabled = false; apply.disabled = false; }
    };
    liveNode.then((runtime) => {
      ask.hidden = !runtime?.codex;
      if (runtime?.codex && !attempted) apply.innerHTML = icon('spark') + 'Repair with Codex';
    });
    ask.onclick = async () => {
      if (await getProposal()) apply.innerHTML = icon('tool') + 'Apply Codex patch and verify';
    };
    apply.onclick = async () => {
      if ((await liveNode)?.codex && !attempted && !proposed) {
        const ok = await getProposal();
        apply.innerHTML = icon('tool') + (ok ? 'Apply Codex patch and verify' : 'Apply fallback patch and verify');
        if (!ok || !modal.open || !apply.isConnected) return;
      }
      modal.close();
      repairingFault = fault;
      shop.repair();
      runAct(3, (receive) => runLogin('test', receive, { fault, repair: true }));
    };
  });
}

function downloadPatch() {
  const object = URL.createObjectURL(new Blob([patchFor(repairingFault || 'case')], { type: 'text/x-diff' }));
  const link = Object.assign(document.createElement('a'), { href: object, download: 'walkthrough-login-repair.patch' });
  link.click();
  setTimeout(() => URL.revokeObjectURL(object), 5000);
}

async function openPullRequest() {
  const target = (await liveNode)?.pr;
  if (!target) return openDialog('Set up a draft pull request', 'GitHub target',
    '<p>Use a GitHub repository and branch you control. The branch must contain the faulty Tiny Shop auth line. Sign in with the GitHub CLI, then start the presenter with your target.</p>' +
    '<pre class="patch">WALKTHROUGH_PR_REPO=owner/repo\nWALKTHROUGH_PR_BASE=demo-broken</pre>' +
    '<p>Download the verified patch to prepare a demo branch or apply the repair manually.</p>');
  openDialog('Open the repair on GitHub', 'Draft pull request', '<p>Push the verified one-line patch and open a draft against <strong>' +
    escape(target.repo + ' @ ' + target.base) + '</strong>.</p><p id="pr-result" role="status"></p>' +
    '<div class="dialog-actions"><button class="btn primary" id="send-pr">' + icon('github') + 'Create draft PR</button></div>', (content) => {
    const send = $('#send-pr', content);
    const result = $('#pr-result', content);
    send.onclick = async () => {
      send.disabled = true;
      result.textContent = 'Pushing the repair branch and opening a draft…';
      try {
        const { url } = await apiAction('pr', {}, AbortSignal.timeout(115000));
        if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/.test(url)) throw new Error('GitHub returned an unexpected link.');
        pullRequest = url;
        result.innerHTML = '<a href="' + escape(url) + '" target="_blank" rel="noopener">View the draft pull request</a>';
        send.hidden = true;
        renderInspector();
      } catch (error) { result.textContent = error.message; send.disabled = false; }
    };
  });
}

function traceLines(trace) {
  return '<div class="trace-lines">' + trace.events.map((event) => '<div class="trace-line ' +
    (event.status === 'failed' ? 'failed' : '') + '"><button data-trace-room="' + event.room + '" title="' +
    escape(model.rooms.find((r) => r.id === event.room)?.name) + '">' + escape(event.operation) +
    '</button><span>' + event.time + ' ms</span></div>').join('') + '</div>';
}

function renderTraceInspector(trace) {
  const passed = trace.result === 'pass';
  const failed = trace.result === 'failed';
  $('#room-count').textContent = '#' + String(trace.id).padStart(3, '0');
  inspector.innerHTML = '<div class="room-meta"><span class="room-chip ' + (failed ? 'alert' : '') + '">' +
    (failed ? 'FAILED' : passed ? 'PASSED' : 'RUNNING') + '</span></div><h2 class="trace-title">' +
    escape(trace.label) + '</h2><p class="trace-report ' + trace.result + '">' +
    (failed ? 'Authentication rejected' : passed ? 'Session created' : 'Request in progress') +
    '</p>' + traceLines(trace) + '<div class="room-footer one">' + (failed && shop.broken
      ? '<button class="btn danger" id="trace-action">' + icon('tool') + 'Inspect and repair</button>'
      : passed && step === 3 ? '<button class="btn dark" id="trace-action">' + icon('code') + 'Download patch</button>'
      : passed || failed ? '<button class="btn dark" id="trace-action">' + icon('trace') + 'Trace another login</button>' : '') + '</div>' +
      (passed && step === 3 ? '<div class="dialog-actions repair-actions">' + (pullRequest
        ? '<a class="btn primary" target="_blank" rel="noopener" href="' + escape(pullRequest) + '">View draft PR</a>'
        : '<button id="open-pr" class="btn primary">' + icon('github') + 'Open draft PR</button>') + '</div>' : '');
  const pr = $('#open-pr', inspector);
  if (pr) {
    pr.onclick = openPullRequest;
  }
  $$('[data-trace-room]', inspector).forEach((button) => button.onclick = () => selectRoom(button.dataset.traceRoom));
  if ($('#trace-action', inspector)) $('#trace-action', inspector).onclick = failed && shop.broken ? openRepair : step === 3 ? downloadPatch : openLogin;
}

async function runLogin(operation, receive, input = {}) {
  if (await liveNode) return streamRuntime(operation, { fault: shop.broken ? activeFault : null, ...input }, receive, ++shop.sequence);
  if (operation === 'test') return shop.test(receive);
  return shop.login(input.email, input.password, receive, { slow: input.slow });
}

async function runAct(index, run) {
  if (busy) return;
  busy = true;
  experience?.reset();
  scan?.abort();
  scan = null;
  message.textContent = '';
  view = 'trace';
  incident = null;
  setAct(index);
  setNav('trace');
  $('#build-button').disabled = true;
  $('#examples').disabled = true;
  setCamera('orbit');
  if (index !== 3) palace?.hideFigure();
  else setStageStatus('Verifying the patched source · Auth Service');
  $('#footer-state').textContent = 'Demo request running';
  let previous;
  let revived = index !== 3;
  updateTopIndicators();
  try {
    const { trace } = await run((event, runningTrace) => {
      activeTrace = runningTrace;
      if (!revived && event.room === 'auth' && event.operation.startsWith('validateCredentials')) {
        palace?.revive('auth');
        previous = 'auth';
        revived = true;
      }
      if (revived) palace?.trace(event.room, previous, Math.min(event.delay * .86, 640));
      const room = model.rooms.find((entry) => entry.id === event.room);
      if (revived) setStageStatus(event.status === 'waiting' ? 'User Store · waiting on lookup' : room.name + ' · ' + event.operation, event.status === 'failed');
      selectRoom(event.room, false);
      if (event.status === 'failed' && shop.broken) {
        incident = event.room;
        palace?.fail(event.room);
        updateTopIndicators();
      }
      if (revived) previous = event.room;
    });
    history.unshift(trace);
    if (history.length > 20) history.pop();
    $('#footer-state').textContent = trace.result === 'pass' ? 'Last request passed' : 'Last request failed';
    setStageStatus(trace.result === 'pass' ? index === 3 ? 'Repair verified · You walked into this codebase three minutes ago, and it’s already fixed.' :
      '200 OK · session created' : '401 · login rejected in Auth Service', trace.result === 'failed');
    if (trace.result === 'failed' && shop.broken) selectRoom('auth');
  } catch (error) {
    setStageStatus(error.message || 'The demo request failed.', true);
    $('#footer-state').textContent = 'Demo error';
  } finally {
    busy = false;
    setAct(index);
    renderInspector();
    updateTopIndicators();
    $('#build-button').disabled = false;
    $('#examples').disabled = false;
  }
}

const shopChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('walkthrough-tiny-shop') : null;
let external;
if (shopChannel) shopChannel.onmessage = ({ data }) => {
  if (!data || typeof data.request !== 'string') return;
  if (data.type === 'begin' && !busy && model.kind === 'demo') {
    const request = data.request;
    if (modal.open) modal.close();
    runAct(1, (receive) => new Promise((done, fail) => {
      const trace = { id: ++shop.sequence, label: 'POST /login', result: 'running', events: [] };
      const timeout = setTimeout(() => { external = null; fail(new Error('The Tiny Shop tab stopped sending trace events.')); }, 30_000);
      external = { request, receive, done, trace, timeout };
    }));
    return;
  }
  if (external?.request !== data.request) return;
  if (data.type === 'event' && external.trace.events.length < 30) {
    const event = data.event;
    if (!event || !tiny.rooms.some((room) => room.id === event.room) || !['running', 'waiting', 'failed', 'passed'].includes(event.status) ||
      typeof event.operation !== 'string' || !Number.isFinite(event.time) || !Number.isFinite(event.delay)) return;
    const clean = { room: event.room, status: event.status, operation: event.operation.slice(0, 160),
      time: Math.min(30_000, Math.max(0, event.time)), delay: Math.max(0, Math.min(event.delay, 2400)) };
    external.trace.events.push(clean);
    external.receive(clean, external.trace);
  }
  if (data.type === 'done') {
    clearTimeout(external.timeout);
    external.trace.result = data.status === 200 ? 'pass' : 'failed';
    external.done({ trace: external.trace });
    external = null;
  }
};

function openHistory() {
  const active = busy && activeTrace && activeTrace.result === 'running';
  const rows = active ? [activeTrace, ...history] : history;
  const historyRows = rows.length ? rows.map((trace) =>
    '<div class="trace-line"><button data-history="' + trace.id + '">#' + trace.id + ' · ' + escape(trace.label) + '</button><span>' +
    (trace.result === 'running' ? 'Running' : trace.result === 'pass' ? 'Passed' : 'Failed') + '</span></div>').join('') :
    '<p>Start a login or regression test to see its execution path here.</p>';
  const isTiny = model.kind === 'demo';
  openDialog('Requests', isTiny ? 'The Tiny Shop' : model.slug,
    (isTiny ? '<div class="dialog-actions"><button class="btn primary" id="new-request">' + icon('trace') + (active ? 'Follow live request' : 'Trace a login') +
      '</button><a href="./shop.html" class="btn" target="_blank" rel="noopener">Open The Tiny Shop</a></div><div class="trace-lines">' + historyRows + '</div>' :
      '<p>Live requests run in The Tiny Shop. Your current map shows the selected repository’s architecture.</p>' +
      '<button class="btn primary" id="new-request">' + icon('trace') + 'Load The Tiny Shop</button>'),
      (content) => {
        $('#new-request', content).onclick = () => {
          if (!isTiny) loadModel(tiny);
          if (active) {
            modal.close();
            view = 'trace';
            renderInspector();
          } else openLogin();
          setNav('trace');
        };
        $$('[data-history]', content).forEach((button) => button.onclick = () => {
          const trace = rows.find((record) => record.id === Number(button.dataset.history));
          openDialog(trace.label, 'Request #' + trace.id, traceLines(trace) +
            '<button class="btn" id="back-requests">All requests</button>', (detail) => {
              $('#back-requests', detail).onclick = openHistory;
              $$('[data-trace-room]', detail).forEach((link) => link.onclick = () => jumpToRoom(link.dataset.traceRoom));
            });
        });
      });
}

function activeAlarms() {
  const items = model.rooms.filter((room) => room.status === 'hot').map((room) => ({
    room, status: 'Hotspot', label: room.changed ? room.changed + ' recent commits touched this room.' :
      'This room changes frequently in the loaded architecture.',
  }));
  const failed = model.rooms.find((room) => room.id === incident);
  if (failed) items.unshift({ room: failed, status: 'Test failed', label: 'The login regression failed in this room.', repair: true });
  return items;
}

function updateTopIndicators() {
  const alarms = activeAlarms();
  const count = $('#nav-alarm-count');
  count.hidden = !alarms.length;
  count.textContent = alarms.length;
  $('#nav-alarms').setAttribute('aria-label', 'Alarms, ' + alarms.length + ' active');
  $('#nav-request-dot').hidden = model.kind !== 'demo';
}

function jumpToRoom(id) {
  modal.close();
  experience?.reset();
  setCamera('orbit');
  setNav('palace');
  selectRoom(id);
  palace?.tourFocus(id);
}

function openAlarms() {
  const alarms = activeAlarms();
  const rows = alarms.map(({ room, status, label, repair }, index) => '<div class="alarm-row"><div>' +
    '<span class="room-chip ' + (repair ? 'alert' : '') + '">' + escape(status) + '</span><strong>' +
    escape(room.name) + '</strong><p>' + escape(label) + '</p></div><div class="dialog-actions">' +
    '<button class="btn" data-alarm="' + index + '">Show room</button>' +
    (repair ? '<button class="btn danger" id="alarm-repair">Repair</button>' : '') + '</div></div>').join('');
  openDialog('Alarms', model.slug, rows || '<p>There are no active hotspots or failed tests in this building.</p>', (content) => {
    $$('[data-alarm]', content).forEach((button) => {
      button.onclick = () => jumpToRoom(alarms[Number(button.dataset.alarm)].room.id);
    });
    const repair = $('#alarm-repair', content);
    if (repair) repair.onclick = openRepair;
  });
}

function openQuiz() {
  const questions = model.kind === 'demo' ? quiz : model.rooms.slice(0, 3).map((room) => {
    const distractors = model.rooms.filter((entry) => entry.id !== room.id && entry.cue !== room.cue).slice(0, 2).map((entry) => entry.name);
    const choices = [room.name, ...distractors].sort((a, b) => a.localeCompare(b));
    return { question: 'Which room contains the ' + room.cue.toLowerCase() + ' exhibit?', choices,
      answer: choices.indexOf(room.name), room: room.id, explanation: room.description };
  });
  let score = 0;
  const show = (index) => {
    if (index >= questions.length) {
      openDialog(score + ' / ' + questions.length + ' correct', 'Palace quiz', '<p>Try another pass through the building and see what you remember.</p>' +
        '<div class="dialog-actions"><button class="btn primary" id="restart-quiz">Play again</button></div>', (content) => {
        $('#restart-quiz', content).onclick = openQuiz;
      });
      return;
    }
    const question = questions[index];
    openDialog(question.question, 'Question ' + (index + 1) + ' of ' + questions.length, '<div class="quiz-answers">' +
      question.choices.map((choice, i) => '<button class="btn quiz-answer" data-choice="' + i + '">' + escape(choice) + '</button>').join('') +
      '</div><div id="quiz-feedback" hidden></div><div class="dialog-actions" id="quiz-actions" hidden><button class="btn primary" id="next-question">' +
      (index + 1 < questions.length ? 'Next question' : 'See score') + '</button><button class="btn" id="quiz-room">Show room</button></div>', (content) => {
      const choices = $$('[data-choice]', content);
      for (const answer of choices) answer.onclick = () => {
        const correct = Number(answer.dataset.choice) === question.answer;
        if (correct) score++;
        for (const choice of choices) {
          choice.disabled = true;
          if (Number(choice.dataset.choice) === question.answer) choice.classList.add('correct');
        }
        if (!correct) answer.classList.add('incorrect');
        const feedback = $('#quiz-feedback', content);
        feedback.hidden = false;
        feedback.textContent = (correct ? 'Correct. ' : 'Answer: ' + question.choices[question.answer] + '. ') + question.explanation;
        $('#quiz-actions', content).hidden = false;
        $('#next-question', content).focus();
      };
      $('#next-question', content).onclick = () => show(index + 1);
      $('#quiz-room', content).onclick = () => {
        modal.close();
        resetView();
        selectRoom(question.room);
      };
    });
  };
  show(0);
}

function clearMenu() {
  exampleMenu.hidden = true;
  $('#examples').setAttribute('aria-expanded', 'false');
}
$('#examples').onclick = () => {
  exampleMenu.hidden = !exampleMenu.hidden;
  $('#examples').setAttribute('aria-expanded', String(!exampleMenu.hidden));
};
document.addEventListener('click', (event) => {
  if (!event.target.closest('.repo-actions')) clearMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !exampleMenu.hidden) {
    clearMenu();
    $('#examples').focus();
  }
});
$$('[data-example]').forEach((button) => button.onclick = () => {
  clearMenu();
  message.textContent = '';
  message.className = '';
  loadModel(exampleModel(button.dataset.example));
});
$('#import-button').onclick = () => {
  clearMenu();
  $('#architecture-file').click();
};
$('#architecture-file').onchange = async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    if (file.size > 200_000) throw new Error('Choose an architecture JSON under 200 KB.');
    const next = importModel(JSON.parse(await file.text()));
    message.textContent = 'Architecture imported.';
    message.className = '';
    loadModel(next);
  } catch (error) {
    message.textContent = error instanceof SyntaxError ? 'The selected file is not valid JSON.' : error.message;
    message.className = 'error';
  } finally {
    event.target.value = '';
  }
};
$('#repo-form').onsubmit = async (event) => {
  event.preventDefault();
  if (busy) return;
  scan?.abort();
  const controller = new AbortController();
  scan = controller;
  $('#build-button').disabled = true;
  message.className = '';
  const url = $('#repo-url').value;
  const useCodex = (await liveNode)?.codex && $('#codex-map').checked;
  const timeout = setTimeout(() => controller.abort(), useCodex ? 152_000 : 42_000);
  try {
    if (scan !== controller) return;
    if (useCodex) message.textContent = 'Codex is reading the repository and its Git history…';
    const next = useCodex ? await apiAction('map', { url }, controller.signal) :
      await scanGitHub(url, (status) => { message.textContent = status; }, controller.signal);
    if (scan !== controller) return;
    message.textContent = 'Building ready.';
    loadModel(next);
  } catch (error) {
    if (scan !== controller) return;
    message.textContent = error.name === 'AbortError' ? 'The scan timed out. Try an example.' : error.message;
    message.className = 'error';
  } finally {
    clearTimeout(timeout);
    if (scan === controller) {
      scan = null;
      $('#build-button').disabled = false;
    }
  }
};

$$('[data-camera]').forEach((button) => {
  button.disabled = !palace;
  button.onclick = () => {
    experience?.reset();
    setCamera(button.dataset.camera);
  };
});
$$('[data-avatar]').forEach((button) => {
  button.onclick = () => {
    palace?.chooseAvatar(button.dataset.avatar);
    $$('[data-avatar]').forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
    viewport.querySelector('canvas')?.focus({ preventScroll: true });
  };
});
$('#inspect-nearby').onclick = () => palace?.interact();
viewport.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && camera === 'walk' && !modal.open) {
    setCamera('orbit');
    $('[data-camera=orbit]').focus({ preventScroll: true });
  }
});
$$('[data-move]').forEach((button) => {
  const key = button.dataset.move;
  button.onpointerdown = (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    palace?.keys.add(key);
  };
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(name, () => palace?.keys.delete(key));
  }
});
$$('[data-zoom]').forEach((button) => {
  button.disabled = !palace;
  button.onclick = () => button.dataset.zoom === 'reset' ? resetView() : palace?.zoom(button.dataset.zoom);
});
$('#full-view').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stage.requestFullscreen();
  } catch {
    stage.classList.toggle('forced-fullscreen');
  }
};
$('#show-help').onclick = () => openDialog('Explore the building', 'Controls',
  '<p><strong>Orbit.</strong> Drag the building or use the arrow keys. Scroll or use + and − to zoom. Select a room to inspect its code and connections.</p>' +
  '<p><strong>Play.</strong> Choose an avatar. Use WASD or the arrow keys to move, Shift to run, and drag to turn the camera. The stairwell at the end of the hall connects all floors. Press E near a doorway or inside a room to inspect it. Escape returns to Orbit.</p>' +
  '<p><strong>Trace.</strong> Use The Tiny Shop’s demo sequence to follow a login, trigger the regression, and verify the repair.</p>');
$('#show-history').onclick = () => { setNav('trace'); openHistory(); };
$('#show-quiz').onclick = openQuiz;
for (const button of $$('[data-nav]')) button.onclick = () => {
  const next = button.dataset.nav;
  setNav(next);
  switch (next) {
    case 'tour': experience.startTour(); break;
    case 'trace': openHistory(); break;
    case 'alarms': openAlarms(); break;
    case 'ask': askPanel.open(); break;
    case 'palace':
      experience.reset();
      setCamera('orbit');
      selectRoom(selected);
      break;
  }
};
modal.addEventListener('close', () => {
  askPanel?.cancel();
  if (camera === 'walk') viewport.querySelector('canvas')?.focus({ preventScroll: true });
  if (tab === 'ask' || tab === 'alarms' || tab === 'trace' && !busy) setNav('palace');
});
for (const button of $$('[data-act]')) button.onclick = () => {
  switch (Number(button.dataset.act)) {
    case 0:
      setAct(0);
      setNav('palace');
      resetView();
      selectRoom(selected);
      if (!busy && !incident) setStageStatus('');
      break;
    case 1: openLogin(); break;
    case 2: openBreak(); break;
    case 3: openRepair(); break;
  }
};

experience = setupExperience({ palace, getModel: () => model, selectRoom, setCamera, showStatus: setStageStatus,
  openDialog, runtime: liveNode, onTourStart: () => setNav('tour') });
askPanel = setupAsk({ openDialog, getModel: () => model, getRoom: () => selected, jump: jumpToRoom });
liveNode.then((runtime) => { $('#codex-option').hidden = !runtime?.codex; });
loadModel(tiny);
