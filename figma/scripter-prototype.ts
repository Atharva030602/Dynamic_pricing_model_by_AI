/**
 * Twofold: clean the page and wire every imported screen into a clickable prototype.  (v2)
 *
 * How to use
 * 1. Open the page that holds the screens imported from twofold-all.html (or the three separate files).
 * 2. Open the Scripter plugin, paste this whole file, press Run. Run it again any time: it is safe to repeat.
 * 3. Press Present (▶) and pick a flow from the left panel.
 *
 * What it does
 * - Finds every screen by its caption ("D10 … (desktop)"), even when the importer wrapped the caption
 *   or the screen in extra frames, or named layers after their text.
 * - Lifts each screen to the top level as a named frame ("D10 Home, For you …"), sized to the device
 *   (1440×900 or 390×844) with vertical scrolling; overlays keep their own size.
 * - Lays the page out cleanly: design system first, then Reader desktop, Creator desktop and Phone rows,
 *   each screen with its caption. Removes the importer's leftover wrapper only when every screen was lifted.
 * - Wires about 300 interactions on the real buttons and links, plus overlays, tour swaps, timed loading
 *   screens, scroll-to anchors, Esc to close overlays, Backspace to go back, and five flow starting points.
 * - Prints what it found and anything it could not wire.
 */

const VIEWPORT = { desktop: { w: 1440, h: 900 }, phone: { w: 390, h: 844 } }

type Kind = 'NAV' | 'OVERLAY' | 'SWAP' | 'BACK' | 'CLOSE' | 'SCROLL'
type Anim = 'DISSOLVE' | 'SMART' | 'PUSH_LEFT' | 'PUSH_RIGHT' | 'SLIDE_UP' | 'MOVE_IN_BOTTOM' | 'INSTANT'
/** [from screen, text on the hotspot (exact, or /regex/), to screen (or anchor text for SCROLL), kind, animation, nth match] */
type Link = [string, string | RegExp, string, Kind?, Anim?, number?]

// ---------------------------------------------------------------- reader, desktop
const READER: Link[] = [
  ['D01', 'I’m here to read', 'D02', 'NAV', 'PUSH_LEFT'],
  ['D01', 'I write, film or publish data', 'C04', 'NAV', 'PUSH_LEFT'],
  ['D01', 'Start, about 1 minute', 'D02', 'NAV', 'PUSH_LEFT'],
  ['D01', 'Set up Creator Studio, about 3 minutes', 'C04', 'NAV', 'PUSH_LEFT'],
  ['D01', 'sign in to Creator Studio', 'C01'],
  ['D01', 'Sign in as a reader', 'D24'],
  ['D01', 'Skip, just browse', 'D10', 'NAV', 'DISSOLVE'],
  ['D02', 'That’s me', 'D03', 'NAV', 'SMART'],
  ['D03', 'Next', 'D04', 'NAV', 'SMART'],
  ['D04', 'Next', 'D05', 'NAV', 'SMART'],
  ['D05', 'Next', 'D06', 'NAV', 'SMART'],
  ['D07', 'Next', 'D08', 'NAV', 'SMART'],
  ['D08', 'Next', 'D09', 'NAV', 'SMART'],
  ['D09', 'Enter your name to finish', 'D10', 'NAV', 'DISSOLVE'],
  ['D09', 'Sign in', 'D24'],
  ['D24', 'Sign in', 'D27', 'NAV', 'DISSOLVE'],
  ['D24', 'Create a reader account', 'D02', 'NAV', 'PUSH_LEFT'],
  ['D24', 'Creator? Sign in to the studio', 'C01'],
  ['D25', 'Sign in', 'D27', 'NAV', 'DISSOLVE'],
  ['D25', 'Create a reader account', 'D02', 'NAV', 'PUSH_LEFT'],
  ['D27', /^\d saved stor/, 'D26', 'NAV', 'DISSOLVE'],
  ['D26', 'Indonesia’s home defeat blows Group D of the qualifiers wide open', 'D15', 'NAV', 'PUSH_LEFT'],
  ['D10', 'Sports', 'D11', 'NAV', 'DISSOLVE'],
  ['D10', 'football in India', 'D12', 'NAV', 'DISSOLVE'],
  ['D10', 'Search', 'D12', 'NAV', 'DISSOLVE'],
  ['D10', 'Indonesia’s home defeat blows Group D of the qualifiers wide open', 'D15', 'NAV', 'PUSH_LEFT'],
  ['D10', 'Edit topics', 'D02', 'NAV', 'PUSH_LEFT'],
  ['D10', /^Asha$/, 'D23', 'OVERLAY'],
  ['D10', 'Ask a question or share news', 'D19'],
  ['D10', 'Watch it happen live', 'C01'],
  ['D10', 'Indonesia lost at home. Does India actually have a route to the next round now?', 'D20'],
  ['D11', 'For you', 'D10', 'NAV', 'DISSOLVE'],
  ['D11', 'Top stories', 'D10', 'NAV', 'DISSOLVE'],
  ['D11', 'Indonesia’s home defeat blows Group D of the qualifiers wide open', 'D15', 'NAV', 'PUSH_LEFT'],
  ['D12', 'Clear', 'D10', 'NAV', 'DISSOLVE'],
  ['D12', 'Indonesia’s home defeat blows Group D of the qualifiers wide open', 'D15', 'NAV', 'PUSH_LEFT'],
  ['D12', 'India’s under-23 football squad will train in Goa for six weeks before the March window', 'D15', 'NAV', 'PUSH_LEFT'],
  ['D13', 'Clear', 'D10', 'NAV', 'DISSOLVE'],
  ['D14', 'See top stories', 'D10', 'NAV', 'DISSOLVE'],
  ['D15', 'An AI system', 'D17', 'NAV', 'SMART'],
  ['D15', 'Ask AI about this', 'D16', 'OVERLAY'],
  ['D15', /^\d+ comments?$/, 'Add a comment', 'SCROLL'],
  ['D15', 'Football', 'D12', 'NAV', 'DISSOLVE'],
  ['D15', /^Sports$/, 'D11', 'NAV', 'DISSOLVE'],
  ['D15', 'Unlock for ₹8', 'D15', 'NAV', 'INSTANT'],
  ['D17', 'A person', 'D15', 'NAV', 'SMART'],
  ['D18', 'New post', 'D19', 'NAV', 'SMART'],
  ['D18', 'Indonesia lost at home. Does India actually have a route to the next round now?', 'D20', 'NAV', 'PUSH_LEFT'],
  ['D19', 'Close', 'D18', 'NAV', 'SMART'],
  ['D19', 'Post', 'D20', 'NAV', 'PUSH_LEFT'],
  ['D20', 'All posts', 'D18', 'NAV', 'PUSH_RIGHT'],
  ['D20', 'Indonesia’s home defeat blows Group D of the qualifiers wide open', 'D15', 'NAV', 'PUSH_LEFT'],
  ['D21', 'Cancel Premium', 'D22', 'NAV', 'DISSOLVE'],
  ['D21', 'Email me a sample now', 'D21', 'NAV', 'INSTANT'],
  ['D22', 'Start a free month', 'D21', 'NAV', 'DISSOLVE'],
  ['D23', 'My reading report', 'D21'],
  ['D23', 'Saved stories', 'D26'],
  ['D23', 'What we stored', 'D28'],
  ['D23', 'Edit my topics', 'D02'],
  ['D23', 'Sign out', 'D24'],
  ['D16', 'Fun fact', 'D16', 'SWAP', 'INSTANT'],
]

// ---------------------------------------------------------------- creator, desktop
const STUDIO_NAV = (from: string): Link[] => [
  [from, 'Hub', 'C18'], [from, 'Write & value', 'C20'], [from, 'Licence', 'C25'],
  [from, 'Earnings', 'C28'], [from, 'Live demo', 'C30'], [from, 'Reader home', 'D10'], [from, 'Sign out', 'D10', 'NAV', 'DISSOLVE'],
]
const TOUR = ['C12', 'C14', 'C15', 'C16', 'C17']
const CREATOR: Link[] = [
  ['C01', 'Set up a creator account', 'C04', 'NAV', 'PUSH_LEFT'],
  ['C01', 'Explore with a demo creator', 'C19', 'NAV', 'DISSOLVE'],
  ['C01', 'Sign in', 'C18', 'NAV', 'DISSOLVE'],
  ['C02', 'Sign in', 'C18', 'NAV', 'DISSOLVE'],
  ['C02', 'Explore with a demo creator', 'C19', 'NAV', 'DISSOLVE'],
  ['C03', 'Set up a creator account', 'C04', 'NAV', 'PUSH_LEFT', 0],
  ['C03', 'Explore with a demo creator', 'C19', 'NAV', 'DISSOLVE'],
  ['C04', 'Continue', 'C05', 'NAV', 'PUSH_LEFT'],
  ['C04', 'Cancel', 'D01', 'NAV', 'PUSH_RIGHT'],
  ['C05', 'Continue', 'C06', 'NAV', 'PUSH_LEFT'],
  ['C05', 'Back', 'C04', 'NAV', 'PUSH_RIGHT'],
  ['C06', 'Back', 'C05', 'NAV', 'PUSH_RIGHT'],
  ['C07', 'Continue', 'C08', 'NAV', 'PUSH_LEFT'],
  ['C07', 'Back', 'C05', 'NAV', 'PUSH_RIGHT'],
  ['C08', 'Continue', 'C09', 'NAV', 'PUSH_LEFT'],
  ['C08', 'Back', 'C07', 'NAV', 'PUSH_RIGHT'],
  ['C09', 'Continue', 'C10', 'NAV', 'PUSH_LEFT'],
  ['C09', 'Back', 'C08', 'NAV', 'PUSH_RIGHT'],
  ['C10', 'Open my studio', 'C18', 'NAV', 'DISSOLVE'],
  ['C10', 'Back', 'C09', 'NAV', 'PUSH_RIGHT'],
  ['C11', 'Back', 'C09', 'NAV', 'PUSH_RIGHT'],
  ['C11', 'Open my studio', 'C10', 'NAV', 'INSTANT'],
  // tour overlays: Next/Back swap the overlay in place, Skip/Start close it
  ...TOUR.slice(0, -1).map((t, i) => [t, 'Next', TOUR[i + 1], 'SWAP', 'DISSOLVE'] as Link),
  ...TOUR.slice(1).map((t, i) => [t, 'Back', TOUR[i], 'SWAP', 'DISSOLVE'] as Link),
  ...TOUR.map((t) => [t, 'Skip tour', '', 'CLOSE'] as Link),
  ['C12', 'Go deeper', 'C13', 'SWAP', 'SMART'],
  ['C13', 'Less detail', 'C12', 'SWAP', 'SMART'],
  ['C13', 'Next', 'C14', 'SWAP', 'DISSOLVE'],
  ['C13', 'Skip tour', '', 'CLOSE'],
  ['C17', 'Start creating', '', 'CLOSE'],
  ...STUDIO_NAV('C18'), ...STUDIO_NAV('C19'), ...STUDIO_NAV('C20'), ...STUDIO_NAV('C21'), ...STUDIO_NAV('C22'), ...STUDIO_NAV('C23'), ...STUDIO_NAV('C24'),
  ...STUDIO_NAV('C25'), ...STUDIO_NAV('C26'), ...STUDIO_NAV('C28'), ...STUDIO_NAV('C29'), ...STUDIO_NAV('C30'),
  ['C18', 'Create a new post', 'C20', 'NAV', 'PUSH_LEFT', 0],
  ['C18', 'Watch the live demo', 'C30'],
  ['C18', 'How your piece is valued', 'C18', 'NAV', 'INSTANT'],
  ['C19', 'Create a new post', 'C20', 'NAV', 'PUSH_LEFT', 0],
  ['C19', 'Voltaris Cells quietly reprices its lithium deal as Atacama delay bites', 'C29', 'NAV', 'PUSH_LEFT'],
  ['C19', 'Full analytics', 'C28'],
  ['C19', 'Watch the live demo', 'C30'],
  ['C20', 'Import a PDF', 'C21', 'NAV', 'DISSOLVE'],
  ['C20', 'Import PDF or text', 'C24', 'NAV', 'DISSOLVE'],
  ['C20', 'Write from scratch', 'C21', 'NAV', 'DISSOLVE'],
  ['C21', /^Auto: /, 'C22', 'NAV', 'SMART'],
  ['C21', 'New post', 'C20', 'NAV', 'DISSOLVE'],
  ['C22', 'Run AI check', 'C23', 'NAV', 'SMART'],
  ['C22', 'Cancel', 'C21', 'NAV', 'SMART'],
  ['C23', 'Done', 'C21', 'NAV', 'SMART'],
  ['C24', 'Import a PDF', 'C21', 'NAV', 'DISSOLVE'],
  ['C25', 'For people', 'C26', 'NAV', 'SMART'],
  ['C25', 'Publish and seal', 'C27', 'OVERLAY'],
  ['C26', 'For both', 'C25', 'NAV', 'SMART'],
  ['C26', 'Publish and seal', 'C27', 'OVERLAY'],
  ['C27', 'Close', '', 'CLOSE'],
  ['C27', 'See it on the home feed', 'D10', 'NAV', 'DISSOLVE'],
  ['C27', 'Open the public page', 'D15', 'NAV', 'DISSOLVE'],
  ['C28', /^All \d+ pieces/, 'C29', 'NAV', 'DISSOLVE'],
  ['C28', 'Is ₹17 fair for a scoop like the Voltaris memo?', 'D20'],
  ['C29', /^Voltaris Cells/, 'C28', 'NAV', 'DISSOLVE', 0],
]

// ---------------------------------------------------------------- phone
const PHONE_NAV = (from: string): Link[] => [[from, 'Home', 'M05', 'NAV', 'INSTANT'], [from, 'Community', 'M09', 'NAV', 'INSTANT'], [from, 'Saved', 'M16', 'NAV', 'INSTANT'], [from, 'Studio', 'M13', 'NAV', 'INSTANT']]
const PHONE: Link[] = [
  ['M01', 'I’m here to read', 'M02', 'NAV', 'PUSH_LEFT'],
  ['M01', 'Start, about 1 minute', 'M02', 'NAV', 'PUSH_LEFT'],
  ['M01', 'Skip, just browse', 'M05', 'NAV', 'DISSOLVE'],
  ['M01', 'sign in to Creator Studio', 'M13'],
  ['M01', 'Sign in as a reader', 'M15'],
  ['M15', 'Sign in', 'M05', 'NAV', 'DISSOLVE'],
  ['M15', 'Create a reader account', 'M02', 'NAV', 'PUSH_LEFT'],
  ...PHONE_NAV('M16'),
  ['M02', 'Next', 'M03', 'NAV', 'SMART'],
  ['M03', 'Next', 'M04', 'NAV', 'SMART'],
  ['M04', 'Enter your name to finish', 'M05', 'NAV', 'DISSOLVE'],
  ...PHONE_NAV('M05'), ...PHONE_NAV('M06'), ...PHONE_NAV('M07'), ...PHONE_NAV('M09'), ...PHONE_NAV('M10'), ...PHONE_NAV('M11'), ...PHONE_NAV('M12'),
  ['M05', 'football in India', 'M06', 'NAV', 'DISSOLVE'],
  ['M05', 'Indonesia’s home defeat blows Group D of the qualifiers wide open', 'M07', 'NAV', 'PUSH_LEFT'],
  ['M05', /^Asha$/, 'M11', 'NAV', 'MOVE_IN_BOTTOM'],
  ['M06', 'Clear', 'M05', 'NAV', 'DISSOLVE'],
  ['M06', 'Indonesia’s home defeat blows Group D of the qualifiers wide open', 'M07', 'NAV', 'PUSH_LEFT'],
  ['M07', 'Ask AI about this', 'M08', 'OVERLAY'],
  ['M07', /^\d+ comments?$/, 'Add a comment', 'SCROLL'],
  ['M09', 'Indonesia lost at home. Does India actually have a route to the next round now?', 'M10', 'NAV', 'PUSH_LEFT'],
  ['M10', 'All posts', 'M09', 'NAV', 'PUSH_RIGHT'],
  ['M10', 'Indonesia’s home defeat blows Group D of the qualifiers wide open', 'M07', 'NAV', 'PUSH_LEFT'],
  ['M12', 'See top stories', 'M05', 'NAV', 'DISSOLVE'],
  ['M13', 'Explore with a demo creator', 'M14', 'NAV', 'DISSOLVE'],
  ['M14', 'Reader home', 'M05', 'NAV', 'DISSOLVE'],
]

// header links shared by every reader page on desktop
const READER_HEADER = ['D10', 'D11', 'D12', 'D13', 'D14', 'D15', 'D17', 'D18', 'D19', 'D20', 'D21', 'D22', 'D26', 'D27', 'D28'].flatMap((s): Link[] => [
  [s, 'Home', 'D10', 'NAV', 'INSTANT'], [s, 'Community', 'D18', 'NAV', 'INSTANT'], [s, 'Saved', 'D26', 'NAV', 'INSTANT'], [s, 'Creator studio', 'C01'], [s, 'Live demo', 'C01'], [s, '+ Add news', 'D19'],
])

/** loading states that move on by themselves */
const TIMERS: [string, number, string, Kind?][] = [
  ['D06', 1200, 'D07'],
  ['C06', 1400, 'C07'],
  ['C18', 700, 'C12', 'OVERLAY'],
]

const FLOWS: [string, string][] = [
  ['D01', 'Reader, desktop: first visit'],
  ['D24', 'Reader, desktop: returning (sign in)'],
  ['D10', 'Reader, desktop: home'],
  ['C01', 'Creator, desktop: sign in and set up'],
  ['M01', 'Phone: reader'],
]

const OVERLAYS: Record<string, OverlayPositionType> = {
  D16: 'BOTTOM_RIGHT', D23: 'TOP_RIGHT', M08: 'BOTTOM_CENTER', C27: 'CENTER',
  C12: 'BOTTOM_CENTER', C13: 'BOTTOM_CENTER', C14: 'BOTTOM_CENTER', C15: 'BOTTOM_CENTER', C16: 'BOTTOM_CENTER', C17: 'BOTTOM_CENTER',
}

// ===================================================================== engine
const LABEL = /^([DCM]\d{2})\s+(.+?)\s+\((desktop|phone)\)$/
const norm = (s: string) => s.replace(/[‘’]/g, '’').replace(/[“”]/g, '"').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
const lower = (s: string) => norm(s).toLowerCase()
const page = figma.currentPage
const screens = new Map<string, FrameNode>()
const device = new Map<string, 'desktop' | 'phone'>()
const captions = new Map<string, TextNode>()
const missing: string[] = []
const notes: string[] = []
let wired = 0

function absXY(n: SceneNode) { return { x: n.absoluteTransform[0][2], y: n.absoluteTransform[1][2] } }

function toFrame(node: SceneNode): FrameNode {
  if (node.type === 'FRAME') return node
  const { x, y } = absXY(node)
  const f = figma.createFrame()
  f.resize(Math.max(1, node.width), Math.max(1, node.height))
  f.fills = []
  page.appendChild(f); f.x = x; f.y = y
  f.appendChild(node); node.x = 0; node.y = 0
  return f
}

function lift(node: SceneNode): SceneNode {
  if (node.parent === page) return node
  const { x, y } = absXY(node)
  page.appendChild(node); node.x = x; node.y = y
  return node
}

const isScreenish = (c: SceneNode, _dev: string) => 'children' in c && c.width >= 150 && c.height >= 80

/** The screen that belongs to a caption: a sibling of the caption or of one of its wrappers. */
function screenFor(t: TextNode, dev: string): SceneNode | null {
  let cur: BaseNode = t
  for (let i = 0; i < 4 && cur.parent && cur.parent.type !== 'PAGE' && cur.parent.type !== 'DOCUMENT'; i++) {
    const parent = cur.parent as BaseNode & ChildrenMixin
    const sibs = (parent.children as SceneNode[]).filter((c) => c !== cur && isScreenish(c, dev) && !(c as FrameNode).findOne((n) => n.type === 'TEXT' && LABEL.test(norm((n as TextNode).characters))))
    if (sibs.length) return sibs.sort((a, b) => b.width * b.height - a.width * a.height)[0]
    cur = parent
  }
  return null
}

// 0. remember the design-system frame (kept, placed first)
let designSystem: SceneNode | null = null
const dsTitle = page.findAllWithCriteria({ types: ['TEXT'] }).find((t) => norm(t.characters) === 'Twofold design system')
if (dsTitle) {
  let n: BaseNode | null = dsTitle
  while (n && n.parent && n.parent.type !== 'PAGE' && !((n as SceneNode).width >= 1400 && (n as SceneNode).height > 2000)) n = n.parent
  if (n && n.type !== 'PAGE') designSystem = n as SceneNode
}

// 1. find screens by caption
for (const t of page.findAllWithCriteria({ types: ['TEXT'] })) {
  const m = norm(t.characters).match(LABEL)
  if (!m) continue
  const [, code, name, dev] = m
  if (screens.has(code)) continue
  // already lifted by an earlier run: caption and screen both sit on the page
  const target = t.parent === page ? (page.children.find((n) => n !== t && n.name.startsWith(code + ' ') && 'children' in n) || null) : screenFor(t, dev)
  if (!target) { missing.push(`${code} (caption found, screen next to it not found)`); continue }
  const f = toFrame(lift(target))
  f.name = `${code} ${name}`
  screens.set(code, f); device.set(code, dev as 'desktop' | 'phone')
  captions.set(code, lift(t) as TextNode)
}

// 1b. importers that name layers after data-name: frames called "D10 …"
for (const n of page.findAllWithCriteria({ types: ['FRAME', 'GROUP', 'INSTANCE'] })) {
  const m = n.name.match(/^([DCM]\d{2}) \S/)
  if (!m || screens.has(m[1]) || n.width < 250) continue
  const f = toFrame(lift(n))
  screens.set(m[1], f); device.set(m[1], f.width <= 500 ? 'phone' : 'desktop')
}
notes.push(`Screens found: ${screens.size} (reader ${[...screens.keys()].filter((c) => c[0] === 'D').length}, creator ${[...screens.keys()].filter((c) => c[0] === 'C').length}, phone ${[...screens.keys()].filter((c) => c[0] === 'M').length})`)

// 2. device-sized, scrolling frames (overlays keep their own size)
for (const [code, f] of screens) {
  f.locked = false
  if (OVERLAYS[code]) {
    try { (f as any).overlayPositionType = OVERLAYS[code] } catch {}
    try { (f as any).overlayBackground = { type: 'SOLID_COLOR', color: { r: 0.1, g: 0.11, b: 0.21, a: code === 'D23' || code === 'D16' || code === 'M08' ? 0 : 0.35 } } } catch {}
    try { (f as any).overlayBackgroundInteraction = 'CLOSE_ON_CLICK_OUTSIDE' } catch {}
    continue
  }
  const vp = VIEWPORT[device.get(code)!]
  try { if (f.layoutMode !== 'NONE') { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED' } } catch {}
  if (f.height > vp.h + 4) {
    f.resizeWithoutConstraints(f.width, vp.h)
    f.clipsContent = true
    f.overflowDirection = 'VERTICAL'
  }
}

// 3. clean layout: design system, then one band per app
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' })
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
for (const n of page.children) if (n.name.startsWith('§ ')) n.remove()   // section titles from an earlier run
const GAP_X = 160, GAP_Y = 260, CAP = 70
let y = 0
if (designSystem) { lift(designSystem); designSystem.x = 0; designSystem.y = 0; designSystem.name = 'DS Twofold design system'; y = designSystem.height + 400 }
const BANDS: [string, string, number][] = [['D', 'Reader, desktop (1440 × 900)', 6], ['C', 'Creator Studio, desktop (1440 × 900)', 6], ['M', 'Phone, reader (390 × 844)', 10]]
for (const [prefix, title, perRow] of BANDS) {
  const codes = [...screens.keys()].filter((c) => c[0] === prefix).sort()
  if (!codes.length) continue
  const head = figma.createText(); head.fontName = { family: 'Inter', style: 'Bold' }; head.characters = title; head.fontSize = 96
  head.name = '§ ' + title; page.appendChild(head); head.x = 0; head.y = y; y += head.height + 120
  for (let i = 0; i < codes.length; i += perRow) {
    const row = codes.slice(i, i + perRow).map((c) => screens.get(c)!)
    let x = 0
    for (const f of row) {
      f.x = x; f.y = y + CAP
      const cap = captions.get(f.name.slice(0, 3))
      if (cap) { cap.x = x; cap.y = y; cap.name = 'caption ' + f.name.slice(0, 3) }
      x += f.width + GAP_X
    }
    y += CAP + Math.max(...row.map((f) => f.height)) + GAP_Y
  }
  y += 300
}
// remove the importer's leftovers only when nothing is left behind in them
const keep = new Set<SceneNode>([...screens.values(), ...captions.values(), ...(designSystem ? [designSystem] : [])])
const leftovers = page.children.filter((n) => !keep.has(n) && !n.name.startsWith('§ '))
const stranded = leftovers.some((n) => 'findOne' in n && (n as FrameNode).findOne((c) => c.type === 'TEXT' && LABEL.test(norm((c as TextNode).characters))))
if (!stranded && screens.size >= 70) { for (const n of leftovers) n.remove(); notes.push(`Removed ${leftovers.length} leftover wrapper layer(s).`) }
else if (leftovers.length) notes.push(`Kept ${leftovers.length} other top-level layer(s) because some screens were not lifted; check the list below.`)

// 4. reactions
function transition(a: Anim = 'DISSOLVE'): Transition | null {
  const easing = { type: 'EASE_OUT' } as Easing
  switch (a) {
    case 'INSTANT': return null
    case 'SMART': return { type: 'SMART_ANIMATE', easing, duration: 0.3 }
    case 'PUSH_LEFT': return { type: 'PUSH', direction: 'LEFT', matchLayers: false, easing, duration: 0.35 }
    case 'PUSH_RIGHT': return { type: 'PUSH', direction: 'RIGHT', matchLayers: false, easing, duration: 0.35 }
    case 'SLIDE_UP': return { type: 'SLIDE_IN', direction: 'TOP', matchLayers: false, easing, duration: 0.3 }
    case 'MOVE_IN_BOTTOM': return { type: 'MOVE_IN', direction: 'BOTTOM', matchLayers: false, easing, duration: 0.3 }
    default: return { type: 'DISSOLVE', easing, duration: 0.25 }
  }
}

const textCache = new Map<FrameNode, TextNode[]>()
const textsOf = (root: FrameNode) => textCache.get(root) || (textCache.set(root, root.findAllWithCriteria({ types: ['TEXT'] }) as TextNode[]), textCache.get(root)!)
const byPos = (a: SceneNode, b: SceneNode) => absXY(a).y - absXY(b).y || absXY(a).x - absXY(b).x

/** Find the hotspot for a label: exact text, then ✓-prefixed, then case-insensitive, then a container whose texts join to the label, then a layer named after it. */
function findTarget(root: FrameNode, q: string | RegExp, nth = 0): SceneNode | null {
  const texts = textsOf(root)
  const test = (c: string) => typeof q === 'string' ? (c === norm(q) || c === `✓ ${norm(q)}`) : q.test(c)
  let hits: SceneNode[] = texts.filter((t) => test(norm(t.characters)))
  if (!hits.length && typeof q === 'string') hits = texts.filter((t) => lower(t.characters) === lower(q) || lower(t.characters) === lower(`✓ ${q}`))
  if (!hits.length && typeof q === 'string') {
    const want = lower(q)
    hits = (root.findAllWithCriteria({ types: ['FRAME', 'GROUP', 'INSTANCE'] }) as SceneNode[]).filter((f) => {
      if (f.width * f.height > root.width * 900 * 0.5) return false
      const ts = (f as FrameNode).findAllWithCriteria({ types: ['TEXT'] }) as TextNode[]
      return ts.length > 1 && ts.length < 12 && lower(ts.map((t) => t.characters).join(' ')) === want
    })
  }
  if (!hits.length && typeof q === 'string') hits = (root.findAll((n) => lower(n.name) === lower(q)) as SceneNode[])
  hits.sort(byPos)
  return hits[nth] || null
}

/** The clickable area: the nearest ancestor that looks like a control (has a fill or a stroke), else the node itself. */
function hotspot(t: SceneNode, screen: FrameNode): SceneNode {
  let n: BaseNode | null = t.type === 'TEXT' ? t.parent : t
  const maxArea = screen.width * Math.min(screen.height, 900) * 0.45
  for (let i = 0; n && n !== screen && i < 5; i++, n = n.parent) {
    const s = n as SceneNode & GeometryMixin
    if (!('width' in s) || s.width * s.height > maxArea) break
    const filled = Array.isArray(s.fills) && s.fills.some((f) => f.visible !== false && (f.type !== 'SOLID' || (f.opacity ?? 1) > 0.02))
    const stroked = Array.isArray(s.strokes) && s.strokes.length > 0
    if (filled || stroked) return s
  }
  return t
}

function action(kind: Kind, to: string, anim?: Anim, from?: FrameNode): Action | null {
  if (kind === 'BACK') return { type: 'BACK' }
  if (kind === 'CLOSE') return { type: 'CLOSE' }
  if (kind === 'SCROLL') {
    const target = from && findTarget(from, to)
    return target ? { type: 'NODE', destinationId: hotspot(target, from!).id, navigation: 'SCROLL_TO', transition: transition('SMART'), preserveScrollPosition: false } as Action : null
  }
  const dest = screens.get(to)
  if (!dest) { missing.push(`→ ${to} (screen not found)`); return null }
  const navigation: Navigation = kind === 'OVERLAY' ? 'OVERLAY' : kind === 'SWAP' ? 'SWAP' : 'NAVIGATE'
  return { type: 'NODE', destinationId: dest.id, navigation, transition: transition(kind === 'OVERLAY' && !anim ? 'MOVE_IN_BOTTOM' : anim), preserveScrollPosition: false } as Action
}

async function setReactions(node: SceneNode, reactions: Reaction[]) {
  const n = node as any
  try {
    if (typeof n.setReactionsAsync === 'function') await n.setReactionsAsync(reactions)
    else n.reactions = reactions
  } catch (e) {
    const legacy = reactions.map((r: any) => ({ trigger: r.trigger, action: r.actions[0] }))   // older builds
    if (typeof n.setReactionsAsync === 'function') await n.setReactionsAsync(legacy)
    else n.reactions = legacy
  }
}

// clear what an earlier run (or the importer) set
for (const f of screens.values()) {
  for (const n of [f, ...f.findAll((x) => 'reactions' in x && (x as any).reactions.length > 0)] as SceneNode[]) {
    if ('reactions' in n && (n as any).reactions.length) await setReactions(n, [])
  }
}

const pending = new Map<SceneNode, Reaction[]>()
const add = (n: SceneNode, r: Reaction) => pending.set(n, [...(pending.get(n) || []), r])
const headerOnly = new Set(READER_HEADER.map((l) => `${l[0]}|${String(l[1])}`))

for (const [from, q, to, kind = 'NAV', anim, nth = 0] of [...READER, ...READER_HEADER, ...CREATOR, ...PHONE]) {
  const screen = screens.get(from)
  if (!screen) { missing.push(`${from} (screen not found)`); continue }
  if (kind !== 'SCROLL' && kind !== 'CLOSE' && kind !== 'BACK' && to === from && anim !== 'INSTANT') continue
  const t = findTarget(screen, q, nth)
  if (!t) { if (!headerOnly.has(`${from}|${String(q)}`)) missing.push(`${from}: "${q}"`); continue }
  const a = action(kind, to, anim, screen)
  if (!a) continue
  add(hotspot(t, screen), { trigger: { type: 'ON_CLICK' }, actions: [a] } as Reaction)
  wired++
}

for (const [from, ms, to, kind = 'NAV'] of TIMERS) {
  const s = screens.get(from)
  const a = action(kind, to, kind === 'OVERLAY' ? 'MOVE_IN_BOTTOM' : 'DISSOLVE')
  if (s && a) { add(s, { trigger: { type: 'AFTER_TIMEOUT', timeout: ms / 1000 }, actions: [a] } as Reaction); wired++ }
}

// Esc closes every overlay; Backspace goes back on every full screen
for (const [code, f] of screens) {
  if (OVERLAYS[code]) add(f, { trigger: { type: 'ON_KEY_DOWN', device: 'KEYBOARD', keyCodes: [27] }, actions: [{ type: 'CLOSE' }] } as Reaction)
  else add(f, { trigger: { type: 'ON_KEY_DOWN', device: 'KEYBOARD', keyCodes: [8] }, actions: [{ type: 'BACK' }] } as Reaction)
}

for (const [node, reactions] of pending) {
  try { await setReactions(node, reactions) } catch (e) { missing.push(`${node.name}: ${String(e).slice(0, 80)}`) }
}

// 5. flows
page.flowStartingPoints = FLOWS.filter(([c]) => screens.has(c)).map(([c, name]) => ({ nodeId: screens.get(c)!.id, name }))

print(notes.join('\n'))
print(`Interactions wired: ${wired}. Flows: ${page.flowStartingPoints.length}.`)
if (missing.length) print('Not wired (copy this list back to Claude):\n' + [...new Set(missing)].join('\n'))
else print('Everything wired. Press Present (▶) and pick a flow.')
figma.viewport.scrollAndZoomIntoView(page.children)
