import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_LIST, PHOTOS, type Category } from '../data/v2'
import { guessKeywords } from '../data/meta'
import { rankForUser } from '../engine/similarity'
import { useStore, type Profile } from '../store'
import { Button, Logo, Photo, cx, go } from '../ui/kit'

/* ---------------------------------------------------------------------------
   First visit: who are you here as? Readers then get a short conversation that
   adapts to each answer (new choices pop in), and a profile that forms live.
   Creators go to their own, separate sign-up (#/creator/join).
--------------------------------------------------------------------------- */

export default function Onboarding() {
  const { profile, skipOnboarding } = useStore()
  const [mode, setMode] = useState<'pick' | 'reader'>(profile ? 'reader' : 'pick')
  if (mode === 'reader') return <ReaderOnboarding />
  return (
    <div className="min-h-screen bg-surface">
      <TopBar onSkip={() => { skipOnboarding(); go('/') }} />
      <main className="mx-auto max-w-[1100px] px-4 md:px-6 py-10 md:py-14">
        <h1 className="font-serif text-[36px] md:text-[52px] leading-[1.04] font-medium tracking-[-0.015em] max-w-[18ch]">Original reporting, paid for fairly, by people and by AI.</h1>
        <p className="text-[17px] text-ink-2 mt-4 max-w-[58ch]">How will you use Twofold? Readers and creators get different set-ups.</p>
        <div className="grid md:grid-cols-2 gap-5 mt-10">
          <RoleCard photo={PHOTOS.hero1} title="I’m here to read" cta="Start, about 1 minute"
            points={['A few quick questions that adapt to your answers', 'A home page built around you, with reasons', 'Optional weekly or monthly reading report']}
            onClick={() => setMode('reader')} />
          <RoleCard photo={PHOTOS.creator} title="I write, film or publish data" cta="Set up Creator Studio, about 3 minutes"
            points={['Connect your channels so we can study your work', 'See what each piece is worth before you publish', 'Separate prices for readers and AI, and a public rating']}
            onClick={() => go('/creator/join')} />
        </div>
        <p className="text-[13.5px] text-muted mt-6">Already a creator? <a href="#/studio" className="underline underline-offset-4 text-ink-2">Sign in to Creator Studio</a></p>
      </main>
    </div>
  )
}

export function TopBar({ onSkip, right }: { onSkip?: () => void; right?: React.ReactNode }) {
  return (
    <header className="h-16 border-b border-line bg-surface sticky top-0 z-20">
      <div className="mx-auto max-w-[1200px] h-full px-4 md:px-6 flex items-center gap-4">
        <a href="#/" aria-label="Twofold home"><Logo /></a>
        {right}
        {onSkip && <button onClick={onSkip} className="ml-auto text-[14px] text-muted hover:text-ink underline underline-offset-4 cursor-pointer">Skip, just browse</button>}
      </div>
    </header>
  )
}

function RoleCard({ photo, title, points, cta, onClick }: { photo: { url: string; alt: string; credit: string }; title: string; points: string[]; cta: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group text-left rounded-[16px] border border-line overflow-hidden cursor-pointer transition-colors bg-surface hover:border-ink flex flex-col">
      <Photo src={photo.url} alt={photo.alt} credit={photo.credit} ratio="16/8" className="w-full" />
      <span className="block p-5">
        <span className="block font-serif text-[26px] font-medium leading-tight group-hover:underline underline-offset-4">{title}</span>
        <ul className="mt-3 space-y-1.5 text-[15px] text-ink-2">
          {points.map((p) => <li key={p} className="flex gap-2"><span className="text-good">✓</span>{p}</li>)}
        </ul>
        <span className="mt-4 inline-flex h-10 px-4 rounded-[10px] bg-ink text-white text-[14.5px] font-medium items-center">{cta}</span>
      </span>
    </button>
  )
}

/* ------------------------------- reader flow ------------------------------ */

type Step = 'intent' | 'deeper' | 'thisthat' | 'words' | 'connect' | 'rhythm' | 'account'

const INTENTS: { id: string; label: string; cats: Category[]; seed: string[] }[] = [
  { id: 'news', label: 'Keep up with what’s happening', cats: ['Cities', 'Markets'], seed: ['Civic issues'] },
  { id: 'money', label: 'Understand money and markets', cats: ['Markets'], seed: ['Stock market'] },
  { id: 'sport', label: 'Follow sport', cats: ['Sports'], seed: ['Football', 'Cricket'] },
  { id: 'city', label: 'Know what’s going on in my city', cats: ['Cities'], seed: ['Pune'] },
  { id: 'tech', label: 'Tech and AI', cats: ['Tech'], seed: ['AI'] },
  { id: 'climate', label: 'Weather, water and farming', cats: ['Climate'], seed: ['Monsoon'] },
  { id: 'culture', label: 'Films, books and culture', cats: ['Culture'], seed: ['Films'] },
]

const PAIRS: { id: string; q: string; a: [string, string]; adds: [string[], string[]] }[] = [
  { id: 'depth', q: 'Which would you rather read first?', a: ['What happened, in two minutes', 'Why it happened, in depth'], adds: [[], ['Data centres', 'Groundwater']] },
  { id: 'scope', q: 'And where should we look?', a: ['India first', 'India and the world'], adds: [['Pune'], ['World Cup qualifiers', 'Lithium']] },
  { id: 'angle', q: 'When something big happens, you want…', a: ['The numbers and the data', 'The people it affects'], adds: [['Stock market', 'Data centres'], ['Farming', 'Civic issues']] },
]

const SOCIALS = [
  { id: 'x', label: 'X', found: ['@IndianFootball', '@ISRO', '@moneycontrol'], adds: ['Football', 'Space', 'Stock market'] },
  { id: 'instagram', label: 'Instagram', found: ['@punemetro', '@marathifilms'], adds: ['Metro & transport', 'Marathi cinema'] },
  { id: 'youtube', label: 'YouTube', found: ['Phone review channels (4)', 'Cricket highlights (2)'], adds: ['Gadget reviews', 'Cricket'] },
  { id: 'linkedin', label: 'LinkedIn', found: ['EV and battery groups (3)'], adds: ['EVs', 'Auto industry'] },
]

function ReaderOnboarding() {
  const { feed, index, setProfile, profile, skipOnboarding } = useStore()
  const [step, setStep] = useState<Step>('intent')
  const [intents, setIntents] = useState<string[]>([])
  const [w, setW] = useState<Record<string, number>>(profile?.weights || {})
  const [pairs, setPairs] = useState<Record<string, 0 | 1>>({})
  const [words, setWords] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [connected, setConnected] = useState<string[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [when, setWhen] = useState('Morning')
  const [length, setLength] = useState('10 minutes')
  const [report, setReport] = useState<'weekly' | 'monthly' | 'none'>('weekly')
  const [name, setName] = useState(profile?.name || '')
  const [city, setCity] = useState(profile?.city || 'Pune')
  const end = useRef<HTMLDivElement>(null)

  const steps: Step[] = ['intent', 'deeper', 'thisthat', 'words', 'connect', 'rhythm', 'account']
  const at = steps.indexOf(step)
  useEffect(() => { if (at > 0) end.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'end' }) }, [step, Object.keys(pairs).length, connected.length])

  const bump = (ks: string[], by = 1) => setW((x) => { const n = { ...x }; for (const k of ks) n[k] = Math.max(0, (n[k] || 0) + by); return n })
  const keywords = useMemo(() => Object.entries(w).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k]) => k), [w])
  const maxW = Math.max(1, ...Object.values(w))
  const cats = [...new Set(INTENTS.filter((i) => intents.includes(i.id)).flatMap((i) => i.cats))].slice(0, 3)

  const preview = useMemo(() => {
    const items = feed.map((x) => ({ ...x, keywords: x.meta.keywords, likes: x.meta.likes }))
    return rankForUser(items, keywords.slice(0, 8), {}).filter((r) => r.why).slice(0, 4)
  }, [feed, keywords.join()])

  const suggestions = useMemo(() => {
    const t = words.trim()
    if (t.length < 4) return []
    const direct = guessKeywords(t)
    const fromDocs = index.search(t, 4).flatMap((r) => r.doc.keywords).filter((k) => !direct.includes(k))
    return [...new Set([...direct, ...fromDocs])].slice(0, 6)
  }, [words, index])

  const connect = (id: string) => {
    if (connected.includes(id)) return
    setConnecting(id)
    setTimeout(() => { setConnecting(null); setConnected((c) => [...c, id]); bump(SOCIALS.find((s) => s.id === id)!.adds, 1.5) }, 1100)
  }

  const finish = () => {
    const p: Profile = {
      role: 'reader', name: name.trim(), handle: '@' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, ''), city: city.trim(),
      keywords: keywords.slice(0, 10), weights: w, rhythm: { when, length }, socials: connected,
      depth: pairs.depth === 1 ? 'deep' : 'brief', premium: report !== 'none', reportFreq: report === 'none' ? undefined : report,
      createdAt: profile?.createdAt || new Date().toISOString(),
    }
    setProfile(p)
    go('/?welcome=1')
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar onSkip={() => { skipOnboarding(); go('/') }} right={
        <div className="hidden sm:flex items-center gap-3 ml-6">
          <div className="w-40 h-1.5 rounded-full bg-line overflow-hidden"><div className="h-full bg-ink transition-all duration-500" style={{ width: `${((at + 1) / steps.length) * 100}%` }} /></div>
          <span className="text-[13px] text-muted">Question {at + 1} of {steps.length}</span>
        </div>
      } />
      <main className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10">
        <div className="flex flex-col gap-5 pb-24">
          <Bubble>Hi! A few quick questions so your home page fits you. There are no wrong answers, and you can change everything later.</Bubble>
          <Bubble>What brings you to Twofold? Pick as many as you like.</Bubble>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((i, k) => (
              <Choice key={i.id} delay={k * 40} on={intents.includes(i.id)} onClick={() => {
                const on = intents.includes(i.id)
                setIntents((x) => (on ? x.filter((y) => y !== i.id) : [...x, i.id]))
                bump(i.seed, on ? -1 : 1)
              }}>{i.label}</Choice>
            ))}
          </div>
          {step === 'intent' && <Next disabled={!intents.length} onClick={() => setStep('deeper')} label={intents.length ? 'That’s me' : 'Pick at least one'} />}

          {at >= 1 && (
            <>
              {cats.map((c, ci) => (
                <div key={c} className="flex flex-col gap-3">
                  <Bubble>{ci === 0 ? 'Nice. ' : ''}Within {c.toLowerCase()}, what pulls you in?</Bubble>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_LIST.find((x) => x.id === c)!.keywords.map((k, ki) => (
                      <Choice key={k} delay={ki * 35} on={(w[k] || 0) >= 1} onClick={() => bump([k], (w[k] || 0) >= 1 ? -(w[k] || 0) : 1)}>{k}</Choice>
                    ))}
                  </div>
                </div>
              ))}
              {step === 'deeper' && <Next onClick={() => setStep('thisthat')} label="Next" />}
            </>
          )}

          {at >= 2 && (
            <>
              <Bubble>Quick, one or the other. Go with your gut.</Bubble>
              {PAIRS.filter((_, i) => i <= Object.keys(pairs).length).map((pr) => (
                <div key={pr.id} className="pop-in">
                  <p className="text-[14px] font-semibold text-ink-2 mb-2">{pr.q}</p>
                  <div className="grid sm:grid-cols-2 gap-2 max-w-[620px]">
                    {pr.a.map((label, i) => (
                      <button key={label} aria-pressed={pairs[pr.id] === i} onClick={() => {
                        const prev = pairs[pr.id]
                        if (prev !== undefined) bump(pr.adds[prev], -1)
                        setPairs((x) => ({ ...x, [pr.id]: i as 0 | 1 }))
                        bump(pr.adds[i], 1)
                      }} className={cx('rounded-[14px] border p-4 text-left text-[15.5px] font-medium cursor-pointer transition-all', pairs[pr.id] === i ? 'border-ink ring-1 ring-ink bg-paper' : pairs[pr.id] !== undefined ? 'border-line opacity-60' : 'border-line hover:border-ink')}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {step === 'thisthat' && Object.keys(pairs).length >= PAIRS.length && <Next onClick={() => setStep('words')} label="Next" />}
            </>
          )}

          {at >= 3 && (
            <>
              <Bubble>Anything specific on your mind? Tell us in your own words, the way you’d tell a friend.</Bubble>
              <label className="block max-w-[620px]">
                <span className="sr-only">In your own words</span>
                <textarea value={words} onChange={(e) => setWords(e.target.value)} rows={2} placeholder="e.g. Can India still qualify? And should my next car be an EV?"
                  className="w-full rounded-[14px] border border-line p-3 text-[15.5px] outline-none focus:border-ink" />
              </label>
              {suggestions.length > 0 && (
                <div className="pop-in">
                  <p className="text-[14px] text-ink-2 mb-2">We picked up these. Tap to add them:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((k, i) => (
                      <Choice key={k} delay={i * 40} on={picked.includes(k)} onClick={() => {
                        const on = picked.includes(k)
                        setPicked((x) => (on ? x.filter((y) => y !== k) : [...x, k]))
                        bump([k], on ? -1.2 : 1.2)
                      }}>{k}</Choice>
                    ))}
                  </div>
                </div>
              )}
              {step === 'words' && <Next onClick={() => setStep('connect')} label={words.trim() ? 'Next' : 'Skip this'} />}
            </>
          )}

          {at >= 4 && (
            <>
              <Bubble>Want us to learn from accounts you already follow? We only look at who you follow, never your messages, and you can disconnect any time.</Bubble>
              <div className="grid sm:grid-cols-2 gap-2 max-w-[620px]">
                {SOCIALS.map((s) => {
                  const on = connected.includes(s.id)
                  return (
                    <div key={s.id} className={cx('rounded-[14px] border p-3', on ? 'border-good bg-good-wash/50' : 'border-line')}>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-[8px] bg-ink text-white grid place-items-center text-[13px] font-semibold">{s.label[0]}</span>
                        <span className="text-[15px] font-semibold">{s.label}</span>
                        <button onClick={() => connect(s.id)} disabled={on || connecting === s.id} className={cx('ml-auto h-8 px-3 rounded-[8px] text-[13px] font-medium cursor-pointer', on ? 'text-good' : 'border border-line hover:border-ink')}>
                          {on ? 'Connected' : connecting === s.id ? 'Reading…' : 'Connect'}
                        </button>
                      </div>
                      {on && <p className="pop-in text-[13px] text-ink-2 mt-2">Found {s.found.join(', ')}. Added {s.adds.join(', ')}.</p>}
                    </div>
                  )
                })}
              </div>
              <p className="text-[12.5px] text-muted">Prototype: connections are simulated. No real account is accessed.</p>
              {step === 'connect' && <Next onClick={() => setStep('rhythm')} label={connected.length ? 'Next' : 'Skip this'} />}
            </>
          )}

          {at >= 5 && (
            <>
              <Bubble>When do you usually read, and for how long?</Bubble>
              <div className="flex flex-wrap gap-2">{['Morning', 'On the commute', 'Lunch break', 'Late night'].map((x) => <Choice key={x} on={when === x} onClick={() => setWhen(x)}>{x}</Choice>)}</div>
              <div className="flex flex-wrap gap-2">{['2 minutes', '10 minutes', '30 minutes or more'].map((x) => <Choice key={x} on={length === x} onClick={() => setLength(x)}>{x}</Choice>)}</div>
              <Bubble>Premium readers get a reading report by email: time spent, what mattered most, and what they missed. How often?</Bubble>
              <div className="flex flex-wrap gap-2">
                <Choice on={report === 'weekly'} onClick={() => setReport('weekly')}>Every week</Choice>
                <Choice on={report === 'monthly'} onClick={() => setReport('monthly')}>Once a month</Choice>
                <Choice on={report === 'none'} onClick={() => setReport('none')}>No report</Choice>
              </div>
              {step === 'rhythm' && <Next onClick={() => setStep('account')} label="Next" />}
            </>
          )}

          {at >= 6 && (
            <form className="pop-in rounded-[16px] border border-line p-5 max-w-[620px]" onSubmit={(e) => { e.preventDefault(); if (name.trim()) finish() }}>
              <h2 className="font-serif text-[26px] font-medium">Last step: what should we call you?</h2>
              <p className="text-[14px] text-ink-2 mt-1">Your reader account stays in this browser. There’s no password in the prototype.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <label className="block"><span className="text-[14px] font-semibold">Your name</span>
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Asha Kulkarni" className="mt-1.5 h-11 w-full rounded-[10px] border border-line px-3 text-[16px]" /></label>
                <label className="block"><span className="text-[14px] font-semibold">City</span>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5 h-11 w-full rounded-[10px] border border-line px-3 text-[16px]" /></label>
              </div>
              <Button type="submit" variant="primary" className="mt-5" disabled={!name.trim()}>{name.trim() ? 'Create account and see my feed' : 'Enter your name to finish'}</Button>
            </form>
          )}
          <div ref={end} />
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="rounded-[16px] border border-line p-5 bg-paper/40">
            <h2 className="text-[15px] font-semibold">Your profile is forming</h2>
            {keywords.length === 0 ? <p className="text-[14px] text-muted mt-2">Answer a question to see it take shape.</p> : (
              <ul className="mt-3 space-y-2" aria-label="Interests by strength">
                {keywords.slice(0, 7).map((k) => (
                  <li key={k} className="grid grid-cols-[120px_1fr] items-center gap-2 text-[13.5px]">
                    <span className="truncate">{k}</span>
                    <span className="h-2 rounded-full bg-line overflow-hidden"><span className="block h-full bg-ink rounded-full transition-all duration-500" style={{ width: `${(w[k] / maxW) * 100}%` }} /></span>
                  </li>
                ))}
              </ul>
            )}
            {(Object.keys(pairs).length > 0 || connected.length > 0) && (
              <p className="text-[13px] text-ink-2 mt-3">
                {pairs.depth !== undefined && (pairs.depth ? 'Prefers depth. ' : 'Prefers quick briefs. ')}
                {pairs.scope !== undefined && (pairs.scope ? 'India and the world. ' : 'India first. ')}
                {connected.length > 0 && `${connected.length} account${connected.length > 1 ? 's' : ''} connected.`}
              </p>
            )}
            {preview.length > 0 && (
              <>
                <h3 className="text-[13.5px] font-semibold mt-4 pt-4 border-t border-line">Your home page so far</h3>
                <ul className="mt-2 space-y-2">
                  {preview.map(({ item, why }) => (
                    <li key={item.id} className="pop-in rounded-[10px] bg-surface border border-line-2 p-2 flex gap-2.5">
                      <Photo src={item.meta.image.url} alt="" ratio="1/1" className="w-14 shrink-0 rounded-[7px]" showCredit={false} />
                      <span className="min-w-0"><span className="block font-serif text-[14.5px] leading-snug line-clamp-2">{item.title}</span><span className="block text-[11.5px] text-muted mt-0.5 line-clamp-1">{why}</span></span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

function Bubble({ children }: { children: React.ReactNode }) {
  return <p className="pop-in self-start max-w-[560px] rounded-[16px] rounded-tl-[4px] bg-paper px-4 py-3 text-[16.5px] leading-snug">{children}</p>
}

function Choice({ on, onClick, children, delay = 0 }: { on: boolean; onClick: () => void; children: React.ReactNode; delay?: number }) {
  return (
    <button aria-pressed={on} onClick={onClick} style={{ animationDelay: `${delay}ms` }}
      className={cx('pop-in h-10 px-4 rounded-full border text-[15px] font-medium cursor-pointer transition-colors', on ? 'bg-ink border-ink text-white' : 'border-line bg-surface hover:border-ink')}>
      {on ? '✓ ' : ''}{children}
    </button>
  )
}

function Next({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return <div className="pop-in"><Button variant="primary" disabled={disabled} onClick={onClick}>{label}</Button></div>
}
