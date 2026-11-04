'use client'

import { useEffect, useRef } from 'react'

// Canlı veri akışı — Firebase mimarisinde socket sunucusu yoktur;
// her görünüm verisini Firestore'dan doğrudan okur. Bu hook yalnızca
// periyodik yenileme (useInterval) sağlar ve bağlantı durumunu
// her zaman "başarılı" raporlar (görünümler buna güvenebilir).

export type PosEvent = { event: string; data: unknown; at: number }

export function usePosEvents(_onEvent?: (e: PosEvent) => void) {
  return { connected: true }
}

// Veri periyodik yenileme — görünümler arka planda taze kalır
export function useInterval(callback: () => void, ms: number) {
  const cbRef = useRef(callback)

  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  useEffect(() => {
    const id = setInterval(() => cbRef.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}
