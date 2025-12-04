import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validacion
const createPermissionSchema = z.object({
  userId: z.string(),
  dashboardId: z.string(),
  accessScope: z.object({
    sector: z.string().optional(),
    area: z.string().optional(),
  }).optional(),
})

// GET - Listar todos los permisos
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const permissions = await prisma.userDashboardAccess.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        dashboard: {
          select: {
            id: true,
            slug: true,
            title: true,
            area: {
              select: {
                id: true,
                name: true,
                sector: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Error al obtener permisos' }, { status: 500 })
  }
}

// POST - Crear nuevo permiso
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = createPermissionSchema.parse(body)

    // Verificar si el permiso ya existe
    const existing = await prisma.userDashboardAccess.findUnique({
      where: {
        userId_dashboardId: {
          userId: data.userId,
          dashboardId: data.dashboardId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'El usuario ya tiene acceso a este dashboard' },
        { status: 400 }
      )
    }

    const permission = await prisma.userDashboardAccess.create({
      data: {
        userId: data.userId,
        dashboardId: data.dashboardId,
        accessScope: data.accessScope ? JSON.stringify(data.accessScope) : null,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        dashboard: {
          select: {
            id: true,
            slug: true,
            title: true,
            area: {
              select: {
                id: true,
                name: true,
                sector: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating permission:', error)
    return NextResponse.json({ error: 'Error al crear permiso' }, { status: 500 })
  }
}
