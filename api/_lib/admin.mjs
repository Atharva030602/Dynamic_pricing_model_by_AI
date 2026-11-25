import crypto from 'node:crypto'
import { dbKind } from './db.mjs'
// Admin = the ADMIN_KEY env var sent as x-admin-key. On your own machine (file store, no
// ADMIN_KEY set) you are the admin, because the database file is yours anyway.
// strict: only a real key counts (used for deleting someone else's account).
export function isAdmin(req, { strict = false } = {}) {
  const key = process.env.ADMIN_KEY
  if (!key) return !strict && dbKind === 'file'
  const got = Buffer.from(String(req.headers['x-admin-key'] || ''))
  const want = Buffer.from(key)
  return got.length === want.length && crypto.timingSafeEqual(got, want)
}
