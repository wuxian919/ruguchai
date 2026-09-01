export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });

  // If 401, redirect to login
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    return res;
  }

  return res;
}
