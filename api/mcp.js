// MCP server (Streamable HTTP, JSON responses). POST JSON-RPC; GET returns a description.
import { handleMcp, TOOLS, PROTOCOL_VERSION, SEED as RAW_SEED, SEED_SEALS, CREATORS } from './_lib/core.mjs'
const SEED = RAW_SEED.map((w) => ({ ...w, seal: SEED_SEALS[w.id] }))
import { addEvent, listWorks, storeKind } from './_lib/store.mjs'
import { cors, hostOf, readJson } from './_lib/http.mjs'

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  const host = hostOf(req)
  if (req.method === 'GET') {
    if (String(req.headers.accept || '').includes('text/event-stream')) return res.status(405).json({ error: 'SSE stream not offered; use POST.' })
    return res.status(200).json({
      name: 'twofold-works', protocol: 'Model Context Protocol', protocolVersion: PROTOCOL_VERSION, transport: 'Streamable HTTP (POST, JSON responses)',
      url: `${host}/api/mcp`, auth: 'Authorization: Bearer demo-finpilot | demo-lumen | demo-kestrel | demo-halcyon (demo keys)',
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description })), store: storeKind,
    })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })

  let body
  try { body = await readJson(req) } catch { return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) }
  const published = await listWorks().catch(() => [])
  const ids = new Set(published.map((w) => w.id))
  const ctx = {
    works: [...published, ...SEED.filter((w) => !ids.has(w.id))],
    creatorName: (id) => CREATORS[id]?.name || id,
    host,
    now: () => new Date().toISOString(),
    pending: [],
    record(e) { this.pending.push(e) },
  }
  const auth = req.headers.authorization
  const run = (m) => handleMcp(m, ctx, auth)
  const out = Array.isArray(body) ? body.map(run).filter(Boolean) : run(body)
  for (const e of ctx.pending) await addEvent(e).catch(() => {})
  if (out == null || (Array.isArray(out) && out.length === 0)) return res.status(202).end()
  if (body?.method === 'initialize') res.setHeader('mcp-session-id', `tf-${Date.now().toString(36)}`)
  return res.status(200).json(out)
}
