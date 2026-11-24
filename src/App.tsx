import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from './store'
import { Avatar, Logo, Stars, cx, go, useRoute } from './ui/kit'
import Home from './screens/Home'
import Write from './screens/Write'
import LicenceBuilder from './screens/Licence'
import WorkPage from './screens/WorkPage'
import Earnings from './screens/Earnings'
import Demo from './screens/Demo'
import Onboarding from './screens/Onboarding'
import Community from './screens/Community'
import Hub, { StudioTour } from './screens/Hub'
import CreatorJoin from './screens/CreatorJoin'
import CreatorGate from './screens/CreatorGate'
import Report from './screens/Report'

export default function App() {
  const { path, params } = useRoute()
  const { profile, skippedOnboarding, creatorSession } = useStore()
  if (path === '/welcome') return <Onboarding />
  if (path === '/creator/join') return <CreatorJoin />
  if (path.startsWith('/studio')) {
    const tab = path.split('/')[2] || 'hub'
    if (!creatorSession) return <CreatorGate next={`/studio/${tab}`} />
    return (
      <StudioShell tab={tab}>
        {tab === 'hub' ? <Hub /> : tab === 'licence' ? <LicenceBuilder /> : tab === 'earnings' ? <Earnings /> : tab === 'demo' ? <Demo /> : <Write />}
      </StudioShell>
    )
  }
  if (path.startsWith('/work/')) return <ReaderShell><WorkPage id={path.split('/')[2]} /></ReaderShell>
  if (path === '/community') return <ReaderShell active="community"><Community /></ReaderShell>
  if (path === '/report') return <ReaderShell><Report /></ReaderShell>
  // first visit: start with onboarding, unless the visitor chose to just browse
  if (!profile && !skippedOnboarding && [...params.keys()].length === 0) return <Onboarding />
  return <ReaderShell active="home"><Home /></ReaderShell>
}

const TABS = [
  { id: 'hub', label: 'Hub' },
  { id: 'write', label: 'Write & value', step: 1 },
  { id: 'licence', label: 'Licence', step: 2 },
  { id: 'earnings', label: 'Earnings' },
  { id: 'demo', label: 'Live demo' },
]

function StudioShell({ tab, children }: { tab: string; children: ReactNode }) {
  const { me, tourDone, finishTour, creatorSession, startCreatorSession, ratingOf } = useStore()
  const { params } = useRoute()
  const showTour = params.get('tour') === '1' || (creatorSession === 'me' && !tourDone)
  const rating = ratingOf(me.id)
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[1360px] px-4 md:px-6 h-16 flex items-center gap-6">
          <a href="#/studio/hub" aria-label="Twofold Studio" className="flex items-center gap-2">
            <Logo />
            <span className="text-[13px] text-muted font-medium hidden sm:inline">Studio</span>
          </a>
          <nav className="hidden md:flex items-center gap-1" aria-label="Studio">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={`#/studio/${t.id}`}
                aria-current={tab === t.id ? 'page' : undefined}
                className={cx('h-9 px-3 rounded-[9px] text-[14.5px] font-medium flex items-center gap-2 whitespace-nowrap', tab === t.id ? 'bg-surface text-ink border border-line' : 'text-ink-2 hover:text-ink')}
              >
                {t.step && <span className={cx('grid place-items-center w-5 h-5 rounded-full text-[11.5px]', tab === t.id ? 'bg-ink text-white' : 'bg-line text-ink-2')}>{t.step}</span>}
                {t.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a href="#/" className="hidden lg:inline text-[14px] text-ink-2 hover:text-ink font-medium whitespace-nowrap">Reader home</a>
            <span className="hidden xl:flex items-center gap-2 pl-3 border-l border-line">
              <Avatar name={me.name} hue={me.avatarHue} size={30} />
              <span className="leading-tight">
                <span className="block text-[14px] font-medium whitespace-nowrap">{me.name}{creatorSession === 'demo' && <span className="ml-1.5 text-[11px] rounded-full bg-human-wash text-human-ink px-1.5 py-0.5 font-semibold">Demo</span>}</span>
                <Stars value={rating.stars} size={11} className="text-[11.5px]" />
              </span>
            </span>
            <button onClick={() => { startCreatorSession(null); go('/') }} className="text-[13px] text-muted hover:text-ink underline underline-offset-4 cursor-pointer whitespace-nowrap">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1360px] px-4 md:px-6 py-6">{children}</main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line grid grid-cols-5" aria-label="Studio">
        {TABS.map((t) => (
          <a key={t.id} href={`#/studio/${t.id}`} aria-current={tab === t.id ? 'page' : undefined} className={cx('h-14 grid place-items-center text-[12px] font-medium', tab === t.id ? 'text-ink' : 'text-muted')}>
            <span className="flex flex-col items-center gap-0.5 text-center leading-tight">
              <span className={cx('w-6 h-[3px] rounded-full', tab === t.id ? 'bg-ink' : 'bg-transparent')} />
              {t.id === 'write' ? 'Write' : t.label}
            </span>
          </a>
        ))}
      </nav>
      {showTour && <StudioTour onDone={() => { finishTour(); if (params.get('tour')) go(`/studio/${tab}`) }} />}
    </div>
  )
}

function ReaderShell({ children, active }: { children: ReactNode; active?: 'home' | 'community' }) {
  const { profile, setProfile } = useStore()
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false) }
    document.addEventListener('click', on)
    return () => document.removeEventListener('click', on)
  }, [])
  return (
    <div className="min-h-screen bg-surface pb-16 md:pb-0">
      <header className="border-b border-line bg-surface sticky top-0 z-30">
        <div className="mx-auto max-w-[1360px] px-4 md:px-6 h-16 flex items-center gap-6">
          <a href="#/" aria-label="Twofold home"><Logo /></a>
          <nav className="hidden md:flex gap-1 text-[14.5px] font-medium" aria-label="Main">
            <a href="#/" aria-current={active === 'home' ? 'page' : undefined} className={cx('h-9 px-3 rounded-[9px] grid place-items-center', active === 'home' ? 'text-ink bg-line-2' : 'text-ink-2 hover:text-ink')}>Home</a>
            <a href="#/community" aria-current={active === 'community' ? 'page' : undefined} className={cx('h-9 px-3 rounded-[9px] grid place-items-center', active === 'community' ? 'text-ink bg-line-2' : 'text-ink-2 hover:text-ink')}>Community</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a href="#/studio/demo" className="hidden lg:grid h-9 px-3.5 rounded-[9px] border border-line text-[14px] font-medium place-items-center">Live demo</a>
            <a href="#/community?new=1" title="Share a news link or ask a question" className="h-9 px-3.5 rounded-[9px] border border-line text-[14px] font-medium grid place-items-center">+ Add news</a>
            <a href="#/studio" className="hidden sm:grid h-9 px-3.5 rounded-[9px] bg-ink text-white text-[14px] font-medium place-items-center">Creator studio</a>
            {profile ? (
              <div className="relative" ref={ref}>
                <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Account" className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full hover:bg-line-2 cursor-pointer">
                  <Avatar name={profile.name} hue={330} size={28} />
                  <span className="hidden sm:inline text-[14px] font-medium max-w-[12ch] truncate">{profile.name.split(' ')[0]}</span>
                </button>
                {menu && (
                  <div className="absolute right-0 mt-2 w-60 rounded-[12px] border border-line bg-surface shadow-[0_8px_30px_rgba(25,28,54,.15)] p-1.5 text-[14px] pop-in">
                    <p className="px-3 py-2 text-muted text-[12.5px]">{profile.handle}, reader{profile.premium ? ', Premium' : ''}</p>
                    <a href="#/welcome" className="block px-3 py-2 rounded-[8px] hover:bg-line-2">Edit my topics</a>
                    <a href="#/?c=saved" className="block px-3 py-2 rounded-[8px] hover:bg-line-2">Saved stories</a>
                    <a href="#/report" className="block px-3 py-2 rounded-[8px] hover:bg-line-2">My reading report{profile.premium ? '' : ' (Premium)'}</a>
                    <a href="#/community" className="block px-3 py-2 rounded-[8px] hover:bg-line-2 md:hidden">Community</a>
                    <button onClick={() => { setProfile(null); go('/welcome') }} className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-line-2 cursor-pointer">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <a href="#/welcome" className="h-9 px-3.5 rounded-[9px] border border-line text-[14px] font-medium grid place-items-center">Sign up</a>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line grid grid-cols-4" aria-label="Main">
        {[['#/', 'Home', active === 'home'], ['#/community', 'Community', active === 'community'], ['#/?c=saved', 'Saved', false], ['#/studio', 'Studio', false]].map(([href, label, on]) => (
          <a key={label as string} href={href as string} aria-current={on ? 'page' : undefined} className={cx('h-14 grid place-items-center text-[12.5px] font-medium', on ? 'text-ink' : 'text-muted')}>
            <span className="flex flex-col items-center gap-0.5"><span className={cx('w-6 h-[3px] rounded-full', on ? 'bg-ink' : 'bg-transparent')} />{label as string}</span>
          </a>
        ))}
      </nav>
      <footer className="border-t border-line mt-16">
        <div className="mx-auto max-w-[1360px] px-4 md:px-6 py-8 text-[13px] text-muted flex flex-wrap gap-x-6 gap-y-2">
          <span>Prototype for a placement assignment. All people, companies and stories are fictional. Photos from Unsplash.</span>
          <a className="underline" href="/api/mcp" onClick={(e) => { e.preventDefault(); window.open('/api/mcp', '_blank') }}>MCP endpoint for AI agents</a>
          <a className="underline" href="/robots.txt" target="_blank" rel="noreferrer">robots.txt licence pointer</a>
        </div>
      </footer>
    </div>
  )
}
