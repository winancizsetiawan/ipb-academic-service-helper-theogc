import { useState, useCallback } from 'react'

export function useConfirm() {
  const [state, setState] = useState(null)

  const confirm = useCallback((title, msg, onOk, opts = {}) => {
    setState({ title, msg, onOk, ...opts })
  }, [])

  const close = useCallback(() => setState(null), [])

  return { confirmState: state, confirm, closeConfirm: close }
}
