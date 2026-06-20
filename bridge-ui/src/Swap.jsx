import { useState } from 'react'

export default function Swap({ account }) {
  const [fromAmt, setFromAmt] = useState('')

  const toAmt = fromAmt && !isNaN(Number(fromAmt))
    ? (Number(fromAmt) * 0.9975).toFixed(6).replace(/\.?0+$/, '')
    : ''

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Swap</h1>
        <p className="page-sub">Swap tokens on the same chain at near-zero slippage</p>
      </div>

      <div className="card">
        <div className="swap-page-section">
          <div className="swap-page-label">You pay</div>
          <div className="swap-page-row">
            <input
              className="swap-page-input"
              placeholder="0"
              inputMode="decimal"
              value={fromAmt}
              onChange={(e) => setFromAmt(e.target.value.replace(/[^0-9.]/g, ''))}
            />
            <div className="swap-page-token">
              <span className="net-icon" style={{ background: '#6C4DF6', width: 22, height: 22, fontSize: 11 }}>T</span>
              <span className="select-name">TST</span>
            </div>
          </div>
          <div className="swap-page-meta">Balance: {account ? '1,000.00' : '—'}</div>
        </div>

        <div className="swap-dir" style={{ margin: '10px 0' }}>
          <button className="swap-btn" onClick={() => {}}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3v11M7 14l-3-3M7 14l3-3"/><path d="M13 17V6M13 6l-3 3M13 6l3 3"/>
            </svg>
          </button>
        </div>

        <div className="swap-page-section">
          <div className="swap-page-label">You receive</div>
          <div className="swap-page-row">
            <input
              className="swap-page-input"
              placeholder="0"
              value={toAmt}
              readOnly
            />
            <div className="swap-page-token">
              <span className="net-icon" style={{ background: '#2BD49B', width: 22, height: 22, fontSize: 11 }}>W</span>
              <span className="select-name">wTST</span>
            </div>
          </div>
          <div className="swap-page-meta">Balance: {account ? '0.00' : '—'}</div>
        </div>

        <div className="fee-row" style={{ marginTop: 16 }}>
          <span className="fee-label">Rate</span>
          <span className="fee-value">1 TST ≈ 0.9975 wTST</span>
        </div>

        <button className="cta" disabled={!account || !fromAmt}>
          {!account ? 'Connect wallet to swap' : !fromAmt ? 'Enter an amount' : `Swap ${fromAmt} TST`}
        </button>

        <div className="foot-note">Powered by Frank Production. Bridged via Amoy and Sepolia</div>
      </div>
    </div>
  )
}
