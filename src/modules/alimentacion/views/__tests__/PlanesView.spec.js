import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PlanesView from '@/modules/alimentacion/views/PlanesView.vue'
import { obtenerEmpresasConPlanes, obtenerPlanes } from '@/services/alimentacion.service'

const route = reactive({ query: {} })
const replace = vi.fn(() => Promise.resolve())

enableAutoUnmount(afterEach)

vi.mock('vue-router', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    useRoute: () => route,
    useRouter: () => ({ replace, push: vi.fn(() => Promise.resolve()) }),
  }
})

vi.mock('@/services/alimentacion.service', () => ({
  obtenerPlanes: vi.fn(),
  obtenerEmpresasConPlanes: vi.fn(),
}))

const PLAN = {
  id: 3,
  usuario: { id: 2, nombre: 'Andrea Mendoza' },
  empresa: { id: 1, nombre: 'Power Gym' },
  objetivo: 'Ganar masa muscular',
  fechaInicio: '2026-07-27',
  fechaFin: '2026-09-27',
  activo: true,
  objetivos: { calorias: 1950, proteinas: 135, carbohidratos: 200, grasas: 63 },
  totalComidas: 4,
  macros: { calorias: 1205, proteinas: 98, carbohidratos: 150, grasas: 40, fibra: 20 },
}

const RESPUESTA = {
  items: [PLAN],
  paginacion: { pagina: 1, ultimaPagina: 1, porPagina: 10, total: 1, desde: 1, hasta: 1 },
}

function montar() {
  return mount(PlanesView, {
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
        Teleport: true,
      },
    },
  })
}

describe('PlanesView', () => {
  beforeEach(() => {
    route.query = {}
    replace.mockReset()
    replace.mockResolvedValue(undefined)
    obtenerPlanes.mockReset()
    obtenerEmpresasConPlanes.mockReset()
    obtenerEmpresasConPlanes.mockResolvedValue([{ id: 1, nombre: 'Power Gym' }])
  })

  it('muestra el plan con su usuario y su empresa', async () => {
    obtenerPlanes.mockResolvedValue(RESPUESTA)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Andrea Mendoza')
    expect(wrapper.text()).toContain('Power Gym')
  })

  /*
   * Las claves de la query van en inglés como en el resto del panel; el
   * vocabulario del servicio es el del dominio, en español. La traducción entre
   * ambos vive aquí y es justo lo que se fija.
   */
  it('traduce los filtros de la URL al vocabulario del servicio', async () => {
    route.query = { status: 'activo', company: '2' }
    obtenerPlanes.mockResolvedValue(RESPUESTA)
    montar()
    await flushPromises()

    expect(obtenerPlanes).toHaveBeenCalledWith(
      expect.objectContaining({ situacion: 'activo', empresaId: '2' }),
    )
  })

  it('convierte «Todos» en un filtro vacío, no en el literal «all»', async () => {
    route.query = { status: 'all' }
    obtenerPlanes.mockResolvedValue(RESPUESTA)
    montar()
    await flushPromises()

    // Enviar 'all' devolvería cero filas: el mock compara por igualdad y ningún
    // plan tiene esa situación.
    expect(obtenerPlanes).toHaveBeenCalledWith(expect.objectContaining({ situacion: '' }))
  })

  it('un valor inventado en la URL no llega al servicio', async () => {
    route.query = { status: 'caducado' }
    obtenerPlanes.mockResolvedValue(RESPUESTA)
    montar()
    await flushPromises()

    expect(obtenerPlanes).toHaveBeenCalledWith(expect.objectContaining({ situacion: '' }))
  })

  it('un fallo de carga sustituye el listado', async () => {
    obtenerPlanes.mockRejectedValue({ message: 'La red no responde.' })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.find('.tabla').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('sigue siendo utilizable si no se pueden traer las empresas del filtro', async () => {
    obtenerPlanes.mockResolvedValue(RESPUESTA)
    obtenerEmpresasConPlanes.mockRejectedValue(new Error('500'))

    const wrapper = montar()
    await flushPromises()

    // Es dato auxiliar del filtro: su fallo no puede tumbar el listado.
    expect(wrapper.find('.tabla').exists()).toBe(true)
    expect(wrapper.text()).toContain('Andrea Mendoza')
  })

  it('distingue «no hay nada» de «no hay resultados con estos filtros»', async () => {
    const vacio = {
      items: [],
      paginacion: { pagina: 1, ultimaPagina: 1, porPagina: 10, total: 0, desde: 0, hasta: 0 },
    }

    obtenerPlanes.mockResolvedValue(vacio)
    const sinFiltros = montar()
    await flushPromises()
    const textoSinFiltros = sinFiltros.text()

    route.query = { status: 'inactivo' }
    const conFiltros = montar()
    await flushPromises()

    // Decir «todavía no hay planes» cuando el usuario acaba de filtrar es
    // mentirle: pensaría que no existen, no que su filtro no encuentra nada.
    expect(conFiltros.text()).not.toBe(textoSinFiltros)
    expect(conFiltros.text().toLowerCase()).toMatch(/filtro/)
  })
})
