'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  Users as UsersIcon,
  Shield,
  Plus,
  Trash2,
  Loader2,
  Key,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string | null
  name: string | null
  role: string
}

interface Area {
  id: string
  name: string
  sector: { id: string; name: string } | null
}

interface Dashboard {
  id: string
  slug: string
  title: string
  area: Area | null
}

interface Permission {
  id: string
  userId: string
  dashboardId: string
  accessScope: string | null
  user: User
  dashboard: Dashboard
  createdAt: string
}

// ============================================
// API FUNCTIONS
// ============================================
async function fetchPermissions(): Promise<Permission[]> {
  const res = await fetch('/api/admin/permissions')
  if (!res.ok) throw new Error('Error al cargar permisos')
  return res.json()
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/admin/users')
  if (!res.ok) throw new Error('Error al cargar usuarios')
  const data = await res.json()
  // Filtrar solo usuarios no-admin
  return data.filter((u: User) => u.role?.toLowerCase() !== 'admin')
}

async function fetchDashboards(): Promise<Dashboard[]> {
  const res = await fetch('/api/admin/dashboards')
  if (!res.ok) throw new Error('Error al cargar dashboards')
  return res.json()
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================
export default function PermissionsPage() {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<string[]>([])

  // Queries con TanStack Query - staleTime optimizado
  const { data: permissions = [], isLoading: loadingPerms } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: fetchPermissions,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users-filtered'],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })

  const { data: dashboards = [], isLoading: loadingDash } = useQuery({
    queryKey: ['admin-dashboards'],
    queryFn: fetchDashboards,
    staleTime: 1000 * 60 * 5, // 5 minutos - dashboards cambian menos
  })

  const loading = loadingPerms || loadingUsers || loadingDash

  // Obtener dashboards ya asignados al usuario seleccionado
  const userAssignedDashboards = permissions
    .filter(p => p.userId === selectedUserId)
    .map(p => p.dashboardId)

  // Dashboards disponibles (no asignados)
  const availableDashboards = dashboards.filter(
    d => !userAssignedDashboards.includes(d.id)
  )

  // Usuarios sin permisos
  const usersWithoutPermissions = users.filter(
    u => !permissions.some(p => p.userId === u.id)
  )

  // Abrir dialog para crear
  const handleCreate = () => {
    setSelectedUserId('')
    setSelectedDashboardIds([])
    setDialogOpen(true)
  }

  // Guardar nuevos permisos
  const handleSave = async () => {
    if (!selectedUserId || selectedDashboardIds.length === 0) {
      toast.error('Selecciona un usuario y al menos un dashboard')
      return
    }

    setSaving(true)
    try {
      for (const dashboardId of selectedDashboardIds) {
        const res = await fetch('/api/admin/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUserId,
            dashboardId,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          console.error('Error creating permission:', error)
        }
      }

      toast.success('Permisos asignados correctamente')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] })
    } catch (error) {
      toast.error('Error al asignar permisos')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  // Eliminar
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/permissions/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Error al eliminar')

      toast.success('Permiso eliminado')
      setDeleteConfirmId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] })
    } catch (error) {
      toast.error('Error al eliminar permiso')
      console.error(error)
    }
  }

  // Agrupar permisos por usuario
  const permissionsByUser = permissions.reduce((acc, perm) => {
    const userId = perm.userId
    if (!acc[userId]) {
      acc[userId] = {
        user: perm.user,
        permissions: [],
      }
    }
    acc[userId].permissions.push(perm)
    return acc
  }, {} as Record<string, { user: User; permissions: Permission[] }>)

  // Helper para obtener nombre del area/sector
  const getAreaLabel = (dashboard: Dashboard) => {
    if (!dashboard.area) return 'Sin area'
    if (dashboard.area.sector) {
      return `${dashboard.area.sector.name} / ${dashboard.area.name}`
    }
    return dashboard.area.name
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-8 w-8 text-blue-500" />
            Permisos de Acceso
          </h1>
          <p className="text-muted-foreground">
            Asigna dashboards a usuarios. Sin permisos asignados, los usuarios no pueden ver ningun dashboard.
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Asignar Dashboards
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-modal border-white/10 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Asignar Dashboards a Usuario</DialogTitle>
              <DialogDescription>
                Selecciona un usuario y los dashboards que podra visualizar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Usuario *</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No hay usuarios disponibles (solo usuarios no-admin)
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <span>{user.name || user.email}</span>
                            {!permissions.some(p => p.userId === user.id) && (
                              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                                Sin acceso
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedUserId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dashboards a asignar</label>
                  <div className="border border-white/10 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {availableDashboards.length > 0 ? (
                      availableDashboards.map((dashboard) => (
                        <div
                          key={dashboard.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={dashboard.id}
                            checked={selectedDashboardIds.includes(dashboard.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDashboardIds([...selectedDashboardIds, dashboard.id])
                              } else {
                                setSelectedDashboardIds(
                                  selectedDashboardIds.filter(id => id !== dashboard.id)
                                )
                              }
                            }}
                          />
                          <label
                            htmlFor={dashboard.id}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {dashboard.title}
                            <span className="text-muted-foreground ml-2">
                              ({getAreaLabel(dashboard)})
                            </span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Este usuario ya tiene acceso a todos los dashboards
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !selectedUserId || selectedDashboardIds.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Asignar ({selectedDashboardIds.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerta de usuarios sin acceso */}
      {usersWithoutPermissions.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-200">
                  {usersWithoutPermissions.length} usuario(s) sin acceso a dashboards
                </p>
                <p className="text-sm text-amber-200/70">
                  {usersWithoutPermissions.map(u => u.name || u.email).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Permisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios con Acceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {Object.keys(permissionsByUser).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {users.length} usuarios
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dashboards Asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(permissions.map(p => p.dashboardId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              de {dashboards.length} disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Permisos por usuario */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : Object.entries(permissionsByUser).length > 0 ? (
        Object.entries(permissionsByUser).map(([userId, { user, permissions: userPerms }]) => (
          <Card key={userId} className="glass border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {user.name || 'Sin nombre'}
                    <Badge variant="outline" className="text-xs">
                      {userPerms.length} dashboard{userPerms.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Dashboard</TableHead>
                    <TableHead>Sector / Area</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPerms.map((perm) => (
                    <TableRow key={perm.id} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-400" />
                          <span className="font-medium">{perm.dashboard.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-white/20">
                          {getAreaLabel(perm.dashboard)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={deleteConfirmId === perm.id}
                          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-400"
                              onClick={() => setDeleteConfirmId(perm.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-modal border-white/10">
                            <DialogHeader>
                              <DialogTitle>Eliminar permiso?</DialogTitle>
                              <DialogDescription>
                                Se eliminara el acceso de {user.name || user.email} al
                                dashboard &quot;{perm.dashboard.title}&quot;. El usuario ya no podra ver este dashboard.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(perm.id)}
                              >
                                Eliminar Acceso
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="glass border-white/10 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay permisos configurados</p>
            <p className="text-sm mt-1">
              Los usuarios no pueden ver ningun dashboard hasta que les asignes acceso
            </p>
            <Button
              onClick={handleCreate}
              className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Asignar primer permiso
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="glass border-white/10 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">📋 Como funcionan los permisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs text-amber-500 flex-shrink-0 mt-0.5">1</div>
            <p>
              <strong className="text-foreground">Usuarios nuevos NO ven dashboards.</strong> Debes asignarles acceso manualmente.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-500 flex-shrink-0 mt-0.5">2</div>
            <p>
              <strong className="text-foreground">Asigna dashboards individualmente.</strong> Cada usuario ve solo lo que tu autorices.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-500 flex-shrink-0 mt-0.5">3</div>
            <p>
              <strong className="text-foreground">Administradores ven todo.</strong> Los usuarios con rol Admin tienen acceso completo automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
