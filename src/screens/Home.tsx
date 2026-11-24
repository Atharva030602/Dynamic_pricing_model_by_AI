import { useEffect, useMemo, useRef, useState } from 'react'
import type { Decorated } from '../data/meta'
import { CATEGORY_LIST, type Category } from '../data/v2'
import { inr } from '../engine/licence'
import { rankForUser } from '../engine/similarity'
import { useStore } from '../store'
import { Engage } from '../ui/Engage'
import { MarketPanel, MarketStrip } from '../ui/Market'
import { Avatar, Icon, Photo, Stars, ago, compact, cx, fmtDate, go, useRoute } from '../ui/kit'

type Tab = 'foryou' | 'top' | 'saved' | Category

export default function Home() {
  const { feed, profile, learned, promoted, bookmarked, posts, creators, promotions } = useStore()
  const { params } = useRoute()
  const tab = (params.get('c') as Tab) || (profile ? 'foryou' : 'top')
  const q = params.get('q') || ''
  const welcome = params.get('welcome') === '1'

  const ranked = useMemo(() => {
    const items = feed.map((w) => ({ ...w, keywords: w.meta.keywords, likes: w.meta.likes + (promoted.includes(w.id) ? 400 : 0) + (promotions[w.id] ? 5000 : 0) }))
    if (tab === 'saved') return feed.filter((w) => bookmarked.includes(w.id)).map((w) => ({ w, why: 'Saved by you' }))
    if (tab === 'foryou') return rankForUser(items, profile?.keywords || [], learned).map((r) => ({ w: r.item as Decorated, why: r.why }))
    const list = tab === 'top' ? feed : feed.filter((w) => w.category === tab)
    return list.map((w) => ({ w, why: '' }))
  }, [feed, tab, profile?.keywords, learned, promoted, bookmarked, promotions])

  const newest = feed.find((w) => w.live && Date.now() - new Date(w.publishedAt).getTime() < 36e5 * 6)
  const hero = ranked.slice(0, 5)
  const rest = ranked.slice(hero.length >= 3 ? hero.length : 0)

  const trending = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of feed) for (const k of w.meta.keywords) m.set(k, (m.get(k) || 0) + Math.log10(1 + w.meta.likes) + (Date.now() - new Date(w.publishedAt).getTime() < 864e5 * 3 ? 2 : 0))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k)
  }, [feed])

  const tabs: { id: Tab; label: string }[] = [
    ...(profile ? [{ id: 'foryou' as Tab, label: 'For you' }] : []),
    { id: 'top', label: 'Top stories' },
    ...CATEGORY_LIST.map((c) => ({ id: c.id as Tab, label: c.id })),
    ...(bookmarked.length ? [{ id: 'saved' as Tab, label: `Saved (${bookmarked.length})` }] : []),
  ]

  return (
    <div>
      <div className="xl:hidden"><MarketStrip /></div>
      <nav aria-label="Categories" className="border-b border-line bg-surface sticky top-16 z-20">
        <div className="mx-auto max-w-[1360px] px-4 md:px-6 flex gap-1 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((t) => (
            <a key={t.id} href={`#/?c=${t.id}`} aria-current={tab === t.id && !q ? 'page' : undefined}
              className={cx('shrink-0 h-9 px-3.5 rounded-full text-[14.5px] font-medium grid place-items-center transition-colors', tab === t.id && !q ? 'bg-ink text-white' : 'text-ink-2 hover:bg-line-2')}>
              {t.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-[1360px] px-4 md:px-6 grid xl:grid-cols-[240px_minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_300px] gap-8 py-6">
        <aside className="hidden xl:block">
          <div className="sticky top-[132px] space-y-6">
            <MarketPanel highlight={tab === 'Markets' || tab === 'foryou' ? ['VLTC', 'SAFM'] : undefined} />
          </div>
        </aside>

        <div className="min-w-0">
          {welcome && profile && <WelcomeNote name={profile.name} n={profile.keywords.length} />}
          {newest && !q && (
            <a href={`#/work/${newest.id}`} className="arrive mb-4 flex items-center gap-3 rounded-[12px] px-3 py-2.5 border border-line hover:border-faint">
              <Icon.live /> <span className="text-[14px] font-semibold shrink-0">Just published</span>
              <span className="text-[14px] text-ink-2 truncate">{newest.title}</span>
              <span className="ml-auto text-[12.5px] text-muted shrink-0">{ago(newest.publishedAt)}</span>
            </a>
          )}
          <AskBox initial={q} />
          {q ? <SearchResults q={q} /> : (
            <>
              {ranked.length === 0 ? (
                <Empty tab={tab} />
              ) : (
                <>
                  {hero.length >= 3 && <Carousel items={hero} />}
                  <h2 className="sr-only">Stories</h2>
                  <ul className="mt-2">
                    {rest.map(({ w, why }, i) => (
                      <FeedRow key={w.id} i={i}>
                        <FeedCard w={w} why={why} c={creators[w.creatorId]} />
                      </FeedRow>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>

        <aside className="space-y-8">
          <section aria-labelledby="hl-h">
            <h2 id="hl-h" className="text-[15px] font-semibold pb-2 border-b border-line">Latest headlines</h2>
            <ol className="divide-y divide-line-2">
              {feed.slice(0, 6).map((w) => (
                <li key={w.id}>
                  <a href={`#/work/${w.id}`} className="flex gap-3 py-2.5 group">
                    <span className="text-[12px] text-muted w-12 shrink-0 pt-0.5 tab">{Date.now() - new Date(w.publishedAt).getTime() < 864e5 ? ago(w.publishedAt).replace(' ago', '') : fmtDate(w.publishedAt)}</span>
                    <span className="font-serif text-[15.5px] leading-snug group-hover:underline">{w.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="tr-h">
            <h2 id="tr-h" className="text-[15px] font-semibold pb-2 border-b border-line">Trending topics</h2>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {trending.map((k, i) => (
                <a key={k} href={`#/?q=${encodeURIComponent(k)}`} className="h-8 px-3 rounded-full border border-line text-[13.5px] font-medium grid place-items-center hover:border-ink">
                  <span><span className="text-muted mr-1 tab">{i + 1}</span>{k}</span>
                </a>
              ))}
            </div>
          </section>
          <section aria-labelledby="cm-h">
            <div className="flex items-baseline justify-between pb-2 border-b border-line">
              <h2 id="cm-h" className="text-[15px] font-semibold">From the community</h2>
              <a href="#/community" className="text-[13px] underline underline-offset-4 text-ink-2">See all</a>
            </div>
            <ul className="divide-y divide-line-2">
              {posts.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <a href={`#/community?p=${p.id}`} className="block py-3 group">
                    <span className="text-[12px] font-medium text-human-ink">{p.tag}</span>
                    <span className="block text-[14.5px] font-medium leading-snug mt-0.5 group-hover:underline">{p.title}</span>
                    <span className="flex items-center gap-2 mt-1.5 text-[12px] text-muted">
                      <Avatar name={p.author} hue={p.hue} size={18} /> {p.author}, {p.replies.length} {p.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a href="#/community?new=1" className="mt-2 h-10 rounded-[10px] border border-line grid place-items-center text-[14px] font-medium hover:border-ink">Ask a question or share news</a>
          </section>
          <section className="rounded-[14px] bg-machine-wash/60 border border-line p-4">
            <h2 className="text-[15px] font-semibold flex items-center gap-2"><Icon.machine className="text-machine" /> AI agents read this site too</h2>
            <p className="text-[13.5px] text-ink-2 mt-1.5">Assistants search it, see prices and terms as data, and pay per use. The author is paid each time.</p>
            <a href="#/studio/demo" className="mt-3 h-9 rounded-[9px] bg-machine text-white text-[14px] font-medium grid place-items-center">Watch it happen live</a>
          </section>
        </aside>
      </div>
    </div>
  )
}

function WelcomeNote({ name, n }: { name: string; n: number }) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="arrive mb-4 rounded-[12px] border border-line p-4 flex items-start gap-3">
      <span className="text-[20px]" aria-hidden>👋</span>
      <div className="flex-1">
        <p className="text-[15px] font-semibold">Welcome, {name.split(' ')[0]}. This feed is yours.</p>
        <p className="text-[14px] text-ink-2 mt-0.5">It’s built from the {n} topics you picked, and learns from what you like and save. Each story says why it’s here.</p>
      </div>
      <a href="#/welcome" className="text-[13.5px] underline underline-offset-4 text-ink-2 shrink-0">Edit topics</a>
      <button onClick={() => setOpen(false)} aria-label="Dismiss" className="text-muted hover:text-ink cursor-pointer"><Icon.close /></button>
    </div>
  )
}

function AskBox({ initial }: { initial: string }) {
  const [v, setV] = useState(initial)
  useEffect(() => setV(initial), [initial])
  const examples = ['football in India', 'what affects EV prices', 'farm loans and drought', 'power cuts in Pune']
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); go(v.trim() ? `/?q=${encodeURIComponent(v.trim())}` : '/') }} className="mb-5">
      <label className="relative block">
        <span className="sr-only">Search stories</span>
        <Icon.search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Ask anything, e.g. “football in India”"
          className="h-12 w-full rounded-[12px] border border-line bg-surface pl-10 pr-28 text-[16px] focus:border-ink outline-none" />
        <button className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-3.5 rounded-[9px] bg-ink text-white text-[14px] font-medium cursor-pointer">Search</button>
      </label>
      {!initial && (
        <p className="mt-2 text-[13px] text-muted flex flex-wrap gap-x-3 gap-y-1">
          Try:{examples.map((x) => <a key={x} href={`#/?q=${encodeURIComponent(x)}`} className="underline underline-offset-2 hover:text-ink">{x}</a>)}
        </p>
      )}
    </form>
  )
}

function SearchResults({ q }: { q: string }) {
  const { index, feed } = useStore()
  const res = useMemo(() => index.search(q, 8), [index, q])
  const byId = new Map(feed.map((w) => [w.id, w]))
  const direct = res.filter((r) => r.kind === 'direct')
  const indirect = res.filter((r) => r.kind === 'indirect')
  return (
    <section aria-live="polite">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold">{res.length ? `${res.length} stories for “${q}”` : `Nothing yet for “${q}”`}</h2>
        <a href="#/" className="text-[13.5px] underline underline-offset-4 text-ink-2">Clear</a>
      </div>
      <p className="text-[13px] text-muted mt-1">Scored by meaning, not just matching words. Indirect matches say why they matter. AI agents get the same results through our MCP search tool.</p>
      {[['Directly about this', direct], ['Indirectly relevant', indirect]].map(([label, list]) => (list as typeof res).length > 0 && (
        <div key={label as string} className="mt-5">
          <h3 className="text-[14px] font-semibold text-ink-2">{label as string}</h3>
          <ul className="mt-2 space-y-2">
            {(list as typeof res).map((r) => {
              const w = byId.get(r.id)!
              return (
                <li key={r.id}>
                  <a href={`#/work/${r.id}`} className="group flex gap-4 rounded-[12px] border border-line p-3 hover:border-faint">
                    <Photo src={w.meta.image.url} alt="" ratio="4/3" className="w-24 sm:w-32 shrink-0 rounded-[8px]" showCredit={false} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[12.5px]">
                        <span className={cx('rounded-full px-2 h-5 inline-flex items-center font-semibold', r.kind === 'direct' ? 'bg-good-wash text-good' : 'bg-machine-wash text-machine-ink')}>{Math.round(r.score * 100)}% match</span>
                        <span className="text-muted">{w.category}</span>
                      </span>
                      <span className="block font-serif text-[18px] leading-snug mt-1 group-hover:underline">{w.title}</span>
                      <span className="block text-[13.5px] text-ink-2 mt-1">{r.kind === 'indirect' ? '↪ ' : ''}{r.why}</span>
                      {r.alsoBecause && <span className="block text-[12.5px] text-muted mt-0.5">{r.alsoBecause}</span>}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}

function Carousel({ items }: { items: { w: Decorated; why: string }[] }) {
  const [i, setI] = useState(0)
  const paused = useRef(false)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => { if (!paused.current) setI((x) => (x + 1) % items.length) }, 6500)
    return () => clearInterval(id)
  }, [items.length])
  useEffect(() => setI(0), [items[0]?.w.id])
  return (
    <section aria-roledescription="carousel" aria-label="Top stories" className="relative rounded-[16px] overflow-hidden bg-ink"
      onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)} onFocus={() => (paused.current = true)} onBlur={() => (paused.current = false)}>
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
        {items.map(({ w, why }, k) => (
          <a key={w.id} href={`#/work/${w.id}`} aria-hidden={k !== i} tabIndex={k === i ? 0 : -1} className="relative shrink-0 w-full block group" aria-roledescription="slide" aria-label={`${k + 1} of ${items.length}`}>
            <Photo src={w.meta.image.url} alt={w.meta.image.alt} credit={w.meta.image.credit} ratio="16/8.5" className="max-md:!aspect-square" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f22]/95 via-[#0d0f22]/45 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 text-white">
              <p className="text-[13px] font-medium text-[#f6c86b]">{w.category}</p>
              <h2 className="font-serif text-[26px] md:text-[38px] leading-[1.06] font-medium mt-1.5 max-w-[24ch] group-hover:underline decoration-2 underline-offset-4">{w.title}</h2>
              <p className="font-serif text-[16px] md:text-[18px] text-white/85 mt-2 max-w-[56ch] line-clamp-2">{w.dek}</p>
            </div>
          </a>
        ))}
      </div>
      <div className="absolute top-3 right-3 flex gap-1.5">
        <button onClick={() => setI((x) => (x - 1 + items.length) % items.length)} aria-label="Previous story" className="w-9 h-9 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/60 cursor-pointer">‹</button>
        <button onClick={() => setI((x) => (x + 1) % items.length)} aria-label="Next story" className="w-9 h-9 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/60 cursor-pointer">›</button>
      </div>
      <div className="absolute bottom-3 right-5 flex gap-1.5" role="tablist" aria-label="Choose story">
        {items.map((_, k) => (
          <button key={k} role="tab" aria-selected={k === i} aria-label={`Story ${k + 1}`} onClick={() => setI(k)} className={cx('h-1.5 rounded-full transition-all cursor-pointer', k === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50')} />
        ))}
      </div>
    </section>
  )
}

/** After the 2nd and 6th cards, slide in a row of stories from a topic the reader follows. */
function FeedRow({ i, children }: { i: number; children: React.ReactNode }) {
  const { profile, feed } = useStore()
  const { params } = useRoute()
  const tab = params.get('c')
  if (tab && tab !== 'foryou' && tab !== 'top') return <>{children}</>
  const cats = [...new Set((profile?.keywords || ['Football', 'Monsoon']).map((k) => CATEGORY_LIST.find((c) => c.keywords.includes(k))?.id).filter(Boolean))] as Category[]
  const pick = i === 1 ? cats[0] : i === 5 ? (cats[1] || (cats[0] === 'Climate' ? 'Sports' : 'Climate')) : null
  if (!pick) return <>{children}</>
  const items = feed.filter((w) => w.category === pick)
  if (items.length < 2) return <>{children}</>
  return (
    <>
      {children}
      <li className="py-5 border-b border-line">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[16px] font-semibold">More in {pick}</h3>
          <a href={`#/?c=${pick}`} className="text-[13.5px] underline underline-offset-4 text-ink-2">See all</a>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {items.map((w) => (
            <a key={w.id} href={`#/work/${w.id}`} className="group snap-start shrink-0 w-[240px] rounded-[12px] border border-line overflow-hidden hover:border-faint">
              <Photo src={w.meta.image.url} alt="" ratio="16/10" showCredit={false} />
              <span className="block p-3">
                <span className="block font-serif text-[16px] leading-snug line-clamp-3 group-hover:underline">{w.title}</span>
                <span className="block text-[12px] text-muted mt-1.5">{fmtDate(w.publishedAt)}, {compact(w.meta.likes)} likes</span>
              </span>
            </a>
          ))}
        </div>
      </li>
    </>
  )
}

function FeedCard({ w, why, c }: { w: Decorated; why: string; c: { id: string; name: string; avatarHue: number } }) {
  const { ratingOf, promotions } = useStore()
  const read = w.licence.uses.read
  return (
    <li className={cx('border-b border-line', w.live && 'arrive')}>
      <a href={`#/work/${w.id}`} className="group grid sm:grid-cols-[minmax(0,1fr)_220px] gap-4 sm:gap-6 py-5">
        <div className="min-w-0 order-2 sm:order-1">
          <p className="text-[13px] font-medium text-human-ink">{w.customCategory || w.category}{w.kind === 'dataset' ? ', dataset' : w.kind === 'video' ? ', video' : ''}</p>
          <h3 className="font-serif text-[22px] md:text-[24px] leading-[1.15] font-medium mt-1 group-hover:underline">{w.title}</h3>
          <p className="font-serif text-[16px] leading-snug text-ink-2 mt-1.5 line-clamp-2">{w.dek}</p>
          {why && <p className="text-[12.5px] text-machine-ink mt-2 flex items-center gap-1.5"><Icon.spark className="shrink-0" />{why}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[13px]">
            <span className="flex items-center gap-1.5 font-medium"><Avatar name={c.name} hue={c.avatarHue} size={20} />{c.name}</span>
            <Stars value={ratingOf(c.id).stars} size={11} className="text-[12px] text-ink-2" />
            {promotions[w.id] && <span className="rounded-full px-2 h-5 inline-flex items-center text-[11.5px] font-semibold bg-line-2 text-ink-2">Promoted</span>}
            <span className="text-muted">{w.live ? ago(w.publishedAt) : fmtDate(w.publishedAt)}</span>
            <span className={cx('rounded-full px-2 h-5 inline-flex items-center font-medium text-[12px]', read.permission === 'free' ? 'bg-good-wash text-good' : 'bg-human-wash text-human-ink')}>{read.permission === 'free' ? 'Free' : `${inr(read.price)} or Pass`}</span>
          </div>
          <div className="mt-2"><Engage w={w} size="sm" /></div>
        </div>
        <Photo src={w.meta.image.url} alt={w.meta.image.alt} ratio="4/3" className="order-1 sm:order-2 rounded-[10px]" showCredit={false} />
      </a>
    </li>
  )
}

function Empty({ tab }: { tab: Tab }) {
  return (
    <div className="rounded-[14px] border border-dashed border-line p-10 text-center">
      <p className="text-[17px] font-semibold">{tab === 'saved' ? 'Nothing saved yet' : `No ${tab} stories yet`}</p>
      <p className="text-[14.5px] text-ink-2 mt-1">{tab === 'saved' ? 'Tap Save on any story to keep it here.' : 'Follow more topics, or publish the first one from the studio.'}</p>
      <a href="#/?c=top" className="inline-block mt-4 underline underline-offset-4">See top stories</a>
    </div>
  )
}
