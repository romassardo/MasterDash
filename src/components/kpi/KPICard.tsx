'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  delta?: number
  deltaType?: 'increase' | 'decrease' | 'unchanged'
  icon?: React.ReactNode
  className?: string
  loading?: boolean
}

export function KPICard({
  title,
  value,
  description,
  delta,
  deltaType = 'unchanged',
  icon,
  className,
  loading = false,
}: KPICardProps) {
  const getDeltaColor = () => {
    switch (deltaType) {
      case 'increase':
        return 'text-green-500'
      case 'decrease':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  const getDeltaIcon = () => {
    switch (deltaType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card className={cn('glass border-white/10', className)}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-8 w-32 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('glass border-white/10 transition-all hover:scale-[1.02] hover:shadow-lg', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className="text-muted-foreground">{icon}</div>
          )}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        {(delta !== undefined || description) && (
          <div className="mt-2 flex items-center gap-1">
            {delta !== undefined && (
              <>
                <span className={cn('flex items-center gap-0.5 text-sm font-medium', getDeltaColor())}>
                  {getDeltaIcon()}
                  {Math.abs(delta)}%
                </span>
              </>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}






