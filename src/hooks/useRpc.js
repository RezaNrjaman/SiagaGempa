import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { rpc } from '@/lib/rpc'
import { CACHE } from '@/config'

/*
 * Satu-satunya pembungkus ambil data + cache + status (PRD 5.2).
 * Kunci cache otomatis [nama RPC, parameter] sehingga filter yang sama tidak
 * diambil dua kali. Error 42501 dari SQL dialihkan ke /forbidden (PRD 16.1);
 * error lain memunculkan status error generik.
 */
export function useRpc(name, params = null, cacheClass = 'historical') {
  const navigate = useNavigate()
  const cache = CACHE[cacheClass]
  const query = useQuery({
    queryKey: [name, params],
    queryFn: () => rpc(name, params),
    staleTime: cache.staleTime,
    gcTime: cache.gcTime,
    refetchInterval: cache.refetchInterval,
    refetchIntervalInBackground: cache.refetchIntervalInBackground ?? false,
    retry: 1,
  })

  const code = query.error?.code
  useEffect(() => {
    if (code === '42501') navigate('/forbidden', { replace: true })
  }, [code, navigate])

  return query
}
