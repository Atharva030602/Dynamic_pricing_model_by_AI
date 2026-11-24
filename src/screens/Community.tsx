import { useEffect, useMemo, useState } from 'react'
import { PHOTOS, type CommunityPost } from '../data/v2'
import { useStore } from '../store'
import { Avatar, Button, Icon, Photo, ago, cx, go, useRoute } from '../ui/kit'

const TAGS: CommunityPost['tag'][] = ['Question', 'Discussion', 'Shared news', 'Tip']

export default function Community() {
  const { posts, feed, votes, replies, profile } = useStore()
  const { params } = useRoute()
  const open = params.get('p')
  const [filter, setFilter] = useState<'All' | CommunityPost['tag']>('All')
  const [sort, setSort] = useState<'new' | 'top'>('top')
  const [composing, setComposing] = useState(params.get('new') === '1')
  useEffect(() => { if (params.get('new') === '1') setComposing(true) }, [params.get('new')])
  const byId = new Map(feed.map((w) => [w.id, w]))

  const list = useMemo(() => {
    const xs = posts.filter((p) => filter === 'All' || p.tag === filter)
    return [...xs].sort((a, b) => sort === 'new' ? b.ts.localeCompare(a.ts) : (b.votes + (votes[b.id] || 0)) - (a.votes + (votes[a.id] || 0)))
  }, [posts, filter, sort, votes])

  const current = open ? posts.find((p) => p.id === open) : null

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
      <div className="min-w-0">
        {current ? (
          <Thread post={current} />
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[240px]">
                <h1 className="font-serif text-[34px] md:text-[42px] leading-[1.05] font-medium">Community</h1>
                <p className="text-[16px] text-ink-2 mt-1.5">Ask what a story means, share news you found, and talk it through with other readers and the writers.</p>
              </div>
              <Button variant="primary" onClick={() => setComposing((x) => !x)}>{composing ? 'Close' : 'New post'}</Button>
            </div>
            {composing && <Composer onDone={(id) => { setComposing(false); go(`/community?p=${id}`) }} />}
            <div className="flex flex-wrap items-center gap-2 mt-6 pb-3 border-b border-line">
              {(['All', ...TAGS] as const).map((t) => (
                <button key={t} aria-pressed={filter === t} onClick={() => setFilter(t)} className={cx('h-8 px-3 rounded-full text-[13.5px] font-medium cursor-pointer', filter === t ? 'bg-ink text-white' : 'text-ink-2 hover:bg-line-2')}>{t}</button>
              ))}
              <span className="ml-auto text-[13px] text-muted">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'top')} className="h-8 rounded-[8px] border border-line px-2 text-[13.5px] bg-surface">
                <option value="top">Most helpful</option>
                <option value="new">Newest</option>
              </select>
            </div>
            <ul className="divide-y divide-line">
              {list.map((p) => {
                const w = p.workId ? byId.get(p.workId) : undefined
                const n = p.replies.length + (replies[p.id]?.length || 0)
                return (
                  <li key={p.id} className={cx('py-4 flex gap-4', p.id.startsWith('up_') && 'arrive')}>
                    <Votes post={p} />
                    <a href={`#/community?p=${p.id}`} className="group flex-1 min-w-0">
                      <span className="flex items-center gap-2 text-[12.5px]">
                        <span className="font-semibold text-human-ink">{p.tag}</span>
                        <span className="text-muted">{p.author}, {ago(p.ts)}</span>
                      </span>
                      <span className="block text-[18px] font-semibold leading-snug mt-1 group-hover:underline">{p.title}</span>
                      {p.body && <span className="block text-[14.5px] text-ink-2 mt-1 line-clamp-2">{p.body}</span>}
                      {w && (
                        <span className="mt-2 flex items-center gap-3 rounded-[10px] border border-line p-2 max-w-[520px]">
                          <Photo src={w.meta.image.url} alt="" ratio="1/1" className="w-12 shrink-0 rounded-[6px]" showCredit={false} />
                          <span className="font-serif text-[14.5px] leading-snug line-clamp-2">{w.title}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 mt-2 text-[13px] text-muted"><Icon.comment className="w-4 h-4" /> {n} {n === 1 ? 'reply' : 'replies'}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
      <aside className="space-y-6">
        <div className="rounded-[14px] overflow-hidden border border-line">
          <Photo src={PHOTOS.community.url} alt={PHOTOS.community.alt} credit={PHOTOS.community.credit} ratio="16/10" />
          <div className="p-4">
            <h2 className="text-[15px] font-semibold">How this space works</h2>
            <ul className="mt-2 space-y-1.5 text-[14px] text-ink-2">
              <li>Link a story when you share news, so its writer gets the traffic.</li>
              <li>Writers can reply. Their replies are marked.</li>
              <li>Upvotes and replies feed into which stories we show more people.</li>
            </ul>
          </div>
        </div>
        {!profile && (
          <div className="rounded-[14px] border border-line p-4">
            <p className="text-[15px] font-semibold">Post under your own name</p>
            <p className="text-[14px] text-ink-2 mt-1">Create a free account in under a minute.</p>
            <a href="#/welcome" className="mt-3 h-9 rounded-[9px] bg-ink text-white text-[14px] font-medium grid place-items-center">Create account</a>
          </div>
        )}
      </aside>
    </div>
  )
}

function Votes({ post }: { post: CommunityPost }) {
  const { votes, vote } = useStore()
  const mine = votes[post.id] || 0
  return (
    <div className="flex flex-col items-center w-10 shrink-0 pt-1">
      <button aria-pressed={mine === 1} aria-label="Upvote" onClick={() => vote(post.id, mine === 1 ? 0 : 1)} className={cx('w-8 h-7 rounded-[6px] grid place-items-center cursor-pointer', mine === 1 ? 'text-good bg-good-wash' : 'text-muted hover:bg-line-2')}>▲</button>
      <span className="text-[14px] font-semibold tab">{post.votes + mine}</span>
      <button aria-pressed={mine === -1} aria-label="Downvote" onClick={() => vote(post.id, mine === -1 ? 0 : -1)} className={cx('w-8 h-7 rounded-[6px] grid place-items-center cursor-pointer', mine === -1 ? 'text-bad bg-bad-wash' : 'text-muted hover:bg-line-2')}>▼</button>
    </div>
  )
}

function Composer({ onDone }: { onDone: (id: string) => void }) {
  const { addPost, feed } = useStore()
  const [tag, setTag] = useState<CommunityPost['tag']>('Question')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [workId, setWorkId] = useState('')
  return (
    <form className="mt-5 rounded-[14px] border border-line p-4 arrive" onSubmit={(e) => {
      e.preventDefault(); if (title.trim().length < 5) return
      const id = addPost({ tag, title: title.trim(), body: body.trim(), workId: workId || undefined })
      onDone(id)
    }}>
      <div className="flex flex-wrap gap-2">
        {TAGS.map((t) => <button type="button" key={t} aria-pressed={tag === t} onClick={() => setTag(t)} className={cx('h-8 px-3 rounded-full text-[13.5px] font-medium border cursor-pointer', tag === t ? 'bg-ink border-ink text-white' : 'border-line')}>{t}</button>)}
      </div>
      <label className="block mt-3">
        <span className="sr-only">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tag === 'Question' ? 'What do you want to know?' : 'Title'} className="h-11 w-full rounded-[10px] border border-line px-3 text-[16px] outline-none focus:border-ink" />
      </label>
      <label className="block mt-2">
        <span className="sr-only">Details</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Add details (optional)" className="w-full rounded-[10px] border border-line p-3 text-[15px] outline-none focus:border-ink" />
      </label>
      <label className="block mt-2">
        <span className="text-[13.5px] font-medium">Link a story (optional)</span>
        <select value={workId} onChange={(e) => setWorkId(e.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-line px-2 text-[14px] bg-surface">
          <option value="">None</option>
          {feed.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-3 mt-3">
        <Button variant="primary" disabled={title.trim().length < 5}>Post</Button>
        <span className="text-[12.5px] text-muted">Posts appear for everyone on the live site.</span>
      </div>
    </form>
  )
}

function Thread({ post }: { post: CommunityPost }) {
  const { feed, replies, reply, profile, creators } = useStore()
  const [text, setText] = useState('')
  const w = post.workId ? feed.find((x) => x.id === post.workId) : undefined
  const writerNames = new Set(Object.values(creators).map((c) => c.name))
  const all = [...post.replies, ...(replies[post.id] || [])]
  return (
    <article>
      <a href="#/community" className="text-[14px] text-ink-2 underline underline-offset-4">All posts</a>
      <div className="flex gap-4 mt-4">
        <Votes post={post} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px]"><span className="font-semibold text-human-ink">{post.tag}</span> <span className="text-muted">{post.author}, {ago(post.ts)}</span></p>
          <h1 className="font-serif text-[28px] md:text-[34px] leading-[1.1] font-medium mt-1">{post.title}</h1>
          {post.body && <p className="text-[16px] text-ink mt-3 leading-relaxed">{post.body}</p>}
          {w && (
            <a href={`#/work/${w.id}`} className="group mt-4 flex gap-4 rounded-[12px] border border-line p-3 hover:border-faint">
              <Photo src={w.meta.image.url} alt="" ratio="4/3" className="w-28 shrink-0 rounded-[8px]" showCredit={false} />
              <span>
                <span className="text-[12.5px] text-muted">{w.category}</span>
                <span className="block font-serif text-[18px] leading-snug group-hover:underline">{w.title}</span>
                <span className="block text-[13.5px] text-ink-2 mt-1 line-clamp-2">{w.dek}</span>
              </span>
            </a>
          )}
        </div>
      </div>
      <section className="mt-8 pt-6 border-t border-line" aria-labelledby="rp-h">
        <h2 id="rp-h" className="text-[17px] font-semibold">{all.length} {all.length === 1 ? 'reply' : 'replies'}</h2>
        <ul className="mt-4 space-y-4">
          {all.map((r, i) => {
            const isWriter = writerNames.has(r.author) || r.author === 'Twofold team'
            return (
              <li key={i} className="flex gap-3">
                <Avatar name={r.author} hue={(r.author.charCodeAt(0) * 37) % 360} size={32} />
                <div>
                  <p className="text-[14px]"><strong className="font-semibold">{r.author}</strong>{isWriter && <span className="ml-2 rounded-full bg-human-wash text-human-ink text-[11.5px] font-semibold px-2 py-0.5">{r.author === 'Twofold team' ? 'Team' : 'Writer'}</span>} <span className="text-muted text-[12.5px] ml-1">{ago(r.ts)}</span></p>
                  <p className="text-[15px] mt-0.5">{r.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
        <form className="mt-6" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { reply(post.id, text.trim()); setText('') } }}>
          <label htmlFor="rp" className="sr-only">Reply</label>
          <textarea id="rp" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={profile ? `Reply as ${profile.name}` : 'Write a reply'} className="w-full rounded-[10px] border border-line p-3 text-[15px] outline-none focus:border-ink" />
          <Button variant="primary" size="sm" className="mt-2" disabled={!text.trim()}>Reply</Button>
        </form>
      </section>
    </article>
  )
}
