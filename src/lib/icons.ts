/**
 * Configuración centralizada de iconos para dashboards
 * Este archivo debe ser importado SOLO en Client Components
 */

import {
  BarChart3,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Truck,
  FileText,
  PieChart,
  Activity,
  Building2,
  Layers,
  type LucideIcon,
} from 'lucide-react'

// Mapeo de nombres de iconos a componentes Lucide
export const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Truck,
  FileText,
  PieChart,
  Activity,
  Building2,
  Layers,
}

// Nombres de iconos disponibles (para selects, etc.)
export const availableIcons = [
  { name: 'BarChart3', label: 'Gráfico de Barras', icon: BarChart3 },
  { name: 'Package', label: 'Paquete', icon: Package },
  { name: 'Users', label: 'Usuarios', icon: Users },
  { name: 'DollarSign', label: 'Dinero', icon: DollarSign },
  { name: 'TrendingUp', label: 'Tendencia', icon: TrendingUp },
  { name: 'ShoppingCart', label: 'Carrito', icon: ShoppingCart },
  { name: 'Truck', label: 'Envíos', icon: Truck },
  { name: 'FileText', label: 'Documentos', icon: FileText },
  { name: 'PieChart', label: 'Gráfico Circular', icon: PieChart },
  { name: 'Activity', label: 'Actividad', icon: Activity },
] as const

// Helper para obtener un icono por nombre
export function getIcon(name?: string | null): LucideIcon {
  return iconMap[name || ''] || BarChart3
}

// Tipo para nombres de iconos válidos
export type IconName = keyof typeof iconMap
