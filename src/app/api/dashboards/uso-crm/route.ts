import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prismaDW from '@/lib/prisma-dw'

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
 * 
 * Query params:
 * - period: 0 (todos), 1 (hoy), 7, 15, 30 días
 * 
 * Interpretación de datos:
 * - ConversacionesRecibidasCRM = Total de conversaciones
 * - ConversacionesNoRespondidasDesdeCRM = Respondidas por WhatsApp (fuera del CRM)
 * - Respondidas por CRM = Total - WhatsApp
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener período de filtro
    const periodParam = request.nextUrl.searchParams.get('period')
    const period = periodParam ? parseInt(periodParam) : 30 // Default 30 días

    // Obtener todos los datos (schema: crm)
    const rawData = await prismaDW.$queryRaw<CRMRow[]>`
      SELECT fecha, OperatorId, Nombre, Apellido, 
             ConversacionesRecibidasCRM, ConversacionesNoRespondidasDesdeCRM 
      FROM [crm].[ETL_Analitica_Uso_CRM]
      ORDER BY fecha DESC
    `

    // Convertir fechas a formato ISO string para comparación consistente
    const getDateString = (d: Date) => new Date(d).toISOString().split('T')[0]
    
    // Obtener rango de fechas disponibles
    const allDateStrings = rawData.map(r => getDateString(r.fecha)).sort()
    const maxDateStr = allDateStrings[allDateStrings.length - 1]
    const minDateStr = allDateStrings[0]
    
    const maxDate = new Date(maxDateStr + 'T00:00:00Z')
    const minDate = new Date(minDateStr + 'T00:00:00Z')

    // Calcular fecha de corte basada en la fecha más reciente de los datos
    // period=0 significa "todos los datos" (sin filtro de fecha)
    let filteredData: CRMRow[]
    let cutoffDateStr: string
    
    if (period === 0) {
      // Todos los datos
      filteredData = rawData
      cutoffDateStr = minDateStr
    } else {
      const cutoffDate = new Date(maxDate)
      cutoffDate.setUTCDate(cutoffDate.getUTCDate() - period + 1)
      cutoffDateStr = cutoffDate.toISOString().split('T')[0]
      
      // Filtrar por período usando strings ISO (más confiable)
      filteredData = rawData.filter(r => {
        const fechaStr = getDateString(r.fecha)
        return fechaStr >= cutoffDateStr
      })
    }

    // === KPIS GLOBALES ===
    const totalConversaciones = filteredData.reduce((sum, r) => sum + (r.ConversacionesRecibidasCRM || 0), 0)
    const respondidasWhatsApp = filteredData.reduce((sum, r) => sum + (r.ConversacionesNoRespondidasDesdeCRM || 0), 0)
    const respondidasCRM = totalConversaciones - respondidasWhatsApp
    
    const porcentajeWhatsApp = totalConversaciones > 0 
      ? Math.round((respondidasWhatsApp / totalConversaciones) * 100) 
      : 0
    const porcentajeCRM = totalConversaciones > 0 
      ? Math.round((respondidasCRM / totalConversaciones) * 100) 
      : 0

    // === DATOS POR MODERADOR ===
    const porModeradorMap = new Map<string, {
      nombre: string
      total: number
      porWhatsApp: number
      porCRM: number
      datosPorFecha: Map<string, { total: number; crm: number }>
    }>()
    
    filteredData.forEach(row => {
      const key = row.OperatorId
      const whatsapp = row.ConversacionesNoRespondidasDesdeCRM || 0
      const total = row.ConversacionesRecibidasCRM || 0
      const crm = total - whatsapp
      const fechaKey = getDateString(row.fecha)
      
      const existing = porModeradorMap.get(key)
      if (existing) {
        existing.total += total
        existing.porWhatsApp += whatsapp
        existing.porCRM += crm
        
        const fechaData = existing.datosPorFecha.get(fechaKey)
        if (fechaData) {
          fechaData.total += total
          fechaData.crm += crm
        } else {
          existing.datosPorFecha.set(fechaKey, { total, crm })
        }
      } else {
        const datosPorFecha = new Map<string, { total: number; crm: number }>()
        datosPorFecha.set(fechaKey, { total, crm })
        porModeradorMap.set(key, {
          nombre: `${row.Nombre.trim()} ${row.Apellido.trim()}`,
          total,
          porWhatsApp: whatsapp,
          porCRM: crm,
          datosPorFecha,
        })
      }
    })

    // Calcular tendencia (comparación primera mitad vs segunda mitad del período)
    const calculateTendencia = (datosPorFecha: Map<string, { total: number; crm: number }>) => {
      const fechas = Array.from(datosPorFecha.keys()).sort()
      if (fechas.length < 2) return 0
      
      const mitad = Math.floor(fechas.length / 2)
      const primerasMitad = fechas.slice(0, mitad)
      const segundaMitad = fechas.slice(mitad)
      
      const usoPrimera = primerasMitad.reduce((sum, f) => {
        const d = datosPorFecha.get(f)!
        return sum + (d.total > 0 ? (d.crm / d.total) * 100 : 0)
      }, 0) / (primerasMitad.length || 1)
      
      const usoSegunda = segundaMitad.reduce((sum, f) => {
        const d = datosPorFecha.get(f)!
        return sum + (d.total > 0 ? (d.crm / d.total) * 100 : 0)
      }, 0) / (segundaMitad.length || 1)
      
      return Math.round(usoSegunda - usoPrimera)
    }

    // Calcular estado de cada moderador
    const moderadores = Array.from(porModeradorMap.entries())
      .map(([id, data]) => {
        const usoCRM = data.total > 0 
          ? Math.round((data.porCRM / data.total) * 100)
          : 0
        
        // Determinar estado basado en uso de CRM
        const estado: 'TOP' | 'Normal' | 'ALERTA' = 
          usoCRM >= 70 ? 'TOP' :
          usoCRM >= 50 ? 'Normal' : 'ALERTA'
        
        // Calcular tendencia real
        const tendencia = calculateTendencia(data.datosPorFecha)
        
        return {
          id,
          nombre: data.nombre,
          porWhatsApp: data.porWhatsApp,
          porCRM: data.porCRM,
          total: data.total,
          tendencia,
          usoCRM,
          estado,
        }
      })
      .sort((a, b) => b.total - a.total)

    // Contar estados del equipo
    const estadoEquipo = {
      excelente: moderadores.filter(m => m.estado === 'TOP').length,
      normal: moderadores.filter(m => m.estado === 'Normal').length,
      critico: moderadores.filter(m => m.estado === 'ALERTA').length,
    }

    const totalModeradores = moderadores.length
    const moderadoresCriticos = estadoEquipo.critico

    // === TENDENCIA DIARIA ===
    const porDiaMap = new Map<string, { whatsapp: number; crm: number; total: number }>()
    filteredData.forEach(row => {
      const diaKey = getDateString(row.fecha)
      const whatsapp = row.ConversacionesNoRespondidasDesdeCRM || 0
      const total = row.ConversacionesRecibidasCRM || 0
      const crm = total - whatsapp
      
      const existing = porDiaMap.get(diaKey)
      if (existing) {
        existing.whatsapp += whatsapp
        existing.crm += crm
        existing.total += total
      } else {
        porDiaMap.set(diaKey, { whatsapp, crm, total })
      }
    })

    const tendenciaDiaria = Array.from(porDiaMap.entries())
      .map(([date, data]) => ({
        date,
        whatsapp: data.whatsapp,
        crm: data.crm,
        total: data.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Promedio diario
    const promedioDiario = tendenciaDiaria.length > 0
      ? Math.round(totalConversaciones / tendenciaDiaria.length)
      : 0

    // Debug info
    const debugInfo = {
      totalRawData: rawData.length,
      totalFilteredData: filteredData.length,
      allDateStringsUnique: [...new Set(allDateStrings)].sort(),
      cutoffDateStr,
      maxDateStr,
      minDateStr,
      tendenciaDiariaFechas: tendenciaDiaria.map(t => t.date),
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      meta: {
        period,
        fechaDesde: cutoffDateStr,
        fechaHasta: maxDateStr,
        fechasDisponibles: {
          min: minDateStr,
          max: maxDateStr,
        },
        diasConDatos: tendenciaDiaria.length,
      },
      kpis: {
        totalConversaciones,
        respondidasWhatsApp,
        respondidasCRM,
        porcentajeWhatsApp,
        porcentajeCRM,
        moderadoresCriticos,
        totalModeradores,
        estadoEquipo,
        promedioDiario,
      },
      charts: {
        tendenciaDiaria,
      },
      moderadores,
    })

  } catch (error) {
    console.error('Error fetching CRM data:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}
