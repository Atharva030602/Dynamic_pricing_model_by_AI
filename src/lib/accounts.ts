// Client for the accounts database. Keeps this browser's account ids and delete tokens
// in localStorage (twofold:accounts), never in the shared store.
export type Role = 'reader' | 'creator'
export interface Mine { id: string; deleteToken: string; role: Role; name: string; createdAt: string }
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

/** Fire-and-forget: sign-up never waits for, or fails because of, the database. */
export function registerAccount(role: Role, data: Record<string, unknown>) {
  fetch('/api/accounts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role, ...data }) })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { if (j?.account) remember({ id: j.account.id, deleteToken: j.deleteToken, role, name: j.account.name, createdAt: j.account.joined }) })
    .catch(() => {})
}

export async function deleteMine(role: Role) {
  const m = myAccounts()[role]
  if (!m) return false
  const r = await fetch(`/api/accounts?id=${m.id}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deleteToken: m.deleteToken }) })
  if (r.ok || r.status === 404) forget(role)
  return r.ok
}
