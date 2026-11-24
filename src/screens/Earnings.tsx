import { useMemo, useState } from 'react'
import { DailyBars, type DayDatum } from '../charts/DailyBars'
import { CREATOR_SHARE, MONTH_START, type Derivative, type UsageEvent } from '../data/seed'
import { USE_META, inr, type UseKey } from '../engine/licence'
import { valuate } from '../engine/valuation'
import { useStore, type Work } from '../store'
import { Badge, Button, Icon, ago, cx, fmtDate, fmtTime } from '../ui/kit'

const USE_COLOR: Record<UseKey, string> = { read: 'bg-use-read', ai_quote: 'bg-use-quote', ai_train: 'bg-use-train', republish: 'bg-use-republish' }
const USE_SHORT: Record<UseKey, string> = { read: 'Reading', ai_quote: 'AI answers', ai_train: 'AI training', republish: 'Republishing & derivatives' }
const net = (x: number) => x * CREATOR_SHARE

export default function Earnings() {
  const { me, works, events, buyers, reports, derivatives, requests, respondRequest, claimDerivative } = useStore()
  const [workFilter, setWorkFilter] = useState('all')
  const [showTable, setShowTable] = useState(false)
  const mine = works.filter((w) => w.creatorId === me.id)
  const ids = new Set(mine.map((w) => w.id))
  const evs = useMemo(() => events.filter((e) => ids.has(e.workId) && new Date(e.ts) >= MONTH_START && (workFilter === 'all' || e.workId === workFilter)), [events, workFilter, mine.length])

  const total = evs.reduce((a, e) => a + e.amount, 0)
  const human = evs.filter((e) => e.buyerKind === 'human').reduce((a, e) => a + e.amount, 0)
  const ai = total - human
  const humanUnits = evs.filter((e) => e.buyerKind === 'human' && e.use === 'read').reduce((a, e) => a + e.units, 0)
  const aiUnits = evs.filter((e) => e.use === 'ai_quote').reduce((a, e) => a + e.units, 0)

  // escrow: only the reported piece's earnings since the review opened
  const open = reports.filter((r) => r.status === 'under_review' || r.status === 'awaiting_creator')
  const held = open.reduce((a, r) => a + net(events.filter((e) => e.workId === r.workId && e.ts >= r.opened).reduce((s, e) => s + e.amount, 0)) * (r.escrowPct / 100), 0)

  const days: DayDatum[] = useMemo(() => {
    const map = new Map<string, DayDatum>()
    const now = new Date()
    for (let d = new Date(MONTH_START); d <= now; d.setDate(d.getDate() + 1)) {
      const k = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      map.set(k, { date: k + 'T12:00:00+05:30', human: 0, ai: 0 })
    }
    for (const e of evs) {
      const k = new Date(e.ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      const x = map.get(k)
      if (!x) continue
      if (e.buyerKind === 'human') x.human += net(e.amount)
      else x.ai += net(e.amount)
    }
    return [...map.values()]
  }, [evs])

  const byUse = (['read', 'ai_quote', 'ai_train', 'republish'] as UseKey[]).map((u) => {
    const xs = evs.filter((e) => e.use === u)
    const amt = xs.reduce((a, e) => a + e.amount, 0)
    const units = xs.reduce((a, e) => a + e.units, 0)
    const paidUnits = xs.filter((e) => e.amount > 0 && e.units > 0).reduce((a, e) => a + e.units, 0)
    const paidAmt = xs.filter((e) => e.units > 0).reduce((a, e) => a + e.amount, 0)
    return { u, amt: net(amt), units, avg: paidUnits ? paidAmt / paidUnits : 0 }
  })
  const maxUse = Math.max(1, ...byUse.map((x) => x.amt))

  const byBuyer = useMemo(() => {
    const m = new Map<string, { id: string; amt: number; units: number; uses: Set<UseKey>; last: string }>()
    for (const e of evs) {
      const x = m.get(e.buyerId) || { id: e.buyerId, amt: 0, units: 0, uses: new Set<UseKey>(), last: e.ts }
      x.amt += net(e.amount); x.units += e.units; x.uses.add(e.use); if (e.ts > x.last) x.last = e.ts
      m.set(e.buyerId, x)
    }
    return [...m.values()].sort((a, b) => b.amt - a.amt)
  }, [evs])

  const recent = [...evs].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 10)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.01em]">Earnings</h1>
          <p className="text-[14px] text-ink-2">{fmtDate(MONTH_START.toISOString(), { day: 'numeric', month: 'long' })} to today. Amounts are your 85% share.</p>
        </div>
        <label className="flex items-center gap-2 text-[13.5px] text-ink-2">
          Showing
          <select value={workFilter} onChange={(e) => setWorkFilter(e.target.value)} className="h-9 rounded-[9px] border border-line bg-surface px-2 text-[14px] text-ink max-w-[260px]">
            <option value="all">All {mine.length} pieces</option>
            {mine.map((w) => <option key={w.id} value={w.id}>{w.title.slice(0, 48)}{w.title.length > 48 ? '…' : ''}</option>)}
          </select>
        </label>
      </div>

      {/* headline row */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="panel p-5">
          <p className="text-[13.5px] text-ink-2">You earned</p>
          <p className="text-[32px] font-semibold num tracking-[-0.02em] mt-1">{inr(Math.round(net(total)))}</p>
          <p className="text-[12.5px] text-muted mt-1">{humanUnits.toLocaleString('en-IN')} paid reads, {aiUnits.toLocaleString('en-IN')} AI answers</p>
        </div>
        <div className="panel p-5">
          <p className="text-[13.5px] text-ink-2">From people vs AI</p>
          <div className="flex items-baseline justify-between mt-2 num">
            <span className="text-[20px] font-semibold flex items-center gap-1.5"><Icon.person className="text-human" />{inr(Math.round(net(human)))}</span>
            <span className="text-[20px] font-semibold flex items-center gap-1.5">{inr(Math.round(net(ai)))}<Icon.machine className="text-machine" /></span>
          </div>
          <div className="flex h-2.5 mt-3 gap-[2px]" aria-hidden>
            <div className="bg-human rounded-l-full" style={{ width: `${(human / Math.max(1, total)) * 100}%` }} />
            <div className="bg-machine rounded-r-full flex-1" />
          </div>
          <p className="text-[12.5px] text-muted mt-2">{Math.round((ai / Math.max(1, total)) * 100)}% came from AI systems that would have paid you nothing before.</p>
        </div>
        <div className="panel p-5">
          <p className="text-[13.5px] text-ink-2">Held while a report is reviewed</p>
          <p className="text-[32px] font-semibold num tracking-[-0.02em] mt-1">{inr(Math.round(held))}</p>
          <p className="text-[12.5px] text-muted mt-1">Only from the one reported piece, since the review opened. Everything else pays out as normal.</p>
        </div>
        <div className={cx('panel p-5', requests.length > 0 && 'border-machine/40')}>
          <p className="text-[13.5px] text-ink-2">Waiting for your OK</p>
          {requests.length ? requests.map((r) => (
            <div key={r.id} className="mt-2">
              <p className="text-[14px]"><span className="font-semibold">{buyers[r.buyerId].name}</span> wants to train on “{works.find((w) => w.id === r.workId)?.title.slice(0, 40)}…”</p>
              <p className="text-[12.5px] text-muted mt-1">{r.note}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="machine" onClick={() => respondRequest(r.id, true)}>Accept {inr(r.offer)}</Button>
                <Button size="sm" variant="secondary" onClick={() => respondRequest(r.id, false)}>Decline</Button>
              </div>
            </div>
          )) : <p className="text-[14px] mt-2 text-ink-2">Nothing waiting.</p>}
        </div>
      </section>

      <section className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-4">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-[15px] font-semibold">Earned per day</h2>
            <div className="flex items-center gap-4 text-[12.5px] text-ink-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-human" />People</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-machine" />AI systems</span>
              <button className="underline cursor-pointer" onClick={() => setShowTable(!showTable)}>{showTable ? 'Chart' : 'Table'}</button>
            </div>
          </div>
          {showTable ? (
            <div className="max-h-[260px] overflow-auto text-[13px]">
              <table className="w-full num"><thead className="text-muted text-left"><tr><th className="font-medium py-1">Day</th><th className="font-medium text-right">People</th><th className="font-medium text-right">AI</th></tr></thead>
                <tbody>{days.map((d) => <tr key={d.date} className="border-t border-line-2"><td className="py-1">{fmtDate(d.date)}</td><td className="text-right">{inr(Math.round(d.human))}</td><td className="text-right">{inr(Math.round(d.ai))}</td></tr>)}</tbody></table>
            </div>
          ) : <div className="overflow-x-auto -mx-1 px-1"><div className="min-w-[560px]"><DailyBars data={days} /></div></div>}
          <p className="text-[12.5px] text-muted mt-2">Each piece peaks on publishing day and fades with its half-life. AI answers keep paying long after readers move on.</p>
        </div>
        <div className="panel p-5">
          <h2 className="text-[15px] font-semibold">By type of use</h2>
          <ul className="mt-4 space-y-4">
            {byUse.map((x) => (
              <li key={x.u}>
                <div className="flex items-baseline justify-between gap-2 text-[14px]">
                  <span className="flex items-center gap-2">{USE_META[x.u].who === 'ai' ? <Icon.machine className="text-machine" /> : <Icon.person className="text-human" />}{USE_SHORT[x.u]}</span>
                  <span className="num font-semibold">{inr(Math.round(x.amt))}</span>
                </div>
                <div className="h-2 mt-1.5 rounded-full bg-line-2"><div className={cx('h-2 rounded-full', USE_COLOR[x.u])} style={{ width: `${Math.max(1.5, (x.amt / maxUse) * 100)}%` }} /></div>
                <p className="text-[12.5px] text-muted mt-1 num">
                  {x.u === 'read' && `${x.units.toLocaleString('en-IN')} reads, avg ${inr(x.avg, { decimals: true })} each`}
                  {x.u === 'ai_quote' && `${x.units.toLocaleString('en-IN')} answers, avg ${inr(x.avg, { decimals: true })} each`}
                  {x.u === 'ai_train' && `${x.units} model licence${x.units === 1 ? '' : 's'}, one-time`}
                  {x.u === 'republish' && `${x.units} licences plus royalties`}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] text-muted mt-4 pt-3 border-t border-line-2">An AI answer pays about a tenth of a read but happens far more often. Training pays most per deal, once.</p>
        </div>
      </section>

      <section className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
        <div className="panel p-5">
          <h2 className="text-[15px] font-semibold mb-3">Who used your work</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="text-left text-muted"><tr><th className="font-medium pb-2">Buyer</th><th className="font-medium pb-2">Used it for</th><th className="font-medium pb-2 text-right">Times</th><th className="font-medium pb-2 text-right">You got</th></tr></thead>
              <tbody>
                {byBuyer.map((b) => {
                  const by = buyers[b.id]
                  return (
                    <tr key={b.id} className="border-t border-line-2">
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2">
                          <span className={cx('w-6 h-6 rounded-full grid place-items-center shrink-0', by?.kind === 'ai' ? 'bg-machine-wash text-machine' : 'bg-human-wash text-human-ink')}>{by?.kind === 'ai' ? <Icon.machine /> : <Icon.person />}</span>
                          <span><span className="block font-medium">{by?.name || b.id}</span><span className="block text-[12px] text-muted">{by?.type}</span></span>
                        </span>
                      </td>
                      <td className="pr-3 text-ink-2">{[...b.uses].map((u) => USE_SHORT[u]).join(', ')}</td>
                      <td className="text-right num">{b.units ? b.units.toLocaleString('en-IN') : '—'}</td>
                      <td className="text-right num font-medium">{inr(Math.round(b.amt))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Latest activity</h2>
            <span className="text-[12.5px] text-muted flex items-center gap-1.5"><Icon.live /> Live</span>
          </div>
          <ul className="mt-3 divide-y divide-line-2">
            {recent.map((e) => <ActivityRow key={e.id} e={e} works={works} />)}
          </ul>
        </div>
      </section>

      <section className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
        <DerivativesPanel derivatives={derivatives} works={mine} onClaim={claimDerivative} />
        <ReportsPanel />
      </section>

      <PiecesPanel works={mine} events={events} />
    </div>
  )
}

function ActivityRow({ e, works }: { e: UsageEvent; works: Work[] }) {
  const { buyers } = useStore()
  const b = buyers[e.buyerId]
  const w = works.find((x) => x.id === e.workId)
  const verb = e.use === 'read' ? (e.units > 1 ? `${e.units} people read` : 'read') : e.use === 'ai_quote' ? (e.units > 1 ? `quoted in ${e.units} answers` : 'quoted in an answer') : e.use === 'ai_train' ? 'licensed for training' : e.units ? 'licensed to republish' : 'paid a royalty on'
  return (
    <li className={cx('py-2.5 flex gap-3 text-[13.5px]', e.live && 'arrive')}>
      <span className={cx('mt-0.5 w-6 h-6 rounded-full grid place-items-center shrink-0', e.buyerKind === 'ai' ? 'bg-machine-wash text-machine' : 'bg-human-wash text-human-ink')}>{e.buyerKind === 'ai' ? <Icon.machine /> : <Icon.person />}</span>
      <span className="flex-1 min-w-0">
        <span className="font-medium">{b?.name || e.buyerId}</span> {verb} <span className="text-ink-2">“{w?.title.slice(0, 44)}{(w?.title.length || 0) > 44 ? '…' : ''}”</span>
        <span className="block text-[12px] text-muted">{e.live ? ago(e.ts) : `${fmtDate(e.ts)}, ${fmtTime(e.ts)}`}{e.via === 'mcp' && !e.note?.includes('MCP') ? ', via MCP' : ''}{e.note ? `, ${e.note}` : ''}</span>
      </span>
      <span className="num font-medium whitespace-nowrap">{e.amount ? inr(Math.round(net(e.amount) * 100) / 100, { decimals: e.amount < 10 }) : 'free'}</span>
    </li>
  )
}

function DerivativesPanel({ derivatives, works, onClaim }: { derivatives: Derivative[]; works: Work[]; onClaim: (id: string) => void }) {
  const parents = works.filter((w) => derivatives.some((d) => d.parentId === w.id))
  const totalBack = derivatives.reduce((a, d) => a + d.paidBack, 0)
  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold">Built on your work</h2>
        <span className="text-[13px] text-ink-2 num">{inr(totalBack)} paid back to you</span>
      </div>
      <p className="text-[12.5px] text-muted mt-1">Translations, clips and summaries pay a share of what they earn. Copies that didn’t declare themselves are found by fingerprint.</p>
      <div className="mt-4 space-y-5">
        {parents.map((p) => {
          const kids = derivatives.filter((d) => d.parentId === p.id && !d.parentDerivativeId)
          return (
            <div key={p.id}>
              <p className="font-serif text-[16px] font-medium leading-snug">{p.title}</p>
              <ul className="mt-2 ml-2 border-l-2 border-line pl-4 space-y-3">
                {kids.map((d) => (
                  <li key={d.id} className="relative">
                    <span className="absolute -left-4 top-3 w-3 h-[2px] bg-line" aria-hidden />
                    <DerivRow d={d} onClaim={onClaim} />
                    {derivatives.filter((g) => g.parentDerivativeId === d.id).map((g) => (
                      <div key={g.id} className="ml-2 mt-2 border-l-2 border-line pl-4 relative">
                        <span className="absolute -left-[2px] top-3 w-3 h-[2px] bg-line" aria-hidden />
                        <DerivRow d={g} onClaim={onClaim} nested />
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DerivRow({ d, onClaim, nested }: { d: Derivative; onClaim: (id: string) => void; nested?: boolean }) {
  return (
    <div className={cx('rounded-[10px] border p-3', d.status === 'unclaimed' ? 'border-bad/40 bg-bad-wash/40' : 'border-line-2')}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={d.declared ? 'neutral' : 'bad'}>{d.type === 'copy' ? 'Unlicensed copy' : d.type[0].toUpperCase() + d.type.slice(1)}</Badge>
        <span className="text-[13.5px] font-medium">{d.by}</span>
        <span className="text-[12.5px] text-muted">{Math.round(d.similarity * 100)}% match</span>
      </div>
      <p className="text-[13px] text-ink-2 mt-1.5">{d.title}</p>
      {d.status === 'paying' ? (
        <p className="text-[12.5px] text-muted mt-1 num">Earned {inr(d.earnings)}, pays back {d.sharePct}%{nested ? ' to the clip, which passes on its share' : ''}: <span className="text-ink font-medium">{inr(d.paidBack)} to you</span></p>
      ) : d.status === 'unclaimed' ? (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[12.5px] text-bad">Earning from your work without a licence.</span>
          <Button size="sm" variant="secondary" onClick={() => onClaim(d.id)}>Ask them to license it</Button>
        </div>
      ) : (
        <p className="text-[12.5px] text-wait mt-1">Licence request sent. If they don’t respond in 7 days we send a takedown notice for you.</p>
      )}
    </div>
  )
}

function ReportsPanel() {
  const { reports, works } = useStore()
  const label: Record<string, { t: string; tone: 'bad' | 'wait' | 'good' | 'neutral' }> = {
    under_review: { t: 'Under review', tone: 'wait' }, awaiting_creator: { t: 'Waiting for your response', tone: 'bad' }, dismissed: { t: 'Dismissed', tone: 'good' }, corrected: { t: 'Corrected', tone: 'neutral' }, upheld: { t: 'Upheld', tone: 'bad' },
  }
  return (
    <div className="panel p-5">
      <h2 className="text-[15px] font-semibold">Reports that a piece is fake or misleading</h2>
      <p className="text-[12.5px] text-muted mt-1">A review opens only when credible reports add up to 1.0. Until it’s decided, only that piece’s new earnings are partly held.</p>
      <ul className="mt-4 space-y-4">
        {reports.map((r) => {
          const w = works.find((x) => x.id === r.workId)
          const weight = r.reporters.reduce((a, x) => a + x.weight, 0)
          return (
            <li key={r.id} className="rounded-[10px] border border-line-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={label[r.status].tone}>{label[r.status].t}</Badge>
                <span className="text-[13px] text-muted">{r.reason}, opened {fmtDate(r.opened)}</span>
              </div>
              <p className="font-serif text-[15.5px] mt-2 leading-snug">{w?.title}</p>
              <p className="text-[13.5px] text-ink-2 mt-1">{r.claim}</p>
              <div className="mt-3">
                <div className="flex justify-between text-[12px] text-muted"><span>Report weight {weight.toFixed(1)} of 1.0</span><span>{r.reporters.length} reporters</span></div>
                <div className="relative h-2 mt-1 rounded-full bg-line-2">
                  <div className={cx('h-2 rounded-full', weight >= 1 ? 'bg-bad' : 'bg-wait')} style={{ width: `${Math.min(100, weight * 100)}%` }} />
                </div>
                <p className="text-[12px] text-muted mt-1">{r.reporters.map((x) => `${x.label} (${x.weight})`).join(', ')}</p>
              </div>
              {r.escrowPct > 0 && <p className="text-[13px] mt-2"><span className="font-medium">Holding {r.escrowPct}%</span> of this piece’s new earnings until the decision.</p>}
              <ol className="mt-3 space-y-1.5 text-[12.5px] text-ink-2">
                {r.timeline.map((t, i) => <li key={i} className="flex gap-2"><span className="text-muted whitespace-nowrap num">{fmtDate(t.ts)}</span><span>{t.text}</span></li>)}
              </ol>
              {r.creatorResponse && <p className="mt-2 text-[12.5px] bg-line-2 rounded-[8px] p-2"><span className="font-medium">Your response:</span> {r.creatorResponse}</p>}
              {r.status === 'awaiting_creator' && <Button size="sm" variant="secondary" className="mt-3">Respond with evidence</Button>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PiecesPanel({ works, events }: { works: Work[]; events: UsageEvent[] }) {
  const { me } = useStore()
  const rows = works.map((w) => {
    const xs = events.filter((e) => e.workId === w.id)
    const amt = net(xs.reduce((a, e) => a + e.amount, 0))
    const aiAmt = net(xs.filter((e) => e.buyerKind === 'ai').reduce((a, e) => a + e.amount, 0))
    // post-publish market price: launch price x engagement vs expectation, bounded 0.5-2x
    const v = valuate({ title: w.title, body: w.body, kind: w.kind }, me)
    const expectedPerDay = Math.max(1, v.breakdown.reads.units / 30)
    const last3 = xs.filter((e) => e.use === 'read' && Date.now() - new Date(e.ts).getTime() < 3 * 864e5).reduce((a, e) => a + e.units, 0) / 3
    const ageH = (Date.now() - new Date(w.publishedAt).getTime()) / 36e5
    const launch = w.licence.uses.read.price
    const mult = ageH < 24 ? 1 : Math.max(0.5, Math.min(1.5, Math.sqrt(last3 / expectedPerDay)))
    const now = launch ? Math.max(3, Math.round(launch * mult)) : 0
    return { w, amt, aiShare: amt ? aiAmt / amt : 0, launch, now, est: w.estimate }
  })
  return (
    <div className="panel p-5">
      <h2 className="text-[15px] font-semibold">Your pieces</h2>
      <p className="text-[12.5px] text-muted mt-1">Before publishing, the price comes from the content. After, it follows real demand (between half and 1.5× the launch price; you can set your own floor and ceiling).</p>
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-[13.5px] min-w-[640px]">
          <thead className="text-left text-muted"><tr><th className="font-medium pb-2">Piece</th><th className="font-medium pb-2">Published</th><th className="font-medium pb-2 text-right">Earned</th><th className="font-medium pb-2 pl-6">People / AI</th><th className="font-medium pb-2 text-right">Read price now</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.w.id} className="border-t border-line-2">
                <td className="py-2.5 pr-4"><a href={`#/work/${r.w.id}`} className="font-serif text-[15px] hover:underline">{r.w.title}</a>{r.est && <span className="block text-[12px] text-muted">Estimated {inr(r.est.low)}–{inr(r.est.high)} ({r.est.confidence.toLowerCase()} confidence)</span>}</td>
                <td className="text-ink-2 whitespace-nowrap">{r.w.live ? ago(r.w.publishedAt) : fmtDate(r.w.publishedAt)}</td>
                <td className="text-right num font-medium">{inr(Math.round(r.amt))}</td>
                <td className="pl-6"><div className="flex h-2 w-28 gap-[2px]"><div className="bg-human rounded-l-full" style={{ width: `${(1 - r.aiShare) * 100}%` }} /><div className="bg-machine rounded-r-full flex-1" /></div></td>
                <td className="text-right num whitespace-nowrap">{r.launch ? <>{inr(r.now)} {r.now !== r.launch && <span className={cx('text-[12px]', r.now > r.launch ? 'text-good' : 'text-muted')}>(launched {inr(r.launch)})</span>}</> : 'Free'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
