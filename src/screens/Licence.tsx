import { useEffect, useMemo, useRef, useState } from 'react'
import { PERMISSION_LABEL, PRESETS, USE_META, inr, summarise, toMachineJson, type Permission, type UseKey, type UseTerms } from '../engine/licence'
import { shortHash } from '../engine/seal'
import { useStore, type Work } from '../store'
import { Badge, Button, Icon, JsonView, Segmented, cx, go } from '../ui/kit'


export default function LicenceBuilder() {
  const { licence, setLicence, applyPreset, valuation: v, draft, me, publish, promote } = useStore()
  const [promo, setPromo] = useState<{ on: boolean; perDay: number; days: number }>({ on: false, perDay: 100, days: 7 })
  const audience: 'people' | 'ai' | 'both' = licence.uses.ai_quote.permission === 'no' && licence.uses.ai_train.permission === 'no' ? 'people' : licence.uses.read.permission === 'ask' ? 'ai' : 'both'
  const setAudience = (a: 'people' | 'ai' | 'both') => {
    if (a === 'both') return applyPreset('paid_both')
    const u = { ...licence.uses }
    if (a === 'people') { u.ai_quote = { ...u.ai_quote, permission: 'no' }; u.ai_train = { ...u.ai_train, permission: 'no' }; if (u.read.permission === 'ask') u.read = { ...u.read, permission: 'paid', price: v.prices.read } }
    else { u.read = { ...u.read, permission: 'ask' }; u.ai_quote = { ...u.ai_quote, permission: 'paid', price: v.prices.quote }; u.ai_train = { ...u.ai_train, permission: 'paid', price: v.prices.train } }
    setLicence({ ...licence, presetId: 'custom', uses: u })
  }
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState<Work | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (done) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startedAt, done])

  const first = me.name.split(' ')[0]
  const summary = summarise(licence, first)
  const json = useMemo(
    () => toMachineJson(licence, { id: 'tf_draft', title: draft.title, creator: { id: me.id, name: me.name, url: `${location.origin}/#/@${me.id}` }, disclosure: { origin: draft.disclosure, aiAssistance: draft.aiUses } }, location.origin),
    [licence, draft, me],
  )

  const setUse = (k: UseKey, patch: Partial<UseTerms>) => setLicence({ ...licence, presetId: 'custom', uses: { ...licence.uses, [k]: { ...licence.uses[k], ...patch } } })

  const onPublish = async () => {
    setBusy(true)
    const w = await publish()
    if (promo.on) promote(w.id, promo.perDay, promo.days)
    setBusy(false)
    setDone(w)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-[13.5px] text-muted">Licence for</p>
          <h1 className="font-serif text-[24px] md:text-[28px] leading-tight font-medium max-w-[760px]">{draft.title || 'Untitled piece'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-muted num" aria-live="off">Set up in {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
          <Button variant="ghost" size="sm" onClick={() => applyPreset(licence.presetId === 'custom' ? 'paid_both' : licence.presetId)}>Reset to suggested</Button>
        </div>
      </div>

      <section aria-label="Who is this piece for" className="panel p-4 mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px]">
          <h2 className="text-[15px] font-semibold">Who is this piece for?</h2>
          <p className="text-[13px] text-muted">One switch sets sensible terms. Fine-tune each use below.</p>
        </div>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Audience">
          {([['people', 'For people', 'Readers only. AI may not quote or train.'], ['ai', 'For AI', 'Licensed to AI systems. People ask first.'], ['both', 'For both', 'Readers pay per read, AI pays per use.']] as const).map(([k, t, d]) => (
            <button key={k} role="radio" aria-checked={audience === k} onClick={() => setAudience(k)} className={cx('rounded-[12px] border p-3 text-left w-[170px] cursor-pointer', audience === k ? 'border-ink ring-1 ring-ink bg-paper' : 'border-line hover:border-faint')}>
              <span className="flex items-center gap-1.5 text-[14.5px] font-semibold">{k !== 'ai' && <Icon.person className="text-human" />}{k !== 'people' && <Icon.machine className="text-machine" />}{t}</span>
              <span className="block text-[12px] text-muted mt-1 leading-snug">{d}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Start from a preset" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {PRESETS.map((p) => {
          const on = licence.presetId === p.id
          return (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              aria-pressed={on}
              className={cx('text-left rounded-[12px] border p-4 transition-colors cursor-pointer flex flex-col items-stretch justify-start', on ? 'border-ink bg-surface shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line bg-surface/60 hover:bg-surface')}
            >
              <span className="flex items-center gap-2">
                <span className={cx('w-4 h-4 rounded-full border-2 grid place-items-center', on ? 'border-ink' : 'border-faint')}>{on && <span className="w-2 h-2 rounded-full bg-ink" />}</span>
                <span className="font-semibold text-[14.5px]">{p.name}</span>
              </span>
              <span className="block text-[13px] text-ink-2 mt-1.5 pl-6">{p.tagline}</span>
              {p.id === 'paid_both' && draft.kind === 'article' && <span className="block pl-6 mt-2"><Badge tone="good">Suggested for news</Badge></span>}
              {p.id === 'no_training' && draft.kind === 'dataset' && <span className="block pl-6 mt-2"><Badge tone="wait">Most datasets sell training</Badge></span>}
            </button>
          )
        })}
      </section>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_460px] gap-6 items-start">
        <div className="flex flex-col gap-4">
        {([['For people', 'human', ['read', 'republish']], ['For AI', 'machine', ['ai_quote', 'ai_train']]] as const).map(([t, tone, keys]) => (
        <section key={t} aria-label={t} className="panel divide-y divide-line-2">
          <h2 className={cx('px-5 py-3 text-[14px] font-semibold flex items-center gap-2', tone === 'human' ? 'text-human-ink' : 'text-machine-ink')}>{tone === 'human' ? <Icon.person /> : <Icon.machine />}{t}</h2>
          {(keys as readonly UseKey[]).map((k) => (
            <UseRow key={k} k={k} terms={licence.uses[k]} suggested={k === 'read' ? v.prices.read : k === 'ai_quote' ? v.prices.quote : k === 'ai_train' ? v.prices.train : v.prices.republish} onChange={(p) => setUse(k, p)} licencePreview={licence.previewWords} setPreview={(n) => setLicence({ ...licence, presetId: 'custom', previewWords: n })} />
          ))}
        </section>
        ))}
        <section aria-label="Promote" className="panel p-5">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold">Promote this piece</h2>
              <p className="text-[13px] text-muted mt-0.5">Show it higher on readers’ home pages, labelled “Promoted”. Only to readers who follow its topics.</p>
            </div>
            <button role="switch" aria-checked={promo.on} aria-label="Promote this piece" onClick={() => setPromo({ ...promo, on: !promo.on })} className={cx('w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0', promo.on ? 'bg-good' : 'bg-line')}><span className={cx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', promo.on ? 'left-[22px]' : 'left-0.5')} /></button>
          </div>
          {promo.on && (
            <div className="pop-in mt-4 grid sm:grid-cols-2 gap-4">
              <fieldset><legend className="text-[13px] font-semibold">Budget per day</legend>
                <div className="flex gap-1.5 mt-1.5">{[50, 100, 250].map((x) => <button key={x} aria-pressed={promo.perDay === x} onClick={() => setPromo({ ...promo, perDay: x })} className={cx('h-8 px-3 rounded-full border text-[13px] cursor-pointer', promo.perDay === x ? 'bg-ink text-white border-ink' : 'border-line')}>{inr(x)}</button>)}</div></fieldset>
              <fieldset><legend className="text-[13px] font-semibold">For</legend>
                <div className="flex gap-1.5 mt-1.5">{[3, 7, 14].map((x) => <button key={x} aria-pressed={promo.days === x} onClick={() => setPromo({ ...promo, days: x })} className={cx('h-8 px-3 rounded-full border text-[13px] cursor-pointer', promo.days === x ? 'bg-ink text-white border-ink' : 'border-line')}>{x} days</button>)}</div></fieldset>
              <p className="sm:col-span-2 text-[14px] rounded-[10px] bg-paper p-3">Total {inr(promo.perDay * promo.days)}, taken from your earnings. Estimated {Math.round(promo.perDay * promo.days / 2.4).toLocaleString('en-IN')}–{Math.round(promo.perDay * promo.days / 1.4).toLocaleString('en-IN')} extra readers. At your price, that’s about {inr(Math.round(promo.perDay * promo.days / 1.9 * 0.12 * v.prices.read))} back from reads alone.</p>
            </div>
          )}
        </section>
          {licence.exclusiveHours > 0 && (
            <div className="px-5 py-3 text-[13.5px] text-ink-2 bg-human-wash/50 rounded-[14px]">
              Exclusive window: {inr(licence.uses.read.price)} for the first {licence.exclusiveHours} hours, then {inr(licence.afterWindowReadPrice || 0)}.
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-[88px]">
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-2"><Icon.person className="text-human" /><h2 className="text-[14.5px] font-semibold">What people will read</h2></div>
            <p className="font-serif text-[17.5px] leading-[1.55] text-ink">{summary}</p>
          </div>
          <div className="panel p-5 bg-[#f7f8fc]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2"><Icon.machine className="text-machine" /><h2 className="text-[14.5px] font-semibold">What AI systems will read</h2></div>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(json, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
                <Icon.copy /> {copied ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>
            <p className="text-[12.5px] text-muted mb-3">Served at <span className="machine text-[12px]">/api/licence/&lt;id&gt;</span>, linked from the page and robots.txt, and returned by the MCP server.</p>
            <div className="max-h-[360px] overflow-auto rounded-[10px] border border-line bg-surface p-3">
              <JsonView value={json} />
            </div>
          </div>
          <Button variant="primary" className="h-12 text-[15px]" onClick={onPublish} disabled={busy || !draft.body.trim()}>
            {busy ? 'Sealing…' : 'Publish and seal'}
          </Button>
          <p className="text-[12.5px] text-muted -mt-2">Publishing fingerprints the exact text and signs it with your key. Change one comma later and the seal shows it.</p>
        </aside>
      </div>

      {done && <PublishedDialog work={done} onClose={() => setDone(null)} />}
    </div>
  )
}

function UseRow({ k, terms, suggested, onChange, licencePreview, setPreview }: { k: UseKey; terms: UseTerms; suggested: number; onChange: (p: Partial<UseTerms>) => void; licencePreview: number; setPreview: (n: number) => void }) {
  const meta = USE_META[k]
  const isAi = meta.who === 'ai'
  const perms: Permission[] = ['free', 'paid', 'ask', 'no']
  const why: Record<UseKey, string> = {
    read: 'Based on originality, depth and how many people are looking for this today.',
    ai_quote: 'About 12% of a read: one AI answer covers a slice of what a reader gets, but it happens far more often, and carries your name.',
    ai_train: 'A multiple of what AI answers would pay over a year, less for work that ages fast. One-time and permanent, so it defaults to Ask me.',
    republish: 'About 60 reads’ worth: a republisher brings your piece to its own audience.',
  }
  return (
    <div className="p-5 grid md:grid-cols-[minmax(0,1fr)_auto] gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cx('w-6 h-6 rounded-full grid place-items-center', isAi ? 'bg-machine-wash text-machine' : 'bg-human-wash text-human-ink')}>{isAi ? <Icon.machine /> : <Icon.person />}</span>
          <h3 className="font-semibold text-[15px]">{meta.label}</h3>
        </div>
        <p className="text-[13.5px] text-ink-2 mt-1 pl-8">{meta.blurb}</p>
        <div className="pl-8 mt-3 flex flex-wrap gap-2">
          {k === 'read' && terms.permission !== 'no' && (
            <>
              <Chip on={licencePreview > 0} onClick={() => setPreview(licencePreview ? 0 : 80)}>Free preview: first {licencePreview || 80} words</Chip>
              <Chip on={!!terms.includedInPass} onClick={() => onChange({ includedInPass: !terms.includedInPass })}>Included in Twofold Pass</Chip>
            </>
          )}
          {k === 'ai_quote' && terms.permission !== 'no' && (
            <>
              <Chip on locked>Must name you</Chip>
              <Chip on={!!terms.linkBack} onClick={() => onChange({ linkBack: !terms.linkBack })}>Must link back</Chip>
              <label className="h-7 pl-2.5 pr-1 rounded-full border border-line text-[12.5px] text-ink-2 flex items-center gap-1">
                Quote up to
                <select aria-label="Maximum quoted words" value={terms.maxQuoteWords} onChange={(e) => onChange({ maxQuoteWords: Number(e.target.value) })} className="bg-transparent font-medium text-ink cursor-pointer">
                  {[25, 40, 80].map((n) => <option key={n} value={n}>{n} words</option>)}
                </select>
              </label>
            </>
          )}
          {k === 'ai_train' && (
            <span className="text-[12.5px] text-muted flex items-center gap-1.5"><Icon.warn className="text-human" /> Once a model learns from it, that can’t be undone and the model won’t credit you.</span>
          )}
          {k === 'republish' && terms.permission !== 'no' && terms.derivatives && (
            <>
              {(['translation', 'summary', 'clip'] as const).map((d) => (
                <Chip key={d} on={terms.derivatives![d]} onClick={() => onChange({ derivatives: { ...terms.derivatives!, [d]: !terms.derivatives![d] } })}>
                  {d === 'translation' ? 'Translations' : d === 'summary' ? 'Summaries' : 'Video clips'}
                </Chip>
              ))}
              <label className="h-7 pl-2.5 pr-2 rounded-full border border-line text-[12.5px] text-ink-2 flex items-center gap-2">
                They pay back
                <input type="range" min={10} max={40} step={5} value={Math.round((terms.royaltyShare || 0.3) * 100)} onChange={(e) => onChange({ royaltyShare: Number(e.target.value) / 100 })} aria-label="Royalty share" className="w-20 accent-[#191c36]" />
                <span className="num font-medium text-ink w-8">{Math.round((terms.royaltyShare || 0.3) * 100)}%</span>
              </label>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-start md:items-end gap-2 pl-8 md:pl-0">
        <Segmented<Permission>
          size="sm"
          label={`${meta.label}: permission`}
          value={terms.permission}
          onChange={(p) => onChange({ permission: p, price: p === 'free' ? 0 : terms.price || suggested })}
          options={perms.map((p) => ({ value: p, label: PERMISSION_LABEL[p], tone: p === 'no' ? 'text-bad' : undefined }))}
        />
        {(terms.permission === 'paid' || terms.permission === 'ask') && (
          <div className="flex items-center gap-2">
            <label className="flex items-center h-9 rounded-[9px] border border-line bg-surface px-2.5 focus-within:border-machine">
              <span className="text-muted text-[14px]">₹</span>
              <input
                type="number"
                min={0}
                step={k === 'ai_quote' ? 0.1 : 1}
                value={terms.price}
                onChange={(e) => onChange({ price: Number(e.target.value) })}
                aria-label={`${meta.label}: price in rupees`}
                className="w-20 bg-transparent outline-none num text-[14.5px] font-medium px-1"
              />
              <span className="text-[12.5px] text-muted whitespace-nowrap">{meta.unit}</span>
            </label>
          </div>
        )}
        {terms.permission !== 'free' && terms.permission !== 'no' && (
          <p className="text-[12px] text-muted max-w-[300px] md:text-right" title={why[k]}>
            Suggested {inr(suggested, { decimals: k === 'ai_quote' })}
            {terms.price !== suggested && terms.price > 0 && <button className="ml-1 underline cursor-pointer" onClick={() => onChange({ price: suggested })}>use it</button>}
            <span className="block">{why[k]}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function Chip({ on, onClick, children, locked }: { on: boolean; onClick?: () => void; children: React.ReactNode; locked?: boolean }) {
  return (
    <button
      aria-pressed={on}
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={cx('h-7 px-2.5 rounded-full text-[12.5px] border flex items-center gap-1 cursor-pointer disabled:cursor-default', on ? 'bg-ink text-white border-ink' : 'border-line text-ink-2 hover:border-faint')}
    >
      {on && <span aria-hidden>✓</span>}
      {children}
    </button>
  )
}

function PublishedDialog({ work, onClose }: { work: Work; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 grid place-items-center p-4" role="dialog" aria-modal aria-labelledby="pub-title" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div ref={ref} tabIndex={-1} className="panel w-full max-w-[520px] p-6 outline-none">
        <div className="flex items-start gap-4">
          <span className="seal-in text-good shrink-0"><Icon.seal className="w-12 h-12" /></span>
          <div>
            <h2 id="pub-title" className="text-[20px] font-semibold">Published and sealed</h2>
            <p className="text-[14px] text-ink-2 mt-1">It’s live on the reader home page now, and AI agents can find it through the MCP server.</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13.5px]">
          <dt className="text-muted">Fingerprint</dt><dd className="machine text-[12.5px]">{shortHash(work.seal?.contentHash)}</dd>
          <dt className="text-muted">Signed by</dt><dd>Riya Deshpande, {new Date(work.publishedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</dd>
          <dt className="text-muted">Made</dt><dd>{work.disclosure === 'human' ? 'Human-made' : work.disclosure === 'ai_assisted' ? `Human-made, AI-assisted (${work.aiUses.join(', ')})` : 'AI-generated'}</dd>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => go(`/work/${work.id}`)}>Open the public page</Button>
          <Button variant="secondary" onClick={() => go('/')}>See it on the home feed</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
