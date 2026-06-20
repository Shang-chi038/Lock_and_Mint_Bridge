import { useState, useEffect, useRef } from 'react'
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
  const pollRef      = useRef(null)
  const countdownRef = useRef(null)
  const lockTimeRef  = useRef(null)

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
    if (lockedNonce === null || status !== 'LOCKED') {
      clearInterval(pollRef.current)
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
        const done = await mintReadOnly.processed(lockedNonce)
        if (done) {
          clearInterval(pollRef.current)
          clearInterval(countdownRef.current)
          setCountdown(null)
          setStatus('MINTED')
          setLockedNonce(null)
        }
      } catch {}
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(pollRef.current)
      clearInterval(countdownRef.current)
    }
  }, [lockedNonce, status])

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
      const tx = await lock.refund(nonce ?? lockedNonce)
      await tx.wait()
      setStatus('REFUNDED')
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
      <Sidebar active={activeNav} onNav={setActiveNav} />
      <div className="main">
        <NavBar
          theme={theme}
          onToggleTheme={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
          account={account}
          onConnect={connectWallet}
        />
        <main className="content">
          {activeNav === 'bridge' && (
            <div className="content-inner">
              <BridgeCard
                account={account}
                network={network}
                onConnect={connectWallet}
                onSwitchNetwork={switchToSepolia}
                status={status}
                onAdvance={advanceStatus}
                onReset={resetBridge}
                onLocked={(nonce) => { setLockedNonce(nonce); setStatus('LOCKED') }}
              />
              <BridgeTimeline
                status={status}
                countdown={countdown}
                onRequestRefund={() => handleRefund(lockedNonce)}
              />
            </div>
          )}
          {activeNav === 'manage'       && <ManageTokens account={account} />}
          {activeNav === 'swap'         && <Swap account={account} />}
          {activeNav === 'transactions' && <Transactions account={account} />}
        </main>
      </div>
    </div>
  )
}
