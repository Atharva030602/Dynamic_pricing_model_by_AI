# Exports every screen state of the live app as frozen, self-contained HTML for an
# HTML-to-Figma plugin (one labelled frame per screen), in three files:
#   figma/twofold-reader-desktop.html, figma/twofold-creator-desktop.html, figma/twofold-mobile.html
# Run with the dev server up:  python3 scripts/figma_export.py
import asyncio, base64, glob, json, os, time
from playwright.async_api import async_playwright

BASE = 'http://localhost:5173/'
LS = 'twofold:v5'
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
NOW = time.strftime('%Y-%m-%dT%H:%M:%S+05:30')

READER = {'role': 'reader', 'name': 'Asha Kulkarni', 'handle': '@asha.kulkarni', 'city': 'Pune',
  'keywords': ['Football', 'Indian football', 'EVs', 'Stock market', 'World Cup qualifiers', 'Monsoon'],
  'weights': {'Football': 2.5, 'Indian football': 2, 'EVs': 1.5, 'Stock market': 1.5, 'World Cup qualifiers': 1, 'Monsoon': 1},
  'rhythm': {'when': 'Morning', 'length': '10 minutes'}, 'socials': ['x'], 'premium': True, 'reportFreq': 'weekly', 'depth': 'deep', 'createdAt': NOW}
CREATOR = {'name': 'Asha Kulkarni', 'handle': '@asha.kulkarni', 'email': 'asha@example.com', 'city': 'Pune', 'beat': 'Football',
  'languages': ['English', 'Marathi'], 'formats': ['article', 'video'], 'socials': [{'network': 'YouTube', 'handle': '@ashafootball', 'posts': 76, 'followers': 46636}, {'network': 'Instagram', 'handle': '@asha.k', 'posts': 47, 'followers': 10567}],
  'goal': 'both', 'audience': ['Fans and hobbyists', 'Students'], 'aiTraining': 'ask', 'createdAt': NOW}
ISRO = {'title': 'ISRO picks Pune startup to build solar panels for two space missions', 'dek': 'A four-year-old company will supply panels worth ₹38 crore, the largest such contract for a private Maharashtra firm.',
  'body': 'A four-year-old Pune company will build solar panels for two space missions, its founders said on Monday.\n\nThe contract, worth ₹38 crore, is the largest ISRO has given a private firm in Maharashtra, according to documents seen by this writer. The company has 60 engineers and will hire 40 more by March.\n\nThe first panels are due in 2027. Two larger firms bid for the same work, the documents show.',
  'kind': 'article', 'attachments': {'sourceDocs': True, 'rawData': False}, 'disclosure': 'human', 'aiUses': [], 'formats': ['article', 'video'], 'importedFrom': 'isro-contract.pdf, 3 pages'}
BLANK = {'title': '', 'dek': '', 'body': '', 'kind': 'article', 'attachments': {'sourceDocs': False, 'rawData': False}, 'disclosure': 'human', 'aiUses': [], 'formats': ['article']}

FREEZE = r"""
({ frameName, selector, bg }) => {
  const PROPS = ['display','position','top','right','bottom','left','z-index','box-sizing','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis','align-items','align-self','justify-content','justify-items','justify-self','align-content','gap','row-gap','column-gap','grid-template-columns','grid-template-rows','grid-column','grid-row',
    'margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left',
    'border-top-width','border-right-width','border-bottom-width','border-left-width','border-top-style','border-right-style','border-bottom-style','border-left-style','border-top-color','border-right-color','border-bottom-color','border-left-color',
    'border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius',
    'background-color','background-image','color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration-line','text-decoration-color','text-underline-offset','white-space','overflow-x','overflow-y','opacity','box-shadow','transform','vertical-align','list-style-type','text-overflow','-webkit-line-clamp','-webkit-box-orient','word-break','overflow-wrap','fill','stroke','stroke-width','object-fit','object-position','backdrop-filter'];
  const fam = (f) => f.replace(/"?Schibsted Grotesk Variable"?/g,'"Schibsted Grotesk"').replace(/"?Newsreader Variable"?/g,'"Newsreader"').replace(/"?JetBrains Mono Variable"?/g,'"JetBrains Mono"');
  const root = selector ? document.querySelector(selector) : document.getElementById('root');
  if (!root) return null;
  const clone = root.cloneNode(true);
  const src = [root, ...root.querySelectorAll('*')];
  const dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((el, i) => {
    const d = dst[i]; const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const st = [];
    for (const p of PROPS) {
      let v = cs.getPropertyValue(p);
      if (!v || v === 'normal' && !['white-space','line-height','letter-spacing','font-style'].includes(p)) continue;
      if (p === 'font-family') v = fam(v);
      if (p === 'position' && v === 'sticky') v = 'relative';
      if (p === 'position' && v === 'fixed') v = 'absolute';
      if (['top','bottom','left','right'].includes(p) && cs.position === 'sticky') continue;
      st.push(`${p}:${v}`);
    }
    if (!(el instanceof SVGElement) || el.tagName.toLowerCase() === 'svg') {
      st.push(`width:${r.width}px`);
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
      const multiLine = hasText && r.height >= lh * 1.6 && !/flex|grid/.test(cs.display);
      if (!multiLine) st.push(`height:${r.height}px`);
      if (hasText && !multiLine && cs.whiteSpace === 'normal') st.push('white-space:nowrap');
    }
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT') {
      const div = document.createElement('div');
      div.setAttribute('style', st.join(';') + ';white-space:pre-wrap;overflow:hidden');
      let text = el.tagName === 'SELECT' ? (el.options[el.selectedIndex]?.text || '') + '  ▾' : (el.value || el.getAttribute('placeholder') || '');
      if (el.type === 'range') { text = ''; }
      if (!el.value && el.tagName !== 'SELECT') div.style.color = '#a3a6ba';
      div.textContent = text;
      if (el.getAttribute('aria-label')) div.setAttribute('data-name', el.getAttribute('aria-label'));
      d.replaceWith(div); dst[i] = div; return;
    }
    if (selector && i === 0) { for (let k = st.length - 1; k >= 0; k--) if (/^(position|top|right|bottom|left|transform|margin)/.test(st[k])) st.splice(k, 1) }
    d.setAttribute('style', st.join(';'));
    d.removeAttribute('class');
    if (el.getAttribute('aria-label')) d.setAttribute('data-name', el.getAttribute('aria-label'));
  });
  const body = getComputedStyle(document.body);
  const rr = root.getBoundingClientRect();
  const w = selector ? Math.round(rr.width) : document.documentElement.clientWidth, h = selector ? Math.round(rr.height) : Math.max(document.documentElement.scrollHeight, 600);
  const inner = selector ? clone.outerHTML : clone.innerHTML;
  const bgc = bg || (selector ? 'transparent' : (getComputedStyle(root.firstElementChild || document.body).backgroundColor || body.backgroundColor));
  return `<div class="frame" data-name="${frameName}" style="position:relative;overflow:hidden;width:${w}px;height:${h}px;background:${bgc};font-family:${fam(body.fontFamily)};color:${body.color}">${inner}</div>`;
}
"""

async def setstate(pg, state, route):
    await pg.goto(BASE + '#/blank-' + str(time.time()))
    await pg.evaluate("([k, v]) => { localStorage.clear(); if (v) localStorage.setItem(k, JSON.stringify(v)) }", [LS, state])
    await pg.goto(BASE + '#' + route)
    await pg.reload()
    await pg.wait_for_timeout(700)

def rs(**kw):
    s = {'profile': READER, 'tourDone': True}
    s.update(kw)
    return s

async def reader_flow(pg, upto):
    await setstate(pg, None, '/')
    await pg.get_by_text('I’m here to read').click(); await pg.wait_for_timeout(250)
    await pg.get_by_role('button', name='Follow sport').click()
    await pg.get_by_role('button', name='Understand money and markets').click()
    if upto == 'intent': return
    await pg.get_by_role('button', name='That’s me').click(); await pg.wait_for_timeout(250)
    await pg.get_by_role('button', name='Indian football', exact=True).click()
    await pg.get_by_role('button', name='EVs', exact=True).click()
    if upto == 'deeper': return
    await pg.get_by_role('button', name='Next').click(); await pg.wait_for_timeout(250)
    for t in ['Why it happened, in depth', 'India and the world', 'The people it affects']:
        await pg.get_by_role('button', name=t).click(); await pg.wait_for_timeout(150)
    if upto == 'pairs': return
    await pg.get_by_role('button', name='Next').click(); await pg.wait_for_timeout(250)
    await pg.get_by_placeholder('e.g. Can India still qualify? And should my next car be an EV?').fill('Can India still qualify for the World Cup? And are power cuts in Pune getting worse?')
    await pg.wait_for_timeout(200)
    await pg.get_by_role('button', name='World Cup qualifiers', exact=True).click()
    if upto == 'words': return
    await pg.get_by_role('button', name='Next').click(); await pg.wait_for_timeout(250)
    await pg.get_by_role('button', name='Connect', exact=True).first.click(); await pg.wait_for_timeout(200)
    if upto == 'connecting': return
    await pg.wait_for_timeout(1300)
    if upto == 'connected': return
    await pg.get_by_role('button', name='Next').click(); await pg.wait_for_timeout(250)
    if upto == 'rhythm': return
    await pg.get_by_role('button', name='Next').click(); await pg.wait_for_timeout(300)

async def join_flow(pg, upto):
    await setstate(pg, {'profile': READER}, '/creator/join')
    if upto == 'bademail':
        await pg.get_by_label('Email').fill('asha@'); await pg.get_by_placeholder('e.g. Football, Civic, Markets').fill('Football'); return
    await pg.get_by_label('Email').fill('asha@example.com'); await pg.get_by_placeholder('e.g. Football, Civic, Markets').fill('Football')
    await pg.get_by_role('button', name='Marathi', exact=True).click()
    await pg.get_by_role('button', name='Continue').click(); await pg.wait_for_timeout(200)
    await pg.get_by_role('button', name='Videos Reviews, explainers, reels').click()
    await pg.get_by_role('button', name='Sports', exact=True).click()
    if upto == 'work': return
    await pg.get_by_role('button', name='Continue').click(); await pg.wait_for_timeout(200)
    await pg.get_by_placeholder('Your YouTube handle').fill('ashafootball'); await pg.get_by_role('button', name='Connect', exact=True).click()
    if upto == 'studying': await pg.wait_for_timeout(200); return
    await pg.wait_for_timeout(1500)
    await pg.get_by_placeholder('Your Instagram handle').fill('asha.k'); await pg.get_by_role('button', name='Connect', exact=True).click(); await pg.wait_for_timeout(1500)
    if upto == 'channels': return
    await pg.get_by_role('button', name='Continue').click(); await pg.wait_for_timeout(200)
    await pg.get_by_role('button', name='Fans and hobbyists').click(); await pg.get_by_role('button', name='Students').click()
    if upto == 'audience': return
    await pg.get_by_role('button', name='Continue').click(); await pg.wait_for_timeout(200)
    if upto == 'ai': return
    await pg.get_by_role('button', name='Continue').click(); await pg.wait_for_timeout(200)
    await pg.get_by_role('button', name='Send the code').click()
    await pg.get_by_label('6-digit code').fill('482913' if upto == 'verify' else '111111')

async def scroll_to(pg, sel):
    await pg.evaluate("(s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({block: 'start'}) }", sel)

def S(code, name, setup, selector=None, bg=None):
    return (code, name, setup, selector, bg)

async def r(pg, state, route): await setstate(pg, state, route)

READER_DESKTOP = [
  S('D01', 'Welcome, choose reader or creator', lambda pg: r(pg, None, '/')),
  S('D02', 'Reader questions, intents picked', lambda pg: reader_flow(pg, 'intent')),
  S('D03', 'Reader questions, topics pop in', lambda pg: reader_flow(pg, 'deeper')),
  S('D04', 'Reader questions, this or that', lambda pg: reader_flow(pg, 'pairs')),
  S('D05', 'Reader questions, in your own words', lambda pg: reader_flow(pg, 'words')),
  S('D06', 'Reader questions, connecting an account (loading)', lambda pg: reader_flow(pg, 'connecting')),
  S('D07', 'Reader questions, account connected', lambda pg: reader_flow(pg, 'connected')),
  S('D08', 'Reader questions, reading rhythm and report', lambda pg: reader_flow(pg, 'rhythm')),
  S('D09', 'Reader questions, account (name missing)', lambda pg: reader_flow(pg, 'account')),
  S('D10', 'Home, For you with welcome note', lambda pg: r(pg, rs(), '/?welcome=1')),
  S('D11', 'Home, Sports category', lambda pg: r(pg, rs(), '/?c=Sports')),
  S('D12', 'Search, direct and indirect results', lambda pg: r(pg, rs(), '/?q=football%20in%20India')),
  S('D13', 'Search, no results', lambda pg: r(pg, rs(), '/?q=quantum%20knitting')),
  S('D14', 'Saved, empty', lambda pg: r(pg, rs(), '/?c=saved')),
  S('D15', 'Article', lambda pg: r(pg, rs(), '/work/tf_idn_0101')),
  S('D16', 'Article, AI companion (overlay)', None, '[aria-label="AI reading companion"]'),
  S('D17', 'Article as an AI system', lambda pg: r(pg, rs(), '/work/tf_idn_0101?view=ai')),
  S('D18', 'Community', lambda pg: r(pg, rs(), '/community')),
  S('D19', 'Community, new post with link error', None),
  S('D20', 'Community thread', lambda pg: r(pg, rs(), '/community?p=cp1')),
  S('D21', 'Reading report, Premium', lambda pg: r(pg, rs(), '/report')),
  S('D22', 'Reading report, not Premium', lambda pg: r(pg, rs(profile={**READER, 'premium': False}), '/report')),
  S('D23', 'Account menu (overlay)', None, 'header [class*="absolute"]'),
]

async def d16(pg):
    await r(pg, rs(), '/work/tf_idn_0101'); await pg.evaluate('window.scrollTo(0, document.body.scrollHeight * 0.4)'); await pg.wait_for_timeout(1500)
async def d19(pg):
    await r(pg, rs(), '/community?new=1'); await pg.get_by_placeholder('What do you want to know?').fill('Can India still make the third round?'); await pg.get_by_placeholder('https://').fill('news.example')
async def d23(pg):
    await r(pg, rs(), '/'); await pg.get_by_role('button', name='Account').click(); await pg.wait_for_timeout(300)
READER_DESKTOP[15] = S('D16', 'Article, AI companion (overlay)', d16, '[aria-label="AI reading companion"]')
READER_DESKTOP[18] = S('D19', 'Community, new post with link error', d19)
READER_DESKTOP[22] = S('D23', 'Account menu (overlay)', d23, '[aria-expanded="true"] + div')

def cs(**kw):
    s = {'profile': READER, 'creator': CREATOR, 'creatorSession': 'me', 'tourDone': True, 'draft': BLANK}
    s.update(kw); return s

async def c02(pg):
    await r(pg, {'profile': READER, 'creator': CREATOR}, '/studio'); await pg.get_by_role('button', name='Continue as Asha Kulkarni').click(); await pg.get_by_label('6-digit code sent to asha@example.com').fill('111111')
async def c02b(pg):
    await r(pg, {'profile': READER}, '/studio'); await pg.get_by_label('Creator email').fill('new@example.com'); await pg.get_by_role('button', name='Send sign-in code').click()
async def tour(pg, n, deeper=False):
    await r(pg, cs(tourDone=False), '/studio/hub?tour=1')
    for _ in range(n): await pg.get_by_role('button', name='Next').click(); await pg.wait_for_timeout(250)
    if deeper: await pg.get_by_role('button', name='Go deeper').click()
async def catcheck(pg, name):
    await r(pg, cs(draft=ISRO), '/studio/write'); await pg.get_by_role('combobox').first.select_option('__new')
    await pg.get_by_placeholder('e.g. Space, Education, Health policy').fill(name); await pg.get_by_role('button', name='Run AI check').click(); await pg.wait_for_timeout(900)
async def pdferr(pg):
    await r(pg, cs(), '/studio/write'); await pg.set_input_files('#imp', files=[{'name': 'notes.docx', 'mimeType': 'application/octet-stream', 'buffer': b'PK'}]); await pg.wait_for_timeout(300)
async def lic(pg, who, promo):
    await r(pg, cs(draft=ISRO), '/studio/licence')
    if who: await pg.get_by_role('radio', name=who).click()
    if promo: await pg.get_by_role('switch', name='Promote this piece').click()
    await pg.wait_for_timeout(200)
async def published(pg):
    await lic(pg, None, False); await pg.get_by_role('button', name='Publish and seal').click(); await pg.wait_for_timeout(1500)

CREATOR_DESKTOP = [
  S('C01', 'Creator Studio sign-in (signed in as reader)', lambda pg: r(pg, {'profile': READER}, '/studio')),
  S('C02', 'Sign-in code, wrong code', c02),
  S('C03', 'Sign-in, no creator account for email', c02b),
  S('C04', 'Join 1, you (invalid email)', lambda pg: join_flow(pg, 'bademail')),
  S('C05', 'Join 2, your work', lambda pg: join_flow(pg, 'work')),
  S('C06', 'Join 3, studying channel (loading)', lambda pg: join_flow(pg, 'studying')),
  S('C07', 'Join 3, what we learned', lambda pg: join_flow(pg, 'channels')),
  S('C08', 'Join 4, audience and goals', lambda pg: join_flow(pg, 'audience')),
  S('C09', 'Join 5, AI terms', lambda pg: join_flow(pg, 'ai')),
  S('C10', 'Join 6, verify email', lambda pg: join_flow(pg, 'verify')),
  S('C11', 'Join 6, wrong code', lambda pg: join_flow(pg, 'badcode')),
  S('C12', 'Tour 1, your studio (overlay)', lambda pg: tour(pg, 0), '[role="dialog"] > div'),
  S('C13', 'Tour 1, go deeper (overlay)', lambda pg: tour(pg, 0, True), '[role="dialog"] > div'),
  S('C14', 'Tour 2, create a post (overlay)', lambda pg: tour(pg, 1), '[role="dialog"] > div'),
  S('C15', 'Tour 3, licence (overlay)', lambda pg: tour(pg, 2), '[role="dialog"] > div'),
  S('C16', 'Tour 4, analytics (overlay)', lambda pg: tour(pg, 3), '[role="dialog"] > div'),
  S('C17', 'Tour 5, live demo (overlay)', lambda pg: tour(pg, 4), '[role="dialog"] > div'),
  S('C18', 'Hub, new creator (empty)', lambda pg: r(pg, cs(), '/studio/hub')),
  S('C19', 'Hub, established creator', lambda pg: r(pg, cs(creatorSession='demo'), '/studio/hub')),
  S('C20', 'Write, new post (blank)', lambda pg: r(pg, cs(), '/studio/write')),
  S('C21', 'Write, imported PDF with value', lambda pg: r(pg, cs(draft=ISRO), '/studio/write')),
  S('C22', 'Write, new category rejected', lambda pg: catcheck(pg, 'Cricket')),
  S('C23', 'Write, new category approved', lambda pg: catcheck(pg, 'Space')),
  S('C24', 'Write, unsupported file', pdferr),
  S('C25', 'Licence, for both', lambda pg: lic(pg, None, False)),
  S('C26', 'Licence, for people, promoted', lambda pg: lic(pg, 'For people', True)),
  S('C27', 'Published (overlay)', published, '[role="dialog"] > div'),
  S('C28', 'Earnings and audience', lambda pg: r(pg, cs(creatorSession='demo'), '/studio/earnings')),
  S('C29', 'Post analysis', lambda pg: r(pg, cs(creatorSession='demo'), '/studio/earnings?work=tf_vlt_0001')),
  S('C30', 'Live demo', lambda pg: r(pg, cs(creatorSession='demo'), '/studio/demo')),
]

async def m07(pg):
    await r(pg, rs(), '/work/tf_idn_0101'); await pg.evaluate('window.scrollTo(0, document.body.scrollHeight * 0.4)'); await pg.wait_for_timeout(1500)
MOBILE = [
  S('M01', 'Welcome', lambda pg: r(pg, None, '/')),
  S('M02', 'Reader questions, topics pop in', lambda pg: reader_flow(pg, 'deeper')),
  S('M03', 'Reader questions, this or that', lambda pg: reader_flow(pg, 'pairs')),
  S('M04', 'Reader questions, account', lambda pg: reader_flow(pg, 'account')),
  S('M05', 'Home, For you', lambda pg: r(pg, rs(), '/?welcome=1')),
  S('M06', 'Search results', lambda pg: r(pg, rs(), '/?q=football%20in%20India')),
  S('M07', 'Article', lambda pg: r(pg, rs(), '/work/tf_idn_0101')),
  S('M08', 'AI companion (overlay)', m07, '[aria-label="AI reading companion"]'),
  S('M09', 'Community', lambda pg: r(pg, rs(), '/community')),
  S('M10', 'Community thread', lambda pg: r(pg, rs(), '/community?p=cp1')),
  S('M11', 'Reading report', lambda pg: r(pg, rs(), '/report')),
  S('M12', 'Saved, empty', lambda pg: r(pg, rs(), '/?c=saved')),
  S('M13', 'Creator Studio sign-in', lambda pg: r(pg, {'profile': READER}, '/studio')),
  S('M14', 'Creator hub', lambda pg: r(pg, cs(creatorSession='demo'), '/studio/hub')),
]

async def capture(b, width, height, label, screens):
    ctx = await b.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1)
    pg = await ctx.new_page()
    await pg.route('**/images.unsplash.com/**', lambda route: route.fulfill(status=200, content_type='image/png', body=PNG))
    out = []
    for code, name, setup, selector, bg in screens:
        try:
            await setup(pg)
            await pg.wait_for_timeout(400)
            if not selector: await pg.evaluate('window.scrollTo(0,0)'); await pg.wait_for_timeout(150)
            html = await pg.evaluate(FREEZE, {'frameName': f'{code} {name}', 'selector': selector, 'bg': bg})
            if not html: print('MISSING', code, name); continue
            out.append(f'<div class="slot"><p class="label">{code} {name} ({label})</p>{html}</div>')
            print('ok', code, name)
        except Exception as e:
            print('FAIL', code, name, str(e)[:160])
    await ctx.close()
    return out

def faces():
    f = ''
    for fam, pat in [('Schibsted Grotesk', 'schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2'), ('Newsreader', 'newsreader/files/newsreader-latin-opsz-normal.woff2'), ('JetBrains Mono', 'jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')]:
        for p in sorted(glob.glob('node_modules/@fontsource-variable/' + pat)):
            f += "@font-face{font-family:'%s';font-weight:200 900;font-style:normal;src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, base64.b64encode(open(p, 'rb').read()).decode())
    return f

def write(path, title, frames, cols):
    doc = ('<!doctype html><html><head><meta charset="utf-8"><title>' + title + '</title><style>' + faces() + '</style><style>'
      'body{margin:0;background:#dfe2ea;padding:120px;font-family:"Schibsted Grotesk",sans-serif}'
      '.grid{display:grid;grid-template-columns:repeat(' + str(cols) + ',max-content);gap:160px 120px;align-items:start}'
      '.slot{display:flex;flex-direction:column;gap:24px}'
      '.label{margin:0;font:600 32px/1.2 "Schibsted Grotesk",sans-serif;color:#191c36;white-space:nowrap}'
      'h1.title{font:600 56px/1.1 "Schibsted Grotesk",sans-serif;color:#191c36;margin:0 0 100px}'
      '*{box-sizing:border-box}</style></head><body><h1 class="title">' + title + '</h1><div class="grid">' + ''.join(frames) + '</div></body></html>')
    os.makedirs('figma', exist_ok=True)
    open(path, 'w').write(doc)
    from figma_design_system import patch as add_design_system
    add_design_system(path)
    print(path, len(doc) // 1024, 'KB', len(frames), 'frames')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        rd = await capture(b, 1440, 900, 'desktop', READER_DESKTOP)
        write('figma/twofold-reader-desktop.html', 'Twofold: reader, desktop 1440', rd, 4)
        cd = await capture(b, 1440, 900, 'desktop', CREATOR_DESKTOP)
        write('figma/twofold-creator-desktop.html', 'Twofold: creator, desktop 1440', cd, 4)
        mb = await capture(b, 390, 844, 'phone', MOBILE)
        write('figma/twofold-mobile.html', 'Twofold: phone 390', mb, 7)
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())
