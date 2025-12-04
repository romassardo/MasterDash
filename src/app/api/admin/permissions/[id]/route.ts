import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validacion para actualizacion
const updatePermissionSchema = z.object({
  accessScope: z.object({
    sector: z.string().optional(),
    area: z.string().optional(),
  }).optional().nullable(),
})

// GET - Obtener un permiso por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const permission = await prisma.userDashboardAccess.findUnique({
      where: { id },
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

    if (!permission) {
      return NextResponse.json({ error: 'Permiso no encontrado' }, { status: 404 })
    }

    return NextResponse.json(permission)
  } catch (error) {
    console.error('Error fetching permission:', error)
    return NextResponse.json({ error: 'Error al obtener permiso' }, { status: 500 })
  }
}

// PUT - Actualizar permiso (accessScope)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = updatePermissionSchema.parse(body)

    const permission = await prisma.userDashboardAccess.update({
      where: { id },
      data: {
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

    return NextResponse.json(permission)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating permission:', error)
    return NextResponse.json({ error: 'Error al actualizar permiso' }, { status: 500 })
  }
}

// DELETE - Eliminar permiso
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.userDashboardAccess.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting permission:', error)
    return NextResponse.json({ error: 'Error al eliminar permiso' }, { status: 500 })
  }
}
