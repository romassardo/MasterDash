import { NextResponse } from 'next/server'
import { safeQuery } from '@/lib/safe-query'

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
 * Protegido por SafeQuery (RLS)
 * Soporta paginación para el detalle
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const offset = (page - 1) * pageSize

    // 1. Obtener KPIs (Agregación en SQL)
    const kpiResult = await safeQuery<{
      totalConsolidaciones: number
      sucursalesUnicas: number
      usuariosUnicos: number
      centrosCostosUnicos: number
    }>({
      dashboardSlug: 'consolidaciones',
      baseQuery: `
        SELECT 
          COUNT(*) as totalConsolidaciones,
          COUNT(DISTINCT SUCURSAL) as sucursalesUnicas,
          COUNT(DISTINCT USUARIO) as usuariosUnicos,
          COUNT(DISTINCT CENTRO_COSTOS) as centrosCostosUnicos
        FROM cajas_ETL_Reporte_Consolidaciones
      `,
    })

    // 2. Por Sucursal (Agregación en SQL)
    const sucursalResult = await safeQuery<{ name: string; value: number }>({
      dashboardSlug: 'consolidaciones',
      baseQuery: `
        SELECT TOP 10 SUCURSAL as name, COUNT(*) as value
        FROM cajas_ETL_Reporte_Consolidaciones
        GROUP BY SUCURSAL
        ORDER BY value DESC
      `,
    })

    // 3. Por Mes (Agregación en SQL)
    const mesResult = await safeQuery<{ date: string; value: number }>({
      dashboardSlug: 'consolidaciones',
      baseQuery: `
        SELECT 
          FORMAT(FECHA, 'yyyy-MM') as date,
          COUNT(*) as value
        FROM cajas_ETL_Reporte_Consolidaciones
        GROUP BY FORMAT(FECHA, 'yyyy-MM')
        ORDER BY date ASC
      `,
    })

    // 4. Top Usuarios (Agregación en SQL)
    const usuariosResult = await safeQuery<{ nombre: string; count: number }>({
      dashboardSlug: 'consolidaciones',
      baseQuery: `
        SELECT TOP 5 NOMBRE_COMPLETO as nombre, COUNT(*) as count
        FROM cajas_ETL_Reporte_Consolidaciones
        GROUP BY NOMBRE_COMPLETO
        ORDER BY count DESC
      `,
    })

    // 5. Detalle (Paginado - Server Side)
    const detalleResult = await safeQuery<ConsolidacionRow>({
      dashboardSlug: 'consolidaciones',
      baseQuery: `
        SELECT FECHA, USUARIO, NOMBRE_COMPLETO, CENTRO_COSTOS, SUCURSAL 
        FROM cajas_ETL_Reporte_Consolidaciones
      `,
      orderBy: `FECHA DESC OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`
    })

    if (kpiResult.error || sucursalResult.error || mesResult.error) {
      return NextResponse.json({ 
        success: false, 
        error: kpiResult.error || sucursalResult.error || mesResult.error 
      }, { status: 403 })
    }

    const totalRows = kpiResult.data[0]?.totalConsolidaciones || 0

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        pageSize,
        totalRows,
        totalPages: Math.ceil(totalRows / pageSize)
      },
      kpis: kpiResult.data[0] || {
        totalConsolidaciones: 0,
        sucursalesUnicas: 0,
        usuariosUnicos: 0,
        centrosCostosUnicos: 0,
      },
      charts: {
        porSucursal: sucursalResult.data,
        porMes: mesResult.data,
      },
      topUsuarios: usuariosResult.data,
      detalle: detalleResult.data.map(row => ({
        fecha: row.FECHA,
        usuario: row.USUARIO,
        nombre: row.NOMBRE_COMPLETO,
        centroCostos: row.CENTRO_COSTOS,
        sucursal: row.SUCURSAL.trim(),
      })),
      accessScope: kpiResult.accessScope,
    })

  } catch (error) {
    console.error('Error fetching consolidaciones:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}

