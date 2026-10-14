async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || res.statusText)
  }
  return data as T
}

export const api = {
  status: () =>
    request<{ authenticated: boolean; login: string | null; local?: boolean }>('/api/auth/status'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  articles: () => request<{ articles: { path: string; title: string }[] }>('/api/articles'),
  getFile: (path: string) =>
    request<{ path: string; content: string; encoding: string }>(
      `/api/file?path=${encodeURIComponent(path)}`
    ),
  putFile: (body: { path: string; content: string; encoding?: string; message?: string }) =>
    request('/api/file', { method: 'PUT', body: JSON.stringify(body) }),
  getNav: () => request<any>('/api/nav'),
  putNav: (body: any) => request('/api/nav', { method: 'PUT', body: JSON.stringify(body) }),
  createArticle: (body: {
    section: string
    slug: string
    title: string
    navSectionText?: string
  }) => request('/api/articles', { method: 'POST', body: JSON.stringify(body) }),
  reset: () => request<{ restored: string[] }>('/api/reset', { method: 'POST' })
}
