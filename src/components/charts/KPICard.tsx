'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <TrendingUp className="h-4 w-4" />
    if (trend.value < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.value > 0) return 'text-emerald-400'
    if (trend.value < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  return (
    <div
      className={cn(
        'glass rounded-xl p-6 transition-all hover:border-white/20',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 border border-white/10">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className={cn('mt-4 flex items-center gap-2', getTrendColor())}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  )
}

