import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { useEffect, useState } from 'react'

export function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const on = () => { setHash(window.location.hash || '#/'); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const [path, query = ''] = hash.slice(1).split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

export const go = (to: string) => { window.location.hash = to }

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'machine'; size?: 'sm' | 'md' }
export function Button({ variant = 'secondary', size = 'md', className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-[9px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-[14.5px]',
        variant === 'primary' && 'bg-ink text-white hover:bg-[#2a2e55]',
        variant === 'machine' && 'bg-machine text-white hover:bg-machine-ink',
        variant === 'secondary' && 'bg-surface text-ink border border-line hover:border-faint',
        variant === 'ghost' && 'text-ink-2 hover:bg-line-2',
        className,
      )}
    />
  )
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md', label }: { value: T; options: { value: T; label: ReactNode; tone?: string }[]; onChange: (v: T) => void; size?: 'sm' | 'md'; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[10px] bg-line-2 p-[3px] gap-[2px]">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'rounded-[8px] font-medium transition-colors cursor-pointer',
              size === 'sm' ? 'px-2.5 h-7 text-[12.5px]' : 'px-3 h-8 text-[13.5px]',
              on ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(25,28,54,.12)]' : 'text-muted hover:text-ink',
              on && o.tone,
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Meter({ value, tone = 'ink', label }: { value: number; tone?: 'ink' | 'human' | 'machine' | 'good' | 'bad'; label: string }) {
  const color = { ink: 'bg-ink', human: 'bg-human', machine: 'bg-machine', good: 'bg-good', bad: 'bg-bad' }[tone]
  return (
    <div className="h-[6px] rounded-full bg-line-2 overflow-hidden" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-[width] duration-300', color)} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Avatar({ name, hue, size = 32 }: { name: string; hue: number; size?: number }) {
  const initials = name.replace(/^Dr\s+/, '').split(' ').map((x) => x[0]).slice(0, 2).join('')
  return (
    <span
      aria-hidden
      className="inline-grid place-items-center rounded-full font-semibold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `oklch(0.52 0.12 ${hue})` }}
    >
      {initials}
    </span>
  )
}

export function Badge({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'human' | 'machine' | 'good' | 'bad' | 'wait'; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 h-6 text-[12.5px] font-medium whitespace-nowrap',
        tone === 'neutral' && 'bg-line-2 text-ink-2',
        tone === 'human' && 'bg-human-wash text-human-ink',
        tone === 'machine' && 'bg-machine-wash text-machine-ink',
        tone === 'good' && 'bg-good-wash text-good',
        tone === 'bad' && 'bg-bad-wash text-bad',
        tone === 'wait' && 'bg-wait-wash text-wait',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Small glyphs; drawn rather than imported so the bundle stays tiny. */
export const Icon = {
  person: (p: { className?: string }) => (
    <svg viewBox="0 0 16 16" className={p.className} width="14" height="14" aria-hidden><circle cx="8" cy="5" r="3" fill="currentColor" /><path d="M2.5 14c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" fill="currentColor" /></svg>
  ),
  machine: (p: { className?: string }) => (
    <svg viewBox="0 0 16 16" className={p.className} width="14" height="14" aria-hidden><rect x="2.5" y="4" width="11" height="9" rx="2.5" fill="currentColor" /><rect x="7.25" y="1" width="1.5" height="3" fill="currentColor" /><circle cx="6" cy="8.5" r="1.1" fill="#fff" /><circle cx="10" cy="8.5" r="1.1" fill="#fff" /></svg>
  ),
  seal: (p: { className?: string }) => (
    <svg viewBox="0 0 20 20" className={p.className} width="18" height="18" aria-hidden><path d="M10 1.5l2.1 1.6 2.6-.2.9 2.5 2.2 1.4-.6 2.6 1.1 2.4-1.9 1.8-.2 2.6-2.6.6-1.6 2.1-2.4-1.1-2.4 1.1-1.6-2.1-2.6-.6-.2-2.6L.8 11.8l1.1-2.4-.6-2.6 2.2-1.4.9-2.5 2.6.2z" fill="currentColor" /><path d="M6.5 10.2l2.3 2.3 4.7-4.9" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  warn: (p: { className?: string }) => (
    <svg viewBox="0 0 16 16" className={p.className} width="14" height="14" aria-hidden><path d="M8 1.5l7 12.5H1z" fill="currentColor" /><rect x="7.2" y="5.5" width="1.6" height="4.5" rx=".8" fill="#fff" /><circle cx="8" cy="11.9" r=".9" fill="#fff" /></svg>
  ),
  up: (p: { className?: string }) => (
    <svg viewBox="0 0 16 16" className={p.className} width="12" height="12" aria-hidden><path d="M8 3l5 6H9.5v4h-3V9H3z" fill="currentColor" /></svg>
  ),
  copy: (p: { className?: string }) => (
    <svg viewBox="0 0 16 16" className={p.className} width="14" height="14" aria-hidden><rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M3 11V4a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
  ),
  live: (p: { className?: string }) => <span className={cx('inline-block w-2 h-2 rounded-full bg-bad live-dot', p.className)} aria-hidden />,
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2 font-semibold tracking-[-0.02em] text-ink', className)}>
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
        <path d="M15 4a12 12 0 0 0 0 24z" fill="#D08A10" />
        <path d="M17 4a12 12 0 0 1 0 24z" fill="#3A55E6" />
      </svg>
      <span className="text-[19px]">Twofold</span>
    </span>
  )
}

export function JsonView({ value, className }: { value: unknown; className?: string }) {
  const html = JSON.stringify(value, null, 2)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g, (m, str, colon, bool, num) => {
      if (str) return colon ? `<span class="json-key">${str}</span>${colon}` : `<span class="json-str">${str}</span>`
      if (bool) return `<span class="json-bool">${bool}</span>`
      if (num) return `<span class="json-num">${num}</span>`
      return m
    })
  return <pre className={cx('machine whitespace-pre-wrap break-words text-ink', className)} dangerouslySetInnerHTML={{ __html: html }} />
}

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', ...opts })
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })
export const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return fmtDate(iso)
}
