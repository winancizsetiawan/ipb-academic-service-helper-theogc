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

  // Fetch user profile on token change
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
      } catch (error) {
        console.error("Failed to fetch user:", error)
        logout()
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [token])

  // API calls for notifications
  const fetchNotifications = async () => {
    if (!token) return
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    }
  }

  const fetchUnreadCount = async () => {
    if (!token) return
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.unread_count)
    } catch (err) {
      console.error("Failed to fetch unread count:", err)
    }
  }

  const markAsRead = async (id) => {
    if (!token) return
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const markAllAsRead = async () => {
    if (!token) return
    try {
      const res = await api.patch('/notifications/read-all')
      setNotifications(res.data)
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err)
    }
  }

  // Manage Websocket and Polling
  useEffect(() => {
    if (!token || !user) {
      // Clean up connection and polling
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      setNotifications([])
      setUnreadCount(0)
      return
    }

    // Initial fetch
    fetchNotifications()
    fetchUnreadCount()

    // 1. WebSocket Setup
    const connectWS = () => {
      const baseURL = API_BASE_WITH_PATH
      // Construct WebSocket URL
      const wsURL = baseURL.replace(/^http/, 'ws') + '/notifications/ws/' + token

      console.log(`Connecting to WebSocket: ${wsURL}`)
      const ws = new WebSocket(wsURL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connection established successfully")
        // When connected, stop active aggressive polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          // Maintain a lazy check/refresh every 60s
          pollingIntervalRef.current = setInterval(() => {
            fetchUnreadCount()
          }, 60000)
        }
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'notification') {
            const newNotif = payload.data
            // Format for UI consistency
            setNotifications(prev => [newNotif, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        } catch (e) {
          console.error("Error parsing WS message:", e)
        }
      }

      ws.onerror = (err) => {
        console.error("WebSocket error:", err)
      }

      ws.onclose = () => {
        console.log("WebSocket connection closed. Initiating fallback/reconnect...")
        // Start fallback polling immediately if WebSocket is closed
        startFallbackPolling()
        // Attempt to reconnect in 5s
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWS()
        }, 5000)
      }
    }

    const startFallbackPolling = () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      // Poll every 10 seconds as a reliable fallback
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications()
        fetchUnreadCount()
      }, 10000)
    }

    // Initiate first connection
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
      headers: { Authorization: `Bearer ${access_token}` }
    })
    setUser(userResponse.data)
    return userResponse.data
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
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
      markAllAsRead
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}