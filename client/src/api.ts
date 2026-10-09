export async function api(path: string, opt: { method?: string; body?: unknown } = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const res = await fetch('/api' + path, {
    method: opt.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: opt.body ? JSON.stringify(opt.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('token');
    location.href = '/login';
  }
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
  return data;
}
