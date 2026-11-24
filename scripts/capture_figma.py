# Freezes each screen's computed layout into a self-contained HTML document
# (one .frame per screen) for import into Figma as editable layers.
import asyncio, json, sys
from playwright.async_api import async_playwright

SCREENS = [
  ('Home', '/'), ('1 Write & value', '/studio/write'), ('2 Licence builder', '/studio/licence'),
  ('3 Public work page', '/work/tf_vlt_0001'), ('3b Work page as AI system', '/work/tf_vlt_0001?view=ai'), ('4 Earnings', '/studio/earnings'),
]
FREEZE = r"""
(frameName) => {
  const PROPS = ['display','position','top','right','bottom','left','z-index','box-sizing','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis','align-items','align-self','justify-content','justify-items','justify-self','align-content','gap','row-gap','column-gap','grid-template-columns','grid-template-rows','grid-column','grid-row',
    'margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left',
    'border-top-width','border-right-width','border-bottom-width','border-left-width','border-top-style','border-right-style','border-bottom-style','border-left-style','border-top-color','border-right-color','border-bottom-color','border-left-color',
    'border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius',
    'background-color','background-image','color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration-line','text-decoration-color','text-underline-offset','white-space','overflow-x','overflow-y','opacity','box-shadow','transform','vertical-align','list-style-type','text-overflow','-webkit-line-clamp','-webkit-box-orient','word-break','overflow-wrap','fill','stroke','stroke-width'];
  const fam = (f) => f.replace(/"?Schibsted Grotesk Variable"?/g,'"Schibsted Grotesk"').replace(/"?Newsreader Variable"?/g,'"Newsreader"').replace(/"?JetBrains Mono Variable"?/g,'"JetBrains Mono"');
  const root = document.getElementById('root');
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
    d.setAttribute('style', st.join(';'));
    d.removeAttribute('class');
    if (el.getAttribute('aria-label')) d.setAttribute('data-name', el.getAttribute('aria-label'));
  });
  const body = getComputedStyle(document.body);
  const w = document.documentElement.clientWidth, h = Math.max(document.documentElement.scrollHeight, 600);
  return `<div class="frame" id="${frameName.replace(/[^a-z0-9]+/gi,'-')}" data-name="${frameName}" aria-label="${frameName}" style="position:relative;overflow:hidden;width:${w}px;height:${h}px;background:${getComputedStyle(clone.firstElementChild ? root.firstElementChild : document.body).backgroundColor || body.backgroundColor};font-family:${fam(body.fontFamily)};color:${body.color}">${clone.innerHTML}</div>`;
}
"""
async def main():
    out = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for width, label in [(1440, 'Desktop'), (390, 'Phone')]:
            ctx = await b.new_context(viewport={'width': width, 'height': 900})
            pg = await ctx.new_page()
            await pg.goto('http://localhost:5173/#/'); await pg.evaluate("localStorage.clear()")
            for name, route in SCREENS:
                await pg.goto(f'http://localhost:5173/#{route}'); await pg.wait_for_timeout(900)
                if 'view=ai' in route:
                    await pg.click('text=Run the calls'); await pg.wait_for_timeout(4000)
                html = await pg.evaluate(FREEZE, f'{label} / {name}')
                out.append(html)
            await ctx.close()
        await b.close()
    import base64, glob
    faces = ''
    for fam, pat in [('Schibsted Grotesk', 'schibsted-grotesk/files/schibsted-grotesk-latin*-wght-normal.woff2'), ('Newsreader', 'newsreader/files/newsreader-latin*-opsz-normal.woff2'), ('JetBrains Mono', 'jetbrains-mono/files/jetbrains-mono-latin*-wght-normal.woff2')]:
        for f in sorted(glob.glob('node_modules/@fontsource-variable/' + pat)):
            b64 = base64.b64encode(open(f, 'rb').read()).decode()
            faces += "@font-face{font-family:'%s';font-weight:200 900;font-style:normal;src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, b64)
    doc = '<!doctype html><html><head><meta charset="utf-8"><title>Twofold screens</title><style>' + faces + '</style><style>body{margin:0;background:#dfe2ea;display:flex;flex-wrap:wrap;gap:80px;padding:80px;align-items:flex-start} *{box-sizing:border-box}</style></head><body>' + ''.join(out) + '</body></html>'
    open('/tmp/figma/twofold_screens.html', 'w').write(doc)
    print(len(doc) // 1024, 'KB', len(out), 'frames')
asyncio.run(main())
