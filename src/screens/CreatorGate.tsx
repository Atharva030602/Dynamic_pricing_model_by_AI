import { useState } from 'react'
import { PHOTOS } from '../data/v2'
import { useStore } from '../store'
import { Avatar, Button, Photo, cx, go } from '../ui/kit'
import { signIn } from '../lib/accounts'
import { TopBar } from './Onboarding'

/** Creator Studio always asks for its own sign-in once per browser, even for a signed-in reader. */
export default function CreatorGate({ next }: { next: string }) {
  const { creator, profile, startCreatorSession, signInAs } = useStore()
  const [email, setEmail] = useState(creator?.email || '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<{ status: number; error: string } | null>(null)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const submit = async () => {
    setBusy(true); setErr(null)
    const r = await signIn('creator', email.trim(), password)
    setBusy(false)
    if (!r.ok) { setErr(r); return }
    signInAs(r.account)
    go(next)
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar right={<span className="text-[13px] text-muted font-medium ml-2">Creator Studio</span>} />
      <main className="mx-auto max-w-[1000px] px-4 md:px-6 py-10 grid md:grid-cols-[minmax(0,1fr)_380px] gap-10 items-start">
        <section>
          <h1 className="font-serif text-[34px] md:text-[44px] leading-[1.05] font-medium">Sign in to Creator Studio</h1>
          <p className="text-[16px] text-ink-2 mt-3 max-w-[52ch]">
            {profile ? `You’re signed in as a reader (${profile.name}). ` : ''}Creator Studio handles your prices and earnings, so it has its own sign-in. We check your email and password against the accounts database; after that you go straight in from this browser.
          </p>
          <form className="mt-8 max-w-[420px]" onSubmit={(e) => { e.preventDefault(); if (emailOk && password && !busy) submit() }}>
            <label className="block"><span className="text-[14px] font-semibold">Creator email</span>
              <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(null) }} placeholder="you@example.com" className={cx('mt-1.5 h-11 w-full rounded-[10px] border px-3 text-[16px] outline-none focus:border-ink', err?.status === 404 ? 'border-bad' : 'border-line')} /></label>
            <label className="block mt-4"><span className="text-[14px] font-semibold">Password</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setErr(null) }} className={cx('mt-1.5 h-11 w-full rounded-[10px] border px-3 text-[16px] outline-none focus:border-ink', err?.status === 401 ? 'border-bad' : 'border-line')} /></label>
            {err && err.status === 404 && (
              <div role="alert" className="mt-3 rounded-[10px] border border-line p-3 text-[14px]">
                <p className="font-semibold">No creator account for {email}</p>
                <p className="text-ink-2 mt-0.5">Set one up in about three minutes. Your reader account stays as it is.</p>
                <Button type="button" size="sm" variant="primary" className="mt-2" onClick={() => go('/creator/join')}>Set up a creator account</Button>
              </div>
            )}
            {err && err.status !== 404 && <p role="alert" className="mt-3 text-[14px] text-bad">{err.error}</p>}
            <Button type="submit" variant="primary" className="mt-5" disabled={!emailOk || !password || busy}>{busy ? 'Checking…' : 'Sign in'}</Button>
          </form>
          {creator && (
            <button onClick={() => { setEmail(creator.email); setErr(null) }} className="mt-6 flex items-center gap-3 rounded-[12px] border border-line p-3 hover:border-ink cursor-pointer text-left">
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
