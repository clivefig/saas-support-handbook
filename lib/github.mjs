const API = 'https://api.github.com'

function repo() {
  const r = process.env.GITHUB_REPO
  if (!r || !r.includes('/')) throw new Error('GITHUB_REPO must be owner/name')
  const [owner, name] = r.split('/')
  return { owner, name }
}

function defaultBranch() {
  return process.env.GITHUB_BRANCH || 'main'
}

function ghError(status, msg) {
  const err = new Error(
    status === 401
      ? 'GitHub session expired — log out and sign in again'
      : `GitHub ${status}: ${msg}`
  )
  err.status = status === 401 ? 401 : 502
  err.githubStatus = status
  return err
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
    throw ghError(res.status, msg)
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
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresIn: data.expires_in || null,
    scope: data.scope || ''
  }
}

/** Refresh an expiring OAuth user access token when the GitHub App has that enabled. */
export async function refreshAccessToken(refreshToken) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret || !refreshToken) {
    throw ghError(401, 'Bad credentials')
  }
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })
  const data = await res.json()
  if (data.error) throw ghError(401, data.error_description || data.error)
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in || null
  }
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

export async function getFile(token, path, ref = defaultBranch()) {
  const { owner, name } = repo()
  const encoded = path
    .split('/')
    .map((p) => encodeURIComponent(p))
    .join('/')
  return gh(token, `/repos/${owner}/${name}/contents/${encoded}?ref=${encodeURIComponent(ref)}`)
}

/** Decode a GitHub Contents API file into the shape used by the admin UI. */
export async function readGithubFile(token, path, ref = defaultBranch()) {
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

export async function readGithubJson(token, path, ref = defaultBranch()) {
  const file = await readGithubFile(token, path, ref)
  return JSON.parse(file.content)
}

const LIST_BLOCKED = [
  'node_modules',
  '.vitepress/cache',
  '.vitepress/dist',
  '.vitepress',
  'product/local'
]

async function walkGithubDir(token, dirPath, branch, onFile) {
  const { owner, name } = repo()
  const encoded = dirPath
    .split('/')
    .filter(Boolean)
    .map((p) => encodeURIComponent(p))
    .join('/')
  const items = await gh(
    token,
    `/repos/${owner}/${name}/contents/${encoded}?ref=${encodeURIComponent(branch)}`
  )
  if (!Array.isArray(items)) return
  for (const item of items) {
    if (LIST_BLOCKED.some((b) => item.path === b || item.path.includes(`/${b}`) || item.path.includes(`${b}/`))) {
      continue
    }
    if (item.type === 'dir') {
      await walkGithubDir(token, item.path, branch, onFile)
    } else if (item.type === 'file') {
      await onFile(item)
    }
  }
}

function linkToDocsPath(link) {
  if (!link || typeof link !== 'string') return null
  const cleaned = link.replace(/\/+/g, '/')
  if (cleaned.endsWith('/')) return `docs${cleaned}index.md`.replace(/\/+/g, '/')
  return `docs${cleaned}.md`.replace(/\/+/g, '/')
}

/**
 * List markdown under docs/ via the Contents API (same auth path as file read/write).
 * Avoids Git Data / trees endpoints which are flaky with some OAuth token modes.
 */
export async function listGithubMarkdown(token, branch = defaultBranch()) {
  const results = []
  await walkGithubDir(token, 'docs', branch, async (item) => {
    if (!item.path.endsWith('.md')) return
    const base = item.name.replace(/\.md$/, '')
    results.push({ path: item.path, title: base })
  })

  try {
    const nav = await readGithubJson(token, 'docs/nav.json', branch)
    const titleByPath = new Map()
    for (const section of nav.sidebar || []) {
      for (const item of section.items || []) {
        const filePath = linkToDocsPath(item.link)
        if (filePath && item.text) titleByPath.set(filePath, item.text)
      }
    }
    for (const article of results) {
      const titled = titleByPath.get(article.path)
      if (titled) article.title = titled
    }
  } catch {
    // titles stay as filenames
  }

  return results.sort((a, b) => a.path.localeCompare(b.path))
}

/** Load factory snapshot files from defaults/ on GitHub (for production reset). */
export async function listGithubDefaultFiles(token, branch = defaultBranch()) {
  const files = []
  await walkGithubDir(token, 'defaults', branch, async (item) => {
    const rel = item.path.replace(/^defaults\//, '')
    if (!rel || rel.includes('product/local')) return
    // skip gitkeep-only markers under local
    if (rel.endsWith('.gitkeep')) return
    const file = await readGithubFile(token, item.path, branch)
    files.push({ path: rel, content: file.content })
  })
  return files
}

export async function putFile(
  token,
  { path, content, message, sha, branch = defaultBranch(), encoding = 'utf-8' }
) {
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

async function commitFilesViaContents(token, { message, files, branch }) {
  for (const f of files) {
    let sha
    try {
      const existing = await getFile(token, f.path, branch)
      if (!Array.isArray(existing)) sha = existing.sha
    } catch {
      sha = undefined
    }
    await putFile(token, {
      path: f.path,
      content: f.content,
      message,
      sha,
      branch,
      encoding: f.encoding === 'base64' ? 'base64' : 'utf-8'
    })
  }
  return { ok: true, via: 'contents' }
}

export async function commitFiles(token, { message, files, branch = defaultBranch() }) {
  // Prefer Git Data API for a single commit; fall back to Contents API (one commit per file)
  // when OAuth tokens cannot use git/ref|trees (common with expiring user tokens).
  try {
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

    return { sha: commit.sha, via: 'git-data' }
  } catch (err) {
    if (err.githubStatus === 401 || err.githubStatus === 403 || err.githubStatus === 404) {
      return commitFilesViaContents(token, { message, files, branch })
    }
    throw err
  }
}

export function isLocalMode() {
  return process.env.ADMIN_LOCAL === 'true' || process.env.ADMIN_LOCAL === '1'
}
