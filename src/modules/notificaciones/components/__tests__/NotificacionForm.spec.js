import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import NotificacionForm from '@/modules/notificaciones/components/NotificacionForm.vue'

vi.mock('@/modules/empresas/services/empresas.service', () => ({
  obtenerEmpresas: vi.fn().mockResolvedValue({
    items: [
      { id: 1, nombre: 'Iron Gym' },
      { id: 2, nombre: 'Powerhouse' },
    ],
  }),
}))

vi.mock('@/modules/usuarios/services/usuarios.service', () => ({
  obtenerUsuarios: vi.fn().mockResolvedValue({
    items: [
      { id: 10, nombre: 'Carlos Mendoza', correo: 'carlos@gym.com', idEmpresas: 1 },
      { id: 20, nombre: 'Lucía Torres', correo: 'lucia@gym.com', idEmpresas: 2 },
    ],
  }),
}))

function montar(props = {}) {
  return mount(NotificacionForm, {
    props,
  })
}

describe('NotificacionForm', () => {
  it('exige título y mensaje antes de emitir', async () => {
    const wrapper = montar()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('#error-titulo').text()).toContain('título')
    expect(wrapper.get('#error-mensaje').text()).toContain('mensaje')
  })

  it('emite payload de notificación inmediata cuando los campos son válidos', async () => {
    const wrapper = montar()

    await wrapper.get('#notif-titulo').setValue('Aviso de mantenimiento')
    await wrapper.get('#notif-mensaje').setValue('El gimnasio abrirá a las 08:00 mañana.')

    await wrapper.get('form').trigger('submit')

    const emitido = wrapper.emitted('submit')
    expect(emitido).toBeDefined()
    expect(emitido[0][0]).toMatchObject({
      tipo: 'recordatorio',
      titulo: 'Aviso de mantenimiento',
      mensaje: 'El gimnasio abrirá a las 08:00 mañana.',
      programar: false,
      fechaEnvio: null,
      idEmpresas: null,
      idUsuarios: null,
    })
  })

  it('exige empresa destinataria cuando el alcance es por empresa', async () => {
    const wrapper = montar()

    const radioEmpresa = wrapper.findAll('input[name="alcance"]')[1]
    await radioEmpresa.setValue(true)

    await wrapper.get('#notif-titulo').setValue('Aviso a sede')
    await wrapper.get('#notif-mensaje').setValue('Contenido para toda la empresa.')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('#error-empresa').text()).toContain('Selecciona una empresa')
  })

  it('exige fecha futura cuando se activa la programación', async () => {
    const wrapper = montar()

    await wrapper.get('#notif-titulo').setValue('Aviso programado')
    await wrapper.get('#notif-mensaje').setValue('Contenido que se enviará más adelante.')

    const checkboxProgramar = wrapper.get('input[name="programar"]')
    await checkboxProgramar.setValue(true)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('#error-fecha').text()).toContain('fecha y hora')
  })
})
