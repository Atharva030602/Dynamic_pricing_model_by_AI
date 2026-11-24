// One simulated month of activity (25 Oct – 24 Nov 2026). Seeded so numbers are stable.
// Every creator, buyer, company and outlet is fictional.
import type { Kind } from '../engine/demand'
import type { UseKey } from '../engine/licence'

export interface CreatorProfile {
  id: string
  name: string
  handle: string
  beat: string
  location: string
  reputation: number
  pastPieces: number
  followers: number
  joined: string
  verified: boolean
  avatarHue: number
}

export const CREATORS: Record<string, CreatorProfile> = {
  riya: { id: 'riya', name: 'Riya Deshpande', handle: '@riya.d', beat: 'Independent markets reporter', location: 'Pune', reputation: 0.78, pastPieces: 46, followers: 3200, joined: '2025', verified: true, avatarHue: 18 },
  arjun: { id: 'arjun', name: 'Dr Arjun Rao', handle: '@arjun.water', beat: 'Hydrologist, independent researcher', location: 'Aurangabad', reputation: 0.85, pastPieces: 9, followers: 900, joined: '2026', verified: true, avatarHue: 200 },
  kabir: { id: 'kabir', name: 'Kabir Sethi', handle: '@kabirtests', beat: 'Phone reviewer, video creator', location: 'Delhi', reputation: 0.62, pastPieces: 31, followers: 5400, joined: '2025', verified: true, avatarHue: 280 },
  neha: { id: 'neha', name: 'Neha Kulkarni', handle: '@nehak', beat: 'Civic reporter', location: 'Pune', reputation: 0.7, pastPieces: 22, followers: 1800, joined: '2026', verified: true, avatarHue: 140 },
}

export type BuyerKind = 'human' | 'ai'
export interface Buyer { id: string; name: string; kind: BuyerKind; type: string; note: string }

export const BUYERS: Record<string, Buyer> = {
  readers: { id: 'readers', name: 'Readers (pay per read)', kind: 'human', type: 'Readers', note: 'Individual readers unlocking single pieces' },
  pass: { id: 'pass', name: 'Twofold Pass readers', kind: 'human', type: 'Subscribers', note: '₹199/month pool, paid out per read' },
  northgate: { id: 'northgate', name: 'Northgate Securities', kind: 'human', type: 'Analyst desk', note: 'Team licence for research use' },
  arthvarta: { id: 'arthvarta', name: 'Arthvarta (Marathi)', kind: 'human', type: 'Publisher', note: 'Republishes in Marathi' },
  sixty: { id: 'sixty', name: '60 Second Markets', kind: 'human', type: 'Video channel', note: 'Short explainer clips' },
  ledger: { id: 'ledger', name: 'The Ledger Brief', kind: 'human', type: 'Newsletter', note: 'Daily summary newsletter' },
  lumen: { id: 'lumen', name: 'Lumen Assistant', kind: 'ai', type: 'AI assistant', note: 'General-purpose chat assistant' },
  kestrel: { id: 'kestrel', name: 'Kestrel Search', kind: 'ai', type: 'AI search', note: 'Answer engine with citations' },
  finpilot: { id: 'finpilot', name: 'FinPilot', kind: 'ai', type: 'Trading agent', note: 'Agent that briefs traders before they place orders' },
  halcyon: { id: 'halcyon', name: 'Halcyon Labs', kind: 'ai', type: 'Model builder', note: 'Trains foundation models' },
  digest: { id: 'digest', name: 'Morning Digest bot', kind: 'ai', type: 'AI summariser', note: 'Auto-generated news digests' },
}

export interface SeedWork {
  id: string
  creatorId: string
  kind: Kind
  title: string
  dek: string
  body: string
  topics: string[]
  publishedAt: string // ISO
  disclosure: 'human' | 'ai_assisted' | 'ai_generated'
  aiUses: string[]
  readPrice: number
  quotePrice: number
  trainPermission: 'paid' | 'ask' | 'no'
  trainPrice: number
  republishPrice: number
  section: string
}

export const SEED_WORKS: SeedWork[] = [
  {
    id: 'tf_sfd_0007', creatorId: 'riya', kind: 'article', section: 'Markets',
    title: 'Saffron Motors’ dealers are sitting on 41 days of unsold cars',
    dek: 'Dealer stock in four western states is the highest since 2023, according to a dealers’ association survey shared with this reporter.',
    body: `Saffron Motors' dealers in Maharashtra, Gujarat, Goa and Madhya Pradesh were holding 41 days of unsold stock at the end of September, according to a survey by a regional dealers' association shared with this reporter. That is the highest level since 2023, when the figure peaked at 46 days.

The survey covered 212 of the company's 380 dealerships in the region. Dealers said wholesale dispatches from the company had stayed high even as retail sales slowed after the monsoon.

"We are being pushed to take cars we cannot sell before the festive offers end," a dealer in Nashik said. He asked not to be named because his contract bars him from speaking to the media.

A Saffron Motors spokesperson said inventory was "within healthy limits" and expected festive demand to clear it by November.`,
    topics: ['Saffron Motors'], publishedAt: '2026-10-21T08:00:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 12, quotePrice: 1.4, trainPermission: 'ask', trainPrice: 2100, republishPrice: 720,
  },
  {
    id: 'tf_vlt_0001', creatorId: 'riya', kind: 'article', section: 'Markets',
    title: 'Voltaris Cells quietly reprices its lithium deal as Atacama delay bites',
    dek: 'An internal memo seen by this reporter shows the Pune battery maker agreed to pay 18% more per tonne — a cost it has not disclosed to shareholders.',
    body: '', // filled from SAMPLES.scoop at runtime
    topics: ['Voltaris Cells', 'Lithium', 'EVs'], publishedAt: '2026-11-21T10:02:00+05:30',
    disclosure: 'ai_assisted', aiUses: ['proofreading'], readPrice: 17, quotePrice: 2, trainPermission: 'ask', trainPrice: 10880, republishPrice: 1050,
  },
  {
    id: 'tf_sfm_0002', creatorId: 'riya', kind: 'article', section: 'Markets',
    title: 'Saffron Motors’ new EV plant: what the land records show',
    dek: 'Revenue records from Chakan show the company has bought only 40% of the land its investor deck says is "secured".',
    body: `Saffron Motors told investors in September that land for its second EV plant near Chakan was "fully secured". Revenue records for the three villages involved, which I reviewed on 4 November, show the company has registered purchases for 112 of the 280 acres it needs.

The remaining plots belong to 63 farming families. Eleven of them told me they have not been approached. "Nobody from the company has come here," said Dattatray Gaikwad, who owns four acres on the planned access road.

A Saffron Motors spokesperson said negotiations were "progressing well" and that the plant remained on track for 2028. The state industrial corporation, which is facilitating the purchase, said 96 acres were in "advanced discussion".

Analysts have assumed the plant adds 150,000 vehicles of capacity by 2029. A delay of a year would push that capacity out of most current forecasts.`,
    topics: ['Saffron Motors', 'EVs'], publishedAt: '2026-11-07T08:40:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 14, quotePrice: 1.6, trainPermission: 'paid', trainPrice: 6800, republishPrice: 840,
  },
  {
    id: 'tf_lth_0003', creatorId: 'riya', kind: 'article', section: 'Explainers',
    title: 'Explainer: why lithium prices swing so violently',
    dek: 'Three things drive almost every big move. None of them is demand from car buyers.',
    body: `Lithium prices doubled in 2022, fell 80% by 2024 and are rising again. The swings look random, but three forces explain most of them.

First, supply is concentrated. A handful of brine and hard-rock sites produce most of the world's lithium, so one permitting delay moves the whole market.

Second, the contracts are opaque. Most lithium is sold under private long-term deals, so spot prices reflect a thin slice of trade and overreact.

Third, battery makers stockpile. When prices rise they buy ahead, which pushes prices higher; when prices fall they run down inventory and buy nothing.

For companies that make battery cells, the lesson is that a supply contract is only as stable as the mine behind it.`,
    topics: ['Lithium', 'EVs'], publishedAt: '2026-10-30T09:15:00+05:30',
    disclosure: 'ai_assisted', aiUses: ['research', 'proofreading'], readPrice: 0, quotePrice: 1, trainPermission: 'paid', trainPrice: 2400, republishPrice: 300,
  },
  {
    id: 'tf_gw_0004', creatorId: 'arjun', kind: 'dataset', section: 'Data',
    title: 'Marathwada groundwater: 412 wells, monthly readings, 2019–2026',
    dek: 'Seven years of hand-measured water-table depth from village wells across eight districts, cleaned and geotagged.',
    body: '', topics: ['Groundwater', 'Monsoon'], publishedAt: '2026-11-12T12:00:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 229, quotePrice: 1.6, trainPermission: 'ask', trainPrice: 70320, republishPrice: 13720,
  },
  {
    id: 'tf_ph_0005', creatorId: 'kabir', kind: 'video', section: 'Reviews',
    title: 'I drained 7 mid-range phones to zero, three times. Here’s what actually lasts.',
    dek: 'A 14-minute test of real-world battery life, with the full spreadsheet.',
    body: '', topics: ['Smartphones', 'Batteries'], publishedAt: '2026-11-18T18:30:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 12, quotePrice: 0.7, trainPermission: 'no', trainPrice: 9090, republishPrice: 700,
  },
  {
    id: 'tf_mtr_0006', creatorId: 'neha', kind: 'article', section: 'Cities',
    title: 'Pune Metro Line 3: RTI papers show a 14-month gap in the signalling contract',
    dek: 'The contractor was paid 62% of the value before testing began, documents obtained under the RTI Act show.',
    body: `Documents obtained under the Right to Information Act show that the contractor for Pune Metro Line 3's signalling system was paid 62% of the contract value by March 2026, though field testing did not begin until May.

The papers, which I received on 17 November, also show the metro authority extended the testing deadline twice without imposing the penalty set out in the contract, about ₹38 crore.

A metro spokesperson said the extensions were "due to site handover delays outside the contractor's control". The line's opening, first promised for December 2025, is now listed as "mid-2027".`,
    topics: ['Pune Metro'], publishedAt: '2026-11-19T07:30:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 9, quotePrice: 1.1, trainPermission: 'no', trainPrice: 3000, republishPrice: 540,
  },
]

// ---------------------------------------------------------------------------
// Usage events
export interface UsageEvent {
  id: string
  ts: string
  workId: string
  buyerId: string
  buyerKind: BuyerKind
  use: UseKey
  units: number
  amount: number // gross INR
  via: 'web' | 'mcp' | 'edge'
  live?: boolean
  note?: string
}

export const CREATOR_SHARE = 0.85
export const PASS_PAYOUT_PER_READ = 4.2

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const MONTH_START = new Date('2026-10-26T00:00:00+05:30')
export const TODAY = new Date('2026-11-24T00:00:00+05:30')

const dayIso = (d: Date, hour: number) => {
  const x = new Date(d)
  x.setHours(hour, Math.floor((hour * 37) % 60), 0, 0)
  return x.toISOString()
}

export function generateEvents(): UsageEvent[] {
  const r = rng(20261124)
  const events: UsageEvent[] = []
  let n = 0
  const add = (e: Omit<UsageEvent, 'id'>) => events.push({ id: `ev_${(++n).toString(36)}`, ...e })

  // only Riya's works drive the dashboard in detail; others get light activity for the feed
  const profiles: Record<string, { reads: number; pass: number; quotes: Record<string, number>; halfLifeDays: number; viral?: string }> = {
    tf_vlt_0001: { reads: 520, pass: 260, quotes: { finpilot: 540, kestrel: 240, lumen: 180, digest: 80 }, halfLifeDays: 1.6, viral: '2026-11-22' },
    tf_sfm_0002: { reads: 210, pass: 120, quotes: { finpilot: 160, kestrel: 90, lumen: 60, digest: 30 }, halfLifeDays: 2.5 },
    tf_sfd_0007: { reads: 150, pass: 90, quotes: { finpilot: 110, kestrel: 60, lumen: 40, digest: 20 }, halfLifeDays: 2.5 },
    tf_lth_0003: { reads: 0, pass: 0, quotes: { lumen: 46, kestrel: 38, finpilot: 14 }, halfLifeDays: 20 },
  }
  const freeReads: Record<string, number> = { tf_lth_0003: 90 }

  for (const w of SEED_WORKS.filter((x) => x.creatorId === 'riya')) {
    const p = profiles[w.id]
    const pub = new Date(w.publishedAt)
    for (let d = new Date(Math.max(pub.getTime(), MONTH_START.getTime())); d < TODAY; d.setDate(d.getDate() + 1)) {
      const age = (d.getTime() - pub.getTime()) / 86400000
      const decay = Math.pow(0.5, Math.max(0, age) / p.halfLifeDays) * 0.85 + 0.07
      const dow = d.getDay()
      const weekday = dow === 0 || dow === 6 ? 0.62 : 1
      const viral = p.viral && d.toISOString().slice(0, 10) === new Date(p.viral + 'T00:00:00+05:30').toISOString().slice(0, 10) ? 1.9 : 1
      const k = decay * weekday * viral
      const noise = () => 0.8 + r() * 0.4

      const reads = Math.round(p.reads * k * noise())
      if (reads > 0 && w.readPrice > 0) add({ ts: dayIso(d, 9 + Math.floor(r() * 10)), workId: w.id, buyerId: 'readers', buyerKind: 'human', use: 'read', units: reads, amount: reads * w.readPrice, via: 'web' })
      const pass = Math.round(p.pass * k * noise())
      if (pass > 0) add({ ts: dayIso(d, 8 + Math.floor(r() * 12)), workId: w.id, buyerId: 'pass', buyerKind: 'human', use: 'read', units: pass, amount: Math.round(pass * PASS_PAYOUT_PER_READ), via: 'web' })
      const fr = freeReads[w.id] ? Math.round(freeReads[w.id] * k * noise()) : 0
      if (fr > 0) add({ ts: dayIso(d, 12), workId: w.id, buyerId: 'readers', buyerKind: 'human', use: 'read', units: fr, amount: 0, via: 'web', note: 'free read' })
      for (const [buyer, base] of Object.entries(p.quotes)) {
        const q = Math.round(base * (0.45 + 0.55 * k) * noise())
        if (q > 0) add({ ts: dayIso(d, 6 + Math.floor(r() * 16)), workId: w.id, buyerId: buyer, buyerKind: 'ai', use: 'ai_quote', units: q, amount: Math.round(q * w.quotePrice * 10) / 10, via: 'mcp' })
      }
    }
  }

  // one-off licences
  add({ ts: '2026-11-15T15:20:00+05:30', workId: 'tf_sfm_0002', buyerId: 'halcyon', buyerKind: 'ai', use: 'ai_train', units: 1, amount: 6800, via: 'mcp', note: 'Training licence · model "Halcyon-4"' })
  add({ ts: '2026-11-02T11:05:00+05:30', workId: 'tf_lth_0003', buyerId: 'halcyon', buyerKind: 'ai', use: 'ai_train', units: 1, amount: 2400, via: 'mcp', note: 'Training licence · model "Halcyon-4"' })
  add({ ts: '2026-11-21T13:40:00+05:30', workId: 'tf_vlt_0001', buyerId: 'northgate', buyerKind: 'human', use: 'read', units: 25, amount: 25 * 17 * 0.8, via: 'web', note: 'Team licence, 25 seats' })
  add({ ts: '2026-11-22T09:10:00+05:30', workId: 'tf_vlt_0001', buyerId: 'arthvarta', buyerKind: 'human', use: 'republish', units: 1, amount: 1050, via: 'web', note: 'Marathi translation' })
  add({ ts: '2026-11-22T16:45:00+05:30', workId: 'tf_vlt_0001', buyerId: 'sixty', buyerKind: 'human', use: 'republish', units: 1, amount: 1050, via: 'web', note: '60-second clip' })
  add({ ts: '2026-11-09T07:00:00+05:30', workId: 'tf_sfm_0002', buyerId: 'ledger', buyerKind: 'human', use: 'republish', units: 1, amount: 840, via: 'web', note: 'Newsletter summary' })

  // royalties flowing back from derivatives (daily)
  for (const dv of DERIVATIVES.filter((x) => x.declared)) {
    const start = new Date(dv.since)
    let remaining = dv.paidBack
    const days = Math.max(1, Math.round((TODAY.getTime() - start.getTime()) / 86400000))
    for (let i = 0; i < days && remaining > 0; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i)
      const amt = i === days - 1 ? remaining : Math.round((dv.paidBack / days) * (0.7 + r() * 0.6))
      const a = Math.min(remaining, Math.max(1, amt))
      remaining -= a
      add({ ts: dayIso(d, 23), workId: dv.parentId, buyerId: dv.byId, buyerKind: 'human', use: 'republish', units: 0, amount: a, via: 'web', note: `Royalty from ${dv.type}` })
    }
  }

  return events.sort((a, b) => a.ts.localeCompare(b.ts))
}

// ---------------------------------------------------------------------------
export interface Derivative {
  id: string
  parentId: string
  parentDerivativeId?: string
  type: 'translation' | 'clip' | 'summary' | 'voice-over' | 'copy'
  title: string
  by: string
  byId: string
  declared: boolean
  similarity: number
  sharePct: number
  earnings: number
  paidBack: number
  since: string
  status: 'paying' | 'unclaimed' | 'requested'
}

export const DERIVATIVES: Derivative[] = [
  { id: 'dv1', parentId: 'tf_vlt_0001', type: 'translation', title: 'व्होल्टारिस सेल्सचा लिथियम करार महागला (Marathi)', by: 'Arthvarta', byId: 'arthvarta', declared: true, similarity: 0.94, sharePct: 30, earnings: 3120, paidBack: 936, since: '2026-11-22T09:10:00+05:30', status: 'paying' },
  { id: 'dv2', parentId: 'tf_vlt_0001', type: 'clip', title: '60-sec: Voltaris’s hidden lithium bill', by: '60 Second Markets', byId: 'sixty', declared: true, similarity: 0.62, sharePct: 20, earnings: 2400, paidBack: 480, since: '2026-11-22T16:45:00+05:30', status: 'paying' },
  { id: 'dv3', parentId: 'tf_vlt_0001', parentDerivativeId: 'dv2', type: 'voice-over', title: 'Hindi voice-over of the 60-sec clip', by: 'Bazaar Awaaz', byId: 'sixty', declared: true, similarity: 0.58, sharePct: 20, earnings: 900, paidBack: 36, since: '2026-11-23T11:00:00+05:30', status: 'paying' },
  { id: 'dv4', parentId: 'tf_sfm_0002', type: 'summary', title: 'Saffron’s land gap, in 90 words', by: 'The Ledger Brief', byId: 'ledger', declared: true, similarity: 0.48, sharePct: 15, earnings: 1800, paidBack: 270, since: '2026-11-09T07:00:00+05:30', status: 'paying' },
  { id: 'dv5', parentId: 'tf_vlt_0001', type: 'copy', title: 'Copy found on stockbuzz-daily (unlicensed)', by: 'stockbuzz-daily', byId: 'unknown', declared: false, similarity: 0.71, sharePct: 30, earnings: 0, paidBack: 0, since: '2026-11-23T08:00:00+05:30', status: 'unclaimed' },
]

// ---------------------------------------------------------------------------
export interface Report {
  id: string
  workId: string
  reason: string
  claim: string
  reporters: { label: string; weight: number }[]
  status: 'dismissed' | 'awaiting_creator' | 'under_review' | 'corrected' | 'upheld'
  escrowPct: number
  heldAmount: number
  opened: string
  timeline: { ts: string; text: string }[]
  creatorResponse?: string
}

export const REPORTS: Report[] = [
  {
    id: 'rp1', workId: 'tf_vlt_0001', reason: 'Factually wrong',
    claim: '“The 18% figure is wrong; the supply contract has not changed.”',
    reporters: [{ label: 'Verified buyer of this piece', weight: 0.6 }, { label: 'Pass subscriber', weight: 0.3 }, { label: 'New anonymous account', weight: 0.1 }, { label: 'New anonymous account', weight: 0.1 }],
    status: 'under_review', escrowPct: 27.5, heldAmount: 0, opened: '2026-11-23T10:20:00+05:30',
    timeline: [
      { ts: '2026-11-23T10:20:00+05:30', text: 'Reports reached weight 1.1 — review opened. Holding 27.5% of this piece’s new earnings.' },
      { ts: '2026-11-23T18:05:00+05:30', text: 'Riya responded and shared the memo privately with reviewers (sealed, not published).' },
      { ts: '2026-11-24T09:00:00+05:30', text: 'Independent fact-checker assigned. Decision due by 26 Nov.' },
    ],
    creatorResponse: 'I stand by the figure. The memo is dated 20 Nov and signed by the procurement head; shared with reviewers.',
  },
  {
    id: 'rp2', workId: 'tf_sfm_0002', reason: 'Misleading headline',
    claim: '“Headline implies the plant is cancelled.”',
    reporters: [{ label: 'Pass subscriber', weight: 0.3 }, { label: 'New anonymous account', weight: 0.1 }],
    status: 'dismissed', escrowPct: 0, heldAmount: 0, opened: '2026-11-10T14:00:00+05:30',
    timeline: [
      { ts: '2026-11-10T14:00:00+05:30', text: 'Report weight 0.4, below the 1.0 review threshold. Nothing held.' },
      { ts: '2026-11-12T10:00:00+05:30', text: 'Auto-closed after 48 h with no further reports. Dismissed.' },
    ],
  },
]

export const PENDING_REQUESTS = [
  { id: 'rq1', workId: 'tf_vlt_0001', buyerId: 'halcyon', use: 'ai_train' as UseKey, offer: 9500, ts: '2026-11-23T16:30:00+05:30', note: 'Wants to include it in "Halcyon-5" training set. Offered ₹9,500 against your suggested ₹10,880.' },
]
