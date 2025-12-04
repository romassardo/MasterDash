import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validacion
const createDashboardSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Solo letras minusculas, numeros y guiones'),
  title: z.string().min(2).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  areaId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

// GET - Listar todos los dashboards
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const dashboards = await prisma.dashboard.findMany({
      include: {
        area: {
          include: {
            sector: true,
          },
        },
        _count: {
          select: { userAccess: true },
        },
      },
      orderBy: [
        { area: { sector: { name: 'asc' } } },
        { area: { name: 'asc' } },
        { title: 'asc' },
      ],
    })

    return NextResponse.json(dashboards)
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json({ error: 'Error al obtener dashboards' }, { status: 500 })
  }
}

// POST - Crear nuevo dashboard
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = createDashboardSchema.parse(body)

    // Verificar si el slug ya existe
    const existing = await prisma.dashboard.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un dashboard con ese slug' },
        { status: 400 }
      )
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

    const dashboard = await prisma.dashboard.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        icon: data.icon || 'BarChart3',
        areaId: data.areaId || null,
        isActive: data.isActive,
      },
      include: {
        area: {
          include: { sector: true },
        },
      },
    })

    return NextResponse.json(dashboard, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating dashboard:', error)
    return NextResponse.json({ error: 'Error al crear dashboard' }, { status: 500 })
  }
}
