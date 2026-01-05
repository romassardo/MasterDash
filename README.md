# MasterDash v2.4

Plataforma centralizada de dashboards empresariales con Next.js 15, Auth.js, Prisma y ECharts.

## 📚 Documentación Detallada

Para información específica sobre el diseño, despliegue y optimización, consulta los archivos en la carpeta `docs/`:

- **[Plan de Desarrollo (PLAN.md)](docs/PLAN.md)**: Hoja de ruta y estado actual del proyecto.
- **[Diseño Técnico (TECHNICAL_DESIGN.md)](docs/TECHNICAL_DESIGN.md)**: Arquitectura detallada, modelos de datos y flujos.
- **[Guía de Despliegue (DEPLOYMENT.md)](docs/DEPLOYMENT.md)**: Instrucciones para entornos de producción con Docker/Linux.
- **[Optimización SQL (OPTIMIZACION_SQL.md)](docs/OPTIMIZACION_SQL.md)**: Estrategias de indexación y rendimiento para Big Data.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Autenticación**: Auth.js v5 (NextAuth) con Credentials Provider
- **Base de Datos**: SQL Server Express (App + DataWarehouse)
- **ORM**: Prisma
- **UI**: shadcn/ui + Tremor + Tailwind CSS 4
- **Gráficos**: Apache ECharts
- **Estado**: TanStack Query v5

## 📋 Requisitos Previos

- Node.js 18+
- SQL Server Express (o SQL Server)
- npm o pnpm

## 🚀 Inicio Rápido

### 1. Clonar e instalar dependencias

```bash
cd masterdash
npm install
```

### 2. Configurar Variables de Entorno

Crea el archivo `.env` en la raíz del proyecto:

```env
# BASE DE DATOS (SQL Server)
DATABASE_URL="sqlserver://localhost:1433;database=MasterDash;user=sa;password=TU_PASSWORD;trustServerCertificate=true"

# AUTH.JS
AUTH_SECRET="genera-una-clave-secreta-de-32-caracteres"
```

> 💡 Genera AUTH_SECRET con: `npx auth secret`

### 3. Crear la Base de Datos

```bash
# Sincronizar schema con la BD
npm run db:push

# Crear usuarios de prueba
npm run db:seed
```

### 4. Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 5. Credenciales de Acceso

| Usuario | Email | Contraseña |
|---------|-------|------------|
| Admin | admin@masterdash.com | admin123 |
| Usuario | usuario@masterdash.com | user123 |

## 📁 Estructura del Proyecto

```
masterdash/
├── prisma/
│   ├── schema.prisma       # Schema unificado (Auth + App)
│   └── seed.ts             # Script de seed
├── src/
│   ├── app/
│   │   ├── (dashboard)/    # Rutas protegidas
│   │   │   ├── layout.tsx  # Layout con auth check
│   │   │   └── page.tsx    # Dashboard principal
│   │   ├── admin/          # Panel de administración
│   │   ├── login/          # Página de login
│   │   └── api/            # API routes
│   ├── auth.ts             # Configuración Auth.js
│   ├── components/
│   │   ├── ui/             # Componentes shadcn
│   │   ├── layout/         # Sidebar, Header
│   │   ├── charts/         # Gráficos ECharts
│   │   └── providers/      # ThemeProvider, etc.
│   ├── lib/
│   │   ├── prisma.ts       # Cliente Prisma singleton
│   │   ├── safe-query.ts   # Queries con accessScope
│   │   └── utils.ts        # Utilidades
│   └── types/
│       ├── index.ts        # Tipos de la aplicación
│       └── next-auth.d.ts  # Extensión tipos Auth.js
└── .env                    # Variables de entorno
```

## 🎨 Design System

- **Tema**: Dark mode con glassmorphism
- **Colores**: Gradientes de azul a púrpura
- **Componentes**: shadcn/ui + Tremor
- **Gráficos**: ECharts (Canvas mode)

## 🔒 Seguridad

- **Autenticación**: Auth.js con Credentials Provider
- **Sesiones**: JWT Strategy
- **Contraseñas**: Hash con bcrypt (12 rounds)
- **Autorización**: Role-based (admin/user)
- **Access Scope**: Filtrado granular de datos por usuario

## 🛠️ Comandos Útiles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run start        # Ejecutar build
npm run lint         # Verificar código
npm run db:push      # Sincronizar schema
npm run db:seed      # Crear datos de prueba
npm run db:studio    # Abrir Prisma Studio
```

## 📊 DataWarehouse

Para conectar con tu DataWarehouse, agrega las vistas/tablas al schema de Prisma:

```prisma
// En prisma/schema.prisma
model VentasResumen {
  id           Int      @id
  fecha        DateTime
  sucursal     String
  region       String
  totalVentas  Decimal  @db.Decimal(18, 2)
  cantidad     Int
  
  @@map("vw_ventas_resumen")
}
```

Luego ejecuta:

```bash
npx prisma generate
```

## 🐳 Docker

```bash
docker-compose up -d
```

## 📝 Estado del Proyecto

- ✅ Proyecto base configurado
- ✅ Autenticación con Auth.js
- ✅ Layout con Sidebar y Header
- ✅ Panel de administración básico
- ✅ Dashboard de ventas (datos de ejemplo)
- ⬜ Conectar DataWarehouse real
- ⬜ Deploy en producción

## 📄 Licencia

MIT
