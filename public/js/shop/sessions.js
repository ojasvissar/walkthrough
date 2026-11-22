const sessions = new Map();
export function issueSession(user) {
  const session = { id: crypto.randomUUID(), email: user.email };
  sessions.set(session.id, session);
  return session;
}

export function readSession(id) {
  return sessions.get(id);
}

export function revokeSession(id) {
  return sessions.delete(id);
}
