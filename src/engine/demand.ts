// Simulated market signals. In production these come from live reader search,
// agent query logs and engagement data (the "market" half of pricing).
// All companies below are fictional.

export interface Topic {
  id: string
  label: string
  /** regex source, matched case-insensitively on word boundaries */
  pattern: string
  /** 0..1 — how much people + agents are asking about this today */
  demand: number
  /** AI agent queries per month touching this topic (simulated) */
  agentQueries: number
  /** counts toward keyword-stuffing detection */
  trending?: boolean
  /** a listed company: finance agents ask about these constantly */
  listed?: boolean
}

export const TOPICS: Topic[] = [
  { id: 'voltaris', label: 'Voltaris Cells', pattern: 'voltaris', demand: 0.92, agentQueries: 38000, listed: true },
  { id: 'andes', label: 'Andes Litio', pattern: 'andes litio', demand: 0.55, agentQueries: 6200, listed: true },
  { id: 'saffron', label: 'Saffron Motors', pattern: 'saffron motors', demand: 0.7, agentQueries: 14000, listed: true },
  { id: 'meridian', label: 'Meridian Bank', pattern: 'meridian bank', demand: 0.6, agentQueries: 9000, listed: true },
  { id: 'lithium', label: 'Lithium supply', pattern: 'lithium', demand: 0.78, agentQueries: 21000, trending: true },
  { id: 'ev', label: 'EVs', pattern: 'ev|evs|electric vehicles?', demand: 0.74, agentQueries: 26000, trending: true },
  { id: 'battery', label: 'Batteries', pattern: 'batter(y|ies)', demand: 0.66, agentQueries: 17000 },
  { id: 'groundwater', label: 'Groundwater', pattern: 'groundwater|water table|aquifers?', demand: 0.58, agentQueries: 5200 },
  { id: 'monsoon', label: 'Monsoon & drought', pattern: 'monsoon|drought|rainfall', demand: 0.64, agentQueries: 8800 },
  { id: 'marathwada', label: 'Marathwada', pattern: 'marathwada', demand: 0.42, agentQueries: 1900 },
  { id: 'phones', label: 'Smartphones', pattern: 'smartphones?|phones|handsets?', demand: 0.68, agentQueries: 19000 },
  { id: 'ai_stocks', label: 'AI stocks', pattern: 'ai stocks?', demand: 0.9, agentQueries: 52000, trending: true },
  { id: 'crypto', label: 'Crypto', pattern: 'crypto(currency|currencies)?|bitcoin', demand: 0.84, agentQueries: 47000, trending: true },
  { id: 'ipo', label: 'IPOs', pattern: 'ipos?', demand: 0.8, agentQueries: 31000, trending: true },
  { id: 'budget', label: 'Budget 2026', pattern: 'budget 2026|union budget', demand: 0.72, agentQueries: 24000, trending: true },
  { id: 'gold', label: 'Gold price', pattern: 'gold price|gold rates?', demand: 0.7, agentQueries: 22000, trending: true },
  { id: 'rates', label: 'Interest rates', pattern: 'interest rates?|repo rate', demand: 0.69, agentQueries: 20000, trending: true },
  { id: 'stocks', label: 'Stock tips', pattern: 'stock tips?|multibagger|stock market', demand: 0.62, agentQueries: 30000, trending: true },
]

/** Phrases that signal generic, low-information prose (often machine-written filler). */
export const FILLER_PHRASES = [
  "in today's fast-paced world", 'in today’s fast-paced world', 'it is important to note', 'it is worth noting',
  'in conclusion', 'game-changer', 'game changer', 'unlock the', 'dive into', 'deep dive', 'ever-evolving',
  'plays a crucial role', 'needless to say', 'at the end of the day', 'the best ever', 'you won’t believe',
  "you won't believe", 'must-read', 'skyrocket', 'secret that', 'experts agree', 'click here', 'stay tuned',
  'without further ado', 'in this article we will', 'a wide range of', 'navigate the', 'landscape of',
]

/** Markers of first-hand, original reporting or research. */
export const FIRST_HAND = [
  'seen by', 'reviewed by', 'obtained by', 'i tested', 'we tested', 'i measured', 'we measured', 'i ran', 'we ran',
  'our dataset', 'this dataset', 'i spoke', 'told this reporter', 'told me', 'exclusive', 'first reported',
  'internal memo', 'documents show', 'field readings', 'we collected', 'i collected', 'logged', 'our own',
  'i test', 'my test', 'my own', 'we trained',
]

/** Markers that a claim is attributed to a source. */
export const ATTRIBUTION = [
  'according to', 'said', 'told', 'memo', 'filing', 'data shows', 'records show', 'spokesperson', 'analyst',
  'survey', 'interview', 'methodology', 'source:', 'sources', 'documents', 'confirmed', 'declined to comment',
  'measured', 'spreadsheet', 'test loop', 'data dictionary', 'spot checks', 'calibrated', 'quality flag',
]

/** Already-published commodity text. Rewrites of this kind of prose score low on originality. */
export const COMMODITY_CORPUS = [
  'investing in the stock market can be a great way to grow your wealth over time but it is important to do your research before you invest',
  'here are the top 10 best stocks to buy now for huge returns in 2026 that experts say could skyrocket',
  'artificial intelligence is changing the way we live and work and ai stocks are one of the hottest sectors for investors right now',
  'cryptocurrency is a digital currency that uses cryptography for security and bitcoin is the most popular cryptocurrency in the world',
  'electric vehicles are the future of transportation and many companies are investing heavily in ev technology and battery production',
]

export const KIND_PROFILE = {
  article: { label: 'Article', halfLifeHours: 36, kindFactor: 1.0, perishability: 0.85, quoteRatio: 0.12, convFactor: 1, trainK: 2, monthsOfQuotes: 2.2 },
  video: { label: 'Video', halfLifeHours: 24 * 30, kindFactor: 0.8, perishability: 0.4, quoteRatio: 0.08, convFactor: 1, trainK: 2, monthsOfQuotes: 6 },
  dataset: { label: 'Dataset', halfLifeHours: 24 * 365, kindFactor: 18, perishability: 0.1, quoteRatio: 0.012, convFactor: 0.15, trainK: 5, monthsOfQuotes: 12 },
} as const

export type Kind = keyof typeof KIND_PROFILE
