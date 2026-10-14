import { handleApi } from '../../lib/api-handler.mjs'

export async function handler(event) {
  const url = event.rawUrl || `https://${event.headers.host}${event.path}${event.rawQuery ? `?${event.rawQuery}` : ''}`
  const result = await handleApi({
    method: event.httpMethod,
    url,
    headers: event.headers,
    body: event.body
  })
  return result
}
