import { useState } from 'react'
import { PHOTOS } from '../data/v2'
import { useStore } from '../store'
import { Avatar, Button, Photo, cx, go } from '../ui/kit'
import { DEMO_CODE } from './CreatorJoin'
import { TopBar } from './Onboarding'

/** Creator Studio always asks for its own sign-in once per browser, even for a signed-in reader. */
export default function CreatorGate({ next }: { next: string }) {
  const { creator, profile, startCreatorSession } = useStore()
  const [email, setEmail] = useState(creator?.email || '')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const known = creator && email.trim().toLowerCase() === creator.email.toLowerCase()
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

  return (
    <div className="min-h-screen bg-surface">
      <TopBar right={<span className="text-[13px] text-muted font-medium ml-2">Creator Studio</span>} />
      <main className="mx-auto max-w-[1000px] px-4 md:px-6 py-10 grid md:grid-cols-[minmax(0,1fr)_380px] gap-10 items-start">
        <section>
          <h1 className="font-serif text-[34px] md:text-[44px] leading-[1.05] font-medium">Sign in to Creator Studio</h1>
          <p className="text-[16px] text-ink-2 mt-3 max-w-[52ch]">
            {profile ? `You’re signed in as a reader (${profile.name}). ` : ''}Creator Studio handles your prices and earnings, so it has its own sign-in. After this, you go straight in from this browser.
          </p>
          <form className="mt-8 max-w-[420px]" onSubmit={(e) => { e.preventDefault(); if (!sent) { if (emailOk) setSent(true) } else if (code === DEMO_CODE && known) { startCreatorSession('me'); go(next) } }}>
            <label className="block"><span className="text-[14px] font-semibold">Creator email</span>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSent(false); setCode('') }} placeholder="you@example.com" className="mt-1.5 h-11 w-full rounded-[10px] border border-line px-3 text-[16px] outline-none focus:border-ink" /></label>
            {sent && !known && (
              <div className="mt-3 rounded-[10px] border border-line p-3 text-[14px]">
                <p className="font-semibold">No creator account for {email}</p>
                <p className="text-ink-2 mt-0.5">Set one up in about three minutes. Your reader account stays as it is.</p>
                <Button type="button" size="sm" variant="primary" className="mt-2" onClick={() => go('/creator/join')}>Set up a creator account</Button>
              </div>
            )}
            {sent && known && (
              <label className="block mt-4"><span className="text-[14px] font-semibold">6-digit code sent to {email}</span>
                <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={cx('mt-1.5 h-11 w-[220px] rounded-[10px] border px-3 text-[20px] tracking-[0.4em] text-center outline-none focus:border-ink', code.length === 6 && code !== DEMO_CODE ? 'border-bad' : 'border-line')} />
                {code.length === 6 && code !== DEMO_CODE && <span className="block text-[13px] text-bad mt-1">That code doesn’t match.</span>}
                <span className="block text-[12.5px] text-muted mt-2">Prototype: no email is sent. Your code is <strong className="text-ink">{DEMO_CODE}</strong>.</span>
              </label>
            )}
            <Button type="submit" variant="primary" className="mt-5" disabled={!sent ? !emailOk : !(known && code === DEMO_CODE)}>{!sent ? 'Send sign-in code' : 'Sign in'}</Button>
          </form>
          {creator && (
            <button onClick={() => { setEmail(creator.email); setSent(true) }} className="mt-6 flex items-center gap-3 rounded-[12px] border border-line p-3 hover:border-ink cursor-pointer text-left">
              <Avatar name={creator.name} hue={330} size={36} />
              <span><span className="block text-[15px] font-semibold">Continue as {creator.name}</span><span className="block text-[13px] text-muted">{creator.email}</span></span>
            </button>
          )}
          <div className="mt-10 pt-6 border-t border-line flex flex-wrap gap-3 items-center">
            <span className="text-[14px] text-ink-2">New to Creator Studio?</span>
            <Button size="sm" onClick={() => go('/creator/join')}>Set up a creator account</Button>
            <Button size="sm" onClick={() => { startCreatorSession('demo'); go(next) }}>Explore with a demo creator</Button>
          </div>
        </section>
        <aside className="rounded-[16px] border border-line overflow-hidden">
          <Photo src={PHOTOS.creator.url} alt={PHOTOS.creator.alt} credit={PHOTOS.creator.credit} ratio="4/3" />
          <div className="p-5">
            <p className="text-[15px] font-semibold">The demo creator</p>
            <p className="text-[14px] text-ink-2 mt-1">Riya Deshpande, a Pune markets reporter with a month of sales to readers and AI. Use her account to see a busy studio, or set up your own.</p>
          </div>
        </aside>
      </main>
    </div>
  )
}
