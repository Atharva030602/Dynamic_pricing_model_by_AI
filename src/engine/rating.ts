// Creator rating: 1–5 stars, recomputed from evidence rather than from votes.
// Five components (0–100 each), weighted, then mapped to stars = 1 + 4 × score/100.
import type { CreatorProfile, Report, UsageEvent } from '../data/seed'
import type { Decorated } from '../data/meta'
import { valuate } from './valuation'

export type RatingKey = 'credibility' | 'quality' | 'response' | 'aiDemand' | 'consistency'

export interface RatingPart { key: RatingKey; label: string; score: number; weight: number; detail: string }
export interface Rating { stars: number; score: number; parts: RatingPart[]; basis: number; trend: number; pieces: number }

export const RATING_WEIGHTS: Record<RatingKey, number> = { credibility: 0.3, quality: 0.25, response: 0.2, aiDemand: 0.15, consistency: 0.1 }
const LABEL: Record<RatingKey, string> = {
  credibility: 'Credibility', quality: 'Writing quality', response: 'Reader response', aiDemand: 'AI demand', consistency: 'Consistency',
}

const clamp = (x: number) => Math.max(0, Math.min(100, x))
const cache = new Map<string, number>()

function qualityOf(w: Decorated, c: CreatorProfile) {
  const k = `${w.id}:${w.body.length}`
  if (!cache.has(k)) {
    const v = valuate({ title: w.title, body: w.body, kind: w.kind, attachments: { sourceDocs: w.estimate?.confidence === 'high', rawData: w.kind === 'dataset' } }, c)
    cache.set(k, 0.55 * v.signals.originality.score + 0.45 * v.signals.depth.score)
  }
  return cache.get(k)!
}

export function rateCreator(c: CreatorProfile, works: Decorated[], events: UsageEvent[], reports: Report[], extra: { likes?: Record<string, number> } = {}): Rating {
  const mine = works.filter((w) => w.creatorId === c.id)
  const ids = new Set(mine.map((w) => w.id))
  const ev = events.filter((e) => ids.has(e.workId))
  const upheld = reports.filter((r) => ids.has(r.workId) && r.status === 'upheld').length
  const open = reports.filter((r) => ids.has(r.workId) && (r.status === 'under_review' || r.status === 'awaiting_creator')).length
  const disclosed = mine.length ? mine.filter((w) => w.disclosure !== 'ai_generated').length / mine.length : 1

  const credibility = clamp(c.reputation * 55 + (c.verified ? 18 : 0) + disclosed * 17 + (mine.every((w) => w.seal) ? 10 : 6) - upheld * 25 - open * 4)
  const quality = mine.length ? clamp(mine.reduce((a, w) => a + qualityOf(w, c), 0) / mine.length + 8) : 50
  const eng = mine.map((w) => Math.log10(1 + w.meta.likes + (extra.likes?.[w.id] || 0)) * 18 + Math.log10(1 + w.meta.shares) * 10 + w.meta.comments.length * 4)
  const response = mine.length ? clamp(eng.reduce((a, b) => a + b, 0) / mine.length) : 40
  const aiUses = ev.filter((e) => e.buyerKind === 'ai').reduce((a, e) => a + e.units, 0)
  const aiDemand = mine.length ? clamp(Math.log10(1 + aiUses / mine.length) * 38) : 30
  const recent = mine.filter((w) => Date.now() - new Date(w.publishedAt).getTime() < 30 * 864e5).length
  const consistency = clamp(Math.min(c.pastPieces, 60) * 0.9 + recent * 9)

  const raw: Record<RatingKey, [number, string]> = {
    credibility: [credibility, `${c.verified ? 'Verified identity' : 'Identity not verified yet'}, ${upheld ? `${upheld} upheld report${upheld > 1 ? 's' : ''}` : 'no upheld reports'}${mine.length ? ', every piece sealed' : ''}`],
    quality: [quality, mine.length ? `Originality and depth across ${mine.length} piece${mine.length > 1 ? 's' : ''}` : 'Starts at 50 until you publish'],
    response: [response, 'Likes, shares and comments per piece'],
    aiDemand: [aiDemand, `${aiUses.toLocaleString('en-IN')} paid AI uses`],
    consistency: [consistency, `${c.pastPieces} past pieces, ${recent} in the last 30 days`],
  }
  const parts = (Object.keys(RATING_WEIGHTS) as RatingKey[]).map((k) => ({ key: k, label: LABEL[k], score: Math.round(raw[k][0]), weight: RATING_WEIGHTS[k], detail: raw[k][1] }))
  const score = parts.reduce((a, p) => a + p.score * p.weight, 0)
  const stars = Math.round((1 + (4 * score) / 100) * 10) / 10
  const basis = mine.reduce((a, w) => a + w.meta.likes + w.meta.comments.length, 0) + aiUses
  // trend: last 7 days of AI + reader uses vs the 7 before
  const now = Date.now()
  const win = (a: number, b: number) => ev.filter((e) => { const t = now - new Date(e.ts).getTime(); return t >= a * 864e5 && t < b * 864e5 }).length
  const trend = Math.round(((win(0, 7) - win(7, 14)) / Math.max(1, win(7, 14))) * 100)
  return { stars, score: Math.round(score), parts, basis, trend, pieces: mine.length }
}
