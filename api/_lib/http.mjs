export function cors(res) {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS, DELETE')
  res.setHeader('access-control-allow-headers', 'content-type, authorization, mcp-session-id, mcp-protocol-version, accept')
  res.setHeader('access-control-expose-headers', 'mcp-session-id')
}
export function hostOf(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
  return `${String(proto).split(',')[0]}://${host}`
}
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}
