import { createContext, useContext, useState, useEffect, useRef } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
const API_BASE = RAW_API_URL.replace(/\/+$/, '')
const API_BASE_WITH_PATH = /\/api\/v1$/.test(API_BASE) ? API_BASE : API_BASE + '/api/v1'

export const api = axios.create({
  baseURL: API_BASE_WITH_PATH,
  withCredentials: true,
})

/**
 * Download an authenticated file attachment.
 * Calls the authenticated /uploads/:filepath endpoint and triggers a browser
 * download via a temporary blob URL.
 */
export async function downloadAttachment(att) {
  const response = await api.get(att.url, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = att.filename || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const pollingIntervalRef = useRef(null)

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout()
        }
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.request.eject(requestInterceptor)
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [token])

  // Restore session from stored token on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [token])

  const fetchNotifications = async () => {
    if (!token) return
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch {
      // Silent — polling will retry
    }
  }

  const fetchUnreadCount = async () => {
    if (!token) return
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.unread_count)
    } catch {
      // Silent
    }
  }

  const markAsRead = async (id) => {
    if (!token) return
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // Silent
    }
  }

  const markAllAsRead = async () => {
    if (!token) return
    try {
      const res = await api.patch('/notifications/read-all')
      setNotifications(res.data)
      setUnreadCount(0)
    } catch {
      // Silent
    }
  }

  // WebSocket + polling for notifications
  useEffect(() => {
    if (!token || !user) {
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      setNotifications([])
      setUnreadCount(0)
      return
    }

    fetchNotifications()
    fetchUnreadCount()

    const connectWS = () => {
      // JWT sent as first message AFTER connection (not in the URL path)
      const wsURL = API_BASE_WITH_PATH.replace(/^http/, 'ws') + '/notifications/ws'
      const ws = new WebSocket(wsURL)
      wsRef.current = ws

      ws.onopen = () => {
        // Authenticate by sending the token as the first message
        ws.send(token)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = setInterval(fetchUnreadCount, 60000)
        }
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'notification') {
            setNotifications(prev => [payload.data, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onerror = () => {
        // Error details are not meaningful here; onclose handles reconnect
      }

      ws.onclose = () => {
        startFallbackPolling()
        reconnectTimeoutRef.current = setTimeout(connectWS, 5000)
      }
    }

    const startFallbackPolling = () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications()
        fetchUnreadCount()
      }, 10000)
    }

    connectWS()

    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [token, user])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { access_token } = response.data
    setToken(access_token)
    localStorage.setItem('token', access_token)

    const userResponse = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    setUser(userResponse.data)
    return userResponse.data
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div
          aria-label="Memuat..."
          role="status"
          className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
        />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      loading,
      notifications,
      unreadCount,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
