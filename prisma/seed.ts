import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n')

  // ===========================================
  // CREAR SECTORES
  // ===========================================
  console.log('📁 Creando Sectores...')
  
  const sectorAdmin = await prisma.sector.upsert({
    where: { name: 'Administración' },
    update: {},
    create: {
      name: 'Administración',
      description: 'Sector de administración general',
    },
  })
  console.log(`   ✅ Sector: ${sectorAdmin.name}`)

  const sectorOperaciones = await prisma.sector.upsert({
    where: { name: 'Operaciones' },
    update: {},
    create: {
      name: 'Operaciones',
      description: 'Sector de operaciones y logística',
    },
  })
  console.log(`   ✅ Sector: ${sectorOperaciones.name}`)

  const sectorComercial = await prisma.sector.upsert({
    where: { name: 'Comercial' },
    update: {},
    create: {
      name: 'Comercial',
      description: 'Sector comercial y ventas',
    },
  })
  console.log(`   ✅ Sector: ${sectorComercial.name}`)

  // ===========================================
  // CREAR ÁREAS
  // ===========================================
  console.log('\n📂 Creando Áreas...')

  // Áreas de Administración
  const areaContabilidad = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorAdmin.id, name: 'Contabilidad' } },
    update: {},
    create: {
      name: 'Contabilidad',
      description: 'Área de contabilidad general',
      sectorId: sectorAdmin.id,
    },
  })
  console.log(`   ✅ Área: ${areaContabilidad.name} (${sectorAdmin.name})`)

  const areaBancos = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorAdmin.id, name: 'Bancos' } },
    update: {},
    create: {
      name: 'Bancos',
      description: 'Área de tesorería y bancos',
      sectorId: sectorAdmin.id,
    },
  })
  console.log(`   ✅ Área: ${areaBancos.name} (${sectorAdmin.name})`)

  const areaSueldos = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorAdmin.id, name: 'Sueldos' } },
    update: {},
    create: {
      name: 'Sueldos',
      description: 'Área de liquidación de sueldos',
      sectorId: sectorAdmin.id,
    },
  })
  console.log(`   ✅ Área: ${areaSueldos.name} (${sectorAdmin.name})`)

  const areaCompras = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorAdmin.id, name: 'Compras' } },
    update: {},
    create: {
      name: 'Compras',
      description: 'Área de compras y proveedores',
      sectorId: sectorAdmin.id,
    },
  })
  console.log(`   ✅ Área: ${areaCompras.name} (${sectorAdmin.name})`)

  // Áreas de Operaciones
  const areaLogistica = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorOperaciones.id, name: 'Logística' } },
    update: {},
    create: {
      name: 'Logística',
      description: 'Área de logística y distribución',
      sectorId: sectorOperaciones.id,
    },
  })
  console.log(`   ✅ Área: ${areaLogistica.name} (${sectorOperaciones.name})`)

  const areaStock = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorOperaciones.id, name: 'Stock' } },
    update: {},
    create: {
      name: 'Stock',
      description: 'Área de gestión de inventario',
      sectorId: sectorOperaciones.id,
    },
  })
  console.log(`   ✅ Área: ${areaStock.name} (${sectorOperaciones.name})`)

  // Áreas de Comercial
  const areaVentas = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorComercial.id, name: 'Ventas' } },
    update: {},
    create: {
      name: 'Ventas',
      description: 'Área de ventas generales',
      sectorId: sectorComercial.id,
    },
  })
  console.log(`   ✅ Área: ${areaVentas.name} (${sectorComercial.name})`)

  const areaMarketing = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorComercial.id, name: 'Marketing' } },
    update: {},
    create: {
      name: 'Marketing',
      description: 'Área de marketing y publicidad',
      sectorId: sectorComercial.id,
    },
  })
  console.log(`   ✅ Área: ${areaMarketing.name} (${sectorComercial.name})`)

  const areaCRM = await prisma.area.upsert({
    where: { sectorId_name: { sectorId: sectorComercial.id, name: 'CRM' } },
    update: {},
    create: {
      name: 'CRM',
      description: 'Área de gestión de relaciones con clientes',
      sectorId: sectorComercial.id,
    },
  })
  console.log(`   ✅ Área: ${areaCRM.name} (${sectorComercial.name})`)

  // ===========================================
  // CREAR DASHBOARDS POR ÁREA
  // ===========================================
  console.log('\n📊 Creando Dashboards...')

  // Dashboard de Ventas (área Ventas)
  const dashVentas = await prisma.dashboard.upsert({
    where: { slug: 'ventas' },
    update: { areaId: areaVentas.id },
    create: {
      slug: 'ventas',
      title: 'Dashboard de Ventas',
      description: 'Análisis de ventas generales',
      icon: 'DollarSign',
      areaId: areaVentas.id,
    },
  })
  console.log(`   ✅ Dashboard: ${dashVentas.title} → ${areaVentas.name}`)

  // Dashboard de Contabilidad
  const dashContabilidad = await prisma.dashboard.upsert({
    where: { slug: 'contabilidad' },
    update: { areaId: areaContabilidad.id },
    create: {
      slug: 'contabilidad',
      title: 'Dashboard de Contabilidad',
      description: 'Estados financieros y balances',
      icon: 'FileText',
      areaId: areaContabilidad.id,
    },
  })
  console.log(`   ✅ Dashboard: ${dashContabilidad.title} → ${areaContabilidad.name}`)

  // Dashboard de Stock
  const dashStock = await prisma.dashboard.upsert({
    where: { slug: 'stock' },
    update: { areaId: areaStock.id },
    create: {
      slug: 'stock',
      title: 'Dashboard de Inventario',
      description: 'Control de stock y movimientos',
      icon: 'Package',
      areaId: areaStock.id,
    },
  })
  console.log(`   ✅ Dashboard: ${dashStock.title} → ${areaStock.name}`)

  // Dashboard de Bancos
  const dashBancos = await prisma.dashboard.upsert({
    where: { slug: 'bancos' },
    update: { areaId: areaBancos.id },
    create: {
      slug: 'bancos',
      title: 'Dashboard de Tesorería',
      description: 'Flujo de caja y bancos',
      icon: 'TrendingUp',
      areaId: areaBancos.id,
    },
  })
  console.log(`   ✅ Dashboard: ${dashBancos.title} → ${areaBancos.name}`)

  // Dashboard de Consolidaciones de Caja
  const dashConsolidaciones = await prisma.dashboard.upsert({
    where: { slug: 'consolidaciones' },
    update: { areaId: areaBancos.id },
    create: {
      slug: 'consolidaciones',
      title: 'Consolidaciones de Caja',
      description: 'Reporte de consolidaciones por sucursal y usuario',
      icon: 'FileText',
      areaId: areaBancos.id,
    },
  })
  console.log(`   ✅ Dashboard: ${dashConsolidaciones.title} → ${areaBancos.name}`)

  // Dashboard de Uso CRM
  const dashUsoCRM = await prisma.dashboard.upsert({
    where: { slug: 'uso-crm' },
    update: { areaId: areaCRM.id },
    create: {
      slug: 'uso-crm',
      title: 'Analítica de Uso CRM',
      description: 'Rendimiento de operadores y conversaciones',
      icon: 'Users',
      areaId: areaCRM.id,
    },
  })
  console.log(`   ✅ Dashboard: ${dashUsoCRM.title} → ${areaCRM.name}`)

  // ===========================================
  // CREAR USUARIOS
  // ===========================================
  console.log('\n👤 Creando Usuarios...')

  // Usuario administrador (sin sector/área - ve todo)
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@masterdash.com' },
    update: {},
    create: {
      email: 'admin@masterdash.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'admin',
      // Admin no tiene sector/área - ve todos los dashboards
    },
  })
  console.log(`   ✅ Admin: ${admin.email} (ve todos los dashboards)`)

  // Usuario de Contabilidad
  const userPassword = await bcrypt.hash('user123', 12)
  const userContabilidad = await prisma.user.upsert({
    where: { email: 'contabilidad@masterdash.com' },
    update: { sectorId: sectorAdmin.id, areaId: areaContabilidad.id },
    create: {
      email: 'contabilidad@masterdash.com',
      name: 'Usuario Contabilidad',
      password: userPassword,
      role: 'user',
      sectorId: sectorAdmin.id,
      areaId: areaContabilidad.id,
    },
  })
  console.log(`   ✅ Usuario: ${userContabilidad.email} → ${areaContabilidad.name}`)

  // Usuario de Ventas
  const userVentas = await prisma.user.upsert({
    where: { email: 'ventas@masterdash.com' },
    update: { sectorId: sectorComercial.id, areaId: areaVentas.id },
    create: {
      email: 'ventas@masterdash.com',
      name: 'Usuario Ventas',
      password: userPassword,
      role: 'user',
      sectorId: sectorComercial.id,
      areaId: areaVentas.id,
    },
  })
  console.log(`   ✅ Usuario: ${userVentas.email} → ${areaVentas.name}`)

  // ===========================================
  // RESUMEN
  // ===========================================
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Seed completado!')
  console.log('='.repeat(50))
  console.log('\n📋 Credenciales de acceso:\n')
  console.log('   🔐 Admin (ve todos los dashboards):')
  console.log(`      Email: ${admin.email}`)
  console.log('      Pass:  admin123\n')
  console.log('   👤 Usuario Contabilidad (ve dashboards de Contabilidad):')
  console.log(`      Email: ${userContabilidad.email}`)
  console.log('      Pass:  user123\n')
  console.log('   👤 Usuario Ventas (ve dashboards de Ventas):')
  console.log(`      Email: ${userVentas.email}`)
  console.log('      Pass:  user123\n')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
