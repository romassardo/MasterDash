import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { rawQuery } from '@/lib/safe-query'

/**
 * GET /api/dw/explore?table=nombre_tabla
 * Explora la estructura de una tabla del DataWarehouse
 * Solo accesible para administradores
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const tableName = request.nextUrl.searchParams.get('table')
    
    if (!tableName) {
      return NextResponse.json({ error: 'Parámetro "table" requerido' }, { status: 400 })
    }

    // Validar nombre de tabla (prevenir SQL injection)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return NextResponse.json({ error: 'Nombre de tabla inválido' }, { status: 400 })
    }

    // Obtener estructura de columnas
    const columns = await rawQuery<{
      COLUMN_NAME: string
      DATA_TYPE: string
      IS_NULLABLE: string
      CHARACTER_MAXIMUM_LENGTH: number | null
    }>(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `)

    // Obtener cantidad de registros
    const countResult = await rawQuery<{ total: number }>(`
      SELECT COUNT(*) as total FROM [${tableName}]
    `)

    // Obtener muestra de datos (primeros 5 registros)
    const sampleData = await rawQuery<Record<string, unknown>>(`
      SELECT TOP 5 * FROM [${tableName}]
    `)

    return NextResponse.json({
      success: true,
      table: tableName,
      totalRows: countResult[0]?.total || 0,
      columns: columns.map(c => ({
        name: c.COLUMN_NAME,
        type: c.DATA_TYPE,
        nullable: c.IS_NULLABLE === 'YES',
        maxLength: c.CHARACTER_MAXIMUM_LENGTH,
      })),
      sampleData,
    })

  } catch (error) {
    console.error('Error exploring table:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}

