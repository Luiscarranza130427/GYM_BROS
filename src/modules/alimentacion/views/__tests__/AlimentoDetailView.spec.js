import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AlimentoDetailView from '@/modules/alimentacion/views/AlimentoDetailView.vue'
import {
  eliminarAlimento,
  obtenerAlimento,
} from '@/modules/alimentacion/services/alimentacion.service'
import { HttpError } from '@/core/api/http-error'

const route = reactive({ params: { id: '4' }, query: {} })
// El router real devuelve una promesa y la vista encadena `.catch()` sobre ella
// (regla de CLAUDE.md). Un `vi.fn()` pelado devuelve undefined y reventaría
// dentro del componente: el mock tiene que parecerse al original.
const push = vi.fn(() => Promise.resolve())
const replace = vi.fn(() => Promise.resolve())

enableAutoUnmount(afterEach)

vi.mock('vue-router', async (importOriginal) => {
  const original = await importOriginal()
  return { ...original, useRoute: () => route, useRouter: () => ({ push, replace }) }
})

vi.mock('@/modules/alimentacion/services/alimentacion.service', () => ({
  obtenerAlimento: vi.fn(),
  eliminarAlimento: vi.fn(),
}))

/** Contrato de `normalizarAlimento`: sin `estado`, la tabla no lo tiene. */
const ALIMENTO = {
  id: 4,
  nombre: 'Avena',
  tipo: 'cereal',
  calorias: 389,
  proteinas: 16.9,
  carbohidratos: 66.3,
  grasas: 6.9,
  fibra: 10.6,
  unidadBase: 'gramos',
  usos: 0,
}

function montar() {
  return mount(AlimentoDetailView, {
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
        Teleport: true,
      },
    },
  })
}

function botonRetirar(wrapper) {
  return wrapper.findAll('button').find((boton) => /retirar del catálogo/i.test(boton.text()))
}

describe('AlimentoDetailView', () => {
  beforeEach(() => {
    route.params = { id: '4' }
    route.query = {}
    push.mockReset().mockResolvedValue(undefined)
    replace.mockReset().mockResolvedValue(undefined)
    obtenerAlimento.mockReset()
    eliminarAlimento.mockReset()
  })

  it('muestra la ficha nutricional referida a la unidad base', async () => {
    obtenerAlimento.mockResolvedValue(ALIMENTO)
    const wrapper = montar()
    await flushPromises()

    expect(obtenerAlimento).toHaveBeenCalledWith('4')
    expect(wrapper.text()).toContain('Avena')
    // 'gramos' y 'cereal' son los valores del esquema; la ficha los traduce.
    expect(wrapper.text()).toContain('Valores por 100 g')
    expect(wrapper.text()).toContain('Cereal')
    expect(wrapper.text()).toContain('389')
    expect(wrapper.text()).toContain('16.9')
  })

  it('no ofrece retirar un alimento que se usa, y explica por qué', async () => {
    obtenerAlimento.mockResolvedValue({ ...ALIMENTO, usos: 6 })
    const wrapper = montar()
    await flushPromises()

    // Un botón que va a fallar con un 422 es peor que no tenerlo; pero callarse
    // el motivo deja al administrador buscando una acción que no existe.
    expect(botonRetirar(wrapper)).toBeUndefined()
    expect(wrapper.text()).toContain('no puede retirarse del catálogo')
  })

  it('ofrece retirar un alimento que no usa ninguna comida', async () => {
    obtenerAlimento.mockResolvedValue(ALIMENTO)
    const wrapper = montar()
    await flushPromises()

    expect(botonRetirar(wrapper)).toBeDefined()
    expect(wrapper.text()).toContain('Ningún plan lo utiliza todavía')
  })

  it('retira el alimento y vuelve al catálogo anunciándolo', async () => {
    obtenerAlimento.mockResolvedValue(ALIMENTO)
    eliminarAlimento.mockResolvedValue(undefined)
    const wrapper = montar()
    await flushPromises()

    await botonRetirar(wrapper).trigger('click')
    await flushPromises()

    // El confirmar vive dentro del diálogo: buscarlo ahí evita volver a pulsar
    // el de la cabecera, que también dice «Retirar».
    await wrapper.get('.dialogo__acciones .btn-danger').trigger('click')
    await flushPromises()

    expect(eliminarAlimento).toHaveBeenCalledWith(4)
    expect(push).toHaveBeenCalledWith({
      name: 'alimentos-listado',
      query: { notice: 'deactivated' },
    })
  })

  it('conserva la ficha cuando el 422 sin errores impide retirar el alimento', async () => {
    // La ficha decía `usos: 0`, pero otro administrador pudo usarlo entre la
    // carga y el clic. El 422 sin `errors` es una regla de negocio: su mensaje
    // se muestra tal cual, ENCIMA de lo que se estaba mirando.
    obtenerAlimento.mockResolvedValue(ALIMENTO)
    eliminarAlimento.mockRejectedValue(
      new HttpError({
        status: 422,
        message: '«Avena» se usa en 6 comidas y no puede retirarse del catálogo.',
        errors: null,
      }),
    )
    const wrapper = montar()
    await flushPromises()

    await botonRetirar(wrapper).trigger('click')
    await flushPromises()
    await wrapper.get('.dialogo__acciones .btn-danger').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      '«Avena» se usa en 6 comidas y no puede retirarse del catálogo.',
    )
    // Y los datos siguen ahí: fallar una acción no vacía la pantalla.
    expect(wrapper.find('.detalle').exists()).toBe(true)
    expect(wrapper.text()).toContain('Avena')
    expect(wrapper.text()).toContain('389')
    expect(push).not.toHaveBeenCalled()
  })

  /*
   * Ese 422 sólo puede llegar si el alimento SE USA, y la ficha creía que no
   * —por eso ofreció el botón—. Sin refrescar el contador, la pantalla se
   * contradice a sí misma: «Comidas que lo usan: 0» junto a un error que dice
   * que se usa en seis, y el botón sigue invitando a repetir el mismo fallo.
   */
  it('refresca el contador de usos tras ese 422, para no contradecirse', async () => {
    obtenerAlimento.mockResolvedValueOnce(ALIMENTO).mockResolvedValueOnce({ ...ALIMENTO, usos: 6 })
    eliminarAlimento.mockRejectedValue(
      new HttpError({
        status: 422,
        message: '«Avena» se usa en 6 comidas y no puede retirarse del catálogo.',
        errors: null,
      }),
    )
    const wrapper = montar()
    await flushPromises()
    expect(botonRetirar(wrapper)).toBeDefined()

    await botonRetirar(wrapper).trigger('click')
    await flushPromises()
    await wrapper.get('.dialogo__acciones .btn-danger').trigger('click')
    await flushPromises()

    // El botón desaparece y el contador dice la verdad.
    expect(botonRetirar(wrapper)).toBeUndefined()
    expect(wrapper.text()).toContain('6')
    // Sin vaciar la ficha: sigue siendo un fallo de acción, no de carga.
    expect(wrapper.find('.detalle').exists()).toBe(true)
  })

  it('sustituye el contenido cuando lo que falla es la carga', async () => {
    // El caso contrario al anterior: aquí no hay ficha que conservar, así que
    // el error sí ocupa la pantalla y ofrece reintentar.
    obtenerAlimento
      .mockRejectedValueOnce(new HttpError({ status: 500, message: 'Error del servidor.' }))
      .mockResolvedValueOnce(ALIMENTO)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.find('.detalle').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Avena')
    expect(wrapper.get('[role="alert"]').text()).toContain('Error del servidor.')

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(obtenerAlimento).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.detalle').exists()).toBe(true)
  })

  it('distingue un 404 de un fallo recuperable', async () => {
    obtenerAlimento.mockRejectedValue(
      new HttpError({ status: 404, message: 'El alimento solicitado no existe.' }),
    )
    const wrapper = montar()
    await flushPromises()

    // Un 404 no ofrece «Reintentar»: reintentar no lo va a hacer aparecer.
    expect(wrapper.text()).toContain('Alimento no encontrado')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').findAll('button')).toHaveLength(0)
  })

  it('consume el aviso de creación y lo retira de la URL', async () => {
    // Si no se retirara, reaparecería al recargar o al volver atrás.
    route.query = { notice: 'created' }
    obtenerAlimento.mockResolvedValue(ALIMENTO)
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toMatch(/creado/i)
    expect(replace).toHaveBeenCalledWith({ name: 'alimento-detalle', params: { id: '4' } })
  })
})
