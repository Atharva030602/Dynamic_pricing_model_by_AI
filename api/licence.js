// Machine-readable licence for one work (/api/licence/<id>) or an index of all works.
import { SEED as RAW_SEED, SEED_SEALS, CREATORS, toMachineJson } from './_lib/core.mjs'
const SEED = RAW_SEED.map((w) => ({ ...w, seal: SEED_SEALS[w.id] }))
import { listWorks } from './_lib/store.mjs'
import { cors, hostOf } from './_lib/http.mjs'

export default async function handler(req, res) {
  cors(res)
  const host = hostOf(req)
  const id = req.query?.id || new URL(req.url, host).searchParams.get('id')
  const published = await listWorks().catch(() => [])
  const all = [...published, ...SEED]
  if (!id) return res.status(200).json({ licences: all.map((w) => ({ work_id: w.id, title: w.title, url: `${host}/api/licence/${w.id}` })) })
  const w = all.find((x) => x.id === id)
  if (!w) return res.status(404).json({ error: 'not_found' })
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.status(200).send(JSON.stringify(toMachineJson(w.licence, { id: w.id, title: w.title, creator: { id: w.creatorId, name: CREATORS[w.creatorId]?.name, url: `${host}/#/@${w.creatorId}` }, publishedAt: w.publishedAt, contentHash: w.seal?.contentHash, disclosure: { origin: w.disclosure, aiAssistance: w.aiUses } }, host), null, 2))
}
