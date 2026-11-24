import { useMemo, useState } from 'react'
import { CREATOR_SHARE } from '../data/seed'
import { inr } from '../engine/licence'
import type { RatingKey } from '../engine/rating'
import { useStore } from '../store'
import { Button, Icon, Photo, Stars, cx, fmtDate, go } from '../ui/kit'

const TIPS: Record<RatingKey, string> = {
  credibility: 'Attach source documents, verify your identity, and answer reports quickly.',
  quality: 'Lead with what’s new, add first-hand detail, and cut filler. The value panel shows what to fix.',
  response: 'Publish when your readers are online and reply to questions in the community.',
  aiDemand: 'Keep AI quoting paid but allowed, and write the fresh facts AI assistants need.',
  consistency: 'A steady rhythm beats bursts. Two or three pieces a week is a good target.',
}

export default function Hub() {
  const { me, works, events, feed, requests, index, creator, creatorSession, ratingOf, posts, promotions } = useStore()
  const first = me.name.split(' ')[0]
  const mine = works.filter((w) => w.creatorId === me.id)
  const ids = new Set(mine.map((w) => w.id))
  const rating = ratingOf(me.id)
  const weakest = [...rating.parts].sort((a, b) => a.score - b.score)[0]
  const month = useMemo(() => {
    const since = Date.now() - 30 * 864e5
    let people = 0, ai = 0
    for (const e of events) if (ids.has(e.workId) && new Date(e.ts).getTime() > since) (e.buyerKind === 'ai' ? (ai += e.amount) : (people += e.amount))
    return { people: people * CREATOR_SHARE, ai: ai * CREATOR_SHARE }
  }, [events, mine.length])
  const topics = creator && creatorSession === 'me' ? [creator.beat, ...creator.audience.slice(0, 1)].filter(Boolean) : ['EVs', 'Lithium', 'Stock market']
  const ideas = useMemo(() => topics.map((k) => ({ kw: k, r: index.search(k, 3) })).filter((x) => x.r.length).slice(0, 3), [index, topics.join()])
  const questions = posts.filter((p) => p.workId && ids.has(p.workId)).slice(0, 3)
  const hour = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }))
  const greet = hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[260px]">
          <h1 className="font-serif text-[32px] md:text-[40px] leading-[1.05] font-medium">{greet}, {first}</h1>
          <p className="text-[15.5px] text-ink-2 mt-1">{mine.length ? `${mine.length} published ${mine.length === 1 ? 'piece' : 'pieces'}. Here’s how they’re doing and what to do next.` : 'Your studio is ready. Publish your first piece to start earning from readers and AI.'}</p>
        </div>
        <Button onClick={() => go('/studio/demo')}>Watch the live demo</Button>
        <Button variant="primary" onClick={() => go('/studio/write?new=1')}>Create a new post</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Earned in 30 days" value={inr(month.people + month.ai)} sub="after Twofold’s 15%" />
        <Stat label="From readers" value={inr(month.people)} tone="human" />
        <Stat label="From AI" value={inr(month.ai)} tone="machine" />
        <Stat label="Waiting for you" value={String(creatorSession === 'demo' ? requests.length : 0)} sub="AI training requests" />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <section className="panel p-5" aria-labelledby="rate-h">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-[220px]">
              <h2 id="rate-h" className="text-[16px] font-semibold">Your creator rating</h2>
              <p className="text-[13px] text-muted mt-0.5">Shown on your byline. Worked out from evidence, not votes, and updated as you publish.</p>
            </div>
            <div className="text-right">
              <Stars value={rating.stars} size={22} className="text-[22px]" />
              <p className="text-[12.5px] text-muted mt-1">Based on {rating.basis.toLocaleString('en-IN')} signals{rating.trend ? `, use ${rating.trend > 0 ? 'up' : 'down'} ${Math.abs(rating.trend)}% this week` : ''}</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {rating.parts.map((p) => (
              <li key={p.key} className="grid grid-cols-[150px_1fr_40px] items-center gap-3">
                <span className="text-[14px] font-medium">{p.label}<span className="block text-[11.5px] text-muted font-normal">weight {Math.round(p.weight * 100)}%</span></span>
                <span>
                  <span className="block h-2 rounded-full bg-line overflow-hidden"><span className={cx('block h-full rounded-full', p.score >= 70 ? 'bg-good' : p.score >= 45 ? 'bg-ink' : 'bg-human')} style={{ width: `${p.score}%` }} /></span>
                  <span className="block text-[12px] text-muted mt-1">{p.detail}</span>
                </span>
                <span className="text-[14px] font-semibold tab text-right">{p.score}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-[12px] bg-paper p-3.5 text-[14px]"><strong>To raise it fastest:</strong> work on {weakest.label.replace(/^\w/, (c) => c.toLowerCase()).replace('aI', 'AI')}. {TIPS[weakest.key]}</div>
          <details className="mt-3 text-[13px] text-ink-2">
            <summary className="cursor-pointer font-medium">How the rating is calculated</summary>
            <p className="mt-2">Each part scores 0–100. Stars = 1 + 4 × (weighted average ÷ 100). Credibility uses verification, sealed pieces, honest AI disclosure and upheld reports. Writing quality uses the originality and depth scores of your published pieces. Reader response uses likes, shares and comments per piece. AI demand uses paid AI uses. Consistency uses your track record and the last 30 days.</p>
          </details>
        </section>

        <div className="flex flex-col gap-6">
          {creator && creatorSession === 'me' && creator.socials.length > 0 && (
            <section className="panel p-5" aria-labelledby="ch-h">
              <h2 id="ch-h" className="text-[16px] font-semibold">Your connected channels</h2>
              <ul className="mt-3 space-y-2">
                {creator.socials.map((s) => (
                  <li key={s.network} className="flex items-center gap-3 text-[14px]">
                    <span className="w-8 h-8 rounded-[8px] bg-ink text-white grid place-items-center text-[12px] font-semibold">{s.network[0]}</span>
                    <span className="flex-1">{s.network} {s.handle}</span>
                    <span className="text-muted tab">{s.followers.toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[12.5px] text-muted mt-3">We re-study your channels weekly to keep price suggestions current.</p>
            </section>
          )}
          <section className="panel p-5" aria-labelledby="ideas-h">
            <h2 id="ideas-h" className="text-[16px] font-semibold">What your readers follow</h2>
            <ul className="mt-3 space-y-3">
              {ideas.map((i) => (
                <li key={i.kw} className="rounded-[10px] bg-paper p-3">
                  <p className="text-[14px] font-semibold">{i.kw}</p>
                  <p className="text-[13px] text-ink-2 mt-0.5 line-clamp-2">Latest: {i.r[0].doc.title}</p>
                </li>
              ))}
            </ul>
            <p className="text-[12.5px] text-muted mt-3">Fresh, first-hand pieces on these get the highest prices, especially in their first 36 hours.</p>
          </section>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <section className="panel p-5" aria-labelledby="mine-h">
          <div className="flex items-baseline justify-between">
            <h2 id="mine-h" className="text-[16px] font-semibold">Your pieces</h2>
            {mine.length > 0 && <a href="#/studio/earnings" className="text-[13.5px] underline underline-offset-4 text-ink-2">Full analytics</a>}
          </div>
          {mine.length === 0 ? (
            <div className="mt-4 rounded-[12px] border border-dashed border-line p-6 text-center">
              <p className="text-[15px] font-semibold">Nothing published yet</p>
              <p className="text-[14px] text-ink-2 mt-1">Write, paste or import a PDF. You’ll see what it’s worth before you publish.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Button variant="primary" size="sm" onClick={() => go('/studio/write?new=1')}>Create a new post</Button>
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
                    <a href={`#/studio/earnings?work=${w.id}`} className="flex gap-3 py-3 group">
                      {d && <Photo src={d.meta.image.url} alt="" ratio="4/3" className="w-20 shrink-0 rounded-[8px]" showCredit={false} />}
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-[16.5px] leading-snug group-hover:underline line-clamp-2">{w.title}</span>
                        <span className="block text-[12.5px] text-muted mt-1">{fmtDate(w.publishedAt)}, {w.customCategory || d?.category}, {aiN} AI uses{promotions[w.id] ? ', promoted' : ''}</span>
                      </span>
                      <span className="text-[15px] font-semibold num shrink-0">{inr(earned)}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <section className="panel p-5" aria-labelledby="q-h">
          <h2 id="q-h" className="text-[16px] font-semibold">Readers are asking</h2>
          {questions.length ? (
            <ul className="mt-3 space-y-3">
              {questions.map((q) => (
                <li key={q.id}><a href={`#/community?p=${q.id}`} className="block rounded-[10px] border border-line p-3 hover:border-faint">
                  <span className="text-[12px] font-semibold text-human-ink">{q.tag}</span>
                  <span className="block text-[14.5px] font-medium leading-snug mt-0.5">{q.title}</span>
                  <span className="block text-[12.5px] text-muted mt-1">{q.replies.length} replies. Answer it to lift your reader response.</span>
                </a></li>
              ))}
            </ul>
          ) : <p className="text-[14px] text-muted mt-2">No questions about your pieces yet. They appear here when readers post in the community.</p>}
        </section>
      </div>

      <Learn />
    </div>
  )
}

/** Layered guide: start simple, open a level when you want the why. */
function Learn() {
  const levels = [
    { t: 'The basics', d: 'Write or import a piece. See its value. Choose who can use it and for how much. Publish. Get paid for every read and every AI use. You keep 85%.' },
    { t: 'How your piece is valued', d: 'Four signals: originality (new facts, first-hand detail), depth (evidence, numbers, sources), timeliness (how fresh the topic is) and demand (how many readers and AI systems look for it). Quality and market combine into a value index; prices follow from it. The AI editor can move each score by up to 10 points, and explains why.' },
    { t: 'How licences turn into money', d: 'People pay per read or through Pass. AI assistants pay per answer that quotes you, capped at 40 words with credit. AI training is a one-off fee priced from a year of quoting income, discounted for news that dates quickly. Republishing and remixes pay a fee plus 30% of their earnings back to you.' },
    { t: 'How your rating works', d: 'Five parts: credibility, writing quality, reader response, AI demand and consistency. It is evidence-based, so it can’t be bought with votes. Upheld fake-content reports lower credibility; corrections recover it.' },
    { t: 'Reading your analytics', d: 'Earnings split people versus AI, by use and by day. Audience shows regions, age groups, gender split, the fields your AI buyers work in, followers gained after each post, and the questions readers ask. Use it to decide what to write next and when to publish.' },
  ]
  const [open, setOpen] = useState(0)
  return (
    <section className="panel p-5" aria-labelledby="learn-h">
      <h2 id="learn-h" className="text-[16px] font-semibold">How Twofold works for you</h2>
      <p className="text-[13px] text-muted mt-0.5">Five levels. Start with the basics, open the next when you want the why.</p>
      <ol className="mt-4 divide-y divide-line-2">
        {levels.map((l, i) => (
          <li key={l.t}>
            <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center gap-3 py-3 text-left cursor-pointer">
              <span className={cx('w-7 h-7 rounded-full grid place-items-center text-[12.5px] font-semibold shrink-0', open === i ? 'bg-ink text-white' : 'bg-line-2')}>{i + 1}</span>
              <span className="text-[15px] font-medium flex-1">{l.t}</span>
              <span className="text-muted" aria-hidden>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p className="pop-in text-[14.5px] text-ink-2 pb-4 pl-10 max-w-[75ch]">{l.d}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'human' | 'machine' }) {
  return (
    <div className="panel p-4">
      <p className="text-[13px] text-muted flex items-center gap-1.5">{tone === 'human' && <Icon.person className="text-human" />}{tone === 'machine' && <Icon.machine className="text-machine" />}{label}</p>
      <p className="text-[26px] font-semibold num mt-1">{value}</p>
      {sub && <p className="text-[12px] text-muted">{sub}</p>}
    </div>
  )
}

const TOUR = [
  { tab: 'hub', title: 'This is your studio', text: 'Your earnings from readers and from AI, your rating, and what your readers follow, in one place.', deeper: 'Your rating is evidence-based: credibility, writing quality, reader response, AI demand and consistency. The weakest part is always shown with a tip.' },
  { tab: 'write', title: '1. Create a post and see its value', text: 'Pick a format (post, article, video, or a mix), write or import a PDF, and see a price range before you publish.', deeper: 'Value comes from four signals: originality, depth, timeliness and demand. Ask the AI editor for a second opinion; it can move each score by up to 10 points and says why.' },
  { tab: 'licence', title: '2. Choose terms for people, for AI, or both', text: 'Readers pay per read or with Pass. AI assistants pay each time they quote you. Training is your call. You can also promote a piece.', deeper: 'Quoting is priced per answer because it replaces a visit. Training is a one-off fee priced from a year of quoting income, discounted for news that dates fast.' },
  { tab: 'earnings', title: '3. Understand who reads you', text: 'Every read and AI use, where readers are, their age groups, the fields your AI buyers work in, and followers gained per post.', deeper: 'Use it to decide what to write next and when to publish. Questions readers ask in the community show up here too.' },
  { tab: 'demo', title: 'See it happen live', text: 'Publish a sample story and watch it reach the home page, then watch AI agents find it, pay and quote it.', deeper: 'Agents use our MCP server: search, preview free, get a price, buy a licence, then fetch the text with attribution rules.' },
]

export function StudioTour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [deep, setDeep] = useState(false)
  const s = TOUR[i]
  const move = (k: number) => { setI(k); setDeep(false); go(`/studio/${TOUR[k].tab}?tour=1`) }
  return (
    <div className="fixed inset-0 z-50 bg-[#191c36]/30 flex items-end justify-center p-4 pb-24 md:p-8" role="dialog" aria-modal="true" aria-labelledby="tour-h">
      <div className="w-full max-w-[540px] rounded-[18px] bg-surface shadow-[0_20px_60px_rgba(25,28,54,.35)] overflow-hidden pop-in">
        <div className="flex gap-1 p-4 pb-0">{TOUR.map((_, k) => <span key={k} className={cx('h-1 flex-1 rounded-full', k <= i ? 'bg-ink' : 'bg-line')} />)}</div>
        <div className="p-6">
          <p className="text-[13px] text-muted">Studio tour, {i + 1} of {TOUR.length}</p>
          <h2 id="tour-h" className="font-serif text-[28px] leading-tight font-medium mt-1">{s.title}</h2>
          <p className="text-[16px] text-ink-2 mt-3 leading-relaxed">{s.text}</p>
          <button onClick={() => setDeep(!deep)} aria-expanded={deep} className="mt-3 text-[14px] font-medium text-machine-ink underline underline-offset-4 cursor-pointer">{deep ? 'Less detail' : 'Go deeper'}</button>
          {deep && <p className="pop-in mt-2 text-[14.5px] text-ink-2 rounded-[10px] bg-paper p-3 leading-relaxed">{s.deeper}</p>}
          <div className="flex items-center gap-2 mt-6">
            <button onClick={onDone} className="text-[14px] text-muted hover:text-ink underline underline-offset-4 cursor-pointer">Skip tour</button>
            <span className="ml-auto" />
            {i > 0 && <Button onClick={() => move(i - 1)}>Back</Button>}
            {i < TOUR.length - 1 ? <Button variant="primary" onClick={() => move(i + 1)}>Next</Button> : <Button variant="primary" onClick={() => { onDone(); go('/studio/hub') }}>Start creating</Button>}
          </div>
        </div>
      </div>
    </div>
  )
}
