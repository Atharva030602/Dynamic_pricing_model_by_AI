import { listEvents, listPosts, listWorks, storeKind } from './_lib/store.mjs'
import { cors } from './_lib/http.mjs'

export default async function handler(req, res) {
  cors(res)
  res.setHeader('cache-control', 'no-store')
  const [works, events, posts] = await Promise.all([listWorks().catch(() => []), listEvents().catch(() => []), listPosts().catch(() => [])])
  res.status(200).json({ works, events, posts, store: storeKind })
}
