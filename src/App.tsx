import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, LayoutDashboard, Users, Trophy, Shield, Gamepad2, Bell, RefreshCw, LogOut } from 'lucide-react'
import type { DashboardData, SessionUser } from './types'
import { api } from './services/api'
import { OverviewView } from './components/OverviewView'
import { UsersView } from './components/UsersView'
import { CompetitionsView } from './components/CompetitionsView'
import { HostsView } from './components/HostsView'
import { ContentView } from './components/ContentView'
import { NotificationsView } from './components/NotificationsView'
import './App.css'

export function App() {
  const [session, setSession] = useState<SessionUser | null>(null)
  const [login, setLogin] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [page, setPage] = useState<'Overview' | 'Users' | 'Competitions' | 'Hosts' | 'Content' | 'Notifications'>('Overview')
  const [history, setHistory] = useState<string[]>(['Overview'])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  function navigateTo(newPage: typeof page) {
    if (newPage === page) return
    setHistory((prev) => [...prev, newPage])
    setPage(newPage)
  }

  function goBack() {
    if (history.length > 1) {
      const newHist = history.slice(0, -1)
      setHistory(newHist)
      setPage(newHist[newHist.length - 1] as typeof page)
    } else if (page !== 'Overview') {
      setPage('Overview')
      setHistory(['Overview'])
    }
  }

  // Check existing session
  useEffect(() => {
    type MeResponse = {
      user?: { role?: string; name?: string; username?: string }
      role?: string
      name?: string
      username?: string
    }
    api<MeResponse>('/users/me')
      .then((res) => {
        const userObj = res.user || res
        const role = userObj.role
        const name = userObj.name || userObj.username || 'Admin'
        const username = userObj.username
        if (role && ['admin', 'manager', 'support'].includes(role.toLowerCase())) {
          setSession({
            name,
            role,
            username,
          })
        }
      })
      .catch(() => undefined)
  }, [])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      type UserInfo = { role?: string; name?: string; username?: string }
      type LoginResponse = {
        token?: string
        accessToken?: string
        access_token?: string
        jwt?: string
        id_token?: string
        sessionToken?: string
        sessionId?: string
        session_id?: string
        sid?: string
        role?: string
        name?: string
        username?: string
        user?: UserInfo
        session?: {
          token?: string
          id?: string
          sessionId?: string
          sid?: string
        }
        data?: {
          token?: string
          accessToken?: string
          access_token?: string
          jwt?: string
          id_token?: string
          sessionToken?: string
          sessionId?: string
          session_id?: string
          sid?: string
          role?: string
          name?: string
          username?: string
          user?: UserInfo
          session?: {
            token?: string
            id?: string
            sessionId?: string
            sid?: string
          }
        }
      }

      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: login.username.trim(),
          password: login.password,
        }),
      })

      const token =
        res.token ||
        res.accessToken ||
        res.access_token ||
        res.jwt ||
        res.id_token ||
        res.sessionToken ||
        res.sessionId ||
        res.session_id ||
        res.sid ||
        res.session?.token ||
        res.session?.id ||
        res.session?.sessionId ||
        res.session?.sid ||
        res.data?.token ||
        res.data?.accessToken ||
        res.data?.access_token ||
        res.data?.jwt ||
        res.data?.id_token ||
        res.data?.sessionToken ||
        res.data?.sessionId ||
        res.data?.session_id ||
        res.data?.sid ||
        res.data?.session?.token ||
        res.data?.session?.id ||
        res.data?.session?.sessionId ||
        res.data?.session?.sid
      if (token) {
        localStorage.setItem('pagewoga_token', token)
      }

      const userObj: UserInfo = res.user || res.data?.user || res.data || res
      let role = userObj.role?.toLowerCase()
      let name = userObj.name || userObj.username || login.username.trim()

      if (!role) {
        try {
          const meRes = await api<{
            user?: { role?: string; name?: string }
            role?: string
            name?: string
          }>('/users/me')
          const meObj = meRes.user || meRes
          role = meObj.role?.toLowerCase()
          if (meObj.name) name = meObj.name
        } catch {
          // me call failed
        }
      }

      if (role && ['admin', 'manager', 'support'].includes(role)) {
        setSession({ name: name || 'Administrator', role, username: login.username.trim() })
      } else if (role) {
        setLoginError(`Account role is "${role}". Administrator or Staff permissions required.`)
      } else {
        // Fallback: Successful login
        setSession({ name: name || 'Administrator', role: 'admin', username: login.username.trim() })
      }
    } catch (requestError) {
      setLoginError(
        requestError instanceof Error ? requestError.message : 'Unable to sign in.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  async function signOut() {
    localStorage.removeItem('pagewoga_token')
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    setSession(null)
  }

  async function fetchDashboard() {
    if (!session) return
    setIsRefreshing(true)
    try {
      const data = await api<DashboardData>('/operations/admin/dashboard')
      setDashboard(data)
      setError('')
    } catch (e) {
      // Try alternate admin dashboard endpoint if available
      try {
        const altData = await api<DashboardData>('/admin/dashboard')
        setDashboard(altData)
        setError('')
      } catch {
        setError(e instanceof Error ? e.message : 'Failed to fetch live dashboard metrics.')
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    if (session && page === 'Overview') {
      api<DashboardData>('/operations/admin/dashboard')
        .then((data) => {
          if (isMounted) {
            setDashboard(data)
            setError('')
          }
        })
        .catch((e) => {
          if (isMounted) {
            // Check fallback endpoint
            api<DashboardData>('/admin/dashboard')
              .then((altData) => {
                if (isMounted) {
                  setDashboard(altData)
                  setError('')
                }
              })
              .catch(() => {
                if (isMounted) {
                  setError(e instanceof Error ? e.message : 'Authentication or network required.')
                }
              })
          }
        })
    }
    return () => {
      isMounted = false
    }
  }, [session, page])

  if (!session) {
    return (
      <main className="login-page">
        <div className="login-art">
          <span className="eyebrow">PAGEWOGA / CONTROL ROOM</span>
          <h1>
            Operations,
            <br />
            <em>with clarity.</em>
          </h1>
          <p>Admin console access for platform operations, live competitions, host settlements, and account audits.</p>
          <div className="login-art-footer">
            <span className="live-dot" />
            <small>Connected to AWS Backend: https://api.pagewoga.online</small>
          </div>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-form-top">
            <div className="mark">
              P<span>W</span>
            </div>
          </div>
          <h2>Welcome back</h2>
          <p className="muted">Sign in with your Pagewoga administrator account.</p>

          <label>
            Username
            <input
              required
              id="login-username"
              value={login.username}
              onChange={(e) => setLogin({ ...login, username: e.target.value })}
              placeholder="e.g. paki_paki.de"
            />
          </label>

          <label>
            Password
            <div className="password-input-wrapper">
              <input
                id="login-password-input"
                required
                type={showPassword ? 'text' : 'password'}
                value={login.password}
                onChange={(e) => setLogin({ ...login, password: e.target.value })}
                placeholder="Enter admin password"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {loginError && <div className="alert error">{loginError}</div>}

          <button className="primary full" type="submit" disabled={loginLoading}>
            {loginLoading ? 'Authenticating...' : 'Sign in to Admin Console'} <span>→</span>
          </button>
          <small>Production Server: https://api.pagewoga.online</small>
        </form>
      </main>
    )
  }

  const navItems: { id: typeof page; label: string; icon: React.ReactNode }[] = [
    { id: 'Overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'Users', label: 'Users', icon: <Users size={18} /> },
    { id: 'Competitions', label: 'Competitions', icon: <Trophy size={18} /> },
    { id: 'Hosts', label: 'Hosts', icon: <Shield size={18} /> },
    { id: 'Content', label: 'Content', icon: <Gamepad2 size={18} /> },
    { id: 'Notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ]

  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          <div className="mark">
            P<span>W</span>
          </div>
          <strong>pagewoga</strong>
        </div>

        <div className="workspace">
          <span>WORKSPACE</span>
          <b>Platform Admin</b>
        </div>

        <nav>
          {navItems.map((item) => (
            <button
              className={page === item.id ? 'active' : ''}
              onClick={() => navigateTo(item.id)}
              key={item.id}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="secure-dot" />
          <span>
            Production AWS EC2
            <br />
            <small>https://api.pagewoga.online</small>
          </span>
        </div>
      </aside>

      <section className="main">
        <header>
          <div className="header-left">
            {page !== 'Overview' && (
              <button className="back-button" onClick={goBack} title="Back to previous screen">
                ← Back
              </button>
            )}
            <div>
              <span className="eyebrow">ADMIN CONSOLE / {page.toUpperCase()}</span>
              <h1>{page}</h1>
            </div>
          </div>

          <div className="header-actions">
            <button
              className={`icon-button refresh-btn ${isRefreshing ? 'spinning' : ''}`}
              aria-label="Refresh Data"
              title="Refresh Live Data"
              onClick={fetchDashboard}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => navigateTo('Notifications')}
              title="Push Broadcasts"
            >
              <Bell size={16} />
            </button>
            <div className="profile">
              <div className="avatar">{session.name.slice(0, 1).toUpperCase()}</div>
              <span>
                {session.name}
                <small>Administrator</small>
              </span>
              <button onClick={signOut} aria-label="Log out" title="Sign out of Admin Console">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="content">
          {page === 'Overview' && (
            <OverviewView
              dashboard={dashboard}
              error={error}
              retry={fetchDashboard}
              isRefreshing={isRefreshing}
              onSignOut={signOut}
            />
          )}
          {page === 'Users' && <UsersView />}
          {page === 'Competitions' && <CompetitionsView />}
          {page === 'Hosts' && <HostsView />}
          {page === 'Content' && <ContentView />}
          {page === 'Notifications' && <NotificationsView />}
        </div>
      </section>
    </div>
  )
}

export default App
