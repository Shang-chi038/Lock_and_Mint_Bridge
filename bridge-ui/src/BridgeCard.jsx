import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { tstReadOnly, mintReadOnly, getSignerContracts, ADDRESSES, TST_ABI } from './contracts'

const NETWORKS = [
  { id: 'sepolia', name: 'Sepolia',         color: '#627EEA', symbol: 'S' },
  { id: 'amoy',   name: 'Amoy (Polygon)',   color: '#8247E5', symbol: 'A' },
]
const TOKENS = [
  { id: 'tst', symbol: 'TST', name: 'Test Token', color: '#6C4DF6', glyph: 'T' },
]
const PILLS = [10, 25, 50, 'MAX']

function fmt(n) {
  if (!n && n !== 0) return '0'
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 4 })
}

function NetIcon({ net, size = 20 }) {
  return (
    <span className="net-icon" style={{ background: net.color, width: size, height: size, fontSize: size * 0.5 }}>
      {net.symbol}
    </span>
  )
}
function TokIcon({ tok, size = 20 }) {
  return (
    <span className="token-icon" style={{ background: tok.color, width: size, height: size, fontSize: size * 0.46 }}>
      {tok.glyph}
    </span>
  )
}

function Select({ id, children, open, onToggle, popContent }) {
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) open && onToggle(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open, onToggle])
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className="select" onClick={(e) => { e.stopPropagation(); onToggle(open ? null : id) }}>
        {children}
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 5 5-5"/></svg>
      </div>
      {open && <div className="popover select-pop">{popContent}</div>}
    </div>
  )
}

export default function BridgeCard({ account, network, onConnect, onSwitchNetwork, status, onAdvance, onReset, onLocked }) {
  const SEPOLIA_ID = '0xaa36a7'
  const [fromNetId,  setFromNetId]  = useState('sepolia')
  const [toNetId,    setToNetId]    = useState('amoy')
  const [tokenId,    setTokenId]    = useState('tst')
  const [amount,     setAmount]     = useState('')
  const [activePill, setActivePill] = useState(null)
  const [openDrop,   setOpenDrop]   = useState(null)
  const [balance,    setBalance]    = useState(0)
  const [wBalance,   setWBalance]   = useState(0)
  const [txHash,     setTxHash]     = useState(null)
  const [ctaLoading, setCtaLoading] = useState(false)
  const [txError,    setTxError]    = useState(null)

  const fromNet = NETWORKS.find((n) => n.id === fromNetId)
  const toNet   = NETWORKS.find((n) => n.id === toNetId)
  const token   = TOKENS.find((t) => t.id === tokenId)
  const amtNum  = parseFloat(amount) || 0
  const wrongNetwork = account && network !== SEPOLIA_ID

  // Fetch real TST balance on Sepolia
  useEffect(() => {
    if (!account) { setBalance(0); return }
    ;(async () => {
      try {
        if (window.ethereum && network === '0xaa36a7') {
          // User is on Sepolia — read straight from MetaMask, no external RPC key needed
          const provider = new ethers.BrowserProvider(window.ethereum)
          const tst = new ethers.Contract(ADDRESSES.TST, TST_ABI, provider)
          const raw = await tst.balanceOf(account)
          setBalance(Number(ethers.formatUnits(raw, 18)))
        } else if (tstReadOnly) {
          const raw = await tstReadOnly.balanceOf(account)
          setBalance(Number(ethers.formatUnits(raw, 18)))
        }
      } catch (e) {
        console.error('[TST balance]', e)
        setBalance(0)
      }
    })()
  }, [account, network, status])

  // Fetch real wTST balance on Amoy
  useEffect(() => {
    if (!account || !mintReadOnly) { setWBalance(0); return }
    mintReadOnly.balanceOf(account)
      .then((raw) => setWBalance(Number(ethers.formatUnits(raw, 18))))
      .catch((e) => { console.error('[wTST balance]', e); setWBalance(0) })
  }, [account, status])

  function swapNetworks() {
    setFromNetId(toNetId); setToNetId(fromNetId)
    setAmount(''); setActivePill(null); setOpenDrop(null)
  }

  function pickPill(p) {
    const pct = p === 'MAX' ? 1 : p / 100
    const v = balance * pct
    setAmount(v ? String(+v.toFixed(6)) : '')
    setActivePill(p)
  }

  function handleAmountInput(e) {
    setAmount(e.target.value.replace(/[^0-9.]/g, ''))
    setActivePill(null)
  }

  async function handleApprove() {
    setCtaLoading(true); setTxError(null)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer   = await provider.getSigner()
      const { tst }  = getSignerContracts(signer)
      const raw = ethers.parseUnits(String(amtNum), 18)
      const tx  = await tst.approve(ADDRESSES.LOCK_CONTRACT, raw)
      setTxHash(tx.hash)
      await tx.wait()
      onAdvance('APPROVE')
    } catch (e) {
      setTxError(e.reason || e.message || 'Approval failed')
    } finally {
      setCtaLoading(false)
    }
  }

  async function handleLock() {
    setCtaLoading(true); setTxError(null)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer   = await provider.getSigner()
      const { lock } = getSignerContracts(signer)
      const raw = ethers.parseUnits(String(amtNum), 18)
      const tx  = await lock.lock(raw)
      setTxHash(tx.hash)
      const receipt = await tx.wait()
      // Extract nonce from Locked event
      const iface  = new ethers.Interface(['event Locked(address indexed sender, uint256 amount, uint256 nonce)'])
      let nonce = null
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log)
          if (parsed?.name === 'Locked') { nonce = Number(parsed.args.nonce); break }
        } catch {}
      }
      onAdvance('LOCKED')
      if (nonce !== null) onLocked({ nonce, hash: tx.hash, amount: String(amtNum) })
    } catch (e) {
      setTxError(e.reason || e.message || 'Lock failed')
    } finally {
      setCtaLoading(false)
    }
  }

  // CTA state machine
  const isBusy = status === 'LOCKED' || status === 'RELAYING'
  const isDone = status === 'MINTED' || status === 'REFUNDED'

  let ctaLabel, ctaDisabled, ctaAction
  if (ctaLoading) {
    ctaLabel = 'Waiting for wallet…'; ctaDisabled = true; ctaAction = null
  } else if (!account) {
    ctaLabel = 'Connect wallet & bridge'; ctaDisabled = false; ctaAction = onConnect
  } else if (wrongNetwork) {
    ctaLabel = 'Switch to Sepolia'; ctaDisabled = false; ctaAction = onSwitchNetwork
  } else if (isDone) {
    ctaLabel = 'Bridge again'; ctaDisabled = false; ctaAction = onReset
  } else if (isBusy) {
    ctaLabel = 'Bridging…'; ctaDisabled = true; ctaAction = null
  } else if (status === 'TIMED_OUT') {
    ctaLabel = 'Awaiting refund…'; ctaDisabled = true; ctaAction = null
  } else if (amtNum <= 0) {
    ctaLabel = 'Enter an amount'; ctaDisabled = true; ctaAction = null
  } else if (amtNum > balance) {
    ctaLabel = 'Insufficient balance'; ctaDisabled = true; ctaAction = null
  } else if (status === 'IDLE') {
    ctaLabel = `Approve ${fmt(amtNum)} TST`; ctaDisabled = false; ctaAction = handleApprove
  } else if (status === 'APPROVE') {
    ctaLabel = `Lock ${fmt(amtNum)} TST`; ctaDisabled = false; ctaAction = handleLock
  }

  const hasAmount = amtNum > 0
  const receiveAmt = hasAmount ? fmt(+(amtNum).toFixed(4)) : null

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">Bridge</h1>
        <span className="help-dot" title="Move assets across chains">?</span>
      </div>

      {/* Transfer from */}
      <div className="well-label">Transfer from</div>
      <div className="well">
        <div className="well-row">
          <div className="field">
            <div className="field-label">Network</div>
            <Select id="fromNet" open={openDrop === 'fromNet'} onToggle={setOpenDrop}
              popContent={NETWORKS.map((n) => (
                <div key={n.id} className="option" onClick={() => { setFromNetId(n.id); setOpenDrop(null) }}>
                  <NetIcon net={n} size={22} /><span className="option-name">{n.name}</span>
                </div>
              ))}>
              <NetIcon net={fromNet} /><span className="select-name">{fromNet.name}</span>
            </Select>
          </div>

          <div className="field">
            <div className="field-label">Token</div>
            <Select id="fromTok" open={openDrop === 'fromTok'} onToggle={setOpenDrop}
              popContent={TOKENS.map((t) => (
                <div key={t.id} className="option" onClick={() => { setTokenId(t.id); setAmount(''); setActivePill(null); setOpenDrop(null) }}>
                  <TokIcon tok={t} size={22} />
                  <div className="option-text">
                    <span className="option-name">{t.symbol}</span>
                    <span className="option-sub">{t.name}</span>
                  </div>
                </div>
              ))}>
              <TokIcon tok={token} /><span className="select-name">{token.symbol}</span>
            </Select>
          </div>

          <div className="balance-field">
            <div className="field-label">Balance:</div>
            <div className="balance-value">{fmt(balance)}</div>
          </div>
        </div>

        <div className="amount-row">
          <input className="amount-input" inputMode="decimal" placeholder="0"
            value={amount} onChange={handleAmountInput}
            disabled={isBusy || isDone || status === 'TIMED_OUT' || ctaLoading}
          />
          <div className="pills">
            {PILLS.map((p) => (
              <div key={p} className={`pill${activePill === p ? ' active' : ''}`} onClick={() => pickPill(p)}>
                {p === 'MAX' ? 'MAX' : `${p}%`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Swap direction */}
      <div className="swap-dir">
        <button className="swap-btn" onClick={swapNetworks} title="Swap direction">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3v11M7 14l-3-3M7 14l3-3"/><path d="M13 17V6M13 6l-3 3M13 6l3 3"/>
          </svg>
        </button>
      </div>

      {/* Transfer to */}
      <div className="well-label">Transfer to</div>
      <div className="well">
        <div className="well-row">
          <div className="field">
            <div className="field-label">Network</div>
            <Select id="toNet" open={openDrop === 'toNet'} onToggle={setOpenDrop}
              popContent={NETWORKS.map((n) => (
                <div key={n.id} className="option" onClick={() => { setToNetId(n.id); setOpenDrop(null) }}>
                  <NetIcon net={n} size={22} /><span className="option-name">{n.name}</span>
                </div>
              ))}>
              <NetIcon net={toNet} /><span className="select-name">{toNet.name}</span>
            </Select>
          </div>
          <div className="balance-field">
            <div className="field-label">Balance:</div>
            <div className="balance-value">{fmt(wBalance)}</div>
          </div>
        </div>

        {receiveAmt && (
          <div className="receive-row">
            <span className="receive-label">You receive</span>
            <span className="receive-value">{receiveAmt} wTST</span>
          </div>
        )}
      </div>

      {/* Fee */}
      <div className="fee-row">
        <span className="fee-label">
          Service Fee:
          <span className="fee-info" title="Network & protocol fee">i</span>
        </span>
        <span className="fee-value">{hasAmount ? '≈ $0.00 (testnet)' : '—'}</span>
      </div>

      {/* Tx hash link while in flight */}
      {txHash && (isBusy || ctaLoading) && (
        <div className="foot-note" style={{ marginTop: 10 }}>
          Tx: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent)' }}>{txHash.slice(0, 12)}…</a>
        </div>
      )}

      {/* Error */}
      {txError && (
        <div className="foot-note" style={{ color: 'var(--danger)', marginTop: 10 }}>{txError}</div>
      )}

      {/* CTA */}
      <button className="cta" disabled={ctaDisabled} onClick={ctaAction}>{ctaLabel}</button>

      <div className="foot-note">Powered by Frank Production. Bridged via Amoy and Sepolia</div>
    </div>
  )
}
