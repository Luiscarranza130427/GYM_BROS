import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EjerciciosView from '@/modules/ejercicios/views/EjerciciosView.vue'
import {
  desactivarEjercicio,
  obtenerEjercicios,
} from '@/modules/ejercicios/services/ejercicios.service'

const route = reactive({ query: {} })
const replace = vi.fn()

enableAutoUnmount(afterEach)

vi.mock('vue-router', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    useRoute: () => route,
    useRouter: () => ({ replace, push: vi.fn() }),
  }
})

vi.mock('@/modules/ejercicios/services/ejercicios.service', () => ({
  obtenerEjercicios: vi.fn(),
  desactivarEjercicio: vi.fn(),
}))

const RESPUESTA = {
  items: [
    {
      id: 1,
      nombre: 'Press de banca',
      categoria: 'pecho',
      nivel: 'intermedio',
      equipo: 'barra',
      descripcion: 'Empuje horizontal.',
      seriesSugeridas: 4,
      repeticionesSugeridas: 8,
      usos: 154,
      estado: 'active',
      fechaRegistro: '2026-01-15',
    },
  ],
  paginacion: { pagina: 1, ultimaPagina: 1, porPagina: 8, total: 1, desde: 1, hasta: 1 },
}

function montar() {
  return mount(EjerciciosView, {
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
        Teleport: true,
      },
    },
  })
}

describe('EjerciciosView', () => {
  beforeEach(() => {
    route.query = {}
    replace.mockReset()
    obtenerEjercicios.mockReset()
    desactivarEjercicio.mockReset()
  })

  it('muestra el listado con sus etiquetas en español', async () => {
    obtenerEjercicios.mockResolvedValue(RESPUESTA)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Press de banca')
    // El catálogo guarda 'pecho'/'barra'; la tabla muestra la etiqueta legible.
    expect(wrapper.text()).toContain('Pecho')
    expect(wrapper.text()).toContain('Barra')
  })

  it('traduce los filtros al vocabulario del servicio', async () => {
    route.query = { category: 'piernas', level: 'avanzado', equipment: 'barra', status: 'active' }
    obtenerEjercicios.mockResolvedValue(RESPUESTA)
    montar()
    await flushPromises()

    expect(obtenerEjercicios).toHaveBeenCalledWith(
      expect.objectContaining({
        categoria: 'piernas',
        nivel: 'avanzado',
        equipo: 'barra',
        estado: 'active',
      }),
    )
  })

  it('descarta un valor inventado en la URL antes de llegar al servicio', async () => {
    // Sin `permitidos`, un `?level=` cualquiera viajaría al backend.
    route.query = { level: 'sobrehumano' }
    obtenerEjercicios.mockResolvedValue(RESPUESTA)
    montar()
    await flushPromises()

    expect(obtenerEjercicios).toHaveBeenCalledWith(expect.objectContaining({ nivel: '' }))
  })

  it('distingue el vacío filtrado y permite limpiar', async () => {
    route.query = { search: 'no-existe', category: 'core' }
    obtenerEjercicios.mockResolvedValue({
      items: [],
      paginacion: { ...RESPUESTA.paginacion, total: 0, desde: 0, hasta: 0 },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toMatch(/No encontramos|sin resultados/i)
    await wrapper.get('.ejercicios__estado button').trigger('click')
    expect(replace).toHaveBeenCalledWith({ name: 'ejercicios-listado' })
  })

  it('muestra un error recuperable y reintenta', async () => {
    obtenerEjercicios
      .mockRejectedValueOnce(new Error('Servicio no disponible.'))
      .mockResolvedValueOnce(RESPUESTA)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Servicio no disponible.')

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(obtenerEjercicios).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Press de banca')
  })

  it('conserva la búsqueda a medio escribir al cambiar un filtro', async () => {
    // La misma regresión que ya se corrigió en Empresas y Usuarios: al venir del
    // composable compartido, debe cumplirse aquí sin escribir una línea más.
    vi.useFakeTimers()
    route.query = { search: 'pre' }
    obtenerEjercicios.mockResolvedValue(RESPUESTA)
    replace.mockImplementation(({ query = {} }) => {
      route.query = query
    })

    const wrapper = montar()
    await flushPromises()

    await wrapper.get('#buscar-ejercicio').setValue('press')
    await wrapper.get('#filtro-nivel').setValue('avanzado')
    await flushPromises()

    expect(wrapper.get('#buscar-ejercicio').element.value).toBe('press')
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith({
      name: 'ejercicios-listado',
      query: { search: 'press', level: 'avanzado' },
    })

    vi.advanceTimersByTime(1000)
    await flushPromises()
    expect(replace).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
