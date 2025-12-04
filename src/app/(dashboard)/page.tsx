import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { UserHome } from '@/components/home/UserHome'

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'admin'

  if (isAdmin) {
    // Dashboard de administración
    const [dashboards, users, recentAccesses] = await Promise.all([
      prisma.dashboard.findMany({
        include: {
          area: {
            include: { sector: true },
          },
          _count: {
            select: { userAccess: true },
          },
        },
        orderBy: { title: 'asc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: { dashboardAccess: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.userDashboardAccess.findMany({
        include: {
          user: { select: { name: true, email: true } },
          dashboard: { select: { title: true, slug: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ])

    // Verificar conexión a DB
    let dbStatus = { connected: false, latency: 0 }
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbStatus = { connected: true, latency: Date.now() - start }
    } catch {
      dbStatus = { connected: false, latency: 0 }
    }

    return (
      <AdminDashboard
        dashboards={dashboards.map((d) => ({
          ...d,
          sectorName: d.area?.sector?.name || null,
          areaName: d.area?.name || null,
        }))}
        users={users}
        recentAccesses={recentAccesses}
        dbStatus={dbStatus}
        userName={session.user.name || 'Admin'}
      />
    )
  }

  // Usuario normal - mostrar sus dashboards
  const userAccess = await prisma.userDashboardAccess.findMany({
    where: { userId: session.user.id },
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

  const dashboards = userAccess
    .filter((ua) => ua.dashboard.isActive)
    .map((ua) => ({
      id: ua.dashboard.id,
      slug: ua.dashboard.slug,
      title: ua.dashboard.title,
      icon: ua.dashboard.icon,
      sectorName: ua.dashboard.area?.sector?.name || null,
      areaName: ua.dashboard.area?.name || null,
    }))

  // Si tiene solo 1 dashboard, redirigir directamente
  if (dashboards.length === 1) {
    redirect(`/dashboards/${dashboards[0].slug}`)
  }

  return (
    <UserHome
      dashboards={dashboards}
      userName={session.user.name || 'Usuario'}
    />
  )
}
