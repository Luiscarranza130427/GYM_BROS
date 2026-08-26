import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EmpresasView from '@/modules/empresas/views/EmpresasView.vue'
import { obtenerEmpresas } from '@/services/empresas.service'

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

vi.mock('@/services/empresas.service', () => ({
  obtenerEmpresas: vi.fn(),
  desactivarEmpresa: vi.fn(),
}))

const RESPUESTA = {
  items: [
    {
      id: 1,
      nombre: 'Power Gym',
      gerente: 'Mariana Torres',
      ruc: '20100000001',
      correo: 'contacto@powergym.test',
      telefono: '+51 910000001',
      region: 'Lima',
      direccion: 'Av. Arequipa 1840',
      sitioWeb: 'https://powergym.example',
      estado: 'active',
      usuarios: 86,
      fechaRegistro: '2024-01-15',
      logoUrl: '',
    },
  ],
  paginacion: {
    pagina: 1,
    ultimaPagina: 1,
    porPagina: 8,
    total: 1,
    desde: 1,
    hasta: 1,
  },
}

const RouterLinkStub = {
  props: ['to'],
  template: '<a href="#"><slot /></a>',
}

function montar() {
  return mount(EmpresasView, {
    global: { stubs: { RouterLink: RouterLinkStub, Teleport: true } },
  })
}

describe('EmpresasView', () => {
  beforeEach(() => {
    route.query = {}
    replace.mockReset()
    obtenerEmpresas.mockReset()
  })

  it('muestra filas skeleton mientras el servicio está cargando', () => {
    obtenerEmpresas.mockReturnValue(new Promise(() => {}))
    const wrapper = montar()

    expect(wrapper.findAll('.tabla__skeleton')).toHaveLength(6)
  })

  it('renderiza el listado normalizado', async () => {
    obtenerEmpresas.mockResolvedValue(RESPUESTA)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Power Gym')
    expect(wrapper.text()).toContain('Mostrando 1–1 de 1 empresas')
  })

  it('distingue el vacío por filtros y permite limpiarlos', async () => {
    route.query = { search: 'empresa-imposible-12345' }
    obtenerEmpresas.mockResolvedValue({
      items: [],
      paginacion: { ...RESPUESTA.paginacion, total: 0, desde: 0, hasta: 0 },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('No encontramos resultados')
    await wrapper.get('.empresas__estado button').trigger('click')
    expect(replace).toHaveBeenCalledWith({ name: 'empresas-listado' })
  })

  it('muestra el estado vacío general sin sugerir limpiar filtros', async () => {
    obtenerEmpresas.mockResolvedValue({
      items: [],
      paginacion: { ...RESPUESTA.paginacion, total: 0, desde: 0, hasta: 0 },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Aún no hay empresas registradas')
    expect(wrapper.text()).toContain('Registra tu primera empresa')
    expect(wrapper.text()).not.toContain('Limpiar filtros')
  })

  it('muestra error y reintenta la carga', async () => {
    obtenerEmpresas
      .mockRejectedValueOnce(new Error('Servicio no disponible.'))
      .mockResolvedValueOnce(RESPUESTA)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Servicio no disponible.')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(obtenerEmpresas).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Power Gym')
  })
})
