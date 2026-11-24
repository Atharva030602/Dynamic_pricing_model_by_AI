import { useMemo, useRef, useState } from 'react'
import { inr } from '../engine/licence'

export interface DayDatum { date: string; human: number; ai: number }

/** Stacked daily columns: people (bottom) and AI (top). Thin marks, 2px surface gap, crosshair tooltip. */
export function DailyBars({ data, height = 220 }: { data: DayDatum[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = height, padL = 44, padR = 8, padT = 12, padB = 26
  const max = useMemo(() => {
    const m = Math.max(1, ...data.map((d) => d.human + d.ai))
    const step = Math.pow(10, Math.floor(Math.log10(m)))
    return Math.ceil(m / step) * step
  }, [data])
  const bw = (W - padL - padR) / data.length
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const ticks = [0, max / 2, max]
  const fmtK = (v: number) => (v >= 1000 ? `₹${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `₹${Math.round(v)}`)

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const i = Math.floor((x - padL) / bw)
    setHover(i >= 0 && i < data.length ? i : null)
  }
  const d = hover != null ? data[hover] : null
  const peak = data.reduce((bi, x, i) => (x.human + x.ai > data[bi].human + data[bi].ai ? i : bi), 0)

  return (
    <div ref={ref} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Earnings per day, people and AI">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#eceef3" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6f7390">{fmtK(t)}</text>
          </g>
        ))}
        {data.map((x, i) => {
          const cx = padL + i * bw + 2
          const w = Math.max(2, bw - 4)
          const hH = y(0) - y(x.human)
          const aH = y(0) - y(x.ai)
          const dim = hover != null && hover !== i
          return (
            <g key={x.date} opacity={dim ? 0.45 : 1}>
              {x.human > 0 && <rect x={cx} y={y(x.human)} width={w} height={Math.max(0, hH)} rx={Math.min(3, w / 2)} fill="#d08a10" />}
              {x.ai > 0 && <rect x={cx} y={y(x.human + x.ai) } width={w} height={Math.max(0, aH - 2)} rx={Math.min(3, w / 2)} fill="#3a55e6" />}
            </g>
          )
        })}
        {data.map((x, i) => (i % 5 === 0 || i === data.length - 1) && (
          <text key={x.date} x={padL + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#6f7390">
            {new Date(x.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </text>
        ))}
        {/* direct label on the peak day */}
        <text x={Math.min(W - padR - 4, padL + peak * bw + bw / 2)} y={y(data[peak].human + data[peak].ai) - 6} textAnchor="middle" fontSize="11" fill="#191c36" fontWeight="600">
          {fmtK(data[peak].human + data[peak].ai)}
        </text>
        {hover != null && <line x1={padL + hover * bw + bw / 2} x2={padL + hover * bw + bw / 2} y1={padT} y2={H - padB} stroke="#191c36" strokeOpacity=".25" />}
      </svg>
      {d && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-[10px] bg-ink text-white px-3 py-2 text-[12.5px] shadow-lg num"
          style={{ left: `${((padL + hover! * bw + bw / 2) / W) * 100}%`, transform: hover! > data.length * 0.6 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}
        >
          <div className="font-semibold mb-1">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-[2px] bg-human" />People <span className="ml-auto pl-4">{inr(Math.round(d.human))}</span></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-[2px] bg-machine" />AI <span className="ml-auto pl-4">{inr(Math.round(d.ai))}</span></div>
          <div className="border-t border-white/20 mt-1 pt-1 flex">Total<span className="ml-auto">{inr(Math.round(d.human + d.ai))}</span></div>
        </div>
      )}
    </div>
  )
}
