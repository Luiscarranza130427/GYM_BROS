import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const RESPUESTA_API = {
  dashboard: {
    banner: {
      titulo: 'Resumen',
      descripcion: 'Estado general',
      accion: { texto: 'Ver usuarios', rutaNombre: 'usuarios' },
    },
    metricas: [
      {
        id: 'usuarios',
        etiqueta: 'Usuarios',
        valor: 42,
        icono: 'bi-people-fill',
        tendencia: { valor: 4.2, detalle: 'este mes', tono: 'positivo' },
      },
    ],
    progreso: {
      titulo: 'Usuarios activos',
      descripcion: 'Evolución mensual',
      unidad: 'usuarios activos',
      etiquetas: ['Ago'],
      valores: [42],
      resumen: { etiqueta: 'Total', valor: 42, detalle: 'Dato actual' },
    },
    ejerciciosPopulares: [{ id: 1, nombre: 'Sentadilla', usos: 12 }],
    actividadReciente: [{ id: 1, titulo: 'Usuario registrado' }],
  },
}

describe('dashboard.service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('devuelve el resumen mock con una latencia entre 300 y 600 ms', async () => {
    vi.doMock('@/core/config/env', () => ({ USE_MOCKS: true }))
    vi.doMock('@/core/api/api', () => ({ default: { get: vi.fn() } }))
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const temporizador = vi.spyOn(globalThis, 'setTimeout')
    const { obtenerDashboard } = await import('@/modules/dashboard/services/dashboard.service')
    await import('@/modules/dashboard/mocks/dashboard.mock')

    const peticion = obtenerDashboard()

    await vi.advanceTimersByTimeAsync(0)
    expect(temporizador).toHaveBeenCalledWith(expect.any(Function), 450)
    await vi.advanceTimersByTimeAsync(450)

    const resumen = await peticion
    expect(resumen.metricas).toHaveLength(4)
    expect(resumen.progreso.valores).not.toHaveLength(0)
    expect(resumen.ejerciciosPopulares[0].nombre).toBe('Press de banca')
    expect(resumen.actividadReciente[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('entrega copias independientes para que una carga no contamine la siguiente', async () => {
    vi.doMock('@/core/config/env', () => ({ USE_MOCKS: true }))
    vi.doMock('@/core/api/api', () => ({ default: { get: vi.fn() } }))
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { obtenerDashboard } = await import('@/modules/dashboard/services/dashboard.service')
    await import('@/modules/dashboard/mocks/dashboard.mock')

    const primeraPeticion = obtenerDashboard()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(300)
    const primeraCarga = await primeraPeticion
    primeraCarga.metricas[0].valor = -1

    const segundaPeticion = obtenerDashboard()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(300)
    const segundaCarga = await segundaPeticion

    expect(segundaCarga.metricas[0].valor).toBe(14)
  })

  it('consulta GET /dashboard y normaliza la respuesta cuando los mocks están desactivados', async () => {
    const get = vi.fn().mockResolvedValue({ data: RESPUESTA_API })
    vi.doMock('@/core/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/core/api/api', () => ({ default: { get } }))
    const { obtenerDashboard } = await import('@/modules/dashboard/services/dashboard.service')

    const resumen = await obtenerDashboard()

    expect(get).toHaveBeenCalledOnce()
    expect(get).toHaveBeenCalledWith('/dashboard')
    expect(resumen).toEqual({
      ...RESPUESTA_API.dashboard,
      banner: {
        ...RESPUESTA_API.dashboard.banner,
        accion: { texto: 'Ver usuarios' },
      },
      metricas: [
        {
          ...RESPUESTA_API.dashboard.metricas[0],
          tendencia: {
            prefijo: '',
            sufijo: '',
            ...RESPUESTA_API.dashboard.metricas[0].tendencia,
          },
        },
      ],
    })
  })

  it('normaliza listas ausentes como vacías sin romper el estado vacío', async () => {
    const get = vi.fn().mockResolvedValue({
      data: { banner: { titulo: 'Resumen' } },
    })
    vi.doMock('@/core/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/core/api/api', () => ({ default: { get } }))
    const { obtenerDashboard } = await import('@/modules/dashboard/services/dashboard.service')

    const resumen = await obtenerDashboard()

    expect(resumen.metricas).toEqual([])
    expect(resumen.progreso.etiquetas).toEqual([])
    expect(resumen.progreso.valores).toEqual([])
    expect(resumen.ejerciciosPopulares).toEqual([])
    expect(resumen.actividadReciente).toEqual([])
  })
})
