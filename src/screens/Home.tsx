import { useMemo } from 'react'
import { inr } from '../engine/licence'
import { useStore, type Work } from '../store'
import { Avatar, Icon, ago, cx, fmtDate, useRoute } from '../ui/kit'

export default function Home() {
  const { works, creators, events } = useStore()
  const { params } = useRoute()
  const section = params.get('s')
  const list = section ? works.filter((w) => w.section === section) : works
  const lead = list[0]
  const rest = list.slice(1)
  const newest = works.find((w) => w.live && Date.now() - new Date(w.publishedAt).getTime() < 1000 * 60 * 60 * 6)

  const mostRead = useMemo(() => {
    const since = Date.now() - 1000 * 60 * 60 * 24 * 4
    const counts = new Map<string, number>()
    for (const e of events) if (e.use === 'read' && new Date(e.ts).getTime() > since - 1000 * 60 * 60 * 24 * 30) counts.set(e.workId, (counts.get(e.workId) || 0) + e.units)
    return works.map((w) => ({ w, n: counts.get(w.id) || 0 })).sort((a, b) => b.n - a.n).slice(0, 5)
  }, [events, works])

  if (!lead) return <div className="mx-auto max-w-[1200px] px-6 py-20 text-ink-2">Nothing in {section} yet. <a className="underline" href="#/">See everything</a></div>

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 border-b border-line text-[13.5px]">
        <span className="text-ink-2">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}</span>
        {section && <span className="font-medium">{section} <a href="#/" className="ml-2 text-muted underline font-normal">show all</a></span>}
        {newest && (
          <a href={`#/work/${newest.id}`} className="arrive ml-auto flex items-center gap-2 rounded-full px-3 h-8 border border-line hover:border-faint">
            <Icon.live /> <span className="font-medium">Just published</span> <span className="text-ink-2 truncate max-w-[42ch]">{newest.title}</span>
          </a>
        )}
      </div>

      <section className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10 py-8 border-b border-line">
        <a href={`#/work/${lead.id}`} className={cx('group block', lead.live && 'arrive rounded-[12px] -m-3 p-3')}>
          <p className="text-[14px] font-medium text-human-ink">{lead.section}{lead.live && Date.now() - new Date(lead.publishedAt).getTime() < 36e5 * 6 ? ', just in' : ''}</p>
          <h1 className="font-serif text-[34px] md:text-[48px] leading-[1.05] font-medium tracking-[-0.015em] mt-2 group-hover:underline decoration-2 underline-offset-4">{lead.title}</h1>
          <p className="font-serif text-[20px] md:text-[22px] leading-snug text-ink-2 mt-4 max-w-[60ch]">{lead.dek}</p>
          <Byline w={lead} c={creators[lead.creatorId]} />
          <p className="font-serif text-[17.5px] leading-[1.6] text-ink mt-6 max-w-[62ch] line-clamp-4">{lead.body.split(/\n\s*\n/)[0]}</p>
          <span className="inline-block mt-3 text-[14px] font-medium underline underline-offset-4">Continue reading</span>
        </a>
        <aside>
          <h2 className="text-[15px] font-semibold pb-2 border-b border-line">Most read this month</h2>
          <ol className="divide-y divide-line-2">
            {mostRead.map(({ w }, i) => (
              <li key={w.id}>
                <a href={`#/work/${w.id}`} className="flex gap-3 py-3 group">
                  <span className="font-serif text-[26px] leading-none text-faint w-6 shrink-0">{i + 1}</span>
                  <span>
                    <span className="block font-serif text-[16.5px] leading-snug group-hover:underline">{w.title}</span>
                    <span className="block text-[12.5px] text-muted mt-1">{creators[w.creatorId].name}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8">
        {rest.map((w) => (
          <a key={w.id} href={`#/work/${w.id}`} className={cx('group block py-6 border-b border-line', w.live && 'arrive')}>
            <p className="text-[13px] font-medium text-human-ink">{w.section}{w.kind === 'dataset' ? ', dataset' : w.kind === 'video' ? ', video' : ''}</p>
            <h3 className="font-serif text-[22px] leading-[1.18] font-medium mt-1.5 group-hover:underline">{w.title}</h3>
            <p className="font-serif text-[16px] leading-snug text-ink-2 mt-2 line-clamp-3">{w.dek}</p>
            <Byline w={w} c={creators[w.creatorId]} small />
          </a>
        ))}
      </section>

      <section className="my-10 rounded-[14px] bg-[#f3f5fb] border border-line p-6 grid md:grid-cols-[1fr_auto] gap-4 items-center">
        <div>
          <h2 className="text-[17px] font-semibold flex items-center gap-2"><Icon.machine className="text-machine" /> AI agents use this site differently</h2>
          <p className="text-[14.5px] text-ink-2 mt-1 max-w-[70ch]">Assistants, AI search and model builders read prices and terms as data, pay per use and get a usage record. Every piece’s author is paid for it.</p>
        </div>
        <a href={`#/work/${lead.id}?view=ai`} className="h-10 px-4 rounded-[9px] bg-machine text-white text-[14.5px] font-medium grid place-items-center">See a page as an agent sees it</a>
      </section>
    </div>
  )
}

function Byline({ w, c, small }: { w: Work; c: ReturnType<typeof useStore>['creators'][string]; small?: boolean }) {
  const read = w.licence.uses.read
  return (
    <div className={cx('flex flex-wrap items-center gap-x-3 gap-y-2', small ? 'mt-4' : 'mt-6')}>
      <span className="flex items-center gap-2">
        <Avatar name={c.name} hue={c.avatarHue} size={small ? 24 : 30} />
        <span className={cx('font-medium', small ? 'text-[13px]' : 'text-[14px]')}>{c.name}</span>
      </span>
      <span className={cx('text-muted', small ? 'text-[12.5px]' : 'text-[13.5px]')}>{w.live ? ago(w.publishedAt) : fmtDate(w.publishedAt)}</span>
      <span className={cx('rounded-full px-2.5 h-6 inline-flex items-center font-medium', small ? 'text-[12px]' : 'text-[12.5px]', read.permission === 'free' ? 'bg-good-wash text-good' : 'bg-human-wash text-human-ink')}>
        {read.permission === 'free' ? 'Free to read' : `${inr(read.price)} to read`}
      </span>
      {read.permission !== 'free' && read.includedInPass && <span className={cx('text-muted', small ? 'text-[12px]' : 'text-[12.5px]')}>or with Pass</span>}
      {w.disclosure !== 'human' && <span className={cx('text-muted', small ? 'text-[12px]' : 'text-[12.5px]')}>{w.disclosure === 'ai_generated' ? 'AI-generated' : 'AI-assisted'}</span>}
    </div>
  )
}
