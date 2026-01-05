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
  orderBy?: string
  skipRLS?: boolean // Para admins que necesiten ver todo
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
  // Primero verificar si el usuario es admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === 'admin') {
    return { regions: ['*'], sucursales: ['*'] } // Admin ve todo
  }

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

  if (!access) {
    return null
  }

  // Si no hay scope definido pero tiene acceso, por defecto no ve nada por seguridad
  // a menos que se defina explícitamente.
  if (!access.accessScope) {
    return {} 
  }

  // accessScope se almacena como JSON string en la BD
  try {
    return typeof access.accessScope === 'string' 
      ? JSON.parse(access.accessScope) as AccessScope
      : access.accessScope as unknown as AccessScope
  } catch {
    return {}
  }
}

/**
 * Construye la cláusula WHERE basada en el accessScope y parámetros adicionales
 */
export function buildWhereClause(
  accessScope: AccessScope, 
  externalParams: Record<string, any> = {},
  existingConditions: string[] = []
): { where: string; params: any[] } {
  const conditions: string[] = [...existingConditions]
  const params: any[] = []
  let paramIndex = 0

  // Helper para añadir parámetros numerados para SQL Server ($1, $2... o @p0, @p1...)
  // Prisma $queryRawUnsafe usa ? o marcadores de posición dependiendo del conector, 
  // pero para SQL Server suele ser @p1, @p2... o simplemente pasar los argumentos.
  
  if (accessScope.regions && accessScope.regions.length > 0 && !accessScope.regions.includes('*')) {
    const regionPlaceholders = accessScope.regions.map(() => {
      params.push(accessScope.regions![paramIndex++])
      return `?`
    })
    conditions.push(`region IN (${regionPlaceholders.join(',')})`)
  }

  if (accessScope.sucursales && accessScope.sucursales.length > 0 && !accessScope.sucursales.includes('*')) {
    const sucursalPlaceholders = accessScope.sucursales.map(() => {
      params.push(accessScope.sucursales![paramIndex++])
      return `?`
    })
    conditions.push(`sucursal IN (${sucursalPlaceholders.join(',')})`)
  }

  if (accessScope.minAmount !== undefined) {
    conditions.push(`monto >= ?`)
    params.push(Number(accessScope.minAmount))
  }

  if (accessScope.maxAmount !== undefined) {
    conditions.push(`monto <= ?`)
    params.push(Number(accessScope.maxAmount))
  }

  // Añadir parámetros externos
  for (const [key, value] of Object.entries(externalParams)) {
    conditions.push(`${key} = ?`)
    params.push(value)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return { where: whereClause, params }
}

/**
 * Ejecuta una consulta segura al DataWarehouse
 */
export async function safeQuery<T>(
  options: SafeQueryOptions
): Promise<SafeQueryResult<T>> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { data: [], error: 'No autenticado' }
    }

    // Obtener accessScope del usuario
    const accessScope = await getUserAccessScope(session.user.id, options.dashboardSlug)

    if (!accessScope && !options.skipRLS) {
      return { data: [], error: 'Sin acceso a este dashboard' }
    }

    // Construir query con filtros de seguridad
    const { where, params } = buildWhereClause(accessScope || {}, options.params || [])
    
    let fullQuery = `${options.baseQuery} ${where}`
    if (options.orderBy) {
      fullQuery += ` ORDER BY ${options.orderBy}`
    }

    // Ejecutar query al DataWarehouse (Staging)
    const result = await prismaDW.$queryRawUnsafe<T[]>(fullQuery, ...params)

    return {
      data: result,
      accessScope: accessScope || undefined,
    }
  } catch (error) {
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
