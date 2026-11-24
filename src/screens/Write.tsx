import { useEffect, useMemo, useRef, useState } from 'react'
import { SAMPLES } from '../data/samples'
import { applyNudges, type SignalKey, type Valuation } from '../engine/valuation'
import { inr } from '../engine/licence'
import { useStore, type Disclosure } from '../store'
import { CATEGORY_LIST, type Category } from '../data/v2'
import { guessCategory } from '../data/meta'
import { Badge, Button, Icon, Meter, Segmented, cx, go, useRoute } from '../ui/kit'
import { importFile } from '../lib/importDoc'

const AI_USES = ['research', 'drafting', 'translation', 'proofreading', 'images']

interface AiReview {
  source: 'gemini' | 'rules'
  model?: string
  summary: string
  strengths: string[]
  risks: string[]
  suggestions: string[]
  nudges: Partial<Record<SignalKey, number>>
  forText: string
  error?: string
}

const FORMATS = [
  { id: 'post', label: 'Post' },
  { id: 'article', label: 'Article' },
  { id: 'video', label: 'Video' },
  { id: 'data', label: 'Data' },
] as const

function kindFor(f: string[]): 'article' | 'video' | 'dataset' {
  if (f.includes('data') && !f.includes('article') && !f.includes('post')) return 'dataset'
  if (f.includes('video') && !f.includes('article')) return 'video'
  return 'article'
}

export default function Write() {
  const { draft, setDraft, loadSample, valuation: rules, me, newDraft, customCategories, addCustomCategory } = useStore()
  const { params } = useRoute()
  useEffect(() => { if (params.get('new') === '1') { newDraft(); setReview(null); go('/studio/write') } }, [params.get('new')])
  const formats = draft.formats || [draft.kind === 'dataset' ? 'data' : draft.kind]
  const setFormats = (f: string[]) => setDraft({ formats: f, kind: kindFor(f) })
  const empty = !draft.title.trim() && !draft.body.trim()
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const onFile = async (f?: File) => {
    if (!f) return
    setImporting(true); setImportErr('')
    try { const d = await importFile(f); setDraft({ title: d.title, dek: d.dek, body: d.body, importedFrom: `${d.name}${d.pages ? `, ${d.pages} pages` : ''}`, sampleId: undefined }); setReview(null) }
    catch (e) { setImportErr(e instanceof Error ? e.message : 'Couldn’t read that file.') }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const [newCat, setNewCat] = useState<string | null>(null)
  const [catCheck, setCatCheck] = useState<{ ok: boolean; reason: string; source?: string; suggest?: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const checkCategory = async () => {
    if (!newCat?.trim()) return
    setChecking(true); setCatCheck(null)
    const r = await fetch('/api/category', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: newCat, title: draft.title, body: `${draft.dek} ${draft.body}` }) }).then((x) => x.json()).catch(() => ({ ok: false, reason: 'Couldn’t reach the checker. Try again.' }))
    setCatCheck(r); setChecking(false)
    if (r.ok) { addCustomCategory(newCat.trim()); setDraft({ customCategory: newCat.trim() }) }
  }
  const [review, setReview] = useState<AiReview | null>(null)
  const [loading, setLoading] = useState(false)
  const textKey = `${draft.title}\n${draft.body}`
  const reviewFresh = review && review.forText === textKey
  const v: Valuation = useMemo(() => (reviewFresh && review ? applyNudges(rules, me, review.nudges) : rules), [rules, review, reviewFresh, me])

  const askAi = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/review', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: draft.title, dek: draft.dek, body: draft.body, kind: draft.kind,
          signals: Object.fromEntries(Object.values(rules.signals).map((s) => [s.key, s.score])),
          estimate: { low: Math.round(rules.low), high: Math.round(rules.high) },
          flags: rules.flags.map((f) => f.text),
        }),
      })
      const j = await r.json()
      setReview({ ...j, forText: textKey })
    } catch (e) {
      setReview({ source: 'rules', summary: 'The AI reviewer could not be reached, so this is the rule-based estimate only.', strengths: [], risks: [], suggestions: [], nudges: {}, forText: textKey, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
      <section aria-label="Editor" className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5" role="group" aria-label="Format, pick one or more">
            <span className="text-[13px] text-muted mr-1">Format</span>
            {FORMATS.map((f) => {
              const on = formats.includes(f.id)
              return <button key={f.id} aria-pressed={on} onClick={() => setFormats(on ? (formats.length > 1 ? formats.filter((x) => x !== f.id) : formats) : [...formats, f.id])} className={cx('h-8 px-3 rounded-full text-[13px] border font-medium cursor-pointer', on ? 'bg-ink text-white border-ink' : 'bg-surface border-line text-ink-2 hover:border-faint')}>{on ? '✓ ' : ''}{f.label}</button>
            })}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            Category
            <select value={newCat !== null ? '__new' : draft.customCategory ? `c:${draft.customCategory}` : draft.category || ''} onChange={(e) => {
              const v = e.target.value
              if (v === '__new') { setNewCat(''); setCatCheck(null); return }
              setNewCat(null)
              if (v.startsWith('c:')) setDraft({ customCategory: v.slice(2) })
              else setDraft({ category: (v || undefined) as Category | undefined, customCategory: undefined })
            }} className="h-8 rounded-[8px] border border-line bg-surface px-2 text-[13.5px] text-ink">
              <option value="">Auto: {guessCategory(`${draft.title} ${draft.dek} ${draft.body}`)}</option>
              {CATEGORY_LIST.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
              {customCategories.map((c) => <option key={c} value={`c:${c}`}>{c} (yours)</option>)}
              <option value="__new">+ New category…</option>
            </select>
          </label>
          <span className="ml-auto flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" className="sr-only" id="imp" onChange={(e) => onFile(e.target.files?.[0])} />
            <label htmlFor="imp" className="h-8 px-3 rounded-[8px] border border-line text-[13px] font-medium grid place-items-center cursor-pointer hover:border-ink">{importing ? 'Reading file…' : 'Import PDF or text'}</label>
            <button onClick={() => { newDraft(); setReview(null) }} className="h-8 px-3 rounded-[8px] border border-line text-[13px] font-medium cursor-pointer hover:border-ink">New post</button>
          </span>
        </div>
        {newCat !== null && (
          <form className="pop-in panel p-4 mb-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); checkCategory() }}>
            <label className="flex-1 min-w-[220px]"><span className="text-[13.5px] font-semibold">Name the new category</span>
              <input autoFocus value={newCat} onChange={(e) => { setNewCat(e.target.value); setCatCheck(null) }} placeholder="e.g. Space, Education, Health policy" className="mt-1 h-10 w-full rounded-[10px] border border-line px-3 text-[15px] outline-none focus:border-ink" /></label>
            <Button size="sm" variant="primary" disabled={checking || newCat.trim().length < 3}>{checking ? 'Checking…' : 'Run AI check'}</Button>
            <Button size="sm" type="button" onClick={() => { setNewCat(null); setCatCheck(null) }}>Cancel</Button>
            <p className="basis-full text-[12.5px] text-muted">The check makes sure the name is allowed, isn’t a duplicate of an existing category, and that your piece is actually about it.</p>
            {catCheck && <p className={cx('basis-full text-[14px] rounded-[10px] p-3', catCheck.ok ? 'bg-good-wash text-good' : 'bg-bad-wash text-bad')}>{catCheck.ok ? `✓ Added “${newCat}”. ` : '✗ Not approved. '}{catCheck.reason}{catCheck.suggest && <button type="button" className="ml-2 underline cursor-pointer" onClick={() => { setDraft({ category: catCheck.suggest as Category, customCategory: undefined }); setNewCat(null) }}>Use {catCheck.suggest}</button>}</p>}
            {catCheck?.ok && <Button size="sm" type="button" onClick={() => setNewCat(null)}>Done</Button>}
          </form>
        )}
        {importErr && <p className="mb-3 text-[14px] text-bad rounded-[10px] bg-bad-wash p-3">{importErr}</p>}
        {draft.importedFrom && !empty && <p className="mb-3 text-[13px] text-muted">Imported from {draft.importedFrom}. Check the headline and standfirst we picked.</p>}
        {empty && (
          <div className="pop-in panel p-6 mb-4">
            <h2 className="font-serif text-[26px] font-medium">Start a new post</h2>
            <p className="text-[14.5px] text-ink-2 mt-1">Pick the format above (one or a mix), then write below, or start from a file.</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <label htmlFor="imp" className="rounded-[12px] border border-line p-4 cursor-pointer hover:border-ink"><span className="block text-[15px] font-semibold">Import a PDF</span><span className="block text-[13px] text-muted mt-0.5">Or a .txt or .md file. Read in your browser, never uploaded.</span></label>
              <button onClick={() => document.getElementById('ed-title')?.focus()} className="rounded-[12px] border border-line p-4 text-left cursor-pointer hover:border-ink"><span className="block text-[15px] font-semibold">Write from scratch</span><span className="block text-[13px] text-muted mt-0.5">The value updates as you type.</span></button>
              <div className="rounded-[12px] border border-line p-4"><span className="block text-[15px] font-semibold">See an example</span>
                <span className="flex flex-wrap gap-1.5 mt-2">{SAMPLES.filter((x) => x.id !== 'scoop').map((x) => <button key={x.id} onClick={() => { loadSample(x.id); setReview(null) }} title={x.hint} className="h-7 px-2.5 rounded-full border border-line text-[12.5px] cursor-pointer hover:border-ink">{x.label}</button>)}</span>
              </div>
            </div>
          </div>
        )}
        {formats.includes('video') && (
          <div className="panel p-4 mb-4 grid sm:grid-cols-[1fr_160px] gap-3">
            <label><span className="text-[13.5px] font-semibold">Video link</span><input placeholder="https://… (your upload or channel link)" className="mt-1 h-10 w-full rounded-[10px] border border-line px-3 text-[14.5px]" /></label>
            <label><span className="text-[13.5px] font-semibold">Length</span><input placeholder="e.g. 14 min" className="mt-1 h-10 w-full rounded-[10px] border border-line px-3 text-[14.5px]" /></label>
            <p className="sm:col-span-2 text-[12.5px] text-muted">We value a video from its description and transcript below. Paste the transcript for a fuller estimate.</p>
          </div>
        )}

        <div className="panel px-5 md:px-10 pt-8 pb-6">
          <AutoText id="ed-title" value={draft.title} onChange={(t) => setDraft({ title: t })} placeholder="Headline" className="editor-title text-[30px] md:text-[38px] leading-[1.12] text-ink" label="Headline" />
          <AutoText value={draft.dek} onChange={(t) => setDraft({ dek: t })} placeholder="One sentence: what's new here?" className="mt-3 font-serif text-[19px] md:text-[21px] leading-snug text-ink-2" label="Standfirst" />
          <div className="my-6 h-px bg-line-2" />
          <AutoText
            value={draft.body}
            onChange={(t) => setDraft({ body: t })}
            placeholder={draft.kind === 'dataset' ? 'Describe the dataset: what it covers, how it was collected, what it shows, why it is rare.' : draft.kind === 'video' ? 'Paste the video description: what you tested, how, and what you found.' : 'Write or paste your piece.'}
            className="editor-body text-[#23263f] min-h-[420px]"
            label="Body"
          />
          <div className="mt-4 pt-4 border-t border-line-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            <span className="num">{v.features.words} words</span>
            {v.features.words > 0 && (
              <span className="num">
                {Math.round(v.features.effectiveWords)} carry new information
              </span>
            )}
            <span>Read time {Math.max(1, Math.round(v.features.words / 230))} min</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="panel p-5">
            <h3 className="text-[14.5px] font-semibold">Evidence you can attach</h3>
            <p className="text-[13px] text-muted mt-1 mb-3">Kept private. Reviewers use it if anyone disputes the piece.</p>
            <Toggle on={draft.attachments.sourceDocs} onChange={(b) => setDraft({ attachments: { ...draft.attachments, sourceDocs: b } })} label="Source document (memo, filing, RTI reply)" />
            <Toggle on={draft.attachments.rawData} onChange={(b) => setDraft({ attachments: { ...draft.attachments, rawData: b } })} label="Raw data or spreadsheet" />
          </div>
          <div className="panel p-5">
            <h3 className="text-[14.5px] font-semibold">How was this made?</h3>
            <p className="text-[13px] text-muted mt-1 mb-3">Shown to every buyer and sealed with the piece.</p>
            <Segmented<Disclosure>
              label="Disclosure"
              size="sm"
              value={draft.disclosure}
              onChange={(d) => setDraft({ disclosure: d, aiUses: d === 'human' ? [] : draft.aiUses.length ? draft.aiUses : ['proofreading'] })}
              options={[{ value: 'human', label: 'Human-made' }, { value: 'ai_assisted', label: 'AI-assisted' }, { value: 'ai_generated', label: 'AI-generated' }]}
            />
            {draft.disclosure === 'ai_assisted' && (
              <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="AI was used for">
                {AI_USES.map((u) => {
                  const on = draft.aiUses.includes(u)
                  return (
                    <button key={u} aria-pressed={on} onClick={() => setDraft({ aiUses: on ? draft.aiUses.filter((x) => x !== u) : [...draft.aiUses, u] })} className={cx('h-7 px-2.5 rounded-full text-[12.5px] border cursor-pointer', on ? 'bg-machine-wash border-machine/30 text-machine-ink' : 'border-line text-ink-2')}>
                      {u}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <ValuePanel v={v} review={reviewFresh ? review : null} staleReview={!!review && !reviewFresh} loading={loading} onAsk={askAi} />
    </div>
  )
}

function ValuePanel({ v, review, staleReview, loading, onAsk }: { v: Valuation; review: AiReview | null; staleReview: boolean; loading: boolean; onAsk: () => void }) {
  const empty = v.features.words < 25
  const b = v.breakdown
  const parts = [
    { key: 'reads', label: 'People reading', amount: b.reads.amount, color: 'bg-use-read', detail: `${b.reads.units.toLocaleString('en-IN')} reads at ${inr(v.prices.read)}` },
    { key: 'quotes', label: 'AI answers', amount: b.quotes.amount, color: 'bg-use-quote', detail: `${b.quotes.units.toLocaleString('en-IN')} answers at ${inr(v.prices.quote, { decimals: true })}` },
    { key: 'train', label: 'AI training', amount: b.training.amount, color: 'bg-use-train', detail: `${Math.round(b.training.probability * 100)}% chance of a ${inr(v.prices.train)} licence` },
    { key: 'deriv', label: 'Derivatives', amount: b.derivatives.amount, color: 'bg-use-republish', detail: 'Royalties from translations, clips, summaries' },
  ]
  const total = Math.max(1, parts.reduce((a, p) => a + p.amount, 0))
  const humanShare = (b.reads.amount + b.derivatives.amount) / total

  return (
    <aside aria-label="Value estimate" className="lg:sticky lg:top-[88px] flex flex-col gap-4">
      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[14.5px] font-semibold">Likely to earn in its first 30 days</h2>
          {!empty && <Badge tone={v.confidence.label === 'High' ? 'good' : v.confidence.label === 'Medium' ? 'wait' : 'bad'}>{v.confidence.label} confidence</Badge>}
        </div>
        {empty ? (
          <p className="mt-4 font-serif text-[18px] text-ink-2">Start writing. The estimate updates as you type.</p>
        ) : (
          <>
            <p className={cx('mt-3 text-[34px] leading-none font-semibold tracking-[-0.02em] num', v.tone === 'low' && 'text-bad')} aria-live="polite">
              {inr(roundNice(v.low))} – {inr(roundNice(v.high))}
            </p>
            <RangeBar low={v.low} high={v.high} mid={v.total} />
            <p className="mt-4 font-serif text-[17px] leading-snug text-ink">{v.headline}</p>
            <details className="mt-3 group">
              <summary className="text-[13px] text-muted cursor-pointer list-none flex items-center gap-1 hover:text-ink">
                <span className="group-open:rotate-90 transition-transform">›</span> Why {v.confidence.label.toLowerCase()} confidence
              </summary>
              <ul className="mt-2 text-[13px] text-ink-2 space-y-1 pl-3">
                {v.confidence.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </details>

            <div className="mt-5">
              <AudienceLine people={b.reads.units} ai={b.quotes.units} humanShare={humanShare} />
              <div className="flex h-3 rounded-full overflow-hidden gap-[2px] bg-surface" aria-hidden>
                {parts.filter((p) => p.amount > 0).map((p) => <div key={p.key} className={cx(p.color, 'first:rounded-l-full last:rounded-r-full')} style={{ width: `${(p.amount / total) * 100}%` }} />)}
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-1.5">
                {parts.map((p) => (
                  <div key={p.key} className="flex items-baseline gap-2 text-[13.5px]">
                    <span className={cx('w-2.5 h-2.5 rounded-[3px] shrink-0 translate-y-[1px]', p.color)} aria-hidden />
                    <dt className="text-ink">{p.label}</dt>
                    <dd className="ml-auto num font-medium">{inr(Math.round(p.amount))}</dd>
                    <dd className="sr-only">{p.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
      </div>

      {!empty && (
        <div className="panel p-5">
          <h3 className="text-[14.5px] font-semibold mb-3">What drives the number</h3>
          <ul className="space-y-4">
            {(Object.values(v.signals)).map((s) => (
              <li key={s.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-medium">{s.label}</span>
                  <span className="text-[13px] num text-muted">{s.score}/100</span>
                </div>
                <div className="mt-1.5"><Meter value={s.score} tone={s.score < 40 ? 'bad' : 'ink'} label={s.label} /></div>
                <p className="mt-1.5 text-[13.5px] text-ink-2">{s.verdict}</p>
                <p className="text-[12.5px] text-muted">{s.detail.slice(0, 2).join('. ')}</p>
              </li>
            ))}
          </ul>

          {v.flags.length > 0 && (
            <div className="mt-5 pt-4 border-t border-line-2">
              <h4 className="text-[13.5px] font-semibold mb-2">Things that lower the value</h4>
              <ul className="space-y-2">
                {v.flags.map((f) => (
                  <li key={f.id} className="flex gap-2 text-[13px] text-ink-2">
                    <Icon.warn className={cx('shrink-0 mt-0.5', f.severity === 'bad' ? 'text-bad' : 'text-human')} />
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-line-2">
            <h4 className="text-[13.5px] font-semibold mb-2">What would raise it</h4>
            {v.suggestions.length ? (
              <ul className="space-y-2">
                {v.suggestions.map((s) => (
                  <li key={s.id} className="flex items-start gap-3 text-[13.5px]">
                    <span className="flex-1 text-ink-2">{s.text}</span>
                    <span className="num text-good font-semibold whitespace-nowrap flex items-center gap-0.5"><Icon.up />{inr(s.uplift)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-ink-2">Nothing major. Publishing soon matters more than polishing: it’s worth most in the first {v.halfLifeHours <= 48 ? `${v.halfLifeHours} hours` : 'weeks'}.</p>
            )}
          </div>
        </div>
      )}

      {!empty && (
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14.5px] font-semibold">Second opinion</h3>
            {review && <Badge tone={review.source === 'gemini' ? 'machine' : 'neutral'}>{review.source === 'gemini' ? 'AI review applied' : 'Rules only'}</Badge>}
          </div>
          {!review && (
            <p className="text-[13px] text-muted mt-1 mb-3">
              {staleReview ? 'You changed the text since the last review.' : 'An AI editor reads the piece and can adjust each score by up to 10 points. The rules stay the anchor, so the number can’t be talked up.'}
            </p>
          )}
          {review && (
            <div className="mt-2 text-[13.5px] text-ink-2 space-y-2">
              <p className="font-serif text-[16px] text-ink leading-snug">{review.summary}</p>
              {review.risks.length > 0 && <p><span className="font-medium text-ink">Watch out:</span> {review.risks.join(' ')}</p>}
              {review.suggestions.length > 0 && (
                <ul className="list-disc pl-4 space-y-1">{review.suggestions.map((s) => <li key={s}>{s}</li>)}</ul>
              )}
              {Object.entries(review.nudges).some(([, n]) => n) && (
                <p className="text-[12.5px] text-muted">Adjusted: {Object.entries(review.nudges).filter(([, n]) => n).map(([k, n]) => `${k} ${n! > 0 ? '+' : ''}${n}`).join(', ')}</p>
              )}
            </div>
          )}
          <Button variant="secondary" className="w-full mt-3" onClick={onAsk} disabled={loading}>
            {loading ? 'Reading your piece…' : review ? 'Ask again' : 'Get an AI second opinion'}
          </Button>
        </div>
      )}

      {!empty && (
        <Button variant="primary" className="w-full h-12 text-[15px]" onClick={() => go('/studio/licence')}>
          Set who can use it, and for how much
        </Button>
      )}

      {/* phone: compact estimate stays visible */}
      {!empty && (
        <a href="#estimate" className="lg:hidden fixed bottom-14 inset-x-0 z-20 bg-ink text-white px-4 h-11 flex items-center justify-between text-[14px]" onClick={(e) => { e.preventDefault(); document.querySelector('[aria-label="Value estimate"]')?.scrollIntoView({ behavior: 'smooth' }) }}>
          <span>Likely to earn</span>
          <span className="num font-semibold">{inr(roundNice(v.low))} – {inr(roundNice(v.high))}</span>
        </a>
      )}
    </aside>
  )
}

function AudienceLine({ people, ai, humanShare }: { people: number; ai: number; humanShare: number }) {
  const uses = people + ai
  const aiUseShare = uses ? ai / uses : 0
  if (people === 0) return <p className="mb-3 text-[13px] text-ink-2">Too thin to charge readers for: we suggest making it free to read. Any income would come from AI answers.</p>
  return (
    <div className="mb-3 text-[13px] text-ink-2 space-y-1">
      <p className="flex items-center gap-1.5"><Icon.machine className="text-machine shrink-0" /><span><span className="font-medium text-ink num">{Math.round(aiUseShare * 100)}%</span> of its use will be AI systems, but they’ll pay <span className="font-medium text-ink num">{Math.round((1 - humanShare) * 100)}%</span> of the money.</span></p>
      <p className="text-[12px] text-muted num pl-5">{people.toLocaleString('en-IN')} paid reads, {ai.toLocaleString('en-IN')} AI answers expected</p>
    </div>
  )
}

function roundNice(x: number) {
  if (x < 100) return Math.round(x)
  if (x < 1000) return Math.round(x / 10) * 10
  if (x < 10000) return Math.round(x / 50) * 50
  return Math.round(x / 100) * 100
}

/** Log-scale track from ₹10 to ₹1,00,000 so a ₹40 piece and a ₹40,000 piece both read honestly. */
function RangeBar({ low, high, mid }: { low: number; high: number; mid: number }) {
  const pos = (x: number) => Math.max(0, Math.min(100, ((Math.log10(Math.max(x, 10)) - 1) / 4) * 100))
  const ticks = [{ v: 10, l: '₹10' }, { v: 100, l: '₹100' }, { v: 1000, l: '₹1k' }, { v: 10000, l: '₹10k' }, { v: 100000, l: '₹1L' }]
  return (
    <div className="mt-4" aria-hidden>
      <div className="relative h-7">
        <div className="absolute inset-x-0 top-[13px] h-[2px] bg-line" />
        {ticks.map((t) => <div key={t.v} className="absolute top-[9px] w-px h-[10px] bg-faint" style={{ left: `${pos(t.v)}%` }} />)}
        <div className="absolute top-[8px] h-3 rounded-full bg-ink/85 transition-all duration-300" style={{ left: `${pos(low)}%`, width: `${Math.max(1.5, pos(high) - pos(low))}%` }} />
        <div className="absolute top-[4px] w-[3px] h-5 rounded-full bg-human transition-all duration-300" style={{ left: `calc(${pos(mid)}% - 1px)` }} />
      </div>
      <div className="relative h-4 text-[11.5px] text-muted">
        {ticks.map((t, i) => <span key={t.v} className="absolute -translate-x-1/2" style={{ left: `${pos(t.v)}%`, transform: i === 0 ? 'none' : i === ticks.length - 1 ? 'translateX(-100%)' : undefined }}>{t.l}</span>)}
      </div>
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 py-2 text-left cursor-pointer">
      <span className="text-[13.5px] text-ink-2">{label}</span>
      <span className={cx('w-9 h-5 rounded-full p-[2px] transition-colors shrink-0', on ? 'bg-good' : 'bg-line')}>
        <span className={cx('block w-4 h-4 rounded-full bg-white transition-transform', on && 'translate-x-4')} />
      </span>
    </button>
  )
}

function AutoText({ value, onChange, placeholder, className, label, id }: { value: string; onChange: (s: string) => void; placeholder: string; className?: string; label: string; id?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])
  return (
    <textarea
      ref={ref}
      id={id}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className={cx('w-full bg-transparent outline-none placeholder:text-faint block overflow-hidden', className)}
    />
  )
}
