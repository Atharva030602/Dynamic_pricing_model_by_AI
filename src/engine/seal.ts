// Provenance: fingerprint (SHA-256) + creator signature (ECDSA P-256) via WebCrypto.
// Works in browsers and Node 20+ (globalThis.crypto.subtle).

const subtle = () => globalThis.crypto.subtle
const enc = new TextEncoder()

export function normalise(text: string) {
  return text.normalize('NFC').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export async function fingerprint(text: string) {
  return 'sha256:' + toHex(await subtle().digest('SHA-256', enc.encode(normalise(text))))
}

export interface SealPayload {
  workId: string
  contentHash: string
  creatorId: string
  signedAt: string
  origin: string
  aiAssistance: string[]
  version: number
  previousHash?: string
}

export interface Seal extends SealPayload {
  signature: string
  publicKey: JsonWebKey
}

export async function generateKeys() {
  const kp = (await subtle().generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair
  return {
    publicJwk: await subtle().exportKey('jwk', kp.publicKey),
    privateJwk: await subtle().exportKey('jwk', kp.privateKey),
  }
}

const canonical = (p: SealPayload) => JSON.stringify([p.workId, p.contentHash, p.creatorId, p.signedAt, p.origin, p.aiAssistance, p.version, p.previousHash || null])

export async function sign(payload: SealPayload, keys: { publicJwk: JsonWebKey; privateJwk: JsonWebKey }): Promise<Seal> {
  const key = await subtle().importKey('jwk', keys.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const sig = await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(canonical(payload)))
  return { ...payload, signature: toB64(sig), publicKey: keys.publicJwk }
}

export async function verifySeal(seal: Seal, text: string) {
  const hashNow = await fingerprint(text)
  const hashMatches = hashNow === seal.contentHash
  let signatureValid = false
  try {
    const key = await subtle().importKey('jwk', seal.publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    signatureValid = await subtle().verify({ name: 'ECDSA', hash: 'SHA-256' }, key, fromB64(seal.signature), enc.encode(canonical(seal)))
  } catch {
    signatureValid = false
  }
  return { hashNow, hashMatches, signatureValid, ok: hashMatches && signatureValid }
}

export const shortHash = (h?: string) => (h ? h.replace('sha256:', '').slice(0, 8) + '…' + h.slice(-6) : '—')

/** Word-level diff (LCS) used by "Check a copy" to show exactly what changed. */
export type DiffPart = { type: 'same' | 'added' | 'removed'; text: string }
export function wordDiff(original: string, copy: string): DiffPart[] {
  const a = normalise(original).split(/(\s+)/).filter((x) => x.length)
  const b = normalise(copy).split(/(\s+)/).filter((x) => x.length)
  const n = a.length, m = b.length
  if (n * m > 4_000_000) return [{ type: 'removed', text: original }, { type: 'added', text: copy }]
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out: DiffPart[] = []
  const push = (type: DiffPart['type'], text: string) => {
    const last = out[out.length - 1]
    if (last && last.type === type) last.text += text
    else out.push({ type, text })
  }
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('removed', a[i]); i++ }
    else { push('added', b[j]); j++ }
  }
  while (i < n) push('removed', a[i++])
  while (j < m) push('added', b[j++])
  return out
}
