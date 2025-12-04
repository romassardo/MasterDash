'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { 
  MessageSquare,
  Monitor,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertCircle,
  Search,
  Calendar,
  Activity,
  FileSpreadsheet,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDateShortAR, formatDateLongAR, ARGENTINA_LOCALE, ARGENTINA_TIMEZONE } from '@/lib/date-utils'

interface UsoCRMData {
  success: boolean
  meta: {
    period: number
    fechaDesde: string
    fechaHasta: string
    fechasDisponibles: { min: string; max: string }
    diasConDatos: number
  }
  kpis: {
    totalConversaciones: number
    respondidasWhatsApp: number
    respondidasCRM: number
    porcentajeWhatsApp: number
    porcentajeCRM: number
    moderadoresCriticos: number
    totalModeradores: number
    estadoEquipo: { excelente: number; normal: number; critico: number }
    promedioDiario: number
  }
  charts: {
    tendenciaDiaria: { date: string; whatsapp: number; crm: number; total: number }[]
  }
  moderadores: {
    id: string
    nombre: string
    porWhatsApp: number
    porCRM: number
    total: number
    tendencia: number
    usoCRM: number
    estado: 'TOP' | 'Normal' | 'ALERTA'
  }[]
  error?: string
}

async function fetchUsoCRM(period: number): Promise<UsoCRMData> {
  const res = await fetch(`/api/dashboards/uso-crm?period=${period}`)
  if (!res.ok) throw new Error('Error al cargar datos')
  return res.json()
}

type FilterType = 'todos' | 'critico' | 'malo' | 'regular' | 'bueno' | 'excelente'
type PeriodType = 0 | 1 | 7 | 15 | 30
type EstadoType = 'Excelente' | 'Bueno' | 'Regular' | 'Malo' | 'Crítico'

const periodLabels: Record<PeriodType, string> = {
  0: 'All',
  1: 'Hoy',
  7: '7 Días',
  15: '15 Días',
  30: '30 Días',
}

// ============================================
// LÓGICA DE ESTADOS (según rangos definidos)
// ============================================
const getEstadoFromPorcentaje = (porcentaje: number): EstadoType => {
  if (porcentaje >= 96) return 'Excelente'
  if (porcentaje >= 86) return 'Bueno'
  if (porcentaje >= 71) return 'Regular'
  if (porcentaje >= 41) return 'Malo'
  return 'Crítico'
}

const getEstadoColor = (estado: EstadoType) => {
  switch (estado) {
    case 'Excelente': return { text: 'text-emerald-400', bg: 'bg-emerald-500', gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    case 'Bueno': return { text: 'text-lime-400', bg: 'bg-lime-500', gradient: 'bg-gradient-to-r from-lime-500 to-lime-400', badge: 'bg-lime-500/20 text-lime-400 border-lime-500/30' }
    case 'Regular': return { text: 'text-amber-400', bg: 'bg-amber-500', gradient: 'bg-gradient-to-r from-amber-500 to-amber-400', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    case 'Malo': return { text: 'text-orange-400', bg: 'bg-orange-500', gradient: 'bg-gradient-to-r from-orange-500 to-orange-400', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    case 'Crítico': return { text: 'text-red-400', bg: 'bg-red-500', gradient: 'bg-gradient-to-r from-red-500 to-red-400', badge: 'bg-red-500/20 text-red-400 border-red-500/30' }
  }
}

export default function UsoCRMDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('todos')
  const [period, setPeriod] = useState<PeriodType>(7)
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-uso-crm', period],
    queryFn: () => fetchUsoCRM(period),
    staleTime: 1000 * 60, // 1 minuto - datos analíticos
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
    refetchOnWindowFocus: false, // Evitar refetch al cambiar de pestaña
  })

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
          <p className="text-muted-foreground">Cargando datos del CRM...</p>
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

  const { meta, kpis, charts, moderadores } = data

  // Calcular estado real basado en usoCRM
  const moderadoresConEstado = moderadores.map(mod => ({
    ...mod,
    estadoCalculado: getEstadoFromPorcentaje(mod.usoCRM)
  }))

  // Conteo por estado
  const conteoEstados = {
    excelente: moderadoresConEstado.filter(m => m.estadoCalculado === 'Excelente').length,
    bueno: moderadoresConEstado.filter(m => m.estadoCalculado === 'Bueno').length,
    regular: moderadoresConEstado.filter(m => m.estadoCalculado === 'Regular').length,
    malo: moderadoresConEstado.filter(m => m.estadoCalculado === 'Malo').length,
    critico: moderadoresConEstado.filter(m => m.estadoCalculado === 'Crítico').length,
  }

  // Filtrar moderadores
  const filteredModeradores = moderadoresConEstado.filter(mod => {
    const matchesSearch = mod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mod.id.includes(searchTerm)
    const matchesFilter = 
      filter === 'todos' ? true :
      filter === 'excelente' ? mod.estadoCalculado === 'Excelente' :
      filter === 'bueno' ? mod.estadoCalculado === 'Bueno' :
      filter === 'regular' ? mod.estadoCalculado === 'Regular' :
      filter === 'malo' ? mod.estadoCalculado === 'Malo' :
      filter === 'critico' ? mod.estadoCalculado === 'Crítico' : true
    return matchesSearch && matchesFilter
  })

  // ============================================
  // EXPORTAR A EXCEL
  // ============================================
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    
    // Hoja 1: Resumen KPIs
    const kpisData = [
      ['Métricas del Contact Center', '', ''],
      ['Período', `${meta.fechaDesde} a ${meta.fechaHasta}`, ''],
      ['', '', ''],
      ['KPI', 'Valor', 'Detalle'],
      ['Total Conversaciones', kpis.totalConversaciones, `Promedio: ${kpis.promedioDiario}/día`],
      ['Respondidas por WhatsApp', kpis.respondidasWhatsApp, `${kpis.porcentajeWhatsApp}% del total`],
      ['Respondidas por CRM', kpis.respondidasCRM, `${kpis.porcentajeCRM}% del total`],
      ['Total Moderadores', kpis.totalModeradores, ''],
      ['', '', ''],
      ['Estado del Equipo', '', ''],
      ['Excelente (96-100%)', conteoEstados.excelente, ''],
      ['Bueno (86-95%)', conteoEstados.bueno, ''],
      ['Regular (71-85%)', conteoEstados.regular, ''],
      ['Malo (41-70%)', conteoEstados.malo, ''],
      ['Crítico (0-40%)', conteoEstados.critico, ''],
    ]
    const wsKpis = XLSX.utils.aoa_to_sheet(kpisData)
    wsKpis['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }]
    XLSX.utils.book_append_sheet(wb, wsKpis, 'Resumen')
    
    // Hoja 2: Detalle Moderadores
    const moderadoresData = [
      ['Moderador', 'ID', 'Por WhatsApp', 'Por CRM', 'Total', 'Tendencia %', 'Uso CRM %', 'Estado'],
      ...moderadoresConEstado.map(mod => [
        mod.nombre,
        mod.id,
        mod.porWhatsApp,
        mod.porCRM,
        mod.total,
        mod.tendencia,
        mod.usoCRM,
        mod.estadoCalculado,
      ])
    ]
    const wsMods = XLSX.utils.aoa_to_sheet(moderadoresData)
    wsMods['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsMods, 'Moderadores')
    
    // Hoja 3: Tendencia Diaria
    const tendenciaData = [
      ['Fecha', 'WhatsApp', 'CRM', 'Total'],
      ...charts.tendenciaDiaria.map(d => [d.date, d.whatsapp, d.crm, d.total])
    ]
    const wsTend = XLSX.utils.aoa_to_sheet(tendenciaData)
    wsTend['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsTend, 'Tendencia Diaria')
    
    // Generar archivo
    const fileName = `CRM_Report_${meta.fechaDesde}_${meta.fechaHasta}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div className="space-y-4">
      {/* Header compacto con título, tabs y controles */}
      <Tabs defaultValue="general" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Título */}
          <div className="min-w-fit">
            <h1 className="text-2xl font-bold">Vista General</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Métricas del Contact Center</span>
              <span className="text-emerald-400">• {period === 0 ? 'Todos los datos' : `Últimos ${period} días`}</span>
            </p>
          </div>
          
          {/* Tabs - Centradas */}
          <div className="flex justify-center flex-1">
            <TabsList className="glass border border-white/10">
              <TabsTrigger value="general" className="data-[state=active]:bg-white/10">
                Vista General
              </TabsTrigger>
              <TabsTrigger value="moderadores" className="data-[state=active]:bg-white/10">
                Moderadores
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Controles: Período + Exportar */}
          <div className="flex items-center gap-2">
            {/* Selector de período */}
            <div className="flex items-center gap-1 glass rounded-lg p-1">
              <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
              {([1, 7, 15, 30, 0] as PeriodType[]).map((p) => (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "text-xs px-2",
                    period === p 
                      ? 'bg-white/10 text-white' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  )}
                >
                  {periodLabels[p]}
                </Button>
              ))}
            </div>
            
            {/* Botón Exportar Excel */}
            <Button
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              className="gap-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Tab: Vista General */}
        <TabsContent value="general" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Conversaciones */}
            <div className="glass rounded-xl p-6 group hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Conversaciones</p>
                  <p className="text-4xl font-bold mt-2">{kpis.totalConversaciones.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Promedio: {kpis.promedioDiario.toLocaleString()}/día
              </p>
            </div>

            {/* Respondidas por WhatsApp */}
            <div className="glass rounded-xl p-6 group hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Respondidas por WhatsApp</p>
                  <p className="text-4xl font-bold mt-2 text-emerald-400">
                    {kpis.respondidasWhatsApp.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20">
                  <MessageSquare className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <p className="text-sm text-emerald-400/80 mt-3">
                {kpis.porcentajeWhatsApp}% del total
              </p>
            </div>

            {/* Respondidas por CRM */}
            <div className="glass rounded-xl p-6 group hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Respondidas por CRM</p>
                  <p className="text-4xl font-bold mt-2 text-amber-400">
                    {kpis.respondidasCRM.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                  <Monitor className="h-6 w-6 text-amber-400" />
                </div>
              </div>
              <p className="text-sm text-amber-400/80 mt-3">
                {kpis.porcentajeCRM}% del total
              </p>
            </div>

            {/* Moderadores con Bajo Rendimiento */}
            <div className="glass rounded-xl p-6 group hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bajo Rendimiento</p>
                  <p className="text-4xl font-bold mt-2 text-red-400">
                    {conteoEstados.malo + conteoEstados.critico}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <p className="text-sm text-red-400/80 mt-3">
                Malo ({conteoEstados.malo}) + Crítico ({conteoEstados.critico})
              </p>
            </div>
          </div>

          {/* Estado del Equipo */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Estado del Equipo</h3>
              </div>
              <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-white/5">
                {kpis.totalModeradores} moderadores
              </span>
            </div>
            
            {/* Barra de estado - 5 niveles */}
            <div className="h-5 rounded-full overflow-hidden flex bg-white/5 mb-6">
              {conteoEstados.excelente > 0 && (
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${(conteoEstados.excelente / kpis.totalModeradores) * 100}%` }}
                  title={`Excelente: ${conteoEstados.excelente}`}
                />
              )}
              {conteoEstados.bueno > 0 && (
                <div 
                  className="bg-gradient-to-r from-lime-500 to-lime-400 h-full transition-all duration-500"
                  style={{ width: `${(conteoEstados.bueno / kpis.totalModeradores) * 100}%` }}
                  title={`Bueno: ${conteoEstados.bueno}`}
                />
              )}
              {conteoEstados.regular > 0 && (
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500"
                  style={{ width: `${(conteoEstados.regular / kpis.totalModeradores) * 100}%` }}
                  title={`Regular: ${conteoEstados.regular}`}
                />
              )}
              {conteoEstados.malo > 0 && (
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-400 h-full transition-all duration-500"
                  style={{ width: `${(conteoEstados.malo / kpis.totalModeradores) * 100}%` }}
                  title={`Malo: ${conteoEstados.malo}`}
                />
              )}
              {conteoEstados.critico > 0 && (
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-400 h-full transition-all duration-500"
                  style={{ width: `${(conteoEstados.critico / kpis.totalModeradores) * 100}%` }}
                  title={`Crítico: ${conteoEstados.critico}`}
                />
              )}
            </div>

            {/* Leyenda - 5 niveles */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">{conteoEstados.excelente} Excelente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-lime-500" />
                <span className="text-sm font-medium">{conteoEstados.bueno} Bueno</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">{conteoEstados.regular} Regular</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm font-medium">{conteoEstados.malo} Malo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">{conteoEstados.critico} Crítico</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Evolución */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Evolución del Uso de CRM</h3>
                <p className="text-sm text-muted-foreground">Comparativa: WhatsApp vs CRM</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-emerald-400">Respondidas por WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-amber-400">Respondidas por CRM</span>
                </div>
              </div>
            </div>

            <EvolutionChart data={charts.tendenciaDiaria} />
          </div>

          {/* Info de período */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>
              Mostrando datos desde {new Date(meta.fechaDesde).toLocaleDateString('es-AR')} hasta {new Date(meta.fechaHasta).toLocaleDateString('es-AR')}
              {' '}({meta.diasConDatos} días con registros)
            </span>
          </div>
        </TabsContent>

        {/* Tab: Moderadores */}
        <TabsContent value="moderadores" className="space-y-6">
          <div className="glass rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold">Gestión de Moderadores</h3>
                <p className="text-sm text-muted-foreground">
                  Análisis detallado de rendimiento y adopción del CRM (Últimos {period} días)
                </p>
              </div>

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar moderador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64 glass border-white/10"
                  />
                </div>
                <div className="flex flex-wrap gap-1 p-1 glass rounded-lg">
                  {[
                    { key: 'todos', label: 'Todos', color: '' },
                    { key: 'excelente', label: 'Excelente', color: 'text-emerald-400' },
                    { key: 'bueno', label: 'Bueno', color: 'text-lime-400' },
                    { key: 'regular', label: 'Regular', color: 'text-amber-400' },
                    { key: 'malo', label: 'Malo', color: 'text-orange-400' },
                    { key: 'critico', label: 'Crítico', color: 'text-red-400' },
                  ].map((f) => (
                    <Button
                      key={f.key}
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilter(f.key as FilterType)}
                      className={cn(
                        "text-xs px-2",
                        filter === f.key 
                          ? `bg-white/10 ${f.color || 'text-white'}` 
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      )}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabla de Moderadores */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Moderador</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center">Por WhatsApp</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center">Por CRM</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center">Total</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center">Tendencia</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Uso de CRM</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModeradores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No se encontraron moderadores con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredModeradores.map((mod) => (
                      <TableRow key={mod.id} className="border-white/5 hover:bg-white/5">
                        <TableCell>
                          <div>
                            <p className="font-medium">{mod.nombre}</p>
                            <p className="text-xs text-muted-foreground">{mod.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-emerald-400 font-medium">
                            {mod.porWhatsApp.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-amber-400 font-medium">
                            {mod.porCRM.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {mod.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            mod.tendencia > 0 ? "bg-emerald-500/10 text-emerald-400" :
                            mod.tendencia < 0 ? "bg-red-500/10 text-red-400" : 
                            "bg-white/5 text-muted-foreground"
                          )}>
                            {mod.tendencia > 0 ? <TrendingUp className="h-3 w-3" /> :
                             mod.tendencia < 0 ? <TrendingDown className="h-3 w-3" /> :
                             <Minus className="h-3 w-3" />}
                            <span>{mod.tendencia > 0 ? '+' : ''}{mod.tendencia}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-sm font-bold min-w-[45px]",
                              getEstadoColor(mod.estadoCalculado).text
                            )}>
                              {mod.usoCRM}%
                            </span>
                            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden min-w-[80px] max-w-[120px]">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  getEstadoColor(mod.estadoCalculado).gradient
                                )}
                                style={{ width: `${mod.usoCRM}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border",
                            getEstadoColor(mod.estadoCalculado).badge
                          )}>
                            {mod.estadoCalculado}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Resumen */}
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>
                Mostrando {filteredModeradores.length} de {moderadoresConEstado.length} moderadores
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  {conteoEstados.excelente} Excelente
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-lime-500" />
                  {conteoEstados.bueno} Bueno
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  {conteoEstados.regular} Regular
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  {conteoEstados.malo} Malo
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  {conteoEstados.critico} Crítico
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente para gráfico de evolución
function EvolutionChart({ data }: { data: { date: string; whatsapp: number; crm: number; total: number }[] }) {
  // Formatear fecha usando utilidades de Argentina
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString(ARGENTINA_LOCALE, { 
      timeZone: ARGENTINA_TIMEZONE,
      weekday: 'short', 
      day: 'numeric' 
    })
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      textStyle: { color: '#e5e7eb' },
      formatter: (params: { name: string; value: number; seriesName: string; color: string; dataIndex: number }[]) => {
        const idx = params[0]?.dataIndex
        const originalDate = data[idx]?.date || ''
        const [year, month, day] = originalDate.split('-').map(Number)
        const dateObj = new Date(year, month - 1, day)
        const formattedDate = dateObj.toLocaleDateString(ARGENTINA_LOCALE, { 
          timeZone: ARGENTINA_TIMEZONE,
          weekday: 'long', 
          day: 'numeric',
          month: 'long'
        })
        let html = `<div class="font-medium mb-2" style="text-transform: capitalize">${formattedDate}</div>`
        params.forEach(p => {
          html += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            <span style="background:${p.color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
            <span>${p.seriesName}: <strong>${p.value.toLocaleString()}</strong></span>
          </div>`
        })
        return html
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => formatDate(d.date)),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#9ca3af' },
      splitLine: { lineStyle: { color: '#1f2937', type: 'dashed' } },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        name: 'WhatsApp',
        data: data.map(d => d.whatsapp),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#10b981', width: 3 },
        itemStyle: { color: '#10b981', borderColor: '#0f172a', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
            ],
          },
        },
      },
      {
        name: 'CRM',
        data: data.map(d => d.crm),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#f59e0b', width: 3 },
        itemStyle: { color: '#f59e0b', borderColor: '#0f172a', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.4)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.02)' },
            ],
          },
        },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 380 }} opts={{ renderer: 'canvas' }} />
}
