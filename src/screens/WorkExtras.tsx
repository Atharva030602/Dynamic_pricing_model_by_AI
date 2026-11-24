import { useEffect, useMemo, useRef, useState } from 'react'
import type { Decorated } from '../data/meta'
import { CATEGORY_LIST, PHOTOS } from '../data/v2'
import { useStore } from '../store'
import { Avatar, Button, Icon, Photo, ago, cx, fmtDate } from '../ui/kit'

export function InShort({ w }: { w: Decorated }) {
  const sentences = w.body.split(/\n\s*\n/).slice(1).join(' ').split(/(?<=[.!?])\s+/)
  const lead = sentences.find((x) => /\d/.test(x) && x.length < 220) || w.dek
  return (
    <section aria-labelledby="short-h" className="mt-6 rounded-[14px] bg-paper p-5">
      <h2 id="short-h" className="text-[14px] font-semibold flex items-center gap-2">In short</h2>
      <ul className="mt-2 space-y-2 text-[15.5px] leading-snug">
        <li className="flex gap-2.5"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-ink shrink-0" /><span><strong className="font-semibold">Key fact:</strong> {lead}</span></li>
        <li className="flex gap-2.5"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-ink shrink-0" /><span><strong className="font-semibold">Why it matters:</strong> {w.meta.context.why}</span></li>
      </ul>
    </section>
  )
}

export function KeywordChips({ w }: { w: Decorated }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Keywords">
      {w.meta.keywords.map((k) => (
        <a key={k} href={`#/?q=${encodeURIComponent(k)}`} className="h-8 px-3 rounded-full border border-line text-[13.5px] font-medium grid place-items-center hover:border-ink">{k}</a>
      ))}
    </div>
  )
}

export function Comments({ w, focus }: { w: Decorated; focus?: boolean }) {
  const { comments, addComment, profile } = useStore()
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (focus) { ref.current?.scrollIntoView({ block: 'center' }); ref.current?.focus() } }, [focus])
  const mine = comments[w.id] || []
  const all = [...mine.map((c) => ({ name: c.name, text: c.text, ago: ago(c.ts), you: true })).reverse(), ...w.meta.comments.map((c) => ({ ...c, you: false }))]
  return (
    <section aria-labelledby="cm-h" className="mt-10 pt-8 border-t border-line" id="comments">
      <h2 id="cm-h" className="text-[18px] font-semibold">{all.length} {all.length === 1 ? 'comment' : 'comments'}</h2>
      <form className="mt-4" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { addComment(w.id, text.trim()); setText('') } }}>
        <label htmlFor="cm" className="sr-only">Add a comment</label>
        <textarea id="cm" ref={ref} value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={profile ? `Comment as ${profile.name}` : 'Add a comment'} className="w-full rounded-[10px] border border-line p-3 text-[15px] outline-none focus:border-ink" />
        <div className="flex items-center gap-3 mt-2">
          <Button size="sm" variant="primary" disabled={!text.trim()}>Post comment</Button>
          <span className="text-[12.5px] text-muted">Comments count towards how much readers value this piece.</span>
        </div>
      </form>
      <ul className="mt-5 space-y-4">
        {all.map((c, i) => (
          <li key={i} className={cx('flex gap-3', c.you && 'arrive rounded-[10px]')}>
            <Avatar name={c.name} hue={(c.name.charCodeAt(0) * 37) % 360} size={32} />
            <div>
              <p className="text-[14px]"><strong className="font-semibold">{c.name}</strong>{c.you && <span className="text-muted"> (you)</span>} <span className="text-muted text-[12.5px] ml-1">{c.ago}</span></p>
              <p className="text-[15px] text-ink mt-0.5">{c.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Related({ w }: { w: Decorated }) {
  const { index, feed } = useStore()
  const rel = useMemo(() => {
    const r: { id: string; score: number | null; kind: 'direct' | 'indirect'; why: string }[] = index.related(w.id, 4)
    const seen = new Set([w.id, ...r.map((x) => x.id)])
    for (const x of feed) {
      if (r.length >= 4) break
      if (!seen.has(x.id) && x.category === w.category) { r.push({ id: x.id, score: null, kind: 'direct', why: `More in ${w.category}` }); seen.add(x.id) }
    }
    for (const x of feed) {
      if (r.length >= 4) break
      if (!seen.has(x.id)) { r.push({ id: x.id, score: null, kind: 'direct', why: 'Popular right now' }); seen.add(x.id) }
    }
    return r
  }, [index, w.id, feed])
  const byId = new Map(feed.map((x) => [x.id, x]))
  if (!rel.length) return null
  return (
    <section aria-labelledby="rel-h" className="mt-10 pt-8 border-t border-line">
      <h2 id="rel-h" className="text-[18px] font-semibold">Related stories</h2>
      <p className="text-[13px] text-muted mt-0.5">Ranked by how close they are in meaning, with the reason.</p>
      <ul className="grid sm:grid-cols-2 gap-4 mt-4">
        {rel.map((r) => {
          const x = byId.get(r.id)!
          return (
            <li key={r.id}>
              <a href={`#/work/${r.id}`} className="group block rounded-[12px] border border-line overflow-hidden hover:border-faint h-full">
                <Photo src={x.meta.image.url} alt="" ratio="16/9" showCredit={false} />
                <span className="block p-3">
                  <span className="flex items-center gap-2 text-[12px]">
                    {r.score != null && <span className={cx('rounded-full px-2 h-5 inline-flex items-center font-semibold', r.kind === 'direct' ? 'bg-good-wash text-good' : 'bg-machine-wash text-machine-ink')}>{Math.round(r.score * 100)}% related</span>}
                    <span className="text-muted">{x.category}</span>
                  </span>
                  <span className="block font-serif text-[17px] leading-snug mt-1.5 group-hover:underline">{x.title}</span>
                  <span className="block text-[12.5px] text-ink-2 mt-1">{r.why}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Earlier coverage of the same topics, oldest last, plus background reading. */
export function Background({ w }: { w: Decorated }) {
  const { feed } = useStore()
  const kws = w.meta.keywords.map((k) => k.toLowerCase())
  const earlier = feed
    .filter((x) => x.id !== w.id && x.publishedAt < w.publishedAt && x.meta.keywords.some((k) => kws.includes(k.toLowerCase())))
    .slice(0, 4)
  return (
    <section className="panel p-5" aria-labelledby="bg-h">
      <h2 id="bg-h" className="text-[15px] font-semibold">Earlier on this story</h2>
      {earlier.length ? (
        <ol className="mt-3 relative border-l border-line ml-1.5">
          {earlier.map((x) => (
            <li key={x.id} className="pl-4 pb-3 last:pb-0 relative">
              <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface border-2 border-ink" />
              <span className="block text-[12px] text-muted">{fmtDate(x.publishedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <a href={`#/work/${x.id}`} className="block text-[14px] leading-snug font-medium hover:underline">{x.title}</a>
            </li>
          ))}
        </ol>
      ) : <p className="text-[13.5px] text-muted mt-2">This is the first piece on Twofold about this.</p>}
      {w.meta.refs.length > 0 && (
        <>
          <h3 className="text-[13.5px] font-semibold mt-4 pt-4 border-t border-line-2">Background reading</h3>
          <ul className="mt-2 space-y-1.5">
            {w.meta.refs.map((r) => (
              <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer noopener" className="text-[13.5px] text-machine-ink underline underline-offset-2">{r.label} ↗</a></li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export function OtherTopics({ current }: { current: string }) {
  return (
    <section className="panel p-5" aria-labelledby="ot-h">
      <h2 id="ot-h" className="text-[15px] font-semibold">Explore other topics</h2>
      <ul className="grid grid-cols-2 gap-2 mt-3">
        {CATEGORY_LIST.filter((c) => c.id !== current).map((c) => (
          <li key={c.id}>
            <a href={`#/?c=${c.id}`} className="group block relative rounded-[10px] overflow-hidden">
              <Photo src={PHOTOS.category[c.id].url} alt="" ratio="16/10" showCredit={false} />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute left-2 bottom-1.5 text-white text-[13.5px] font-semibold group-hover:underline">{c.id}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LatestHeadlines({ exclude }: { exclude: string }) {
  const { feed } = useStore()
  return (
    <section className="panel p-5" aria-labelledby="lh-h">
      <h2 id="lh-h" className="text-[15px] font-semibold">Latest headlines</h2>
      <ul className="mt-2 divide-y divide-line-2">
        {feed.filter((x) => x.id !== exclude).slice(0, 5).map((x) => (
          <li key={x.id}><a href={`#/work/${x.id}`} className="block py-2 text-[14px] leading-snug hover:underline">{x.title}</a></li>
        ))}
      </ul>
    </section>
  )
}

type Insight = { source: string; model?: string; why: string; who: string; fact: string; answer: string }

/** Reading companion: pops up once the reader is into the piece. */
export function AiCompanion({ w }: { w: Decorated }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [tab, setTab] = useState<'why' | 'who' | 'fact'>('why')
  const [data, setData] = useState<Insight | null>(null)
  const [q, setQ] = useState('')
  const [asking, setAsking] = useState(false)
  const [answer, setAnswer] = useState<{ q: string; a: string } | null>(null)

  useEffect(() => { setOpen(false); setDismissed(false); setData(null); setAnswer(null) }, [w.id])
  useEffect(() => {
    const on = () => {
      const doc = document.documentElement
      if (!dismissed && !open && doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight) > 0.22) setOpen(true)
    }
    const t = setTimeout(() => { if (!dismissed) setOpen(true) }, 12000)
    window.addEventListener('scroll', on, { passive: true })
    return () => { window.removeEventListener('scroll', on); clearTimeout(t) }
  }, [dismissed, open, w.id])

  const ask = async (question = '') => {
    const r = await fetch('/api/insight', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: w.title, dek: w.dek, body: w.body, question, fallback: w.meta.context }),
    }).then((x) => x.json()).catch(() => null)
    return (r as Insight) || { source: 'notes', ...w.meta.context, answer: question ? 'Couldn’t reach the AI companion. Try again.' : '' }
  }
  useEffect(() => { if (open && !data) ask().then(setData) }, [open])

  const text = data ? data[tab] : w.meta.context[tab]
  if (!open) {
    return (
      <button onClick={() => { setDismissed(false); setOpen(true) }} className="fixed z-40 bottom-20 md:bottom-6 right-4 md:right-6 h-11 pl-3 pr-4 rounded-full bg-ink text-white text-[14px] font-medium flex items-center gap-2 shadow-[0_6px_24px_rgba(25,28,54,.25)] cursor-pointer">
        <Icon.spark className="text-[#f6c86b]" /> Ask AI about this
      </button>
    )
  }
  return (
    <aside role="dialog" aria-label="AI reading companion" className="fixed z-40 bottom-20 md:bottom-6 right-3 md:right-6 w-[min(380px,calc(100vw-24px))] rounded-[16px] bg-surface border border-line shadow-[0_12px_40px_rgba(25,28,54,.22)] pop-in">
      <div className="flex items-center gap-2 px-4 pt-3">
        <Icon.spark className="text-human" />
        <span className="text-[14px] font-semibold">While you read</span>
        <span className="text-[11.5px] text-muted">{data ? (data.source === 'gemini' ? 'by Gemini' : 'writer’s notes') : 'thinking…'}</span>
        <button onClick={() => { setOpen(false); setDismissed(true) }} aria-label="Close" className="ml-auto text-muted hover:text-ink cursor-pointer"><Icon.close /></button>
      </div>
      <div role="tablist" aria-label="Insight" className="flex gap-1 px-3 pt-2">
        {([['why', 'Why it matters'], ['who', 'Who it affects'], ['fact', 'Fun fact']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('h-8 px-2.5 rounded-full text-[13px] font-medium cursor-pointer', tab === k ? 'bg-ink text-white' : 'text-ink-2 hover:bg-line-2')}>{l}</button>
        ))}
      </div>
      <p className={cx('px-4 pt-3 pb-1 text-[15px] leading-snug min-h-[64px]', !data && 'text-muted')} aria-live="polite">{text}</p>
      {answer && (
        <div className="mx-4 mt-2 rounded-[10px] bg-paper p-3 text-[14px]">
          <p className="text-[12.5px] text-muted">You asked: {answer.q}</p>
          <p className="mt-1 leading-snug">{answer.a || 'Thinking…'}</p>
        </div>
      )}
      <form className="p-3 flex gap-2" onSubmit={async (e) => {
        e.preventDefault(); if (!q.trim() || asking) return
        const question = q.trim(); setQ(''); setAsking(true); setAnswer({ q: question, a: '' })
        const r = await ask(question); setAnswer({ q: question, a: r.answer || 'No answer this time.' }); setAsking(false)
      }}>
        <label htmlFor="ask-ai" className="sr-only">Ask about this story</label>
        <input id="ask-ai" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about this story" className="flex-1 h-10 rounded-[10px] border border-line px-3 text-[14px] outline-none focus:border-ink min-w-0" />
        <Button size="sm" variant="primary" className="h-10" disabled={asking || !q.trim()}>{asking ? '…' : 'Ask'}</Button>
      </form>
    </aside>
  )
}
