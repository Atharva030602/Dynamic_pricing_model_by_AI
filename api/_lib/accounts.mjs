// Accounts: create (POST), read your own stored-data manifest (GET ?id=), delete (DELETE ?id=).
// Writes go to the master; both replicas are updated from the replication log.
import { createAccount, deleteAccount, getManifest, geoFrom, dbKind } from './db.mjs'
import { cors, readJson } from './http.mjs'
import { isAdmin } from './admin.mjs'

export default async function handler(req, res) {
  cors(res)
  res.setHeader('cache-control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    if (req.method === 'POST') {
      const b = await readJson(req).catch(() => ({}))
      return res.status(201).json({ ...(await createAccount(b, geoFrom(req))), store: dbKind })
    }
    const id = String(req.query?.id || '')
    if (req.method === 'GET') {
      if (!/^acc_[a-f0-9]{10}$/.test(id)) return res.status(400).json({ error: 'Pass ?id=acc_…' })
      const m = await getManifest(id)
      return m ? res.status(200).json(m) : res.status(404).json({ error: 'No account with that id.' })
    }
    if (req.method === 'DELETE') {
      const b = await readJson(req).catch(() => ({}))
      return res.status(200).json(await deleteAccount(id, b.deleteToken || req.headers['x-delete-token'], isAdmin(req, { strict: true })))
    }
    return res.status(405).json({ error: 'Use GET, POST or DELETE' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.status ? e.message : 'Could not reach the database. Try again.' })
  }
}
