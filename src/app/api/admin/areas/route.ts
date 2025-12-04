import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// GET - Obtener todas las áreas
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const areas = await prisma.area.findMany({
      include: {
        sector: true,
        _count: {
          select: { dashboards: true, users: true }
        }
      },
      orderBy: [
        { sector: { name: 'asc' } },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(areas)
  } catch (error) {
    console.error('Error fetching areas:', error)
    return NextResponse.json({ error: 'Error al obtener áreas' }, { status: 500 })
  }
}

// POST - Crear una nueva área
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, sectorId } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    if (!sectorId) {
      return NextResponse.json({ error: 'Debe seleccionar un sector' }, { status: 400 })
    }

    // Verificar que el sector existe
    const sector = await prisma.sector.findUnique({ where: { id: sectorId } })
    if (!sector) {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 })
    }

    // Verificar si ya existe un área con ese nombre en el sector
    const existing = await prisma.area.findFirst({
      where: { 
        sectorId,
        name: name.trim()
      }
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'Ya existe un área con ese nombre en este sector' 
      }, { status: 400 })
    }

    const area = await prisma.area.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        sectorId
      },
      include: {
        sector: true,
        _count: { select: { dashboards: true, users: true } }
      }
    })

    return NextResponse.json(area)
  } catch (error) {
    console.error('Error creating area:', error)
    return NextResponse.json({ error: 'Error al crear área' }, { status: 500 })
  }
}
