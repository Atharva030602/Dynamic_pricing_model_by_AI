import { valuate } from '../src/engine/valuation'
import { SAMPLES } from '../src/data/samples'
const creators: any = {
  riya: { id:'riya', name:'Riya', reputation: 0.78, pastPieces: 46, followers: 3200 },
  arjun:{ id:'arjun', name:'Arjun', reputation: 0.85, pastPieces: 9, followers: 900 },
  kabir:{ id:'kabir', name:'Kabir', reputation: 0.62, pastPieces: 31, followers: 5400 },
}
for (const s of SAMPLES) {
  const v = valuate({ title: s.title, body: s.body, kind: s.kind, attachments: s.attachments }, creators[s.creatorId])
  console.log('\n==', s.id, '| V', v.index, 'Q', v.quality, 'M', v.market, '| conf', v.confidence.label, v.confidence.score.toFixed(2))
  for (const k of Object.values(v.signals)) console.log(' ', k.label.padEnd(11), k.score, '-', k.verdict, '|', k.detail.join(' ; '))
  console.log('  prices', v.prices)
  console.log('  reads', v.breakdown.reads, 'quotes', v.breakdown.quotes, 'train', v.breakdown.training, 'deriv', Math.round(v.breakdown.derivatives.amount))
  console.log('  total', Math.round(v.total), 'range', Math.round(v.low), '-', Math.round(v.high))
  console.log('  flags', v.flags.map(f=>f.id+': '+f.text))
  console.log('  sugg', v.suggestions)
  console.log('  headline', v.headline)
  const f = v.features; console.log('  feat', {w:f.words, eff:Math.round(f.effectiveWords), usr:f.uniqueSentenceRatio.toFixed(2), tri:f.trigramRepetition.toFixed(2), ld:f.lexicalDiversity.toFixed(2), num:f.numbers, ent:f.entities, q:f.quotes, fh:f.firstHand, att:f.attributions, fill:f.filler, sim:f.commoditySimilarity.toFixed(2), tm:f.timeMarkers, trend:f.trendingHits, dt:f.distinctTrending})
}
