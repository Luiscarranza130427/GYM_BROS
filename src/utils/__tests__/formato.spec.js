import { describe, expect, it } from 'vitest'

import { formatearFecha, formatearTiempoRelativo } from '@/utils/formato'

describe('formatearTiempoRelativo', () => {
  it.each([undefined, '', 'dato-invalido'])(
    'devuelve una alternativa segura para la fecha %s',
    (fecha) => {
      expect(formatearTiempoRelativo(fecha)).toBe('Fecha no disponible')
    },
  )
})

describe('formatearFecha', () => {
  it('formatea una fecha ISO sin mostrar el valor técnico', () => {
    expect(formatearFecha('2026-08-14')).toContain('2026')
    expect(formatearFecha('2026-08-14')).not.toContain('T00:00')
  })

  it('tolera fechas inválidas', () => {
    expect(formatearFecha('sin-fecha')).toBe('Fecha no disponible')
  })
})
