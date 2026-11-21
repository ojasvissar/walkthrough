export async function submitLogin(email, password, handleLogin) {
  return handleLogin({ email, password });
}

export function showResult(response) {
  return response;
}
