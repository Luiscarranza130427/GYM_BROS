import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import EjercicioCard from '@/modules/ejercicios/components/EjercicioCard.vue'

enableAutoUnmount(afterEach)

const EJERCICIO = {
  id: 1,
  nombre: 'Press banca',
  descripcion: 'Ejercicio básico de empuje para pecho.',
  tipo: 'fuerza',
  nivel: 'intermedio',
  equipamiento: 'barra y banco',
  estado: 'active',
  enlaceVideo: 'https://youtu.be/press',
  imagenUrl: 'http://api.test/storage/ejercicios/press.webp',
}

function montar(ejercicio = EJERCICIO) {
  return mount(EjercicioCard, {
    props: { ejercicio },
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
      },
    },
  })
}

describe('EjercicioCard', () => {
  it('presenta la imagen y los campos útiles del contrato real', () => {
    const wrapper = montar()

    expect(wrapper.get('img').attributes()).toMatchObject({
      src: EJERCICIO.imagenUrl,
      alt: EJERCICIO.nombre,
      loading: 'lazy',
    })
    expect(wrapper.text()).toContain('Fuerza')
    expect(wrapper.text()).toContain('Intermedio')
    expect(wrapper.text()).toContain('barra y banco')
    expect(wrapper.get('a[target="_blank"]').attributes('rel')).toBe('noopener noreferrer')
  })

  it('muestra un respaldo cuando la imagen del storage falla', async () => {
    const wrapper = montar()

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Imagen no disponible')
  })

  it('emite el ejercicio al solicitar su desactivación', async () => {
    const wrapper = montar()

    await wrapper.get('.tarjeta__accion--peligro').trigger('click')

    expect(wrapper.emitted('desactivar')).toEqual([[EJERCICIO]])
  })
})
