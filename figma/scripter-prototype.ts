/**
 * Twofold: wire the imported screens into a clickable Figma prototype.
 *
 * How to use
 * 1. In one Figma page, import twofold-all.html with an HTML-to-Figma plugin (it holds every
 *    screen plus the design system). The three separate files work too: import all of them.
 *    Each screen arrives with a caption such as "D10 Home, For you with welcome note (desktop)".
 * 2. Open the Scripter plugin on that page, paste this whole file, press Run.
 * 3. Press Present (▶) and pick a flow: reader first visit, returning reader, reader home, creator, or phone.
 *
 * What it does
 * - Finds each screen by its caption, lifts it to the top level of the page and names it "D10 …".
 * - Turns long pages into device-sized frames that scroll vertically (1440×900 or 390×844).
 * - Wires about 300 interactions: navigate, back, overlays (AI companion, account menu, tour, publish
 *   dialog), overlay swaps for the 5-step tour, after-delay transitions for loading states,
 *   scroll-to anchors, Esc to close overlays, and links between the reader, creator and phone flows.
 * - Adds five flow starting points.
 * Safe to run twice: it clears the reactions it set before and sets them again.
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
const LABEL = /^([DCM]\d{2})\s+(.+?)\s+\((desktop|phone)\)\s*$/
const screens = new Map<string, FrameNode>()
const device = new Map<string, 'desktop' | 'phone'>()
const missing: string[] = []
let wired = 0

const norm = (s: string) => s.replace(/[‘’]/g, '’').replace(/\s+/g, ' ').trim()

function toFrame(node: SceneNode): FrameNode {
  if (node.type === 'FRAME') return node
  const f = figma.createFrame()
  f.resize(node.width, node.height)
  f.x = node.absoluteTransform[0][2]; f.y = node.absoluteTransform[1][2]
  f.fills = []
  figma.currentPage.appendChild(f)
  f.appendChild(node); node.x = 0; node.y = 0
  return f
}

// 1. find screens by caption and lift them to the top level
for (const t of figma.currentPage.findAll((n) => n.type === 'TEXT') as TextNode[]) {
  const m = norm(t.characters).match(LABEL)
  if (!m) continue
  const [, code, name, dev] = m
  const parent = t.parent
  if (!parent || !('children' in parent)) continue
  const target = (parent.children as SceneNode[]).find((c) => c !== t && 'children' in c && c.width > 200)
  if (!target) { missing.push(`${code} (no frame next to its caption)`); continue }
  const ax = target.absoluteTransform[0][2], ay = target.absoluteTransform[1][2]
  if (target.parent !== figma.currentPage) { figma.currentPage.appendChild(target); target.x = ax; target.y = ay }
  const f = toFrame(target)
  f.name = `${code} ${name}`
  screens.set(code, f)
  device.set(code, dev as 'desktop' | 'phone')
  // keep the caption beside the screen
  figma.currentPage.appendChild(t); t.x = ax; t.y = ay - t.height - 24
}

// 1b. importers that keep data-name / aria-label as layer names: match frames named "D10 …"
for (const n of figma.currentPage.findAll((x) => x.type === 'FRAME' && /^([DCM]\d{2}) \S/.test(x.name)) as FrameNode[]) {
  const code = n.name.slice(0, 3)
  if (screens.has(code)) continue
  const ax = n.absoluteTransform[0][2], ay = n.absoluteTransform[1][2]
  if (n.parent !== figma.currentPage) { figma.currentPage.appendChild(n); n.x = ax; n.y = ay }
  screens.set(code, n)
  device.set(code, n.width <= 500 ? 'phone' : 'desktop')
}

// 2. device-sized, scrolling frames (overlays keep their own size)
for (const [code, f] of screens) {
  if (OVERLAYS[code]) {
    try { (f as any).overlayPositionType = OVERLAYS[code] } catch {}
    try { (f as any).overlayBackground = { type: 'SOLID_COLOR', color: { r: 0.1, g: 0.11, b: 0.21, a: code === 'D23' || code === 'D16' || code === 'M08' ? 0 : 0.35 } } } catch {}
    try { (f as any).overlayBackgroundInteraction = 'CLOSE_ON_CLICK_OUTSIDE' } catch {}
    continue
  }
  const vp = VIEWPORT[device.get(code)!]
  if (f.layoutMode === 'VERTICAL') f.primaryAxisSizingMode = 'FIXED'
  if (f.layoutMode === 'HORIZONTAL') f.counterAxisSizingMode = 'FIXED'
  if (f.height > vp.h + 4) {
    f.resizeWithoutConstraints(f.width, vp.h)
    f.clipsContent = true
    f.overflowDirection = 'VERTICAL'
  }
}

// 3. reactions
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

function findText(root: FrameNode, q: string | RegExp, nth = 0): TextNode | null {
  const hits = (root.findAll((n) => n.type === 'TEXT') as TextNode[]).filter((t) => {
    const c = norm(t.characters)
    return typeof q === 'string' ? c === norm(q) || c === `✓ ${norm(q)}` : q.test(c)
  })
  hits.sort((a, b) => a.absoluteTransform[1][2] - b.absoluteTransform[1][2] || a.absoluteTransform[0][2] - b.absoluteTransform[0][2])
  return hits[nth] || null
}

/** The clickable area: the nearest ancestor that looks like a control (has a fill or a stroke), else the text. */
function hotspot(t: TextNode, screen: FrameNode): SceneNode {
  let n: BaseNode | null = t.parent
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
    const target = from && findText(from, to)
    return target ? { type: 'NODE', destinationId: hotspot(target, from!).id, navigation: 'SCROLL_TO', transition: transition('SMART'), preserveScrollPosition: false } : null
  }
  const dest = screens.get(to)
  if (!dest) { missing.push(`→ ${to}`); return null }
  const navigation: Navigation = kind === 'OVERLAY' ? 'OVERLAY' : kind === 'SWAP' ? 'SWAP' : 'NAVIGATE'
  return { type: 'NODE', destinationId: dest.id, navigation, transition: transition(kind === 'OVERLAY' && !anim ? 'MOVE_IN_BOTTOM' : anim), preserveScrollPosition: false } as Action
}

async function setReactions(node: SceneNode, reactions: Reaction[]) {
  const n = node as any
  try {
    if (typeof n.setReactionsAsync === 'function') await n.setReactionsAsync(reactions)
    else n.reactions = reactions
  } catch (e) {
    // older Figma builds: one action per reaction, under `action`
    const legacy = reactions.map((r: any) => ({ trigger: r.trigger, action: r.actions[0] }))
    if (typeof n.setReactionsAsync === 'function') await n.setReactionsAsync(legacy)
    else n.reactions = legacy
  }
}

// clear what an earlier run set
for (const f of screens.values()) {
  for (const n of [f, ...f.findAll(() => true)] as (SceneNode & ReactionMixin)[]) {
    if ('reactions' in n && n.reactions.length) await setReactions(n, [])
  }
}

const pending = new Map<SceneNode, Reaction[]>()
const add = (n: SceneNode, r: Reaction) => pending.set(n, [...(pending.get(n) || []), r])

for (const [from, q, to, kind = 'NAV', anim, nth = 0] of [...READER, ...READER_HEADER, ...CREATOR, ...PHONE]) {
  const screen = screens.get(from)
  if (!screen) { missing.push(from); continue }
  if (kind !== 'SCROLL' && kind !== 'CLOSE' && kind !== 'BACK' && to === from && anim !== 'INSTANT') continue
  const t = findText(screen, q, nth)
  if (!t) { if (!READER_HEADER.some((l) => l[0] === from && l[1] === q)) missing.push(`${from}: "${q}"`); continue }
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

// 4. flows
figma.currentPage.flowStartingPoints = FLOWS.filter(([c]) => screens.has(c)).map(([c, name]) => ({ nodeId: screens.get(c)!.id, name }))

print(`Screens found: ${screens.size}. Interactions wired: ${wired}. Flows: ${figma.currentPage.flowStartingPoints.length}.`)
if (missing.length) print('Not wired (text not found or screen missing):\n' + [...new Set(missing)].join('\n'))
figma.viewport.scrollAndZoomIntoView([...screens.values()])
