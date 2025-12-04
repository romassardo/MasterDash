import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Schema de validacion
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']).default('user'),
  sectorId: z.string().optional().nullable(),
  areaId: z.string().optional().nullable(),
})

// GET - Listar todos los usuarios
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sectorId: true,
        areaId: true,
        createdAt: true,
        updatedAt: true,
        sector: {
          select: { id: true, name: true },
        },
        area: {
          select: { id: true, name: true },
        },
        _count: {
          select: { dashboardAccess: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Verificar si el email ya existe
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      )
    }

    // Validar que si hay areaId, coincida con el sectorId
    if (data.areaId) {
      const area = await prisma.area.findUnique({
        where: { id: data.areaId },
      })
      
      if (!area) {
        return NextResponse.json({ error: 'Area no encontrada' }, { status: 404 })
      }
      
      if (data.sectorId && area.sectorId !== data.sectorId) {
        return NextResponse.json(
          { error: 'El area no pertenece al sector seleccionado' },
          { status: 400 }
        )
      }
      
      // Si no se envio sectorId, usar el del area
      data.sectorId = area.sectorId
    }

    // Hash de la password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        sectorId: data.sectorId || null,
        areaId: data.areaId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sectorId: true,
        areaId: true,
        sector: { select: { name: true } },
        area: { select: { name: true } },
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
