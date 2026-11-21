export const fixed = 'return value.trim().toLowerCase();';
export const faults = {
  case: { label: 'Remove lowercasing', line: 'return value.trim();', normalize: (value) => value.trim() },
  space: { label: 'Remove trimming', line: 'return value.toLowerCase();', normalize: (value) => value.toLowerCase() },
};

export function getFault(name) {
  return Object.hasOwn(faults, name) ? faults[name] : null;
}

export function patchFor(name = 'case') {
  const fault = getFault(name);
  const file = 'dist/auth.js';
  return [
    'diff --git a/' + file + ' b/' + file, '--- a/' + file, '+++ b/' + file, '@@ -1,3 +1,3 @@',
    ' export function normalizeEmail(value) {', '-  ' + fault.line, '+  ' + fixed, ' }', '',
  ].join('\n');
}
