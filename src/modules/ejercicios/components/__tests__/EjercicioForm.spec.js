import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EjercicioForm from '@/modules/ejercicios/components/EjercicioForm.vue'

async function completar(wrapper, cambios = {}) {
  const valores = {
    '#ejercicio-nombre': 'Hip thrust',
    '#ejercicio-categoria': 'piernas',
    '#ejercicio-nivel': 'intermedio',
    '#ejercicio-equipo': 'barra',
    '#ejercicio-series': '4',
    '#ejercicio-repeticiones': '10',
    ...cambios,
  }
  for (const [selector, valor] of Object.entries(valores)) {
    await wrapper.get(selector).setValue(valor)
  }
}

describe('EjercicioForm', () => {
  it('no envía nada si faltan los campos obligatorios', async () => {
    const wrapper = mount(EjercicioForm)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('al menos 3 caracteres')
  })

  it('normaliza y emite un ejercicio válido', async () => {
    const wrapper = mount(EjercicioForm)
    await completar(wrapper, { '#ejercicio-nombre': '  Hip thrust  ' })

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')[0][0]).toEqual(
      expect.objectContaining({
        nombre: 'Hip thrust',
        categoria: 'piernas',
        nivel: 'intermedio',
        equipo: 'barra',
        seriesSugeridas: 4,
        repeticionesSugeridas: 10,
        estado: 'active',
      }),
    )
  })

  it('exige enteros no negativos en series y repeticiones', async () => {
    const wrapper = mount(EjercicioForm)

    // `Number('') === 0`, así que un campo vacío pasaría por válido sin una
    // comprobación explícita. Ése es justo el caso que se prueba aquí.
    await completar(wrapper, { '#ejercicio-series': '' })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()

    await completar(wrapper, { '#ejercicio-series': '-2' })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()

    await completar(wrapper, { '#ejercicio-repeticiones': '2.5' })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()

    // Cero sí es válido: un ejercicio de cardio no lleva repeticiones.
    await completar(wrapper, { '#ejercicio-repeticiones': '0' })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('asocia los errores 422 del servidor con su campo', async () => {
    const wrapper = mount(EjercicioForm, {
      props: {
        erroresServidor: {
          nombre: ['Ya existe un ejercicio con este nombre.'],
          seriesSugeridas: ['Debe ser un entero.'],
        },
      },
    })

    expect(wrapper.get('#ejercicio-nombre').attributes('aria-describedby')).toBe('error-nombre')
    expect(wrapper.text()).toContain('Ya existe un ejercicio con este nombre.')
    expect(wrapper.text()).toContain('Debe ser un entero.')
  })

  it('carga los valores iniciales al editar', async () => {
    const wrapper = mount(EjercicioForm, {
      props: {
        modo: 'edit',
        valoresIniciales: {
          nombre: 'Sentadilla',
          categoria: 'piernas',
          nivel: 'avanzado',
          equipo: 'barra',
          descripcion: 'Tren inferior.',
          seriesSugeridas: 5,
          repeticionesSugeridas: 5,
          estado: 'inactive',
        },
      },
    })

    expect(wrapper.get('#ejercicio-nombre').element.value).toBe('Sentadilla')
    expect(wrapper.get('#ejercicio-nivel').element.value).toBe('avanzado')
    expect(wrapper.get('#ejercicio-series').element.value).toBe('5')
  })

  it('no reenvía mientras el envío anterior sigue en curso', async () => {
    const wrapper = mount(EjercicioForm, { props: { enviando: true } })
    await completar(wrapper)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
