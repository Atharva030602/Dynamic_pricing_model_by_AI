import type { UsageEvent } from '../data/seed'
import type { Work } from '../store'
import { useStore } from '../store'
import { cx } from '../ui/kit'

/* Audience analytics. Reader demographics come from readers who chose to share them
   in their profile; in the prototype they are simulated deterministically per creator. */

function seeded(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296
}
function split(labels: string[], base: number[], rnd: () => number) {
  const w = base.map((b) => b * (0.8 + rnd() * 0.4))
  const s = w.reduce((a, b) => a + b, 0)
  const pct = w.map((x) => Math.round((x / s) * 100))
  pct[0] += 100 - pct.reduce((a, b) => a + b, 0)
  return labels.map((l, i) => ({ label: l, pct: pct[i] }))
}

const DOMAIN: Record<string, string> = { 'AI assistant': 'General assistants', 'AI search': 'Search and answers', 'Trading agent': 'Finance', 'Model builder': 'Model training', 'AI summariser': 'News digests' }

export function AudiencePanel({ evs, works, scope }: { evs: UsageEvent[]; works: Work[]; scope: string }) {
  const { buyers, posts, feed } = useStore()
  const rnd = seeded(scope)
  const readers = evs.filter((e) => e.buyerKind === 'human' && e.use === 'read').reduce((a, e) => a + e.units, 0)
  const regions = split(['Maharashtra', 'Karnataka', 'Delhi NCR', 'Gujarat', 'Tamil Nadu', 'Telangana', 'Rest of India', 'Outside India'], [38, 14, 13, 8, 7, 6, 10, 4], rnd)
  const age = split(['18–24', '25–34', '35–44', '45–54', '55+'], [18, 36, 24, 13, 9], rnd)
  const gender = split(['Women', 'Men', 'Another identity'], [41, 56, 3], rnd)
  const shared = 55 + Math.round(rnd() * 15)
  const fields = split(['Students', 'Finance and business', 'Tech', 'Government and policy', 'Media', 'Other'], [22, 26, 18, 10, 9, 15], rnd)
  const ai = new Map<string, number>()
  for (const e of evs) if (e.buyerKind === 'ai') { const d = DOMAIN[buyers[e.buyerId]?.type] || 'Other AI'; ai.set(d, (ai.get(d) || 0) + e.units) }
  const aiTotal = [...ai.values()].reduce((a, b) => a + b, 0) || 1
  const aiDomains = [...ai.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, pct: Math.round((n / aiTotal) * 100), n })).filter((x) => x.pct > 0)
  const ids = new Set(works.map((w) => w.id))
  const questions = posts.filter((p) => p.workId && ids.has(p.workId))
  const followers = works.map((w) => {
    const d = feed.find((x) => x.id === w.id)
    const reads = evs.filter((e) => e.workId === w.id && e.use === 'read').reduce((a, e) => a + e.units, 0)
    return { w, gained: Math.round(reads * 0.021 + (d?.meta.likes || 0) * 0.012 + (d?.meta.shares || 0) * 0.03) }
  }).sort((a, b) => b.gained - a.gained)
  const totalGained = followers.reduce((a, f) => a + f.gained, 0)

  return (
    <section aria-labelledby="aud-h" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="aud-h" className="text-[20px] font-semibold">Your audience</h2>
        <p className="text-[12.5px] text-muted">{readers.toLocaleString('en-IN')} reads. Demographics from the {shared}% of readers who shared them. Simulated in the prototype.</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Where readers are"><Bars rows={regions} /></Card>
        <Card title="Age groups"><Bars rows={age} /></Card>
        <Card title="Gender">
          <div className="flex h-3 rounded-full overflow-hidden gap-[2px]" role="img" aria-label={gender.map((g) => `${g.label} ${g.pct}%`).join(', ')}>
            {gender.map((g, i) => <span key={g.label} className={cx(['bg-human', 'bg-machine', 'bg-good'][i])} style={{ width: `${g.pct}%` }} />)}
          </div>
          <ul className="mt-3 space-y-1.5 text-[14px]">
            {gender.map((g, i) => <li key={g.label} className="flex items-center gap-2"><span className={cx('w-2.5 h-2.5 rounded-sm', ['bg-human', 'bg-machine', 'bg-good'][i])} />{g.label}<span className="ml-auto tab font-semibold">{g.pct}%</span></li>)}
          </ul>
          <p className="text-[12px] text-muted mt-3">Readers choose whether to share this. We never infer it.</p>
        </Card>
        <Card title="What your readers do"><Bars rows={fields} /></Card>
        <Card title="Fields your AI buyers work in">{aiDomains.length ? <Bars rows={aiDomains} tone="machine" /> : <p className="text-[14px] text-muted">No AI use yet.</p>}</Card>
        <Card title={`Followers gained since each post (${totalGained.toLocaleString('en-IN')} total)`}>
          <ul className="space-y-2">
            {followers.slice(0, 5).map(({ w, gained }) => (
              <li key={w.id} className="flex items-start gap-3 text-[13.5px]"><span className="flex-1 leading-snug line-clamp-2">{w.title}</span><span className="tab font-semibold text-good shrink-0">+{gained}</span></li>
            ))}
            {!followers.length && <li className="text-[14px] text-muted">Publish to start gaining followers.</li>}
          </ul>
        </Card>
      </div>
      <Card title={`Questions readers asked about your work (${questions.length})`}>
        {questions.length ? (
          <ul className="divide-y divide-line-2">
            {questions.map((q) => (
              <li key={q.id}><a href={`#/community?p=${q.id}`} className="flex items-start gap-3 py-2.5 group">
                <span className="text-[12px] font-semibold text-human-ink w-20 shrink-0 pt-0.5">{q.tag}</span>
                <span className="flex-1 text-[14.5px] group-hover:underline">{q.title}</span>
                <span className="text-[12.5px] text-muted shrink-0">{q.replies.length} replies</span>
              </a></li>
            ))}
          </ul>
        ) : <p className="text-[14px] text-muted">None yet. Questions linked to your pieces in the community appear here, so you can answer them.</p>}
      </Card>
    </section>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="panel p-5"><h3 className="text-[14.5px] font-semibold mb-3">{title}</h3>{children}</div>
}
function Bars({ rows, tone = 'ink' }: { rows: { label: string; pct: number }[]; tone?: 'ink' | 'machine' }) {
  const max = Math.max(1, ...rows.map((r) => r.pct))
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[156px_1fr_36px] items-center gap-2 text-[13.5px]">
          <span className="truncate">{r.label}</span>
          <span className="h-2 rounded-full bg-line-2 overflow-hidden"><span className={cx('block h-full rounded-full', tone === 'machine' ? 'bg-machine' : 'bg-ink')} style={{ width: `${(r.pct / max) * 100}%` }} /></span>
          <span className="tab text-right font-medium">{r.pct}%</span>
        </li>
      ))}
    </ul>
  )
}
