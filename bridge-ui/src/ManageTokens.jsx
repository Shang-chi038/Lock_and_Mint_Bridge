const TOKENS = [
  {
    symbol: 'TST',
    name: 'Test Token',
    chain: 'Sepolia',
    chainColor: '#627EEA',
    chainSymbol: 'S',
    color: '#6C4DF6',
    glyph: 'T',
    balance: '1,000.00',
    usdValue: '—',
    contract: '0x0000...0000',
  },
  {
    symbol: 'wTST',
    name: 'Wrapped Test Token',
    chain: 'Amoy (Polygon)',
    chainColor: '#8247E5',
    chainSymbol: 'A',
    color: '#2BD49B',
    glyph: 'W',
    balance: '0.00',
    usdValue: '—',
    contract: '0x0000...0000',
  },
]

export default function ManageTokens({ account }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Manage Tokens</h1>
        <p className="page-sub">Your token balances across all connected chains</p>
      </div>

      {!account && (
        <div className="empty-notice">Connect your wallet to see balances</div>
      )}

      <div className="token-list">
        {TOKENS.map((t) => (
          <div className="token-card" key={t.symbol}>
            <div className="token-card-left">
              <span
                className="tok-big-icon"
                style={{ background: t.color }}
              >
                {t.glyph}
              </span>
              <div>
                <div className="tok-symbol">{t.symbol}</div>
                <div className="tok-name">{t.name}</div>
              </div>
            </div>

            <div className="token-card-right">
              <div className="tok-chain-badge" style={{ borderColor: t.chainColor, color: t.chainColor }}>
                <span
                  className="net-icon"
                  style={{ background: t.chainColor, width: 14, height: 14, fontSize: 7 }}
                >
                  {t.chainSymbol}
                </span>
                {t.chain}
              </div>
              <div className="tok-balance">{account ? t.balance : '—'}</div>
              <div className="tok-usd">{t.usdValue}</div>
            </div>

            <div className="token-card-actions">
              <button
                className="tok-action-btn"
                onClick={() => alert('Connect to real contracts first — coming in Hour 6')}
              >
                + Add to MetaMask
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="info-box">
        <span className="info-box-icon">i</span>
        <span>Token balances will update live once contracts are deployed to testnet.</span>
      </div>
    </div>
  )
}
