import { useState } from 'react'
import type { Decorated } from '../data/meta'
import { useStore } from '../store'
import { Icon, compact, cx } from './kit'

/** Like / comment / share / save / promote. Counts are seed + this browser's actions. */
export function Engage({ w, size = 'md', onComment }: { w: Decorated; size?: 'sm' | 'md'; onComment?: () => void }) {
  const { liked, bookmarked, promoted, toggle, comments } = useStore()
  const [copied, setCopied] = useState(false)
  const isLiked = liked.includes(w.id)
  const isSaved = bookmarked.includes(w.id)
  const isPromoted = promoted.includes(w.id)
  const nComments = w.meta.comments.length + (comments[w.id]?.length || 0)
  const share = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const url = `${location.origin}/#/work/${w.id}`
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: w.title, url })
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600) }
    } catch { /* cancelled */ }
  }
  const btn = cx('inline-flex items-center gap-1.5 rounded-full cursor-pointer transition-colors', size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3 text-[14px]')
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); fn() }
  return (
    <div className="flex flex-wrap items-center gap-1 -ml-2.5" role="group" aria-label="Respond to this story">
      <button aria-pressed={isLiked} onClick={stop(() => toggle('liked', w.id))} className={cx(btn, isLiked ? 'text-bad' : 'text-ink-2 hover:bg-line-2')}>
        <Icon.heart on={isLiked} /> <span className="num">{compact(w.meta.likes + (isLiked ? 1 : 0))}</span><span className="sr-only"> likes</span>
      </button>
      <button onClick={stop(() => onComment ? onComment() : (location.hash = `#/work/${w.id}?c=1`))} className={cx(btn, 'text-ink-2 hover:bg-line-2')}>
        <Icon.comment /> <span className="num">{nComments}</span><span className="sr-only"> comments</span>
      </button>
      <button onClick={share} className={cx(btn, 'text-ink-2 hover:bg-line-2')}>
        <Icon.share /> {copied ? 'Link copied' : <span className="num">{compact(w.meta.shares)}</span>}<span className="sr-only"> share</span>
      </button>
      <button aria-pressed={isSaved} onClick={stop(() => toggle('bookmarked', w.id))} className={cx(btn, isSaved ? 'text-machine' : 'text-ink-2 hover:bg-line-2')}>
        <Icon.bookmark on={isSaved} /> {size === 'md' && <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>}<span className="sr-only">{size === 'sm' && (isSaved ? 'Saved' : 'Save')}</span>
      </button>
      <button aria-pressed={isPromoted} title="Promote: push this story higher for everyone" onClick={stop(() => toggle('promoted', w.id))} className={cx(btn, isPromoted ? 'text-good' : 'text-ink-2 hover:bg-line-2')}>
        <Icon.promote on={isPromoted} /> {size === 'md' && <span className="hidden sm:inline">{isPromoted ? 'Promoted' : 'Promote'}</span>}<span className="sr-only">{size === 'sm' && (isPromoted ? 'Promoted' : 'Promote')}</span>
      </button>
    </div>
  )
}

/** Engagement folded into one 0–100 signal; the valuation engine treats it as observed demand. */
export function engagementScore(w: Decorated, extra: { liked: boolean; saved: boolean; promoted: boolean; comments: number }) {
  const likes = w.meta.likes + (extra.liked ? 1 : 0)
  const raw = Math.log10(1 + likes) * 14 + Math.log10(1 + w.meta.shares) * 12 + (w.meta.comments.length + extra.comments) * 3 + (extra.saved ? 4 : 0) + (extra.promoted ? 6 : 0)
  return Math.min(100, Math.round(raw))
}
