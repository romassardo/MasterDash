import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { testDWConnection, rawQuery } from '@/lib/safe-query'

/**
 * GET /api/dw/test
 * Prueba la conexión al DataWarehouse y muestra las tablas disponibles
 * Solo accesible para administradores
 */
export async function GET() {
  try {
    // Verificar autenticación y rol admin
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Probar conexión
    const connectionTest = await testDWConnection()

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: connectionTest.message,
      }, { status: 500 })
    }

    // Obtener lista de tablas del Staging
    const tables = await rawQuery<{ TABLE_NAME: string; TABLE_TYPE: string }>(`
      SELECT TABLE_NAME, TABLE_TYPE 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
      ORDER BY TABLE_TYPE, TABLE_NAME
    `)

    // Separar tablas y vistas
    const basesTables = tables.filter(t => t.TABLE_TYPE === 'BASE TABLE')
    const views = tables.filter(t => t.TABLE_TYPE === 'VIEW')

    return NextResponse.json({
      success: true,
      message: 'Conexión al DataWarehouse exitosa',
      database: 'Staging',
      server: '10.50.80.10',
      stats: {
        totalTables: basesTables.length,
        totalViews: views.length,
      },
      tables: basesTables.map(t => t.TABLE_NAME),
      views: views.map(t => t.TABLE_NAME),
    })

  } catch (error) {
    console.error('Error testing DW connection:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}

