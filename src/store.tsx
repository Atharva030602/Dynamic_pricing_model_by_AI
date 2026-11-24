import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SAMPLES } from './data/samples'
import { SEED, SEED_KEYS, SEED_SEALS, type Disclosure, type Work } from './data/works'
export type { Disclosure, Work } from './data/works'
import {
  BUYERS, CREATORS, DERIVATIVES, PENDING_REQUESTS, REPORTS, generateEvents,
  type CreatorProfile, type Derivative, type Report, type UsageEvent,
} from './data/seed'
import type { Kind } from './engine/demand'
import { buildLicence, type Licence, type UseKey } from './engine/licence'
import { fingerprint, generateKeys, sign, type Seal } from './engine/seal'
import { valuate, type Valuation } from './engine/valuation'

export interface Draft {
  title: string
  dek: string
  body: string
  kind: Kind
  attachments: { sourceDocs: boolean; rawData: boolean }
  disclosure: Disclosure
  aiUses: string[]
  sampleId?: string
}

type Keys = { publicJwk: JsonWebKey; privateJwk: JsonWebKey }

interface Persisted {
  published: Work[]
  liveEvents: UsageEvent[]
  seals: Record<string, Seal>
  keys: Record<string, Keys>
  draft: Draft
  licence: Licence | null
  reports: Report[]
  requests: typeof PENDING_REQUESTS
  derivatives: Derivative[]
}

const LS_KEY = 'twofold:v3'
const ME = 'riya'

function defaultDraft(): Draft {
  const s = SAMPLES.find((x) => x.id === 'draft')!
  return { title: s.title, dek: s.dek, body: s.body, kind: s.kind, attachments: { sourceDocs: false, rawData: false }, disclosure: 'ai_assisted', aiUses: ['proofreading'], sampleId: 'draft' }
}

function load(): Persisted {
  const empty: Persisted = {
    published: [], liveEvents: [], seals: {}, keys: {}, draft: defaultDraft(), licence: null,
    reports: REPORTS, requests: PENDING_REQUESTS, derivatives: DERIVATIVES,
  }
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return empty
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return empty
  }
}

interface Store {
  me: CreatorProfile
  creators: typeof CREATORS
  buyers: typeof BUYERS
  works: Work[]
  events: UsageEvent[]
  reports: Report[]
  derivatives: Derivative[]
  requests: typeof PENDING_REQUESTS
  seals: Record<string, Seal>
  draft: Draft
  setDraft: (d: Partial<Draft>) => void
  loadSample: (id: string) => void
  valuation: Valuation
  licence: Licence
  setLicence: (l: Licence) => void
  applyPreset: (id: string) => void
  publish: () => Promise<Work>
  addEvent: (e: Omit<UsageEvent, 'id'> & { id?: string }) => UsageEvent
  respondRequest: (id: string, accept: boolean) => void
  claimDerivative: (id: string) => void
  fileReport: (workId: string, reason: string, claim: string) => void
  resetDemo: () => void
  serverOnline: boolean | null
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const s = useContext(Ctx)
  if (!s) throw new Error('store missing')
  return s
}

const SEED_EVENTS = generateEvents()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Persisted>(load)
  const [remoteWorks, setRemoteWorks] = useState<Work[]>([])
  const [remoteEvents, setRemoteEvents] = useState<UsageEvent[]>([])
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const chan = useRef<BroadcastChannel | null>(null)
  const me = CREATORS[ME]

  // persist + broadcast
  const commit = useCallback((fn: (x: Persisted) => Persisted, broadcast = true) => {
    setP((prev) => {
      const next = fn(prev)
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* quota */ }
      if (broadcast) chan.current?.postMessage('sync')
      return next
    })
  }, [])

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const c = new BroadcastChannel('twofold')
    c.onmessage = () => setP(load())
    chan.current = c
    const onStorage = (e: StorageEvent) => { if (e.key === LS_KEY) setP(load()) }
    window.addEventListener('storage', onStorage)
    return () => { c.close(); window.removeEventListener('storage', onStorage) }
  }, [])

  // cross-device sync with the backend (best effort)
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const r = await fetch('/api/feed', { cache: 'no-store' })
        if (!r.ok) throw new Error(String(r.status))
        const j = await r.json()
        if (!alive) return
        setServerOnline(true)
        setRemoteWorks(j.works || [])
        setRemoteEvents(j.events || [])
      } catch {
        if (alive) setServerOnline(false)
      }
    }
    tick()
    const t = setInterval(tick, 4000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  const works = useMemo(() => {
    const byId = new Map<string, Work>()
    for (const w of SEED) byId.set(w.id, { ...w, seal: SEED_SEALS[w.id] })
    for (const w of remoteWorks) byId.set(w.id, { ...w, live: true })
    for (const w of p.published) byId.set(w.id, w)
    return [...byId.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  }, [p.published, remoteWorks])

  const seals = useMemo(() => {
    const s: Record<string, Seal> = { ...SEED_SEALS, ...p.seals }
    for (const w of works) if (w.seal) s[w.id] = w.seal
    return s
  }, [p.seals, works])

  const events = useMemo(() => {
    const ids = new Set<string>()
    const all = [...SEED_EVENTS, ...remoteEvents, ...p.liveEvents].filter((e) => (ids.has(e.id) ? false : (ids.add(e.id), true)))
    return all.sort((a, b) => a.ts.localeCompare(b.ts))
  }, [p.liveEvents, remoteEvents])

  const valuation = useMemo(
    () => valuate({ title: p.draft.title, body: p.draft.body, kind: p.draft.kind, attachments: p.draft.attachments }, me),
    [p.draft.title, p.draft.body, p.draft.kind, p.draft.attachments, me],
  )

  const licence = useMemo(() => p.licence || buildLicence('paid_both', valuation), [p.licence, valuation])

  const setDraft = (d: Partial<Draft>) => commit((x) => ({ ...x, draft: { ...x.draft, ...d } }))
  const loadSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id)
    if (!s) return
    commit((x) => ({ ...x, licence: null, draft: { ...x.draft, title: s.title, dek: s.dek, body: s.body, kind: s.kind, attachments: { sourceDocs: !!s.attachments?.sourceDocs, rawData: !!s.attachments?.rawData }, sampleId: id } }))
  }
  const setLicence = (l: Licence) => commit((x) => ({ ...x, licence: l }))
  const applyPreset = (id: string) => commit((x) => ({ ...x, licence: buildLicence(id, valuation) }))

  const addEvent = (e: Omit<UsageEvent, 'id'> & { id?: string }) => {
    const ev: UsageEvent = { ...e, id: e.id || `live_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, live: true }
    commit((x) => ({ ...x, liveEvents: [...x.liveEvents, ev] }))
    return ev
  }

  const publish = async () => {
    const d = p.draft
    const id = `tf_${d.title.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 3) || 'new'}_${Date.now().toString(36).slice(-5)}`
    const keys = p.keys[ME] || SEED_KEYS[ME] || (await generateKeys())
    const publishedAt = new Date().toISOString()
    const contentHash = await fingerprint(d.body)
    const seal = await sign({ workId: id, contentHash, creatorId: ME, signedAt: publishedAt, origin: d.disclosure, aiAssistance: d.aiUses, version: 1 }, keys)
    const work: Work = {
      id, creatorId: ME, kind: d.kind, section: d.kind === 'dataset' ? 'Data' : d.kind === 'video' ? 'Reviews' : 'Markets',
      title: d.title, dek: d.dek, body: d.body,
      topics: valuation.features.topics.slice(0, 3).map((t) => t.topic.label), publishedAt,
      disclosure: d.disclosure, aiUses: d.aiUses, licence,
      estimate: { low: Math.round(valuation.low), high: Math.round(valuation.high), confidence: valuation.confidence.label },
      seal, live: true,
    }
    commit((x) => ({ ...x, keys: { ...x.keys, [ME]: keys }, seals: { ...x.seals, [id]: seal }, published: [...x.published.filter((w) => w.id !== id), work] }))
    fetch('/api/works', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(work) }).catch(() => {})
    return work
  }

  const respondRequest = (id: string, accept: boolean) => {
    const rq = p.requests.find((r) => r.id === id)
    if (!rq) return
    if (accept) addEvent({ ts: new Date().toISOString(), workId: rq.workId, buyerId: rq.buyerId, buyerKind: 'ai', use: rq.use as UseKey, units: 1, amount: rq.offer, via: 'mcp', note: 'Training licence accepted' })
    commit((x) => ({ ...x, requests: x.requests.filter((r) => r.id !== id) }))
  }
  const claimDerivative = (id: string) => commit((x) => ({ ...x, derivatives: x.derivatives.map((d) => (d.id === id ? { ...d, status: 'requested' } : d)) }))
  const fileReport = (workId: string, reason: string, claim: string) =>
    commit((x) => ({
      ...x,
      reports: [{ id: `rp_${Date.now().toString(36)}`, workId, reason, claim, reporters: [{ label: 'You (reader)', weight: 0.1 }], status: 'awaiting_creator', escrowPct: 0, heldAmount: 0, opened: new Date().toISOString(), timeline: [{ ts: new Date().toISOString(), text: 'Report received (weight 0.1). Below the 1.0 review threshold, so nothing is held yet.' }] }, ...x.reports],
    }))
  const resetDemo = () => { localStorage.removeItem(LS_KEY); setP(load()); chan.current?.postMessage('sync') }

  const value: Store = {
    me, creators: CREATORS, buyers: BUYERS, works, events, reports: p.reports, derivatives: p.derivatives, requests: p.requests,
    seals, draft: p.draft, setDraft, loadSample, valuation, licence, setLicence, applyPreset, publish, addEvent,
    respondRequest, claimDerivative, fileReport, resetDemo, serverOnline,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
