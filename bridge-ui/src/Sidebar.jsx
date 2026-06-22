const NAV = [
  {
    id: 'manage', label: 'Manage Tokens',
    icon: <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h14M3 14h14"/><circle cx="8" cy="6" r="2.1"/><circle cx="13" cy="14" r="2.1"/></svg>,
  },
  {
    id: 'bridge', label: 'Bridge',
    icon: <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h13M13 5l3 3-3 3"/><path d="M17 13H4M7 10l-3 3 3 3"/></svg>,
  },
  {
    id: 'swap', label: 'Swap',
    icon: <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v12M6 16l-2.5-2.5M6 16l2.5-2.5"/><path d="M14 16V4M14 4l-2.5 2.5M14 4l2.5 2.5"/></svg>,
  },
  {
    id: 'transactions', label: 'Transactions',
    icon: <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7.2"/><path d="M10 5.8V10l2.8 1.8"/></svg>,
  },
]

export default function Sidebar({ active, onNav, mobileVisible, onHoverStart, onHoverEnd }) {
  return (
    <aside
      className={`sidebar${mobileVisible ? ' mobile-visible' : ''}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="brand">
        <div className="brand-mark">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 15h16"/><path d="M6 15V4.3M14 15V4.3"/>
            <path d="M2 14.5Q3 4.8 6 4.3Q10 12 14 4.3Q17 4.8 18 14.5"/>
            <path d="M10 8.6V15"/>
          </svg>
        </div>
        <span className="brand-name">Cross-Chain Bridge</span>
      </div>

      <nav className="nav-list">
        {NAV.map((item) => (
          <div
            key={item.id}
            className={`nav-item${active === item.id ? ' active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-bar" />
            {item.icon}
            {item.label}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status">
          <span className="status-dot" />
          All systems operational
        </div>
      </div>
    </aside>
  )
}
