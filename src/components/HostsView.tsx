import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { Host } from '../types'
import { api } from '../services/api'
import { UserPlus, IndianRupee, Key, Shield, ShieldCheck, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react'

export function HostsView() {
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Add Host Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newHostName, setNewHostName] = useState('')
  const [newHostUsername, setNewHostUsername] = useState('')
  const [newHostMobile, setNewHostMobile] = useState('')
  const [newHostPassword, setNewHostPassword] = useState('')
  const [newHostGame, setNewHostGame] = useState('BGMI (Battlegrounds Mobile)')
  const [newHostRole, setNewHostRole] = useState<'tournament_host' | 'omb_host'>('tournament_host')
  const [newHostCommission, setNewHostCommission] = useState('10')
  const [addLoading, setAddLoading] = useState(false)

  // Pay Host Modal
  const [activePayHost, setActivePayHost] = useState<Host | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('UPI / Bank Transfer')
  const [payRef, setPayRef] = useState('')
  const [payNote, setPayNote] = useState('')
  const [payLoading, setPayLoading] = useState(false)

  // Reset Password Modal
  const [activeResetHost, setActiveResetHost] = useState<Host | null>(null)
  const [resetPassInput, setResetPassInput] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // Delete Host Modal
  const [hostToDelete, setHostToDelete] = useState<Host | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function fetchHostsList() {
    setLoading(true)
    setErrorMessage('')
    try {
      let hostArray: Host[] | undefined
      try {
        const data = await api<{ hosts: Host[] } | Host[]>('/admin/hosts')
        hostArray = Array.isArray(data) ? data : (data as { hosts?: Host[] })?.hosts
      } catch (adminErr) {
        // If /admin/hosts returns 404, attempt fallback to /hosts or /admin/users
        try {
          const fallbackData = await api<{ hosts: Host[] } | Host[]>('/hosts')
          hostArray = Array.isArray(fallbackData) ? fallbackData : (fallbackData as { hosts?: Host[] })?.hosts
        } catch {
          throw adminErr
        }
      }

      if (hostArray && Array.isArray(hostArray)) {
        setHosts(hostArray)
      } else {
        setHosts([])
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not fetch hosts from server database.'
      if (msg.includes('404')) {
        setErrorMessage('Server Notice: The host management endpoint (/api/admin/hosts) returned 404. No host records found.')
      } else if (msg.includes('401') || msg.toLowerCase().includes('auth')) {
        setErrorMessage('Authentication required: Please sign in again with an admin account.')
      } else {
        setErrorMessage(msg)
      }
      setHosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        let hostArray: Host[] | undefined
        try {
          const data = await api<{ hosts: Host[] } | Host[]>('/admin/hosts')
          hostArray = Array.isArray(data) ? data : (data as { hosts?: Host[] })?.hosts
        } catch (adminErr) {
          try {
            const fallbackData = await api<{ hosts: Host[] } | Host[]>('/hosts')
            hostArray = Array.isArray(fallbackData) ? fallbackData : (fallbackData as { hosts?: Host[] })?.hosts
          } catch {
            throw adminErr
          }
        }

        if (!ignore) {
          if (hostArray && Array.isArray(hostArray)) {
            setHosts(hostArray)
          } else {
            setHosts([])
          }
        }
      } catch (err) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Could not fetch hosts from server database.'
          if (msg.includes('404')) {
            setErrorMessage('Server Notice: The host management endpoint (/api/admin/hosts) returned 404. No host records found.')
          } else if (msg.includes('401') || msg.toLowerCase().includes('auth')) {
            setErrorMessage('Authentication required: Please sign in again with an admin account.')
          } else {
            setErrorMessage(msg)
          }
          setHosts([])
        }
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [])

  async function handleCreateHost(e: FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    setErrorMessage('')
    setActionSuccess('')

    const payload = {
      name: newHostName.trim(),
      username: newHostUsername.trim(),
      mobileNumber: newHostMobile.trim(),
      password: newHostPassword,
      assignedGame: newHostGame,
      commissionRate: Number(newHostCommission),
      role: newHostRole,
    }

    try {
      await api<Host>('/admin/hosts', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setActionSuccess(`Host "${payload.name}" created and saved to database successfully!`)
      setShowAddModal(false)
      setNewHostName('')
      setNewHostUsername('')
      setNewHostMobile('')
      setNewHostPassword('')
      await fetchHostsList()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Server failed to create host in database.')
    } finally {
      setAddLoading(false)
    }
  }

  async function handlePayHost(e: FormEvent) {
    e.preventDefault()
    if (!activePayHost || !payAmount) return
    setPayLoading(true)
    setErrorMessage('')
    setActionSuccess('')

    const amountNum = Number(payAmount)

    try {
      await api(`/admin/hosts/${activePayHost.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amountNum,
          method: payMethod,
          reference: payRef,
          note: payNote,
        }),
      })

      setActionSuccess(`Recorded payout of ₹${amountNum} to ${activePayHost.name} in database.`)
      setActivePayHost(null)
      setPayAmount('')
      setPayRef('')
      setPayNote('')
      await fetchHostsList()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record host payout on server.')
    } finally {
      setPayLoading(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    if (!activeResetHost || !resetPassInput) return
    setResetLoading(true)
    setErrorMessage('')
    setActionSuccess('')

    try {
      await api(`/admin/hosts/${activeResetHost.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: resetPassInput }),
      })

      setActionSuccess(`Password reset successfully for host @${activeResetHost.username}`)
      setActiveResetHost(null)
      setResetPassInput('')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reset password on server.')
    } finally {
      setResetLoading(false)
    }
  }

  async function toggleHostStatus(host: Host) {
    setErrorMessage('')
    setActionSuccess('')
    const newStatus = host.status === 'active' ? 'suspended' : 'active'
    try {
      await api(`/admin/hosts/${host.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setActionSuccess(`Host @${host.username} is now ${newStatus.toUpperCase()} in database.`)
      await fetchHostsList()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update host status on server.')
    }
  }

  async function handleConfirmDelete() {
    if (!hostToDelete) return
    setDeleteLoading(true)
    setErrorMessage('')
    setActionSuccess('')

    try {
      await api(`/admin/hosts/${hostToDelete.id}`, {
        method: 'DELETE',
      })
      setActionSuccess(`Host "${hostToDelete.name}" (@${hostToDelete.username}) permanently deleted from database.`)
      setHostToDelete(null)
      await fetchHostsList()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Server failed to delete host from database.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="hosts-container">
      <div className="page-intro with-action">
        <div>
          <span className="eyebrow">COMMISSION & HOST ROSTER</span>
          <h2>Host Management</h2>
          <p>Create match hosts, track commission payouts, reset credentials, and assign tournaments.</p>
        </div>
        <div className="header-btn-group">
          <button className="secondary small-btn" onClick={fetchHostsList} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button className="primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} /> Add New Host
          </button>
        </div>
      </div>

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

      {hosts.length === 0 && !loading ? (
        <div className="state-card">
          <div className="state-icon">
            <Shield size={36} color="#aa3bff" />
          </div>
          <h3>No Host Accounts in Database</h3>
          <p className="state-desc">
            No organizers or match hosts are currently registered on your database. Click below to register and assign your first match host.
          </p>
          <button className="primary" onClick={() => setShowAddModal(true)} style={{ marginTop: '12px' }}>
            <UserPlus size={16} /> Add First Host
          </button>
        </div>
      ) : (
        <div className="hosts-grid">
          {hosts.map((host) => (
            <article className="host-card" key={host.id}>
              <div className="host-card-top">
                <div className="host-identity">
                  <div className="avatar host-avatar">
                    {host.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4>{host.name}</h4>
                    <small>@{host.username} • {host.mobileNumber || 'No mobile'}</small>
                  </div>
                </div>
                <span className={`status-pill ${host.status}`}>
                  {host.status.toUpperCase()}
                </span>
              </div>

              <div className="host-game-tag">
                <span>Assigned Game:</span>
                <b>{host.assignedGame}</b>
              </div>

              <div className="host-stats-row">
                <div className="hstat">
                  <span>Matches Hosted</span>
                  <strong>{host.totalMatchesHosted}</strong>
                </div>
                <div className="hstat">
                  <span>Commission Rate</span>
                  <strong>{host.commissionRate}%</strong>
                </div>
                <div className="hstat">
                  <span>Unpaid Balance</span>
                  <strong className={host.unpaidCommission > 0 ? 'text-coral' : 'text-green'}>
                    ₹{host.unpaidCommission.toLocaleString()}
                  </strong>
                </div>
                <div className="hstat">
                  <span>Total Earned</span>
                  <strong>₹{host.totalEarned.toLocaleString()}</strong>
                </div>
              </div>

              <div className="host-actions-strip">
                <button
                  className="secondary small-btn"
                  onClick={() => {
                    setActivePayHost(host)
                    setPayAmount(host.unpaidCommission > 0 ? String(host.unpaidCommission) : '')
                  }}
                >
                  <IndianRupee size={14} /> Pay Host
                </button>
                <button
                  className="secondary small-btn"
                  onClick={() => {
                    setActiveResetHost(host)
                    setResetPassInput('')
                  }}
                >
                  <Key size={14} /> Reset Pass
                </button>
                <button
                  className={`small-btn ${host.status === 'active' ? 'secondary' : 'success'}`}
                  onClick={() => toggleHostStatus(host)}
                >
                  {host.status === 'active' ? (
                    <>
                      <ShieldAlert size={14} /> Suspend
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} /> Activate
                    </>
                  )}
                </button>
                <button
                  className="small-btn danger"
                  onClick={() => setHostToDelete(host)}
                  title="Remove Host"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add Host Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Platform Host Account</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateHost} className="modal-form">
              <label>
                Full Name
                <input
                  required
                  type="text"
                  placeholder="e.g. Vikram Singh"
                  value={newHostName}
                  onChange={(e) => setNewHostName(e.target.value)}
                />
              </label>

              <label>
                Host Login Username
                <input
                  required
                  type="text"
                  placeholder="e.g. host_vikram"
                  value={newHostUsername}
                  onChange={(e) => setNewHostUsername(e.target.value)}
                />
              </label>

              <label>
                Mobile Number
                <input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newHostMobile}
                  onChange={(e) => setNewHostMobile(e.target.value)}
                />
              </label>

              <label>
                Initial Password
                <input
                  required
                  type="password"
                  placeholder="Create host password"
                  value={newHostPassword}
                  onChange={(e) => setNewHostPassword(e.target.value)}
                />
              </label>

              <label>
                Assigned Game Title
                <select
                  value={newHostGame}
                  onChange={(e) => setNewHostGame(e.target.value)}
                >
                  <option value="BGMI (Battlegrounds Mobile)">BGMI (Battlegrounds Mobile)</option>
                  <option value="Free Fire MAX">Free Fire MAX</option>
                  <option value="Ludo King">Ludo King</option>
                  <option value="Call of Duty Mobile">Call of Duty Mobile</option>
                  <option value="All Games">All Games (Multi-Game Host)</option>
                </select>
              </label>

              <label>
                Host Role (System Role)
                <select
                  value={newHostRole}
                  onChange={(e) => setNewHostRole(e.target.value as 'tournament_host' | 'omb_host')}
                >
                  <option value="tournament_host">Tournament Host (Tournaments & Custom Rooms)</option>
                  <option value="omb_host">OMB Host (1v1 One Match Battles)</option>
                </select>
              </label>

              <label>
                Commission Rate (%)
                <input
                  required
                  type="number"
                  min="1"
                  max="50"
                  placeholder="e.g. 10"
                  value={newHostCommission}
                  onChange={(e) => setNewHostCommission(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={addLoading}>
                  {addLoading ? 'Creating...' : 'Create Host'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Host Modal */}
      {activePayHost && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Pay Host Commission</h3>
              <button className="close-btn" onClick={() => setActivePayHost(null)}>
                ✕
              </button>
            </div>
            <p className="modal-desc">
              Record commission settlement for <b>{activePayHost.name}</b> (Unpaid balance: ₹{activePayHost.unpaidCommission.toLocaleString()}).
            </p>
            <form onSubmit={handlePayHost} className="modal-form">
              <label>
                Payout Amount (₹)
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 1000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </label>

              <label>
                Payment Method
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="UPI / Bank Transfer">UPI / GPay / PhonePe</option>
                  <option value="Bank NEFT / IMPS">Bank Account Transfer</option>
                  <option value="Manual Cash Settlement">Manual Cash Settlement</option>
                </select>
              </label>

              <label>
                Transaction Ref / UPI UTR ID
                <input
                  type="text"
                  placeholder="e.g. UPI/482910398402"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </label>

              <label>
                Notes / Audit Remark
                <input
                  type="text"
                  placeholder="e.g. Weekly match hosting payout"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setActivePayHost(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={payLoading}>
                  {payLoading ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {activeResetHost && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reset Host Password</h3>
              <button className="close-btn" onClick={() => setActiveResetHost(null)}>
                ✕
              </button>
            </div>
            <p className="modal-desc">
              Enter a new secure password for host <b>@{activeResetHost.username}</b>.
            </p>
            <form onSubmit={handleResetPassword} className="modal-form">
              <label>
                New Password
                <input
                  required
                  type="password"
                  placeholder="Enter new password"
                  value={resetPassInput}
                  onChange={(e) => setResetPassInput(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setActiveResetHost(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={resetLoading}>
                  {resetLoading ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Host Confirmation Modal */}
      {hostToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Host Account</h3>
              <button className="close-btn" onClick={() => setHostToDelete(null)}>
                ✕
              </button>
            </div>
            <div className="modal-desc" style={{ textAlign: 'left', lineHeight: 1.5 }}>
              <p>Are you sure you want to permanently remove host <b>{hostToDelete.name}</b> (<b>@{hostToDelete.username}</b>)?</p>
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px', fontSize: '13px' }}>
                <div>🎮 <b>Assigned Game:</b> {hostToDelete.assignedGame}</div>
                <div>📊 <b>Matches Hosted:</b> {hostToDelete.totalMatchesHosted}</div>
                <div>💰 <b>Unpaid Commission:</b> ₹{hostToDelete.unpaidCommission.toLocaleString()}</div>
              </div>
              {hostToDelete.unpaidCommission > 0 && (
                <div style={{ marginTop: '10px', color: 'var(--coral-color)', fontSize: '12px', fontWeight: 600 }}>
                  ⚠️ Warning: This host still has ₹{hostToDelete.unpaidCommission.toLocaleString()} unpaid commission balance.
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setHostToDelete(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="small-btn danger"
                style={{ padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                <Trash2 size={16} />
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
