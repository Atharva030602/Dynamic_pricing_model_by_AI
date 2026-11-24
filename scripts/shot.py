import sys, asyncio
from playwright.async_api import async_playwright
routes = sys.argv[1].split(',')
width = int(sys.argv[2]) if len(sys.argv) > 2 else 1440
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': width, 'height': 900}, device_scale_factor=1)
        logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        for r in routes:
            await pg.goto(f'http://localhost:5173/#{r}', wait_until='networkidle')
            await pg.wait_for_timeout(700)
            name = r.strip('/').replace('/','_').replace('?','_') or 'home'
            await pg.screenshot(path=f'/tmp/shots/{name}_{width}.png', full_page=True)
        print('\n'.join(logs[:20]))
        await b.close()
asyncio.run(main())
