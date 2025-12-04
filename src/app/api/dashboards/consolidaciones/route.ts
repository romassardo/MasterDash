import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { rawQuery } from '@/lib/safe-query'

interface ConsolidacionRow {
  FECHA: Date
  USUARIO: string
  NOMBRE_COMPLETO: string
  CENTRO_COSTOS: number
  SUCURSAL: string
}

interface ConsolidacionPorSucursal {
  name: string
  value: number
}

interface ConsolidacionPorMes {
  date: string
  value: number
}

/**
 * GET /api/dashboards/consolidaciones
 * Obtiene datos agregados para el dashboard de consolidaciones
 */
export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener todos los datos
    const rawData = await rawQuery<ConsolidacionRow>(`
      SELECT FECHA, USUARIO, NOMBRE_COMPLETO, CENTRO_COSTOS, SUCURSAL 
      FROM cajas_ETL_Reporte_Consolidaciones
      ORDER BY FECHA DESC
    `)

    // KPIs
    const totalConsolidaciones = rawData.length
    const sucursalesUnicas = new Set(rawData.map(r => r.SUCURSAL.trim())).size
    const usuariosUnicos = new Set(rawData.map(r => r.USUARIO)).size
    const centrosCostosUnicos = new Set(rawData.map(r => r.CENTRO_COSTOS)).size

    // Consolidaciones por sucursal (para bar chart)
    const porSucursalMap = new Map<string, number>()
    rawData.forEach(row => {
      const sucursal = row.SUCURSAL.trim()
      porSucursalMap.set(sucursal, (porSucursalMap.get(sucursal) || 0) + 1)
    })
    const porSucursal: ConsolidacionPorSucursal[] = Array.from(porSucursalMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Consolidaciones por mes (para line chart)
    const porMesMap = new Map<string, number>()
    rawData.forEach(row => {
      const fecha = new Date(row.FECHA)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      porMesMap.set(mesKey, (porMesMap.get(mesKey) || 0) + 1)
    })
    const porMes: ConsolidacionPorMes[] = Array.from(porMesMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top 5 usuarios con más consolidaciones
    const porUsuarioMap = new Map<string, { nombre: string; count: number }>()
    rawData.forEach(row => {
      const existing = porUsuarioMap.get(row.USUARIO)
      if (existing) {
        existing.count++
      } else {
        porUsuarioMap.set(row.USUARIO, { nombre: row.NOMBRE_COMPLETO, count: 1 })
      }
    })
    const topUsuarios = Array.from(porUsuarioMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Detalle (últimas 20 consolidaciones)
    const detalle = rawData.slice(0, 20).map(row => ({
      fecha: row.FECHA,
      usuario: row.USUARIO,
      nombre: row.NOMBRE_COMPLETO,
      centroCostos: row.CENTRO_COSTOS,
      sucursal: row.SUCURSAL.trim(),
    }))

    return NextResponse.json({
      success: true,
      kpis: {
        totalConsolidaciones,
        sucursalesUnicas,
        usuariosUnicos,
        centrosCostosUnicos,
      },
      charts: {
        porSucursal,
        porMes,
      },
      topUsuarios,
      detalle,
    })

  } catch (error) {
    console.error('Error fetching consolidaciones:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}

