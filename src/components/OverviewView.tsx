import type { DashboardData } from '../types'
import { RefreshCw, Users, Shield, Coins, Trophy, TrendingDown, AlertTriangle, LogIn } from 'lucide-react'

interface OverviewViewProps {
  dashboard: DashboardData | null
  error: string
  retry: () => void
  isRefreshing: boolean
  onSignOut?: () => void
}

export function OverviewView({ dashboard, error, retry, isRefreshing, onSignOut }: OverviewViewProps) {
  if (error) {
    const isAuthError =
      error.toLowerCase().includes('auth') ||
      error.toLowerCase().includes('401') ||
      error.toLowerCase().includes('token')

    return (
      <div className="state-card error-state">
        <div className="state-icon">
          <AlertTriangle size={36} color="#f64e60" />
        </div>
        <h2>Dashboard Unavailable</h2>
        <p className="state-desc">{error}</p>
        <div className="state-tip">
          <span>{isAuthError ? 'Session Notice:' : 'Tip:'}</span>{' '}
          {isAuthError
            ? 'Your admin backend session token is missing, invalid, or expired on https://api.pagewoga.online.'
            : 'Check server connection or click below to retry.'}
        </div>
        <div className="header-btn-group" style={{ marginTop: '12px' }}>
          <button className="primary small-btn" onClick={retry} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing ? 'Retrying...' : 'Retry Connection'}
          </button>
          {isAuthError && onSignOut && (
            <button className="secondary small-btn" onClick={onSignOut}>
              <LogIn size={14} /> Sign In Again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="loading-card">
        <RefreshCw size={28} className="spinning" color="#aa3bff" />
        <p>Loading live metrics from server...</p>
      </div>
    )
  }

  const totals = dashboard.totals || {
    users: 0,
    hosts: 0,
    playCoins: 0,
    winningCoins: 0,
    cancelledOmbs: 0,
    cancelledTournaments: 0,
  }

  const metricCards = [
    {
      title: 'Total Users',
      value: (totals.users ?? 0).toLocaleString(),
      hint: 'Registered active accounts',
      icon: <Users size={22} color="#aa3bff" />,
      tag: 'Users',
    },
    {
      title: 'Active Hosts',
      value: (totals.hosts ?? 0).toLocaleString(),
      hint: 'OMB + Tournament organizers',
      icon: <Shield size={22} color="#3699ff" />,
      tag: 'Hosts',
    },
    {
      title: 'Play Coins in Circulation',
      value: (totals.playCoins ?? 0).toLocaleString(),
      hint: 'Deposit & game play balance',
      icon: <Coins size={22} color="#ffa800" />,
      tag: 'Play Coins',
    },
    {
      title: 'Winning Coins Balance',
      value: (totals.winningCoins ?? 0).toLocaleString(),
      hint: 'Available for withdrawal',
      icon: <Trophy size={22} color="#1bc5bd" />,
      tag: 'Winnings',
    },
  ]

  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">LIVE PLATFORM SNAPSHOT</span>
          <h2>Platform Overview & Metrics</h2>
          <p>Real-time analytics aggregated from Pagewoga AWS EC2 and RDS database.</p>
        </div>
        <div className="live-status-badge">
          <span className="live-dot" />
          <span>PRODUCTION LIVE</span>
        </div>
      </div>

      <div className="metric-grid">
        {metricCards.map((card, idx) => (
          <article className="metric-card" key={idx}>
            <div className="metric-card-top">
              <span className="metric-title">{card.title}</span>
              <div className="metric-icon-box">{card.icon}</div>
            </div>
            <strong className="metric-value">{card.value}</strong>
            <div className="metric-hint">
              <span className="badge-subtle">{card.tag}</span>
              <small>{card.hint}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="section-divider">
        <div>
          <span className="eyebrow">MONTHLY OPERATIONS</span>
          <h3>Cancellation & Dispute Pulse</h3>
        </div>
        <span className="period-chip">Live 30-Day Window</span>
      </div>

      <div className="chart-grid">
        <article className="pulse-card coral-pulse">
          <div className="pulse-header">
            <div className="pulse-title">
              <TrendingDown size={20} color="#f64e60" />
              <span>OMB Cancellations</span>
            </div>
            <strong>{(totals.cancelledOmbs ?? 0).toLocaleString()}</strong>
          </div>
          <div className="pulse-footer" style={{ marginTop: '12px' }}>
            <small>Dispute & Cancellation Count: {(totals.cancelledOmbs ?? 0)}</small>
            <span>Auto-refunded to Play Coins</span>
          </div>
        </article>

        <article className="pulse-card teal-pulse">
          <div className="pulse-header">
            <div className="pulse-title">
              <TrendingDown size={20} color="#1bc5bd" />
              <span>Tournament Cancellations</span>
            </div>
            <strong>{(totals.cancelledTournaments ?? 0).toLocaleString()}</strong>
          </div>
          <div className="pulse-footer" style={{ marginTop: '12px' }}>
            <small>Cancelled Tournament Count: {(totals.cancelledTournaments ?? 0)}</small>
            <span>Slot fees returned immediately</span>
          </div>
        </article>
      </div>

      <div className="section-divider">
        <div>
          <span className="eyebrow">FINANCIAL LEADERBOARDS</span>
          <h3>Top Player Transactions</h3>
        </div>
      </div>

      <div className="leader-grid">
        <LeaderboardCard
          title="Top Deposits (Play Coins)"
          badge="Deposits"
          rows={dashboard.topDeposits || []}
          emptyText="No deposit records found in this cycle."
        />
        <LeaderboardCard
          title="Top Withdrawals (Winning Coins)"
          badge="Payouts"
          rows={dashboard.topWithdrawals || []}
          emptyText="No withdrawal records found in this cycle."
        />
      </div>
    </div>
  )
}

function LeaderboardCard({
  title,
  badge,
  rows,
  emptyText,
}: {
  title: string
  badge: string
  rows: { userId: string; userName?: string; total: number }[]
  emptyText: string
}) {
  return (
    <article className="leader-card">
      <div className="leader-card-header">
        <h4>{title}</h4>
        <span className="badge-tag">{badge}</span>
      </div>
      <div className="leader-list">
        {rows && rows.length > 0 ? (
          rows.slice(0, 5).map((row, index) => (
            <div className="leader-item" key={row.userId || index}>
              <div className="leader-rank">#{index + 1}</div>
              <div className="leader-info">
                <span className="leader-name">{row.userName || `User ${row.userId.slice(0, 8)}`}</span>
                <small className="leader-id">{row.userId}</small>
              </div>
              <strong className="leader-amount">₹{(row.total ?? 0).toLocaleString()}</strong>
            </div>
          ))
        ) : (
          <div className="leader-empty">
            <p>{emptyText}</p>
          </div>
        )}
      </div>
    </article>
  )
}
