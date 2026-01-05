import { NextRequest, NextResponse } from 'next/server'
import { safeQuery } from '@/lib/safe-query'

interface CRMRow {
  fecha: Date
  OperatorId: string
  Nombre: string
  Apellido: string
  ConversacionesRecibidasCRM: number
  ConversacionesNoRespondidasDesdeCRM: number
}

/**
 * GET /api/dashboards/uso-crm?period=7
 * Obtiene datos agregados para el dashboard de uso del CRM
 * Protegido por SafeQuery (RLS)
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener período de filtro
    const periodParam = request.nextUrl.searchParams.get('period')
    const period = periodParam ? parseInt(periodParam) : 30 // Default 30 días

    // 1. Obtener la fecha máxima para calcular el corte del período
    const maxDateResult = await safeQuery<{ maxFecha: Date }>({
      dashboardSlug: 'uso-crm',
      baseQuery: 'SELECT MAX(fecha) as maxFecha FROM [crm].[ETL_Analitica_Uso_CRM]',
    })

    const maxDate = maxDateResult.data[0]?.maxFecha || new Date()
    let wherePeriod = ''
    let params: Record<string, any> = {}

    if (period > 0) {
      const cutoffDate = new Date(maxDate)
      cutoffDate.setUTCDate(cutoffDate.getUTCDate() - period + 1)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
      wherePeriod = `WHERE fecha >= @cutoffDate`
      params.cutoffDate = cutoffDateStr
    }

    // 2. KPIs Globales (Agregación en SQL)
    const kpiResult = await safeQuery<{
      totalConversaciones: number
      respondidasWhatsApp: number
      totalModeradores: number
    }>({
      dashboardSlug: 'uso-crm',
      baseQuery: `
        SELECT 
          SUM(ISNULL(ConversacionesRecibidasCRM, 0)) as totalConversaciones,
          SUM(ISNULL(ConversacionesNoRespondidasDesdeCRM, 0)) as respondidasWhatsApp,
          COUNT(DISTINCT OperatorId) as totalModeradores
        FROM [crm].[ETL_Analitica_Uso_CRM]
        ${wherePeriod}
      `,
      params
    })

    // 3. Datos por Moderador (Agregación en SQL)
    const moderadoresResult = await safeQuery<{
      OperatorId: string
      Nombre: string
      Apellido: string
      total: number
      porWhatsApp: number
      porCRM: number
    }>({
      dashboardSlug: 'uso-crm',
      baseQuery: `
        SELECT 
          OperatorId, 
          Nombre, 
          Apellido,
          SUM(ISNULL(ConversacionesRecibidasCRM, 0)) as total,
          SUM(ISNULL(ConversacionesNoRespondidasDesdeCRM, 0)) as porWhatsApp,
          SUM(ISNULL(ConversacionesRecibidasCRM, 0)) - SUM(ISNULL(ConversacionesNoRespondidasDesdeCRM, 0)) as porCRM
        FROM [crm].[ETL_Analitica_Uso_CRM]
        ${wherePeriod}
        GROUP BY OperatorId, Nombre, Apellido
        ORDER BY total DESC
      `,
      params
    })

    // 4. Tendencia Diaria (Agregación en SQL)
    const tendenciaResult = await safeQuery<{
      date: string
      whatsapp: number
      crm: number
      total: number
    }>({
      dashboardSlug: 'uso-crm',
      baseQuery: `
        SELECT 
          FORMAT(fecha, 'yyyy-MM-dd') as date,
          SUM(ISNULL(ConversacionesNoRespondidasDesdeCRM, 0)) as whatsapp,
          SUM(ISNULL(ConversacionesRecibidasCRM, 0)) - SUM(ISNULL(ConversacionesNoRespondidasDesdeCRM, 0)) as crm,
          SUM(ISNULL(ConversacionesRecibidasCRM, 0)) as total
        FROM [crm].[ETL_Analitica_Uso_CRM]
        ${wherePeriod}
        GROUP BY FORMAT(fecha, 'yyyy-MM-dd')
        ORDER BY date ASC
      `,
      params
    })

    if (kpiResult.error || moderadoresResult.error || tendenciaResult.error) {
      return NextResponse.json({ 
        success: false, 
        error: kpiResult.error || moderadoresResult.error || tendenciaResult.error 
      }, { status: 403 })
    }

    // Procesamiento ligero de KPIs finales
    const kpis = kpiResult.data[0] || { totalConversaciones: 0, respondidasWhatsApp: 0, totalModeradores: 0 }
    const totalConversaciones = kpis.totalConversaciones
    const respondidasWhatsApp = kpis.respondidasWhatsApp
    const respondidasCRM = totalConversaciones - respondidasWhatsApp
    
    const porcentajeWhatsApp = totalConversaciones > 0 ? Math.round((respondidasWhatsApp / totalConversaciones) * 100) : 0
    const porcentajeCRM = totalConversaciones > 0 ? Math.round((respondidasCRM / totalConversaciones) * 100) : 0

    // Procesamiento de moderadores (estados y tendencias locales)
    const moderadores = moderadoresResult.data.map(m => {
      const usoCRM = m.total > 0 ? Math.round((m.porCRM / m.total) * 100) : 0
      return {
        id: m.OperatorId,
        nombre: `${m.Nombre.trim()} ${m.Apellido.trim()}`,
        porWhatsApp: m.porWhatsApp,
        porCRM: m.porCRM,
        total: m.total,
        usoCRM,
        estado: usoCRM >= 70 ? 'TOP' : usoCRM >= 50 ? 'Normal' : 'ALERTA',
        tendencia: 0 // Simplificado para performance, se puede calcular si es crítico
      }
    })

    const estadoEquipo = {
      excelente: moderadores.filter(m => m.estado === 'TOP').length,
      normal: moderadores.filter(m => m.estado === 'Normal').length,
      critico: moderadores.filter(m => m.estado === 'ALERTA').length,
    }

    return NextResponse.json({
      success: true,
      meta: {
        period,
        maxDateStr: maxDate.toISOString().split('T')[0],
      },
      kpis: {
        totalConversaciones,
        respondidasWhatsApp,
        respondidasCRM,
        porcentajeWhatsApp,
        porcentajeCRM,
        totalModeradores: kpis.totalModeradores,
        moderadoresCriticos: estadoEquipo.critico,
        estadoEquipo,
        promedioDiario: tendenciaResult.data.length > 0 ? Math.round(totalConversaciones / tendenciaResult.data.length) : 0
      },
      charts: {
        tendenciaDiaria: tendenciaResult.data,
      },
      moderadores,
      accessScope: kpiResult.accessScope
    })

  } catch (error) {
    console.error('Error fetching CRM data:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}
