'use client'

import { useQuery } from '@tanstack/react-query'

interface UseDashboardDataOptions {
  slug: string
  enabled?: boolean
}

interface DashboardResponse<T = unknown> {
  data: T[]
  accessScope?: Record<string, unknown>
  dashboard?: {
    id: string
    slug: string
    title: string
    category: string
  }
}

async function fetchDashboardData<T>(slug: string): Promise<DashboardResponse<T>> {
  const response = await fetch(`/api/dashboards/${slug}/data`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al cargar datos')
  }
  
  return response.json()
}

/**
 * Hook para obtener datos de un dashboard específico
 * Usa TanStack Query para caching y smart polling
 * 
 * @example
 * const { data, isLoading, error } = useDashboardData<VentasData>({
 *   slug: 'ventas',
 * })
 */
export function useDashboardData<T = unknown>(options: UseDashboardDataOptions) {
  const { slug, enabled = true } = options

  return useQuery<DashboardResponse<T>, Error>({
    queryKey: ['dashboard', slug],
    queryFn: () => fetchDashboardData<T>(slug),
    enabled,
    staleTime: 30 * 1000, // Datos frescos por 30 segundos
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook para obtener KPIs de un dashboard
 */
export function useDashboardKPIs(slug: string) {
  return useQuery({
    queryKey: ['dashboard-kpis', slug],
    queryFn: async () => {
      const response = await fetch(`/api/dashboards/${slug}/kpis`)
      if (!response.ok) throw new Error('Error al cargar KPIs')
      return response.json()
    },
    staleTime: 60 * 1000, // KPIs frescos por 1 minuto
  })
}





