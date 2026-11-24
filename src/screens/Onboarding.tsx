import { useMemo, useState } from 'react'
import { CATEGORY_LIST, PHOTOS, type Category } from '../data/v2'
import { rankForUser } from '../engine/similarity'
import { useStore, type Profile } from '../store'
import { Button, Logo, Photo, cx, go } from '../ui/kit'

type Step = 'role' | 'interests' | 'craft' | 'account'

export default function Onboarding() {
  const { feed, setProfile, skipOnboarding } = useStore()
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<Profile['role'] | null>(null)
  const [tab, setTab] = useState<Category>('Sports')
  const [keywords, setKeywords] = useState<string[]>([])
  const [makes, setMakes] = useState('Articles')
  const [beat, setBeat] = useState('')
  const [aiTraining, setAiTraining] = useState<'ask' | 'no' | 'paid'>('ask')
  const [name, setName] = useState('')
  const [city, setCity] = useState('Pune')

  const steps: Step[] = role === 'creator' ? ['role', 'interests', 'craft', 'account'] : ['role', 'interests', 'account']
  const at = steps.indexOf(step)

  const toggle = (k: string) => setKeywords((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]))
  const picked = (c: Category) => CATEGORY_LIST.find((x) => x.id === c)!.keywords.filter((k) => keywords.includes(k)).length

  const preview = useMemo(() => {
    const items = feed.map((w) => ({ ...w, keywords: w.meta.keywords, likes: w.meta.likes }))
    return rankForUser(items, keywords, {}).filter((r) => r.why).slice(0, 4)
  }, [feed, keywords])

  const handle = '@' + (name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'you')

  const finish = () => {
    const p: Profile = {
      role: role!, name: name.trim(), handle, city: city.trim(), keywords,
      makes: role === 'creator' ? `${beat.trim() || 'Independent'} ${makes.toLowerCase() === 'articles' ? 'writer' : makes.toLowerCase() === 'videos' ? 'video creator' : 'data publisher'}` : undefined,
      aiTraining: role === 'creator' ? aiTraining : undefined,
      createdAt: new Date().toISOString(),
    }
    setProfile(p)
    go(role === 'creator' ? '/studio/hub?tour=1' : '/?welcome=1')
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="h-16 border-b border-line">
        <div className="mx-auto max-w-[1200px] h-full px-4 md:px-6 flex items-center gap-4">
          <Logo />
          <ol className="hidden sm:flex items-center gap-2 ml-6 text-[13px]" aria-label="Progress">
            {steps.map((s, i) => (
              <li key={s} className={cx('flex items-center gap-2', i <= at ? 'text-ink' : 'text-faint')}>
                <span className={cx('w-6 h-6 rounded-full grid place-items-center text-[12px] font-semibold', i < at ? 'bg-ink text-white' : i === at ? 'border-2 border-ink' : 'border border-line')}>{i + 1}</span>
                <span className="font-medium">{LABEL[s]}</span>
                {i < steps.length - 1 && <span className="w-6 h-px bg-line" />}
              </li>
            ))}
          </ol>
          <button onClick={() => { skipOnboarding(); go('/') }} className="ml-auto text-[14px] text-muted hover:text-ink underline underline-offset-4 cursor-pointer">Skip, just browse</button>
        </div>
      </header>

      {step === 'role' && (
        <main className="mx-auto max-w-[1100px] px-4 md:px-6 py-10 md:py-14">
          <h1 className="font-serif text-[36px] md:text-[52px] leading-[1.04] font-medium tracking-[-0.015em] max-w-[18ch]">Original reporting, paid for fairly, by people and by AI.</h1>
          <p className="text-[17px] text-ink-2 mt-4 max-w-[58ch]">Tell us how you’ll use Twofold. We’ll shape your home page around what you care about. It takes under a minute.</p>
          <div className="grid md:grid-cols-2 gap-5 mt-10">
            <RoleCard
              photo={PHOTOS.hero1} title="I’m here to read" on={role === 'reader'}
              points={['A feed built from topics you pick', 'Like, save and discuss stories', 'Ask a question, get related and indirect stories']}
              onClick={() => { setRole('reader'); setStep('interests') }}
            />
            <RoleCard
              photo={PHOTOS.creator} title="I write, film or publish data" on={role === 'creator'}
              points={['See what your piece is worth before you publish', 'Set separate prices for readers and AI', 'Get paid each time an AI quotes you']}
              onClick={() => { setRole('creator'); setStep('interests') }}
            />
          </div>
        </main>
      )}

      {step === 'interests' && (
        <main className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10">
          <div>
            <h1 className="font-serif text-[32px] md:text-[40px] leading-[1.08] font-medium">{role === 'creator' ? 'What do you cover, and what do you follow?' : 'What do you want to keep up with?'}</h1>
            <p className="text-[16px] text-ink-2 mt-2">Pick at least three. You can change these any time.</p>
            <div role="tablist" aria-label="Categories" className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6">
              {CATEGORY_LIST.map((c) => (
                <button key={c.id} role="tab" aria-selected={tab === c.id} onClick={() => setTab(c.id)}
                  className={cx('flex flex-col rounded-[12px] border text-left overflow-hidden cursor-pointer transition-colors', tab === c.id ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-faint')}>
                  <Photo src={PHOTOS.category[c.id].url} alt="" ratio="16/10" showCredit={false} className="w-full" />
                  <span className="block px-2.5 py-2">
                    <span className="flex items-center justify-between gap-1 text-[14.5px] font-semibold">{c.id}{picked(c.id) > 0 && <span className="text-[11.5px] rounded-full bg-ink text-white px-1.5 min-w-[18px] text-center">{picked(c.id)}</span>}</span>
                    <span className="block text-[12px] text-muted leading-snug">{c.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={`${tab} topics`}>
              {CATEGORY_LIST.find((c) => c.id === tab)!.keywords.map((k) => {
                const on = keywords.includes(k)
                return (
                  <button key={k} aria-pressed={on} onClick={() => toggle(k)}
                    className={cx('h-10 px-4 rounded-full border text-[15px] font-medium cursor-pointer transition-colors', on ? 'bg-ink border-ink text-white' : 'border-line hover:border-ink')}>
                    {on ? '✓ ' : '+ '}{k}
                  </button>
                )
              })}
            </div>
            {keywords.length > 0 && (
              <p className="mt-6 text-[14px] text-ink-2">Following: {keywords.join(', ')}</p>
            )}
            <div className="mt-8 flex gap-3">
              <Button onClick={() => setStep('role')}>Back</Button>
              <Button variant="primary" disabled={keywords.length < 3} onClick={() => setStep(role === 'creator' ? 'craft' : 'account')}>
                {keywords.length < 3 ? `Pick ${3 - keywords.length} more` : 'Continue'}
              </Button>
            </div>
          </div>
          <aside className="lg:sticky lg:top-6 self-start">
            <div className="rounded-[14px] border border-line p-4 bg-paper/50">
              <h2 className="text-[14px] font-semibold">Your home page so far</h2>
              {preview.length === 0 ? (
                <p className="text-[14px] text-muted mt-3">Pick a topic to see stories appear here.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {preview.map(({ item, why }) => (
                    <li key={item.id} className="arrive rounded-[10px] bg-surface border border-line-2 p-2.5 flex gap-3">
                      <Photo src={item.meta.image.url} alt="" ratio="1/1" className="w-16 shrink-0 rounded-[8px]" showCredit={false} />
                      <span className="min-w-0">
                        <span className="block font-serif text-[15px] leading-snug line-clamp-2">{item.title}</span>
                        <span className="block text-[12px] text-muted mt-1 line-clamp-2">{why}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </main>
      )}

      {step === 'craft' && (
        <main className="mx-auto max-w-[760px] px-4 md:px-6 py-10">
          <h1 className="font-serif text-[32px] md:text-[40px] leading-[1.08] font-medium">Set up your studio</h1>
          <p className="text-[16px] text-ink-2 mt-2">These set sensible starting prices and licence terms. You can change any of it per piece.</p>
          <fieldset className="mt-8">
            <legend className="text-[15px] font-semibold">What do you mostly publish?</legend>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Articles', 'Videos', 'Datasets'].map((m) => (
                <button key={m} aria-pressed={makes === m} onClick={() => setMakes(m)} className={cx('h-10 px-4 rounded-full border text-[15px] font-medium cursor-pointer', makes === m ? 'bg-ink border-ink text-white' : 'border-line hover:border-ink')}>{m}</button>
              ))}
            </div>
          </fieldset>
          <label className="block mt-7">
            <span className="text-[15px] font-semibold">Your beat</span>
            <span className="block text-[13.5px] text-muted">One or two words, shown on your byline.</span>
            <input value={beat} onChange={(e) => setBeat(e.target.value)} placeholder="e.g. Football, Civic, Markets" className="mt-2 h-11 w-full rounded-[10px] border border-line px-3 text-[16px]" />
          </label>
          <fieldset className="mt-7">
            <legend className="text-[15px] font-semibold">Can AI companies train models on your work?</legend>
            <span className="block text-[13.5px] text-muted">This is the default for new pieces. Quoting in AI answers is always paid.</span>
            <div className="grid sm:grid-cols-3 gap-2 mt-3">
              {([['ask', 'Ask me each time', 'They request, you approve or decline'], ['paid', 'Yes, for a fee', 'Priced from what the piece earns'], ['no', 'No', 'Training is never allowed']] as const).map(([v, t, d]) => (
                <button key={v} aria-pressed={aiTraining === v} onClick={() => setAiTraining(v)} className={cx('rounded-[12px] border p-3 text-left cursor-pointer', aiTraining === v ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-faint')}>
                  <span className="block text-[15px] font-semibold">{t}</span>
                  <span className="block text-[13px] text-muted mt-0.5">{d}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-10 flex gap-3">
            <Button onClick={() => setStep('interests')}>Back</Button>
            <Button variant="primary" onClick={() => setStep('account')}>Continue</Button>
          </div>
        </main>
      )}

      {step === 'account' && (
        <main className="mx-auto max-w-[560px] px-4 md:px-6 py-10">
          <h1 className="font-serif text-[32px] md:text-[40px] leading-[1.08] font-medium">Create your account</h1>
          <p className="text-[15px] text-ink-2 mt-2">This prototype keeps your account in this browser only. There’s no password and nothing leaves your device.</p>
          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); if (name.trim()) finish() }}>
            <label className="block">
              <span className="text-[15px] font-semibold">Your name</span>
              <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atharva Phadtare" className="mt-2 h-11 w-full rounded-[10px] border border-line px-3 text-[16px]" />
              {name.trim() && <span className="block text-[13px] text-muted mt-1.5">Your handle will be {handle}</span>}
            </label>
            <label className="block">
              <span className="text-[15px] font-semibold">City</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 h-11 w-full rounded-[10px] border border-line px-3 text-[16px]" />
            </label>
            <div className="rounded-[12px] bg-paper p-4 text-[14px] text-ink-2">
              <p><strong className="text-ink">{role === 'creator' ? 'Creator' : 'Reader'}</strong> following {keywords.length} topics: {keywords.slice(0, 5).join(', ')}{keywords.length > 5 ? '…' : ''}</p>
              {role === 'creator' && <p className="mt-1">Publishes {makes.toLowerCase()}. AI training: {aiTraining === 'ask' ? 'ask each time' : aiTraining === 'paid' ? 'yes, for a fee' : 'not allowed'}.</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setStep(role === 'creator' ? 'craft' : 'interests')}>Back</Button>
              <Button type="submit" variant="primary" disabled={!name.trim()}>{role === 'creator' ? 'Create account and open studio' : 'Create account and see my feed'}</Button>
            </div>
          </form>
        </main>
      )}
    </div>
  )
}

const LABEL: Record<Step, string> = { role: 'You', interests: 'Interests', craft: 'Studio', account: 'Account' }

function RoleCard({ photo, title, points, on, onClick }: { photo: { url: string; alt: string; credit: string }; title: string; points: string[]; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx('group text-left rounded-[16px] border overflow-hidden cursor-pointer transition-colors bg-surface', on ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-ink')}>
      <Photo src={photo.url} alt={photo.alt} credit={photo.credit} ratio="16/8" />
      <span className="block p-5">
        <span className="block font-serif text-[26px] font-medium leading-tight group-hover:underline underline-offset-4">{title}</span>
        <ul className="mt-3 space-y-1.5 text-[15px] text-ink-2">
          {points.map((p) => <li key={p} className="flex gap-2"><span className="text-good">✓</span>{p}</li>)}
        </ul>
      </span>
    </button>
  )
}
