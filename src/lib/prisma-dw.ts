/**
 * Cliente Prisma para DataWarehouse (Staging)
 * 
 * Este cliente se conecta al servidor de datos de staging
 * para consultas de solo lectura en los dashboards.
 * 
 * IMPORTANTE: Solo usar para consultas SELECT, nunca para INSERT/UPDATE/DELETE
 * 
 * SETUP:
 * 1. Agregar DW_DATABASE_URL en .env
 * 2. Ejecutar: npx prisma generate --schema=prisma/schema-dw.prisma
 */

import { PrismaClient } from '@prisma/client'

// Crear un cliente separado para el DataWarehouse
// usando la URL de conexión del DW directamente
const createPrismaDW = () => {
  const dwUrl = process.env.DW_DATABASE_URL
  
  if (!dwUrl) {
    console.warn('⚠️ DW_DATABASE_URL no configurada - usando conexión principal')
    return new PrismaClient()
  }

  // Prisma Client con datasource override para el DW
  return new PrismaClient({
    datasourceUrl: dwUrl,
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error'],
  })
}

const globalForPrismaDW = globalThis as unknown as {
  prismaDW: PrismaClient | undefined
}

export const prismaDW = globalForPrismaDW.prismaDW ?? createPrismaDW()

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaDW.prismaDW = prismaDW
}

export default prismaDW

