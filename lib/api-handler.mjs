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
  getUser,
  canAdmin,
  getFile,
  putFile,
  commitFiles
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

async function saveFile(session, { path, content, encoding = 'utf8', message }) {
  if (!isSafeDocsPath(path)) throw new Error('Path not allowed')
  if (isLocalMode() || session.local) {
    return writeRepoFile(path, content, encoding)
  }
  let sha
  try {
    const existing = await getFile(session.token, path)
    sha = existing.sha
  } catch {
    sha = undefined
  }
  await putFile(session.token, {
    path,
    content,
    encoding: encoding === 'base64' ? 'base64' : 'utf-8',
    message: message || `admin: update ${path}`,
    sha
  })
  return { path, ok: true }
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
      return json(200, { ok: true, local: isLocalMode() })
    }

    if (path === '/api/auth/status' && method === 'GET') {
      if (isLocalMode()) {
        return json(200, { authenticated: true, login: 'local-admin', local: true })
      }
      const session = sessionFromRequest(req)
      return json(200, {
        authenticated: Boolean(session?.login),
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
      const token = await exchangeCode(code)
      const user = await getUser(token)
      const allowed = await canAdmin(token, user.login)
      if (!allowed) {
        return json(403, { error: 'No write access to the content repository' })
      }
      const cookie = sessionCookieHeader({
        login: user.login,
        name: user.name || user.login,
        avatar: user.avatar_url,
        token
      })
      return redirect('/admin/', { 'Set-Cookie': cookie })
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookieHeader() })
    }

    if (path === '/api/articles' && method === 'GET') {
      await requireAuth(req)
      return json(200, { articles: listMarkdownArticles() })
    }

    if (path === '/api/file' && method === 'GET') {
      await requireAuth(req)
      const filePath = url.searchParams.get('path')
      if (!filePath) return json(400, { error: 'path required' })
      return json(200, readRepoFile(filePath))
    }

    if (path === '/api/file' && method === 'PUT') {
      const session = await requireAuth(req)
      if (!body.path || body.content === undefined) {
        return json(400, { error: 'path and content required' })
      }
      const result = await saveFile(session, {
        path: body.path,
        content: body.content,
        encoding: body.encoding || 'utf8',
        message: body.message
      })
      return json(200, result)
    }

    if (path === '/api/nav' && method === 'GET') {
      await requireAuth(req)
      return json(200, readJson('docs/nav.json'))
    }

    if (path === '/api/nav' && method === 'PUT') {
      const session = await requireAuth(req)
      if (!body.nav && !body.sidebar) return json(400, { error: 'nav payload required' })
      const current = readJson('docs/nav.json')
      const next = {
        nav: body.nav ?? current.nav,
        sidebar: body.sidebar ?? current.sidebar,
        productSidebar: body.productSidebar ?? current.productSidebar
      }
      await saveFile(session, {
        path: 'docs/nav.json',
        content: JSON.stringify(next, null, 2) + '\n',
        message: 'admin: update navigation'
      })
      // keep local mirror for VitePress when remote commit also used
      if (!isLocalMode()) writeJson('docs/nav.json', next)
      return json(200, { ok: true })
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
      // remote: create via template then commit both files
      const { articleTemplate } = await import('./content.mjs')
      const safeSlug = slug.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
      const sectionDir = section.replace(/^\/+|\/+$/g, '')
      const relPath = `docs/${sectionDir}/${safeSlug}.md`
      const link = `/${sectionDir}/${safeSlug}`.replace(/\/+/g, '/')
      const nav = readJson('docs/nav.json')
      let sectionNode = nav.sidebar.find((s) => s.text === (navSectionText || sectionDir))
      if (!sectionNode) {
        sectionNode = { text: navSectionText || sectionDir, collapsed: false, items: [] }
        nav.sidebar.push(sectionNode)
      }
      sectionNode.items = sectionNode.items || []
      if (!sectionNode.items.some((i) => i.link === link)) {
        sectionNode.items.push({ text: title, link })
      }
      await commitFiles(session.token, {
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
      writeRepoFile(relPath, articleTemplate({ title, slug: safeSlug }))
      writeJson('docs/nav.json', nav)
      return json(200, { path: relPath, link })
    }

    if (path === '/api/reset' && method === 'POST') {
      const session = await requireAuth(req)
      if (isLocalMode() || session.local) {
        return json(200, resetToDefaults())
      }
      const { readdirSync, statSync, readFileSync } = await import('node:fs')
      const { join, relative } = await import('node:path')
      const { DEFAULTS_ROOT, REPO_ROOT } = await import('./content.mjs')
      const files = []
      function walk(dir) {
        for (const name of readdirSync(dir)) {
          const abs = join(dir, name)
          const rel = relative(DEFAULTS_ROOT, abs).replace(/\\/g, '/')
          if (rel.includes('product/local') && name === 'local') continue
          if (statSync(abs).isDirectory()) walk(abs)
          else {
            files.push({
              path: rel,
              content: readFileSync(abs, 'utf8')
            })
          }
        }
      }
      walk(DEFAULTS_ROOT)
      // commit in chunks of 50
      for (let i = 0; i < files.length; i += 40) {
        await commitFiles(session.token, {
          message: i === 0 ? 'admin: reset to defaults' : `admin: reset to defaults (${i})`,
          files: files.slice(i, i + 40)
        })
      }
      resetToDefaults()
      return json(200, { restored: files.map((f) => f.path) })
    }

    return json(404, { error: 'Not found' })
  } catch (err) {
    const status = err.status || 500
    return json(status, { error: err.message || String(err) })
  }
}
