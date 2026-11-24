import type { Work } from './works'
import { CATEGORY_LIST, SECTION_TO_CATEGORY, metaFor, type Category, type WorkMeta } from './v2'

export interface Decorated extends Work { category: Category; meta: WorkMeta }

export function categoryOf(w: Pick<Work, 'section'>): Category {
  return SECTION_TO_CATEGORY[w.section] || 'Markets'
}

export function decorate(w: Work): Decorated {
  const category = categoryOf(w)
  const meta = metaFor(w.id, category, w.topics)
  if (w.live && !meta.refs.length) {
    const kws = [...new Set([...guessKeywords(`${w.title} ${w.dek} ${w.body}`), ...w.topics])].slice(0, 5)
    return { ...w, category, meta: { ...meta, keywords: kws.length ? kws : [category] } }
  }
  return { ...w, category, meta }
}

const HINTS: Record<Category, string[]> = {
  Markets: ['shares', 'investors', 'stock', 'company', 'profit', 'revenue', 'ev', 'battery', 'bank', 'loan', 'ipo', 'plant', 'motors', 'lithium'],
  Sports: ['match', 'football', 'cricket', 'team', 'coach', 'goal', 'tournament', 'league', 'players', 'qualifier', 'squad'],
  Tech: ['ai', 'phone', 'app', 'software', 'data centre', 'chip', 'model', 'startup', 'internet', 'gadget'],
  Climate: ['monsoon', 'rain', 'drought', 'groundwater', 'heat', 'solar', 'farmers', 'crop', 'emissions', 'flood'],
  Cities: ['metro', 'bus', 'traffic', 'municipal', 'civic', 'road', 'housing', 'corporation', 'commuters', 'ward'],
  Culture: ['film', 'cinema', 'music', 'book', 'festival', 'director', 'album', 'theatre', 'food'],
}

/** Best-guess interest category for a new piece, from its words. */
export function guessCategory(text: string): Category {
  const t = ` ${text.toLowerCase()} `
  let best: Category = 'Markets', score = 0
  for (const c of CATEGORY_LIST) {
    const words = [...HINTS[c.id], ...c.keywords.map((k) => k.toLowerCase())]
    const s = words.reduce((a, w) => a + (t.match(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`, 'g'))?.length || 0), 0)
    if (s > score) { score = s; best = c.id }
  }
  return best
}

/** Keywords for a new piece: the interest keywords it actually mentions. */
export function guessKeywords(text: string): string[] {
  const t = text.toLowerCase()
  const all = CATEGORY_LIST.flatMap((c) => c.keywords)
  return all.filter((k) => k !== 'Books' && new RegExp(`\\b${k.toLowerCase().replace(/s$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`).test(t)).slice(0, 5)
}
