const HAPPY = [
  { key: 'IDLE',     label: 'Idle' },
  { key: 'APPROVE',  label: 'Approved spend' },
  { key: 'LOCKED',   label: 'Tokens locked on Sepolia' },
  { key: 'RELAYING', label: 'Relayer minting on Amoy…' },
  { key: 'MINTED',   label: 'Minted on Amoy' },
]
const FAILURE = [
  { key: 'TIMED_OUT', label: 'Timed out', desc: 'Relayer did not respond within 5 minutes.' },
  { key: 'REFUNDED',  label: 'Refunded' },
]
const ORDER = ['IDLE','APPROVE','LOCKED','RELAYING','MINTED','TIMED_OUT','REFUNDED']
const idx   = (k) => ORDER.indexOf(k)

function fmtCountdown(s) {
  if (s === null || s === undefined) return ''
  const m = Math.floor(s / 60)
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

export default function BridgeTimeline({ status, countdown, onRequestRefund }) {
  if (status === 'IDLE') return null

  const cur = idx(status)
  const isFailure = status === 'TIMED_OUT' || status === 'REFUNDED'

  function stepState(key) {
    const si = idx(key)
    if (isFailure) {
      if (si <= idx('LOCKED'))   return 'done'
      if (si === idx('RELAYING') || si === idx('MINTED')) return 'skipped'
    }
    if (si < cur)  return 'done'
    if (si === cur) return 'active'
    return 'pending'
  }

  return (
    <div className="timeline">
      <h2>Bridge Status</h2>

      <div className="timeline-track">
        {HAPPY.map((step, i) => {
          const state = stepState(step.key)
          const showConnector = i < HAPPY.length - 1
          return (
            <div key={step.key} className="tl-step-wrap">
              <div className={`tl-step ${state}`}>
                <div className="tl-dot" />
                <div>
                  <div className="tl-label">{step.label}</div>
                  {state === 'active' && step.key === 'RELAYING' && countdown !== null && (
                    <div className="tl-desc">
                      Waiting for mint · refund available in <strong>{fmtCountdown(countdown)}</strong>
                    </div>
                  )}
                </div>
              </div>
              {showConnector && (
                <div className={`tl-connector${state === 'done' ? ' done' : ''}`} />
              )}
            </div>
          )
        })}
      </div>

      {isFailure && (
        <div className="tl-failure-branch">
          <div className="tl-branch-label">↓ Relay failed</div>
          <div className="timeline-track">
            {FAILURE.map((step) => {
              const state =
                step.key === status ? 'active'
                : status === 'REFUNDED' && step.key === 'TIMED_OUT' ? 'done'
                : 'pending'
              return (
                <div key={step.key} className="tl-step-wrap">
                  <div className={`tl-step ${state}`}>
                    <div className="tl-dot failure" />
                    <div>
                      <div className="tl-label">{step.label}</div>
                      {state === 'active' && step.desc && <div className="tl-desc">{step.desc}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {status === 'TIMED_OUT' && (
            <button className="refund-btn" onClick={onRequestRefund}>
              Request Refund
            </button>
          )}
        </div>
      )}

      {status === 'MINTED' && <div className="tl-success-msg">Bridge complete. Check your Amoy wallet for wTST.</div>}
      {status === 'REFUNDED' && <div className="tl-success-msg">Tokens returned to your Sepolia wallet.</div>}
    </div>
  )
}
