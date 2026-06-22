import { useState, useEffect, useRef, Component } from 'react'
import { ethers } from 'ethers'
import Sidebar from './Sidebar'
import NavBar from './NavBar'
import BridgeCard from './BridgeCard'
import BridgeTimeline from './BridgeTimeline'
import ManageTokens from './ManageTokens'
import Swap from './Swap'
import Transactions from './Transactions'
import { mintReadOnly, getSignerContracts } from './contracts'
import './App.css'

class BridgeErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e) { console.error('[BridgeCard error]', e) }
  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Bridge failed to load</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
            {this.state.error.message}
          </div>
          <button className="cta" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const SEPOLIA_CHAIN_ID = '0xaa36a7'
const POLL_INTERVAL_MS = 5000
const LOCK_TIMEOUT_S   = 300 // must match LockContract constructor (5 minutes)

export default function App() {
  const [theme,    setTheme]    = useState(() => { try { return localStorage.getItem('ccb-theme') || 'dark' } catch { return 'dark' } })
  const [account,  setAccount]  = useState(null)
  const [network,  setNetwork]  = useState(null)
  const [activeNav, setActiveNav] = useState('bridge')
  const [status,   setStatus]   = useState('IDLE')
  const [lockedNonce,   setLockedNonce]   = useState(null)
  const [countdown,     setCountdown]     = useState(null)
  const [transactions,  setTransactions]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('ccb-txs') || '[]') } catch { return [] }
  })
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const pollRef      = useRef(null)
  const countdownRef = useRef(null)
  const lockTimeRef  = useRef(null)
  const hoverTimerRef = useRef(null)

  const sidebarVisible = sidebarOpen || sidebarHovered

  function handleMenuClick() {
    setSidebarOpen(o => !o)
    setSidebarHovered(false)
  }
  function handleSidebarHoverStart() {
    clearTimeout(hoverTimerRef.current)
    setSidebarHovered(true)
  }
  function handleSidebarHoverEnd() {
    hoverTimerRef.current = setTimeout(() => setSidebarHovered(false), 150)
  }

  function addTransaction(tx) {
    setTransactions(prev => {
      const next = [tx, ...prev]
      try { localStorage.setItem('ccb-txs', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function updateTransaction(nonce, update) {
    setTransactions(prev => {
      const next = prev.map(t => t.nonce === nonce ? { ...t, ...update } : t)
      try { localStorage.setItem('ccb-txs', JSON.stringify(next)) } catch {}
      return next
    })
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('ccb-theme', theme) } catch {}
  }, [theme])

  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum.on('accountsChanged', (accs) => setAccount(accs[0] || null))
    window.ethereum.on('chainChanged',    (id)   => setNetwork(id))
  }, [])

  // Poll MintContract on Amoy for confirmation once locked
  useEffect(() => {
    if (lockedNonce === null) {
      clearInterval(pollRef.current)
      clearInterval(countdownRef.current)
      return
    }
    setStatus('RELAYING')
    lockTimeRef.current = Date.now()

    // Countdown timer — ticks every second, triggers TIMED_OUT at 0
    setCountdown(LOCK_TIMEOUT_S)
    countdownRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lockTimeRef.current) / 1000)
      const remaining = LOCK_TIMEOUT_S - elapsed
      if (remaining <= 0) {
        clearInterval(countdownRef.current)
        clearInterval(pollRef.current)
        setCountdown(0)
        setStatus('TIMED_OUT')
      } else {
        setCountdown(remaining)
      }
    }, 1000)

    // Mint confirmation poller
    pollRef.current = setInterval(async () => {
      try {
        if (!mintReadOnly) return
        const done = await mintReadOnly.processed(lockedNonce)
        if (done) {
          clearInterval(pollRef.current)
          clearInterval(countdownRef.current)
          setCountdown(null)
          setStatus('MINTED')
          updateTransaction(lockedNonce, { status: 'completed' })
          setLockedNonce(null)
        }
      } catch {}
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(pollRef.current)
      clearInterval(countdownRef.current)
    }
  }, [lockedNonce])

  async function connectWallet() {
    if (!window.ethereum) { alert('MetaMask not found — install it from metamask.io'); return }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const chainId  = await window.ethereum.request({ method: 'eth_chainId' })
    setAccount(accounts[0])
    setNetwork(chainId)
  }

  async function switchToSepolia() {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] })
  }

  async function handleRefund(nonce) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer   = await provider.getSigner()
      const { lock } = getSignerContracts(signer)
      const nonceToRefund = nonce ?? lockedNonce
      const tx = await lock.refund(nonceToRefund)
      await tx.wait()
      setStatus('REFUNDED')
      updateTransaction(nonceToRefund, { status: 'refunded' })
    } catch (e) {
      alert('Refund failed: ' + (e.reason || e.message))
    }
  }

  function advanceStatus(next) { setStatus(next) }
  function resetBridge() {
    setStatus('IDLE')
    setLockedNonce(null)
    setCountdown(null)
    clearInterval(pollRef.current)
    clearInterval(countdownRef.current)
  }

  return (
    <div className="app">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar
        active={activeNav}
        onNav={(id) => { setActiveNav(id); setSidebarOpen(false) }}
        mobileVisible={sidebarVisible}
        onHoverStart={handleSidebarHoverStart}
        onHoverEnd={handleSidebarHoverEnd}
      />
      <div className="main">
        <NavBar
          theme={theme}
          onToggleTheme={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
          account={account}
          onConnect={connectWallet}
          onMenuClick={handleMenuClick}
          onMenuHoverStart={handleSidebarHoverStart}
          onMenuHoverEnd={handleSidebarHoverEnd}
        />
        <main className="content">
          {activeNav === 'bridge' && (
            <div className="content-inner">
              <BridgeErrorBoundary>
              <BridgeCard
                account={account}
                network={network}
                onConnect={connectWallet}
                onSwitchNetwork={switchToSepolia}
                status={status}
                onAdvance={advanceStatus}
                onReset={resetBridge}
                onLocked={({ nonce, hash, amount }) => {
                  setLockedNonce(nonce)
                  setStatus('LOCKED')
                  addTransaction({
                    id: Date.now(),
                    nonce,
                    hash,
                    amount,
                    token: 'TST',
                    from: { chain: 'Sepolia', symbol: 'S', color: '#627EEA' },
                    to:   { chain: 'Amoy',    symbol: 'A', color: '#8247E5' },
                    status: 'pending',
                    timestamp: Date.now(),
                  })
                }}
              />
              <BridgeTimeline
                status={status}
                countdown={countdown}
                onRequestRefund={() => handleRefund(lockedNonce)}
              />
              </BridgeErrorBoundary>
            </div>
          )}
          {activeNav === 'manage'       && <ManageTokens account={account} />}
          {activeNav === 'swap'         && <Swap account={account} />}
          {activeNav === 'transactions' && <Transactions account={account} transactions={transactions} />}
        </main>
      </div>
    </div>
  )
}
