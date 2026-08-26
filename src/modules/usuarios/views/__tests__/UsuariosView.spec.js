import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import UsuariosView from '@/modules/usuarios/views/UsuariosView.vue'
import { obtenerOpcionesEmpresas, obtenerUsuarios } from '@/services/usuarios.service'

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

vi.mock('@/services/usuarios.service', () => ({
  obtenerUsuarios: vi.fn(),
  obtenerOpcionesEmpresas: vi.fn(),
  desactivarUsuario: vi.fn(),
}))

const RESPUESTA = {
  items: [
    {
      id: 1,
      nombre: 'Carlos',
      apellido: 'Ramírez',
      correo: 'carlos@gymbros.test',
      tipoDocumento: 'dni',
      numeroDocumento: '71000001',
      empresa: { id: 1, nombre: 'Power Gym' },
      rol: 'member',
      estado: 'active',
      fechaRegistro: '2026-01-10',
      fotoPerfil: '',
      suscripcion: { estado: 'active', diasRestantes: 14 },
    },
  ],
  paginacion: { pagina: 1, ultimaPagina: 1, porPagina: 8, total: 1, desde: 1, hasta: 1 },
}

function montar() {
  return mount(UsuariosView, {
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
        Teleport: true,
      },
    },
  })
}

describe('UsuariosView', () => {
  beforeEach(() => {
    route.query = {}
    replace.mockReset()
    obtenerUsuarios.mockReset()
    obtenerOpcionesEmpresas.mockReset().mockResolvedValue([{ id: 1, nombre: 'Power Gym' }])
  })

  it('renderiza skeletons y después el listado paginado', async () => {
    let resolver
    obtenerUsuarios.mockReturnValue(new Promise((resolve) => (resolver = resolve)))
    const wrapper = montar()
    expect(wrapper.findAll('.tabla__skeleton')).toHaveLength(6)

    resolver(RESPUESTA)
    await flushPromises()
    expect(wrapper.text()).toContain('Carlos Ramírez')
    expect(wrapper.text()).toContain('Mostrando 1–1 de 1 usuarios')
  })

  it('distingue el vacío filtrado y limpia todos los filtros', async () => {
    route.query = { search: 'usuario-imposible-xyz', company: '1' }
    obtenerUsuarios.mockResolvedValue({
      items: [],
      paginacion: { ...RESPUESTA.paginacion, total: 0, desde: 0, hasta: 0 },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('No encontramos usuarios')
    await wrapper.get('.usuarios__estado button').trigger('click')
    expect(replace).toHaveBeenCalledWith({ name: 'usuarios-listado' })
  })

  it('conserva la búsqueda a medio escribir al cambiar un filtro', async () => {
    // La URL va por detrás de la caja: refleja un rebote anterior ('car'),
    // mientras el usuario ya ha escrito 'carlos'.
    vi.useFakeTimers()
    route.query = { search: 'car' }
    obtenerUsuarios.mockResolvedValue(RESPUESTA)
    // Se imita al router de verdad: una navegación cambia la ruta y eso vuelve
    // a disparar la carga. Sin esto el fallo no se reproduce.
    replace.mockImplementation(({ query = {} }) => {
      route.query = query
    })

    const wrapper = montar()
    await flushPromises()

    await wrapper.get('#buscar-usuario').setValue('carlos')
    await wrapper.get('#filtro-estado').setValue('active')
    await flushPromises()

    // La caja conserva lo tecleado en lugar de revertir al 'car' de la URL...
    expect(wrapper.get('#buscar-usuario').element.value).toBe('carlos')
    // ...y se navega una sola vez, llevando búsqueda y filtro juntos.
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith({
      name: 'usuarios-listado',
      query: { search: 'carlos', status: 'active' },
    })

    // El rebote pendiente quedó cancelado: no hay una segunda navegación tardía.
    vi.advanceTimersByTime(1000)
    await flushPromises()
    expect(replace).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('muestra un error recuperable y permite reintentar', async () => {
    obtenerUsuarios
      .mockRejectedValueOnce(new Error('Servicio no disponible.'))
      .mockResolvedValueOnce(RESPUESTA)
    const wrapper = montar()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Servicio no disponible.')

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(obtenerUsuarios).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Carlos Ramírez')
  })
})
