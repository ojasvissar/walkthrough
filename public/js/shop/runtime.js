import * as defaultAuth from './auth.js';
import { findUser, credentials } from './users.js';
import { issueSession } from './sessions.js';
import { submitLogin, showResult } from './login.js';
import { handleLogin, respond } from './routes.js';
import { getFault, patchFor } from './faults.js';

export { credentials, patchFor };
export const repairPatch = patchFor();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class Shop {
  constructor(auth = defaultAuth) {
    this.auth = auth;
    this.normalizer = auth.normalizeEmail;
    this.fault = null;
    this.broken = false;
    this.sequence = 0;
  }

  breakLogin(name = 'case') {
    const fault = getFault(name);
    if (!fault) throw new Error('Choose a supported demo fault.');
    this.normalizer = fault.normalize;
    this.fault = name;
    this.broken = true;
  }

  repair() {
    this.normalizer = this.auth.normalizeEmail;
    this.fault = null;
    this.broken = false;
  }

  async login(email, password, receive, { slow = false, test = false, animated = true } = {}) {
    const trace = { id: ++this.sequence, label: test ? 'Login regression test' : 'POST /login', events: [], result: 'running' };
    const start = performance.now();
    const record = (room, operation, delay, status) => {
      const event = { room, operation, status, time: Math.round(performance.now() - start), delay };
      trace.events.push(event);
      receive(event, trace);
    };
    const instrument = (room, operation, fn, { delay = 680, status = 'running' } = {}) => async (...args) => {
      record(room, operation, delay, status);
      if (animated && delay) await wait(delay);
      return fn(...args);
    };

    const modules = {
      normalize: instrument('auth', 'normalizeEmail(email)', this.normalizer),
      find: instrument('users', 'findUser(email)', findUser, { delay: slow ? 2350 : 830, status: 'waiting' }),
      validate: instrument('auth', 'validateCredentials(user, password)', this.auth.validateCredentials),
      issue: instrument('sessions', 'issueSession(user)', issueSession),
    };
    const route = instrument('routes', 'handleLogin(request)', (input) => handleLogin(input, modules));
    const submit = instrument('login', test ? 'submitLogin(test fixture)' : 'submitLogin(credentials)', submitLogin);
    const response = await submit(email, password, route);
    if (response.status !== 200) {
      trace.result = 'failed';
      record('auth', test ? 'Expected a session for mixed-case email' : 'Credentials were rejected', 0, 'failed');
      return { trace, ...response };
    }
    const send = instrument('routes', 'respond(200, session)', respond);
    const result = await send(response.status, response.session);
    trace.result = 'pass';
    const display = instrument('login', 'showResult(session)', showResult, { delay: 500, status: 'passed' });
    return { trace, ...await display(result) };
  }

  async test(receive, options = {}) {
    return this.login('  Shopper@TinyShop.Test  ', credentials.password, receive, { ...options, test: true });
  }
}

export async function detectRuntime() {
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) return false;
  try {
    const answer = await fetch('./api/palace/runtime', { signal: AbortSignal.timeout(1500) });
    if (!answer.ok) return false;
    const runtime = await answer.json();
    return runtime.engine === 'node' ? runtime : false;
  } catch {
    return false;
  }
}

export async function streamRuntime(operation, input, receive, id) {
  const response = await fetch('./api/palace/' + operation, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Palace-Demo': 'trace' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok || !response.body) throw new Error('The local demo server did not start the trace.');
  const trace = { id, events: [] };
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const entry = JSON.parse(line);
        trace.result = entry.trace.result;
        if (entry.done) return { status: entry.status, trace };
        trace.label = entry.trace.label;
        trace.events.push(entry.event);
        receive(entry.event, trace);
      }
    }
  } finally {
    await reader.cancel();
  }
  throw new Error('The local demo server ended the trace early.');
}

export async function apiAction(operation, payload = {}, signal = AbortSignal.timeout(65_000)) {
  const response = await fetch('./api/palace/' + operation, {
    method: 'POST', body: JSON.stringify(payload), signal,
    headers: { 'Content-Type': 'application/json', 'X-Palace-Demo': 'trace' },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The presenter runtime did not complete this action.');
  return result;
}
