const MOCK_TXS = [
  {
    id: 1,
    from: { chain: 'Sepolia', symbol: 'S', color: '#627EEA' },
    to:   { chain: 'Amoy',    symbol: 'A', color: '#8247E5' },
    token: 'TST',
    amount: '250.00',
    received: '249.75 wTST',
    status: 'completed',
    time: '2 mins ago',
    hash: '0xabc1...def2',
  },
  {
    id: 2,
    from: { chain: 'Sepolia', symbol: 'S', color: '#627EEA' },
    to:   { chain: 'Amoy',    symbol: 'A', color: '#8247E5' },
    token: 'TST',
    amount: '100.00',
    received: '—',
    status: 'pending',
    time: '8 mins ago',
    hash: '0x123a...456b',
  },
  {
    id: 3,
    from: { chain: 'Sepolia', symbol: 'S', color: '#627EEA' },
    to:   { chain: 'Amoy',    symbol: 'A', color: '#8247E5' },
    token: 'TST',
    amount: '500.00',
    received: '500.00 TST (refunded)',
    status: 'refunded',
    time: '1 hour ago',
    hash: '0x789c...012d',
  },
]

const STATUS_COLORS = {
  completed: { bg: 'rgba(43,212,155,.12)', color: '#2BD49B', label: 'Completed' },
  pending:   { bg: 'rgba(108,77,246,.12)', color: '#a78bfa', label: 'Pending'   },
  refunded:  { bg: 'rgba(240,85,107,.12)', color: '#f0556b', label: 'Refunded'  },
}

function NetBadge({ net }) {
  return (
    <span
      className="net-icon"
      style={{ background: net.color, width: 18, height: 18, fontSize: 9 }}
    >
      {net.symbol}
    </span>
  )
}

export default function Transactions({ account }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-sub">Your recent bridge activity</p>
      </div>

      {!account ? (
        <div className="empty-notice">Connect your wallet to see your transactions</div>
      ) : (
        <div className="tx-list">
          {MOCK_TXS.map((tx) => {
            const s = STATUS_COLORS[tx.status]
            return (
              <div className="tx-card" key={tx.id}>
                <div className="tx-route">
                  <NetBadge net={tx.from} />
                  <span className="tx-chain-name">{tx.from.chain}</span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M12 5l5 5-5 5"/></svg>
                  <NetBadge net={tx.to} />
                  <span className="tx-chain-name">{tx.to.chain}</span>
                </div>

                <div className="tx-amounts">
                  <span className="tx-sent">{tx.amount} {tx.token}</span>
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M12 5l5 5-5 5"/></svg>
                  <span className="tx-received">{tx.received}</span>
                </div>

                <div className="tx-footer">
                  <span className="tx-time">{tx.time}</span>
                  <span className="tx-hash">{tx.hash}</span>
                  <span className="tx-badge" style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="info-box" style={{ marginTop: 16 }}>
        <span className="info-box-icon">i</span>
        <span>These are mock transactions. Live history loads once contracts are deployed.</span>
      </div>
    </div>
  )
}
