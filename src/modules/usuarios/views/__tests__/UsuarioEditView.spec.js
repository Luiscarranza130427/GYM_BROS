import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import UsuarioEditView from '@/modules/usuarios/views/UsuarioEditView.vue'
import {
  actualizarUsuario,
  obtenerOpcionesEmpresas,
  obtenerUsuario,
} from '@/modules/usuarios/services/usuarios.service'

const route = reactive({ params: { id: '7' } })
const push = vi.fn(() => Promise.resolve())

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

vi.mock('@/modules/usuarios/services/usuarios.service', () => ({
  actualizarUsuario: vi.fn(),
  obtenerOpcionesEmpresas: vi.fn(),
  obtenerUsuario: vi.fn(),
}))

const USUARIO = { id: 7, nombre: 'Juan', apellido: 'Pérez' }
const montar = () =>
  mount(UsuarioEditView, {
    global: {
      stubs: {
        PageHeader: true,
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
        UsuarioForm: {
          name: 'UsuarioForm',
          props: ['usuarioInicial', 'empresas', 'enviando', 'erroresServidor'],
          emits: ['submit', 'cancel'],
          template:
            "<div data-form><button data-save @click=\"$emit('submit', { nombre: 'Juan' })\">Guardar</button><button data-cancel @click=\"$emit('cancel')\">Cancelar</button></div>",
        },
      },
    },
  })

describe('UsuarioEditView', () => {
  beforeEach(() => {
    route.params.id = '7'
    push.mockReset().mockResolvedValue(undefined)
    actualizarUsuario.mockReset()
    obtenerOpcionesEmpresas.mockReset().mockResolvedValue([{ id: 1 }])
    obtenerUsuario.mockReset().mockResolvedValue(USUARIO)
  })

  it('carga el usuario y guarda los cambios', async () => {
    actualizarUsuario.mockResolvedValue({ id: 7 })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.getComponent({ name: 'UsuarioForm' }).props('usuarioInicial')).toEqual(USUARIO)
    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(actualizarUsuario).toHaveBeenCalledWith('7', { nombre: 'Juan' })
    expect(push).toHaveBeenCalledWith({
      name: 'usuario-detalle',
      params: { id: 7 },
      query: { notice: 'updated' },
    })
  })

  it.each([
    [{ status: 404, message: 'No existe.' }, 'Usuario no encontrado', 'status'],
    [new Error('Servidor caído.'), 'No pudimos cargar el usuario', 'alert'],
  ])('distingue los errores de carga', async (error, titulo, rol) => {
    obtenerUsuario.mockRejectedValue(error)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain(titulo)
    expect(wrapper.get(`[role="${rol}"]`).exists()).toBe(true)
  })

  it('permite reintentar una carga recuperable', async () => {
    obtenerUsuario.mockRejectedValueOnce(new Error('Temporal')).mockResolvedValueOnce(USUARIO)
    const wrapper = montar()
    await flushPromises()
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-form]').exists()).toBe(true)
  })

  it('conserva el formulario ante un 422 y cambia a no encontrado ante un 404 al guardar', async () => {
    actualizarUsuario
      .mockRejectedValueOnce({ status: 422, message: 'Documento duplicado.' })
      .mockRejectedValueOnce({ status: 404, message: 'El usuario ya no existe.' })
    const wrapper = montar()
    await flushPromises()

    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Documento duplicado.')

    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Usuario no encontrado')
  })
})
