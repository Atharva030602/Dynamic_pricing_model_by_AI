import { SEED } from '../src/data/works'
import { META, SECTION_TO_CATEGORY, metaFor } from '../src/data/v2'
import { Index } from '../src/engine/similarity'
const docs = SEED.map((w) => { const cat = SECTION_TO_CATEGORY[w.section] || 'Markets'; const m = metaFor(w.id, cat, w.topics); return { id: w.id, title: w.title, dek: w.dek, body: w.body, keywords: m.keywords, category: cat, publishedAt: w.publishedAt } })
const ix = new Index(docs)
for (const q of ['football in india', 'EV battery costs', 'farm loans drought', 'power cuts in pune', 'cricket for girls', 'is AI paying journalists']) {
  console.log('\n## ' + q)
  for (const r of ix.search(q, 5)) console.log(r.score.toFixed(2), r.kind.padEnd(8), r.doc.title.slice(0, 60), '|', r.why, r.alsoBecause ? ' +' + r.alsoBecause : '')
}
console.log('\n## related to Indonesia'); for (const r of ix.related('tf_idn_0101')) console.log(r.score, r.doc.title.slice(0,50), '|', r.why)
