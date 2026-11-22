export function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

export function validateCredentials(user, password) {
  return user?.password === password;
}
