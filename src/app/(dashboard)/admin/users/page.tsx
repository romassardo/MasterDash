'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  UserPlus,
  Search,
  Shield,
  User as UserIcon,
  Pencil,
  Trash2,
  Loader2,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Sector {
  id: string
  name: string
  areas: { id: string; name: string }[]
}

interface User {
  id: string
  email: string | null
  name: string | null
  role: string
  sectorId: string | null
  areaId: string | null
  sector: { name: string } | null
  area: { name: string } | null
  createdAt: string
  _count: { dashboardAccess: number }
}

// ============================================
// API FUNCTIONS
// ============================================
async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/admin/users')
  if (!res.ok) throw new Error('Error al cargar usuarios')
  return res.json()
}

async function fetchSectors(): Promise<Sector[]> {
  const res = await fetch('/api/admin/sectors')
  if (!res.ok) throw new Error('Error al cargar sectores')
  return res.json()
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================
export default function UsersPage() {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Queries con TanStack Query - staleTime de 2 minutos para datos admin
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })

  const { data: sectors = [], isLoading: loadingSectors } = useQuery({
    queryKey: ['admin-sectors'],
    queryFn: fetchSectors,
    staleTime: 1000 * 60 * 5, // 5 minutos - sectores cambian menos
  })

  const loading = loadingUsers || loadingSectors

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    sectorId: '',
    areaId: '',
  })

  // Areas disponibles segun sector seleccionado
  const availableAreas = sectors.find(s => s.id === formData.sectorId)?.areas || []

  const filteredUsers = users.filter(
    user =>
      (user.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (user.name?.toLowerCase() || '').includes(search.toLowerCase())
  )

  // Abrir dialog para crear
  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user',
      sectorId: '',
      areaId: '',
    })
    setDialogOpen(true)
  }

  // Abrir dialog para editar
  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email || '',
      name: user.name || '',
      password: '',
      role: user.role as 'admin' | 'user',
      sectorId: user.sectorId || '',
      areaId: user.areaId || '',
    })
    setDialogOpen(true)
  }

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    if (!formData.email || !formData.name) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('La contrasena es requerida para nuevos usuarios')
      return
    }

    setSaving(true)
    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users'
      
      const body: Record<string, unknown> = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        sectorId: formData.sectorId || null,
        areaId: formData.areaId || null,
      }

      // Solo incluir password si se proporciono
      if (formData.password) {
        body.password = formData.password
      }

      const res = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al guardar')
      }

      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Eliminar
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar')
      }

      toast.success('Usuario eliminado')
      setDeleteConfirmId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar')
    }
  }

  // Helper para label de ubicacion
  const getLocationLabel = (user: User) => {
    if (user.role === 'admin') return 'Acceso total'
    if (!user.sector && !user.area) return 'Sin asignar'
    if (user.sector && user.area) return `${user.sector.name} / ${user.area.name}`
    if (user.sector) return user.sector.name
    return 'Sin asignar'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y sus roles
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-modal border-white/10 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Modifica los datos del usuario'
                  : 'Completa los datos para crear un nuevo usuario'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Perez"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'user') =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Usuario
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.com"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Contrasena {editingUser ? '(dejar vacio para no cambiar)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="********"
                  className="bg-white/5 border-white/10"
                />
              </div>

              {formData.role === 'user' && (
                <>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Ubicacion Organizacional
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Define la ubicacion organizacional del usuario (solo informativo)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sector</Label>
                      <Select
                        value={formData.sectorId || 'none'}
                        onValueChange={(value) =>
                          setFormData({ ...formData, sectorId: value === 'none' ? '' : value, areaId: '' })
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Seleccionar sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin sector</SelectItem>
                          {sectors.map((sector) => (
                            <SelectItem key={sector.id} value={sector.id}>
                              {sector.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Area</Label>
                      <Select
                        value={formData.areaId || 'none'}
                        onValueChange={(value) =>
                          setFormData({ ...formData, areaId: value === 'none' ? '' : value })
                        }
                        disabled={!formData.sectorId || formData.sectorId === 'none'}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder={formData.sectorId && formData.sectorId !== 'none' ? "Seleccionar area" : "Primero selecciona sector"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin area</SelectItem>
                          {availableAreas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {formData.role === 'admin' && (
                <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/10">
                  <p className="text-sm text-blue-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Los administradores tienen acceso a todos los dashboards y la configuracion del sistema.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios Estandar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'user').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card className="glass border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                Todos los usuarios registrados en el sistema
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-white/5 border-white/10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Sector / Area</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/10">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </span>
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
                        className={
                          user.role === 'admin'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                            : ''
                        }
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserIcon className="mr-1 h-3 w-3" />
                            Usuario
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/20">
                        {getLocationLabel(user)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('es-CL')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Dialog
                          open={deleteConfirmId === user.id}
                          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-400"
                              onClick={() => setDeleteConfirmId(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-modal border-white/10">
                            <DialogHeader>
                              <DialogTitle>Eliminar usuario?</DialogTitle>
                              <DialogDescription>
                                Esta accion eliminara al usuario &quot;{user.name || user.email}&quot; y
                                todos sus accesos. Esta accion no se puede deshacer.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(user.id)}
                              >
                                Eliminar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
