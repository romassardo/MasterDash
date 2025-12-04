import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// GET - Obtener todos los sectores con sus áreas
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const sectors = await prisma.sector.findMany({
      include: {
        areas: {
          include: {
            _count: {
              select: { dashboards: true, users: true }
            }
          },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(sectors)
  } catch (error) {
    console.error('Error fetching sectors:', error)
    return NextResponse.json({ error: 'Error al obtener sectores' }, { status: 500 })
  }
}

// POST - Crear un nuevo sector
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    // Verificar si ya existe
    const existing = await prisma.sector.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un sector con ese nombre' }, { status: 400 })
    }

    const sector = await prisma.sector.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        areas: true,
        _count: { select: { users: true } }
      }
    })

    return NextResponse.json(sector)
  } catch (error) {
    console.error('Error creating sector:', error)
    return NextResponse.json({ error: 'Error al crear sector' }, { status: 500 })
  }
}
