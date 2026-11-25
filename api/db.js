// Read the accounts database. Views:
//   ?view=human   human replica  (public: what people see)
//   ?view=agent   agent replica  (needs an agent key: Authorization: Bearer demo-…)
//   ?view=master  master         (emails masked unless x-admin-key matches ADMIN_KEY)
//   ?view=log     replication log
// /api/accounts is rewritten here (vercel.json) so writes and reads share one function,
// which matters when there is no Redis and the store is the function's memory.
import { readView } from './_lib/db.mjs'
import { isAdmin } from './_lib/admin.mjs'
import { cors } from './_lib/http.mjs'
import accounts from './_lib/accounts.mjs'

const AGENT_KEYS = new Set(['demo-finpilot', 'demo-lumen', 'demo-kestrel', 'demo-halcyon'])

export default async function handler(req, res) {
  cors(res)
  res.setHeader('access-control-allow-headers', 'content-type, authorization, x-admin-key')
  res.setHeader('cache-control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.query?.resource === 'accounts') return accounts(req, res)
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' })
  const view = String(req.query?.view || 'human')
  if (!['human', 'agent', 'master', 'log'].includes(view)) return res.status(400).json({ error: 'view must be human, agent, master or log' })
  if (view === 'agent') {
    const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!AGENT_KEYS.has(bearer)) return res.status(401).json({ error: 'Agent replica needs an agent key: Authorization: Bearer demo-finpilot' })
  }
  try {
    const admin = isAdmin(req)
    return res.status(200).json({ ...(await readView(view, { admin })), admin })
  } catch {
    return res.status(500).json({ error: 'Could not reach the database. Try again.' })
  }
}
