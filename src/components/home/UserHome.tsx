'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, ArrowRight } from 'lucide-react'
import { getIcon } from '@/lib/icons'

interface Dashboard {
  id: string
  slug: string
  title: string
  icon: string | null
  sectorName: string | null
  areaName: string | null
}

interface UserHomeProps {
  dashboards: Dashboard[]
  userName: string
}

export function UserHome({ dashboards, userName }: UserHomeProps) {
  // Agrupar por sector
  const dashboardsBySector = dashboards.reduce((acc, dashboard) => {
    const sector = dashboard.sectorName || 'General'
    if (!acc[sector]) {
      acc[sector] = []
    }
    acc[sector].push(dashboard)
    return acc
  }, {} as Record<string, Dashboard[]>)

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Bienvenido, {userName}!
        </h1>
        <p className="text-muted-foreground">
          {dashboards.length > 0
            ? 'Selecciona un dashboard para comenzar'
            : 'No tienes dashboards asignados. Contacta al administrador.'}
        </p>
      </div>

      {/* Dashboards disponibles */}
      {dashboards.length > 0 ? (
        <>
          {Object.entries(dashboardsBySector).map(([sector, sectorDashboards]) => (
            <div key={sector} className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-blue-500" />
                {sector}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sectorDashboards.map((dashboard) => {
                  const Icon = getIcon(dashboard.icon)
                  
                  return (
                    <Link key={dashboard.id} href={`/dashboards/${dashboard.slug}`}>
                      <Card className="glass border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-medium">
                              {dashboard.title}
                            </CardTitle>
                            {dashboard.areaName && (
                              <p className="text-xs text-muted-foreground">
                                {dashboard.areaName}
                              </p>
                            )}
                          </div>
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-600/30 transition-all">
                            <Icon className="h-5 w-5 text-blue-400" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="flex items-center justify-between">
                            <span>Ver dashboard</span>
                            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        /* Sin dashboards */
        <Card className="glass border-white/10 border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Sin dashboards asignados</CardTitle>
            <CardDescription>
              Aún no tienes acceso a ningún dashboard. El administrador debe asignarte permisos.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
