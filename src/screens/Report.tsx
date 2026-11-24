import { useMemo, useState } from 'react'
import type { Decorated } from '../data/meta'
import { rankForUser } from '../engine/similarity'
import { useStore } from '../store'
import { Button, Icon, Photo, cx, fmtDate, go } from '../ui/kit'

/** Premium reading report: what the weekly or monthly email contains, and its settings. */
export default function Report() {
  const { profile, updateProfile, history, feed, liked, bookmarked, learned, creators } = useStore()
  const [sent, setSent] = useState(false)
  const freq = profile?.reportFreq || 'weekly'
  const days = freq === 'weekly' ? 7 : 30

  const data = useMemo(() => {
    const byId = new Map(feed.map((w) => [w.id, w]))
    const since = Date.now() - days * 864e5
    const mine = history.filter((h) => new Date(h.ts).getTime() > since)
    // a believable baseline so a brand-new account still sees a full report
    const base = Math.max(0, 6 - mine.length)
    const ids = [...new Set([...mine.map((h) => h.id), ...liked, ...bookmarked])]
    const ranked = rankForUser(feed.map((w) => ({ ...w, keywords: w.meta.keywords, likes: w.meta.likes })), profile?.keywords || [], learned)
    const readIds = ids.length ? ids : ranked.slice(0, base).map((r) => r.item.id)
    const read = readIds.map((id) => byId.get(id)).filter(Boolean) as Decorated[]
    const minutes = Math.round(mine.reduce((a, h) => a + h.secs, 0) / 60 + base * 4.5)
    const topics = new Map<string, number>()
    for (const w of read) for (const k of w.meta.keywords) topics.set(k, (topics.get(k) || 0) + 1)
    const topTopics = [...topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const missed = ranked.map((r) => r.item as Decorated).filter((w) => !readIds.includes(w.id)).slice(0, 3)
    const critical = [...read, ...missed].slice(0, 4).map((w) => {
      const sents = w.body.split(/\n\s*\n/).slice(1).join(' ').split(/(?<=[.!?])\s+/)
      return { w, fact: sents.find((x) => /\d/.test(x) && x.length < 200) || w.dek }
    })
    const byCreator = new Map<string, number>()
    for (const w of read) byCreator.set(w.creatorId, (byCreator.get(w.creatorId) || 0) + 1)
    const topCreators = [...byCreator.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    const perDay = Array.from({ length: 7 }, (_, i) => Math.round((minutes / 7) * (0.6 + ((i * 37) % 9) / 10)))
    return { read, minutes, topTopics, missed, critical, topCreators, perDay }
  }, [feed, history, liked, bookmarked, learned, profile?.keywords, days])

  if (!profile) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
        <h1 className="font-serif text-[34px] font-medium">Your reading report</h1>
        <p className="text-[16px] text-ink-2 mt-2">Create a reader account to get a weekly or monthly report of what you read and what you missed.</p>
        <Button variant="primary" className="mt-5" onClick={() => go('/welcome')}>Create a reader account</Button>
      </div>
    )
  }

  const maxDay = Math.max(1, ...data.perDay)
  const maxTopic = Math.max(1, ...data.topTopics.map((t) => t[1]))
  const period = freq === 'weekly' ? 'This week' : 'This month'

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 grid lg:grid-cols-[340px_minmax(0,1fr)] gap-10 items-start">
      <aside className="space-y-5 lg:sticky lg:top-24">
        <div>
          <h1 className="font-serif text-[34px] leading-[1.05] font-medium">Your reading report</h1>
          <p className="text-[15px] text-ink-2 mt-2">A Premium email: how much you read, what mattered most, and what you missed.</p>
        </div>
        {!profile.premium ? (
          <div className="rounded-[14px] border border-human/40 bg-human-wash/50 p-4">
            <p className="text-[15px] font-semibold">This is a Premium feature</p>
            <p className="text-[14px] text-ink-2 mt-1">Premium is ₹149 a month and includes Twofold Pass: every story, free of per-read prices.</p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => updateProfile({ premium: true, reportFreq: freq })}>Start a free month</Button>
            <p className="text-[12px] text-muted mt-2">Prototype: no payment is taken.</p>
          </div>
        ) : (
          <div className="rounded-[14px] border border-line p-4">
            <p className="text-[14px] font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-good" /> Premium is on</p>
            <fieldset className="mt-3">
              <legend className="text-[13.5px] text-ink-2">Send my report</legend>
              <div className="flex gap-2 mt-2">
                {(['weekly', 'monthly'] as const).map((f) => (
                  <button key={f} aria-pressed={freq === f} onClick={() => updateProfile({ reportFreq: f })} className={cx('h-9 px-3.5 rounded-full border text-[14px] font-medium cursor-pointer', freq === f ? 'bg-ink text-white border-ink' : 'border-line')}>{f === 'weekly' ? 'Every Monday' : '1st of the month'}</button>
                ))}
              </div>
            </fieldset>
            <Button size="sm" className="mt-4" onClick={() => setSent(true)}>{sent ? 'Sample queued' : 'Email me a sample now'}</Button>
            {sent && <p className="text-[12.5px] text-muted mt-2">Prototype: no email is sent. The preview shows exactly what it would contain.</p>}
            <button onClick={() => updateProfile({ premium: false })} className="block text-[12.5px] text-muted underline underline-offset-2 mt-4 cursor-pointer">Cancel Premium</button>
          </div>
        )}
      </aside>

      <article aria-label="Email preview" className={cx('rounded-[18px] border border-line bg-paper/60 p-3 md:p-6', !profile.premium && 'opacity-80')}>
        <div className="text-[13px] text-muted px-2 pb-3 flex flex-wrap gap-x-4">
          <span>From: Twofold &lt;reports@twofold.app&gt;</span>
          <span>Subject: {period}: {data.minutes} minutes, {data.read.length} stories, and 3 you missed</span>
        </div>
        <div className="mx-auto max-w-[640px] rounded-[14px] bg-surface border border-line overflow-hidden">
          <div className="bg-ink text-white px-6 py-6">
            <p className="text-[13px] text-white/70">{period.toLowerCase() === 'this week' ? 'Weekly' : 'Monthly'} reading report for {profile.name.split(' ')[0]}</p>
            <h2 className="font-serif text-[30px] leading-tight mt-1">You read for {data.minutes} minutes {period.toLowerCase()}.</h2>
          </div>
          <div className="p-6 space-y-7">
            <section className="grid grid-cols-3 gap-3 text-center">
              {[[String(data.read.length), 'stories read'], [String(data.minutes), 'minutes'], [String(liked.length + bookmarked.length), 'liked or saved']].map(([n, l]) => (
                <div key={l} className="rounded-[12px] bg-paper p-3"><p className="text-[26px] font-semibold tab">{n}</p><p className="text-[12.5px] text-muted">{l}</p></div>
              ))}
            </section>
            <section>
              <h3 className="text-[15px] font-semibold">When you read</h3>
              <div className="flex items-end gap-2 h-24 mt-3" role="img" aria-label="Minutes read per day">
                {data.perDay.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[11px] text-muted tab">{m}</span>
                    <span className="w-full rounded-t-[4px] bg-machine" style={{ height: `${(m / maxDay) * 64}px` }} />
                    <span className="text-[11px] text-muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-[15px] font-semibold">What you followed most</h3>
              <ul className="mt-3 space-y-2">
                {data.topTopics.map(([k, n]) => (
                  <li key={k} className="grid grid-cols-[140px_1fr_24px] items-center gap-3 text-[14px]">
                    <span className="truncate">{k}</span><span className="h-2 rounded-full bg-line overflow-hidden"><span className="block h-full bg-ink rounded-full" style={{ width: `${(n / maxTopic) * 100}%` }} /></span><span className="tab text-muted text-right">{n}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-[15px] font-semibold">The critical information</h3>
              <ul className="mt-3 space-y-3">
                {data.critical.map(({ w, fact }) => (
                  <li key={w.id} className="flex gap-3">
                    <Icon.spark className="text-human shrink-0 mt-1" />
                    <span><span className="block text-[14.5px] leading-snug">{fact}</span><a href={`#/work/${w.id}`} className="text-[12.5px] text-machine-ink underline underline-offset-2">{w.title}</a></span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-[15px] font-semibold">You missed</h3>
              <ul className="mt-3 space-y-2">
                {data.missed.map((w) => (
                  <li key={w.id}><a href={`#/work/${w.id}`} className="flex gap-3 group">
                    <Photo src={w.meta.image.url} alt="" ratio="4/3" className="w-20 shrink-0 rounded-[8px]" showCredit={false} />
                    <span><span className="block font-serif text-[16px] leading-snug group-hover:underline">{w.title}</span><span className="text-[12.5px] text-muted">{w.category}, {fmtDate(w.publishedAt)}</span></span>
                  </a></li>
                ))}
              </ul>
            </section>
            {data.topCreators.length > 0 && (
              <section>
                <h3 className="text-[15px] font-semibold">Writers you read most</h3>
                <p className="text-[14px] text-ink-2 mt-1">{data.topCreators.map(([id, n]) => `${creators[id].name} (${n})`).join(', ')}. With Pass, 85% of your reading goes to them.</p>
              </section>
            )}
            <p className="text-[12px] text-muted pt-4 border-t border-line">You get this because you chose a {freq} report. Change or stop it in your account.</p>
          </div>
        </div>
      </article>
    </div>
  )
}
