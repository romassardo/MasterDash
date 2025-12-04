# 📊 MasterDash v2.4 - Plan de Desarrollo

> **Última actualización:** 2024-12-03
> **Versión del Plan:** 2.4 (Optimizado para Big Data)
> **Filosofía:** Code-First (Máxima flexibilidad y diseño)

---

## 🎯 Objetivo del Proyecto

Construir una plataforma centralizada ("MasterDash") que sirva como punto de acceso único a la inteligencia de negocios de la empresa, con:

- **UI High-End:** Diseño Glassmorphism + Dark Mode
- **Seguridad Granular:** Row Level Security (RLS) - cada usuario ve solo sus datos
- **Rendimiento Extremo:** Consultas optimizadas para Big Data (millones de registros)
- **Costo Cero de Licencias:** Sin pagos por usuario como Power BI

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Estado |
|-----------|------------|--------|
| Framework | Next.js 15 (App Router) | ✅ |
| Lenguaje | TypeScript (Strict) | ✅ |
| Auth | Auth.js v5 (Credentials) | ✅ |
| ORM | Prisma | ✅ |
| DB App | SQL Server Express | ✅ |
| DB DataWarehouse | SQL Server (Staging/Prod) | ⏳ |
| Estado Servidor | TanStack Query v5 | ✅ |
| CSS | Tailwind CSS 4 | ✅ |
| UI Components | shadcn/ui | ✅ |
| KPIs/Métricas | Tremor | ❌ |
| Gráficos Big Data | Apache ECharts | ❌ |
| Tablas | TanStack Table | ❌ |
| Infra | Docker + Linux | ⏳ |

---

## 📅 FASES DE DESARROLLO

### FASE 0: Cimientos e Infraestructura ✅ 100%

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 0.1 | Inicializar repo Next.js 15 + TypeScript | ✅ | Completado |
| 0.2 | Configurar Tailwind CSS 4 | ✅ | Completado |
| 0.3 | Instalar y configurar shadcn/ui | ✅ | Completado |
| 0.4 | Configurar SQL Server (Docker/Local) | ✅ | Usando SQL Server Express |
| 0.5 | Instalar @tremor/react (KPIs) | ✅ | v3.18.7 |
| 0.6 | Instalar echarts + echarts-for-react | ✅ | v6.0.0 / v3.0.5 |
| 0.7 | Instalar @tanstack/react-table | ✅ | v8.21.3 |

---

### FASE 1: Autenticación y Core ✅ 100%

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 1.1 | Configurar Prisma con SQL Server | ✅ | Schema unificado |
| 1.2 | Implementar Auth.js v5 (Credentials) | ✅ | JWT Strategy |
| 1.3 | Crear modelos: User, Dashboard, UserDashboardAccess | ✅ | Con accessScope |
| 1.4 | Crear modelos: Sector, Area | ✅ | Jerarquía organizacional |
| 1.5 | Layout Maestro: Sidebar colapsable | ✅ | Agrupado por Sector |
| 1.6 | Layout Maestro: Header con perfil | ✅ | Toggle tema, logout |
| 1.7 | Aplicar Glassmorphism global | ✅ | Clase .glass en globals.css |
| 1.8 | Seed de datos iniciales | ✅ | Admin + usuarios de prueba |

---

### FASE 2: Conexión al DataWarehouse y Seguridad ✅ 100%

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 2.1 | Crear utilidad `safe-query.ts` | ✅ | Con inyección de accessScope |
| 2.2 | Configurar cliente Prisma para DW | ✅ | `prisma-dw.ts` con datasourceUrl |
| 2.3 | Endpoint de prueba `/api/dw/test` | ✅ | 21 tablas detectadas |
| 2.4 | Conexión a Staging verificada | ✅ | Server 10.50.80.10 |
| 2.5 | Filtrado por accessScope | ✅ | Listo para usar |

**Servidor DW:** `10.50.80.10` | **Base de datos:** `Staging` | **Tablas:** 21

---

### FASE 3: Desarrollo de Dashboards ✅ 80%

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 3.1 | Crear componente KPICard | ✅ | `src/components/charts/KPICard.tsx` |
| 3.2 | Crear componente LineChart con ECharts | ✅ | Con zoom, área, tooltips |
| 3.3 | Crear componente BarChart con ECharts | ✅ | Horizontal/vertical, gradientes |
| 3.4 | Crear componente DataTable | ✅ | Usando shadcn/ui Table |
| 3.5 | **Dashboard Piloto: Consolidaciones** | ✅ | `/dashboards/consolidaciones` |
| 3.5.1 | - 4 KPI Cards | ✅ | Total, Sucursales, Usuarios, CC |
| 3.5.2 | - Gráfico barras por sucursal | ✅ | Top 10 sucursales |
| 3.5.3 | - Gráfico línea temporal | ✅ | Tendencia por mes |
| 3.6 | API endpoint con datos DW | ✅ | `/api/dashboards/consolidaciones` |
| 3.7 | Registrar en seed.ts | ✅ | Área: Bancos |

---

### FASE 4: Panel de Administración ✅ 100%

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 4.1 | CRUD de Usuarios | ✅ | /admin/users |
| 4.2 | CRUD de Dashboards | ✅ | /admin/dashboards |
| 4.3 | Gestor de Permisos Visual | ✅ | /admin/permissions |
| 4.4 | CRUD de Sectores | ✅ | API + UI en /admin/settings |
| 4.5 | CRUD de Áreas | ✅ | API + UI en /admin/settings |
| 4.6 | Página de Configuración | ✅ | Gestión completa de estructura org.

---

### FASE 5: Pulido y Despliegue ❌ 0%

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 5.1 | Auditoría de seguridad | ❌ | **PENDIENTE** |
| 5.2 | Optimización de queries | ❌ | **PENDIENTE** |
| 5.3 | Testing E2E | ❌ | **PENDIENTE** |
| 5.4 | Configurar Dockerfile | ⚠️ | Existe, revisar |
| 5.5 | Configurar docker-compose | ⚠️ | Existe, revisar |
| 5.6 | Build de producción | ❌ | **PENDIENTE** |
| 5.7 | Deploy en servidor Linux | ❌ | **PENDIENTE** |
| 5.8 | Documentación final | ❌ | **PENDIENTE** |

---

## 📈 Progreso General

```
FASE 0: ████████████ 100% (Cimientos)
FASE 1: ████████████ 100% (Auth & Core)
FASE 2: ████████████ 100% (DataWarehouse)
FASE 3: ████████████ 95%  (Dashboards)    ← 2 DASHBOARDS LISTOS!
FASE 4: ████████████ 100% (Admin Panel)   ← COMPLETO CON CONFIG!
FASE 5: ░░░░░░░░░░░░ 0%   (Deploy)

TOTAL:  ████████████ 83%
```

---

## 🚀 Próximos Pasos (En Orden)

1. ~~**Completar FASE 0:** Instalar Tremor, ECharts, TanStack Table~~ ✅
2. ~~**FASE 2:** Configurar conexión al DataWarehouse (Staging)~~ ✅
3. ~~**FASE 3.1-3.4:** Crear componentes de visualización (KPIs, Charts, Tables)~~ ✅
4. ~~**FASE 3.5:** Desarrollar Dashboard Piloto con datos reales~~ ✅
5. ~~**FASE 4.4-4.6:** Completar panel de administración (Sectores, Áreas, Config)~~ ✅
6. **FASE 5:** Auditoría de seguridad, optimización y deploy

---

## 📝 Notas de Arquitectura

### Seguridad de Dos Capas

**Capa 1 - RBAC (Acceso al Recurso):**
- Middleware verifica si el usuario puede acceder a `/dashboards/[slug]`
- Implementado via Auth.js + UserDashboardAccess

**Capa 2 - RLS (Filtrado de Datos):**
- El campo `accessScope` (JSON) define qué filas puede ver
- Ejemplo: `{ "regions": ["Norte", "Sur"], "minAmount": 0 }`
- Se inyecta en las queries via `safe-query.ts`

### Estrategia Big Data

1. **Agregación en Origen:** GROUP BY en SQL Server, nunca traer millones de filas
2. **Server-Side Pagination:** Tablas con paginación real en backend
3. **Data Sampling:** Downsampling para gráficos de tendencias largas
4. **Canvas Rendering:** ECharts en modo Canvas para 100k+ puntos

---

## 📚 Recursos

- [Apache ECharts Examples](https://echarts.apache.org/examples/en/index.html)
- [Tremor Components](https://tremor.so/components)
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [Auth.js v5 Docs](https://authjs.dev/)

---

## 🔄 Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2024-12-03 | 2.4 | Plan inicial creado, Fases 0-1 parcialmente completadas |
| 2024-12-04 | 2.4.1 | ✅ Fase 4 completada: Página de Configuración con CRUD de Sectores y Áreas |

