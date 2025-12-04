import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import prismaDW from '@/lib/prisma-dw'
import { AccessScope } from '@/types'

/**
 * SafeQuery - Ejecuta consultas al DataWarehouse con filtrado por accessScope
 * 
 * Esta utilidad:
 * 1. Obtiene el accessScope del usuario desde la base de datos de la App
 * 2. Construye filtros WHERE dinámicos basados en el scope
 * 3. Ejecuta la consulta de forma segura contra el DataWarehouse (Staging)
 * 
 * ARQUITECTURA:
 * - prisma: Base de datos de la App (Auth, Users, Dashboards)
 * - prismaDW: DataWarehouse/Staging (Datos de negocio - SOLO LECTURA)
 */

interface SafeQueryOptions {
  dashboardSlug: string
  baseQuery: string
  params?: Record<string, unknown>
}

interface SafeQueryResult<T> {
  data: T[]
  error?: string
  accessScope?: AccessScope
}

/**
 * Obtiene el accessScope de un usuario para un dashboard específico
 */
export async function getUserAccessScope(
  userId: string,
  dashboardSlug: string
): Promise<AccessScope | null> {
  const access = await prisma.userDashboardAccess.findFirst({
    where: {
      userId,
      dashboard: {
        slug: dashboardSlug,
      },
    },
    include: {
      dashboard: true,
    },
  })

  if (!access?.accessScope) {
    return null
  }

  // accessScope se almacena como JSON string en la BD
  try {
    return JSON.parse(access.accessScope) as AccessScope
  } catch {
    return null
  }
}

/**
 * Construye la cláusula WHERE basada en el accessScope
 * NOTA: En producción, usar consultas parametrizadas para prevenir SQL injection
 */
export function buildWhereClause(accessScope: AccessScope): string {
  const conditions: string[] = []

  if (accessScope.regions && accessScope.regions.length > 0 && !accessScope.regions.includes('*')) {
    const regions = accessScope.regions.map(r => `'${r.replace(/'/g, "''")}'`).join(',')
    conditions.push(`region IN (${regions})`)
  }

  if (accessScope.sucursales && accessScope.sucursales.length > 0 && !accessScope.sucursales.includes('*')) {
    const sucursales = accessScope.sucursales.map(s => `'${s.replace(/'/g, "''")}'`).join(',')
    conditions.push(`sucursal IN (${sucursales})`)
  }

  if (accessScope.minAmount !== undefined) {
    conditions.push(`monto >= ${Number(accessScope.minAmount)}`)
  }

  if (accessScope.maxAmount !== undefined) {
    conditions.push(`monto <= ${Number(accessScope.maxAmount)}`)
  }

  if (accessScope.dateFrom) {
    conditions.push(`fecha >= '${accessScope.dateFrom}'`)
  }

  if (accessScope.dateTo) {
    conditions.push(`fecha <= '${accessScope.dateTo}'`)
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
}

/**
 * Ejecuta una consulta segura al DataWarehouse
 * 
 * @example
 * const result = await safeQuery<VentasData>({
 *   dashboardSlug: 'ventas',
 *   baseQuery: 'SELECT * FROM vw_ventas_resumen',
 * })
 */
export async function safeQuery<T>(
  options: SafeQueryOptions
): Promise<SafeQueryResult<T>> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { data: [], error: 'Usuario no autenticado' }
    }

    // Obtener accessScope del usuario
    const accessScope = await getUserAccessScope(session.user.id, options.dashboardSlug)

    if (!accessScope) {
      return { data: [], error: 'Sin acceso a este dashboard' }
    }

    // Construir query con filtros de seguridad
    const whereClause = buildWhereClause(accessScope)
    const fullQuery = `${options.baseQuery} ${whereClause}`

    // Ejecutar query al DataWarehouse (Staging)
    const result = await prismaDW.$queryRawUnsafe<T[]>(fullQuery)

    return {
      data: result,
      accessScope,
    }
  } catch (error) {
    // Log error solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('SafeQuery error:', error)
    }
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Error en la consulta',
    }
  }
}

/**
 * Ejecuta una consulta raw al DataWarehouse (sin filtrado de accessScope)
 * Usar solo para datos públicos o cuando el filtrado se hace manualmente
 */
export async function rawQuery<T>(query: string): Promise<T[]> {
  return prismaDW.$queryRawUnsafe<T[]>(query)
}

/**
 * Verifica la conexión al DataWarehouse
 * Útil para health checks y debugging
 */
export async function testDWConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await prismaDW.$queryRaw`SELECT 1 as test`
    return { success: true, message: 'Conexión al DataWarehouse exitosa' }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error de conexión al DataWarehouse' 
    }
  }
}
