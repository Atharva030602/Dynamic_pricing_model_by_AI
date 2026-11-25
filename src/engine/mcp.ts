// MCP tool logic shared by the serverless endpoint (/api/mcp) and the in-browser
// fallback. JSON-RPC 2.0; follows the MCP tools shape (tools/list, tools/call).
import { summarise, toMachineJson, USE_META, type Licence, type UseKey } from './licence'
import { decorate } from '../data/meta'
import type { Work } from '../data/works'
import { Index } from './similarity'

export const PROTOCOL_VERSION = '2025-06-18'

export interface McpWork {
  id: string
  creatorId: string
  kind: string
  section: string
  title: string
  dek: string
  body: string
  topics: string[]
  publishedAt: string
  disclosure: string
  aiUses: string[]
  licence: Licence
  seal?: { contentHash: string; signedAt: string; signature: string }
}

export interface McpUsage {
  id: string
  ts: string
  workId: string
  buyerId: string
  buyerKind: 'ai'
  use: UseKey
  units: number
  amount: number
  via: 'mcp'
  live: true
  note?: string
}

export interface McpCtx {
  works: McpWork[]
  creatorName: (id: string) => string
  host: string
  now: () => string
  record: (e: McpUsage) => void
  /** Rows from the agent replica of the accounts database (creators only, no contact details). */
  creators?: Record<string, unknown>[]
}

/** Demo client credentials. Agents authenticate; we never trust a self-reported name. */
export const DEMO_AGENTS: Record<string, { id: string; name: string }> = {
  'demo-finpilot': { id: 'finpilot', name: 'FinPilot' },
  'demo-lumen': { id: 'lumen', name: 'Lumen Assistant' },
  'demo-kestrel': { id: 'kestrel', name: 'Kestrel Search' },
  'demo-halcyon': { id: 'halcyon', name: 'Halcyon Labs' },
}

export const TOOLS = [
  { name: 'search_works', description: 'Search works by meaning, not just keywords. Free. Returns direct matches and indirectly relevant works, each with a relevance score (0-1) and the reason, plus creator, date and access tier.', inputSchema: { type: 'object', properties: { query: { type: 'string' }, kind: { type: 'string', enum: ['article', 'video', 'dataset'] } }, required: ['query'] } },
  { name: 'get_work_metadata', description: 'Creator, date, disclosure (human / AI-assisted), provenance seal and the machine-readable licence. Free.', inputSchema: { type: 'object', properties: { work_id: { type: 'string' } }, required: ['work_id'] } },
  { name: 'get_work_preview', description: 'Short summary, key facts and the free preview words, so you can judge relevance before paying. Free.', inputSchema: { type: 'object', properties: { work_id: { type: 'string' } }, required: ['work_id'] } },
  { name: 'get_full_work', description: 'Full text for a given use. Without a valid licence token returns access_required with offers.', inputSchema: { type: 'object', properties: { work_id: { type: 'string' }, use: { type: 'string', enum: ['ai_quote', 'ai_train', 'republish', 'read'] }, licence_token: { type: 'string' } }, required: ['work_id', 'use'] } },
  { name: 'purchase_licence', description: 'Buy a licence for one use of one work (simulated payment). Returns a licence token, a usage record and the attribution line you must show.', inputSchema: { type: 'object', properties: { work_id: { type: 'string' }, use: { type: 'string', enum: ['ai_quote', 'republish', 'read'] } }, required: ['work_id', 'use'] } },
  { name: 'list_creators', description: 'Directory of creators from the agent replica of the accounts database: handle, region, beat, formats, languages and default AI terms. Readers are never listed. Free.', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Match beat, handle, name or region' }, country: { type: 'string' } } } },
  { name: 'report_work', description: 'Report a work as fake or misleading. Weighted by your history; does not pause the creator’s other earnings.', inputSchema: { type: 'object', properties: { work_id: { type: 'string' }, reason: { type: 'string' }, evidence: { type: 'string' } }, required: ['work_id', 'reason'] } },
]

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> }

const enc = (o: unknown) => (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(JSON.stringify(o)))) : Buffer.from(JSON.stringify(o)).toString('base64'))
const dec = (s: string) => JSON.parse(typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString())

function preview(w: McpWork) {
  const words = w.body.split(/\s+/)
  return words.slice(0, w.licence.previewWords || 80).join(' ') + (words.length > (w.licence.previewWords || 80) ? ' …' : '')
}

function keyFacts(w: McpWork) {
  return w.body.split(/(?<=[.!?])\s+/).filter((s) => /\d/.test(s)).slice(0, 3).map((s) => s.trim())
}

function offers(w: McpWork) {
  return (Object.keys(w.licence.uses) as UseKey[]).map((k) => {
    const u = w.licence.uses[k]
    return {
      use: k,
      permission: u.permission,
      ...(u.permission === 'paid' ? { price: { amount: u.price, currency: 'INR', unit: USE_META[k].unitLong } } : {}),
      ...(u.permission === 'ask' ? { indicative_price: { amount: u.price, currency: 'INR' }, how: 'Request via the creator; not purchasable instantly.' } : {}),
    }
  })
}

export function handleMcp(req: Rpc, ctx: McpCtx, auth?: string) {
  const ok = (result: unknown) => ({ jsonrpc: '2.0' as const, id: req.id ?? null, result })
  const err = (code: number, message: string, data?: unknown) => ({ jsonrpc: '2.0' as const, id: req.id ?? null, error: { code, message, data } })
  const agent = auth ? DEMO_AGENTS[auth.replace(/^Bearer\s+/i, '')] : undefined
  const tool = (structured: unknown, isError = false) => ok({ content: [{ type: 'text', text: JSON.stringify(structured, null, 2) }], structuredContent: structured, isError })

  if (req.method === 'initialize') {
    return ok({ protocolVersion: PROTOCOL_VERSION, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'twofold-works', version: '1.0.0' }, instructions: 'Discover → evaluate (free) → buy a licence → retrieve. Every paid call returns a usage record. Authenticate with Authorization: Bearer demo-finpilot (or demo-lumen, demo-kestrel, demo-halcyon).' })
  }
  if (req.method === 'notifications/initialized') return null
  if (req.method === 'ping') return ok({})
  if (req.method === 'tools/list') return ok({ tools: TOOLS })
  if (req.method !== 'tools/call') return err(-32601, `Method not found: ${req.method}`)

  const name = String(req.params?.name || '')
  const a = (req.params?.arguments || {}) as Record<string, string>
  const w = a.work_id ? ctx.works.find((x) => x.id === a.work_id) : undefined
  if (name === 'list_creators') {
    const q = String(a.query || '').toLowerCase().trim()
    const rows = (ctx.creators || []).filter((c) => (!a.country || String(c.country || '').toLowerCase() === String(a.country).toLowerCase()) && (!q || JSON.stringify(c).toLowerCase().includes(q)))
    return tool({ source: 'agent_replica', count: rows.length, creators: rows.slice(0, 25), note: 'Contact details are never shared with agents. Licence each work through purchase_licence.', cost: 0 })
  }
  if (name !== 'search_works' && !w) return tool({ error: 'not_found', message: `No work with id ${a.work_id}` }, true)

  switch (name) {
    case 'search_works': {
      const pool = ctx.works.filter((x) => !a.kind || x.kind === a.kind)
      const docs = pool.map((x) => { const d = decorate(x as unknown as Work); return { id: x.id, title: x.title, dek: x.dek, body: x.body, keywords: d.meta.keywords, category: d.category, publishedAt: x.publishedAt } })
      const byId = new Map(pool.map((x) => [x.id, x]))
      const hits = new Index(docs).search(a.query || '', 6).map((r) => {
        const x = byId.get(r.id)!
        return {
          work_id: x.id, title: x.title, creator: ctx.creatorName(x.creatorId), published_at: x.publishedAt, kind: x.kind, category: r.doc.category,
          relevance: { score: r.score, match: r.kind, why: r.why, ...(r.alsoBecause ? { also: r.alsoBecause } : {}) },
          access: x.licence.uses.ai_quote.permission === 'paid' ? `ai_quote ₹${x.licence.uses.ai_quote.price}/answer` : x.licence.uses.ai_quote.permission,
        }
      })
      return tool({ query: a.query, results: hits, note: 'Ranked by meaning (TF-IDF with concept expansion). match=indirect means the work does not mention your terms but is relevant for the reason given.', cost: 0 })
    }
    case 'get_work_metadata':
      return tool({
        ...toMachineJson(w!.licence, { id: w!.id, title: w!.title, creator: { id: w!.creatorId, name: ctx.creatorName(w!.creatorId), url: `${ctx.host}/#/@${w!.creatorId}` }, publishedAt: w!.publishedAt, contentHash: w!.seal?.contentHash, disclosure: { origin: w!.disclosure, aiAssistance: w!.aiUses } }, ctx.host),
        terms_in_plain_english: summarise(w!.licence, ctx.creatorName(w!.creatorId).replace(/^Dr\s+/, '').split(' ')[0]),
        seal: w!.seal ? { content_hash: w!.seal.contentHash, signed_at: w!.seal.signedAt, algorithm: 'ECDSA P-256 over SHA-256', verify: `${ctx.host}/#/work/${w!.id}?verify=1` } : null,
        cost: 0,
      })
    case 'get_work_preview':
      return tool({ work_id: w!.id, title: w!.title, summary: w!.dek, key_facts: keyFacts(w!), preview: preview(w!), topics: w!.topics, word_count: w!.body.split(/\s+/).length, cost: 0 })
    case 'get_full_work': {
      const use = (a.use || 'ai_quote') as UseKey
      const terms = w!.licence.uses[use]
      if (!terms) return tool({ error: 'bad_use', message: `Unknown use ${use}` }, true)
      if (terms.permission === 'no') return tool({ status: 'forbidden', use, message: `The creator does not allow ${USE_META[use].label.toLowerCase()}.`, http_equivalent: 403 }, true)
      let valid = terms.permission === 'free'
      if (a.licence_token) {
        try {
          const t = dec(a.licence_token)
          valid = t.w === w!.id && t.u === use
        } catch { valid = false }
      }
      if (!valid) {
        return tool({
          status: 'access_required', http_equivalent: 402, work_id: w!.id, use,
          message: terms.permission === 'ask' ? 'This use needs the creator’s written OK.' : `Buy a ${use} licence with purchase_licence, then retry with the licence_token.`,
          offers: offers(w!), next: terms.permission === 'paid' ? { tool: 'purchase_licence', arguments: { work_id: w!.id, use } } : null,
        })
      }
      const first = ctx.creatorName(w!.creatorId)
      return tool({
        work_id: w!.id, use, title: w!.title, text: w!.body,
        conditions: { attribution: `Source: ${first}, “${w!.title}”, Twofold, ${new Date(w!.publishedAt).toDateString()}`, link: `${ctx.host}/#/work/${w!.id}`, max_quote_words: terms.maxQuoteWords || null },
        content_hash: w!.seal?.contentHash || null,
      })
    }
    case 'purchase_licence': {
      if (!agent) return tool({ error: 'unauthenticated', message: 'Send Authorization: Bearer demo-finpilot (demo key) to buy licences.', http_equivalent: 401 }, true)
      const use = (a.use || 'ai_quote') as UseKey
      const terms = w!.licence.uses[use]
      if (!terms || terms.permission !== 'paid') return tool({ status: 'not_for_sale', use, permission: terms?.permission, message: terms?.permission === 'ask' ? 'Request needed: the creator decides.' : 'This use cannot be bought.' }, true)
      const ts = ctx.now()
      const rec: McpUsage = { id: `mcp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, ts, workId: w!.id, buyerId: agent.id, buyerKind: 'ai', use, units: 1, amount: terms.price, via: 'mcp', live: true, note: `${agent.name} via MCP` }
      ctx.record(rec)
      return tool({
        status: 'licensed', licence_token: enc({ w: w!.id, u: use, b: agent.id, t: ts }), use,
        price_paid: { amount: terms.price, currency: 'INR' }, creator_receives: { amount: Math.round(terms.price * 0.85 * 100) / 100, currency: 'INR' },
        usage_record: { id: rec.id, ts, buyer: agent.name, work_id: w!.id, use },
        must_show_attribution: `Source: ${ctx.creatorName(w!.creatorId)}, Twofold`,
      })
    }
    case 'report_work':
      return tool({ status: 'received', report_id: `rp_${Date.now().toString(36)}`, weight: agent ? 0.3 : 0.1, note: 'Review opens when credible reports reach weight 1.0. Only this work’s new earnings can be held, never the creator’s other income.' })
    default:
      return err(-32602, `Unknown tool ${name}`)
  }
}
