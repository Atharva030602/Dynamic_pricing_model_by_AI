import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto('http://localhost:5173/#/studio/write'); await pg.wait_for_timeout(800)
        # AI review (rules fallback, no key locally)
        await pg.click('text=Get an AI second opinion'); await pg.wait_for_timeout(800)
        print('review:', (await pg.inner_text('aside[aria-label="Value estimate"]'))[-400:].replace('\n',' | '))
        # SEO sample
        await pg.click('text=Padded SEO piece'); await pg.wait_for_timeout(400)
        print('seo est:', await pg.inner_text('[aria-live="polite"]'))
        await pg.click('text=Your draft'); await pg.wait_for_timeout(300)
        # second tab: home
        home = await ctx.new_page(); await home.goto('http://localhost:5173/#/'); await home.wait_for_timeout(600)
        await pg.goto('http://localhost:5173/#/studio/licence'); await pg.wait_for_timeout(500)
        await pg.click('text=Keep me out of AI training'); await pg.wait_for_timeout(200)
        await pg.click('text=Publish and seal'); await pg.wait_for_timeout(1500)
        print('dialog:', (await pg.inner_text('[role=dialog]'))[:200].replace('\n',' | '))
        await home.wait_for_timeout(1200)
        print('home lead:', (await home.inner_text('main h1'))[:90])
        await home.screenshot(path='/tmp/shots/e2e_home.png')
        await pg.click('text=Open the public page'); await pg.wait_for_timeout(1200)
        print('work url:', pg.url)
        await pg.click('text=An AI system'); await pg.wait_for_timeout(300)
        await pg.click('text=Run the calls'); await pg.wait_for_timeout(4500)
        print('steps:', await pg.locator('ol > li').count())
        await pg.screenshot(path='/tmp/shots/e2e_ai.png', full_page=True)
        await pg.goto('http://localhost:5173/#/studio/earnings'); await pg.wait_for_timeout(1000)
        txt = await pg.inner_text('main')
        i = txt.find('Latest activity'); print('activity:', txt[i:i+300].replace('\n',' | '))
        print('errors:', errs[:5])
        await b.close()
asyncio.run(main())
