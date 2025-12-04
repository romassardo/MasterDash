import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: ['error'], // Solo errores - quitar queries del log
  })

  // Middleware para logging de fechas (opcional - descomentar para debug)
  // client.$use(async (params, next) => {
  //   const result = await next(params)
  //   console.log(`[Prisma] ${params.model}.${params.action}`)
  //   return result
  // })

  return client
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// Re-exportar utilidades de fecha para fácil acceso
export * from './date-utils'

