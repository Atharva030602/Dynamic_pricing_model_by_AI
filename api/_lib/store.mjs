// Tiny persistence layer. Uses Upstash Redis (Vercel KV) when its env vars exist,
// otherwise an in-memory store that lives as long as the function instance.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const mem = globalThis.__twofold || (globalThis.__twofold = { works: [], events: [] })

async function redis(cmd) {
  const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(cmd) })
  if (!r.ok) throw new Error(`redis ${r.status}`)
  return (await r.json()).result
}

export const storeKind = url && token ? 'redis' : 'memory'

export async function listWorks() {
  if (storeKind === 'redis') return ((await redis(['LRANGE', 'tf:works', 0, 49])) || []).map((s) => JSON.parse(s))
  return mem.works.slice(0, 50)
}

export async function addWork(w) {
  if (storeKind === 'redis') { await redis(['LPUSH', 'tf:works', JSON.stringify(w)]); await redis(['LTRIM', 'tf:works', 0, 49]); return }
  mem.works = [w, ...mem.works.filter((x) => x.id !== w.id)].slice(0, 50)
}

export async function listEvents() {
  if (storeKind === 'redis') return ((await redis(['LRANGE', 'tf:events', 0, 299])) || []).map((s) => JSON.parse(s))
  return mem.events.slice(0, 300)
}

export async function addEvent(e) {
  if (storeKind === 'redis') { await redis(['LPUSH', 'tf:events', JSON.stringify(e)]); await redis(['LTRIM', 'tf:events', 0, 299]); return }
  mem.events = [e, ...mem.events].slice(0, 300)
}
