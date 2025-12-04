import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Header } from '@/components/layout/Header'
import prisma from '@/lib/prisma'

/**
 * Obtiene los dashboards según el rol del usuario
 * 
 * MODELO DE PERMISOS:
 * - Admin: Ve TODOS los dashboards activos
 * - Usuario: SOLO ve dashboards asignados explícitamente en UserDashboardAccess
 *   (el área del usuario es solo organizacional, NO da acceso automático)
 */
async function getDashboardsForUser(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    // Admin ve todos los dashboards activos
    return prisma.dashboard.findMany({
      where: { isActive: true },
      include: {
        area: {
          include: { sector: true },
        },
      },
      orderBy: [
        { area: { sector: { name: 'asc' } } },
        { area: { name: 'asc' } },
        { title: 'asc' },
      ],
    })
  }

  // Usuario normal: SOLO dashboards asignados explícitamente
  const userAccess = await prisma.userDashboardAccess.findMany({
      where: { userId },
      include: {
        dashboard: {
          include: {
            area: {
              include: { sector: true },
            },
          },
        },
      },
    orderBy: [
      { dashboard: { area: { sector: { name: 'asc' } } } },
      { dashboard: { area: { name: 'asc' } } },
      { dashboard: { title: 'asc' } },
    ],
  })

  // Filtrar solo dashboards activos
  return userAccess
    .filter((access) => access.dashboard.isActive)
    .map((access) => access.dashboard)
    }

async function getUserWithOrg(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { sector: true, area: true },
  })
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'admin'
  
  // Obtener información del usuario (para mostrar en header/perfil)
  await getUserWithOrg(session.user.id)

  // Obtener dashboards según permisos explícitos
  const dashboards = await getDashboardsForUser(session.user.id, isAdmin)

  const sidebarDashboards = dashboards.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    icon: d.icon,
    sectorName: d.area?.sector?.name || null,
    areaName: d.area?.name || null,
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Fondo con gradiente y orbes */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse delay-500" />
      </div>

      <Header user={session.user} />
      <DashboardShell dashboards={sidebarDashboards} isAdmin={isAdmin}>
          {children}
      </DashboardShell>
    </div>
  )
}
