'use client'

import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'

interface LineChartProps {
  data: { date: string; value: number }[]
  title?: string
  height?: number
  color?: string
  areaFill?: boolean
  smooth?: boolean
  className?: string
}

export function LineChart({
  data,
  title,
  height = 300,
  color = '#8b5cf6',
  areaFill = true,
  smooth = true,
  className,
}: LineChartProps) {
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
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? '15%' : '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      boundaryGap: false,
      axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } },
      axisLabel: {
        color: isDark ? '#9ca3af' : '#6b7280',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } },
      axisLabel: { color: isDark ? '#9ca3af' : '#6b7280' },
      splitLine: { lineStyle: { color: isDark ? '#1f2937' : '#f3f4f6' } },
    },
    series: [
      {
        data: data.map((d) => d.value),
        type: 'line',
        smooth,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color,
          width: 2,
        },
        itemStyle: {
          color,
          borderColor: isDark ? '#0f172a' : '#ffffff',
          borderWidth: 2,
        },
        areaStyle: areaFill
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: `${color}40` },
                  { offset: 1, color: `${color}05` },
                ],
              },
            }
          : undefined,
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: `${color}80`,
          },
        },
      },
    ],
    dataZoom: data.length > 20
      ? [
          {
            type: 'inside',
            start: 0,
            end: 100,
          },
          {
            start: 0,
            end: 100,
            handleStyle: {
              color: color,
            },
          },
        ]
      : undefined,
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
