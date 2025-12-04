import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validacion para actualizacion
const updateDashboardSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(2).max(100).optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional(),
  areaId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

// GET - Obtener un dashboard por ID
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

    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
      include: {
        area: {
          include: { sector: true },
        },
        userAccess: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard no encontrado' }, { status: 404 })
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 })
  }
}

// PUT - Actualizar dashboard
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
    const data = updateDashboardSchema.parse(body)

    // Si se actualiza el slug, verificar que no exista
    if (data.slug) {
      const existing = await prisma.dashboard.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un dashboard con ese slug' },
          { status: 400 }
        )
      }
    }

    // Verificar que el area existe si se proporciona
    if (data.areaId) {
      const area = await prisma.area.findUnique({
        where: { id: data.areaId },
      })
      if (!area) {
        return NextResponse.json({ error: 'Area no encontrada' }, { status: 404 })
      }
    }

    const dashboard = await prisma.dashboard.update({
      where: { id },
      data,
      include: {
        area: {
          include: { sector: true },
        },
      },
    })

    return NextResponse.json(dashboard)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating dashboard:', error)
    return NextResponse.json({ error: 'Error al actualizar dashboard' }, { status: 500 })
  }
}

// DELETE - Eliminar dashboard
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

    // Eliminar accesos relacionados
    await prisma.userDashboardAccess.deleteMany({
      where: { dashboardId: id },
    })

    // Eliminar dashboard
    await prisma.dashboard.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json({ error: 'Error al eliminar dashboard' }, { status: 500 })
  }
}
