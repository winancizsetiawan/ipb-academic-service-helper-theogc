import { useState, useCallback } from 'react'

let idCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'success', icon) => {
    const id = ++idCounter
    const icons = { success: '✓', error: '✕', warn: '⚠', info: 'ℹ' }
    setToasts(prev => [...prev, { id, msg, type, icon: icon || icons[type] || '✓' }])
    setTimeout(() => remove(id), 3200)
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, toast: add, removeToast: remove }
}
