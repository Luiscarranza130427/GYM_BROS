import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmpresaForm from '@/modules/empresas/components/EmpresaForm.vue'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const HORARIOS_VALIDOS = Object.fromEntries(
  DIAS.flatMap((dia) => [
    [`horario_inicio_${dia}`, '06:00'],
    [`horario_fin_${dia}`, '22:00'],
  ]),
)

async function completarFormulario(wrapper) {
  await wrapper.get('#empresa-nombre').setValue('Nova Fitness')
  await wrapper.get('#empresa-gerente').setValue('Andrea Morales')
  await wrapper.get('#empresa-correo').setValue('contacto@novafitness.test')
  await wrapper.get('#empresa-telefono').setValue('+51 987 654 321')
  await wrapper.get('#empresa-ruc').setValue('20987654321')
  await wrapper.get('#empresa-web').setValue('https://novafitness.example')
  for (const dia of DIAS) {
    await wrapper.get(`#horario-inicio-${dia}`).setValue('06:00')
    await wrapper.get(`#horario-fin-${dia}`).setValue('22:00')
  }
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
        horario_inicio_lunes: '06:00',
        horario_fin_domingo: '22:00',
      }),
    )
  })

  it('carga los horarios reales y rechaza un cierre anterior a la apertura', async () => {
    const wrapper = mount(EmpresaForm, {
      props: {
        modo: 'edit',
        valoresIniciales: {
          nombre: 'Gym Bros Cajamarca',
          gerente: 'Carlos Mendoza',
          correo: 'contacto@gymbros.pe',
          telefono: '976123456',
          estado: 'active',
          ...HORARIOS_VALIDOS,
        },
      },
    })

    expect(wrapper.get('#horario-inicio-lunes').element.value).toBe('06:00')
    expect(wrapper.get('#horario-fin-domingo').element.value).toBe('22:00')

    await wrapper.get('#horario-inicio-domingo').setValue('18:00')
    await wrapper.get('#horario-fin-domingo').setValue('13:00')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('la hora de cierre debe ser posterior')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('copia el horario del lunes al resto de la semana', async () => {
    const wrapper = mount(EmpresaForm)
    const botonCopiar = wrapper.get('button[type="button"].horarios-encabezado__accion')

    expect(botonCopiar.attributes('disabled')).toBeDefined()

    await wrapper.get('#horario-inicio-lunes').setValue('07:30')
    await wrapper.get('#horario-fin-lunes').setValue('21:15')
    expect(botonCopiar.attributes('disabled')).toBeUndefined()

    await botonCopiar.trigger('click')

    for (const dia of DIAS.slice(1)) {
      expect(wrapper.get(`#horario-inicio-${dia}`).element.value).toBe('07:30')
      expect(wrapper.get(`#horario-fin-${dia}`).element.value).toBe('21:15')
    }
    expect(wrapper.text()).toContain('Horario del lunes aplicado de martes a domingo.')
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
          ...HORARIOS_VALIDOS,
        },
      },
    })

    await wrapper.get('form').trigger('submit')
    const payload = wrapper.emitted('submit')[0][0]

    expect(payload).not.toHaveProperty('usuarios')
    expect(payload).not.toHaveProperty('fechaRegistro')
  })
})
