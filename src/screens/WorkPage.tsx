import { useEffect, useMemo, useState } from 'react'
import { DEMO_AGENTS, handleMcp, type McpCtx } from '../engine/mcp'
import { PERMISSION_LABEL, USE_META, inr, summarise, toMachineJson, type UseKey } from '../engine/licence'
import { shortHash, verifySeal, wordDiff, type DiffPart } from '../engine/seal'
import { useStore, type Work } from '../store'
import { Avatar, Badge, Button, Icon, JsonView, Segmented, cx, fmtDate, useRoute } from '../ui/kit'

const ORDER: UseKey[] = ['read', 'ai_quote', 'ai_train', 'republish']

function previewText(body: string, n: number) {
  const out: string[] = []
  let left = n
  for (const para of body.split(/\n\s*\n/)) {
    const ws = para.split(/\s+/)
    if (ws.length <= left) { out.push(para); left -= ws.length } else { out.push(ws.slice(0, left).join(' ')); break }
    if (left <= 0) break
  }
  return out.join('\n\n')
}

export default function WorkPage({ id }: { id: string }) {
  const { works, creators, seals } = useStore()
  const { params } = useRoute()
  const wantAi = params.get('view') === 'ai'
  const [view, setView] = useState<'person' | 'ai'>(wantAi ? 'ai' : 'person')
  useEffect(() => { setView(wantAi ? 'ai' : 'person') }, [wantAi, id])
  const w = works.find((x) => x.id === id)
  if (!w) return <div className="mx-auto max-w-[720px] px-4 py-20"><h1 className="text-[24px] font-semibold">This piece isn’t here</h1><p className="text-ink-2 mt-2">It may still be publishing. <a className="underline" href="#/">Back to the home page</a></p></div>
  const c = creators[w.creatorId]
  const seal = seals[w.id]

  return (
    <div className={cx(view === 'ai' && 'view-machine bg-[#f7f8fc] min-h-screen')}>
      <div className="border-b border-line bg-surface/95 backdrop-blur sticky top-16 z-20">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 h-14 flex items-center gap-3">
          <span className="text-[13.5px] text-muted hidden sm:inline">See this page as</span>
          <Segmented
            label="View as"
            value={view}
            onChange={setView}
            options={[
              { value: 'person', label: <span className="flex items-center gap-1.5"><Icon.person className="text-human" />A person</span> },
              { value: 'ai', label: <span className="flex items-center gap-1.5"><Icon.machine className="text-machine" />An AI system</span> },
            ]}
          />
          <span className="ml-auto text-[13px] text-muted hidden md:inline">{view === 'ai' ? 'Same piece, as structured data an agent receives' : 'What a reader or buyer sees'}</span>
        </div>
      </div>
      {view === 'person' ? <PersonView w={w} c={c} sealOk={!!seal} /> : <AiView w={w} />}
    </div>
  )
}

function PersonView({ w, c, sealOk }: { w: Work; c: ReturnType<typeof useStore>['creators'][string]; sealOk: boolean }) {
  const { addEvent, seals, fileReport } = useStore()
  const [unlocked, setUnlocked] = useState(w.licence.uses.read.permission === 'free')
  const [verify, setVerify] = useState<{ ok: boolean; hashMatches: boolean; signatureValid: boolean } | null>(null)
  const seal = seals[w.id]
  useEffect(() => { if (seal) verifySeal(seal, w.body).then(setVerify) }, [seal, w.body])
  const words = w.body.split(/\s+/)
  const previewN = w.licence.previewWords || 80
  const shown = unlocked ? w.body : previewText(w.body, previewN)
  const read = w.licence.uses.read
  const first = c.name.replace(/^Dr\s+/, '').split(' ')[0]

  const buyRead = () => {
    addEvent({ ts: new Date().toISOString(), workId: w.id, buyerId: 'readers', buyerKind: 'human', use: 'read', units: 1, amount: read.price, via: 'web', note: 'You, on this page' })
    setUnlocked(true)
  }

  return (
    <article className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 md:py-12 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-10">
      <div className="min-w-0 max-w-[720px]">
        <p className="text-[14px] font-medium text-human-ink">{w.section}{w.kind !== 'article' ? `, ${w.kind}` : ''}</p>
        <h1 className="font-serif text-[34px] md:text-[46px] leading-[1.08] font-medium tracking-[-0.015em] mt-2">{w.title}</h1>
        <p className="font-serif text-[20px] md:text-[23px] leading-snug text-ink-2 mt-4">{w.dek}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-6 pb-6 border-b border-line">
          <span className="flex items-center gap-3">
            <Avatar name={c.name} hue={c.avatarHue} size={40} />
            <span>
              <span className="block font-semibold text-[15px]">{c.name}</span>
              <span className="block text-[13px] text-muted">{c.beat}, {c.location}</span>
            </span>
          </span>
          <span className="text-[13.5px] text-ink-2">Published {fmtDate(w.publishedAt, { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          <span className="flex flex-wrap gap-2">
            <Badge tone={w.disclosure === 'ai_generated' ? 'machine' : 'neutral'}>
              {w.disclosure === 'human' ? 'Human-made' : w.disclosure === 'ai_assisted' ? `Human-made, AI helped with ${w.aiUses.join(' and ')}` : 'AI-generated'}
            </Badge>
            {verify && <Badge tone={verify.ok ? 'good' : 'bad'}><Icon.seal className="w-3.5 h-3.5" />{verify.ok ? 'Unchanged since publishing' : 'Changed since publishing'}</Badge>}
          </span>
        </div>

        <div className="prose-article mt-8 whitespace-pre-line relative">
          {shown.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
          {!unlocked && <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-surface to-transparent" aria-hidden />}
        </div>

        {!unlocked && (
          <div className="panel p-6 mt-2 border-human/40 bg-human-wash/40">
            <h2 className="text-[18px] font-semibold">Keep reading for {inr(read.price)}</h2>
            <p className="text-[14px] text-ink-2 mt-1">{words.length - previewN} more words. {first} keeps 85% of what you pay.{read.includedInPass && ' Free with Twofold Pass.'}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="primary" onClick={buyRead}>Unlock for {inr(read.price)}</Button>
              {read.includedInPass && <Button variant="secondary" onClick={() => { addEvent({ ts: new Date().toISOString(), workId: w.id, buyerId: 'pass', buyerKind: 'human', use: 'read', units: 1, amount: 4.2, via: 'web', note: 'Pass read' }); setUnlocked(true) }}>Read with Pass</Button>}
            </div>
            <p className="text-[12px] text-muted mt-3">Prototype: no real payment is taken.</p>
          </div>
        )}

        <ReportBox workId={w.id} onFile={fileReport} creatorFirst={first} />
      </div>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-[150px] self-start">
        <section className="panel p-5" aria-labelledby="terms-h">
          <h2 id="terms-h" className="text-[15px] font-semibold">Using this work</h2>
          <ul className="mt-3 divide-y divide-line-2">
            {ORDER.map((k) => {
              const u = w.licence.uses[k]
              const ai = USE_META[k].who === 'ai'
              return (
                <li key={k} className="py-3 flex items-start gap-3">
                  <span className={cx('mt-0.5 w-6 h-6 rounded-full grid place-items-center shrink-0', ai ? 'bg-machine-wash text-machine' : 'bg-human-wash text-human-ink')}>{ai ? <Icon.machine /> : <Icon.person />}</span>
                  <span className="flex-1 text-[13.5px] leading-snug">{USE_META[k].label.replace('it', 'this')}</span>
                  <span className={cx('text-[13.5px] font-semibold text-right num whitespace-nowrap', u.permission === 'no' && 'text-bad')}>
                    {u.permission === 'paid' ? inr(u.price, { decimals: k === 'ai_quote' }) : PERMISSION_LABEL[u.permission]}
                    {u.permission === 'paid' && <span className="block text-[11.5px] font-normal text-muted">{USE_META[k].unit}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-[13px] text-ink-2 font-serif leading-relaxed mt-2 pt-3 border-t border-line-2">{summarise(w.licence, first)}</p>
        </section>

        {sealOk && <SealBox w={w} verify={verify} />}
      </aside>
    </article>
  )
}

function SealBox({ w, verify }: { w: Work; verify: { ok: boolean; hashMatches: boolean; signatureValid: boolean } | null }) {
  const { seals, creators } = useStore()
  const seal = seals[w.id]
  const [copy, setCopy] = useState('')
  const [result, setResult] = useState<{ same: boolean; diff: DiffPart[] } | null>(null)
  const check = async () => {
    const v = await verifySeal(seal, copy)
    setResult({ same: v.hashMatches, diff: v.hashMatches ? [] : wordDiff(w.body, copy) })
  }
  const changed = result?.diff.filter((d) => d.type !== 'same') || []
  return (
    <section className="panel p-5" aria-labelledby="seal-h">
      <div className="flex items-start gap-3">
        <span className={verify?.ok === false ? 'text-bad' : 'text-good'}><Icon.seal className="w-9 h-9" /></span>
        <div>
          <h2 id="seal-h" className="text-[15px] font-semibold">{verify?.ok === false ? 'This text has changed' : 'Sealed by the author'}</h2>
          <p className="text-[13.5px] text-ink-2 mt-1">
            {creators[w.creatorId].name} sealed this exact text on {fmtDate(seal.signedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}. Like a wax seal: change a single comma and it breaks.
            {verify?.ok && ' It hasn’t been broken.'}
          </p>
        </div>
      </div>
      <details className="mt-3 text-[13px]">
        <summary className="cursor-pointer text-muted hover:text-ink">Technical details</summary>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-muted">Fingerprint</dt><dd className="machine text-[11.5px] break-all">{seal.contentHash}</dd>
          <dt className="text-muted">Signature</dt><dd>{verify?.signatureValid ? 'Valid (ECDSA P-256)' : 'Checking…'}</dd>
          <dt className="text-muted">Made</dt><dd>{seal.origin === 'human' ? 'Human-made' : seal.origin === 'ai_assisted' ? `AI-assisted: ${seal.aiAssistance.join(', ')}` : 'AI-generated'} (part of the seal)</dd>
          <dt className="text-muted">Version</dt><dd>{seal.version}</dd>
        </dl>
      </details>
      <div className="mt-4 pt-4 border-t border-line-2">
        <label htmlFor="copy" className="text-[13.5px] font-medium">Got a copy from somewhere else? Check it.</label>
        <textarea id="copy" value={copy} onChange={(e) => { setCopy(e.target.value); setResult(null) }} rows={3} placeholder="Paste the full text you were given" className="mt-2 w-full rounded-[9px] border border-line p-2.5 text-[13px] outline-none focus:border-machine" />
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="secondary" onClick={check} disabled={!copy.trim()}>Check against the seal</Button>
          <Button size="sm" variant="ghost" onClick={() => { setCopy(w.body.replace(/(₹[\d,]+|\d+(?:\.\d+)?%)/, (m) => m.replace(/\d/, (d) => String((Number(d) + 3) % 10)))); setResult(null) }}>Try an altered copy</Button>
        </div>
        {result && (
          <div className={cx('mt-3 rounded-[9px] p-3 text-[13px]', result.same ? 'bg-good-wash text-good' : 'bg-bad-wash text-bad')} role="status">
            {result.same ? 'Identical to what the author sealed.' : `Not the original: ${changed.filter((d) => d.type === 'removed').length} passage(s) changed.`}
            {!result.same && (
              <p className="mt-2 text-ink font-serif text-[14px] leading-relaxed max-h-40 overflow-auto">
                {result.diff.map((d, i) => d.type === 'same' ? <span key={i} className="text-muted">{d.text.length > 120 ? ' … ' : d.text}</span> : d.type === 'removed' ? <del key={i} className="bg-good-wash text-good no-underline px-0.5">{d.text}</del> : <ins key={i} className="bg-bad-wash text-bad no-underline px-0.5 font-semibold">{d.text}</ins>)}
              </p>
            )}
            {!result.same && <p className="mt-1 text-[12px] text-muted">Green: the original. Red: what the copy says instead.</p>}
          </div>
        )}
      </div>
    </section>
  )
}

function ReportBox({ workId, onFile, creatorFirst }: { workId: string; onFile: (id: string, reason: string, claim: string) => void; creatorFirst: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('Factually wrong')
  const [claim, setClaim] = useState('')
  const [sent, setSent] = useState(false)
  if (sent) return <div className="mt-10 text-[13.5px] text-ink-2 panel p-4">Report received. {creatorFirst} gets 72 hours to respond with evidence. Only this piece’s new earnings can be held, and only if credible reports add up. Your report counts as weight 0.1 of the 1.0 needed.</div>
  return (
    <div className="mt-10">
      {!open ? (
        <button className="text-[13.5px] text-muted underline hover:text-ink cursor-pointer" onClick={() => setOpen(true)}>Report as fake or misleading</button>
      ) : (
        <div className="panel p-4">
          <h3 className="text-[15px] font-semibold">What’s wrong with it?</h3>
          <div className="flex flex-wrap gap-2 mt-3">
            {['Factually wrong', 'Made-up source', 'AI-generated but not disclosed', 'Copied from someone else'].map((r) => (
              <button key={r} aria-pressed={reason === r} onClick={() => setReason(r)} className={cx('h-8 px-3 rounded-full text-[13px] border cursor-pointer', reason === r ? 'bg-ink text-white border-ink' : 'border-line')}>{r}</button>
            ))}
          </div>
          <textarea value={claim} onChange={(e) => setClaim(e.target.value)} rows={2} placeholder="What exactly is wrong, and how do you know?" className="mt-3 w-full rounded-[9px] border border-line p-2.5 text-[13.5px] outline-none focus:border-machine" />
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="primary" disabled={!claim.trim()} onClick={() => { onFile(workId, reason, claim); setSent(true) }}>Send report</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
type Step = { title: string; call: { method: string; params?: unknown }; response?: unknown; status?: string }

const AGENTS = [
  { key: 'demo-finpilot', name: 'FinPilot', what: 'a trading agent briefing a user before they place an order' },
  { key: 'demo-lumen', name: 'Lumen Assistant', what: 'a chat assistant answering “what’s new with this company?”' },
  { key: 'demo-kestrel', name: 'Kestrel Search', what: 'an AI search engine building a cited answer' },
]

function AiView({ w }: { w: Work }) {
  const { works, creators, addEvent, serverOnline } = useStore()
  const [agent, setAgent] = useState(AGENTS[0].key)
  const [steps, setSteps] = useState<Step[]>([])
  const [running, setRunning] = useState(false)
  const query = w.topics.slice(0, 2).join(' ') || w.title.split(' ').slice(0, 3).join(' ')

  const ctx: McpCtx = useMemo(() => ({
    works: works.map((x) => ({ ...x, seal: x.seal })),
    creatorName: (id: string) => creators[id]?.name || id,
    host: location.origin,
    now: () => new Date().toISOString(),
    record: () => {},
  }), [works, creators])

  const call = async (method: string, params: unknown, auth?: string) => {
    const body = { jsonrpc: '2.0', id: Math.floor(Math.random() * 1e6), method, params }
    if (serverOnline) {
      try {
        const r = await fetch('/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(auth ? { authorization: `Bearer ${auth}` } : {}) }, body: JSON.stringify(body) })
        if (r.ok) return { res: await r.json(), via: 'server' }
      } catch { /* fall through */ }
    }
    return { res: handleMcp(body as never, ctx, auth ? `Bearer ${auth}` : undefined), via: 'browser' }
  }

  const run = async () => {
    setRunning(true)
    const out: Step[] = []
    const push = (s: Step) => { out.push(s); setSteps([...out]) }
    const sc = (res: any) => res?.result?.structuredContent ?? res
    const pause = () => new Promise((r) => setTimeout(r, 450))

    const s1 = await call('tools/call', { name: 'search_works', arguments: { query } })
    push({ title: 'Discover: search for relevant work (free)', call: { method: 'tools/call', params: { name: 'search_works', arguments: { query } } }, response: sc(s1.res) }); await pause()
    const s2 = await call('tools/call', { name: 'get_work_preview', arguments: { work_id: w.id } })
    push({ title: 'Evaluate: read the free preview', call: { method: 'tools/call', params: { name: 'get_work_preview', arguments: { work_id: w.id } } }, response: sc(s2.res) }); await pause()
    const s3 = await call('tools/call', { name: 'get_full_work', arguments: { work_id: w.id, use: 'ai_quote' } })
    push({ title: 'Ask for the full text: payment required', call: { method: 'tools/call', params: { name: 'get_full_work', arguments: { work_id: w.id, use: 'ai_quote' } } }, response: sc(s3.res), status: '402' }); await pause()
    if (w.licence.uses.ai_quote.permission !== 'paid') { setRunning(false); return }
    const s4 = await call('tools/call', { name: 'purchase_licence', arguments: { work_id: w.id, use: 'ai_quote' } }, agent)
    const r4 = sc(s4.res) as any
    push({ title: `Buy a licence to quote it (authenticated as ${AGENTS.find((a) => a.key === agent)!.name})`, call: { method: 'tools/call', params: { name: 'purchase_licence', arguments: { work_id: w.id, use: 'ai_quote' } } }, response: r4, status: r4?.status })
    if (r4?.usage_record) {
      addEvent({ id: r4.usage_record.id, ts: r4.usage_record.ts, workId: w.id, buyerId: DEMO_AGENTS[agent].id, buyerKind: 'ai', use: 'ai_quote', units: 1, amount: r4.price_paid.amount, via: 'mcp', note: `${DEMO_AGENTS[agent].name} via MCP${s4.via === 'browser' ? ' (in-browser)' : ''}` })
    }
    await pause()
    if (r4?.licence_token) {
      const s5 = await call('tools/call', { name: 'get_full_work', arguments: { work_id: w.id, use: 'ai_quote', licence_token: r4.licence_token } }, agent)
      const r5 = sc(s5.res) as any
      push({ title: 'Retrieve with the licence: full text plus attribution rules', call: { method: 'tools/call', params: { name: 'get_full_work', arguments: { work_id: w.id, use: 'ai_quote', licence_token: '…' } } }, response: { ...r5, text: r5?.text ? r5.text.slice(0, 220) + ' …' : undefined } })
    }
    setRunning(false)
  }

  const meta = toMachineJson(w.licence, { id: w.id, title: w.title, creator: { id: w.creatorId, name: creators[w.creatorId].name, url: `${location.origin}/#/@${w.creatorId}` }, publishedAt: w.publishedAt, contentHash: w.seal?.contentHash, disclosure: { origin: w.disclosure, aiAssistance: w.aiUses } }, location.origin)

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
      <section className="min-w-0">
        <h1 className="machine !text-[15px] text-ink font-medium">GET /api/licence/{w.id}</h1>
        <p className="text-[13.5px] text-ink-2 mt-1 mb-3 font-sans">No layout, no paywall design. An agent gets the terms, the price per use and the proof, as data. Unknown crawlers that skip this get the preview only and an HTTP 402.</p>
        <div className="panel p-4 bg-surface"><JsonView value={meta} /></div>
        <div className="panel p-4 mt-4 bg-surface">
          <p className="machine text-muted">$ curl -I {location.host}/work/{w.id}/full</p>
          <pre className="machine text-ink mt-1 whitespace-pre-wrap">{`HTTP/2 402 Payment Required
link: <${location.origin}/api/licence/${w.id}>; rel="license"
x-licence-uses: read=${w.licence.uses.read.permission}; ai_quote=${w.licence.uses.ai_quote.permission}; ai_train=${w.licence.uses.ai_train.permission}; republish=${w.licence.uses.republish.permission}
x-mcp-endpoint: ${location.origin}/api/mcp`}</pre>
        </div>
      </section>

      <section className="min-w-0 font-sans">
        <div className="panel p-5 bg-surface">
          <h2 className="text-[15px] font-semibold">Watch an agent use it, live</h2>
          <p className="text-[13.5px] text-ink-2 mt-1">These are real calls to this site’s MCP server{serverOnline === false ? ' (running in your browser because the server is offline)' : ''}. The purchase shows up on Riya’s earnings dashboard.</p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <label className="text-[13.5px] text-muted" htmlFor="agent">Agent</label>
            <select id="agent" value={agent} onChange={(e) => setAgent(e.target.value)} className="h-9 rounded-[9px] border border-line px-2 text-[14px] bg-surface">
              {AGENTS.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            </select>
            <Button variant="machine" onClick={run} disabled={running}>{running ? 'Running…' : steps.length ? 'Run again' : 'Run the calls'}</Button>
          </div>
          <p className="text-[12.5px] text-muted mt-2">{AGENTS.find((a) => a.key === agent)!.name} is {AGENTS.find((a) => a.key === agent)!.what}.</p>
        </div>
        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="panel p-4 bg-surface rise-in">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-machine-wash text-machine-ink grid place-items-center text-[12px] font-semibold">{i + 1}</span>
                <h3 className="text-[14px] font-semibold flex-1">{s.title}</h3>
                {s.status === '402' && <Badge tone="wait">402 access required</Badge>}
                {s.status === 'licensed' && <Badge tone="good">Paid {inr((s.response as any).price_paid.amount, { decimals: true })}</Badge>}
              </div>
              <details className="mt-2" open={i >= steps.length - 2}>
                <summary className="text-[12.5px] text-muted cursor-pointer">Request and response</summary>
                <JsonView className="mt-2 text-muted" value={s.call} />
                <div className="mt-2 max-h-72 overflow-auto rounded-[8px] bg-[#f7f8fc] p-2"><JsonView value={s.response} /></div>
              </details>
            </li>
          ))}
        </ol>
        {steps.length > 0 && !running && (
          <a href="#/studio/earnings" className="inline-block mt-4 text-[14px] font-medium underline">See it on the earnings dashboard</a>
        )}
        <div className="panel p-4 mt-4 bg-surface text-[13px] text-ink-2">
          <h3 className="font-semibold text-ink text-[14px]">Connect your own MCP client</h3>
          <p className="mt-1">Server URL <span className="machine">{location.origin}/api/mcp</span> (Streamable HTTP, JSON responses). Demo key: <span className="machine">Authorization: Bearer demo-finpilot</span>.</p>
        </div>
      </section>
    </div>
  )
}
