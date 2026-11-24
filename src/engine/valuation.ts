// Twofold value estimate — deterministic, explainable, gaming-resistant.
// Formulas are documented in docs/SYSTEM_DESIGN.md §5 and README.
import {
  ATTRIBUTION, COMMODITY_CORPUS, FILLER_PHRASES, FIRST_HAND, KIND_PROFILE, TOPICS,
  type Kind, type Topic,
} from './demand'

export interface Creator {
  id: string
  name: string
  reputation: number // 0..1
  pastPieces: number
  followers: number
}

export interface DraftInput {
  title: string
  body: string
  kind: Kind
  attachments?: { sourceDocs?: boolean; rawData?: boolean }
}

export interface Features {
  words: number
  sentences: number
  paragraphs: number
  uniqueSentenceRatio: number
  trigramRepetition: number
  effectiveWords: number
  lexicalDiversity: number
  numbers: number
  entities: number
  quotes: number
  firstHand: number
  attributions: number
  filler: number
  commoditySimilarity: number
  timeMarkers: number
  topics: { topic: Topic; hits: number }[]
  trendingHits: number
  distinctTrending: number
  titleMismatch: boolean
  sourceDocs: boolean
  rawData: boolean
  kind: Kind
}

export type SignalKey = 'originality' | 'depth' | 'timeliness' | 'demand'

export interface Signal {
  key: SignalKey
  label: string
  score: number // 0..100
  verdict: string // one short plain-language line
  detail: string[] // why
}

export interface Flag { id: string; severity: 'warn' | 'bad'; text: string }
export interface Suggestion { id: string; text: string; uplift: number }

export interface Valuation {
  signals: Record<SignalKey, Signal>
  quality: number
  market: number
  index: number
  prices: { read: number; quote: number; train: number; republish: number }
  breakdown: {
    reads: { units: number; amount: number }
    quotes: { units: number; amount: number }
    training: { probability: number; amount: number }
    derivatives: { amount: number }
  }
  total: number
  low: number
  high: number
  confidence: { score: number; label: 'Low' | 'Medium' | 'High'; reasons: string[] }
  flags: Flag[]
  suggestions: Suggestion[]
  headline: string
  tone: 'low' | 'fair' | 'strong'
  halfLifeHours: number
  features: Features
}

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function countPhrases(lower: string, phrases: string[]) {
  let n = 0
  for (const p of phrases) {
    const re = new RegExp(`(^|[^a-z])${esc(p.toLowerCase())}`, 'g')
    n += (lower.match(re) || []).length
  }
  return n
}

function shingles(words: string[], k = 5) {
  const s = new Set<string>()
  for (let i = 0; i + k <= words.length; i++) s.add(words.slice(i, i + k).join(' '))
  return s
}

const COMMODITY_SHINGLES = COMMODITY_CORPUS.map((t) => shingles(t.split(/\s+/)))

export function extractFeatures(d: DraftInput): Features {
  const body = d.body || ''
  const title = d.title || ''
  const lower = body.toLowerCase()
  const wordsArr = lower.replace(/[^\p{L}\p{N}%₹$'’\s-]/gu, ' ').split(/\s+/).filter(Boolean)
  const words = wordsArr.length

  const rawSentences = body.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 2)
  const norm = rawSentences.map((s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim())
  const uniqueSentenceRatio = rawSentences.length ? new Set(norm).size / rawSentences.length : 1
  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim().length > 30).length

  // phrase-level repetition (catches padding that rewords slightly)
  const tris: string[] = []
  for (let i = 0; i + 3 <= wordsArr.length; i++) tris.push(wordsArr.slice(i, i + 3).join(' '))
  const trigramRepetition = tris.length > 20 ? 1 - new Set(tris).size / tris.length : 0

  // moving-window type/token ratio (length-independent lexical diversity)
  let lexicalDiversity = 0
  if (words >= 50) {
    let acc = 0, n = 0
    for (let i = 0; i + 50 <= words; i += 25) { acc += new Set(wordsArr.slice(i, i + 50)).size / 50; n++ }
    lexicalDiversity = acc / n
  } else if (words > 0) lexicalDiversity = new Set(wordsArr).size / words

  const numbers = (body.match(/(?:₹|\$|rs\.?\s?)?\d[\d,.]*\s?(?:%|crore|lakh|tonnes?|mah|hours?|km|mm|m)?/gi) || []).length

  // proper-noun proxy: capitalised words that do not start a sentence
  const entitySet = new Set<string>()
  for (const s of rawSentences) {
    const toks = s.split(/\s+/)
    toks.slice(1).forEach((t) => {
      const w = t.replace(/[^\p{L}]/gu, '')
      if (w.length > 2 && /^\p{Lu}/u.test(w) && !/^(I|The|A|An|This|That|It|He|She|We|They)$/.test(w)) entitySet.add(w)
    })
  }
  const quotes = (body.match(/[“"][^”"]{12,}[”"]/g) || []).length

  const firstHand = countPhrases(lower, FIRST_HAND)
  const attributions = countPhrases(lower, ATTRIBUTION)
  const filler = countPhrases(lower, FILLER_PHRASES)

  const sh = shingles(wordsArr)
  let commoditySimilarity = 0
  if (sh.size) {
    for (const c of COMMODITY_SHINGLES) {
      let inter = 0
      c.forEach((x) => { if (sh.has(x)) inter++ })
      commoditySimilarity = Math.max(commoditySimilarity, inter / Math.min(c.size, sh.size))
    }
  }

  const timeMarkers = (lower.match(/\b(today(?!['’]s)|tonight|yesterday|this week|this morning|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|breaking|just announced|hours ago|\d{1,2} (nov|november|dec|december)|november \d{1,2})\b/g) || []).length

  const topics: Features['topics'] = []
  let trendingHits = 0
  let distinctTrending = 0
  const hay = `${title.toLowerCase()} \n ${lower}`
  for (const t of TOPICS) {
    const hits = (hay.match(new RegExp(`\\b(${t.pattern})\\b`, 'g')) || []).length
    if (hits) {
      topics.push({ topic: t, hits })
      if (t.trending) { trendingHits += hits; distinctTrending++ }
    }
  }
  topics.sort((a, b) => b.topic.demand - a.topic.demand)

  // clickbait: important title words that never appear in the body
  const titleWords = title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 4)
  const missing = titleWords.filter((w) => !lower.includes(w))
  const titleMismatch = titleWords.length >= 3 && missing.length / titleWords.length > 0.5

  const effectiveWords = words * uniqueSentenceRatio * (1 - trigramRepetition)

  return {
    words, sentences: rawSentences.length, paragraphs, uniqueSentenceRatio, trigramRepetition, effectiveWords,
    lexicalDiversity, numbers, entities: entitySet.size, quotes, firstHand, attributions, filler,
    commoditySimilarity, timeMarkers, topics, trendingHits, distinctTrending, titleMismatch,
    sourceDocs: !!d.attachments?.sourceDocs, rawData: !!d.attachments?.rawData, kind: d.kind,
  }
}

const roundMoney = (x: number) => (x >= 100 ? Math.round(x / 10) * 10 : Math.round(x))
const round1 = (x: number) => Math.round(x * 10) / 10

export function valuateFeatures(f: Features, creator: Creator, withSuggestions = true): Valuation {
  const profile = KIND_PROFILE[f.kind]
  const per100 = Math.max(f.words, 1) / 100
  const flags: Flag[] = []

  // ---- gaming checks ------------------------------------------------------
  const trendingDensity = f.trendingHits / per100
  const specificity = clamp((f.numbers + f.entities * 0.7 + f.quotes * 1.5) / (per100 * 6))
  const stuffing = f.words > 30 && (trendingDensity > 2.5 || (f.distinctTrending >= 4 && specificity < 0.35))
  if (stuffing) flags.push({ id: 'stuffing', severity: 'bad', text: `Trending terms without substance: ${f.trendingHits} mentions of hot topics, few facts behind them. Each topic now counts once.` })
  const paddingPenalty = clamp((1 - f.uniqueSentenceRatio) * 1.5 + Math.max(0, f.trigramRepetition - 0.12) * 2, 0, 0.6)
  if (paddingPenalty > 0.12) flags.push({ id: 'padding', severity: paddingPenalty > 0.3 ? 'bad' : 'warn', text: `Repetition detected: only ${Math.round(f.effectiveWords)} of ${f.words} words carry new information.` })
  if (f.filler >= 2) flags.push({ id: 'filler', severity: 'warn', text: `${f.filler} stock phrases ("it is important to note"…) read as generic filler.` })
  if (f.commoditySimilarity > 0.15) flags.push({ id: 'commodity', severity: 'bad', text: `${Math.round(f.commoditySimilarity * 100)}% overlap with text already widely published.` })
  if (f.titleMismatch) flags.push({ id: 'clickbait', severity: 'warn', text: 'The headline promises things the body never mentions.' })

  // ---- originality --------------------------------------------------------
  const firstHand = clamp(f.firstHand / 2)
  const ld = clamp((f.lexicalDiversity - 0.55) / 0.3)
  const genericPenalty = Math.min(0.5, f.filler * 0.08)
  let O = 100 * clamp(0.45 * specificity + 0.35 * firstHand + 0.2 * ld - genericPenalty - 0.8 * f.commoditySimilarity)
  if (stuffing) O = Math.max(0, O - 15)
  if (f.words < 25) O = Math.min(O, f.words * 2)

  // ---- depth --------------------------------------------------------------
  const lengthScore = clamp(Math.log(1 + f.effectiveWords / 150) / Math.log(1 + 1200 / 150))
  const evidence = clamp((f.attributions + f.quotes + (f.sourceDocs ? 2 : 0) + (f.rawData ? 2 : 0)) / 6)
  const structure = clamp(f.paragraphs / 3)
  const D = 100 * clamp(0.5 * lengthScore + 0.4 * evidence + 0.1 * structure) * (1 - paddingPenalty)

  // ---- timeliness ---------------------------------------------------------
  let tBase = f.kind === 'article' ? (f.timeMarkers > 0 ? 0.82 + Math.min(0.12, f.timeMarkers * 0.03) : 0.5) : f.kind === 'video' ? 0.55 : 0.4
  if (f.words < 25) tBase *= f.words / 25
  const T = 100 * clamp(tBase)

  // ---- demand -------------------------------------------------------------
  const tops = f.topics.map((t) => t.topic.demand)
  let dm = tops.length ? tops[0] + 0.15 * (tops[1] || 0) + 0.05 * (tops[2] || 0) : 0.15
  const listed = f.topics.find((t) => t.topic.listed)
  if (listed) dm += 0.08
  if (stuffing) dm *= 0.5
  const Dm = 100 * clamp(dm)

  const Q = 0.55 * O + 0.45 * D
  const M = 0.65 * Dm + 0.35 * T
  const V = Math.pow(Math.max(Q, 0.1), 0.6) * Math.pow(Math.max(M, 0.1), 0.4)

  // ---- prices -------------------------------------------------------------
  const freshness = (T / 100 + 0.5) / 1.5
  const verifiedPremium = f.sourceDocs || f.rawData ? 1.1 : 1 // checked claims command more and cut dispute risk
  let pRead = (3 + 16 * Math.pow(V / 100, 1.3) * profile.kindFactor) * verifiedPremium
  const suggestFree = V < 25
  if (suggestFree) pRead = 0
  const priceBase = Math.max(pRead, 3)
  const pQuote = round1(Math.max(0.2, priceBase * profile.quoteRatio * freshness))
  const pRepub = roundMoney(Math.max(150, priceBase * 60))

  // ---- volumes (30 days) ------------------------------------------------------
  const reachFactor = 0.5 + 2.5 * (M / 100)
  const conv = (0.04 + 0.16 * (Q / 100)) * profile.convFactor
  const humanUnits = Math.round(creator.followers * reachFactor * conv * (suggestFree ? 0 : 1))
  const humanAmt = humanUnits * pRead

  const agentPool = f.topics.length ? f.topics.slice(0, 2).reduce((a, t) => a + t.topic.agentQueries, 0) : 800
  const citationShare = 0.002 + 0.06 * Math.pow(Q / 100, 1.6) * (0.5 + O / 200)
  const quoteUnits = Math.round(agentPool * citationShare * (stuffing ? 0.3 : 1))
  const quoteAmt = quoteUnits * pQuote

  // training: k x expected 12-month quote income, discounted for perishable work (news ages fast)
  const annualQuote = quoteAmt * profile.monthsOfQuotes
  const pTrain = roundMoney(Math.max(500, profile.trainK * annualQuote * (1 - 0.7 * profile.perishability) * verifiedPremium))
  const pSale = f.kind === 'dataset' ? clamp(0.08 + 0.3 * (O / 100)) : clamp(0.02 + 0.15 * (O / 100))
  const trainAmt = pSale * pTrain * (O < 20 ? 0.2 : 1)

  const derivAmt = 0.1 * humanAmt * (O / 100)

  const total = humanAmt + quoteAmt + trainAmt + derivAmt

  // ---- confidence -------------------------------------------------------------
  const reasons: string[] = []
  const textSuff = clamp(f.words / 400)
  const hist = clamp(creator.pastPieces / 20)
  const topicCov = f.topics.length ? 1 : 0.4
  let conf = 0.35 * textSuff + 0.25 * hist + 0.25 * topicCov + 0.15 * creator.reputation
  if (flags.some((x) => x.severity === 'bad')) conf -= 0.1
  conf = clamp(conf, 0.05, 0.97)
  if (textSuff < 0.6) reasons.push('Draft is short, so the estimate can still move a lot.')
  else reasons.push(`${f.words} words is enough to judge substance.`)
  if (hist < 0.5) reasons.push(`Only ${creator.pastPieces} past pieces to compare with.`)
  else reasons.push(`Calibrated against your ${creator.pastPieces} past pieces.`)
  if (!f.topics.length) reasons.push('We have little demand data for this topic.')
  else reasons.push(`Live demand data for ${f.topics.slice(0, 2).map((t) => t.topic.label).join(' and ')}.`)
  if (flags.some((x) => x.severity === 'bad')) reasons.push('Quality flags make this harder to predict.')
  const confLabel = conf < 0.45 ? 'Low' : conf < 0.7 ? 'Medium' : 'High'
  const u = 0.6 - 0.45 * conf
  const low = Math.max(0, total * (1 - u))
  const high = total * (1 + u)

  // ---- signals in plain language ---------------------------------------
  const lvl = (s: number) => (s >= 70 ? 'high' : s >= 45 ? 'medium' : 'low')
  const signals: Record<SignalKey, Signal> = {
    originality: {
      key: 'originality', label: 'Originality', score: Math.round(O),
      verdict: O >= 70 ? 'New information others don’t have' : O >= 45 ? 'Some original detail' : 'Mostly what’s already out there',
      detail: [
        `${f.numbers} figures, ${f.entities} named people/companies, ${f.quotes} direct quotes`,
        f.firstHand ? `${f.firstHand} first-hand signals (documents seen, own tests, own data)` : 'No first-hand material yet (documents, own tests, own data)',
        ...(f.filler ? [`${f.filler} generic phrases lower this`] : []),
        ...(f.commoditySimilarity > 0.15 ? ['Reads like existing articles'] : []),
      ],
    },
    depth: {
      key: 'depth', label: 'Depth', score: Math.round(D),
      verdict: D >= 70 ? 'Well sourced and substantial' : D >= 45 ? 'Reasonable, could use more evidence' : 'Thin on substance or evidence',
      detail: [
        `${Math.round(f.effectiveWords)} useful words${f.effectiveWords < f.words * 0.9 ? ` (of ${f.words})` : ''}`,
        `${f.attributions} attributions${f.sourceDocs ? ' · source document attached' : ''}${f.rawData ? ' · raw data attached' : ''}`,
      ],
    },
    timeliness: {
      key: 'timeliness', label: 'Timeliness', score: Math.round(T),
      verdict: f.kind === 'article' ? (T >= 75 ? 'Fresh — worth most in the next 36 hours' : 'No clear news hook') : f.kind === 'dataset' ? 'Evergreen — value lasts years, not hours' : 'Stays relevant for weeks',
      detail: [
        `Value halves every ${profile.halfLifeHours >= 24 * 30 ? Math.round(profile.halfLifeHours / 24 / 30) + (profile.halfLifeHours >= 24 * 365 ? ' months' : ' month') : profile.halfLifeHours + ' hours'}`.replace('12 months', 'year'),
        f.timeMarkers ? `${f.timeMarkers} time references anchor it to now` : 'No time reference to this week',
      ],
    },
    demand: {
      key: 'demand', label: 'Demand', score: Math.round(Dm),
      verdict: Dm >= 70 ? 'People and AI agents are asking about this now' : Dm >= 45 ? 'Steady interest' : 'Niche audience today',
      detail: f.topics.length
        ? [
            `Top topics: ${f.topics.slice(0, 3).map((t) => t.topic.label).join(', ')}`,
            `${(agentPool / 1000).toFixed(1)}k agent queries/month on these topics`,
            ...(listed ? [`${listed.topic.label} is listed — finance agents ask about it daily`] : []),
          ]
        : ['No tracked topic matched yet'],
    },
  }

  const tone: Valuation['tone'] = V < 30 ? 'low' : V < 55 ? 'fair' : 'strong'
  const weakest = (Object.values(signals) as Signal[]).sort((a, b) => a.score - b.score)[0]
  const headline =
    f.words < 25 ? 'Start writing — the estimate updates as you type.'
      : tone === 'low' ? `Honestly: this is unlikely to earn much as it stands. The main drag is ${weakest.label.toLowerCase()}.`
      : tone === 'fair' ? `A fair piece. ${weakest.label} is holding it back most.`
      : `Strong piece. ${signals.originality.score >= signals.demand.score ? 'Its originality' : 'Demand for the topic'} is doing most of the work.`

  const val: Valuation = {
    signals, quality: Math.round(Q), market: Math.round(M), index: Math.round(V),
    prices: { read: Math.round(pRead), quote: pQuote, train: pTrain, republish: pRepub },
    breakdown: {
      reads: { units: humanUnits, amount: humanAmt },
      quotes: { units: quoteUnits, amount: quoteAmt },
      training: { probability: pSale, amount: trainAmt },
      derivatives: { amount: derivAmt },
    },
    total, low, high,
    confidence: { score: conf, label: confLabel, reasons },
    flags, suggestions: [], headline, tone, halfLifeHours: profile.halfLifeHours, features: f,
  }

  if (withSuggestions && f.words >= 25) val.suggestions = suggest(f, creator, val)
  return val
}

function suggest(f: Features, creator: Creator, base: Valuation): Suggestion[] {
  const cands: { id: string; text: string; mod: Partial<Features> }[] = []
  if (f.kind !== 'dataset' && !f.sourceDocs && f.firstHand > 0) cands.push({ id: 'attach', text: 'Attach the document you quote (kept private, used only for verification)', mod: { sourceDocs: true } })
  if (f.kind === 'dataset' && !f.rawData) cands.push({ id: 'raw', text: 'Attach a sample of the raw data so buyers can check quality', mod: { rawData: true } })
  if (f.kind === 'dataset' && f.attributions < 4) cands.push({ id: 'checks', text: 'Explain how buyers can check the data: error rates, spot checks, gaps', mod: { attributions: f.attributions + 3 } })
  if (f.kind !== 'dataset' && f.quotes < 2) cands.push({ id: 'quotes', text: 'Add a named on-record source or a direct quote', mod: { quotes: f.quotes + 2, attributions: f.attributions + 2, entities: f.entities + 2 } })
  if (f.numbers / Math.max(f.words / 100, 1) < 2) cands.push({ id: 'specifics', text: 'Add hard numbers: amounts, dates, quantities', mod: { numbers: f.numbers + 6 } })
  if (f.firstHand === 0) cands.push({ id: 'firsthand', text: 'Say what you saw, tested or obtained yourself', mod: { firstHand: 2 } })
  if (f.uniqueSentenceRatio < 0.9 || f.trigramRepetition > 0.15) cands.push({ id: 'trim', text: 'Cut the repeated passages — length without new information lowers value', mod: { uniqueSentenceRatio: 1, trigramRepetition: 0.05, effectiveWords: f.effectiveWords } })
  if (base.flags.some((x) => x.id === 'stuffing')) cands.push({ id: 'unstuff', text: 'Drop the list of trending keywords and stick to your actual topic', mod: { trendingHits: 2, distinctTrending: 1 } })
  if (f.filler >= 2) cands.push({ id: 'filler', text: 'Replace stock phrases with specifics', mod: { filler: 0 } })
  if (f.kind === 'article' && f.timeMarkers === 0) cands.push({ id: 'news', text: 'Anchor it to this week — what changed, and when', mod: { timeMarkers: 2 } })
  if (f.effectiveWords < 300 && f.kind !== 'dataset') cands.push({ id: 'length', text: 'Develop it further — explain why it matters and what happens next', mod: { effectiveWords: f.effectiveWords + 250, words: f.words + 250, paragraphs: f.paragraphs + 2 } })
  if (f.titleMismatch) cands.push({ id: 'title', text: 'Make the headline match what the piece actually says', mod: { titleMismatch: false } })

  return cands
    .map((c) => {
      const v = valuateFeatures({ ...f, ...c.mod } as Features, creator, false)
      return { id: c.id, text: c.text, uplift: Math.round(v.total - base.total) }
    })
    .filter((s) => s.uplift > 0)
    .sort((a, b) => b.uplift - a.uplift)
    .slice(0, 3)
}

export function valuate(d: DraftInput, creator: Creator): Valuation {
  return valuateFeatures(extractFeatures(d), creator)
}

/** Apply bounded LLM nudges (±10 per signal) on top of the rule-based result. */
export function applyNudges(v: Valuation, creator: Creator, nudges: Partial<Record<SignalKey, number>>): Valuation {
  // Re-weight by scaling the underlying signal and recomputing money with the same formulas.
  const clampN = (x?: number) => Math.max(-10, Math.min(10, Math.round(x || 0)))
  const adj = { originality: clampN(nudges.originality), depth: clampN(nudges.depth), timeliness: clampN(nudges.timeliness), demand: clampN(nudges.demand) }
  const ratio = (k: SignalKey) => {
    const s = v.signals[k].score
    return s > 0 ? clamp((s + adj[k]) / s, 0.5, 1.5) : 1
  }
  const f = v.features
  const nf: Features = {
    ...f,
    numbers: f.numbers * ratio('originality'),
    firstHand: f.firstHand * ratio('originality'),
    attributions: f.attributions * ratio('depth'),
    timeMarkers: f.timeMarkers * ratio('timeliness'),
    topics: f.topics.map((t) => ({ ...t, topic: { ...t.topic, demand: clamp(t.topic.demand * ratio('demand')) } })),
  }
  return valuateFeatures(nf, creator)
}
