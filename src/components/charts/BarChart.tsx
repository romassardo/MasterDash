'use client'

import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'

interface BarChartProps {
  data: { name: string; value: number }[]
  title?: string
  height?: number
  horizontal?: boolean
  color?: string
  className?: string
}

export function BarChart({
  data,
  title,
  height = 300,
  horizontal = false,
  color = '#6366f1',
  className,
}: BarChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const option = {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: {
            color: isDark ? '#e5e7eb' : '#1f2937',
            fontSize: 14,
            fontWeight: 600,
          },
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      textStyle: {
        color: isDark ? '#e5e7eb' : '#1f2937',
      },
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: horizontal ? '3%' : '3%',
      right: '4%',
      bottom: '3%',
      top: title ? '15%' : '8%',
      containLabel: true,
    },
    xAxis: horizontal
      ? {
          type: 'value',
          axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } },
          axisLabel: { color: isDark ? '#9ca3af' : '#6b7280' },
          splitLine: { lineStyle: { color: isDark ? '#1f2937' : '#f3f4f6' } },
        }
      : {
          type: 'category',
          data: data.map((d) => d.name),
          axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } },
          axisLabel: {
            color: isDark ? '#9ca3af' : '#6b7280',
            rotate: data.length > 6 ? 45 : 0,
            fontSize: 11,
          },
        },
    yAxis: horizontal
      ? {
          type: 'category',
          data: data.map((d) => d.name),
          axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } },
          axisLabel: { color: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 },
        }
      : {
          type: 'value',
          axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } },
          axisLabel: { color: isDark ? '#9ca3af' : '#6b7280' },
          splitLine: { lineStyle: { color: isDark ? '#1f2937' : '#f3f4f6' } },
        },
    series: [
      {
        data: data.map((d) => d.value),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: horizontal ? 1 : 0,
            y2: horizontal ? 0 : 1,
            colorStops: [
              { offset: 0, color: color },
              { offset: 1, color: `${color}99` },
            ],
          },
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: `${color}40`,
          },
        },
        barMaxWidth: 40,
      },
    ],
  }

  return (
    <div className={className}>
      <ReactECharts
        option={option}
        style={{ height }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}
