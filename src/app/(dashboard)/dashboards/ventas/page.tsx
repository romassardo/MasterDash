'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '@/components/kpi/KPICard'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { DollarSign, TrendingUp, ShoppingCart, Users } from 'lucide-react'

// Datos de ejemplo - En producción vendrían del DataWarehouse via useDashboardData
const mockKPIs = [
  {
    title: 'Ventas Totales',
    value: '$2,345,678',
    delta: 12.5,
    deltaType: 'increase' as const,
    description: 'vs mes anterior',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: 'Transacciones',
    value: '12,456',
    delta: 8.2,
    deltaType: 'increase' as const,
    description: 'vs mes anterior',
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    title: 'Ticket Promedio',
    value: '$188.32',
    delta: 3.7,
    deltaType: 'increase' as const,
    description: 'vs mes anterior',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    title: 'Clientes Únicos',
    value: '3,421',
    delta: -2.1,
    deltaType: 'decrease' as const,
    description: 'vs mes anterior',
    icon: <Users className="h-4 w-4" />,
  },
]

// Datos de ejemplo para el gráfico de línea
const mockLineData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return {
    date: date.toISOString().split('T')[0],
    value: Math.floor(50000 + Math.random() * 100000 + i * 2000),
  }
})

// Datos de ejemplo para el gráfico de barras
const mockBarData = [
  { name: 'Norte', value: 45000 },
  { name: 'Sur', value: 38000 },
  { name: 'Este', value: 52000 },
  { name: 'Oeste', value: 41000 },
  { name: 'Centro', value: 67000 },
]

export default function VentasDashboardPage() {
  // En producción:
  // const { data, isLoading, error } = useDashboardData<VentasData>({ slug: 'ventas' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Ventas</h1>
        <p className="text-muted-foreground">
          Análisis general del rendimiento de ventas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockKPIs.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gráfico de evolución temporal */}
        <Card className="glass border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolución de Ventas</CardTitle>
            <CardDescription>
              Ventas diarias de los últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              data={mockLineData}
              height={350}
              showZoom={true}
              color="#3b82f6"
              areaStyle={true}
            />
          </CardContent>
        </Card>

        {/* Gráfico de barras por región */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle>Ventas por Región</CardTitle>
            <CardDescription>
              Distribución regional del mes actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={mockBarData}
              height={350}
              horizontal={true}
              color="#8b5cf6"
            />
          </CardContent>
        </Card>
      </div>

      {/* Información de configuración */}
      <Card className="glass border-white/10 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Datos de Ejemplo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Este dashboard muestra datos de ejemplo. Para ver datos reales:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Configura la conexión al DataWarehouse en <code className="bg-white/10 px-1 rounded">.env.local</code></li>
            <li>Actualiza el schema de Prisma con las tablas/vistas de tu DW</li>
            <li>Modifica la query en <code className="bg-white/10 px-1 rounded">/api/dashboards/ventas/data</code></li>
            <li>Reemplaza los datos mock por <code className="bg-white/10 px-1 rounded">useDashboardData</code></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}






