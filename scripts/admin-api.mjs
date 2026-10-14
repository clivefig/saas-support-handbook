import { createServer } from 'node:http'
import { handleApi } from '../lib/api-handler.mjs'

process.env.ADMIN_LOCAL = process.env.ADMIN_LOCAL || 'true'

const port = Number(process.env.ADMIN_API_PORT || 8787)

const server = createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')

  const result = await handleApi({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: raw
  })

  res.writeHead(result.statusCode, result.headers)
  res.end(result.body)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Admin API (ADMIN_LOCAL) http://127.0.0.1:${port}`)
})
