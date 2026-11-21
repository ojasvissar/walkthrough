export async function handleLogin(input, { normalize, find, validate, issue }) {
  const email = await normalize(input.email);
  const user = await find(email);
  if (!await validate(user, input.password)) return respond(401, null);
  const session = await issue(user);
  return { status: 200, session };
}

export function respond(status, session) {
  return { status, session };
}
