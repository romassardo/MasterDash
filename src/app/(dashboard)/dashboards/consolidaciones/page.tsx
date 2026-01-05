'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KPICard, BarChart, LineChart } from '@/components/charts'
import { 
  FileCheck, 
  Building2, 
  Users, 
  Layers,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateAR } from '@/lib/date-utils'

interface ConsolidacionesData {
  success: boolean
  pagination: {
    page: number
    pageSize: number
    totalRows: number
    totalPages: number
  }
  kpis: {
    totalConsolidaciones: number
    sucursalesUnicas: number
    usuariosUnicos: number
    centrosCostosUnicos: number
  }
  charts: {
    porSucursal: { name: string; value: number }[]
    porMes: { date: string; value: number }[]
  }
  topUsuarios: { nombre: string; count: number }[]
  detalle: {
    fecha: string
    usuario: string
    nombre: string
    centroCostos: number
    sucursal: string
  }[]
  accessScope?: any
  error?: string
}

async function fetchConsolidaciones(page = 1, pageSize = 20): Promise<ConsolidacionesData> {
  const res = await fetch(`/api/dashboards/consolidaciones?page=${page}&pageSize=${pageSize}`)
  if (!res.ok) throw new Error('Error al cargar datos')
  return res.json()
}

export default function ConsolidacionesDashboard() {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-consolidaciones', page],
    queryFn: () => fetchConsolidaciones(page, pageSize),
    staleTime: 1000 * 60, // 1 minuto
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-muted-foreground">Cargando datos del DataWarehouse...</p>
        </div>
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4 glass rounded-xl p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Error al cargar datos</h2>
          <p className="text-muted-foreground">
            {data?.error || 'No se pudo conectar al DataWarehouse'}
          </p>
        </div>
      </div>
    )
  }

  const { kpis, charts, topUsuarios, detalle } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Consolidaciones de Caja
        </h1>
        <p className="text-muted-foreground mt-1">
          Reporte de consolidaciones por sucursal y usuario
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Consolidaciones"
          value={kpis.totalConsolidaciones}
          icon={<FileCheck className="h-5 w-5 text-blue-400" />}
        />
        <KPICard
          title="Sucursales"
          value={kpis.sucursalesUnicas}
          icon={<Building2 className="h-5 w-5 text-emerald-400" />}
        />
        <KPICard
          title="Usuarios Únicos"
          value={kpis.usuariosUnicos}
          icon={<Users className="h-5 w-5 text-purple-400" />}
        />
        <KPICard
          title="Centros de Costo"
          value={kpis.centrosCostosUnicos}
          icon={<Layers className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - Por Sucursal */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Consolidaciones por Sucursal</h3>
          <BarChart
            data={charts.porSucursal.slice(0, 10)}
            height={320}
            horizontal
            color="#6366f1"
          />
        </div>

        {/* Line Chart - Tendencia */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Tendencia Temporal</h3>
          <LineChart
            data={charts.porMes}
            height={320}
            color="#8b5cf6"
            areaFill
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Usuarios */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top 5 Usuarios</h3>
          <div className="space-y-3">
            {topUsuarios.map((usuario, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {usuario.nombre}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usuario.count} consolidaciones
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle Table */}
        <div className="glass rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Últimas Consolidaciones</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 glass border-white/10"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Página {page} de {data?.pagination?.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 glass border-white/10"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= (data?.pagination?.totalPages || 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-muted-foreground">Fecha</TableHead>
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="text-muted-foreground">Sucursal</TableHead>
                  <TableHead className="text-muted-foreground text-right">CC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalle.length > 0 ? (
                  detalle.map((row, index) => (
                    <TableRow key={index} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-sm">
                        {formatDateAR(row.fecha)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {row.nombre}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.sucursal}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {row.centroCostos}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No se encontraron consolidaciones en esta página.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

