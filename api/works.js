// Publish a work so other devices see it on the home feed and agents can find it via MCP.
import { addWork, listWorks } from './_lib/store.mjs'
import { cors, readJson } from './_lib/http.mjs'

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method === 'GET') return res.status(200).json({ works: await listWorks() })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  const w = await readJson(req).catch(() => null)
  if (!w || typeof w.id !== 'string' || typeof w.title !== 'string' || typeof w.body !== 'string' || !w.licence) return res.status(400).json({ error: 'Missing id, title, body or licence' })
  if (w.body.length > 40000 || w.title.length > 300) return res.status(413).json({ error: 'Too long for the prototype' })
  const a = w.author && typeof w.author.name === 'string' && w.author.name.trim() ? w.author : null
  const author = a ? {
    name: String(a.name).trim().slice(0, 60), handle: String(a.handle || '').slice(0, 40), beat: String(a.beat || 'Independent creator').slice(0, 60),
    location: String(a.location || 'India').slice(0, 40), avatarHue: Number.isFinite(a.avatarHue) ? Math.round(a.avatarHue) % 360 : 330,
  } : null
  const gid = author ? `g_${(author.handle || author.name).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'guest'}` : 'riya'
  const clean = {
    id: w.id.slice(0, 64), creatorId: gid, author: author || undefined,
    customCategory: typeof w.customCategory === 'string' && /^[\p{L}\p{N} &'-]{2,30}$/u.test(w.customCategory.trim()) ? w.customCategory.trim() : undefined,
    formats: Array.isArray(w.formats) ? w.formats.filter((f) => ['post', 'article', 'video', 'data'].includes(f)).slice(0, 4) : undefined, kind: ['article', 'video', 'dataset'].includes(w.kind) ? w.kind : 'article',
    section: ['Markets', 'Sports', 'Tech', 'Climate', 'Cities', 'Culture', 'Data', 'Reviews', 'Explainers'].includes(w.section) ? w.section : 'Markets', title: w.title, dek: String(w.dek || '').slice(0, 600), body: w.body,
    topics: Array.isArray(w.topics) ? w.topics.slice(0, 5).map(String) : [], publishedAt: new Date().toISOString(),
    disclosure: ['human', 'ai_assisted', 'ai_generated'].includes(w.disclosure) ? w.disclosure : 'human',
    aiUses: Array.isArray(w.aiUses) ? w.aiUses.slice(0, 6).map(String) : [], licence: w.licence, estimate: w.estimate, seal: w.seal,
  }
  await addWork(clean)
  res.status(201).json({ ok: true, id: clean.id })
}
