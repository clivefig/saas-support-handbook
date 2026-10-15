import { handleApi } from '../../lib/api-handler.mjs'

function requestUrl(event) {
  if (event.rawUrl) return event.rawUrl

  const headers = event.headers || {}
  const host = headers['x-forwarded-host'] || headers.host || 'localhost'
  const proto = headers['x-forwarded-proto'] || 'https'
  // Prefer original path from redirect; fall back to function path
  let path = event.path || '/'
  // Netlify may pass the function path after redirect — recover /api/... from headers
  const original =
    headers['x-original-uri'] ||
    headers['x-forwarded-uri'] ||
    headers['x-netlify-original-pathname']
  if (original && String(original).startsWith('/api')) {
    path = String(original).split('?')[0]
  } else if (path.startsWith('/.netlify/functions/api')) {
    // /api/* redirected without splat — reconstruct from multiValueQuery or default /api
    const splat = event.pathParameters?.splat || event.queryStringParameters?.splat
    path = splat ? `/api/${Array.isArray(splat) ? splat.join('/') : splat}` : '/api'
  }

  const qs = event.rawQuery || event.rawQueryString
  if (qs) return `${proto}://${host}${path}?${qs}`

  const params = event.queryStringParameters
  if (params && Object.keys(params).length) {
    const search = new URLSearchParams(params).toString()
    return `${proto}://${host}${path}?${search}`
  }
  return `${proto}://${host}${path}`
}

export async function handler(event) {
  const result = await handleApi({
    method: event.httpMethod || event.requestContext?.http?.method,
    url: requestUrl(event),
    headers: event.headers || {},
    body: event.body
  })
  return result
}
