import { useMemo, useState } from 'react'
import { CREATOR_SHARE } from '../data/seed'
import { inr } from '../engine/licence'
import { useStore } from '../store'
import { Button, Icon, Photo, cx, fmtDate, go } from '../ui/kit'

export default function Hub() {
  const { me, works, events, profile, feed, requests, index } = useStore()
  const first = me.name.split(' ')[0]
  const mine = works.filter((w) => w.creatorId === me.id)
  const ids = new Set(mine.map((w) => w.id))
  const month = useMemo(() => {
    const since = Date.now() - 30 * 864e5
    let people = 0, ai = 0
    for (const e of events) if (ids.has(e.workId) && new Date(e.ts).getTime() > since) (e.buyerKind === 'ai' ? (ai += e.amount) : (people += e.amount))
    return { people: people * CREATOR_SHARE, ai: ai * CREATOR_SHARE }
  }, [events, mine.length])
  const topics = profile?.keywords?.length ? profile.keywords : ['EVs', 'Lithium', 'Stock market']
  const ideas = useMemo(() => {
    const out = new Map<string, { kw: string; n: number; top: string }>()
    for (const k of topics) {
      const r = index.search(k, 3)
      if (r.length) out.set(k, { kw: k, n: r.length, top: r[0].doc.title })
    }
    return [...out.values()]
  }, [index, topics.join()])
  const hour = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }))
  const greet = hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[260px]">
          <h1 className="font-serif text-[32px] md:text-[40px] leading-[1.05] font-medium">{greet}, {first}</h1>
          <p className="text-[15.5px] text-ink-2 mt-1">{mine.length ? `You have ${mine.length} published ${mine.length === 1 ? 'piece' : 'pieces'}. Here’s what’s happening.` : 'Your studio is ready. Publish your first piece to start earning from readers and AI.'}</p>
        </div>
        <Button variant="primary" onClick={() => go('/studio/write')}>Write a new piece</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Earned in 30 days" value={inr(month.people + month.ai)} sub="after Twofold’s 15%" />
        <Stat label="From readers" value={inr(month.people)} tone="human" />
        <Stat label="From AI" value={inr(month.ai)} tone="machine" />
        <Stat label="Waiting for you" value={String(me.id === 'riya' ? requests.length : 0)} sub="AI training requests" />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <section className="panel p-5" aria-labelledby="mine-h">
          <div className="flex items-baseline justify-between">
            <h2 id="mine-h" className="text-[16px] font-semibold">Your pieces</h2>
            {mine.length > 0 && <a href="#/studio/earnings" className="text-[13.5px] underline underline-offset-4 text-ink-2">Full earnings</a>}
          </div>
          {mine.length === 0 ? (
            <div className="mt-4 rounded-[12px] border border-dashed border-line p-6 text-center">
              <p className="text-[15px] font-semibold">Nothing published yet</p>
              <p className="text-[14px] text-ink-2 mt-1">Write or paste a piece. You’ll see what it’s worth before you publish.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Button variant="primary" size="sm" onClick={() => go('/studio/write')}>Start writing</Button>
                <Button size="sm" onClick={() => go('/studio/demo')}>Watch the live demo first</Button>
              </div>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line-2">
              {mine.slice(0, 6).map((w) => {
                const d = feed.find((x) => x.id === w.id)
                const earned = events.filter((e) => e.workId === w.id).reduce((a, e) => a + e.amount, 0) * CREATOR_SHARE
                const aiN = events.filter((e) => e.workId === w.id && e.buyerKind === 'ai').reduce((a, e) => a + e.units, 0)
                return (
                  <li key={w.id}>
                    <a href={`#/work/${w.id}`} className="flex gap-3 py-3 group">
                      {d && <Photo src={d.meta.image.url} alt="" ratio="4/3" className="w-20 shrink-0 rounded-[8px]" showCredit={false} />}
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-[16.5px] leading-snug group-hover:underline line-clamp-2">{w.title}</span>
                        <span className="block text-[12.5px] text-muted mt-1">{fmtDate(w.publishedAt)}, {d?.category}, {aiN} AI uses</span>
                      </span>
                      <span className="text-[15px] font-semibold num shrink-0">{inr(earned)}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="panel p-5" aria-labelledby="ideas-h">
          <h2 id="ideas-h" className="text-[16px] font-semibold">What your readers follow</h2>
          <p className="text-[13px] text-muted mt-0.5">Topics from your profile and what’s already on Twofold about them.</p>
          <ul className="mt-3 space-y-3">
            {ideas.map((i) => (
              <li key={i.kw} className="rounded-[10px] bg-paper p-3">
                <p className="text-[14px] font-semibold">{i.kw}</p>
                <p className="text-[13px] text-ink-2 mt-0.5 line-clamp-2">Latest: {i.top}</p>
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] text-muted mt-3">Fresh, first-hand pieces on these topics get the highest prices, especially in the first 36 hours.</p>
        </section>
      </div>

      <section className="grid md:grid-cols-3 gap-4" aria-label="How the studio works">
        {[
          ['Write & value', 'See what your piece is worth, why, and how to raise it, before you publish.', '/studio/write'],
          ['Licence', 'Separate prices for readers and AI, in plain English and as data agents read.', '/studio/licence'],
          ['Earnings', 'Every read and every AI use, with who paid and how much reached you.', '/studio/earnings'],
        ].map(([t, d, href]) => (
          <a key={t} href={`#${href}`} className="panel p-5 group hover:border-faint">
            <h3 className="text-[15.5px] font-semibold group-hover:underline">{t}</h3>
            <p className="text-[14px] text-ink-2 mt-1">{d}</p>
          </a>
        ))}
      </section>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'human' | 'machine' }) {
  return (
    <div className="panel p-4">
      <p className="text-[13px] text-muted flex items-center gap-1.5">{tone === 'human' && <Icon.person className="text-human" />}{tone === 'machine' && <Icon.machine className="text-machine" />}{label}</p>
      <p className={cx('text-[26px] font-semibold num mt-1')}>{value}</p>
      {sub && <p className="text-[12px] text-muted">{sub}</p>}
    </div>
  )
}

const TOUR = [
  { tab: 'hub', title: 'This is your studio', text: 'Your pieces, what you’ve earned from readers and from AI, and what your readers follow, all in one place.' },
  { tab: 'write', title: '1. Write and see what it’s worth', text: 'Paste or write a piece. Twofold scores originality, depth, timeliness and demand, explains each score, and shows a price range. Ask the AI editor for a second opinion.' },
  { tab: 'licence', title: '2. Choose who can use it, and for how much', text: 'Readers pay per read or with Pass. AI assistants pay each time they quote you. Training is your call. Every rule is shown in plain English and as data for agents.' },
  { tab: 'earnings', title: '3. Get paid for every use', text: 'Each read and each AI quote shows up here, with who paid. You keep 85%.' },
  { tab: 'demo', title: 'See it happen live', text: 'Publish a sample story and watch it reach the home page, then watch AI agents find it, pay and quote it.' },
]

export function StudioTour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const s = TOUR[i]
  return (
    <div className="fixed inset-0 z-50 bg-[#191c36]/30 flex items-end justify-center p-4 pb-24 md:p-8" role="dialog" aria-modal="true" aria-labelledby="tour-h">
      <div className="w-full max-w-[520px] rounded-[18px] bg-surface shadow-[0_20px_60px_rgba(25,28,54,.35)] overflow-hidden pop-in">
        <div className="flex gap-1 p-4 pb-0">
          {TOUR.map((_, k) => <span key={k} className={cx('h-1 flex-1 rounded-full', k <= i ? 'bg-ink' : 'bg-line')} />)}
        </div>
        <div className="p-6">
          <p className="text-[13px] text-muted">Studio tour, {i + 1} of {TOUR.length}</p>
          <h2 id="tour-h" className="font-serif text-[28px] leading-tight font-medium mt-1">{s.title}</h2>
          <p className="text-[16px] text-ink-2 mt-3 leading-relaxed">{s.text}</p>
          <div className="flex items-center gap-2 mt-6">
            <button onClick={onDone} className="text-[14px] text-muted hover:text-ink underline underline-offset-4 cursor-pointer">Skip tour</button>
            <span className="ml-auto" />
            {i > 0 && <Button onClick={() => { setI(i - 1); go(`/studio/${TOUR[i - 1].tab}?tour=1`) }}>Back</Button>}
            {i < TOUR.length - 1
              ? <Button variant="primary" onClick={() => { setI(i + 1); go(`/studio/${TOUR[i + 1].tab}?tour=1`) }}>Next</Button>
              : <Button variant="primary" onClick={() => { onDone(); go('/studio/hub') }}>Start creating</Button>}
          </div>
        </div>
      </div>
    </div>
  )
}
