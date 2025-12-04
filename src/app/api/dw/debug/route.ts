import { NextRequest, NextResponse } from 'next/server'
import prismaDW from '@/lib/prisma-dw'

/**
 * GET /api/dw/debug?table=nombre
 * Debug endpoint para ver datos crudos
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  try {
    const tableName = request.nextUrl.searchParams.get('table')
    
    if (tableName === 'ETL_Analitica_Uso_CRM') {
      // Ver fechas únicas disponibles
      const fechas = await prismaDW.$queryRaw<{ fecha: Date }[]>`
        SELECT DISTINCT fecha 
        FROM [crm].[ETL_Analitica_Uso_CRM]
        ORDER BY fecha DESC
      `
      
      // Contar registros por fecha
      const conteo = await prismaDW.$queryRaw<{ fecha: Date; total: number }[]>`
        SELECT fecha, COUNT(*) as total
        FROM [crm].[ETL_Analitica_Uso_CRM]
        GROUP BY fecha
        ORDER BY fecha DESC
      `

      // Total de registros
      const totalResult = await prismaDW.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) as total FROM [crm].[ETL_Analitica_Uso_CRM]
      `

      return NextResponse.json({
        success: true,
        table: '[crm].[ETL_Analitica_Uso_CRM]',
        totalRegistros: Number(totalResult[0]?.total || 0),
        fechasUnicas: fechas.map(f => ({
          fecha: f.fecha,
          fechaFormateada: new Date(f.fecha).toISOString().split('T')[0],
        })),
        conteoPorFecha: conteo.map(c => ({
          fecha: new Date(c.fecha).toISOString().split('T')[0],
          registros: Number(c.total),
        })),
      })
    }

    return NextResponse.json({ error: 'Especifica ?table=ETL_Analitica_Uso_CRM' })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}


