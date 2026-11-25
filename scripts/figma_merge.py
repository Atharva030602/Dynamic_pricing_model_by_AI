"""Merge the three Figma exports into one HTML document.

Output: figma/twofold-all.html — the design-system frame once, then three sections
(reader desktop, creator desktop, phone), each keeping its own grid. Fonts and styles
are included once. Captions are unchanged, so scripter-prototype.ts wires it as is."""
import re

SRC = [
    ('figma/twofold-reader-desktop.html', 'Reader, desktop 1440', 4),
    ('figma/twofold-creator-desktop.html', 'Creator, desktop 1440', 4),
    ('figma/twofold-mobile.html', 'Phone 390 (reader)', 8),
]
OUT = 'figma/twofold-all.html'


def parts(path):
    d = open(path).read()
    head = d[:d.index('</head>')]
    ds = re.search(r'<!--DS-->.*?<!--/DS-->', d, re.S).group(0)
    g0 = d.index('<div class="grid">') + len('<div class="grid">')
    g1 = d.rindex('</div></body></html>')
    return head, ds, d[g0:g1]


def main():
    head, ds, _ = parts(SRC[0][0])
    head = re.sub(r'<title>.*?</title>', '<title>Twofold: all screens and design system</title>', head)
    head = head.replace('.grid{display:grid;grid-template-columns:repeat(4,max-content);', '.grid{display:grid;')
    head += '<style>h2.section{font:600 44px/1.1 "Schibsted Grotesk",sans-serif;color:#191c36;margin:220px 0 80px}h2.section span{display:block;font-weight:400;font-size:24px;color:#4b4f6b;margin-top:12px}</style>'
    body = ['<h1 class="title">Twofold: every screen, desktop and phone, with the design system</h1>', ds]
    total = 0
    for path, title, cols in SRC:
        _, _, grid = parts(path)
        n = grid.count('<p class="label">')
        total += n
        body.append(f'<h2 class="section">{title}<span>{n} screens · captions like "D10 … (desktop)" are read by the Scripter script</span></h2>')
        body.append(f'<div class="grid" style="grid-template-columns:repeat({cols},max-content)">{grid}</div>')
    doc = head + '</head><body>' + ''.join(body) + '</body></html>'
    open(OUT, 'w').write(doc)
    print(OUT, len(doc) // 1024, 'KB', total, 'screens')


if __name__ == '__main__':
    main()
