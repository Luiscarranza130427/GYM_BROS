import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ComidaEditView from '@/modules/alimentacion/views/ComidaEditView.vue'
import {
  actualizarComida,
  obtenerAlimentosParaElegir,
  obtenerPlan,
} from '@/modules/alimentacion/services/alimentacion.service'

const route = reactive({ params: { idPlan: '3', idComida: '8' } })
const push = vi.fn(() => Promise.resolve())

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

vi.mock('@/modules/alimentacion/services/alimentacion.service', () => ({
  actualizarComida: vi.fn(),
  obtenerAlimentosParaElegir: vi.fn(),
  obtenerPlan: vi.fn(),
}))

const COMIDA = { id: 8, nombre: 'Cena', tipoComida: 'cena', horaSugerida: '20:00' }
const PLAN = { id: 3, usuario: { nombre: 'Ana' }, comidas: [COMIDA] }
const montar = () =>
  mount(ComidaEditView, {
    global: {
      stubs: {
        PageHeader: true,
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
        ComidaForm: {
          name: 'ComidaForm',
          props: ['valoresIniciales', 'erroresServidor', 'catalogo', 'errorCatalogo'],
          emits: ['submit', 'cancel', 'recargar-catalogo'],
          template:
            "<div data-form><button data-save @click=\"$emit('submit', { nombre: 'Cena ligera' })\">Guardar</button><button data-cancel @click=\"$emit('cancel')\">Cancelar</button></div>",
        },
      },
    },
  })

describe('ComidaEditView', () => {
  beforeEach(() => {
    route.params = { idPlan: '3', idComida: '8' }
    push.mockReset().mockResolvedValue(undefined)
    actualizarComida.mockReset()
    obtenerPlan.mockReset().mockResolvedValue(PLAN)
    obtenerAlimentosParaElegir.mockReset().mockResolvedValue([])
  })

  it('localiza la comida dentro del plan y guarda sus cambios', async () => {
    actualizarComida.mockResolvedValue(COMIDA)
    const wrapper = montar()
    await flushPromises()
    expect(wrapper.getComponent({ name: 'ComidaForm' }).props('valoresIniciales')).toEqual(COMIDA)

    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(actualizarComida).toHaveBeenCalledWith('3', '8', { nombre: 'Cena ligera' })
    expect(push).toHaveBeenCalledWith({
      name: 'plan-alimentacion-detalle',
      params: { id: '3' },
      query: { notice: 'updated' },
    })
  })

  it('muestra no encontrado si la comida no pertenece al plan', async () => {
    obtenerPlan.mockResolvedValue({ ...PLAN, comidas: [] })
    const wrapper = montar()
    await flushPromises()
    expect(wrapper.text()).toContain('Comida no encontrada')
    expect(wrapper.find('[data-form]').exists()).toBe(false)
  })

  it('permite reintentar un error de carga y tolera el fallo auxiliar del catálogo', async () => {
    obtenerPlan.mockRejectedValueOnce(new Error('Temporal')).mockResolvedValueOnce(PLAN)
    obtenerAlimentosParaElegir.mockRejectedValue(new Error('Sin catálogo'))
    const wrapper = montar()
    await flushPromises()
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-form]').exists()).toBe(true)
    expect(wrapper.getComponent({ name: 'ComidaForm' }).props('errorCatalogo')).toBe('Sin catálogo')
  })

  it('distingue validación, regla de negocio y recurso eliminado al guardar', async () => {
    actualizarComida
      .mockRejectedValueOnce({ status: 422, errors: { nombre: ['Inválido.'] } })
      .mockRejectedValueOnce({ status: 422, message: 'Horario duplicado.' })
      .mockRejectedValueOnce({ status: 404, message: 'Ya no existe.' })
    const wrapper = montar()
    await flushPromises()

    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(wrapper.getComponent({ name: 'ComidaForm' }).props('erroresServidor')).toEqual({
      nombre: ['Inválido.'],
    })
    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Horario duplicado.')
    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Comida no encontrada')
  })
})
