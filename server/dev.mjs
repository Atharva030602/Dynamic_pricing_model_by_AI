// Local dev: runs the /api functions on :8787 (Vite proxies /api to it) and starts Vite.
import express from 'express'
import { spawn } from 'node:child_process'
import mcp from '../api/mcp.js'
import feed from '../api/feed.js'
import works from '../api/works.js'
import licence from '../api/licence.js'
import review from '../api/review.js'
import robots from '../api/robots.js'
import insight from '../api/insight.js'
import posts from '../api/posts.js'

const app = express()
app.use(express.json({ limit: '1mb' }))
const wrap = (h) => (req, res) => Promise.resolve(h(req, res)).catch((e) => { console.error(e); res.status(500).json({ error: String(e) }) })
app.all('/api/mcp', wrap(mcp))
app.all('/api/feed', wrap(feed))
app.all('/api/works', wrap(works))
app.get('/api/licence/:id', (req, res, next) => { req.query.id = req.params.id; next() }, wrap(licence))
app.get('/api/licence', wrap(licence))
app.all('/api/review', wrap(review))
app.all('/api/insight', wrap(insight))
app.all('/api/posts', wrap(posts))
app.get('/api/robots', wrap(robots))
app.get('/robots.txt', wrap(robots))
app.listen(8787, () => console.log('api on :8787'))
if (!process.env.API_ONLY) spawn('npx', ['vite', '--port', '5173'], { stdio: 'inherit' })
