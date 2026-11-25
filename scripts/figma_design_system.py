"""Design-system frame for the Figma HTML exports.

Adds one 1440-wide frame ("DS Twofold design system") above the screens in each export,
listing colour tokens, type, spacing, radii, elevation, motion and components with their
exact values from src/index.css and src/ui/kit.tsx. The screens are not touched.

Run on its own to patch existing exports in place:  python3 scripts/figma_design_system.py
figma_export.py also calls design_system_html() when it writes the files."""
import os, re

NEUTRALS = [('Ink', 'ink', '#191c36', 'Text, primary buttons, headers'), ('Ink 2', 'ink-2', '#4b4f6b', 'Secondary text'), ('Muted', 'muted', '#6f7390', 'Captions, meta'), ('Faint', 'faint', '#a3a6ba', 'Placeholders, hover borders'), ('Line', 'line', '#dde0e8', 'Borders, dividers'), ('Line 2', 'line-2', '#eceef3', 'Tracks, segmented bg'), ('Paper', 'paper', '#eef0f4', 'Page background'), ('Surface', 'surface', '#ffffff', 'Panels, cards')]
AUDIENCE = [('Human', 'human', '#d08a10', 'People: reading, CTA accents'), ('Human ink', 'human-ink', '#8a5a06', 'Amber text on light'), ('Human wash', 'human-wash', '#fbf1dd', 'People backgrounds'), ('Machine', 'machine', '#3a55e6', 'AI systems, links, focus'), ('Machine ink', 'machine-ink', '#2b3fb0', 'Blue text, hover'), ('Machine wash', 'machine-wash', '#e8ecfd', 'AI backgrounds, selection')]
USES = [('Read', 'use-read', '#d08a10', 'People reading'), ('Republish', 'use-republish', '#9c5b14', 'Brands, newsrooms'), ('AI quote', 'use-quote', '#3a55e6', 'Answer engines'), ('AI training', 'use-train', '#1fa0b8', 'Model builders')]
STATUS = [('Good', 'good', '#0e7f5f', 'Paid, verified, sealed'), ('Good wash', 'good-wash', '#e3f4ee', ''), ('Bad', 'bad', '#c93a31', 'Errors, holds, rejected'), ('Bad wash', 'bad-wash', '#fbe8e6', ''), ('Wait', 'wait', '#6b6f8a', 'Pending, loading'), ('Wait wash', 'wait-wash', '#eceef5', '')]


def _lum(h):
    r = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    r = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in r]
    return 0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2]


def contrast(a, b):
    x, y = sorted([_lum(a), _lum(b)], reverse=True)
    return (x + 0.05) / (y + 0.05)


def swatches(title, rows):
    cells = ''
    for name, tok, hexv, use in rows:
        cw, cp = contrast(hexv, '#ffffff'), contrast(hexv, '#eef0f4')
        light = _lum(hexv) > 0.5
        aa = 'AA' if cw >= 4.5 else ('AA large' if cw >= 3 else 'decor')
        cells += (f'<div class="sw"><div class="chip" style="background:{hexv};{"border:1px solid #dde0e8;" if light else ""}">'
                  f'<span style="color:{"#191c36" if light else "#fff"}">Aa</span></div>'
                  f'<p class="n">{name}</p><p class="m">{hexv.upper()}</p><p class="m">--color-{tok}</p>'
                  f'<p class="u">{use}</p><p class="c">on white {cw:.1f}:1 · {aa}<br>on paper {cp:.1f}:1</p></div>')
    return f'<h3>{title}</h3><div class="sws">{cells}</div>'


TYPE = [
    ('Display', 'Newsreader', 38, 500, 1.08, '-0.01em', 'Original reporting, paid for fairly', 'Welcome, hero headlines'),
    ('Headline', 'Newsreader', 28, 500, 1.15, '-0.01em', 'India’s under-23 squad will train in Goa', 'Lead story, page titles'),
    ('Card title', 'Newsreader', 18, 500, 1.3, '0', 'Marathwada groundwater: 412 wells, 2019–2026', 'Story cards, shelves'),
    ('Body, reading', 'Newsreader', 19, 400, 1.65, '0', 'The federation has booked two pitches and a sports-science team for six weeks.', 'Article body, editor body'),
    ('UI', 'Schibsted Grotesk', 14.5, 500, 1.4, '0', 'Publish · Save draft · Edit topics', 'Buttons (md), body UI'),
    ('UI small', 'Schibsted Grotesk', 13, 400, 1.4, '0', 'Because you follow football · 6 min read', 'Meta, small buttons'),
    ('Label', 'Schibsted Grotesk', 12, 600, 1.35, '0', 'For people &nbsp; For AI &nbsp; For both', 'Tags, table heads'),
    ('Number', 'Schibsted Grotesk', 34, 600, 1.1, '-0.02em', '₹59,716', 'Earnings, stats (tabular)'),
    ('Code, licence', 'JetBrains Mono', 12.5, 400, 1.6, '0', '"ai_quote": { "permission": "paid", "price_inr": 4 }', 'AI view, licence JSON'),
]


def type_rows():
    rows = ''
    for role, fam, size, wt, lh, ls, sample, use in TYPE:
        rows += (f'<div class="tr"><div class="tl"><p class="n">{role}</p><p class="m">{fam}</p>'
                 f'<p class="m">{size}px / {lh} · {wt}{" · " + ls if ls != "0" else ""}</p><p class="u">{use}</p></div>'
                 f'<div class="ts" style="font-family:\'{fam}\';font-size:{size}px;line-height:{lh};font-weight:{wt};letter-spacing:{ls}">{sample}</div></div>')
    return rows


CSS = """
.ds{width:1440px;background:#fff;color:#191c36;font-family:'Schibsted Grotesk',sans-serif;padding:72px 80px 90px;border-radius:0}
.ds h2{font:500 44px/1.1 'Newsreader',serif;margin:0 0 8px}
.ds .lead{font-size:17px;color:#4b4f6b;margin:0 0 40px;max-width:980px;line-height:1.5}
.ds h3{font-size:13px;font-weight:700;letter-spacing:.02em;color:#6f7390;margin:44px 0 16px;padding-top:20px;border-top:1px solid #dde0e8}
.ds p{margin:0}
.ds .sws{display:grid;grid-template-columns:repeat(8,1fr);gap:18px}
.ds .sw .chip{height:84px;border-radius:12px;display:flex;align-items:flex-end;padding:10px 12px;font:500 22px 'Newsreader',serif;margin-bottom:10px}
.ds .n{font-size:14px;font-weight:700}
.ds .m{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#4b4f6b;line-height:1.5}
.ds .u{font-size:12px;color:#6f7390;margin-top:4px;line-height:1.35}
.ds .c{font-size:11px;color:#0e7f5f;margin-top:4px;line-height:1.35}
.ds .tr{display:grid;grid-template-columns:260px 1fr;gap:32px;align-items:center;padding:16px 0;border-bottom:1px solid #eceef3}
.ds .row{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.ds .col{display:flex;flex-direction:column;gap:10px}
.ds .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.ds .grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:28px}
.ds .box{border:1px solid #dde0e8;border-radius:14px;padding:20px}
.ds .spec{font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f7390;margin-top:6px}
.ds .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:9px;font-size:14.5px;font-weight:500;white-space:nowrap}
.ds .btn.sm{height:32px;padding:0 12px;font-size:13px}
.ds .pri{background:#191c36;color:#fff}.ds .sec{background:#fff;color:#191c36;border:1px solid #dde0e8}.ds .mac{background:#3a55e6;color:#fff}.ds .gho{color:#4b4f6b}.ds .ok{background:#0e7f5f;color:#fff}
.ds .dis{opacity:.4}.ds .foc{outline:2px solid #3a55e6;outline-offset:2px}
.ds .seg{display:inline-flex;background:#eceef3;border-radius:10px;padding:3px;gap:2px}
.ds .seg span{height:32px;padding:0 12px;border-radius:8px;font-size:13.5px;font-weight:500;color:#6f7390;display:inline-flex;align-items:center}
.ds .seg .on{background:#fff;color:#191c36;box-shadow:0 1px 2px rgba(25,28,54,.12)}
.ds .chp{display:inline-flex;align-items:center;height:36px;padding:0 14px;border-radius:999px;border:1px solid #dde0e8;font-size:14px;background:#fff}
.ds .chp.on{background:#191c36;color:#fff;border-color:#191c36}
.ds .tag{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:600}
.ds .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.ds .meter{height:6px;border-radius:999px;background:#eceef3;overflow:hidden;width:260px}.ds .meter i{display:block;height:100%;border-radius:999px}
.ds .inp{height:40px;border:1px solid #dde0e8;border-radius:9px;padding:0 12px;font-size:14.5px;display:flex;align-items:center;width:300px;background:#fff;color:#a3a6ba}
.ds .inp.f{border-color:#3a55e6;outline:2px solid #3a55e6;outline-offset:2px;color:#191c36}
.ds .inp.e{border-color:#c93a31;color:#191c36}
.ds .err{font-size:12.5px;color:#c93a31;margin-top:6px}
.ds .card{border:1px solid #dde0e8;border-radius:14px;overflow:hidden;background:#fff}
.ds .ph{height:150px;background:linear-gradient(135deg,#2c5b4c,#8fb9a6)}
.ds pre{font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;background:#f7f8fb;border:1px solid #eceef3;border-radius:10px;padding:14px 16px;margin:0;white-space:pre;overflow:hidden}
.ds .k{color:#2b3fb0}.ds .s{color:#0e7f5f}.ds .num{color:#9c5b14}.ds .b{color:#c93a31}
.ds .sp{display:flex;align-items:flex-end;gap:22px}.ds .sp div{background:#e8ecfd;border:1px solid #3a55e6}
.ds .rad{display:flex;gap:22px;align-items:flex-end}.ds .rad div{width:84px;height:84px;background:#fbf1dd;border:1.5px solid #d08a10}
.ds table{border-collapse:collapse;width:100%;font-size:13px}.ds th{background:#191c36;color:#fff;text-align:left;padding:8px 10px;font-weight:600}.ds td{padding:8px 10px;border-bottom:1px solid #eceef3;vertical-align:top}
"""

STAR = '<svg viewBox="0 0 20 20" width="18" height="18"><path fill="{c}" d="M10 1.6l2.47 5.3 5.8.68-4.3 3.96 1.15 5.73L10 14.4l-5.12 2.87 1.15-5.73-4.3-3.96 5.8-.68z"/></svg>'


def design_system_html():
    stars = ''.join(STAR.format(c='#d08a10' if i < 4 else '#dde0e8') for i in range(5))
    body = f"""
<h2>Twofold design system</h2>
<p class="lead">Two audiences, two colours: <b style="color:#8a5a06">amber always means people</b>, <b style="color:#2b3fb0">blue always means machines</b>. Serif is for reading, grotesk is for doing, mono is what a machine reads. Every value below is the one the live app uses (src/index.css, src/ui/kit.tsx).</p>
{swatches('COLOUR · NEUTRALS', NEUTRALS)}
{swatches('COLOUR · TWO AUDIENCES', AUDIENCE)}
{swatches('COLOUR · USES (licence, earnings, charts)', USES)}
{swatches('COLOUR · STATUS (always with a word or icon)', STATUS)}
<p class="u" style="margin-top:14px">Rules: one amber or ink primary action per screen. Status colours never carry meaning alone: every status pill has a word. Amber text uses Human ink (#8A5A06), never raw amber on white (2.9:1).</p>

<h3>TYPE FAMILIES</h3>
<div class="grid3">
  <div class="box"><p style="font:500 40px/1.1 'Newsreader',serif">Newsreader</p><p class="spec">serif · variable 200–800 · optical size</p><p class="u">Reading: headlines, article body, editor. Says "this is a story".</p></div>
  <div class="box"><p style="font:600 36px/1.15 'Schibsted Grotesk',sans-serif">Schibsted Grotesk</p><p class="spec">sans · variable 400–900</p><p class="u">Doing: buttons, chips, labels, numbers (tabular), navigation.</p></div>
  <div class="box"><p style="font:400 30px/1.2 'JetBrains Mono',monospace">JetBrains Mono</p><p class="spec">mono · variable 100–800</p><p class="u">Machines: the AI view, licence JSON, fingerprints, codes.</p></div>
</div>
<h3>TYPE SCALE</h3>
{type_rows()}

<h3>SPACING · RADIUS · BORDER · ELEVATION</h3>
<div class="grid2">
  <div class="box"><p class="n">Spacing (4 px base)</p><div class="sp" style="margin-top:14px">{''.join(f'<div style="width:{v}px;height:{v}px"></div>' for v in (4, 8, 12, 16, 24, 32, 48, 64))}</div><p class="spec">4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 — card padding 20, panel gap 24, section gap 48</p></div>
  <div class="box"><p class="n">Radius</p><div class="rad" style="margin-top:14px">{''.join(f'<div style="border-radius:{r}"></div>' for r in ('6px', '9px', '10px', '14px', '16px', '999px'))}</div><p class="spec">6 tag · 9 button/input · 10 segmented (8 inner) · 14 panel · 16 overlay · full chip/pill</p></div>
  <div class="box"><p class="n">Border</p><div class="row" style="margin-top:14px"><div style="width:120px;height:56px;border:1px solid #dde0e8;border-radius:9px"></div><div style="width:120px;height:56px;border:1px solid #a3a6ba;border-radius:9px"></div><div style="width:120px;height:56px;border:2px solid #3a55e6;border-radius:9px"></div></div><p class="spec">1 px line (rest) · 1 px faint (hover) · 2 px machine (focus / selected)</p></div>
  <div class="box"><p class="n">Elevation</p><div class="row" style="margin-top:14px"><div style="width:120px;height:56px;border:1px solid #dde0e8;border-radius:14px"></div><div style="width:120px;height:56px;border-radius:10px;box-shadow:0 1px 2px rgba(25,28,54,.12);background:#fff"></div><div style="width:120px;height:56px;border-radius:16px;box-shadow:0 18px 40px rgba(25,28,54,.18);background:#fff"></div></div><p class="spec">0 panel (border only) · 1 segment on · 2 overlay / companion / menu</p></div>
</div>

<h3>COMPONENTS · ACTIONS</h3>
<div class="col">
  <div class="row"><span class="btn pri">Publish</span><span class="btn sec">Save draft</span><span class="btn mac">Ask AI about this story</span><span class="btn ok">Accept ₹9,500</span><span class="btn gho">Skip for now</span><span class="btn pri dis">Publish</span><span class="btn sec foc">Focused</span></div>
  <div class="row"><span class="btn pri sm">Next</span><span class="btn sec sm">Back</span><span class="btn mac sm">Connect</span><span class="spec">Button md: h40, px16, r9, 14.5/500 · sm: h32, px12, 13 · disabled 40% · focus 2 px #3A55E6 +2</span></div>
  <div class="row"><span class="seg"><span class="on">For people</span><span>For AI</span><span>For both</span></span><span class="seg"><span>Weekly</span><span class="on">Monthly</span></span><span class="spec">Segmented: bg Line 2, p3, r10; option h32 r8; on = surface + elevation 1</span></div>
</div>
<h3>COMPONENTS · SELECTION AND STATUS</h3>
<div class="col">
  <div class="row"><span class="chp on">✓ Cricket</span><span class="chp on">✓ Indian football</span><span class="chp">Kabaddi</span><span class="chp">Chess</span><span class="chp" style="border-style:dashed;color:#6f7390">+ Add your own</span><span class="spec">Chip: h36, r full, 14 · selected = ink fill with ✓</span></div>
  <div class="row"><span class="tag" style="background:#fbf1dd;color:#8a5a06"><i class="dot" style="background:#d08a10"></i>Read</span><span class="tag" style="background:#f3e6d6;color:#9c5b14"><i class="dot" style="background:#9c5b14"></i>Republish</span><span class="tag" style="background:#e8ecfd;color:#2b3fb0"><i class="dot" style="background:#3a55e6"></i>AI quote</span><span class="tag" style="background:#dff3f6;color:#13707f"><i class="dot" style="background:#1fa0b8"></i>AI training</span>
  <span class="tag" style="background:#e3f4ee;color:#0e7f5f">✓ Sealed</span><span class="tag" style="background:#fbe8e6;color:#c93a31">Held: reported</span><span class="tag" style="background:#eceef5;color:#6b6f8a">Waiting</span><span class="tag" style="background:#fbf1dd;color:#8a5a06">Promoted</span><span class="tag" style="background:#e8ecfd;color:#2b3fb0">AI-assisted 20%</span></div>
  <div class="row"><div class="col"><div class="meter"><i style="width:72%;background:#191c36"></i></div><div class="meter"><i style="width:58%;background:#d08a10"></i></div><div class="meter"><i style="width:41%;background:#3a55e6"></i></div><div class="meter"><i style="width:86%;background:#0e7f5f"></i></div></div><span class="spec">Meter: h6, track Line 2, tones ink / human / machine / good / bad</span><span style="display:inline-flex;align-items:center;gap:6px">{stars}<b style="font-size:15px">4.2</b></span><span class="spec">Stars: 18 px, filled Human, empty Line, partial by width</span></div>
</div>
<h3>COMPONENTS · INPUT</h3>
<div class="row" style="align-items:flex-start">
  <div><div class="inp">Ask anything, e.g. "football in India"</div><p class="spec">default</p></div>
  <div><div class="inp f">riya@inkpot</div><p class="spec">focus</p></div>
  <div><div class="inp e">riya@inkpot</div><p class="err">That email is missing a domain, like .com or .in</p></div>
  <div><div class="inp" style="width:120px;letter-spacing:8px;color:#191c36;justify-content:center">482913</div><p class="spec">6-digit code</p></div>
</div>

<h3>COMPONENTS · CONTENT</h3>
<div class="grid3">
  <div class="card"><div class="ph"></div><div style="padding:16px 18px"><p style="font-size:12px;color:#8a5a06;font-weight:600">Sports · Because you follow football</p><p style="font:500 18px/1.3 'Newsreader',serif;margin:6px 0">India’s under-23 football squad will train in Goa for six weeks</p><p style="font-size:13px;color:#6f7390;display:flex;gap:6px;align-items:center">Rohan Iyer {STAR.format(c='#d08a10')} 4.2 · 6 min · 128 likes</p></div></div>
  <div class="box"><p class="n" style="margin-bottom:10px">Licence row</p>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eceef3"><span class="tag" style="background:#e8ecfd;color:#2b3fb0"><i class="dot" style="background:#3a55e6"></i>AI quote</span><span class="seg"><span>Free</span><span class="on">Paid</span><span>Ask</span><span>No</span></span></div>
    <p style="font-size:13px;margin-top:10px">₹4 per quote · attribution line required · up to 60 words</p>
    <p class="n" style="margin:18px 0 8px">Value meter</p><p style="font-size:34px;font-weight:600">72<span style="font-size:15px;color:#6f7390"> / 100 · Medium confidence</span></p>
    <p style="font-size:13px;color:#0e7f5f;margin-top:6px">Suggestion: add where your numbers come from · +₹3 per read</p></div>
  <div><pre><span class="k">"uses"</span>: {{
  <span class="k">"read"</span>:       {{ <span class="k">"permission"</span>: <span class="s">"paid"</span>, <span class="k">"price_inr"</span>: <span class="num">12</span> }},
  <span class="k">"ai_quote"</span>:   {{ <span class="k">"permission"</span>: <span class="s">"paid"</span>, <span class="k">"price_inr"</span>: <span class="num">4</span> }},
  <span class="k">"ai_train"</span>:   {{ <span class="k">"permission"</span>: <span class="s">"no"</span> }},
  <span class="k">"republish"</span>:  {{ <span class="k">"permission"</span>: <span class="s">"ask"</span> }},
  <span class="k">"attribution"</span>: <span class="b">true</span>
}}</pre><p class="spec">AI view / licence JSON: mono 12.5/1.6 · keys machine ink · strings good · numbers republish · booleans bad</p></div>
</div>

<h3>MOTION AND DATA</h3>
<div class="grid2">
  <table><tr><th>Motion</th><th>Value</th><th>Used for</th></tr>
    <tr><td>pop-in</td><td>0.28 s, cubic-bezier(.2,.9,.3,1.1), 8 px rise</td><td>Overlays, companion, menus</td></tr>
    <tr><td>rise-in</td><td>0.3 s ease-out</td><td>Topics popping in during onboarding</td></tr>
    <tr><td>seal-in</td><td>0.5 s, scale .6 → 1, −12°</td><td>Seal stamp on publish</td></tr>
    <tr><td>arrive</td><td>3 s human-wash fade</td><td>A new use event in earnings</td></tr>
    <tr><td>marquee</td><td>40 s linear, pauses on hover</td><td>Markets ticker</td></tr>
    <tr><td>Reduced motion</td><td colspan="2">prefers-reduced-motion turns every animation off</td></tr></table>
  <table><tr><th>Chart</th><th>Rule</th></tr>
    <tr><td>Series colours</td><td>Fixed by use: read #D08A10, republish #9C5B14, AI quote #3A55E6, AI training #1FA0B8. Never cycled.</td></tr>
    <tr><td>Bars</td><td>Thin, rounded data-end, 2 px gap between stacked parts</td></tr>
    <tr><td>Labels</td><td>Text stays ink/muted; colour lives on the mark only</td></tr>
    <tr><td>Access</td><td>Legend always present; a Table toggle on every chart</td></tr>
    <tr><td>Money</td><td>₹ with Indian grouping (₹59,716); tabular numbers</td></tr></table>
</div>
"""
    return f'<div class="slot" style="margin-bottom:160px"><p class="label">DS Twofold design system: colour, type, spacing, components</p><div class="ds">{body}</div></div>'


def patch(path):
    doc = open(path).read()
    doc = re.sub(r'<!--DS-->.*?<!--/DS-->', '', doc, flags=re.S)
    doc = doc.replace('</style></head>', CSS + '</style></head>', 1) if '.ds{width:1440px' not in doc else doc
    doc = doc.replace('<div class="grid">', '<!--DS-->' + design_system_html() + '<!--/DS--><div class="grid">', 1)
    open(path, 'w').write(doc)
    print('design system added:', path)


if __name__ == '__main__':
    for f in ('figma/twofold-reader-desktop.html', 'figma/twofold-creator-desktop.html', 'figma/twofold-mobile.html'):
        patch(f)
