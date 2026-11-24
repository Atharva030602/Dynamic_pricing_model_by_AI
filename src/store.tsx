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
import { decorate, type Decorated } from './data/meta'
import { COMMUNITY, type Category, type CommunityPost } from './data/v2'
import { guessCategory } from './data/meta'
import { Index } from './engine/similarity'

export interface Profile {
  role: 'reader' | 'creator'
  name: string
  handle: string
  city: string
  keywords: string[]
  style?: string
  makes?: string
  audience?: string
  aiTraining?: 'ask' | 'no' | 'paid'
  createdAt: string
}
export interface Comment { name: string; text: string; ts: string }

export interface Draft {
  title: string
  dek: string
  body: string
  kind: Kind
  attachments: { sourceDocs: boolean; rawData: boolean }
  disclosure: Disclosure
  aiUses: string[]
  sampleId?: string
  category?: Category
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
  profile: Profile | null
  skippedOnboarding: boolean
  tourDone: boolean
  liked: string[]
  bookmarked: string[]
  promoted: string[]
  learned: Record<string, number>
  comments: Record<string, Comment[]>
  posts: CommunityPost[]
  votes: Record<string, number>
  replies: Record<string, { author: string; text: string; ts: string }[]>
}

const LS_KEY = 'twofold:v4'
export const guestId = (handle: string) => `g_${handle.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'guest'}`
const ME = 'riya'

function defaultDraft(): Draft {
  const s = SAMPLES.find((x) => x.id === 'draft')!
  return { title: s.title, dek: s.dek, body: s.body, kind: s.kind, attachments: { sourceDocs: false, rawData: false }, disclosure: 'ai_assisted', aiUses: ['proofreading'], sampleId: 'draft' }
}

function load(): Persisted {
  const empty: Persisted = {
    published: [], liveEvents: [], seals: {}, keys: {}, draft: defaultDraft(), licence: null,
    reports: REPORTS, requests: PENDING_REQUESTS, derivatives: DERIVATIVES,
    profile: null, skippedOnboarding: false, tourDone: false, liked: [], bookmarked: [], promoted: [], learned: {},
    comments: {}, posts: [], votes: {}, replies: {},
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
  publish: (override?: Draft, asCreator?: string) => Promise<Work>
  addEvent: (e: Omit<UsageEvent, 'id'> & { id?: string }) => UsageEvent
  respondRequest: (id: string, accept: boolean) => void
  claimDerivative: (id: string) => void
  fileReport: (workId: string, reason: string, claim: string) => void
  resetDemo: () => void
  serverOnline: boolean | null
  // v2
  feed: Decorated[]
  index: Index
  profile: Profile | null
  setProfile: (p: Profile | null) => void
  skipOnboarding: () => void
  skippedOnboarding: boolean
  tourDone: boolean
  finishTour: () => void
  liked: string[]
  bookmarked: string[]
  promoted: string[]
  learned: Record<string, number>
  toggle: (kind: 'liked' | 'bookmarked' | 'promoted', id: string) => void
  comments: Record<string, Comment[]>
  addComment: (id: string, text: string) => void
  posts: CommunityPost[]
  addPost: (p: Omit<CommunityPost, 'id' | 'votes' | 'ts' | 'replies' | 'author' | 'hue'>) => string
  votes: Record<string, number>
  vote: (id: string, d: number) => void
  replies: Record<string, { author: string; text: string; ts: string }[]>
  reply: (id: string, text: string) => void
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
  const [remotePosts, setRemotePosts] = useState<CommunityPost[]>([])
  const chan = useRef<BroadcastChannel | null>(null)
  const profile = p.profile
  const meProfile: CreatorProfile | null = profile?.role === 'creator'
    ? { id: guestId(profile.handle), name: profile.name, handle: profile.handle, beat: profile.makes || 'Independent creator', location: profile.city || 'India', reputation: 0.5, pastPieces: 0, followers: 250, joined: '2026', verified: false, avatarHue: 330 }
    : null
  const [remoteAuthorsKey, setRemoteAuthorsKey] = useState('')
  const creators = useMemo(() => {
    const extra: Record<string, CreatorProfile> = {}
    try {
      for (const [id, a] of JSON.parse(remoteAuthorsKey || '[]') as [string, NonNullable<Work['author']>][]) {
        extra[id] = { id, name: a.name, handle: a.handle, beat: a.beat, location: a.location, reputation: 0.5, pastPieces: 0, followers: 120, joined: '2026', verified: false, avatarHue: a.avatarHue }
      }
    } catch { /* ignore */ }
    const base = { ...CREATORS, ...extra } as typeof CREATORS
    const all = (meProfile ? { ...base, [meProfile.id]: meProfile } : base) as typeof CREATORS
    // never crash on an unknown author
    return new Proxy(all, { get: (t, k: string) => (k in t ? t[k] : typeof k === 'string' ? { ...CREATORS.riya, id: k, name: 'Guest writer', handle: '@guest', beat: 'Independent creator', avatarHue: 200 } : undefined) }) as typeof CREATORS
  }, [meProfile?.id, meProfile?.name, meProfile?.beat, meProfile?.location, remoteAuthorsKey])
  const me = meProfile ? creators[meProfile.id] : CREATORS[ME]

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
        setRemotePosts(j.posts || [])
      } catch {
        if (alive) setServerOnline(false)
      }
    }
    tick()
    const t = setInterval(tick, 4000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  useEffect(() => {
    const m = new Map<string, NonNullable<Work['author']>>()
    for (const w of [...remoteWorks, ...p.published]) if (w.author && w.creatorId.startsWith('g_')) m.set(w.creatorId, w.author)
    setRemoteAuthorsKey(JSON.stringify([...m.entries()]))
  }, [remoteWorks, p.published])

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

  const licence = useMemo(() => p.licence || buildLicence(profile?.aiTraining === 'no' ? 'no_training' : 'paid_both', valuation), [p.licence, valuation, profile?.aiTraining])

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

  const publish = async (override?: Draft, asCreator?: string) => {
    const d = override || p.draft
    const ME = asCreator || me.id
    const val = override ? valuate({ title: d.title, body: d.body, kind: d.kind, attachments: d.attachments }, me) : valuation
    const lic = override ? buildLicence(profile?.aiTraining === 'no' ? 'no_training' : 'paid_both', val) : licence
    const id = `tf_${d.title.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 3) || 'new'}_${Date.now().toString(36).slice(-5)}`
    const keys = p.keys[ME] || (SEED_KEYS as Record<string, Keys>)[ME] || (await generateKeys())
    const publishedAt = new Date().toISOString()
    const contentHash = await fingerprint(d.body)
    const seal = await sign({ workId: id, contentHash, creatorId: ME, signedAt: publishedAt, origin: d.disclosure, aiAssistance: d.aiUses, version: 1 }, keys)
    const work: Work = {
      id, creatorId: ME, kind: d.kind, section: d.category || guessCategory(`${d.title} ${d.dek} ${d.body}`),
      author: meProfile && ME === meProfile.id ? { name: meProfile.name, handle: meProfile.handle, beat: meProfile.beat, location: meProfile.location, avatarHue: meProfile.avatarHue } : undefined,
      title: d.title, dek: d.dek, body: d.body,
      topics: val.features.topics.slice(0, 3).map((t) => t.topic.label), publishedAt,
      disclosure: d.disclosure, aiUses: d.aiUses, licence: lic,
      estimate: { low: Math.round(val.low), high: Math.round(val.high), confidence: val.confidence.label },
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

  const feed = useMemo(() => works.map(decorate), [works])
  const index = useMemo(() => new Index(feed.map((w) => ({ id: w.id, title: w.title, dek: w.dek, body: w.body, keywords: w.meta.keywords, category: w.category, publishedAt: w.publishedAt }))), [feed])
  const setProfile = (pr: Profile | null) => commit((x) => ({ ...x, profile: pr, tourDone: pr?.role === 'creator' ? false : x.tourDone, licence: null }))
  const skipOnboarding = () => commit((x) => ({ ...x, skippedOnboarding: true }))
  const finishTour = () => commit((x) => ({ ...x, tourDone: true }))
  const toggle = (kind: 'liked' | 'bookmarked' | 'promoted', id: string) => commit((x) => {
    const on = x[kind].includes(id)
    const learned = { ...x.learned }
    if (kind !== 'promoted') {
      const w = feed.find((f) => f.id === id)
      for (const k of w?.meta.keywords || []) learned[k.toLowerCase()] = Math.max(0, (learned[k.toLowerCase()] || 0) + (on ? -1 : 1))
    }
    return { ...x, learned, [kind]: on ? x[kind].filter((i) => i !== id) : [...x[kind], id] }
  })
  const authorName = profile?.name || 'You'
  const addComment = (id: string, text: string) => commit((x) => ({ ...x, comments: { ...x.comments, [id]: [...(x.comments[id] || []), { name: authorName, text, ts: new Date().toISOString() }] } }))
  const addPost: Store['addPost'] = (post) => {
    const full: CommunityPost = { ...post, id: `up_${Date.now().toString(36)}`, author: authorName, hue: 330, votes: 1, ts: new Date().toISOString(), replies: [] }
    commit((x) => ({ ...x, posts: [full, ...x.posts] }))
    fetch('/api/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(full) }).catch(() => {})
    return full.id
  }
  const vote = (id: string, d: number) => commit((x) => ({ ...x, votes: { ...x.votes, [id]: d } }))
  const reply = (id: string, text: string) => commit((x) => ({ ...x, replies: { ...x.replies, [id]: [...(x.replies[id] || []), { author: authorName, text, ts: new Date().toISOString() }] } }))

  const value: Store = {
    me, creators, buyers: BUYERS, works, events, reports: p.reports, derivatives: p.derivatives, requests: p.requests,
    seals, draft: p.draft, setDraft, loadSample, valuation, licence, setLicence, applyPreset, publish, addEvent,
    respondRequest, claimDerivative, fileReport, resetDemo, serverOnline,
    feed, index, profile, setProfile, skipOnboarding, skippedOnboarding: p.skippedOnboarding, tourDone: p.tourDone, finishTour,
    liked: p.liked, bookmarked: p.bookmarked, promoted: p.promoted, learned: p.learned, toggle,
    comments: p.comments, addComment, posts: [...remotePosts.filter((r) => !p.posts.some((x) => x.id === r.id)), ...p.posts, ...COMMUNITY].sort((a, b) => b.ts.localeCompare(a.ts)), addPost, votes: p.votes, vote, replies: p.replies, reply,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
