import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UsuarioForm from '@/modules/usuarios/components/UsuarioForm.vue'

const EMPRESAS = [{ id: 1, nombre: 'Power Gym' }]

async function completarFormulario(wrapper) {
  await wrapper.get('#usuario-nombre').setValue('Carlos')
  await wrapper.get('#usuario-apellido').setValue('Ramírez')
  await wrapper.get('#usuario-correo').setValue('carlos.nuevo@gymbros.test')
  await wrapper.get('#usuario-telefono').setValue('+51 987654321')
  await wrapper.get('#usuario-documento').setValue('76543210')
  await wrapper.get('#usuario-empresa').setValue('1')
  await wrapper.get('#usuario-rol').setValue('member')
}

describe('UsuarioForm', () => {
  it('muestra validaciones requeridas y no envía datos incompletos', async () => {
    const wrapper = mount(UsuarioForm, { props: { empresas: EMPRESAS } })

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Introduce un nombre')
    expect(wrapper.text()).toContain('Introduce un apellido')
    expect(wrapper.text()).toContain('Introduce un correo válido')
    expect(wrapper.text()).toContain('Selecciona una empresa')
  })

  it('normaliza y emite un usuario válido', async () => {
    const wrapper = mount(UsuarioForm, { props: { empresas: EMPRESAS } })
    await completarFormulario(wrapper)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')[0][0]).toEqual(
      expect.objectContaining({
        nombre: 'Carlos',
        apellido: 'Ramírez',
        correo: 'carlos.nuevo@gymbros.test',
        tipoDocumento: 'dni',
        numeroDocumento: '76543210',
        empresaId: 1,
        rol: 'member',
        estado: 'active',
      }),
    )
  })

  it('asocia errores 422 del servidor con sus campos', async () => {
    const wrapper = mount(UsuarioForm, {
      props: {
        empresas: EMPRESAS,
        erroresServidor: {
          correo: ['El correo ya se encuentra registrado.'],
          numeroDocumento: ['El documento ya está registrado.'],
        },
      },
    })

    expect(wrapper.get('#usuario-correo').attributes('aria-describedby')).toBe('error-correo')
    expect(wrapper.get('#usuario-documento').attributes('aria-describedby')).toBe(
      'error-documento',
    )
    expect(wrapper.text()).toContain('El correo ya se encuentra registrado.')
    expect(wrapper.text()).toContain('El documento ya está registrado.')
  })

  it('rechaza un DNI y una fecha futura inválidos', async () => {
    const wrapper = mount(UsuarioForm, { props: { empresas: EMPRESAS } })
    await completarFormulario(wrapper)
    await wrapper.get('#usuario-documento').setValue('123')
    await wrapper.get('#usuario-nacimiento').setValue('2999-01-01')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('exactamente 8 dígitos')
    expect(wrapper.text()).toContain('no puede ser futura')
  })
})
