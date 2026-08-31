import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { NotificationBroadcast } from '../types'
import { api } from '../services/api'
import { Send, Sparkles, CheckCircle2, AlertCircle, Clock, Radio } from 'lucide-react'

export function NotificationsView() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetAudience, setTargetAudience] = useState<'all' | 'active_players' | 'hosts' | 'specific_user'>('all')
  const [targetUserId, setTargetUserId] = useState('')
  const [notificationType, setNotificationType] = useState<'announcement' | 'match_alert' | 'bonus' | 'maintenance'>('announcement')
  const [priority, setPriority] = useState<'high' | 'normal'>('high')
  const [deepLink, setDeepLink] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Sent notifications history from database
  const [history, setHistory] = useState<NotificationBroadcast[]>([])

  async function fetchBroadcastHistory() {
    try {
      const data = await api<NotificationBroadcast[] | { notifications: NotificationBroadcast[] }>('/admin/notifications')
      const arr = Array.isArray(data) ? data : (data as { notifications?: NotificationBroadcast[] })?.notifications
      if (arr && Array.isArray(arr)) {
        setHistory(arr)
      } else {
        setHistory([])
      }
    } catch {
      setHistory([])
    }
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const data = await api<NotificationBroadcast[] | { notifications: NotificationBroadcast[] }>('/admin/notifications')
        const arr = Array.isArray(data) ? data : (data as { notifications?: NotificationBroadcast[] })?.notifications
        if (!ignore) {
          if (arr && Array.isArray(arr)) {
            setHistory(arr)
          } else {
            setHistory([])
          }
        }
      } catch {
        if (!ignore) {
          setHistory([])
        }
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [])

  function applyNotificationTemplate(template: 'tournament' | 'maintenance' | 'bonus' | 'deposit') {
    if (template === 'tournament') {
      setTitle('🔥 New High-Prize Tournament is Live!')
      setMessage('Join the upcoming BGMI & Free Fire matches starting tonight. Limited slots available!')
      setNotificationType('match_alert')
      setPriority('high')
      setDeepLink('/competitions')
    } else if (template === 'maintenance') {
      setTitle('⚙️ Scheduled System Maintenance')
      setMessage('We will be performing a quick 15-minute server optimization at 03:00 AM. Match wallets remain 100% safe.')
      setNotificationType('maintenance')
      setPriority('high')
    } else if (template === 'bonus') {
      setTitle('🎉 Instant Cashback on Play Coins!')
      setMessage('Add 500 or more Play Coins today and receive 100 Bonus Coins instantly in your wallet!')
      setNotificationType('bonus')
      setPriority('normal')
      setDeepLink('/wallet')
    } else if (template === 'deposit') {
      setTitle('⚡ Fast UPI Payouts are Processing!')
      setMessage('All pending winning coin withdrawal requests have been processed successfully.')
      setNotificationType('announcement')
      setPriority('normal')
    }
  }

  async function handleSendBroadcast(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setActionSuccess('')

    const payload = {
      title: title.trim(),
      message: message.trim(),
      targetAudience,
      targetUserId: targetAudience === 'specific_user' ? targetUserId.trim() : undefined,
      type: notificationType,
      priority,
      deepLink: deepLink.trim() || undefined,
    }

    try {
      await api('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setActionSuccess('Push broadcast dispatched and saved to database successfully!')
      setTitle('')
      setMessage('')
      setDeepLink('')
      await fetchBroadcastHistory()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Server failed to dispatch broadcast notification.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="notifications-container">
      <div className="page-intro with-action">
        <div>
          <span className="eyebrow">PUSH BROADCAST ENGINE</span>
          <h2>Admin Push Notifications</h2>
          <p>Send instant announcements, tournament reminders, and promotional alerts to all players or targeted user groups.</p>
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

      {/* Templates Bar */}
      <div className="presets-bar">
        <span className="presets-title">
          <Sparkles size={16} color="#aa3bff" /> Quick Templates:
        </span>
        <button
          type="button"
          className="preset-chip"
          onClick={() => applyNotificationTemplate('tournament')}
        >
          Tournament Live Alert
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => applyNotificationTemplate('bonus')}
        >
          Bonus / Cashback Promo
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => applyNotificationTemplate('maintenance')}
        >
          Server Maintenance
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => applyNotificationTemplate('deposit')}
        >
          Withdrawal Update
        </button>
      </div>

      <div className="notifications-layout-grid">
        <form onSubmit={handleSendBroadcast} className="notification-composer-card">
          <div className="form-section-title">
            <Radio size={18} color="#aa3bff" />
            <span>Compose Push Broadcast</span>
          </div>

          <div className="form-grid-2">
            <label>
              Target Audience
              <select
                value={targetAudience}
                onChange={(e) =>
                  setTargetAudience(
                    e.target.value as 'all' | 'active_players' | 'hosts' | 'specific_user'
                  )
                }
              >
                <option value="all">📢 All Registered Players (Broadcast)</option>
                <option value="active_players">⚡ Active Players (Last 24 Hours)</option>
                <option value="hosts">🛡️ All Match Hosts</option>
                <option value="specific_user">🎯 Specific User ID / Mobile</option>
              </select>
            </label>

            <label>
              Notification Category
              <select
                value={notificationType}
                onChange={(e) =>
                  setNotificationType(
                    e.target.value as 'announcement' | 'match_alert' | 'bonus' | 'maintenance'
                  )
                }
              >
                <option value="announcement">📢 General Announcement</option>
                <option value="match_alert">⚔️ Match & Tournament Alert</option>
                <option value="bonus">🎁 Bonus / Cashback Offer</option>
                <option value="maintenance">⚠️ Maintenance Alert</option>
              </select>
            </label>
          </div>

          {targetAudience === 'specific_user' && (
            <label>
              Recipient Mobile Number or User ID
              <input
                required
                type="text"
                placeholder="e.g. 9876543210 or user_8492"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
            </label>
          )}

          <label>
            Notification Title
            <input
              required
              type="text"
              placeholder="e.g. 🏆 Erangel Solo Tournament Starts in 30 Mins!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            Message Body
            <textarea
              required
              rows={3}
              placeholder="Write the clear notification message for players..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <div className="form-grid-2">
            <label>
              Action Deep Link / Route (Optional)
              <input
                type="text"
                placeholder="e.g. /competitions or /wallet/deposit"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
              />
            </label>

            <label>
              Push Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'normal')}
              >
                <option value="high">⚡ High Priority (Instant Screen Wakeup)</option>
                <option value="normal">Standard (Normal Delivery)</option>
              </select>
            </label>
          </div>

          <button type="submit" className="primary full" disabled={loading}>
            <Send size={18} />
            {loading ? 'Broadcasting Push...' : 'Send Push Notification Now'}
          </button>
        </form>

        <div className="sent-history-card">
          <div className="history-header">
            <h4>
              <Clock size={16} /> Broadcast History
            </h4>
            <span className="badge-subtle">{history.length} Sent</span>
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No broadcast notifications dispatched yet. Use the form on the left to send your first live push broadcast.
              </div>
            ) : (
              history.map((item) => (
                <div className="history-item" key={item.id}>
                  <div className="history-top">
                    <span className="history-title">{item.title}</span>
                    <span className="history-time">{item.sentAt}</span>
                  </div>
                  <p className="history-message">{item.message}</p>
                  <div className="history-tags">
                    <span className="badge-tag">Audience: {item.targetAudience.replace('_', ' ')}</span>
                    <span className="badge-subtle">{item.type}</span>
                    <span className="status-pill completed">{item.status.toUpperCase()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
