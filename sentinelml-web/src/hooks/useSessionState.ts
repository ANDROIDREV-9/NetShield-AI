import { useCallback, useState } from 'react'

// Module-level store: state survives route changes (pages unmount) without relying on browser storage.
const store = new Map<string, unknown>()

export function useSessionState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => (store.has(key) ? (store.get(key) as T) : initial))
  const set = useCallback((v: T | ((p: T) => T)) => {
    setVal((prev) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      store.set(key, next)
      return next
    })
  }, [key])
  return [val, set]
}
