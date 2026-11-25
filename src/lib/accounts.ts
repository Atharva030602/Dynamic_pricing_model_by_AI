// Client for the accounts database. This browser keeps its account ids, session tokens and
// delete tokens in localStorage (twofold:accounts), never in the shared store.
export type Role = 'reader' | 'creator'
export interface Mine { id: string; deleteToken: string; sessionToken?: string; role: Role; name: string; createdAt: string }
/** The owner's own record, as the server returns it after sign-up or sign-in (no hashes). */
export type PrivateAccount = Record<string, unknown> & { id: string; role: Role; name: string; handle: string; email: string; createdAt: string }
const KEY = 'twofold:accounts'

export function myAccounts(): Partial<Record<Role, Mine>> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function remember(m: Mine) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...myAccounts(), [m.role]: m })) } catch { /* quota */ }
}
export function forget(role: Role) {
  const all = myAccounts(); delete all[role]
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* quota */ }
}

async function post(body: Record<string, unknown>) {
  const r = await fetch('/api/accounts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  return { ok: r.ok, status: r.status, j }
}

export type Result = { ok: true; account: PrivateAccount } | { ok: false; status: number; error: string }

/** Create an account in the master database. status 0 means the server could not be reached. */
export async function createAccount(role: Role, data: Record<string, unknown>): Promise<Result> {
  try {
    const { ok, status, j } = await post({ role, ...data })
    if (!ok) return { ok: false, status, error: j.error || 'Could not create the account.' }
    remember({ id: j.account.id, deleteToken: j.deleteToken, sessionToken: j.sessionToken, role, name: j.account.name, createdAt: j.account.joined })
    return { ok: true, account: j.private }
  } catch { return { ok: false, status: 0, error: 'Could not reach Twofold. Check your connection and try again.' } }
}

export async function signIn(role: Role, email: string, password: string): Promise<Result> {
  try {
    const { ok, status, j } = await post({ action: 'login', role, email, password })
    if (!ok) return { ok: false, status, error: j.error || 'Could not sign in.' }
    const a = j.private as PrivateAccount
    remember({ id: a.id, deleteToken: j.deleteToken, sessionToken: j.sessionToken, role, name: a.name, createdAt: a.createdAt })
    return { ok: true, account: a }
  } catch { return { ok: false, status: 0, error: 'Could not reach Twofold. Check your connection and try again.' } }
}

let timer: ReturnType<typeof setTimeout> | undefined
/** Saved stories follow the signed-in reader to any device. Debounced; silent on failure. */
export function syncSaved(saved: string[]) {
  const me = myAccounts().reader
  if (!me?.sessionToken) return
  clearTimeout(timer)
  timer = setTimeout(() => { post({ action: 'saved', id: me.id, sessionToken: me.sessionToken, saved }).catch(() => {}) }, 600)
}

export async function deleteMine(role: Role) {
  const m = myAccounts()[role]
  if (!m) return false
  const r = await fetch(`/api/accounts?id=${m.id}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deleteToken: m.deleteToken }) })
  if (r.ok || r.status === 404) forget(role)
  return r.ok
}
