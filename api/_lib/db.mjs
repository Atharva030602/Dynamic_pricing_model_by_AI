// Accounts database: one master (the source of truth) and two read replicas.
//
//   master  ─┬─▶ human replica  (what people may see: name, handle, city, interests)
//            └─▶ agent replica  (what AI agents may see: creators only, no contact details)
//
// Every write goes to the master, gets a log sequence number (LSN) and is appended to the
// replication log. Each replica then applies the log in order and records the last LSN it
// applied. Reads always come from a replica; if a replica is behind (a failed fan-out), it
// replays the missing log entries before answering, so it heals itself.
//
// Storage: Upstash Redis when its env vars exist; otherwise a JSON file on the local machine
// (.data/twofold-db.json, the local database); otherwise memory (a cold serverless instance).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const FILE = path.join(process.cwd(), '.data', 'twofold-db.json')
export const dbKind = url && token ? 'redis' : process.env.VERCEL ? 'memory' : 'file'

const empty = () => ({ lsn: 0, master: {}, log: [], replicas: { human: { lsn: 0, rows: {} }, agent: { lsn: 0, rows: {} } } })

async function redis(cmd) {
  const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(cmd) })
  if (!r.ok) throw new Error(`redis ${r.status}`)
  return (await r.json()).result
}

// The whole database is small (a prototype), so it is read and written as one document.
// In Redis it is one key per part, so replicas could move to their own instances later.
async function load() {
  if (dbKind === 'redis') {
    const [lsn, master, log, h, a] = await Promise.all([redis(['GET', 'tf:db:lsn']), redis(['GET', 'tf:db:master']), redis(['GET', 'tf:db:log']), redis(['GET', 'tf:db:replica:human']), redis(['GET', 'tf:db:replica:agent'])])
    const d = empty()
    d.lsn = Number(lsn || 0); d.master = master ? JSON.parse(master) : {}; d.log = log ? JSON.parse(log) : []
    if (h) d.replicas.human = JSON.parse(h); if (a) d.replicas.agent = JSON.parse(a)
    return d
  }
  if (dbKind === 'file') {
    try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return empty() }
  }
  return globalThis.__twofoldDb || (globalThis.__twofoldDb = empty())
}

async function save(d, parts = ['lsn', 'master', 'log', 'human', 'agent']) {
  if (dbKind === 'redis') {
    const map = { lsn: ['tf:db:lsn', String(d.lsn)], master: ['tf:db:master', JSON.stringify(d.master)], log: ['tf:db:log', JSON.stringify(d.log)], human: ['tf:db:replica:human', JSON.stringify(d.replicas.human)], agent: ['tf:db:replica:agent', JSON.stringify(d.replicas.agent)] }
    await Promise.all(parts.map((p) => redis(['SET', ...map[p]])))
    return
  }
  if (dbKind === 'file') {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(d, null, 2)); fs.renameSync(FILE + '.tmp', FILE)
    return
  }
  globalThis.__twofoldDb = d
}

// ------------------------------------------------------------------ projections
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')

export function toHuman(m) {
  return {
    id: m.id, role: m.role, name: m.name, handle: m.handle,
    city: m.city || m.region?.city || null, region: m.region?.region || null, country: m.region?.country || null,
    interests: m.role === 'creator' ? [m.beat, ...(m.formats || [])].filter(Boolean) : (m.interests || []).slice(0, 5),
    languages: m.languages || [], joined: m.createdAt,
  }
}

export function toAgent(m) {
  if (m.role !== 'creator') return null // readers are never shown to machines
  return {
    creator_id: m.id, handle: m.handle, display_name: m.name, country: m.region?.country || null, region: m.region?.region || null,
    beat: m.beat || null, formats: m.formats || [], languages: m.languages || [],
    ai_terms: { ai_training: { paid: 'allowed_paid', no: 'not_allowed', ask: 'ask_creator' }[m.aiTraining] || 'ask_creator', ai_quote: 'per_work_licence', licence_index: '/api/licence' },
    joined: m.createdAt,
  }
}

const PURPOSE = {
  id: 'identify your account', role: 'pick the right app (reader or studio)', name: 'show your name on your profile and works', handle: 'your public @name',
  email: 'send sign-in codes and reports (creators only)', city: 'local stories and regional analytics', region: 'region analytics; from your network, coarse only',
  interests: 'build your feed', beat: 'match your work to readers and agents', formats: 'which formats you publish', languages: 'language of feed and analytics',
  goal: 'tailor the studio', audience: 'who you write for', aiTraining: 'your default AI-training term', socials: 'which networks you connected (names only)',
  premium: 'send reading reports', reportFreq: 'how often reports go out', consent: 'record of what you agreed to', createdAt: 'when you joined', updatedAt: 'last change',
}

export function manifest(m) {
  const h = toHuman(m), a = toAgent(m)
  const inH = new Set(['id', 'role', 'name', 'handle', 'city', 'region', 'interests', 'beat', 'formats', 'languages', 'createdAt'])
  const inA = a ? new Set(['id', 'handle', 'name', 'region', 'beat', 'formats', 'languages', 'aiTraining', 'createdAt']) : new Set()
  const fields = Object.keys(m).filter((k) => !['stored', 'tokenHash'].includes(k) && m[k] !== undefined && m[k] !== '' && !(Array.isArray(m[k]) && !m[k].length)).map((k) => ({
    field: k,
    value: k === 'email' ? m.email.replace(/^(.).*(@.*)$/, '$1•••$2') : m[k],
    purpose: PURPOSE[k] || 'account data',
    source: k === 'region' ? 'your network (country and state only)' : ['id', 'createdAt', 'updatedAt', 'consent'].includes(k) ? 'created by Twofold' : 'you typed or chose it',
    stored_in: ['master', ...(inH.has(k) ? ['human_replica'] : []), ...(inA.has(k) ? ['agent_replica'] : [])],
  }))
  return {
    schema: 'twofold/account-manifest/v1', account_id: m.id, role: m.role, generated_at: new Date().toISOString(),
    stored: fields,
    replicas: { human_replica: h, agent_replica: a || 'not listed: readers are never shown to AI agents' },
    not_stored: ['passwords (there are none)', 'your IP address', 'precise location', 'messages or posts from connected social accounts', 'payment details'],
    retention: 'until you delete the account',
    delete: `DELETE /api/accounts?id=${m.id} with the delete token kept in your browser`,
    law: 'Consent recorded per DPDP Act 2023 and DPDP Rules 2025; purposes listed per field.',
  }
}

// ------------------------------------------------------------------ replication
function apply(rep, name, entry) {
  if (entry.lsn <= rep.lsn) return
  const row = entry.op === 'delete' ? null : name === 'human' ? toHuman(entry.row) : toAgent(entry.row)
  if (row) rep.rows[entry.id] = row
  else delete rep.rows[entry.id]
  rep.lsn = entry.lsn
}

function catchUp(d, name) {
  const rep = d.replicas[name]
  const missing = d.log.filter((e) => e.lsn > rep.lsn).sort((x, y) => x.lsn - y.lsn)
  for (const e of missing) apply(rep, name, e)
  return missing.length
}

async function write(op, row, id) {
  const d = await load()
  d.lsn += 1
  if (op === 'delete') delete d.master[id]
  else d.master[row.id] = row
  const entry = { lsn: d.lsn, op, id: id || row.id, ts: new Date().toISOString(), row: op === 'delete' ? null : row }
  d.log.push(entry)
  d.log = d.log.slice(-500)
  // fan-out to both replicas (synchronous here; each replica also self-heals on read)
  for (const name of ['human', 'agent']) apply(d.replicas[name], name, entry)
  await save(d)
  return { lsn: d.lsn, entry }
}

// ------------------------------------------------------------------ public API
const clean = (s, n = 80) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n)
const list = (xs, n = 12, len = 40) => (Array.isArray(xs) ? xs : []).map((x) => clean(x, len)).filter(Boolean).slice(0, n)

export async function createAccount(input, geo) {
  const role = input.role === 'creator' ? 'creator' : 'reader'
  const name = clean(input.name, 60)
  if (name.length < 2) throw Object.assign(new Error('Enter a name of at least 2 characters.'), { status: 400 })
  const email = clean(input.email, 120)
  if (role === 'creator' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) throw Object.assign(new Error('Creators need a full email address, like name@example.com.'), { status: 400 })
  const deleteToken = crypto.randomBytes(18).toString('base64url')
  const now = new Date().toISOString()
  const m = {
    id: `acc_${crypto.randomBytes(5).toString('hex')}`, role, name,
    handle: clean(input.handle, 40) || '@' + name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, ''),
    email: role === 'creator' ? email : undefined,
    city: clean(input.city, 60) || undefined,
    region: { country: geo.country || null, region: geo.region || null, city: geo.city || null, source: geo.country ? 'network' : 'unknown' },
    interests: role === 'reader' ? list(input.interests, 10) : undefined,
    beat: role === 'creator' ? clean(input.beat, 80) || undefined : undefined,
    formats: role === 'creator' ? list(input.formats, 4, 20) : undefined,
    languages: list(input.languages, 6, 20),
    goal: role === 'creator' ? clean(input.goal, 40) || undefined : undefined,
    audience: role === 'creator' ? list(input.audience, 6) : undefined,
    aiTraining: role === 'creator' ? (['ask', 'no', 'paid'].includes(input.aiTraining) ? input.aiTraining : 'ask') : undefined,
    socials: list(input.socials, 6, 20),
    premium: role === 'reader' ? !!input.premium : undefined,
    reportFreq: role === 'reader' && ['weekly', 'monthly'].includes(input.reportFreq) ? input.reportFreq : undefined,
    consent: { version: 'v1', at: now, purposes: ['account', 'personalisation', ...(role === 'creator' ? ['sign-in email', 'agent directory'] : []), ...(input.premium ? ['report email'] : [])] },
    createdAt: now, updatedAt: now,
    tokenHash: sha(deleteToken),
  }
  for (const k of Object.keys(m)) if (m[k] === undefined) delete m[k]
  m.stored = manifest(m)
  const { lsn } = await write('insert', m)
  return { account: toHuman(m), manifest: m.stored, deleteToken, lsn }
}

export async function deleteAccount(id, tokenGiven, isAdmin) {
  const d = await load()
  const m = d.master[id]
  if (!m) throw Object.assign(new Error('No account with that id.'), { status: 404 })
  if (!isAdmin && sha(String(tokenGiven || '')) !== m.tokenHash) throw Object.assign(new Error('That delete token does not match this account.'), { status: 403 })
  const { lsn } = await write('delete', null, id)
  return { deleted: id, lsn }
}

export async function getManifest(id) {
  const d = await load()
  const m = d.master[id]
  return m ? manifest(m) : null
}

const maskEmail = (e) => (e ? e.replace(/^(.).*(@.*)$/, '$1•••$2') : undefined)

export async function readView(view, { admin = false } = {}) {
  const d = await load()
  const healed = { human: catchUp(d, 'human'), agent: catchUp(d, 'agent') }
  if (healed.human || healed.agent) await save(d, ['human', 'agent'])
  const status = {
    store: dbKind, master_lsn: d.lsn, accounts: Object.keys(d.master).length,
    replicas: {
      human: { lsn: d.replicas.human.lsn, lag: d.lsn - d.replicas.human.lsn, rows: Object.keys(d.replicas.human.rows).length, healed: healed.human },
      agent: { lsn: d.replicas.agent.lsn, lag: d.lsn - d.replicas.agent.lsn, rows: Object.keys(d.replicas.agent.rows).length, healed: healed.agent },
    },
  }
  const byNewest = (rows, key) => Object.values(rows).sort((a, b) => String(b[key]).localeCompare(String(a[key])))
  if (view === 'human') return { status, view: 'human_replica', rows: byNewest(d.replicas.human.rows, 'joined') }
  if (view === 'agent') return { status, view: 'agent_replica', rows: byNewest(d.replicas.agent.rows, 'joined') }
  if (view === 'log') return { status, view: 'replication_log', rows: d.log.slice(-50).reverse().map((e) => ({ lsn: e.lsn, op: e.op, id: e.id, ts: e.ts, role: e.row?.role, name: e.row?.name })) }
  // master: full rows for the admin key, masked otherwise
  const rows = byNewest(d.master, 'createdAt').map(({ tokenHash, ...m }) => (admin ? m : { ...m, email: maskEmail(m.email) }))
  return { status, view: 'master', masked: !admin, rows }
}

export function geoFrom(req) {
  const h = (k) => { try { return decodeURIComponent(String(req.headers[k] || '')) || null } catch { return null } }
  return { country: h('x-vercel-ip-country'), region: h('x-vercel-ip-country-region'), city: h('x-vercel-ip-city') }
}
