'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { availableIcons, getIcon } from '@/lib/icons'

interface Area {
  id: string
  name: string
  sector: { id: string; name: string } | null
}

interface Dashboard {
  id: string
  slug: string
  title: string
  description: string | null
  icon: string | null
  isActive: boolean
  areaId: string | null
  area: Area | null
  _count: { userAccess: number }
}

interface Sector {
  id: string
  name: string
  areas: { id: string; name: string }[]
}

export default function DashboardsAdminPage() {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    icon: 'BarChart3',
    areaId: '',
    isActive: true,
  })

  // Cargar datos
  const fetchData = async () => {
    try {
      const [dashRes, sectorsRes] = await Promise.all([
        fetch('/api/admin/dashboards'),
        fetch('/api/admin/sectors'),
      ])
      
      if (!dashRes.ok) throw new Error('Error al cargar dashboards')
      
      const dashData = await dashRes.json()
      setDashboards(dashData)
      
      if (sectorsRes.ok) {
        const sectorsData = await sectorsRes.json()
        setSectors(sectorsData)
      }
    } catch (error) {
      toast.error('Error al cargar datos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Abrir dialog para crear
  const handleCreate = () => {
    setEditingDashboard(null)
    setFormData({
      slug: '',
      title: '',
      description: '',
      icon: 'BarChart3',
      areaId: '',
      isActive: true,
    })
    setDialogOpen(true)
  }

  // Abrir dialog para editar
  const handleEdit = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard)
    setFormData({
      slug: dashboard.slug,
      title: dashboard.title,
      description: dashboard.description || '',
      icon: dashboard.icon || 'BarChart3',
      areaId: dashboard.areaId || '',
      isActive: dashboard.isActive,
    })
    setDialogOpen(true)
  }

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    if (!formData.slug || !formData.title) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const url = editingDashboard
        ? `/api/admin/dashboards/${editingDashboard.id}`
        : '/api/admin/dashboards'
      
      const res = await fetch(url, {
        method: editingDashboard ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          areaId: formData.areaId || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al guardar')
      }

      toast.success(editingDashboard ? 'Dashboard actualizado' : 'Dashboard creado')
      setDialogOpen(false)
      fetchData()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Eliminar
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/dashboards/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Error al eliminar')

      toast.success('Dashboard eliminado')
      setDeleteConfirmId(null)
      fetchData()
      router.refresh()
    } catch (error) {
      toast.error('Error al eliminar dashboard')
      console.error(error)
    }
  }

  // Toggle activo/inactivo
  const handleToggleActive = async (dashboard: Dashboard) => {
    try {
      const res = await fetch(`/api/admin/dashboards/${dashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !dashboard.isActive }),
      })

      if (!res.ok) throw new Error('Error al actualizar')

      toast.success(dashboard.isActive ? 'Dashboard desactivado' : 'Dashboard activado')
      fetchData()
    } catch (error) {
      toast.error('Error al actualizar estado')
      console.error(error)
    }
  }

  // Generar slug desde titulo
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Helper para obtener label de area
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
          <h1 className="text-3xl font-bold tracking-tight">Gestion de Dashboards</h1>
          <p className="text-muted-foreground">
            Crea y administra los dashboards del sistema
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-modal border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDashboard ? 'Editar Dashboard' : 'Nuevo Dashboard'}
              </DialogTitle>
              <DialogDescription>
                {editingDashboard
                  ? 'Modifica los datos del dashboard'
                  : 'Completa los datos para crear un nuevo dashboard'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: !editingDashboard ? generateSlug(e.target.value) : formData.slug,
                    })
                  }}
                  placeholder="Dashboard de Ventas"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ventas"
                  className="bg-white/5 border-white/10"
                />
                <p className="text-xs text-muted-foreground">
                  URL: /dashboards/{formData.slug || 'slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Analisis de ventas..."
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Area (Sector)</Label>
                <Select
                  value={formData.areaId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, areaId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecciona un area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin area asignada</SelectItem>
                    {sectors.map((sector) => (
                      <div key={sector.id}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {sector.name}
                        </div>
                        {sector.areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Asocia el dashboard a un area para organizarlo en el sidebar
                </p>
              </div>

              <div className="space-y-2">
                <Label>Icono</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map(({ name, icon: Icon }) => (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                {editingDashboard ? 'Guardar Cambios' : 'Crear Dashboard'}
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
              Total Dashboards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboards.length}</div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {dashboards.filter(d => d.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Con Area Asignada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboards.filter(d => d.areaId).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de dashboards */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle>Dashboards</CardTitle>
          <CardDescription>
            Lista de todos los dashboards configurados en el sistema
          </CardDescription>
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
                  <TableHead>Dashboard</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Sector / Area</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboards.map((dashboard) => {
                  const Icon = getIcon(dashboard.icon)
                  return (
                    <TableRow key={dashboard.id} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <span className="font-medium">{dashboard.title}</span>
                            {dashboard.description && (
                              <p className="text-xs text-muted-foreground">{dashboard.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-white/10 px-2 py-1 rounded">
                          /{dashboard.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-white/20">
                          {getAreaLabel(dashboard)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(dashboard)}
                          className={dashboard.isActive ? 'text-green-500' : 'text-red-500'}
                        >
                          {dashboard.isActive ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Inactivo
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(dashboard)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Dialog
                            open={deleteConfirmId === dashboard.id}
                            onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-400"
                                onClick={() => setDeleteConfirmId(dashboard.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-modal border-white/10">
                              <DialogHeader>
                                <DialogTitle>Eliminar dashboard?</DialogTitle>
                                <DialogDescription>
                                  Esta accion eliminara el dashboard &quot;{dashboard.title}&quot; y todos
                                  los accesos asociados. Esta accion no se puede deshacer.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                                  Cancelar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(dashboard.id)}
                                >
                                  Eliminar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {dashboards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay dashboards configurados. Crea el primero.
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
