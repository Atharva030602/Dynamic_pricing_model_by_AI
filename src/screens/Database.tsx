import { useEffect, useState } from 'react'
import { Badge, Button, JsonView, Segmented, ago, cx } from '../ui/kit'
import { deleteMine, myAccounts, type Role } from '../lib/accounts'

type View = 'master' | 'human' | 'agent' | 'log'
interface Status { store: string; master_lsn: number; accounts: number; replicas: Record<'human' | 'agent', { lsn: number; lag: number; rows: number; healed: number }> }
type Row = Record<string, unknown>

const VIEWS: { value: View; label: string }[] = [
  { value: 'master', label: 'Master' }, { value: 'human', label: 'Human replica' }, { value: 'agent', label: 'Agent replica' }, { value: 'log', label: 'Replication log' },
]
const ABOUT: Record<View, string> = {
  master: 'Source of truth. Every write lands here first and gets a log sequence number (LSN). Emails are masked unless you send the admin key.',
  human: 'Read replica for people: name, handle, city, interests. No email, no tokens. Public.',
  agent: 'Read replica for AI agents: creators only, no contact details, with default AI terms. Needs an agent key; also served by the MCP tool list_creators.',
  log: 'Every insert and delete in order. Replicas replay it; a replica that falls behind heals itself on the next read.',
}
const STORE: Record<string, string> = { redis: 'Upstash Redis (persistent)', file: 'Local file .data/twofold-db.json', memory: 'Server memory (resets on redeploy: connect Upstash Redis in Vercel to keep it)' }

export default function Database() {
  const [view, setView] = useState<View>('master')
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [masked, setMasked] = useState(false)
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('tf-admin') || '')
  const [open, setOpen] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [mine, setMine] = useState(myAccounts())
  const [manifest, setManifest] = useState<Record<string, unknown> | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let live = true
    const headers: Record<string, string> = {}
    if (view === 'agent') headers.authorization = 'Bearer demo-finpilot'
    if (adminKey) headers['x-admin-key'] = adminKey
    const load = () => fetch(`/api/db?view=${view}`, { headers }).then((r) => r.json()).then((j) => {
      if (!live) return
      if (j.error) { setErr(j.error); return }
      setErr(''); setRows(j.rows || []); setStatus(j.status); setMasked(!!j.masked); setMine(myAccounts())
    }).catch(() => live && setErr('Could not reach /api/db. Is the API running?'))
    load()
    const t = setInterval(load, 3000)
    return () => { live = false; clearInterval(t) }
  }, [view, adminKey, tick])

  const me = mine.creator || mine.reader
  useEffect(() => {
    if (!me) { setManifest(null); return }
    fetch(`/api/accounts?id=${me.id}`).then((r) => (r.ok ? r.json() : null)).then(setManifest).catch(() => setManifest(null))
  }, [me?.id, tick])

  const idOf = (r: Row) => String(r.id || r.creator_id || r.lsn)
  const cols: Record<View, string[]> = {
    master: ['id', 'role', 'name', 'email', 'city', 'region', 'createdAt'],
    human: ['id', 'role', 'name', 'handle', 'city', 'interests', 'joined'],
    agent: ['creator_id', 'handle', 'country', 'beat', 'formats', 'ai_terms', 'joined'],
    log: ['lsn', 'op', 'id', 'role', 'name', 'ts'],
  }
  const cell = (k: string, v: unknown) => {
    if (v == null || v === '') return <span className="text-faint">—</span>
    if (k === 'createdAt' || k === 'joined' || k === 'ts') return <span title={String(v)}>{ago(String(v))}</span>
    if (k === 'region' && typeof v === 'object') { const r = v as Row; return [r.region, r.country].filter(Boolean).join(', ') || '—' }
    if (k === 'ai_terms' && typeof v === 'object') return String((v as Row).ai_training)
    if (Array.isArray(v)) return v.slice(0, 3).join(', ')
    if (k === 'role') return <Badge tone={v === 'creator' ? 'machine' : 'human'}>{String(v)}</Badge>
    if (k === 'op') return <Badge tone={v === 'delete' ? 'bad' : 'good'}>{String(v)}</Badge>
    return String(v)
  }

  return (
    <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-8">
      <h1 className="font-serif text-[34px] font-medium leading-tight">Accounts database</h1>
      <p className="text-[15px] text-ink-2 mt-1 max-w-[760px]">One master and two read replicas. Create an account in another tab and watch it arrive here; this page refreshes every 3 seconds.</p>

      {status && (
        <div className="grid sm:grid-cols-3 gap-3 mt-6">
          <Stat label="Master" big={`${status.accounts} accounts`} sub={`LSN ${status.master_lsn} · ${STORE[status.store] || status.store}`} />
          {(['human', 'agent'] as const).map((k) => (
            <Stat key={k} label={k === 'human' ? 'Human replica' : 'Agent replica'} big={`${status.replicas[k].rows} rows`}
              sub={`LSN ${status.replicas[k].lsn} · ${status.replicas[k].lag === 0 ? 'in sync' : `${status.replicas[k].lag} behind`}${status.replicas[k].healed ? ` · healed ${status.replicas[k].healed}` : ''}`} good={status.replicas[k].lag === 0} />
          ))}
        </div>
      )}
      {status?.store === 'memory' && <p className="mt-3 text-[13px] text-bad">This deployment has no persistent store yet, so accounts reset when the server restarts. Connect Upstash Redis to the Vercel project to keep them.</p>}

      {me && (
        <section className="mt-6 rounded-[14px] border border-line p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-[22px] font-medium">What we stored about you</h2>
            <Badge tone="human">{me.role}</Badge>
            <span className="text-[13px] text-muted font-mono">{me.id}</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => setTick((t) => t + 1)}>Refresh</Button>
              <Button size="sm" onClick={async () => { if (confirm('Delete this account from the master and both replicas? This cannot be undone.')) { await deleteMine(me.role as Role); setTick((t) => t + 1) } }}>Delete my account</Button>
            </div>
          </div>
          {manifest ? <JsonView value={manifest} className="mt-3 text-[12.5px] max-h-[360px] overflow-auto rounded-[10px] bg-line-2/50 p-3" />
            : <p className="text-[14px] text-muted mt-2">Not found in the database. It may have been deleted, or the server restarted without a persistent store.</p>}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-8">
        <Segmented value={view} options={VIEWS} onChange={(v) => { setView(v); setOpen(null) }} label="Database view" />
        {view === 'master' && (
          <label className="flex items-center gap-2 text-[13px] text-ink-2 ml-auto">Admin key
            <input type="password" value={adminKey} onChange={(e) => { setAdminKey(e.target.value); sessionStorage.setItem('tf-admin', e.target.value) }} placeholder="shows full emails" className="h-8 w-48 rounded-[8px] border border-line px-2 text-[13px]" />
          </label>
        )}
      </div>
      <p className="text-[13.5px] text-muted mt-2">{ABOUT[view]}{view === 'master' && masked ? ' Showing masked emails.' : ''}</p>
      {err && <p className="mt-3 text-[14px] text-bad">{err}</p>}

      <div className="mt-4 rounded-[14px] border border-line overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead><tr className="bg-ink text-white text-left">{cols[view].map((c) => <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={cols[view].length} className="px-3 py-6 text-muted">No rows yet. Create a reader account at /welcome or a creator account at /creator/join.</td></tr>}
            {rows.map((r) => (
              <FragmentRow key={idOf(r)} r={r} cols={cols[view]} cell={cell} open={open === idOf(r)} mineId={me?.id} onToggle={() => setOpen(open === idOf(r) ? null : idOf(r))} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12.5px] text-muted mt-3 font-mono">GET /api/db?view=human · GET /api/db?view=agent (Bearer demo-finpilot) · GET /api/db?view=master (x-admin-key) · MCP tool list_creators</p>
    </div>
  )
}

function FragmentRow({ r, cols, cell, open, onToggle, mineId }: { r: Row; cols: string[]; cell: (k: string, v: unknown) => React.ReactNode; open: boolean; onToggle: () => void; mineId?: string }) {
  const isMine = mineId && (r.id === mineId || r.creator_id === mineId)
  return (
    <>
      <tr onClick={onToggle} className={cx('border-t border-line-2 cursor-pointer hover:bg-line-2/60', isMine && 'bg-human-wash/60')}>
        {cols.map((c) => <td key={c} className={cx('px-3 py-2 align-top max-w-[240px] truncate', (c === 'id' || c === 'creator_id') && 'font-mono text-[12px]')}>{cell(c, r[c])}{c === cols[0] && isMine ? ' (you)' : ''}</td>)}
      </tr>
      {open && <tr><td colSpan={cols.length} className="px-3 pb-3"><JsonView value={r} className="text-[12px] rounded-[10px] bg-line-2/50 p-3 max-h-[320px] overflow-auto" /></td></tr>}
    </>
  )
}

function Stat({ label, big, sub, good }: { label: string; big: string; sub: string; good?: boolean }) {
  return (
    <div className="rounded-[14px] border border-line p-4">
      <p className="text-[12.5px] text-muted font-semibold">{label}</p>
      <p className="text-[24px] font-semibold mt-1">{big}</p>
      <p className={cx('text-[12.5px] mt-1', good === false ? 'text-bad' : good ? 'text-good' : 'text-muted')}>{sub}</p>
    </div>
  )
}
