// Community posts: readers ask questions or share a story into the forum.
import { addPost, listPosts } from './_lib/store.mjs'
import { cors, readJson } from './_lib/http.mjs'

const TAGS = ['Question', 'Discussion', 'Shared news', 'Tip']
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n)

export default async function handler(req, res) {
  cors(res)
  res.setHeader('cache-control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method === 'GET') return res.status(200).json({ posts: await listPosts().catch(() => []) })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use GET or POST' })
  const b = await readJson(req).catch(() => ({}))
  const title = clean(b.title, 160)
  if (title.length < 5) return res.status(400).json({ error: 'Write a title of at least 5 characters.' })
  const post = {
    id: /^up_[a-z0-9]{4,16}$/.test(b.id) ? b.id : `up_${Date.now().toString(36)}`,
    author: clean(b.author, 60) || 'A reader',
    hue: Number.isFinite(b.hue) ? Math.round(b.hue) % 360 : 330,
    tag: TAGS.includes(b.tag) ? b.tag : 'Discussion',
    title,
    body: clean(b.body, 2000),
    workId: /^tf_[a-z0-9_]{3,40}$/.test(b.workId || '') ? b.workId : undefined,
    votes: 1,
    ts: new Date().toISOString(),
    replies: [],
  }
  await addPost(post)
  res.status(201).json({ post })
}
