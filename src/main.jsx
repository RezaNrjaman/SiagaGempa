import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import '@fontsource-variable/inter'
import '@/styles/tokens.css'
import '@/styles/glass.css'
import '@/styles/base.css'
import App from '@/App'
import { AuthProvider } from '@/context/AuthContext'
import { queryClient } from '@/lib/queryClient'
import { APP_VERSION, PERSIST_MAX_AGE } from '@/config'

/* Persist ke sessionStorage, buster = versi aplikasi (PRD 11). */
const persister = createSyncStoragePersister({
  storage: window.sessionStorage,
  key: 'sg.cache',
  throttleTime: 1000,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE, buster: APP_VERSION }}
    >
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
