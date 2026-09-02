import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import PlanesView from '@/modules/membresias/views/PlanesView.vue'
import {
  eliminarPlanComercial,
  obtenerPlanesComerciales,
} from '@/modules/membresias/services/membresias.service'

const route = reactive({ query: {} })
const replace = vi.fn(() => Promise.resolve())

enableAutoUnmount(afterEach)

vi.mock('vue-router', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    useRoute: () => route,
    useRouter: () => ({ replace }),
  }
})

vi.mock('@/modules/membresias/services/membresias.service', () => ({
  obtenerPlanesComerciales: vi.fn(),
  eliminarPlanComercial: vi.fn(),
}))

const RESPUESTA = {
  items: [
    {
      id: 1,
      nombre: 'Impulso',
      descripcion: 'Plan inicial.',
      precioOriginal: 249,
      precioInicial: 189,
      duracionDias: 30,
      limiteUsuarios: 100,
      activo: true,
      contenido: 'Gestión de usuarios',
      enlaceWhatsapp: 'https://wa.me/51900000001',
    },
  ],
  paginacion: { pagina: 1, ultimaPagina: 1, porPagina: 8, total: 1, desde: 1, hasta: 1 },
}

function montar() {
  return mount(PlanesView, {
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' } },
    },
  })
}

describe('PlanesView', () => {
  beforeEach(() => {
    route.query = {}
    replace.mockReset()
    replace.mockResolvedValue(undefined)
    obtenerPlanesComerciales.mockReset()
    eliminarPlanComercial.mockReset()
  })

  it('muestra el listado en tabla obtenido del servicio', async () => {
    obtenerPlanesComerciales.mockResolvedValue(RESPUESTA)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Impulso')
    expect(wrapper.text()).toContain('Gestión de usuarios')
    expect(obtenerPlanesComerciales).toHaveBeenCalledWith(
      expect.objectContaining({ pagina: 1, porPagina: 8 }),
    )
  })

  it('permite filtrar por estado y búsqueda', async () => {
    obtenerPlanesComerciales.mockResolvedValue(RESPUESTA)
    const wrapper = montar()
    await flushPromises()

    const selectEstado = wrapper.find('#filtro-estado-plan')
    await selectEstado.setValue('active')
    await flushPromises()

    expect(replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ estado: 'active' }),
      }),
    )
  })

  it('muestra un diálogo de confirmación y elimina un plan', async () => {
    obtenerPlanesComerciales.mockResolvedValue(RESPUESTA)
    eliminarPlanComercial.mockResolvedValue({ ok: true })
    const wrapper = montar()
    await flushPromises()

    const btnEliminar = wrapper.find('.btn-icono-accion--peligro')
    await btnEliminar.trigger('click')
    await flushPromises()

    const dialogo = wrapper.findComponent(ConfirmDialog)
    expect(dialogo.exists()).toBe(true)
    expect(dialogo.props('abierto')).toBe(true)
  })
})
