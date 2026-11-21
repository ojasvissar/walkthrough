import { readHeader } from './middleware.js';

export function sessionHeader() {
  return 'x-session';
}

export function hasSessionHeader(headers) {
  return Boolean(readHeader(headers));
}
