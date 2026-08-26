import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmpresaForm from '@/modules/empresas/components/EmpresaForm.vue'

async function completarFormulario(wrapper) {
  await wrapper.get('#empresa-nombre').setValue('Nova Fitness')
  await wrapper.get('#empresa-gerente').setValue('Andrea Morales')
  await wrapper.get('#empresa-correo').setValue('contacto@novafitness.test')
  await wrapper.get('#empresa-telefono').setValue('+51 987 654 321')
  await wrapper.get('#empresa-ruc').setValue('20987654321')
  await wrapper.get('#empresa-web').setValue('https://novafitness.example')
}

describe('EmpresaForm', () => {
  it('muestra validaciones accesibles para campos obligatorios e inválidos', async () => {
    const wrapper = mount(EmpresaForm)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Introduce un nombre de al menos 3 caracteres')
    expect(wrapper.text()).toContain('Introduce el nombre del gerente')
    expect(wrapper.text()).toContain('Introduce un correo válido')
    expect(wrapper.get('#empresa-correo').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#empresa-correo').attributes('aria-describedby')).toBe('error-correo')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emite un payload limpio cuando el formulario es válido', async () => {
    const wrapper = mount(EmpresaForm)
    await completarFormulario(wrapper)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')[0][0]).toEqual(
      expect.objectContaining({
        nombre: 'Nova Fitness',
        correo: 'contacto@novafitness.test',
        estado: 'active',
        sitioWeb: 'https://novafitness.example',
      }),
    )
  })

  it('impide otro envío mientras la operación está en curso', async () => {
    const wrapper = mount(EmpresaForm, { props: { enviando: true } })
    await completarFormulario(wrapper)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('presenta y asocia errores 422 recibidos por campo', () => {
    const wrapper = mount(EmpresaForm, {
      props: { erroresServidor: { correo: ['El correo ya se encuentra registrado.'] } },
    })

    expect(wrapper.text()).toContain('El correo ya se encuentra registrado.')
    expect(wrapper.get('#empresa-correo').attributes('aria-describedby')).toBe('error-correo')
  })

  it('rechaza teléfonos sin suficientes dígitos y colores inválidos', async () => {
    const wrapper = mount(EmpresaForm)
    await completarFormulario(wrapper)
    await wrapper.get('#empresa-telefono').setValue('-------')
    await wrapper.get('input[name="colorPrimarioHex"]').setValue('#zzzzzz')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Introduce un teléfono válido.')
    expect(wrapper.text()).toContain('Introduce un color hexadecimal válido.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('no reenvía campos de solo lectura recibidos en los valores iniciales', async () => {
    const wrapper = mount(EmpresaForm, {
      props: {
        modo: 'edit',
        valoresIniciales: {
          nombre: 'Iron House',
          gerente: 'Diego Salazar',
          correo: 'contacto@ironhouse.test',
          telefono: '+51 910 000 002',
          estado: 'active',
          usuarios: 999,
          fechaRegistro: '2020-01-01',
        },
      },
    })

    await wrapper.get('form').trigger('submit')
    const payload = wrapper.emitted('submit')[0][0]

    expect(payload).not.toHaveProperty('usuarios')
    expect(payload).not.toHaveProperty('fechaRegistro')
  })
})
