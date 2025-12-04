import { NextRequest, NextResponse } from 'next/server'
import prismaDW from '@/lib/prisma-dw'

/**
 * GET /api/dw/schema?table=nombre_tabla
 * GET /api/dw/schema (sin params = lista todas las tablas con schema)
 * Explora la estructura de una tabla del DataWarehouse
 */
export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  try {
    const tableName = request.nextUrl.searchParams.get('table')
    
    // Si no hay tabla, listar todas con su schema
    if (!tableName) {
      const tables = await prismaDW.$queryRaw<{
        TABLE_SCHEMA: string
        TABLE_NAME: string
        TABLE_TYPE: string
      }>`
        SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE 
        FROM INFORMATION_SCHEMA.TABLES 
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `
      
      return NextResponse.json({
        success: true,
        message: 'Lista de tablas con schema',
        tables: tables.map(t => ({
          schema: t.TABLE_SCHEMA,
          name: t.TABLE_NAME,
          fullName: `[${t.TABLE_SCHEMA}].[${t.TABLE_NAME}]`,
          type: t.TABLE_TYPE,
        })),
      })
    }

    // Validar nombre de tabla (prevenir SQL injection)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return NextResponse.json({ error: 'Nombre de tabla inválido' }, { status: 400 })
    }

    // Buscar la tabla en cualquier schema
    const tableInfo = await prismaDW.$queryRawUnsafe<{
      TABLE_SCHEMA: string
      TABLE_NAME: string
    }>(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = '${tableName}'
    `)

    if (tableInfo.length === 0) {
      return NextResponse.json({ 
        error: `Tabla '${tableName}' no encontrada`,
        suggestion: 'Usá /api/dw/schema sin parámetros para ver todas las tablas'
      }, { status: 404 })
    }

    const schema = tableInfo[0].TABLE_SCHEMA
    const fullTableName = `[${schema}].[${tableName}]`

    // Obtener estructura de columnas
    const columns = await prismaDW.$queryRawUnsafe<{
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
      WHERE TABLE_NAME = '${tableName}' AND TABLE_SCHEMA = '${schema}'
      ORDER BY ORDINAL_POSITION
    `)

    // Obtener cantidad de registros
    const countResult = await prismaDW.$queryRawUnsafe<{ total: bigint }>(`
      SELECT COUNT(*) as total FROM ${fullTableName}
    `)

    // Obtener muestra de datos (primeros 5 registros)
    const sampleData = await prismaDW.$queryRawUnsafe<Record<string, unknown>>(`
      SELECT TOP 5 * FROM ${fullTableName}
    `)

    return NextResponse.json({
      success: true,
      table: tableName,
      schema,
      fullName: fullTableName,
      totalRows: Number(countResult[0]?.total || 0),
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

