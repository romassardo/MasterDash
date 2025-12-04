/**
 * Tipos para la aplicación MasterDash
 * Alineados con el schema de Prisma (camelCase)
 */

// Tipos de usuario (coincide con Prisma User)
export interface User {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: 'admin' | 'user'
  sectorId?: string | null
  areaId?: string | null
  createdAt: Date
  updatedAt: Date
}

// Tipos de Sector
export interface Sector {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Tipos de Area
export interface Area {
  id: string
  name: string
  description?: string | null
  sectorId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  sector?: Sector
}

// Tipos de dashboard (coincide con Prisma Dashboard)
export interface Dashboard {
  id: string
  slug: string
  title: string
  description?: string | null
  icon?: string | null
  areaId?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  area?: Area | null
}

// Dashboard para el sidebar
export interface SidebarDashboard {
  id: string
  slug: string
  title: string
  icon?: string | null
  sectorName?: string | null
  areaName?: string | null
}

// Tipos de acceso a dashboard (coincide con Prisma UserDashboardAccess)
export interface UserDashboardAccess {
  id: string
  userId: string
  dashboardId: string
  accessScope?: AccessScope | null
  createdAt: Date
  updatedAt: Date
  dashboard?: Dashboard
  user?: User
}

/**
 * AccessScope - Define el alcance de acceso de un usuario a un dashboard
 * Se almacena como JSON string en la base de datos
 */
export interface AccessScope {
  regions?: string[]
  sucursales?: string[]
  minAmount?: number
  maxAmount?: number
  dateFrom?: string
  dateTo?: string
  [key: string]: unknown
}

// Tipos para el DataWarehouse
export interface VentasData {
  fecha: string
  sucursal: string
  region: string
  totalVentas: number
  cantidad: number
}

// Tipos para KPIs
export interface KPIData {
  label: string
  value: number
  delta?: number
  deltaType?: 'increase' | 'decrease' | 'unchanged'
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Tipos para paginación
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
