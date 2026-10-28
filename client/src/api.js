export async function request(path = '', { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api/todos${path}`, {
      method, signal,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
  if (data === null) throw new Error('The server returned an unexpected response. Please try again.');
  return data;
}
