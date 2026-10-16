import { useEffect, useState } from 'react'
const seen = new Set<string>()
/** Simulates data-fetch latency on first visit of a page so loading skeletons are exercised; instant afterwards. */
export function useLoaded(key: string, ms = 380) {
  const [ready, setReady] = useState(seen.has(key))
  useEffect(() => {
    if (seen.has(key)) { setReady(true); return }
    const t = setTimeout(() => { seen.add(key); setReady(true) }, ms)
    return () => clearTimeout(t)
  }, [key, ms])
  return ready
}
