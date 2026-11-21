import { readSession } from './sessions.js';
import { sessionHeader } from './session-headers.js';

export function readHeader(headers) {
  return headers[sessionHeader()];
}

export function requireSession(headers) {
  return readSession(readHeader(headers));
}
