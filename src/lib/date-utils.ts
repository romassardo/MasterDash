/**
 * Utilidades de fecha para Argentina (UTC-3)
 * 
 * Todas las fechas se manejan en zona horaria de Argentina
 */

// Zona horaria de Argentina
export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires'
export const ARGENTINA_LOCALE = 'es-AR'

/**
 * Convierte una fecha a zona horaria de Argentina
 */
export function toArgentinaTime(date: Date | string | null | undefined): Date | null {
  if (!date) return null
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Crear fecha en zona horaria de Argentina
  const argentinaDate = new Date(d.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }))
  return argentinaDate
}

/**
 * Obtiene la fecha actual en Argentina
 */
export function nowArgentina(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }))
}

/**
 * Formatea una fecha en formato argentino (DD/MM/YYYY)
 */
export function formatDateAR(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleDateString(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatea fecha y hora en formato argentino (DD/MM/YYYY HH:mm)
 */
export function formatDateTimeAR(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleString(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea fecha larga (ej: "Lunes 4 de Diciembre de 2025")
 */
export function formatDateLongAR(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleDateString(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formatea fecha corta (ej: "Lun 4")
 */
export function formatDateShortAR(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleDateString(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
  })
}

/**
 * Formatea solo la hora (ej: "14:30")
 */
export function formatTimeAR(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleTimeString(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Obtiene fecha ISO en formato YYYY-MM-DD (para inputs y APIs)
 */
export function toISODateAR(date: Date | string | null | undefined): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Obtener componentes en zona Argentina
  const parts = d.toLocaleDateString('en-CA', { // en-CA da formato YYYY-MM-DD
    timeZone: ARGENTINA_TIMEZONE,
  })
  
  return parts
}

/**
 * Calcula diferencia en días desde hoy (Argentina)
 */
export function daysFromNowAR(date: Date | string | null | undefined): number {
  if (!date) return 0
  
  const d = typeof date === 'string' ? new Date(date) : date
  const now = nowArgentina()
  
  const diffTime = now.getTime() - d.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Texto relativo (ej: "Hace 2 días", "Hoy", "Ayer")
 */
export function relativeDateAR(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const days = daysFromNowAR(date)
  
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`
  return `Hace ${Math.floor(days / 365)} años`
}
