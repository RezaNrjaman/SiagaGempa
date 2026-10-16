import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/* Logout: bersihkan cache query dan seluruh kunci 'sg.' di sessionStorage (PRD AUTH-06). */
export function clearSessionCache() {
  queryClient.clear()
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index)
    if (key && key.startsWith('sg.')) sessionStorage.removeItem(key)
  }
}
