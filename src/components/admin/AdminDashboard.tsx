'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  Users,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Plus,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react'

interface Dashboard {
  id: string
  slug: string
  title: string
  icon: string | null
  isActive: boolean
  sectorName: string | null
  areaName: string | null
  _count: {
    userAccess: number
  }
}

interface User {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: Date
  _count: {
    dashboardAccess: number
  }
}

interface RecentAccess {
  id: string
  user: { name: string | null; email: string | null }
  dashboard: { title: string; slug: string }
  updatedAt: Date
}

interface AdminDashboardProps {
  dashboards: Dashboard[]
  users: User[]
  recentAccesses: RecentAccess[]
  dbStatus: { connected: boolean; latency: number }
  userName: string
}

export function AdminDashboard({
  dashboards,
  users,
  recentAccesses,
  dbStatus,
  userName,
}: AdminDashboardProps) {
  const activeDashboards = dashboards.filter((d) => d.isActive)
  const totalUsers = users.length
  const adminCount = users.filter((u) => u.role === 'admin').length

  // Helper para obtener label de ubicación
  const getLocationLabel = (dashboard: Dashboard) => {
    if (dashboard.sectorName && dashboard.areaName) {
      return `${dashboard.sectorName} / ${dashboard.areaName}`
    }
    if (dashboard.sectorName) return dashboard.sectorName
    if (dashboard.areaName) return dashboard.areaName
    return 'Sin asignar'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Bienvenido, {userName}. Aquí puedes gestionar todo el sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Gestionar Usuarios
            </Button>
          </Link>
          <Link href="/admin/permissions">
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600">
              <Plus className="h-4 w-4" />
              Asignar Permisos
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs del Sistema */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Estado de la Base de Datos */}
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Base de Datos
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {dbStatus.connected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-xl font-bold text-green-500">Conectada</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-xl font-bold text-red-500">Desconectada</span>
                </>
              )}
            </div>
            {dbStatus.connected && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Zap className="h-3 w-3" />
                Latencia: {dbStatus.latency}ms
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dashboards */}
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dashboards
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDashboards.length}</div>
            <p className="text-xs text-muted-foreground">
              {dashboards.length - activeDashboards.length} inactivos
            </p>
          </CardContent>
        </Card>

        {/* Usuarios */}
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {adminCount} administradores
            </p>
          </CardContent>
        </Card>

        {/* Accesos Configurados */}
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accesos Configurados
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboards.reduce((sum, d) => sum + d._count.userAccess, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Asignaciones usuario-dashboard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboards y Accesos Recientes */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Lista de Dashboards */}
        <Card className="glass border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dashboards del Sistema</CardTitle>
                <CardDescription>
                  Estado de todos los dashboards configurados
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/dashboards" className="gap-1">
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>Dashboard</TableHead>
                  <TableHead>Sector / Área</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboards.slice(0, 5).map((dashboard) => (
                  <TableRow key={dashboard.id} className="border-white/10">
                    <TableCell>
                      <Link
                        href={`/dashboards/${dashboard.slug}`}
                        className="font-medium hover:text-blue-400 transition-colors"
                      >
                        {dashboard.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/20">
                        {getLocationLabel(dashboard)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {dashboard._count.userAccess} usuarios
                      </span>
                    </TableCell>
                    <TableCell>
                      {dashboard.isActive ? (
                        <Badge className="bg-green-500/20 text-green-400 border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-0">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {dashboards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No hay dashboards configurados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Accesos Recientes */}
        <Card className="glass border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permisos Recientes</CardTitle>
                <CardDescription>
                  Últimas asignaciones de acceso
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/permissions" className="gap-1">
                  Gestionar <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAccesses.map((access) => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {access.user.name || access.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        → {access.dashboard.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(access.updatedAt).toLocaleDateString('es-CL')}
                  </div>
                </div>
              ))}
              {recentAccesses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay accesos configurados aún
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuarios Recientes */}
      <Card className="glass border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                Usuarios registrados y sus dashboards asignados
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users" className="gap-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Dashboards</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-white/10">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.name || 'Sin nombre'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className={user.role === 'admin' ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {user._count.dashboardAccess} asignados
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('es-CL')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass border-white/10 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">🚀 Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/admin/users">
              <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <Users className="h-8 w-8 text-blue-400 mb-2" />
                <h3 className="font-medium group-hover:text-blue-400 transition-colors">
                  Crear Usuario
                </h3>
                <p className="text-sm text-muted-foreground">
                  Invitar nuevos usuarios al sistema
                </p>
              </div>
            </Link>
            <Link href="/admin/permissions">
              <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <Shield className="h-8 w-8 text-purple-400 mb-2" />
                <h3 className="font-medium group-hover:text-purple-400 transition-colors">
                  Asignar Permisos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configurar acceso a dashboards
                </p>
              </div>
            </Link>
            <Link href="/admin/dashboards">
              <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <BarChart3 className="h-8 w-8 text-cyan-400 mb-2" />
                <h3 className="font-medium group-hover:text-cyan-400 transition-colors">
                  Gestionar Dashboards
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crear y configurar dashboards
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
