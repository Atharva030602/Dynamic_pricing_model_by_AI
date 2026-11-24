import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
        pg = await ctx.new_page()
        await pg.goto('http://localhost:5173/#/'); await pg.evaluate('localStorage.clear()')
        async def shot(route, name, before=None, clip=None):
            await pg.goto(f'http://localhost:5173/#{route}'); await pg.wait_for_timeout(900)
            if before: await before()
            await pg.evaluate("""() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.nodeValue.includes('localhost:5173')) n.nodeValue = n.nodeValue.replaceAll('http://localhost:5173', 'https://twofold.app').replaceAll('localhost:5173', 'twofold.app') } }""")
            await pg.screenshot(path=f'/home/claude/deck/img/{name}.png', clip=clip or {'x':0,'y':0,'width':1440,'height':900})
        await shot('/studio/write', 'write')
        async def seo():
            await pg.click('text=Padded SEO piece'); await pg.wait_for_timeout(500)
        await shot('/studio/write', 'write_seo', seo, {'x':960,'y':80,'width':440,'height':820})
        await pg.click('text=Your draft'); await pg.wait_for_timeout(300)
        await shot('/studio/licence', 'licence')
        await shot('/work/tf_vlt_0001', 'work')
        async def ai():
            await pg.click('text=Run the calls'); await pg.wait_for_timeout(4200)
            await pg.evaluate('document.querySelectorAll("ol > li details").forEach((d, i, a) => { d.open = i === a.length - 2 })'); await pg.wait_for_timeout(200)
        await shot('/work/tf_vlt_0001?view=ai', 'work_ai', ai)
        await shot('/studio/earnings', 'earnings')
        async def scroll_deriv():
            await pg.evaluate("[...document.querySelectorAll('h2')].find(h => h.textContent.includes('Built on your work')).scrollIntoView({block: 'start'}); window.scrollBy(0, -88)"); await pg.wait_for_timeout(300)
        await shot('/studio/earnings', 'earnings_deriv', scroll_deriv)
        await shot('/', 'home')
        await b.close()
asyncio.run(main())
