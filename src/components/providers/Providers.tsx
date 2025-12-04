'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

// Configuración optimizada del QueryClient
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Datos frescos por 30 segundos (evita refetch innecesarios)
        staleTime: 30 * 1000,
        // Tiempo de caché: 5 minutos
        gcTime: 5 * 60 * 1000,
        // Máximo 2 reintentos en caso de error
        retry: 2,
        // Refetch al volver a la ventana (útil para datos actualizados)
        refetchOnWindowFocus: true,
        // NO refetch al reconectar (reduce requests innecesarios)
        refetchOnReconnect: false,
      },
      mutations: {
        // Reintentar mutaciones fallidas una vez
        retry: 1,
      },
    },
  })
}

// Singleton para el cliente (evita recreación en hot reload)
let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: siempre crear nuevo cliente
    return makeQueryClient()
  }
  // Browser: reutilizar cliente existente
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  // useState asegura que el cliente no cambie entre renders
  const [queryClient] = useState(getQueryClient)

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </QueryClientProvider>
    </SessionProvider>
  )
}
