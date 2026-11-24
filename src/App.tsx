import type { ReactNode } from 'react'
import { useStore } from './store'
import { Avatar, Logo, cx, useRoute } from './ui/kit'
import Home from './screens/Home'
import Write from './screens/Write'
import LicenceBuilder from './screens/Licence'
import WorkPage from './screens/WorkPage'
import Earnings from './screens/Earnings'
import Demo from './screens/Demo'

export default function App() {
  const { path } = useRoute()
  if (path.startsWith('/studio')) {
    const tab = path.split('/')[2] || 'write'
    return (
      <StudioShell tab={tab}>
        {tab === 'licence' ? <LicenceBuilder /> : tab === 'earnings' ? <Earnings /> : tab === 'demo' ? <Demo /> : <Write />}
      </StudioShell>
    )
  }
  if (path.startsWith('/work/')) return <ReaderShell><WorkPage id={path.split('/')[2]} /></ReaderShell>
  return <ReaderShell><Home /></ReaderShell>
}

const TABS = [
  { id: 'write', label: 'Write & value', step: 1 },
  { id: 'licence', label: 'Licence', step: 2 },
  { id: 'earnings', label: 'Earnings' },
  { id: 'demo', label: 'Live demo' },
]

function StudioShell({ tab, children }: { tab: string; children: ReactNode }) {
  const { me } = useStore()
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[1360px] px-4 md:px-6 h-16 flex items-center gap-6">
          <a href="#/studio/write" aria-label="Twofold Studio" className="flex items-center gap-2">
            <Logo />
            <span className="text-[13px] text-muted font-medium hidden sm:inline">Studio</span>
          </a>
          <nav className="hidden md:flex items-center gap-1" aria-label="Studio">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={`#/studio/${t.id}`}
                aria-current={tab === t.id ? 'page' : undefined}
                className={cx('h-9 px-3.5 rounded-[9px] text-[14.5px] font-medium flex items-center gap-2', tab === t.id ? 'bg-surface text-ink border border-line' : 'text-ink-2 hover:text-ink')}
              >
                {t.step && <span className={cx('grid place-items-center w-5 h-5 rounded-full text-[11.5px]', tab === t.id ? 'bg-ink text-white' : 'bg-line text-ink-2')}>{t.step}</span>}
                {t.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a href="#/" className="text-[14px] text-ink-2 hover:text-ink font-medium">Reader home</a>
            <span className="hidden sm:flex items-center gap-2 pl-3 border-l border-line">
              <Avatar name={me.name} hue={me.avatarHue} size={30} />
              <span className="text-[14px] font-medium">{me.name}</span>
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1360px] px-4 md:px-6 py-6">{children}</main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line grid grid-cols-4" aria-label="Studio">
        {TABS.map((t) => (
          <a key={t.id} href={`#/studio/${t.id}`} aria-current={tab === t.id ? 'page' : undefined} className={cx('h-14 grid place-items-center text-[13px] font-medium', tab === t.id ? 'text-ink' : 'text-muted')}>
            <span className="flex flex-col items-center gap-0.5">
              <span className={cx('w-6 h-[3px] rounded-full', tab === t.id ? 'bg-ink' : 'bg-transparent')} />
              {t.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  )
}

function ReaderShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-surface sticky top-0 z-30">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 h-16 flex items-center gap-6">
          <a href="#/" aria-label="Twofold home"><Logo /></a>
          <nav className="hidden md:flex gap-5 text-[14.5px] text-ink-2 font-medium" aria-label="Sections">
            <a href="#/?s=Markets" className="hover:text-ink">Markets</a>
            <a href="#/?s=Data" className="hover:text-ink">Data</a>
            <a href="#/?s=Reviews" className="hover:text-ink">Reviews</a>
            <a href="#/?s=Cities" className="hover:text-ink">Cities</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-[13.5px] text-muted">Pass ₹199/month</span>
            <a href="#/studio/demo" className="hidden sm:grid h-9 px-3.5 rounded-[9px] border border-line text-[14px] font-medium place-items-center">Live demo</a>
            <a href="#/studio/write" className="h-9 px-3.5 rounded-[9px] bg-ink text-white text-[14px] font-medium grid place-items-center">Creator studio</a>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-line mt-16">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 text-[13px] text-muted flex flex-wrap gap-x-6 gap-y-2">
          <span>Prototype for a placement assignment. All people, companies and pieces are fictional.</span>
          <a className="underline" href="/api/mcp" onClick={(e) => { e.preventDefault(); window.open('/api/mcp', '_blank') }}>MCP endpoint for AI agents</a>
          <a className="underline" href="/robots.txt" target="_blank" rel="noreferrer">robots.txt licence pointer</a>
        </div>
      </footer>
    </div>
  )
}
