// Live demo: publish one new story, watch it reach the reader home page,
// then watch three AI agents find it, pay for it and quote it, with the creator's earnings ticking up.
import { useMemo, useRef, useState } from 'react'
import { DEMO_AGENTS, handleMcp, type McpCtx } from '../engine/mcp'
import { inr } from '../engine/licence'
import { CREATOR_SHARE } from '../data/seed'
import { useStore, type Draft, type Work } from '../store'
import { Avatar, Badge, Button, Icon, JsonView, ago, cx } from '../ui/kit'

const STORY: Draft = {
  title: 'Saffron Motors pushes its second EV plant back by a year, board minutes show',
  dek: 'Minutes of the 20 November board meeting, seen by this reporter, move the Chakan plant’s start from 2028 to 2029 after land purchases stalled.',
  body: `Saffron Motors’ board agreed on 20 November to push the start of its second electric-vehicle plant at Chakan from 2028 to 2029, according to minutes of the meeting seen by this reporter.

The minutes say the company has registered only 131 of the 280 acres it needs, and that talks with 52 landowning families "have not progressed as planned". The delay pushes about 150,000 vehicles a year of planned capacity out of 2028.

Two people familiar with the discussion said the board also cut this year’s capital spending plan by ₹600 crore. A Saffron Motors spokesperson said the company "does not comment on board deliberations" and that its long-term EV plans were unchanged.

The company has not told the stock exchanges about the new timeline. Its shares closed at ₹1,284 on Monday. Analysts at two brokerages have the plant contributing to volumes from 2028 in their current forecasts.

This reporter first reported the land shortfall on 7 November.`,
  kind: 'article',
  attachments: { sourceDocs: true, rawData: false },
  disclosure: 'human',
  aiUses: [],
}

type Agent = { key: string; question: string; query: string }
const AGENTS: Agent[] = [
  { key: 'demo-finpilot', question: 'I’m about to buy Saffron Motors shares. Anything new on their EV plant?', query: 'Saffron Motors EV plant' },
  { key: 'demo-lumen', question: 'Is Saffron Motors’ Chakan EV plant still on track for 2028?', query: 'Saffron Chakan plant' },
  { key: 'demo-kestrel', question: 'saffron motors ev plant delay', query: 'Saffron Motors delay' },
]

type Step = { tool: string; label: string; tone?: 'free' | 'pay' | 'wait'; req: unknown; res: unknown }
type Turn = { agent: Agent; steps: Step[]; answer?: string; paid?: number; status: 'running' | 'done' | 'skipped' }

export default function Demo() {
  const { works, creators, events, publish, addEvent, serverOnline, me } = useStore()
  const [phase, setPhase] = useState<'idle' | 'publishing' | 'published' | 'agents' | 'done'>('idle')
  const [work, setWork] = useState<Work | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [log, setLog] = useState<string[]>([])
  const startedAt = useRef<string>('')
  const note = (s: string) => setLog((l) => [...l, s])

  const ctx: McpCtx = useMemo(() => ({
    works: works.map((x) => ({ ...x })),
    creatorName: (id: string) => creators[id]?.name || id,
    host: location.origin,
    now: () => new Date().toISOString(),
    record: () => {},
  }), [works, creators])

  const ctxWith = (w: Work): McpCtx => ({ ...ctx, works: [w, ...ctx.works.filter((x) => x.id !== w.id)] })

  // Prefer the real server; fall back to the same MCP logic in the browser if the server can't see the new piece yet.
  const call = async (w: Work, name: string, args: Record<string, unknown>, auth?: string) => {
    const body = { jsonrpc: '2.0', id: Math.floor(Math.random() * 1e6), method: 'tools/call', params: { name, arguments: args } }
    if (serverOnline) {
      try {
        const r = await fetch('/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) }, body: JSON.stringify(body) })
        if (r.ok) {
          const j = await r.json()
          const sc = j?.result?.structuredContent
          const missing = sc?.error === 'not_found' || (name === 'search_works' && !sc?.results?.some((x: { work_id: string }) => x.work_id === w.id))
          if (!missing) return sc
        }
      } catch { /* fall through */ }
    }
    const res = handleMcp(body as never, ctxWith(w), auth ? `Bearer ${auth}` : undefined) as { result?: { structuredContent?: unknown } }
    return res?.result?.structuredContent
  }

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const run = async () => {
    setTurns([]); setLog([]); setWork(null)
    startedAt.current = new Date().toISOString()
    setPhase('publishing')
    note('Riya publishes a new exclusive. The text is fingerprinted and signed.')
    const w = await publish(STORY)
    setWork(w)
    setPhase('published')
    note(`Sealed (${w.seal?.contentHash.slice(7, 15)}…) and live on the reader home page. Other open tabs update instantly; other devices within 4 seconds.`)
    await wait(1400)

    // a few human readers arrive
    for (let i = 0; i < 3; i++) {
      addEvent({ ts: new Date().toISOString(), workId: w.id, buyerId: i === 1 ? 'pass' : 'readers', buyerKind: 'human', use: 'read', units: 1, amount: i === 1 ? 4.2 : w.licence.uses.read.price, via: 'web', note: i === 1 ? 'Pass read' : 'Reader on the home page' })
    }
    note('Three readers open it from the home page: two pay per read, one reads with Pass.')
    await wait(900)

    setPhase('agents')
    const out: Turn[] = []
    for (const agent of AGENTS) {
      const t: Turn = { agent, steps: [], status: 'running' }
      out.push(t); setTurns([...out])
      const push = (s: Step) => { t.steps.push(s); setTurns([...out]) }

      const search = await call(w, 'search_works', { query: agent.query }) as { results?: { work_id: string }[] }
      push({ tool: 'search_works', label: 'Searches Twofold', tone: 'free', req: { query: agent.query }, res: search })
      await wait(500)
      const prev = await call(w, 'get_work_preview', { work_id: w.id })
      push({ tool: 'get_work_preview', label: 'Reads the free preview', tone: 'free', req: { work_id: w.id }, res: prev })
      await wait(500)
      const gate = await call(w, 'get_full_work', { work_id: w.id, use: 'ai_quote' })
      push({ tool: 'get_full_work', label: 'Asks for the full text: 402, payment required', tone: 'wait', req: { work_id: w.id, use: 'ai_quote' }, res: gate })
      await wait(600)
      const buy = await call(w, 'purchase_licence', { work_id: w.id, use: 'ai_quote' }, agent.key) as { licence_token?: string; usage_record?: { id: string; ts: string }; price_paid?: { amount: number } }
      push({ tool: 'purchase_licence', label: `Buys a quote licence as ${DEMO_AGENTS[agent.key].name}`, tone: 'pay', req: { work_id: w.id, use: 'ai_quote' }, res: buy })
      if (buy?.usage_record) {
        addEvent({ id: buy.usage_record.id, ts: buy.usage_record.ts, workId: w.id, buyerId: DEMO_AGENTS[agent.key].id, buyerKind: 'ai', use: 'ai_quote', units: 1, amount: buy.price_paid?.amount || 0, via: 'mcp', note: `${DEMO_AGENTS[agent.key].name} via MCP` })
        t.paid = buy.price_paid?.amount
      }
      await wait(500)
      const full = await call(w, 'get_full_work', { work_id: w.id, use: 'ai_quote', licence_token: buy?.licence_token }, agent.key) as { text?: string; conditions?: { attribution: string; max_quote_words: number } }
      push({ tool: 'get_full_work', label: 'Retrieves the full text with the licence', tone: 'free', req: { work_id: w.id, use: 'ai_quote', licence_token: '…' }, res: { ...full, text: full?.text ? full.text.slice(0, 160) + ' …' : undefined } })
      const quote = (full?.text || '').split(/\s+/).slice(0, Math.min(32, full?.conditions?.max_quote_words || 40)).join(' ')
      const src = `Source: ${me.name}, Twofold`
      t.answer = agent.key === 'demo-finpilot'
        ? `Before you buy: new reporting says the board has moved the Chakan EV plant from 2028 to 2029 and cut this year’s capex by ₹600 crore. This isn’t in exchange filings yet, so brokerage forecasts may not reflect it. “${quote}…” ${src}.`
        : agent.key === 'demo-lumen'
          ? `Not any more. According to board minutes reported today, the plant now starts in 2029, because only 131 of 280 acres have been bought. “${quote}…” ${src}.`
          : `Top result: Saffron Motors pushes its second EV plant back by a year (${me.name}, Twofold, today). Key fact: start moved from 2028 to 2029 after land purchases stalled. ${src}.`
      t.status = 'done'
      setTurns([...out])
      note(`${DEMO_AGENTS[agent.key].name} paid ${inr(t.paid || 0, { decimals: true })} and quoted the story with credit and a link.`)
      await wait(700)
    }
    setPhase('done')
    note('Every use is on Riya’s earnings dashboard, split into people and AI.')
  }

  const storyEvents = work ? events.filter((e) => e.workId === work.id) : []
  const human = storyEvents.filter((e) => e.buyerKind === 'human').reduce((a, e) => a + e.amount, 0) * CREATOR_SHARE
  const ai = storyEvents.filter((e) => e.buyerKind === 'ai').reduce((a, e) => a + e.amount, 0) * CREATOR_SHARE
  const feed = works.slice(0, 5)

  const STEPS = ['Publish and seal', 'Live on home page', 'Readers buy', 'Agents find, pay, quote', 'Creator is paid']
  const stepOn = phase === 'idle' ? -1 : phase === 'publishing' ? 0 : phase === 'published' ? 2 : phase === 'agents' ? 3 : 4

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.01em]">Live demo: one new story, three AI agents</h1>
          <p className="text-[14.5px] text-ink-2 max-w-[760px] mt-1">Press run. Riya publishes a new exclusive, it appears on the reader home page, readers buy it, then three AI agents find it through the MCP server, pay to quote it and answer their users with credit. Open the <a className="underline" href="#/" target="_blank" rel="noreferrer">reader home page in another tab</a> to watch it arrive.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={run} disabled={phase === 'publishing' || phase === 'agents' || phase === 'published'}>
            {phase === 'idle' ? 'Run the demo' : phase === 'done' ? 'Run it again' : 'Running…'}
          </Button>
          {work && <Button variant="secondary" onClick={() => { location.hash = `/work/${work.id}` }}>Open the story</Button>}
        </div>
      </div>

      <ol className="grid grid-cols-2 md:grid-cols-5 gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={cx('rounded-[10px] border px-3 py-2.5 text-[13.5px] flex items-center gap-2', i <= stepOn ? 'border-ink bg-surface' : 'border-line text-muted')}>
            <span className={cx('w-5 h-5 rounded-full grid place-items-center text-[11.5px] font-semibold shrink-0', i < stepOn || phase === 'done' ? 'bg-good text-white' : i === stepOn ? 'bg-ink text-white' : 'bg-line text-ink-2')}>{i < stepOn || phase === 'done' ? '✓' : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-5 items-start">
        <div className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
          <section className="panel p-4" aria-label="Reader home page, live">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[14.5px] font-semibold">Reader home page</h2>
              <span className="text-[12px] text-muted flex items-center gap-1.5"><Icon.live /> live</span>
            </div>
            <ul className="divide-y divide-line-2">
              {feed.map((w) => (
                <li key={w.id} className={cx('py-2.5', work && w.id === work.id && 'arrive rounded-[8px] px-2 -mx-2')}>
                  <p className="text-[12px] text-human-ink font-medium">{w.section}{work && w.id === work.id ? ', just published' : ''}</p>
                  <a href={`#/work/${w.id}`} className="font-serif text-[15.5px] leading-snug hover:underline block">{w.title}</a>
                  <p className="text-[12px] text-muted mt-0.5">{creators[w.creatorId].name}, {w.live ? ago(w.publishedAt) : new Date(w.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {w.licence.uses.read.permission === 'free' ? 'free' : `${inr(w.licence.uses.read.price)} to read`}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-4" aria-label="Earnings from this story">
            <h2 className="text-[14.5px] font-semibold">Riya’s earnings from this story</h2>
            <p className="text-[30px] font-semibold num mt-1">{inr(Math.round((human + ai) * 100) / 100, { decimals: true })}</p>
            <div className="flex justify-between text-[13px] mt-1 num">
              <span className="flex items-center gap-1"><Icon.person className="text-human" /> People {inr(Math.round(human * 100) / 100, { decimals: true })}</span>
              <span className="flex items-center gap-1">AI {inr(Math.round(ai * 100) / 100, { decimals: true })} <Icon.machine className="text-machine" /></span>
            </div>
            <p className="text-[12px] text-muted mt-2">Her 85% share. {work?.estimate && `Estimate for the first 30 days: ${inr(work.estimate.low)}–${inr(work.estimate.high)}.`}</p>
            {phase === 'done' && <a href="#/studio/earnings" className="inline-block mt-3 text-[13.5px] font-medium underline">See it on the full dashboard</a>}
          </section>

          {log.length > 0 && (
            <section className="panel p-4" aria-label="What just happened">
              <h2 className="text-[14.5px] font-semibold mb-2">What just happened</h2>
              <ol className="space-y-1.5 text-[13px] text-ink-2 list-decimal pl-4">{log.map((l, i) => <li key={i}>{l}</li>)}</ol>
            </section>
          )}
        </div>

        <section aria-label="Agent threads" className="flex flex-col gap-4 min-w-0">
          {!turns.length && (
            <div className="panel p-8 text-center text-ink-2">
              <Icon.machine className="text-machine mx-auto w-6 h-6" />
              <p className="mt-2 text-[15px]">Agent conversations appear here once the story is live.</p>
              <p className="text-[13px] text-muted mt-1">{serverOnline === false ? 'The server is offline, so calls run through the same MCP logic in your browser.' : 'Calls go to this site’s real MCP server.'}</p>
            </div>
          )}
          {turns.map((t, i) => {
            const a = DEMO_AGENTS[t.agent.key]
            return (
              <article key={i} className="panel p-4 seal-in" style={{ animationDuration: '.3s' }}>
                <header className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-full bg-machine-wash text-machine grid place-items-center"><Icon.machine /></span>
                  <span className="font-semibold text-[14.5px]">{a.name}</span>
                  <span className="text-[12.5px] text-muted">{t.agent.key === 'demo-finpilot' ? 'trading agent' : t.agent.key === 'demo-lumen' ? 'chat assistant' : 'AI search'}</span>
                  <span className="ml-auto">{t.status === 'running' ? <Badge tone="wait">working</Badge> : <Badge tone="good">paid {inr(t.paid || 0, { decimals: true })}</Badge>}</span>
                </header>
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-[14px] rounded-br-[4px] bg-ink text-white px-3.5 py-2 text-[14px]"><span className="block text-[11.5px] text-white/60">A user asks</span>{t.agent.question}</p>
                </div>
                <ol className="mt-3 space-y-1.5">
                  {t.steps.map((s, j) => (
                    <li key={j}>
                      <details className="group">
                        <summary className="list-none cursor-pointer flex items-center gap-2 text-[13px]">
                          <span className="machine !text-[12px] bg-line-2 rounded-[6px] px-1.5 py-0.5">{s.tool}</span>
                          <span className="text-ink-2">{s.label}</span>
                          <span className={cx('ml-auto text-[12px] font-medium', s.tone === 'pay' ? 'text-machine-ink' : s.tone === 'wait' ? 'text-wait' : 'text-good')}>{s.tone === 'pay' ? 'paid' : s.tone === 'wait' ? '402' : 'free'}</span>
                          <span className="text-muted group-open:rotate-90 transition-transform">›</span>
                        </summary>
                        <div className="mt-1.5 rounded-[8px] bg-[#f7f8fc] p-2 max-h-56 overflow-auto">
                          <JsonView className="text-muted" value={s.req} />
                          <JsonView className="mt-1" value={s.res} />
                        </div>
                      </details>
                    </li>
                  ))}
                </ol>
                {t.answer && (
                  <div className="mt-3 flex gap-2">
                    <span className="w-7 h-7 rounded-full bg-machine text-white grid place-items-center shrink-0"><Icon.machine /></span>
                    <div className="rounded-[14px] rounded-tl-[4px] bg-machine-wash px-3.5 py-2.5 text-[14px] leading-relaxed">
                      {t.answer}
                      <div className="flex items-center gap-2 mt-2 text-[12px] text-machine-ink">
                        <Avatar name={me.name} hue={me.avatarHue} size={18} /> Credited and linked; quote capped at 40 words by the licence.
                      </div>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}
