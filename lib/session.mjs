import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

const COOKIE_NAME = 'ssh_admin_session'

function secret() {
  return process.env.SESSION_SECRET || process.env.GITHUB_CLIENT_SECRET || 'dev-only-change-me'
}

export function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySession(token) {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (data.exp && Date.now() > data.exp) return null
    return data
  } catch {
    return null
  }
}

export function parseCookies(header = '') {
  const out = {}
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (!k) continue
    out[k] = decodeURIComponent(rest.join('=') || '')
  }
  return out
}

export function sessionFromRequest(req) {
  const cookies = parseCookies(req.headers?.cookie || req.headers?.Cookie || '')
  return verifySession(cookies[COOKIE_NAME])
}

export function sessionCookieHeader(payload, { maxAgeSec = 60 * 60 * 24 * 7 } = {}) {
  const token = signSession({ ...payload, exp: Date.now() + maxAgeSec * 1000 })
  const secure = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true'
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`
}

export function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function csrfToken() {
  return randomBytes(16).toString('hex')
}

export { COOKIE_NAME }
