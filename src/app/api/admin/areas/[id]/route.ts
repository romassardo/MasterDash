import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// PUT - Actualizar un área
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
    const { name, description, sectorId, isActive } = body

    // Verificar que existe
    const existing = await prisma.area.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
    }

    // Si cambia el nombre o sector, verificar duplicados
    const targetSectorId = sectorId || existing.sectorId
    const targetName = name?.trim() || existing.name

    if (targetName !== existing.name || targetSectorId !== existing.sectorId) {
      const duplicate = await prisma.area.findFirst({
        where: { 
          sectorId: targetSectorId,
          name: targetName,
          id: { not: id }
        }
      })
      if (duplicate) {
        return NextResponse.json({ 
          error: 'Ya existe un área con ese nombre en este sector' 
        }, { status: 400 })
      }
    }

    // Verificar que el nuevo sector existe (si se cambió)
    if (sectorId && sectorId !== existing.sectorId) {
      const sector = await prisma.sector.findUnique({ where: { id: sectorId } })
      if (!sector) {
        return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 })
      }
    }

    const area = await prisma.area.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(sectorId && { sectorId }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        sector: true,
        _count: { select: { dashboards: true, users: true } }
      }
    })

    return NextResponse.json(area)
  } catch (error) {
    console.error('Error updating area:', error)
    return NextResponse.json({ error: 'Error al actualizar área' }, { status: 500 })
  }
}

// DELETE - Eliminar un área
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
    const existing = await prisma.area.findUnique({
      where: { id },
      include: {
        _count: { select: { dashboards: true, users: true } }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
    }

    // Verificar que no tenga dashboards
    if (existing._count.dashboards > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un área que tiene dashboards. Reasigna o elimina los dashboards primero.' 
      }, { status: 400 })
    }

    // Verificar que no tenga usuarios
    if (existing._count.users > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un área que tiene usuarios asignados.' 
      }, { status: 400 })
    }

    await prisma.area.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting area:', error)
    return NextResponse.json({ error: 'Error al eliminar área' }, { status: 500 })
  }
}

