import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ComidaCreateView from '@/modules/alimentacion/views/ComidaCreateView.vue'
import {
  crearComida,
  obtenerAlimentosParaElegir,
  obtenerPlan,
} from '@/modules/alimentacion/services/alimentacion.service'

const route = reactive({ params: { idPlan: '3' } })
const push = vi.fn(() => Promise.resolve())

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

vi.mock('@/modules/alimentacion/services/alimentacion.service', () => ({
  crearComida: vi.fn(),
  obtenerAlimentosParaElegir: vi.fn(),
  obtenerPlan: vi.fn(),
}))

const montar = () =>
  mount(ComidaCreateView, {
    global: {
      stubs: {
        PageHeader: true,
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
        ComidaForm: {
          name: 'ComidaForm',
          props: ['erroresServidor', 'catalogo', 'errorCatalogo'],
          emits: ['submit', 'cancel', 'recargar-catalogo'],
          template:
            "<div data-form><button data-save @click=\"$emit('submit', { nombre: 'Cena' })\">Guardar</button><button data-cancel @click=\"$emit('cancel')\">Cancelar</button><button data-reload @click=\"$emit('recargar-catalogo')\">Catálogo</button></div>",
        },
      },
    },
  })

describe('ComidaCreateView', () => {
  beforeEach(() => {
    route.params.idPlan = '3'
    push.mockReset().mockResolvedValue(undefined)
    crearComida.mockReset()
    obtenerPlan.mockReset().mockResolvedValue({ id: 3, usuario: { nombre: 'Ana' } })
    obtenerAlimentosParaElegir.mockReset().mockResolvedValue([{ id: 1, nombre: 'Avena' }])
  })

  it('carga los recursos, crea la comida y vuelve al plan', async () => {
    crearComida.mockResolvedValue({ id: 8 })
    const wrapper = montar()
    await flushPromises()
    expect(wrapper.getComponent({ name: 'ComidaForm' }).props('catalogo')).toHaveLength(1)

    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(crearComida).toHaveBeenCalledWith('3', { nombre: 'Cena' })
    expect(push).toHaveBeenCalledWith({
      name: 'plan-alimentacion-detalle',
      params: { id: '3' },
      query: { notice: 'created' },
    })
  })

  it('mantiene el formulario si falla el catálogo y permite recargarlo', async () => {
    obtenerAlimentosParaElegir
      .mockRejectedValueOnce(new Error('Catálogo caído'))
      .mockResolvedValueOnce([])
    const wrapper = montar()
    await flushPromises()
    expect(wrapper.getComponent({ name: 'ComidaForm' }).props('errorCatalogo')).toBe(
      'Catálogo caído',
    )
    await wrapper.get('[data-reload]').trigger('click')
    await flushPromises()
    expect(obtenerAlimentosParaElegir).toHaveBeenCalledTimes(2)
  })

  it('distingue un plan inexistente de un error recuperable', async () => {
    obtenerPlan.mockRejectedValueOnce({ status: 404, message: 'No existe.' })
    let wrapper = montar()
    await flushPromises()
    expect(wrapper.text()).toContain('Plan no encontrado')
    wrapper.unmount()

    obtenerPlan.mockRejectedValueOnce(new Error('Temporal')).mockResolvedValueOnce({ id: 3 })
    wrapper = montar()
    await flushPromises()
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-form]').exists()).toBe(true)
  })

  it('muestra el mensaje de negocio de un 422 sin perder el formulario', async () => {
    crearComida.mockRejectedValue({ status: 422, message: 'Horario duplicado.' })
    const wrapper = montar()
    await flushPromises()
    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Horario duplicado.')
    expect(wrapper.find('[data-form]').exists()).toBe(true)
  })
})
