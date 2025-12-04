'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getIcon } from '@/lib/icons'
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Users,
  PanelLeftClose,
  PanelLeft,
  Shield,
  ChevronDown,
  ChevronRight,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ============================================
// CONTEXTO DEL SIDEBAR
// ============================================
interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

// ============================================
// TIPOS
// ============================================
export interface DashboardItem {
  id: string
  slug: string
  title: string
  icon?: string | null
  sectorName?: string | null
  areaName?: string | null
}

interface DashboardShellProps {
  children: React.ReactNode
  dashboards: DashboardItem[]
  isAdmin: boolean
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function DashboardShell({ children, dashboards, isAdmin }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <Sidebar dashboards={dashboards} isAdmin={isAdmin} />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </SidebarContext.Provider>
  )
}

// ============================================
// SIDEBAR (Interno)
// ============================================
function Sidebar({ dashboards, isAdmin }: { dashboards: DashboardItem[]; isAdmin: boolean }) {
  const { collapsed, setCollapsed } = useSidebar()
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  // Agrupar dashboards por sector
  const dashboardsBySector = dashboards.reduce((acc, dashboard) => {
    const sector = dashboard.sectorName || 'General'
    if (!acc[sector]) {
      acc[sector] = []
    }
    acc[sector].push(dashboard)
    return acc
  }, {} as Record<string, DashboardItem[]>)

  const toggleSector = (sector: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [sector]: !prev[sector],
    }))
  }

  const isSectorExpanded = (sector: string) => expandedSectors[sector] === true

  // Link activo styles
  const linkClasses = (href: string, isAdminLink = false) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
      isAdminLink ? 'hover:bg-amber-500/10' : 'hover:bg-white/10',
      pathname === href
        ? isAdminLink
          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/20'
          : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-foreground border border-white/10'
        : isAdminLink
          ? 'text-muted-foreground hover:text-amber-200'
          : 'text-muted-foreground hover:text-foreground',
      collapsed && 'justify-center px-2'
    )

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300',
        'glass border-r border-white/10',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              MasterDash
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 max-h-[calc(100vh-64px)]">
        {/* Inicio */}
        <div className="space-y-1">
          <Link href="/" className={linkClasses('/')}>
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Inicio</span>}
          </Link>
        </div>

        {/* Separador */}
        {dashboards.length > 0 && <div className="my-4 border-t border-white/5" />}

        {/* Dashboards agrupados por Sector */}
        {isAdmin ? (
          // Vista de Admin con sectores colapsables
          Object.entries(dashboardsBySector).map(([sector, sectorDashboards]) => (
            <div key={sector} className="mb-2">
              {!collapsed ? (
                <>
                  <button
                    onClick={() => toggleSector(sector)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all hover:bg-white/5 group"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {sector}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground/60 bg-white/5 px-1.5 py-0.5 rounded">
                        {sectorDashboards.length}
                      </span>
                      {isSectorExpanded(sector) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </div>
                  </button>

                  {isSectorExpanded(sector) && (
                    <div className="ml-2 space-y-1 mt-1 border-l border-white/5 pl-2">
                      {sectorDashboards.map((dashboard) => {
                        const Icon = getIcon(dashboard.icon)
                        const href = `/dashboards/${dashboard.slug}`

                        return (
                          <Link key={dashboard.id} href={href} className={linkClasses(href)}>
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">{dashboard.title}</span>
                              {dashboard.areaName && (
                                <span className="text-xs text-muted-foreground/60 truncate">
                                  {dashboard.areaName}
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                // Modo colapsado: solo iconos
                sectorDashboards.map((dashboard) => {
                  const Icon = getIcon(dashboard.icon)
                  const href = `/dashboards/${dashboard.slug}`

                  return (
                    <Link
                      key={dashboard.id}
                      href={href}
                      className={cn(linkClasses(href), 'mb-1')}
                      title={`${dashboard.title} (${sector})`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                    </Link>
                  )
                })
              )}
            </div>
          ))
        ) : (
          // Vista de Usuario normal
          <div className="space-y-1">
            {!collapsed && dashboards.length > 0 && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                Mis Dashboards
              </p>
            )}
            {dashboards.map((dashboard) => {
              const Icon = getIcon(dashboard.icon)
              const href = `/dashboards/${dashboard.slug}`

              return (
                <Link
                  key={dashboard.id}
                  href={href}
                  className={linkClasses(href)}
                  title={collapsed ? dashboard.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{dashboard.title}</span>}
                </Link>
              )
            })}
          </div>
        )}

        {/* Sin dashboards */}
        {dashboards.length === 0 && !collapsed && (
          <div className="mt-4 px-3 py-4 text-center rounded-lg bg-white/5 border border-white/10">
            <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No tienes dashboards asignados</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Contacta al administrador</p>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-white/10" />
            {!collapsed && (
              <p className="px-3 text-xs font-medium text-amber-400/80 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Administración
              </p>
            )}
            <div className="space-y-1">
              {[
                { href: '/admin/users', icon: Users, label: 'Usuarios' },
                { href: '/admin/dashboards', icon: BarChart3, label: 'Dashboards' },
                { href: '/admin/permissions', icon: Shield, label: 'Permisos' },
                { href: '/admin/settings', icon: Settings, label: 'Configuración' },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkClasses(href, true)}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>
    </aside>
  )
}
