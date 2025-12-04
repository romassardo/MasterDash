import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export interface UserDashboard {
  id: string
  slug: string
  title: string
  icon: string | null
  href: string
  sectorName: string | null
  areaName: string | null
}

/**
 * Verifica si el usuario tiene acceso a un dashboard específico
 * Se usa para validar acceso en las rutas de API de dashboards
 */
export async function hasAccessToDashboard(userId: string, dashboardSlug: string): Promise<boolean> {
  // Verificar si el usuario es admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === 'admin') {
    return true
  }

  // Verificar acceso explícito
  const access = await prisma.userDashboardAccess.findFirst({
    where: {
      userId,
      dashboard: {
        slug: dashboardSlug,
        isActive: true,
      },
    },
  })

  return !!access
}

/**
 * Verifica el acceso del usuario actual a un dashboard (desde la sesión)
 */
export async function currentUserHasAccess(dashboardSlug: string): Promise<boolean> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return false
  }

  return hasAccessToDashboard(session.user.id, dashboardSlug)
}
