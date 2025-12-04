import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// Mapeo de dashboards a sus consultas SQL
const DASHBOARD_QUERIES: Record<string, string> = {
  ventas: `
    SELECT 
      fecha,
      sucursal,
      region,
      SUM(monto) as total_ventas,
      COUNT(*) as cantidad
    FROM vw_ventas
    GROUP BY fecha, sucursal, region
    ORDER BY fecha DESC
  `,
  // Agrega más dashboards aquí
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el dashboard existe y el usuario tiene acceso
    const access = await prisma.userDashboardAccess.findFirst({
      where: {
        userId: session.user.id,
        dashboard: {
          slug,
        },
      },
      include: {
        dashboard: true,
      },
    })

    if (!access) {
      return NextResponse.json(
        { error: 'Sin acceso a este dashboard' },
        { status: 403 }
      )
    }

    // Obtener la query base para este dashboard
    const baseQuery = DASHBOARD_QUERIES[slug]
    
    if (!baseQuery) {
      return NextResponse.json(
        { error: 'Dashboard no configurado' },
        { status: 404 }
      )
    }

    // Ejecutar consulta segura con filtrado por accessScope
    const result = await safeQuery({
      dashboardSlug: slug,
      baseQuery,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: result.data,
      accessScope: result.accessScope,
      dashboard: access.dashboard,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
