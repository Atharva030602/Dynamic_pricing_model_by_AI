import { useEffect, useState } from 'react'
import { INSTRUMENTS } from '../data/v2'
import { cx } from './kit'

interface Tick { sym: string; name: string; unit?: string; open: number; price: number; hist: number[] }

function seedWalk() {
  let s = 20261125
  const r = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296) - 0.5
  return INSTRUMENTS.map((i) => {
    const hist: number[] = []
    let p = i.price
    for (let k = 0; k < 30; k++) { p *= 1 + r() * i.vol * 2.2; hist.push(p) }
    // the Voltaris scoop pushed its price down this week
    if (i.sym === 'VLTC') hist.forEach((_, k) => (hist[k] *= 1 - k * 0.0013))
    return { sym: i.sym, name: i.name, unit: i.unit, open: hist[0], price: hist[hist.length - 1], hist }
  })
}

export function useMarket(interval = 2600) {
  const [ticks, setTicks] = useState<Tick[]>(seedWalk)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setTicks((ts) => ts.map((t) => {
        const vol = INSTRUMENTS.find((i) => i.sym === t.sym)!.vol
        const price = t.price * (1 + (Math.random() - 0.5) * vol * 1.6)
        return { ...t, price, hist: [...t.hist.slice(1), price] }
      }))
    }, interval)
    return () => clearInterval(id)
  }, [interval])
  return ticks
}

const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: n > 5000 ? 0 : 2, minimumFractionDigits: n > 5000 ? 0 : 2 })

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 64},${20 - ((v - min) / (max - min || 1)) * 18 - 1}`).join(' ')
  return (
    <svg viewBox="0 0 64 20" width="64" height="20" aria-hidden className="shrink-0">
      <polyline points={pts} fill="none" stroke={up ? 'var(--color-good)' : 'var(--color-bad)'} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function MarketPanel({ highlight }: { highlight?: string[] }) {
  const ticks = useMarket()
  return (
    <section aria-labelledby="mkt-h">
      <div className="flex items-baseline justify-between">
        <h2 id="mkt-h" className="text-[15px] font-semibold flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-good live-dot" aria-hidden />Markets</h2>
        <span className="text-[11.5px] text-muted">simulated</span>
      </div>
      <ul className="mt-2 divide-y divide-line-2">
        {ticks.map((t) => {
          const ch = ((t.price - t.open) / t.open) * 100
          const up = ch >= 0
          const hot = highlight?.includes(t.sym)
          return (
            <li key={t.sym} className={cx('py-2.5 flex items-center gap-2', hot && 'bg-human-wash/60 -mx-2 px-2 rounded-[8px]')}>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">{t.sym}</span>
                <span className="block text-[11.5px] text-muted truncate">{t.name}</span>
              </span>
              <Spark data={t.hist} up={up} />
              <span className="text-right w-[78px] shrink-0">
                <span className="block text-[13px] tab font-medium">{fmt(t.price)}</span>
                <span className={cx('block text-[11.5px] tab font-medium', up ? 'text-good' : 'text-bad')}>{up ? '▲' : '▼'} {Math.abs(ch).toFixed(2)}%</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-[11.5px] text-muted mt-2 leading-snug">Fictional companies from our stories. Prices are simulated for the prototype.</p>
    </section>
  )
}

/** Thin scrolling strip for small screens. */
export function MarketStrip() {
  const ticks = useMarket()
  const row = ticks.map((t) => {
    const ch = ((t.price - t.open) / t.open) * 100
    return (
      <span key={t.sym} className="inline-flex items-center gap-1.5 px-4 text-[12.5px]">
        <strong className="font-semibold">{t.sym}</strong>
        <span className="tab">{fmt(t.price)}</span>
        <span className={cx('tab', ch >= 0 ? 'text-good' : 'text-bad')}>{ch >= 0 ? '▲' : '▼'}{Math.abs(ch).toFixed(2)}%</span>
      </span>
    )
  })
  return (
    <div className="overflow-hidden border-b border-line bg-paper/60 h-8 flex items-center" aria-label="Simulated market prices">
      <div className="marquee flex whitespace-nowrap">{row}{row}</div>
    </div>
  )
}
