import { useState, useEffect, useRef } from 'react'

const Sun = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="10" cy="10" r="3.4"/>
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4"/>
  </svg>
)
const Moon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 11.3A6.6 6.6 0 0 1 8.7 3.5a6.6 6.6 0 1 0 7.8 7.8Z"/>
  </svg>
)

export default function NavBar({ theme, onToggleTheme, account, onConnect, onMenuClick, onMenuHoverStart, onMenuHoverEnd }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMoreOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  return (
    <header className="navbar">
      <button
        className="mobile-menu-btn"
        onClick={onMenuClick}
        onMouseEnter={onMenuHoverStart}
        onMouseLeave={onMenuHoverEnd}
        title="Menu"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 15h16"/><path d="M6 15V4.3M14 15V4.3"/>
          <path d="M2 14.5Q3 4.8 6 4.3Q10 12 14 4.3Q17 4.8 18 14.5"/>
          <path d="M10 8.6V15"/>
        </svg>
      </button>

      <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun /> : <Moon />}
      </button>

      <div className="menu" ref={menuRef}>
        <button className="ghost-btn" onClick={() => setMoreOpen((o) => !o)}>
          More
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 5 5-5"/></svg>
        </button>
        {moreOpen && (
          <div className="popover more-pop">
            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h7l3 3v11H5z"/><path d="M12 3v3h3M7.5 10h5M7.5 13h5"/></svg>Docs</div>
            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7.2"/><path d="M7.8 7.6a2.2 2.2 0 1 1 3 2.1c-.7.3-.8.7-.8 1.3M10 14h.01"/></svg>Support</div>
            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="2.6"/><path d="M16.2 12a1.3 1.3 0 0 0 .26 1.43l.05.05a1.6 1.6 0 1 1-2.26 2.26l-.05-.05a1.3 1.3 0 0 0-2.2.92V17a1.6 1.6 0 1 1-3.2 0v-.1a1.3 1.3 0 0 0-2.2-.9l-.05.05a1.6 1.6 0 1 1-2.26-2.26l.05-.05A1.3 1.3 0 0 0 3.8 12H3.7a1.6 1.6 0 1 1 0-3.2h.1A1.3 1.3 0 0 0 4.7 6.6l-.05-.05A1.6 1.6 0 1 1 6.9 4.3l.05.05a1.3 1.3 0 0 0 1.43.26H8.4a1.3 1.3 0 0 0 .8-1.2V3.3a1.6 1.6 0 1 1 3.2 0v.1a1.3 1.3 0 0 0 2.2.9l.05-.05a1.6 1.6 0 1 1 2.26 2.26l-.05.05a1.3 1.3 0 0 0-.26 1.43V8.4a1.3 1.3 0 0 0 1.2.8h.1a1.6 1.6 0 1 1 0 3.2h-.1Z"/></svg>Settings</div>
          </div>
        )}
      </div>

      <button className={`connect-btn${account ? ' connected' : ''}`} onClick={onConnect}>
        <span className="connect-dot" />
        <span>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Connect Wallet'}</span>
      </button>
    </header>
  )
}
