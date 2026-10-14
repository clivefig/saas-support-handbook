const API = 'https://api.github.com'

function repo() {
  const r = process.env.GITHUB_REPO
  if (!r || !r.includes('/')) throw new Error('GITHUB_REPO must be owner/name')
  const [owner, name] = r.split('/')
  return { owner, name }
}

async function gh(token, path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'saas-support-handbook-admin',
      ...(options.headers || {})
    }
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const msg = data?.message || res.statusText
    throw new Error(`GitHub ${res.status}: ${msg}`)
  }
  return data
}

export async function exchangeCode(code) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('GitHub OAuth not configured')
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error_description || data.error)
  return data.access_token
}

export async function getUser(token) {
  return gh(token, '/user')
}

export async function canAdmin(token, login) {
  const allow = (process.env.ADMIN_GITHUB_USERS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (allow.length && allow.includes(String(login).toLowerCase())) {
    return true
  }
  const { owner, name } = repo()
  try {
    const perm = await gh(token, `/repos/${owner}/${name}/collaborators/${login}/permission`)
    return ['admin', 'write', 'maintain'].includes(perm.permission)
  } catch {
    return false
  }
}

export async function getFile(token, path, ref = 'main') {
  const { owner, name } = repo()
  return gh(token, `/repos/${owner}/${name}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${ref}`)
}

/** Decode a GitHub Contents API file into the shape used by the admin UI. */
export async function readGithubFile(token, path, ref = 'main') {
  const data = await getFile(token, path, ref)
  if (Array.isArray(data)) {
    throw new Error('Path is a directory')
  }
  const isText = /\.(md|json|css|html|svg|txt)$/i.test(path)
  const buf = Buffer.from(String(data.content || '').replace(/\n/g, ''), 'base64')
  return {
    path: path.replace(/\\/g, '/'),
    content: isText ? buf.toString('utf8') : buf.toString('base64'),
    encoding: isText ? 'utf8' : 'base64',
    sha: data.sha
  }
}

export async function readGithubJson(token, path, ref = 'main') {
  const file = await readGithubFile(token, path, ref)
  return JSON.parse(file.content)
}

/** List markdown under docs/ via the git tree (no local filesystem). */
export async function listGithubMarkdown(token, branch = 'main') {
  const { owner, name } = repo()
  const ref = await gh(token, `/repos/${owner}/${name}/git/ref/heads/${branch}`)
  const commit = await gh(token, `/repos/${owner}/${name}/git/commits/${ref.object.sha}`)
  const tree = await gh(token, `/repos/${owner}/${name}/git/trees/${commit.tree.sha}?recursive=1`)
  const blocked = ['node_modules', '.vitepress/cache', '.vitepress/dist', 'product/local']
  const results = []
  for (const item of tree.tree || []) {
    if (item.type !== 'blob' || !item.path?.endsWith('.md')) continue
    if (!item.path.startsWith('docs/')) continue
    if (blocked.some((b) => item.path.includes(b))) continue
    const base = item.path.split('/').pop().replace(/\.md$/, '')
    results.push({ path: item.path, title: base })
  }
  return results.sort((a, b) => a.path.localeCompare(b.path))
}

export async function putFile(token, { path, content, message, sha, branch = 'main', encoding = 'utf-8' }) {
  const { owner, name } = repo()
  const body = {
    message,
    content: encoding === 'base64' ? content : Buffer.from(content, 'utf8').toString('base64'),
    branch
  }
  if (sha) body.sha = sha
  return gh(token, `/repos/${owner}/${name}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function commitFiles(token, { message, files, branch = 'main' }) {
  // files: [{ path, content, encoding?: 'utf8'|'base64' }]
  const { owner, name } = repo()
  const ref = await gh(token, `/repos/${owner}/${name}/git/ref/heads/${branch}`)
  const latestCommitSha = ref.object.sha
  const latestCommit = await gh(token, `/repos/${owner}/${name}/git/commits/${latestCommitSha}`)
  const treeItems = files.map((f) => ({
    path: f.path,
    mode: '100644',
    type: 'blob',
    content: f.encoding === 'base64' ? undefined : f.content,
    sha: undefined
  }))

  // For binary/base64, create blobs first
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (f.encoding === 'base64') {
      const blob = await gh(token, `/repos/${owner}/${name}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: f.content, encoding: 'base64' })
      })
      treeItems[i] = { path: f.path, mode: '100644', type: 'blob', sha: blob.sha }
    }
  }

  const tree = await gh(token, `/repos/${owner}/${name}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: latestCommit.tree.sha,
      tree: treeItems.filter((t) => t.content !== undefined || t.sha)
    })
  })

  const commit = await gh(token, `/repos/${owner}/${name}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [latestCommitSha]
    })
  })

  await gh(token, `/repos/${owner}/${name}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha })
  })

  return { sha: commit.sha }
}

export function isLocalMode() {
  return process.env.ADMIN_LOCAL === 'true' || process.env.ADMIN_LOCAL === '1'
}
