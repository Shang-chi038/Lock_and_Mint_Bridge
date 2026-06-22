import { useState } from 'react'

const STATUS_COLORS = {
  completed: { bg: 'rgba(43,212,155,.12)',  color: '#2BD49B', label: 'Completed' },
  pending:   { bg: 'rgba(108,77,246,.12)',  color: '#a78bfa', label: 'Pending'   },
  refunded:  { bg: 'rgba(240,85,107,.12)',  color: '#f0556b', label: 'Refunded'  },
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function NetBadge({ net }) {
  return (
    <span className="net-icon" style={{ background: net.color, width: 18, height: 18, fontSize: 9 }}>
      {net.symbol}
    </span>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M12 5l5 5-5 5"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function TxDetail({ tx, onBack }) {
  const [copied, setCopied] = useState(false)
  const s = STATUS_COLORS[tx.status] || STATUS_COLORS.pending

  const received =
    tx.status === 'completed' ? `${tx.amount} wTST`
    : tx.status === 'refunded' ? `${tx.amount} TST (refunded)`
    : '—'

  function copyHash() {
    navigator.clipboard.writeText(tx.hash).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="page">
      <button className="tx-back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 10H4M8 5l-5 5 5 5"/>
        </svg>
        Back to transactions
      </button>

      <div className="tx-detail-card">
        <div className="tx-detail-top">
          <div className="tx-route">
            <NetBadge net={tx.from} />
            <span className="tx-chain-name">{tx.from.chain}</span>
            <ArrowRight />
            <NetBadge net={tx.to} />
            <span className="tx-chain-name">{tx.to.chain}</span>
          </div>
          <span className="tx-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
        </div>

        <div className="tx-detail-rows">
          <div className="tx-detail-row">
            <span className="tx-detail-label">Sent</span>
            <span className="tx-detail-value">{tx.amount} {tx.token}</span>
          </div>
          <div className="tx-detail-row">
            <span className="tx-detail-label">Received</span>
            <span className="tx-detail-value" style={{ color: tx.status === 'completed' ? '#2BD49B' : undefined }}>
              {received}
            </span>
          </div>
          <div className="tx-detail-row">
            <span className="tx-detail-label">Time</span>
            <span className="tx-detail-value">{timeAgo(tx.timestamp)}</span>
          </div>
        </div>

        <div className="tx-hash-section">
          <div className="tx-detail-label" style={{ marginBottom: 8 }}>Lock Transaction Hash</div>
          <div className="tx-hash-row">
            <span className="tx-hash-full" onClick={copyHash} title="Click to copy">{tx.hash}</span>
            <button
              className={`tx-copy-btn${copied ? ' copied' : ''}`}
              onClick={copyHash}
              title={copied ? 'Copied!' : 'Copy hash'}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
          <a
            href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
            target="_blank"
            rel="noreferrer"
            className="tx-etherscan-link"
          >
            View on Etherscan
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
              <path d="M18 13v5H2V3h5M11 2h7v7M18 2L9 11"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Transactions({ account, transactions = [] }) {
  const [selected, setSelected] = useState(null)

  if (selected) {
    return <TxDetail tx={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-sub">Your recent bridge activity</p>
      </div>

      {!account ? (
        <div className="empty-notice">Connect your wallet to see your transactions</div>
      ) : transactions.length === 0 ? (
        <div className="empty-notice">No transactions yet — bridge some tokens to get started</div>
      ) : (
        <div className="tx-list">
          {transactions.map((tx) => {
            const s = STATUS_COLORS[tx.status] || STATUS_COLORS.pending
            const received =
              tx.status === 'completed' ? `${tx.amount} wTST`
              : tx.status === 'refunded' ? `${tx.amount} TST (refunded)`
              : '—'
            return (
              <div className="tx-card tx-card-clickable" key={tx.id} onClick={() => setSelected(tx)}>
                <div className="tx-route">
                  <NetBadge net={tx.from} />
                  <span className="tx-chain-name">{tx.from.chain}</span>
                  <ArrowRight />
                  <NetBadge net={tx.to} />
                  <span className="tx-chain-name">{tx.to.chain}</span>
                </div>

                <div className="tx-amounts">
                  <span className="tx-sent">{tx.amount} {tx.token}</span>
                  <ArrowRight />
                  <span className="tx-received">{received}</span>
                </div>

                <div className="tx-footer">
                  <span className="tx-time">{timeAgo(tx.timestamp)}</span>
                  <span className="tx-hash">{tx.hash.slice(0, 10)}…{tx.hash.slice(-8)}</span>
                  <span className="tx-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
