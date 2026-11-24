// Licence model: four uses, each with a permission, a price and conditions.
// The plain-English summary is generated from the same object as the JSON,
// so the two can never disagree (no LLM in this path on purpose).
import type { Valuation } from './valuation'

export type Permission = 'free' | 'paid' | 'ask' | 'no'
export type UseKey = 'read' | 'ai_quote' | 'ai_train' | 'republish'

export interface UseTerms {
  permission: Permission
  price: number // INR; for 'ask' this is the indicative price
  attribution: boolean
  linkBack?: boolean
  maxQuoteWords?: number
  derivatives?: { translation: boolean; summary: boolean; clip: boolean }
  royaltyShare?: number // 0..1, share of derivative earnings paid back
  includedInPass?: boolean
}

export interface Licence {
  presetId: string
  previewWords: number
  exclusiveHours: number // 0 = no exclusive window
  afterWindowReadPrice?: number
  uses: Record<UseKey, UseTerms>
}

export const USE_META: Record<UseKey, { label: string; who: 'human' | 'ai'; unit: string; unitLong: string; blurb: string }> = {
  read: { label: 'A person reads it', who: 'human', unit: 'per reader', unitLong: 'per_reader', blurb: 'Readers, analysts and subscribers opening the full piece.' },
  ai_quote: { label: 'An AI quotes or summarises it', who: 'ai', unit: 'per answer', unitLong: 'per_answer', blurb: 'Assistants and AI search using it to answer someone’s question.' },
  ai_train: { label: 'An AI company trains a model on it', who: 'ai', unit: 'per model', unitLong: 'per_model', blurb: 'Your work becomes part of a model for good. Can’t be undone.' },
  republish: { label: 'Someone republishes or remixes it', who: 'human', unit: 'per republication', unitLong: 'per_republication', blurb: 'Other outlets, translations, clips and summaries built on it.' },
}

export const PERMISSION_LABEL: Record<Permission, string> = { free: 'Free', paid: 'Paid', ask: 'Ask me', no: 'Not allowed' }

export interface Preset { id: string; name: string; tagline: string; recommendedFor: string }
export const PRESETS: Preset[] = [
  { id: 'paid_both', name: 'Paid for people and machines', tagline: 'Readers pay a little, AI pays per answer, training needs your OK', recommendedFor: 'news' },
  { id: 'no_training', name: 'Keep me out of AI training', tagline: 'Readers and AI answers allowed; no model training at any price', recommendedFor: 'personal voice' },
  { id: 'reach', name: 'Maximum reach', tagline: 'Free for people, paid for AI, free to share with credit', recommendedFor: 'audience growth' },
  { id: 'exclusive', name: 'Exclusive window', tagline: 'Premium price for 48 hours, then it drops', recommendedFor: 'scoops' },
]

export function buildLicence(presetId: string, v: Valuation): Licence {
  const p = v.prices
  const read = Math.max(p.read, 0)
  const base: Licence = {
    presetId,
    previewWords: 80,
    exclusiveHours: 0,
    uses: {
      read: { permission: read > 0 ? 'paid' : 'free', price: read, attribution: true, includedInPass: true },
      ai_quote: { permission: 'paid', price: p.quote, attribution: true, linkBack: true, maxQuoteWords: 40 },
      ai_train: { permission: 'ask', price: p.train, attribution: false },
      republish: { permission: 'paid', price: p.republish, attribution: true, derivatives: { translation: true, summary: true, clip: true }, royaltyShare: 0.3 },
    },
  }
  if (presetId === 'no_training') base.uses.ai_train = { ...base.uses.ai_train, permission: 'no' }
  if (presetId === 'reach') {
    base.uses.read = { ...base.uses.read, permission: 'free', price: 0 }
    base.uses.republish = { ...base.uses.republish, permission: 'free', price: 0, royaltyShare: 0.15 }
    base.uses.ai_quote = { ...base.uses.ai_quote, price: Math.max(0.5, Math.round(p.quote * 0.7 * 10) / 10) }
  }
  if (presetId === 'exclusive') {
    base.exclusiveHours = 48
    base.afterWindowReadPrice = Math.max(3, Math.round(read * 0.4))
    base.uses.read = { ...base.uses.read, price: Math.round(read * 1.5), includedInPass: false }
    base.uses.ai_quote = { ...base.uses.ai_quote, price: Math.round(p.quote * 2 * 10) / 10 }
    base.uses.ai_train = { ...base.uses.ai_train, permission: 'no' }
    base.uses.republish = { ...base.uses.republish, permission: 'ask' }
  }
  return base
}

export const inr = (n: number, opts: { decimals?: boolean } = {}) => {
  if (n === 0) return '₹0'
  const d = opts.decimals || (n < 10 && n % 1 !== 0)
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: d ? (n % 1 ? 2 : 0) : 0, maximumFractionDigits: d ? 2 : 0 })
}

function priceText(u: UseTerms, unit: string) {
  if (u.permission === 'free') return 'free'
  if (u.permission === 'no') return 'not allowed'
  if (u.permission === 'ask') return `only with your written OK (you suggest about ${inr(u.price)} ${unit})`
  return `${inr(u.price)} ${unit}`
}

/** One paragraph, plain English, generated from the licence object. */
export function summarise(l: Licence, creatorFirstName: string): string {
  const { read, ai_quote, ai_train, republish } = l.uses
  const parts: string[] = []

  // Readers
  if (read.permission === 'free') parts.push(`Anyone can read this for free.`)
  else if (read.permission === 'paid') {
    let s = `Anyone can read the first ${l.previewWords} words free; the full piece costs ${inr(read.price)}`
    if (read.includedInPass) s += ' (free for Twofold Pass members)'
    if (l.exclusiveHours && l.afterWindowReadPrice) s += `, dropping to ${inr(l.afterWindowReadPrice)} after ${l.exclusiveHours} hours`
    parts.push(s + '.')
  } else if (read.permission === 'ask') parts.push(`Readers must ask ${creatorFirstName} for access.`)
  else parts.push(`It is not open to readers.`)

  // AI answers
  if (ai_quote.permission === 'no') parts.push(`AI assistants and AI search may not quote or summarise it.`)
  else if (ai_quote.permission === 'ask') parts.push(`AI assistants need ${creatorFirstName}’s permission before quoting or summarising it.`)
  else {
    let s = `AI assistants and AI search may quote or summarise it in answers for ${priceText(ai_quote, 'each answer')}`
    const conds: string[] = []
    if (ai_quote.maxQuoteWords) conds.push(`quote no more than ${ai_quote.maxQuoteWords} words`)
    if (ai_quote.attribution) conds.push(`name ${creatorFirstName} as the source`)
    if (ai_quote.linkBack) conds.push('link back here')
    if (conds.length) s += `, as long as they ${joinAnd(conds)}`
    parts.push(s + '.')
  }

  // Training
  if (ai_train.permission === 'no') parts.push(`No one may train an AI model on it.`)
  else if (ai_train.permission === 'ask') parts.push(`Training an AI model on it needs ${creatorFirstName}’s written OK first (suggested fee about ${inr(ai_train.price)} per model).`)
  else if (ai_train.permission === 'free') parts.push(`AI companies may train models on it for free.`)
  else parts.push(`AI companies may train a model on it for a one-time ${inr(ai_train.price)} per model.`)

  // Republish
  if (republish.permission === 'no') parts.push(`It may not be republished or remixed.`)
  else if (republish.permission === 'ask') parts.push(`Republishing or remixing needs ${creatorFirstName}’s permission.`)
  else {
    const kinds = republish.derivatives ? Object.entries(republish.derivatives).filter(([, v]) => v).map(([k]) => (k === 'clip' ? 'clips' : k === 'summary' ? 'summaries' : 'translations')) : []
    let s = `Others may republish it ${republish.permission === 'free' ? 'for free' : `for ${inr(republish.price)}`}${republish.attribution ? ' with credit' : ''}`
    if (kinds.length) s += `, and make ${joinAnd(kinds)} that pay ${Math.round((republish.royaltyShare || 0) * 100)}% of their earnings back`
    parts.push(s + '.')
  }
  return parts.join(' ')
}

function joinAnd(xs: string[]) {
  if (xs.length <= 1) return xs.join('')
  return xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]
}

export interface WorkRef {
  id: string
  title: string
  creator: { id: string; name: string; url: string }
  publishedAt?: string
  contentHash?: string
  disclosure: { origin: string; aiAssistance: string[] }
}

/** Machine-readable licence (inspired by RSL usage tokens; our own schema). */
export function toMachineJson(l: Licence, w: WorkRef, host = 'https://twofold.app') {
  const use = (k: UseKey) => {
    const u = l.uses[k]
    const o: Record<string, unknown> = { permission: u.permission }
    if (u.permission === 'paid') o.price = { amount: u.price, currency: 'INR', unit: USE_META[k].unitLong }
    if (u.permission === 'ask') o.indicative_price = { amount: u.price, currency: 'INR', unit: USE_META[k].unitLong }
    const c: Record<string, unknown> = {}
    if (u.permission !== 'no') {
      if (u.attribution) c.attribution = 'required'
      if (u.linkBack) c.link_back = 'required'
      if (u.maxQuoteWords) c.max_quote_words = u.maxQuoteWords
      if (u.derivatives) c.derivatives = Object.entries(u.derivatives).filter(([, v]) => v).map(([k]) => k)
      if (u.royaltyShare) c.royalty_share = u.royaltyShare
      if (u.includedInPass) c.included_in = ['twofold_pass']
    }
    if (Object.keys(c).length) o.conditions = c
    if (u.permission === 'ask') o.request = { mcp_tool: 'request_licence', contact: `${host}/@${w.creator.id}` }
    return o
  }
  return {
    schema: `${host}/licence/v1`,
    work_id: w.id,
    uses: { read: use('read'), ai_quote: use('ai_quote'), ai_train: use('ai_train'), republish: use('republish') },
    free_preview: { words: l.previewWords },
    ...(l.exclusiveHours ? { exclusive_window: { hours: l.exclusiveHours, read_price_after: l.afterWindowReadPrice } } : {}),
    work: {
      title: w.title,
      creator: w.creator,
      published_at: w.publishedAt || null,
      content_hash: w.contentHash || null,
      origin: w.disclosure.origin,
      ai_assistance: w.disclosure.aiAssistance,
    },
    access: {
      mcp: `${host}/api/mcp`,
      tools: ['search_works', 'get_work_preview', 'get_full_work', 'purchase_licence'],
      http: { full_text_without_licence: 402 },
    },
    verify: `${host}/#/work/${w.id}?verify=1`,
  }
}
