import { useState } from 'react'
import type { FormEvent } from 'react'
import type { UserResult } from '../types'
import { api } from '../services/api'
import { Search, UserCheck, ShieldAlert, Coins, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export function UsersView() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UserResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Balance adjustment modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustWalletType, setAdjustWalletType] = useState<'play_coins' | 'winning_coins'>('play_coins')
  const [adjustAction, setAdjustAction] = useState<'add' | 'deduct'>('add')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)

  // Status toggle state
  const [statusLoading, setStatusLoading] = useState(false)

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    setErrorMessage('')
    setActionSuccess('')
    setResult(null)
    setLoading(true)

    try {
      const clean = query.trim()
      const data = await api<UserResult>(
        `/operations/users/search?mobileNumber=${encodeURIComponent(clean)}`
      )
      setResult(data)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'User not found or search failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(newStatus: 'active' | 'suspended' | 'banned') {
    if (!result) return
    setStatusLoading(true)
    setActionSuccess('')
    setErrorMessage('')

    try {
      await api(`/admin/users/${result.user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setResult({
        ...result,
        user: { ...result.user, accountStatus: newStatus },
      })
      setActionSuccess(`User status updated to ${newStatus.toUpperCase()} in database.`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update user status on server.')
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleWalletAdjustment(e: FormEvent) {
    e.preventDefault()
    if (!result || !adjustAmount || Number(adjustAmount) <= 0) return
    setAdjustLoading(true)
    setErrorMessage('')
    setActionSuccess('')

    const numericAmount = Number(adjustAmount)
    const signedAmount = adjustAction === 'add' ? numericAmount : -numericAmount

    try {
      await api(`/admin/users/${result.user.id}/wallet/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          walletType: adjustWalletType,
          amount: signedAmount,
          reason: adjustReason || 'Admin Manual Adjustment',
        }),
      })

      // Update local wallet state
      const updatedWallets = result.wallets.map((w) => {
        if (w.walletType === adjustWalletType) {
          const newBal = Math.max(0, w.balance + signedAmount)
          return { ...w, balance: newBal, available: newBal }
        }
        return w
      })

      setResult({
        ...result,
        wallets: updatedWallets,
      })

      setActionSuccess(
        `Successfully ${adjustAction === 'add' ? 'credited' : 'debited'} ${numericAmount} ${
          adjustWalletType === 'play_coins' ? 'Play Coins' : 'Winning Coins'
        }.`
      )
      setShowAdjustModal(false)
      setAdjustAmount('')
      setAdjustReason('')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Wallet adjustment failed.')
    } finally {
      setAdjustLoading(false)
    }
  }

  return (
    <div className="users-container">
      <div className="page-intro with-action">
        <div>
          <span className="eyebrow">USER MANAGEMENT & OPERATIONS</span>
          <h2>Player Account Directory</h2>
          <p>Lookup any registered player by mobile number or user ID to manage balances, active matches, and status.</p>
        </div>
        {result && (
          <button className="secondary small-btn" onClick={() => setResult(null)}>
            ← Clear Search
          </button>
        )}
      </div>

      <form className="search-form-card" onSubmit={handleSearch}>
        <div className="search-input-group">
          <Search size={18} className="search-icon" />
          <input
            required
            type="text"
            placeholder="Enter user mobile number (e.g. 9876543210) or user ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Account'}
        </button>
      </form>

      {errorMessage && (
        <div className="alert-card error">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="alert-card success">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {result && (
        <div className="user-profile-view">
          <div className="profile-header-card">
            <div className="profile-identity">
              <div className="user-avatar-large">
                {result.user.name ? result.user.name.slice(0, 1).toUpperCase() : 'U'}
              </div>
              <div className="user-meta">
                <h3>{result.user.name || 'User Account'}</h3>
                <p className="user-sub">
                  <span>📱 {result.user.mobileNumber || 'No mobile'}</span>
                  <span>•</span>
                  <span>ID: {result.user.id}</span>
                  <span>•</span>
                  <span>Role: {result.user.role}</span>
                </p>
              </div>
            </div>

            <div className="profile-actions">
              <span className={`status-pill ${result.user.accountStatus.toLowerCase()}`}>
                {result.user.accountStatus.toUpperCase()}
              </span>
              <div className="action-buttons-row">
                <button
                  className="secondary small-btn"
                  onClick={() => setShowAdjustModal(true)}
                  title="Credit or Debit Coins"
                >
                  <Coins size={14} /> Adjust Balance
                </button>
                {result.user.accountStatus.toLowerCase() === 'active' ? (
                  <button
                    className="danger small-btn"
                    onClick={() => handleUpdateStatus('suspended')}
                    disabled={statusLoading}
                  >
                    <ShieldAlert size={14} /> Suspend
                  </button>
                ) : (
                  <button
                    className="success small-btn"
                    onClick={() => handleUpdateStatus('active')}
                    disabled={statusLoading}
                  >
                    <UserCheck size={14} /> Activate
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="user-stats-grid">
            <div className="stat-card">
              <div className="stat-label">Play Coins</div>
              <div className="stat-value coin-play">
                {result.wallets.find((w) => w.walletType === 'play_coins')?.balance ?? 0}
              </div>
              <small>Deposit / Entry Wallet</small>
            </div>
            <div className="stat-card">
              <div className="stat-label">Winning Coins</div>
              <div className="stat-value coin-win">
                {result.wallets.find((w) => w.walletType === 'winning_coins')?.balance ?? 0}
              </div>
              <small>Withdrawable Balance</small>
            </div>
            <div className="stat-card">
              <div className="stat-label">Lifetime Deposited</div>
              <div className="stat-value text-green">
                <ArrowDownLeft size={16} /> ₹{result.totals.deposited.toLocaleString()}
              </div>
              <small>Total Cash-ins</small>
            </div>
            <div className="stat-card">
              <div className="stat-label">Lifetime Withdrawn</div>
              <div className="stat-value text-purple">
                <ArrowUpRight size={16} /> ₹{result.totals.withdrawn.toLocaleString()}
              </div>
              <small>Total Cash-outs</small>
            </div>
          </div>

          <div className="activity-breakdown-card">
            <h4>Competition History & Participation</h4>
            <div className="activity-grid">
              <div className="act-box">
                <span>OMBs Joined</span>
                <strong>{result.activity.ombsJoined}</strong>
              </div>
              <div className="act-box">
                <span>OMBs Won</span>
                <strong className="text-green">{result.activity.ombsWon}</strong>
              </div>
              <div className="act-box">
                <span>Tournaments Joined</span>
                <strong>{result.activity.tournamentsJoined}</strong>
              </div>
              <div className="act-box">
                <span>Tournaments Won</span>
                <strong className="text-green">{result.activity.tournamentsWon}</strong>
              </div>
            </div>

            <div className="current-matches-strip">
              <div className="current-match-col">
                <span className="label">Active Running OMB:</span>
                <strong>{result.current.omb ? result.current.omb.code : 'None Active'}</strong>
              </div>
              <div className="current-match-col">
                <span className="label">Active Running Tournament:</span>
                <strong>
                  {result.current.tournament ? result.current.tournament.code : 'None Active'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Adjust User Balance</h3>
              <button className="close-btn" onClick={() => setShowAdjustModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleWalletAdjustment} className="modal-form">
              <label>
                Wallet Type
                <select
                  value={adjustWalletType}
                  onChange={(e) =>
                    setAdjustWalletType(e.target.value as 'play_coins' | 'winning_coins')
                  }
                >
                  <option value="play_coins">Play Coins (Deposit / Gameplay)</option>
                  <option value="winning_coins">Winning Coins (Withdrawal)</option>
                </select>
              </label>

              <label>
                Action
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${adjustAction === 'add' ? 'active-green' : ''}`}
                    onClick={() => setAdjustAction('add')}
                  >
                    + Credit (Add)
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${adjustAction === 'deduct' ? 'active-red' : ''}`}
                    onClick={() => setAdjustAction('deduct')}
                  >
                    - Debit (Deduct)
                  </button>
                </div>
              </label>

              <label>
                Amount (Coins)
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </label>

              <label>
                Audit Reason / Note
                <input
                  required
                  type="text"
                  placeholder="e.g. Compensation for dispute, bonus credit"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowAdjustModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={adjustLoading}>
                  {adjustLoading ? 'Applying...' : 'Confirm Balance Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
