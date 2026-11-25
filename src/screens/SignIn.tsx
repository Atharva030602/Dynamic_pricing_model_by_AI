import { useState } from 'react'
import { PHOTOS } from '../data/v2'
import { useStore } from '../store'
import { Button, Photo, cx, go } from '../ui/kit'
import { signIn } from '../lib/accounts'
import { TopBar } from './Onboarding'

/** Reader sign-in: checks the email and password against the accounts database (master). */
export default function SignIn() {
  const { signInAs } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<{ status: number; error: string } | null>(null)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

  const submit = async () => {
    setBusy(true); setErr(null)
    const r = await signIn('reader', email.trim(), password)
    setBusy(false)
    if (!r.ok) { setErr(r); return }
    signInAs(r.account)
    go('/?welcome=back')
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar right={<span className="text-[13px] text-muted font-medium ml-2">Sign in</span>} />
      <main className="mx-auto max-w-[1000px] px-4 md:px-6 py-10 grid md:grid-cols-[minmax(0,1fr)_380px] gap-10 items-start">
        <section>
          <h1 className="font-serif text-[34px] md:text-[44px] leading-[1.05] font-medium">Welcome back</h1>
          <p className="text-[16px] text-ink-2 mt-3 max-w-[52ch]">Sign in to get your feed, your topics and your saved stories on this device.</p>
          <form className="mt-8 max-w-[420px]" onSubmit={(e) => { e.preventDefault(); if (emailOk && password && !busy) submit() }}>
            <label className="block"><span className="text-[14px] font-semibold">Email</span>
              <input type="email" autoComplete="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setErr(null) }} placeholder="you@example.com" className={cx('mt-1.5 h-11 w-full rounded-[10px] border px-3 text-[16px] outline-none focus:border-ink', err?.status === 404 ? 'border-bad' : 'border-line')} /></label>
            <label className="block mt-4"><span className="text-[14px] font-semibold">Password</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setErr(null) }} className={cx('mt-1.5 h-11 w-full rounded-[10px] border px-3 text-[16px] outline-none focus:border-ink', err?.status === 401 ? 'border-bad' : 'border-line')} /></label>
            {err && (
              <div role="alert" className="mt-4 rounded-[10px] border border-bad/40 bg-bad-wash p-3 text-[14px]">
                <p className="font-semibold text-bad">{err.error}</p>
                {err.status === 404 && <p className="text-ink-2 mt-0.5">Check the spelling, or <a href="#/welcome" className="underline underline-offset-4 text-ink">create a reader account</a> in about a minute.</p>}
                {err.status === 401 && <p className="text-ink-2 mt-0.5">Passwords are case-sensitive. This prototype has no password reset yet.</p>}
              </div>
            )}
            <Button type="submit" variant="primary" className="mt-5" disabled={!emailOk || !password || busy}>{busy ? 'Checking…' : 'Sign in'}</Button>
          </form>
          <div className="mt-10 pt-6 border-t border-line flex flex-wrap gap-3 items-center">
            <span className="text-[14px] text-ink-2">New here?</span>
            <Button size="sm" onClick={() => go('/welcome')}>Create a reader account</Button>
            <Button size="sm" onClick={() => go('/studio')}>Creator? Sign in to the studio</Button>
          </div>
        </section>
        <aside className="rounded-[16px] border border-line overflow-hidden">
          <Photo src={PHOTOS.hero1.url} alt={PHOTOS.hero1.alt} credit={PHOTOS.hero1.credit} ratio="4/3" />
          <div className="p-5">
            <p className="text-[15px] font-semibold">What comes back when you sign in</p>
            <ul className="text-[14px] text-ink-2 mt-2 space-y-1 list-disc pl-5">
              <li>Your topics and how much each one matters</li>
              <li>Your saved stories, from any device</li>
              <li>Your reading report settings</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}
