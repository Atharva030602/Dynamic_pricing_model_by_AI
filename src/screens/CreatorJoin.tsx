import { useMemo, useState } from 'react'
import { CATEGORY_LIST, PHOTOS } from '../data/v2'
import { inr } from '../engine/licence'
import { useStore, type CreatorAccount } from '../store'
import { Button, Icon, Photo, cx, go } from '../ui/kit'
import { TopBar } from './Onboarding'
import { createAccount } from '../lib/accounts'

/* Creator sign-up: separate from the reader account, in layers.
   1 You · 2 Your work · 3 Your channels (we study them) · 4 Audience & goals · 5 AI terms · 6 Verify */

const STEPS = ['You', 'Your work', 'Your channels', 'Audience and goals', 'AI terms', 'Verify'] as const
const NETWORKS = ['YouTube', 'Instagram', 'X', 'LinkedIn', 'Substack'] as const
const FORMATS = [
  { id: 'post', label: 'Short posts', d: 'Updates, threads, quick takes' },
  { id: 'article', label: 'Articles', d: 'Reported stories, explainers' },
  { id: 'video', label: 'Videos', d: 'Reviews, explainers, reels' },
  { id: 'data', label: 'Data', d: 'Datasets, trackers, research' },
]
const AUDIENCES = ['Students', 'Investors', 'Policy and government', 'Local readers', 'Professionals in my field', 'Fans and hobbyists', 'Researchers']
export const DEMO_CODE = '482913'

function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return Math.abs(h) }

export function studyChannel(network: string, handle: string) {
  const h = hash(network + handle)
  const posts = 40 + (h % 220)
  const followers = 800 + (h % 48000)
  const eng = 1.8 + ((h >> 4) % 60) / 10
  return { posts, followers, eng }
}

export default function CreatorJoin() {
  const { profile, setCreator, creator } = useStore()
  const [i, setI] = useState(0)
  const [name, setName] = useState(creator?.name || profile?.name || '')
  const [email, setEmail] = useState(creator?.email || '')
  const [city, setCity] = useState(creator?.city || profile?.city || 'Pune')
  const [beat, setBeat] = useState(creator?.beat || '')
  const [languages, setLanguages] = useState<string[]>(creator?.languages || ['English'])
  const [formats, setFormats] = useState<string[]>(creator?.formats || ['article'])
  const [cats, setCats] = useState<string[]>([])
  const [socials, setSocials] = useState<CreatorAccount['socials']>(creator?.socials || [])
  const [net, setNet] = useState<string>('YouTube')
  const [h, setH] = useState('')
  const [studying, setStudying] = useState(false)
  const [goal, setGoal] = useState<CreatorAccount['goal']>(creator?.goal || 'both')
  const [audience, setAudience] = useState<string[]>(creator?.audience || [])
  const [ai, setAi] = useState<CreatorAccount['aiTraining']>(creator?.aiTraining || 'ask')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [joinErr, setJoinErr] = useState<{ status: number; error: string } | null>(null)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

  const handle = '@' + (name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'you')
  const okStep = [name.trim().length > 1 && emailOk && beat.trim().length > 1 && password.length >= 8, formats.length > 0 && cats.length > 0, true, audience.length > 0, true, code === DEMO_CODE][i]

  const study = useMemo(() => {
    if (!socials.length) return null
    const posts = socials.reduce((a, s) => a + s.posts, 0)
    const followers = socials.reduce((a, s) => a + s.followers, 0)
    const hh = hash(socials.map((s) => s.handle).join())
    const topics = [...new Set([...cats.flatMap((c) => CATEGORY_LIST.find((x) => x.id === c)?.keywords.slice(0, 2) || []), beat].filter(Boolean))].slice(0, 4)
    const regions = ['Maharashtra', 'Karnataka', 'Delhi NCR', 'Gujarat', 'Tamil Nadu'].slice(0, 3 + (hh % 2))
    const best = ['7–9 am', '12–2 pm', '8–10 pm'][hh % 3]
    const low = Math.round(4 + Math.log10(followers) * 2), high = Math.round(low * 2.1)
    return { posts, followers, topics, regions, best, low, high, eng: (socials.reduce((a, s) => a + studyChannel(s.network, s.handle).eng, 0) / socials.length).toFixed(1) }
  }, [socials, cats, beat])

  const addChannel = () => {
    const hd = h.trim().replace(/^@?/, '@')
    if (hd.length < 3 || socials.some((s) => s.network === net)) return
    setStudying(true)
    setTimeout(() => {
      const st = studyChannel(net, hd)
      setSocials((x) => [...x, { network: net, handle: hd, posts: st.posts, followers: st.followers }])
      setH(''); setStudying(false)
      const next = NETWORKS.find((n) => n !== net && !socials.some((s) => s.network === n))
      if (next) setNet(next)
    }, 1300)
  }

  const finish = async () => {
    setBusy(true); setJoinErr(null)
    const r = await createAccount('creator', { name: name.trim(), handle, email: email.trim(), password, city: city.trim(), beat: beat.trim(), languages, formats, socials: socials.map((x) => x.network), goal, audience, aiTraining: ai })
    setBusy(false)
    if (!r.ok && r.status !== 0) { setJoinErr(r); return }
    setCreator({ name: name.trim(), handle, email: email.trim(), city: city.trim(), beat: beat.trim(), languages, formats, socials, goal, audience, aiTraining: ai, createdAt: new Date().toISOString() })
    go('/studio/hub?tour=1')
  }

  const toggle = (xs: string[], set: (v: string[]) => void, v: string) => set(xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v])

  return (
    <div className="min-h-screen bg-surface">
      <TopBar right={<span className="text-[13px] text-muted font-medium ml-2">Creator Studio sign-up</span>} />
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 grid lg:grid-cols-[240px_minmax(0,1fr)_320px] gap-8">
        <nav aria-label="Sign-up steps" className="hidden lg:block">
          <ol className="space-y-1 sticky top-24">
            {STEPS.map((s, k) => (
              <li key={s}>
                <button onClick={() => k < i && setI(k)} disabled={k > i} className={cx('w-full flex items-center gap-3 h-11 px-3 rounded-[10px] text-left text-[14.5px]', k === i ? 'bg-paper font-semibold' : k < i ? 'text-ink-2 hover:bg-line-2 cursor-pointer' : 'text-faint')}>
                  <span className={cx('w-6 h-6 rounded-full grid place-items-center text-[12px] font-semibold shrink-0', k < i ? 'bg-ink text-white' : k === i ? 'border-2 border-ink' : 'border border-line')}>{k < i ? '✓' : k + 1}</span>{s}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0">
          <p className="text-[13px] text-muted lg:hidden">Step {i + 1} of {STEPS.length}: {STEPS[i]}</p>
          {i === 0 && (
            <Section title="Tell us who you are" sub="This is your public byline. Your email is only for signing in and payouts.">
              <Grid>
                <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Asha Kulkarni" className={inp} /></Field>
                <Field label="Email" hint={email && !emailOk ? 'Use a full email address, like name@example.com' : 'You sign in to the studio with this'} bad={!!email && !emailOk}><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inp} /></Field>
                <Field label="Password" hint={password && password.length < 8 ? `${8 - password.length} more character${8 - password.length > 1 ? 's' : ''}` : 'At least 8 characters; stored only as a salted hash'}><input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inp} /></Field>
                <Field label="Your beat" hint="One or two words, shown under your name"><input value={beat} onChange={(e) => setBeat(e.target.value)} placeholder="e.g. Football, Civic, Markets" className={inp} /></Field>
                <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} className={inp} /></Field>
              </Grid>
              <p className="text-[14px] font-semibold mt-5">Languages you publish in</p>
              <Chips items={['English', 'Hindi', 'Marathi', 'Tamil', 'Bengali', 'Kannada']} on={languages} toggle={(v) => toggle(languages, setLanguages, v)} />
              {profile && <p className="text-[13px] text-muted mt-4">We filled in what we could from your reader account. Your creator account is separate and has its own sign-in.</p>}
            </Section>
          )}
          {i === 1 && (
            <Section title="What do you publish?" sub="Pick one or several. You can mix formats in a single piece later.">
              <div className="grid sm:grid-cols-2 gap-2">
                {FORMATS.map((f) => (
                  <button key={f.id} aria-pressed={formats.includes(f.id)} onClick={() => toggle(formats, setFormats, f.id)} className={cx('rounded-[14px] border p-4 text-left cursor-pointer', formats.includes(f.id) ? 'border-ink ring-1 ring-ink bg-paper' : 'border-line hover:border-faint')}>
                    <span className="block text-[16px] font-semibold">{formats.includes(f.id) ? '✓ ' : ''}{f.label}</span>
                    <span className="block text-[13.5px] text-muted">{f.d}</span>
                  </button>
                ))}
              </div>
              <p className="text-[14px] font-semibold mt-6">Which categories do you cover?</p>
              <Chips items={CATEGORY_LIST.map((c) => c.id)} on={cats} toggle={(v) => toggle(cats, setCats, v)} />
              <p className="text-[13px] text-muted mt-2">Something missing? You can propose a new category when you publish. It goes through a quick AI check.</p>
            </Section>
          )}
          {i === 2 && (
            <Section title="Connect your channels" sub="We study your public posts to suggest prices, topics and the best time to publish. Optional, and you can disconnect any time.">
              <div className="flex flex-wrap gap-2">
                {NETWORKS.map((n) => {
                  const done = socials.some((s) => s.network === n)
                  return <button key={n} disabled={done} onClick={() => setNet(n)} className={cx('h-9 px-3.5 rounded-full border text-[14px] font-medium cursor-pointer', done ? 'border-good text-good' : net === n ? 'bg-ink text-white border-ink' : 'border-line')}>{done ? '✓ ' : ''}{n}</button>
                })}
              </div>
              <form className="flex gap-2 mt-3 max-w-[520px]" onSubmit={(e) => { e.preventDefault(); addChannel() }}>
                <label className="flex-1"><span className="sr-only">{net} handle</span><input value={h} onChange={(e) => setH(e.target.value)} placeholder={`Your ${net} handle`} className={inp} /></label>
                <Button variant="primary" disabled={studying || h.trim().length < 2 || socials.some((s) => s.network === net)}>{studying ? 'Studying…' : 'Connect'}</Button>
              </form>
              <p className="text-[12.5px] text-muted mt-2">Prototype: we generate a plausible study from the handle. No account is accessed.</p>
              {socials.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {socials.map((s) => (
                    <li key={s.network} className="pop-in flex items-center gap-3 rounded-[12px] border border-line p-3">
                      <span className="w-9 h-9 rounded-[9px] bg-ink text-white grid place-items-center text-[13px] font-semibold">{s.network[0]}</span>
                      <span className="flex-1"><span className="block text-[15px] font-semibold">{s.network} {s.handle}</span><span className="block text-[13px] text-muted">{s.posts} posts studied, {s.followers.toLocaleString('en-IN')} followers</span></span>
                      <button onClick={() => setSocials((x) => x.filter((y) => y.network !== s.network))} className="text-[13px] text-muted underline underline-offset-2 cursor-pointer">Disconnect</button>
                    </li>
                  ))}
                </ul>
              )}
              {study && (
                <div className="pop-in mt-5 rounded-[16px] bg-machine-wash/50 border border-line p-5">
                  <h3 className="text-[16px] font-semibold flex items-center gap-2"><Icon.spark className="text-machine" /> What we learned from {study.posts} posts</h3>
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-3 text-[14.5px]">
                    <div><dt className="text-muted text-[13px]">You write most about</dt><dd className="font-medium">{study.topics.join(', ') || 'Not enough yet'}</dd></div>
                    <div><dt className="text-muted text-[13px]">Average engagement</dt><dd className="font-medium">{study.eng}% per post</dd></div>
                    <div><dt className="text-muted text-[13px]">Your audience is mostly in</dt><dd className="font-medium">{study.regions.join(', ')}</dd></div>
                    <div><dt className="text-muted text-[13px]">Best time to publish</dt><dd className="font-medium">{study.best}</dd></div>
                  </dl>
                  <p className="text-[14px] mt-4 pt-4 border-t border-line">Suggested starting price for a reported article: <strong>{inr(study.low)}–{inr(study.high)}</strong> per reader. Your first rating starts higher because your channels show a track record.</p>
                </div>
              )}
            </Section>
          )}
          {i === 3 && (
            <Section title="Who are you writing for, and why?" sub="This shapes the advice you get, and which buyers we show your work to.">
              <p className="text-[14px] font-semibold">Your readers are mostly</p>
              <Chips items={AUDIENCES} on={audience} toggle={(v) => toggle(audience, setAudience, v)} />
              <p className="text-[14px] font-semibold mt-6">What matters most right now?</p>
              <div className="grid sm:grid-cols-3 gap-2 mt-2">
                {([['reach', 'More readers', 'Lower prices, more free previews, promotion tips'], ['income', 'More income', 'Higher prices, paid AI use first'], ['both', 'A balance', 'Our default suggestions']] as const).map(([v, t, d]) => (
                  <button key={v} aria-pressed={goal === v} onClick={() => setGoal(v)} className={cx('rounded-[12px] border p-3 text-left cursor-pointer', goal === v ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-faint')}>
                    <span className="block text-[15px] font-semibold">{t}</span><span className="block text-[13px] text-muted mt-0.5">{d}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}
          {i === 4 && (
            <Section title="Your default terms for AI" sub="Applied to new pieces. You can change them on any single piece.">
              <div className="grid gap-2">
                {([['ask', 'Ask me each time', 'AI companies request training; you approve or decline. Quoting in answers is paid per answer.'], ['paid', 'Allow training, for a fee', 'Priced from what the piece earns in its first year. Quoting is paid per answer.'], ['no', 'No training', 'AI can still quote you in answers, for a fee and with credit. Training is never allowed.']] as const).map(([v, t, d]) => (
                  <button key={v} aria-pressed={ai === v} onClick={() => setAi(v)} className={cx('rounded-[12px] border p-4 text-left cursor-pointer', ai === v ? 'border-ink ring-1 ring-ink bg-paper' : 'border-line hover:border-faint')}>
                    <span className="block text-[15.5px] font-semibold">{t}</span><span className="block text-[13.5px] text-ink-2 mt-0.5">{d}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}
          {i === 5 && (
            <Section title="Verify your email" sub={`We send a 6-digit code to ${email}. Creator Studio handles your earnings, so it always asks for this, even if you’re signed in as a reader.`}>
              {!sent ? <Button variant="primary" onClick={() => setSent(true)}>Send the code</Button> : (
                <>
                  <label className="block max-w-[260px]"><span className="text-[14px] font-semibold">6-digit code</span>
                    <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={cx(inp, 'tracking-[0.4em] text-center text-[20px]', code.length === 6 && code !== DEMO_CODE && 'border-bad')} /></label>
                  {code.length === 6 && code !== DEMO_CODE && <p className="text-[13px] text-bad mt-1.5">That code doesn’t match. Check the latest email, or send a new code.</p>}
                  <p className="text-[13px] text-muted mt-3 rounded-[10px] bg-paper p-3">Prototype: no email is sent. Your code is <strong className="text-ink tab">{DEMO_CODE}</strong>.</p>
                </>
              )}
            </Section>
          )}

          {joinErr && (
            <div role="alert" className="mt-6 rounded-[10px] border border-bad/40 bg-bad-wash p-3 text-[14px] max-w-[620px]">
              <p className="font-semibold text-bad">{joinErr.error}</p>
              {joinErr.status === 409 && <a href="#/studio" className="inline-block mt-1 underline underline-offset-4 text-ink">Sign in to Creator Studio</a>}
            </div>
          )}
          <div className="flex items-center gap-3 mt-8">
            {i > 0 ? <Button onClick={() => setI(i - 1)}>Back</Button> : <Button onClick={() => go('/welcome')}>Cancel</Button>}
            {i < STEPS.length - 1
              ? <Button variant="primary" disabled={!okStep} onClick={() => setI(i + 1)}>{i === 2 && !socials.length ? 'Skip for now' : 'Continue'}</Button>
              : <Button variant="primary" disabled={!okStep || busy} onClick={finish}>{busy ? 'Creating your account…' : 'Open my studio'}</Button>}
            {!okStep && i === 0 && <span className="text-[13px] text-muted">Name, a valid email, a password and your beat are needed</span>}
            {!okStep && i === 1 && <span className="text-[13px] text-muted">Pick at least one format and one category</span>}
            {!okStep && i === 3 && <span className="text-[13px] text-muted">Pick at least one audience</span>}
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[16px] border border-line overflow-hidden">
            <Photo src={PHOTOS.creator.url} alt={PHOTOS.creator.alt} credit={PHOTOS.creator.credit} ratio="16/10" />
            <div className="p-4">
              <p className="text-[13px] text-muted">Your byline will read</p>
              <p className="text-[17px] font-semibold mt-0.5">{name.trim() || 'Your name'}</p>
              <p className="text-[13.5px] text-ink-2">{beat.trim() || 'Your beat'}, {city || 'City'}</p>
              <p className="text-[13px] text-muted mt-3">{formats.length ? `Publishes ${formats.map((f) => FORMATS.find((x) => x.id === f)!.label.toLowerCase()).join(', ')}` : 'Pick what you publish'}</p>
              {socials.length > 0 && <p className="text-[13px] text-muted">{socials.length} channel{socials.length > 1 ? 's' : ''} connected</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

const inp = 'mt-1.5 h-11 w-full rounded-[10px] border border-line px-3 text-[16px] outline-none focus:border-ink'
function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (<section className="pop-in"><h1 className="font-serif text-[30px] md:text-[38px] leading-[1.08] font-medium">{title}</h1><p className="text-[15.5px] text-ink-2 mt-2 mb-6 max-w-[62ch]">{sub}</p>{children}</section>)
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid sm:grid-cols-2 gap-4">{children}</div> }
function Field({ label, hint, bad, children }: { label: string; hint?: string; bad?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="text-[14px] font-semibold">{label}</span>{children}{hint && <span className={cx('block text-[12.5px] mt-1', bad ? 'text-bad' : 'text-muted')}>{hint}</span>}</label>
}
function Chips({ items, on, toggle }: { items: string[]; on: string[]; toggle: (v: string) => void }) {
  return <div className="flex flex-wrap gap-2 mt-2">{items.map((x) => <button key={x} aria-pressed={on.includes(x)} onClick={() => toggle(x)} className={cx('h-9 px-3.5 rounded-full border text-[14px] font-medium cursor-pointer', on.includes(x) ? 'bg-ink border-ink text-white' : 'border-line hover:border-ink')}>{on.includes(x) ? '✓ ' : ''}{x}</button>)}</div>
}
