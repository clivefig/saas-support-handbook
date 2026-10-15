import {
  listMarkdownArticles,
  readRepoFile,
  writeRepoFile,
  readJson,
  writeJson,
  resetToDefaults,
  createArticle,
  isSafeDocsPath
} from './content.mjs'
import {
  sessionFromRequest,
  sessionCookieHeader,
  clearSessionCookieHeader
} from './session.mjs'
import {
  isLocalMode,
  exchangeCode,
  refreshAccessToken,
  getUser,
  canAdmin,
  getFile,
  putFile,
  commitFiles,
  readGithubFile,
  readGithubJson,
  listGithubMarkdown,
  listGithubDefaultFiles
} from './github.mjs'

function json(status, body, headers = {}) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers
    },
    body: JSON.stringify(body)
  }
}

function redirect(location, headers = {}) {
  return {
    statusCode: 302,
    headers: { Location: location, ...headers },
    body: ''
  }
}

async function requireAuth(req) {
  if (isLocalMode()) {
    return { login: 'local-admin', local: true, token: null }
  }
  const session = sessionFromRequest(req)
  if (!session?.login || !session?.token) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
  return session
}

/** Re-issue session cookie when GitHub returns a refreshed OAuth token. */
function maybeRefreshCookie(session, refreshed) {
  if (!refreshed) return {}
  return {
    'Set-Cookie': sessionCookieHeader({
      login: session.login,
      name: session.name,
      avatar: session.avatar,
      token: refreshed.accessToken,
      refreshToken: refreshed.refreshToken
    })
  }
}

async function withGithubToken(session, fn) {
  try {
    return { result: await fn(session.token), refreshed: null }
  } catch (err) {
    if (err.githubStatus !== 401 || !session.refreshToken) throw err
    const refreshed = await refreshAccessToken(session.refreshToken)
    session.token = refreshed.accessToken
    session.refreshToken = refreshed.refreshToken
    return { result: await fn(session.token), refreshed }
  }
}

async function saveFile(session, { path, content, encoding = 'utf8', message }) {
  if (!isSafeDocsPath(path)) throw new Error('Path not allowed')
  if (isLocalMode() || session.local) {
    return { result: writeRepoFile(path, content, encoding), headers: {} }
  }
  const { result, refreshed } = await withGithubToken(session, async (token) => {
    let sha
    try {
      const existing = await getFile(token, path)
      sha = existing.sha
    } catch {
      sha = undefined
    }
    await putFile(token, {
      path,
      content,
      encoding: encoding === 'base64' ? 'base64' : 'utf-8',
      message: message || `admin: update ${path}`,
      sha
    })
    return { path, ok: true }
  })
  return { result, headers: maybeRefreshCookie(session, refreshed) }
}

async function loadFile(session, filePath) {
  if (!isSafeDocsPath(filePath)) {
    const err = new Error('Path not allowed')
    err.status = 400
    throw err
  }
  if (isLocalMode() || session.local) {
    return { result: readRepoFile(filePath), headers: {} }
  }
  try {
    const { result, refreshed } = await withGithubToken(session, (token) =>
      readGithubFile(token, filePath)
    )
    return { result, headers: maybeRefreshCookie(session, refreshed) }
  } catch (e) {
    if (e.githubStatus === 404 || /404/.test(String(e.message))) {
      const err = new Error('File not found')
      err.status = 404
      throw err
    }
    throw e
  }
}

async function loadJson(session, filePath) {
  if (isLocalMode() || session.local) {
    return { result: readJson(filePath), headers: {} }
  }
  const { result, refreshed } = await withGithubToken(session, (token) =>
    readGithubJson(token, filePath)
  )
  return { result, headers: maybeRefreshCookie(session, refreshed) }
}

async function loadArticles(session) {
  if (isLocalMode() || session.local) {
    return { result: listMarkdownArticles(), headers: {} }
  }
  const { result, refreshed } = await withGithubToken(session, (token) =>
    listGithubMarkdown(token)
  )
  return { result, headers: maybeRefreshCookie(session, refreshed) }
}

export async function handleApi(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname.replace(/^\/\.netlify\/functions\/api/, '/api')
  const method = (req.method || 'GET').toUpperCase()

  let body = {}
  if (method !== 'GET' && method !== 'HEAD' && req.body) {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body
    } catch {
      body = {}
    }
  }

  try {
    if (path === '/api/health') {
      return json(200, {
        ok: true,
        local: isLocalMode(),
        repo: process.env.GITHUB_REPO || null,
        branch: process.env.GITHUB_BRANCH || 'main'
      })
    }

    if (path === '/api/auth/status' && method === 'GET') {
      if (isLocalMode()) {
        return json(200, { authenticated: true, login: 'local-admin', local: true })
      }
      const session = sessionFromRequest(req)
      return json(200, {
        authenticated: Boolean(session?.login && session?.token),
        login: session?.login || null,
        local: false
      })
    }

    if (path === '/api/auth/login' && method === 'GET') {
      if (isLocalMode()) {
        return redirect('/admin/')
      }
      const clientId = process.env.GITHUB_CLIENT_ID
      if (!clientId) return json(500, { error: 'GITHUB_CLIENT_ID not set' })
      const redirectUri =
        process.env.GITHUB_OAUTH_CALLBACK ||
        `${url.origin}/api/auth/callback`
      const gh = new URL('https://github.com/login/oauth/authorize')
      gh.searchParams.set('client_id', clientId)
      gh.searchParams.set('redirect_uri', redirectUri)
      gh.searchParams.set('scope', 'repo read:user')
      return redirect(gh.toString())
    }

    if (path === '/api/auth/callback' && method === 'GET') {
      const code = url.searchParams.get('code')
      if (!code) return json(400, { error: 'Missing code' })
      const tokens = await exchangeCode(code)
      const user = await getUser(tokens.accessToken)
      const allowed = await canAdmin(tokens.accessToken, user.login)
      if (!allowed) {
        return json(403, { error: 'No write access to the content repository' })
      }
      const cookie = sessionCookieHeader({
        login: user.login,
        name: user.name || user.login,
        avatar: user.avatar_url,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      })
      return redirect('/admin/', { 'Set-Cookie': cookie })
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookieHeader() })
    }

    if (path === '/api/articles' && method === 'GET') {
      const session = await requireAuth(req)
      const { result, headers } = await loadArticles(session)
      return json(200, { articles: result }, headers)
    }

    if (path === '/api/file' && method === 'GET') {
      const session = await requireAuth(req)
      const filePath = url.searchParams.get('path')
      if (!filePath) return json(400, { error: 'path required' })
      const { result, headers } = await loadFile(session, filePath)
      return json(200, result, headers)
    }

    if (path === '/api/file' && method === 'PUT') {
      const session = await requireAuth(req)
      if (!body.path || body.content === undefined) {
        return json(400, { error: 'path and content required' })
      }
      const { result, headers } = await saveFile(session, {
        path: body.path,
        content: body.content,
        encoding: body.encoding || 'utf8',
        message: body.message
      })
      return json(200, result, headers)
    }

    if (path === '/api/nav' && method === 'GET') {
      const session = await requireAuth(req)
      const { result, headers } = await loadJson(session, 'docs/nav.json')
      return json(
        200,
        {
          nav: result.nav || [],
          sidebar: result.sidebar || [],
          productSidebar: result.productSidebar || []
        },
        headers
      )
    }

    if (path === '/api/nav' && method === 'PUT') {
      const session = await requireAuth(req)
      if (!body.nav && !body.sidebar) return json(400, { error: 'nav payload required' })
      const { result: current, headers: readHeaders } = await loadJson(session, 'docs/nav.json')
      const next = {
        nav: body.nav ?? current.nav,
        sidebar: body.sidebar ?? current.sidebar,
        productSidebar: body.productSidebar ?? current.productSidebar
      }
      const { headers: writeHeaders } = await saveFile(session, {
        path: 'docs/nav.json',
        content: JSON.stringify(next, null, 2) + '\n',
        message: 'admin: update navigation'
      })
      if (isLocalMode() || session.local) writeJson('docs/nav.json', next)
      return json(200, { ok: true }, { ...readHeaders, ...writeHeaders })
    }

    if (path === '/api/articles' && method === 'POST') {
      const session = await requireAuth(req)
      const { section, slug, title, navSectionText } = body
      if (!section || !slug || !title) {
        return json(400, { error: 'section, slug, and title required' })
      }
      if (isLocalMode() || session.local) {
        const created = createArticle({ section, slug, title, navSectionText })
        return json(200, created)
      }
      const { articleTemplate } = await import('./content.mjs')
      const safeSlug = slug.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
      const sectionDir = section.replace(/^\/+|\/+$/g, '')
      const relPath = `docs/${sectionDir}/${safeSlug}.md`
      const link = `/${sectionDir}/${safeSlug}`.replace(/\/+/g, '/')
      const { result: nav, headers: readHeaders } = await loadJson(session, 'docs/nav.json')
      let sectionNode = nav.sidebar.find((s) => s.text === (navSectionText || sectionDir))
      if (!sectionNode) {
        sectionNode = { text: navSectionText || sectionDir, collapsed: false, items: [] }
        nav.sidebar.push(sectionNode)
      }
      sectionNode.items = sectionNode.items || []
      if (!sectionNode.items.some((i) => i.link === link)) {
        sectionNode.items.push({ text: title, link })
      }
      const { refreshed } = await withGithubToken(session, async (token) => {
        await commitFiles(token, {
          message: `admin: add article ${title}`,
          files: [
            {
              path: relPath,
              content: articleTemplate({ title, slug: safeSlug })
            },
            {
              path: 'docs/nav.json',
              content: JSON.stringify(nav, null, 2) + '\n'
            }
          ]
        })
        return true
      })
      return json(
        200,
        { path: relPath, link },
        { ...readHeaders, ...maybeRefreshCookie(session, refreshed) }
      )
    }

    if (path === '/api/reset' && method === 'POST') {
      const session = await requireAuth(req)
      if (isLocalMode() || session.local) {
        return json(200, resetToDefaults())
      }
      const { result: files, refreshed } = await withGithubToken(session, (token) =>
        listGithubDefaultFiles(token)
      )
      if (!files.length) {
        return json(500, { error: 'defaults/ snapshot missing in the GitHub repo' })
      }
      // Commit in chunks via Contents API (commitFiles uses Contents for small batches)
      for (let i = 0; i < files.length; i += 2) {
        await withGithubToken(session, async (token) => {
          await commitFiles(token, {
            message: i === 0 ? 'admin: reset to defaults' : `admin: reset to defaults (${i})`,
            files: files.slice(i, i + 2)
          })
          return true
        })
      }
      return json(
        200,
        { restored: files.map((f) => f.path) },
        maybeRefreshCookie(session, refreshed)
      )
    }

    return json(404, { error: 'Not found' })
  } catch (err) {
    const status = err.status || 500
    return json(status, { error: err.message || String(err) })
  }
}
