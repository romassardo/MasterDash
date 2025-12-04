import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// PUT - Actualizar un sector
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, isActive } = body

    // Verificar que existe
    const existing = await prisma.sector.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 })
    }

    // Si cambia el nombre, verificar que no exista otro
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.sector.findUnique({
        where: { name: name.trim() }
      })
      if (duplicate) {
        return NextResponse.json({ error: 'Ya existe un sector con ese nombre' }, { status: 400 })
      }
    }

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        areas: {
          include: {
            _count: { select: { dashboards: true, users: true } }
          }
        },
        _count: { select: { users: true } }
      }
    })

    return NextResponse.json(sector)
  } catch (error) {
    console.error('Error updating sector:', error)
    return NextResponse.json({ error: 'Error al actualizar sector' }, { status: 500 })
  }
}

// DELETE - Eliminar un sector
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que existe
    const existing = await prisma.sector.findUnique({
      where: { id },
      include: {
        areas: true,
        _count: { select: { users: true } }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 })
    }

    // Verificar que no tenga áreas
    if (existing.areas.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un sector que tiene áreas. Elimina primero las áreas.' 
      }, { status: 400 })
    }

    // Verificar que no tenga usuarios
    if (existing._count.users > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un sector que tiene usuarios asignados.' 
      }, { status: 400 })
    }

    await prisma.sector.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sector:', error)
    return NextResponse.json({ error: 'Error al eliminar sector' }, { status: 500 })
  }
}

