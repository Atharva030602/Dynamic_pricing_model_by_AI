import { listEvents, listWorks, storeKind } from './_lib/store.mjs'
import { cors } from './_lib/http.mjs'

export default async function handler(req, res) {
  cors(res)
  res.setHeader('cache-control', 'no-store')
  const [works, events] = await Promise.all([listWorks().catch(() => []), listEvents().catch(() => [])])
  res.status(200).json({ works, events, store: storeKind })
}
