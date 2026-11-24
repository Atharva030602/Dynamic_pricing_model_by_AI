// Relevance engine shared by the reader feed, "related stories" and the MCP search tool.
// TF-IDF cosine over title/standfirst/keywords/body, query expansion through a small
// concept graph, and an entity-relation graph that finds INDIRECT relevance with a reason
// (e.g. "football in India" → Indonesia's defeat matters because they share a qualifying group).

export interface Doc {
  id: string
  title: string
  dek: string
  body: string
  keywords: string[]
  category: string
  publishedAt: string
}

const STOP = new Set('a an the and or but if of in on at to for from by with as is are was were be been it its this that these those there their they them he she his her we our you your i not no yes do does did has have had will would could should can may might than then so such into over under about after before while what which who whom whose when where why how all any each more most other some only own same very just also new news says said say per year years week weeks month months day days one two three'.split(' '))

/** Words that mean the same thing for search purposes (all lower-case). */
const SYNONYMS: Record<string, string[]> = {
  football: ['soccer', 'qualifiers', 'qualifier', 'striker', 'goal', 'goals', 'squad', 'fixture', 'fixtures'],
  qualifiers: ['qualifier', 'qualification', 'world cup', 'group'],
  india: ['indian', 'india’s', "india's"],
  cricket: ['academy', 'pitch', 'wicket', 'batting', 'bowling'],
  ev: ['evs', 'electric', 'vehicle', 'vehicles', 'battery', 'batteries', 'cells'],
  evs: ['ev', 'electric', 'battery'],
  lithium: ['battery', 'batteries', 'brine', 'carbonate'],
  monsoon: ['rain', 'rains', 'rainfall', 'kharif'],
  drought: ['dry', 'groundwater', 'water'],
  farming: ['farmers', 'farmer', 'crop', 'crops', 'tractor', 'tractors', 'soybean', 'agricultural'],
  ai: ['assistant', 'assistants', 'model', 'models', 'agents', 'chatbot'],
  'data centres': ['data centre', 'data center', 'data centers', 'campuses', 'racks', 'grid'],
  solar: ['panels', 'renewable', 'megawatt', 'megawatts'],
  metro: ['bus', 'buses', 'transport', 'commute', 'lanes', 'line', 'signalling'],
  stock: ['shares', 'share', 'investors', 'stock market', 'exchange'],
  bank: ['banking', 'loans', 'loan', 'credit', 'lender'],
  film: ['films', 'cinema', 'screen', 'screens', 'director'],
  prices: ['price', 'cost', 'costs', 'inflation'],
}

/** Indirect relevance: when a query is about `from`, documents about `to` matter, for `reason`. */
export const RELATIONS: { from: string[]; to: string[]; context?: string[]; reason: string }[] = [
  { from: ['india', 'indian football'], to: ['indonesia'], context: ['football', 'qualifiers', 'qualifier', 'world cup', 'soccer'], reason: 'Indonesia is in India’s qualifying group, so their results change India’s chances' },
  { from: ['indonesia'], to: ['india', 'indian football'], context: ['football', 'qualifiers'], reason: 'Same qualifying group as India' },
  { from: ['ev', 'evs', 'electric', 'voltaris', 'saffron', 'auto'], to: ['lithium'], reason: 'Lithium prices set battery costs, the biggest cost in an EV' },
  { from: ['lithium'], to: ['voltaris', 'evs', 'auto industry'], reason: 'EV and battery makers carry lithium price risk' },
  { from: ['farming', 'farmers', 'tractor', 'loans', 'meridian', 'food', 'vegetable', 'tomatoes'], to: ['monsoon', 'groundwater', 'drought'], reason: 'Rain and groundwater drive farm incomes, rural credit and food prices' },
  { from: ['monsoon', 'drought', 'groundwater'], to: ['farming', 'food prices', 'solar energy', 'banking'], reason: 'Weak rains ripple into farm incomes, land use and loans' },
  { from: ['ai', 'chatbot', 'assistant'], to: ['data centres', 'media & ai'], reason: 'AI demand drives data-centre power use and how news gets paid' },
  { from: ['power', 'electricity', 'grid'], to: ['data centres'], reason: 'Data centres are now among the largest new loads on city grids' },
  { from: ['stock', 'shares', 'investing', 'market'], to: ['auto industry', 'evs', 'banking', 'lithium'], reason: 'Company news that moves listed shares' },
]

export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'&\s-]/g, ' ').split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, '').replace(/'s$/, ''))
    .filter((w) => w.length > 1 && !STOP.has(w))
}

function expand(tokens: string[], phrase: string) {
  const out = new Map<string, number>()
  const add = (t: string, w: number) => out.set(t, Math.max(out.get(t) || 0, w))
  for (const t of tokens) add(t, 1)
  for (const [k, syn] of Object.entries(SYNONYMS)) {
    if (tokens.includes(k) || phrase.includes(k)) for (const s of syn) for (const st of tokenize(s)) add(st, 0.55)
  }
  return out
}

interface Indexed { doc: Doc; tf: Map<string, number>; norm: number; kw: string[]; text: string; head: string }

export class Index {
  private docs: Indexed[] = []
  private idf = new Map<string, number>()

  constructor(docs: Doc[]) {
    const df = new Map<string, number>()
    const raw = docs.map((d) => {
      const tokens = [
        ...rep(tokenize(d.title), 3), ...rep(tokenize(d.dek), 2), ...rep(d.keywords.flatMap((k) => tokenize(k)), 3), ...tokenize(d.body),
      ]
      const tf = new Map<string, number>()
      for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1)
      for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1)
      return { doc: d, tf, kw: d.keywords.map((k) => k.toLowerCase()), text: `${d.title} ${d.dek} ${d.keywords.join(' ')} ${d.body}`.toLowerCase(), head: `${d.title} ${d.keywords.join(' ')}`.toLowerCase() }
    })
    const n = docs.length
    for (const [t, c] of df) this.idf.set(t, Math.log(1 + n / c))
    this.docs = raw.map((r) => {
      let s = 0
      for (const [t, c] of r.tf) { const w = (1 + Math.log(c)) * (this.idf.get(t) || 0); s += w * w }
      return { ...r, norm: Math.sqrt(s) || 1 }
    })
  }

  private w(d: Indexed, t: string) {
    const c = d.tf.get(t)
    return c ? (1 + Math.log(c)) * (this.idf.get(t) || 0) : 0
  }

  /** Search with direct + indirect relevance, each result explained. */
  search(query: string, limit = 6, excludeId?: string) {
    const phrase = query.toLowerCase()
    const qt = tokenize(query)
    const q = expand(qt, phrase)
    let qn = 0
    for (const [t, wq] of q) { const w = wq * (this.idf.get(t) || 1); qn += w * w }
    qn = Math.sqrt(qn) || 1

    const results = this.docs.filter((d) => d.doc.id !== excludeId).map((d) => {
      let dot = 0
      const matched: string[] = []
      for (const [t, wq] of q) {
        const wd = this.w(d, t)
        if (wd) { dot += wq * (this.idf.get(t) || 1) * wd; if (wq === 1) matched.push(t) }
      }
      const direct = dot / (qn * d.norm)
      const kwHits = d.doc.keywords.filter((k) => { const kl = k.toLowerCase(); return qt.some((t) => kl.split(/\s+/).includes(t)) || phrase.includes(kl) })
      // indirect relations
      let indirect = 0
      let reason = ''
      let relFrom: string[] = []
      for (const r of RELATIONS) {
        const qHas = r.from.some((f) => qt.includes(f) || phrase.includes(f))
        const ctxOk = !r.context || r.context.some((c) => qt.includes(c) || phrase.includes(c) || d.text.includes(c))
        const dHas = r.to.some((t2) => d.kw.includes(t2) || new RegExp(`\\b${t2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(d.head))
        if (qHas && ctxOk && dHas) {
          if (0.32 > indirect) { indirect = 0.32; reason = r.reason; relFrom = r.from }
        }
      }
      const score = Math.min(0.99, direct * 1.6 + kwHits.length * 0.12 + indirect)
      // the link is indirect when the story never names what you asked about (e.g. asks "India", story is about Indonesia)
      const namesSubject = relFrom.some((f) => new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(d.head))
      const directPart = direct * 1.6 + kwHits.length * 0.12
      const kind: 'direct' | 'indirect' = reason && !namesSubject ? 'indirect' : directPart >= 0.22 ? 'direct' : 'indirect'
      const mentions = `Mentions ${dedupe([...kwHits, ...matched.slice(0, 3)]).slice(0, 3).join(', ') || 'your terms'}`
      const why = kind === 'direct' ? mentions : reason
      const alsoBecause = kind === 'direct' && reason ? reason : kind === 'indirect' && directPart >= 0.22 ? mentions.replace('Mentions', 'Also about') : undefined
      return { id: d.doc.id, doc: d.doc, score: Math.round(score * 100) / 100, kind, why, alsoBecause, matched: [...new Set(matched)].slice(0, 6) }
    })
    return results.filter((r) => r.score >= 0.12 && (r.kind === 'direct' || r.why)).sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /** Related stories for a given document. */
  related(id: string, limit = 4) {
    const d = this.docs.find((x) => x.doc.id === id)
    if (!d) return []
    const q = `${d.doc.title} ${d.doc.keywords.join(' ')}`
    return this.search(q, limit + 2, id).slice(0, limit).map((r) => {
      const shared = r.doc.keywords.filter((k) => d.doc.keywords.map((x) => x.toLowerCase()).includes(k.toLowerCase()))
      return shared.length ? { ...r, kind: 'direct' as const, why: `Shared topic: ${shared.slice(0, 2).join(', ')}` } : r
    })
  }
}

function rep<T>(xs: T[], n: number) { const out: T[] = []; for (let i = 0; i < n; i++) out.push(...xs); return out }
function dedupe(xs: string[]) { const seen = new Set<string>(); return xs.filter((x) => { const k = x.toLowerCase(); if ([...seen].some((s) => s.includes(k))) return false; seen.add(k); return true }) }

/** Personal feed ranking: followed keywords (direct or through relations) + learned taste + freshness + popularity. */
export function rankForUser<T extends { id: string; keywords: string[]; category: string; publishedAt: string; likes: number }>(
  items: T[], follows: string[], learned: Record<string, number>, now = Date.now(),
) {
  const f = follows.map((x) => x.toLowerCase())
  return items.map((it) => {
    const kws = it.keywords.map((k) => k.toLowerCase())
    const direct = kws.filter((k) => f.includes(k))
    let indirectReason = ''
    if (!direct.length) {
      for (const r of RELATIONS) {
        if (r.from.some((x) => f.some((fk) => fk.includes(x))) && r.to.some((t) => kws.includes(t) || kws.some((k) => k.includes(t)))) { indirectReason = r.reason; break }
      }
    }
    const taste = kws.reduce((a, k) => a + (learned[k] || 0), 0)
    const ageH = (now - new Date(it.publishedAt).getTime()) / 36e5
    const fresh = Math.max(0, 1 - ageH / (24 * 10))
    const pop = Math.log10(1 + it.likes) / 4
    const score = direct.length * 1.2 + (indirectReason ? 0.5 : 0) + taste * 0.3 + fresh * 0.8 + pop * 0.4
    const why = direct.length
      ? `Because you follow ${it.keywords.find((k) => f.includes(k.toLowerCase()))}`
      : indirectReason ? `Related to what you follow: ${indirectReason.charAt(0).toLowerCase()}${indirectReason.slice(1)}`
      : taste > 0 ? 'Similar to stories you liked' : ''
    return { item: it, score, why }
  }).sort((a, b) => b.score - a.score)
}
