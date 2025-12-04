'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Layers,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  BarChart3,
  Check,
  X,
  AlertCircle,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================
// TIPOS
// ============================================
interface Area {
  id: string
  name: string
  description: string | null
  sectorId: string
  isActive: boolean
  _count: {
    dashboards: number
    users: number
  }
}

interface Sector {
  id: string
  name: string
  description: string | null
  isActive: boolean
  areas: Area[]
  _count: {
    users: number
  }
}

// ============================================
// API FUNCTIONS
// ============================================
async function fetchSectors(): Promise<Sector[]> {
  const res = await fetch('/api/admin/sectors')
  if (!res.ok) throw new Error('Error al cargar sectores')
  return res.json()
}

async function createSector(data: { name: string; description?: string }): Promise<Sector> {
  const res = await fetch('/api/admin/sectors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al crear sector')
  }
  return res.json()
}

async function updateSector(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<Sector> {
  const res = await fetch(`/api/admin/sectors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al actualizar sector')
  }
  return res.json()
}

async function deleteSector(id: string): Promise<void> {
  const res = await fetch(`/api/admin/sectors/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al eliminar sector')
  }
}

async function createArea(data: { name: string; description?: string; sectorId: string }): Promise<Area> {
  const res = await fetch('/api/admin/areas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al crear área')
  }
  return res.json()
}

async function updateArea(id: string, data: { name?: string; description?: string; sectorId?: string; isActive?: boolean }): Promise<Area> {
  const res = await fetch(`/api/admin/areas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al actualizar área')
  }
  return res.json()
}

async function deleteArea(id: string): Promise<void> {
  const res = await fetch(`/api/admin/areas/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al eliminar área')
  }
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================
export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({})
  
  // Modal states
  const [sectorModal, setSectorModal] = useState<{ open: boolean; mode: 'create' | 'edit'; sector?: Sector }>({
    open: false,
    mode: 'create',
  })
  const [areaModal, setAreaModal] = useState<{ open: boolean; mode: 'create' | 'edit'; area?: Area; sectorId?: string }>({
    open: false,
    mode: 'create',
  })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; type: 'sector' | 'area'; item?: Sector | Area }>({
    open: false,
    type: 'sector',
  })

  // Form states
  const [sectorForm, setSectorForm] = useState({ name: '', description: '' })
  const [areaForm, setAreaForm] = useState({ name: '', description: '', sectorId: '' })
  const [error, setError] = useState<string | null>(null)

  // Query con staleTime optimizado - sectores cambian poco
  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ['admin-sectors'],
    queryFn: fetchSectors,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  // Mutations
  const createSectorMutation = useMutation({
    mutationFn: createSector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sectors'] })
      setSectorModal({ open: false, mode: 'create' })
      setSectorForm({ name: '', description: '' })
      setError(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateSectorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; isActive?: boolean } }) =>
      updateSector(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sectors'] })
      setSectorModal({ open: false, mode: 'create' })
      setSectorForm({ name: '', description: '' })
      setError(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteSectorMutation = useMutation({
    mutationFn: deleteSector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sectors'] })
      setDeleteModal({ open: false, type: 'sector' })
    },
    onError: (err: Error) => setError(err.message),
  })

  const createAreaMutation = useMutation({
    mutationFn: createArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sectors'] })
      setAreaModal({ open: false, mode: 'create' })
      setAreaForm({ name: '', description: '', sectorId: '' })
      setError(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateAreaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; sectorId?: string; isActive?: boolean } }) =>
      updateArea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sectors'] })
      setAreaModal({ open: false, mode: 'create' })
      setAreaForm({ name: '', description: '', sectorId: '' })
      setError(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteAreaMutation = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sectors'] })
      setDeleteModal({ open: false, type: 'area' })
    },
    onError: (err: Error) => setError(err.message),
  })

  // Handlers
  const toggleSector = (id: string) => {
    setExpandedSectors(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const openEditSector = (sector: Sector) => {
    setSectorForm({ name: sector.name, description: sector.description || '' })
    setSectorModal({ open: true, mode: 'edit', sector })
    setError(null)
  }

  const openEditArea = (area: Area) => {
    setAreaForm({ name: area.name, description: area.description || '', sectorId: area.sectorId })
    setAreaModal({ open: true, mode: 'edit', area })
    setError(null)
  }

  const openCreateArea = (sectorId: string) => {
    setAreaForm({ name: '', description: '', sectorId })
    setAreaModal({ open: true, mode: 'create', sectorId })
    setError(null)
  }

  const handleSectorSubmit = () => {
    if (sectorModal.mode === 'create') {
      createSectorMutation.mutate({ name: sectorForm.name, description: sectorForm.description || undefined })
    } else if (sectorModal.sector) {
      updateSectorMutation.mutate({
        id: sectorModal.sector.id,
        data: { name: sectorForm.name, description: sectorForm.description || undefined },
      })
    }
  }

  const handleAreaSubmit = () => {
    if (areaModal.mode === 'create') {
      createAreaMutation.mutate({
        name: areaForm.name,
        description: areaForm.description || undefined,
        sectorId: areaForm.sectorId,
      })
    } else if (areaModal.area) {
      updateAreaMutation.mutate({
        id: areaModal.area.id,
        data: {
          name: areaForm.name,
          description: areaForm.description || undefined,
          sectorId: areaForm.sectorId,
        },
      })
    }
  }

  const handleToggleActive = async (type: 'sector' | 'area', id: string, currentActive: boolean) => {
    if (type === 'sector') {
      updateSectorMutation.mutate({ id, data: { isActive: !currentActive } })
    } else {
      updateAreaMutation.mutate({ id, data: { isActive: !currentActive } })
    }
  }

  // Stats
  const totalSectors = sectors.length
  const totalAreas = sectors.reduce((sum, s) => sum + s.areas.length, 0)
  const activeSectors = sectors.filter(s => s.isActive).length
  const activeAreas = sectors.reduce((sum, s) => sum + s.areas.filter(a => a.isActive).length, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
            <Settings className="h-8 w-8 text-amber-400" />
            Configuración
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la estructura organizacional de tu empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setAreaForm({ name: '', description: '', sectorId: '' })
              setAreaModal({ open: true, mode: 'create' })
              setError(null)
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Área
          </Button>
          <Button
            onClick={() => {
              setSectorForm({ name: '', description: '' })
              setSectorModal({ open: true, mode: 'create' })
              setError(null)
            }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Sector
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Sectores Totales', value: totalSectors, icon: Building2, color: 'blue' },
          { label: 'Sectores Activos', value: activeSectors, icon: Check, color: 'emerald' },
          { label: 'Áreas Totales', value: totalAreas, icon: Layers, color: 'purple' },
          { label: 'Áreas Activas', value: activeAreas, icon: Check, color: 'emerald' },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={cn(
                'p-3 rounded-lg',
                stat.color === 'blue' && 'bg-blue-500/20 text-blue-400',
                stat.color === 'emerald' && 'bg-emerald-500/20 text-emerald-400',
                stat.color === 'purple' && 'bg-purple-500/20 text-purple-400',
              )}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sectors List */}
      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            Sectores y Áreas
          </h2>
        </div>

        {sectors.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No hay sectores configurados</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Crea el primer sector para empezar a organizar tu empresa
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sectors.map((sector) => (
              <div key={sector.id}>
                {/* Sector Row */}
                <div
                  className={cn(
                    'flex items-center justify-between p-4 hover:bg-white/5 transition-colors',
                    !sector.isActive && 'opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSector(sector.id)}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      {expandedSectors[sector.id] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Building2 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {sector.name}
                        {!sector.isActive && (
                          <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                            Inactivo
                          </Badge>
                        )}
                      </p>
                      {sector.description && (
                        <p className="text-sm text-muted-foreground">{sector.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        {sector.areas.length} áreas
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {sector._count.users} usuarios
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCreateArea(sector.id)}
                        title="Agregar área"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditSector(sector)}
                        title="Editar sector"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive('sector', sector.id, sector.isActive)}
                        title={sector.isActive ? 'Desactivar' : 'Activar'}
                        className={sector.isActive ? 'text-amber-400' : 'text-emerald-400'}
                      >
                        {sector.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteModal({ open: true, type: 'sector', item: sector })}
                        className="text-rose-400 hover:text-rose-300"
                        title="Eliminar sector"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Areas (Expandable) */}
                {expandedSectors[sector.id] && sector.areas.length > 0 && (
                  <div className="bg-white/5 border-t border-white/5">
                    {sector.areas.map((area) => (
                      <div
                        key={area.id}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 pl-16 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0',
                          !area.isActive && 'opacity-60'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/20">
                            <Layers className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {area.name}
                              {!area.isActive && (
                                <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                                  Inactivo
                                </Badge>
                              )}
                            </p>
                            {area.description && (
                              <p className="text-sm text-muted-foreground">{area.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              {area._count.dashboards} dashboards
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {area._count.users} usuarios
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditArea(area)}
                              title="Editar área"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive('area', area.id, area.isActive)}
                              title={area.isActive ? 'Desactivar' : 'Activar'}
                              className={area.isActive ? 'text-amber-400' : 'text-emerald-400'}
                            >
                              {area.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteModal({ open: true, type: 'area', item: area })}
                              className="text-rose-400 hover:text-rose-300"
                              title="Eliminar área"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty areas state */}
                {expandedSectors[sector.id] && sector.areas.length === 0 && (
                  <div className="bg-white/5 border-t border-white/5 p-6 text-center">
                    <Layers className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Este sector no tiene áreas</p>
                    <Button
                      variant="link"
                      className="text-purple-400 mt-1"
                      onClick={() => openCreateArea(sector.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar primera área
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Sector */}
      <Dialog open={sectorModal.open} onOpenChange={(open) => !open && setSectorModal({ open: false, mode: 'create' })}>
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-400" />
              {sectorModal.mode === 'create' ? 'Nuevo Sector' : 'Editar Sector'}
            </DialogTitle>
            <DialogDescription>
              Los sectores son las divisiones principales de tu empresa (ej: Administración, Comercial, Operaciones)
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sector-name">Nombre *</Label>
              <Input
                id="sector-name"
                placeholder="Ej: Administración"
                value={sectorForm.name}
                onChange={(e) => setSectorForm({ ...sectorForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector-description">Descripción</Label>
              <Textarea
                id="sector-description"
                placeholder="Descripción opcional del sector"
                value={sectorForm.description}
                onChange={(e) => setSectorForm({ ...sectorForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSectorModal({ open: false, mode: 'create' })}>
              Cancelar
            </Button>
            <Button
              onClick={handleSectorSubmit}
              disabled={!sectorForm.name.trim() || createSectorMutation.isPending || updateSectorMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {createSectorMutation.isPending || updateSectorMutation.isPending
                ? 'Guardando...'
                : sectorModal.mode === 'create'
                ? 'Crear Sector'
                : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Area */}
      <Dialog open={areaModal.open} onOpenChange={(open) => !open && setAreaModal({ open: false, mode: 'create' })}>
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              {areaModal.mode === 'create' ? 'Nueva Área' : 'Editar Área'}
            </DialogTitle>
            <DialogDescription>
              Las áreas son subdivisiones dentro de un sector (ej: Contabilidad, Tesorería dentro de Administración)
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="area-sector">Sector *</Label>
              <Select
                value={areaForm.sectorId}
                onValueChange={(value) => setAreaForm({ ...areaForm, sectorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-name">Nombre *</Label>
              <Input
                id="area-name"
                placeholder="Ej: Contabilidad"
                value={areaForm.name}
                onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-description">Descripción</Label>
              <Textarea
                id="area-description"
                placeholder="Descripción opcional del área"
                value={areaForm.description}
                onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAreaModal({ open: false, mode: 'create' })}>
              Cancelar
            </Button>
            <Button
              onClick={handleAreaSubmit}
              disabled={!areaForm.name.trim() || !areaForm.sectorId || createAreaMutation.isPending || updateAreaMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {createAreaMutation.isPending || updateAreaMutation.isPending
                ? 'Guardando...'
                : areaModal.mode === 'create'
                ? 'Crear Área'
                : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Delete Confirmation */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, type: 'sector' })}>
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar {deleteModal.type === 'sector' ? 'el sector' : 'el área'}{' '}
              <strong>&quot;{(deleteModal.item as Sector | Area)?.name}&quot;</strong>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, type: 'sector' })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteModal.item) {
                  if (deleteModal.type === 'sector') {
                    deleteSectorMutation.mutate(deleteModal.item.id)
                  } else {
                    deleteAreaMutation.mutate(deleteModal.item.id)
                  }
                }
              }}
              disabled={deleteSectorMutation.isPending || deleteAreaMutation.isPending}
            >
              {deleteSectorMutation.isPending || deleteAreaMutation.isPending
                ? 'Eliminando...'
                : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

