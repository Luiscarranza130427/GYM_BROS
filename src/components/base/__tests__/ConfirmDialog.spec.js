import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ConfirmDialog from '@/components/base/ConfirmDialog.vue'

enableAutoUnmount(afterEach)

const PROPS = {
  titulo: 'Desactivar empresa',
  descripcion: '¿Seguro que quieres desactivar Power Gym?',
}

/** El diálogo se teletransporta a <body>, así que hay que montarlo enganchado al documento. */
function montar(props = {}) {
  return mount(ConfirmDialog, {
    props: { ...PROPS, ...props },
    attachTo: document.body,
  })
}

function pulsar(key, opciones = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opciones }))
}

function botonesDelDialogo() {
  return [...document.querySelectorAll('[role="alertdialog"] button')].filter((b) => !b.disabled)
}

describe('ConfirmDialog', () => {
  afterEach(() => {
    // El componente manipula <body>; si una prueba deja restos, contamina a las demás.
    document.body.style.overflow = ''
  })

  it('permanece oculto mientras no se abre', () => {
    montar()
    expect(document.querySelector('[role="alertdialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('al abrirse anuncia el diálogo, congela el scroll y enfoca Cancelar', async () => {
    montar({ abierto: true })
    await flushPromises()

    const dialogo = document.querySelector('[role="alertdialog"]')
    expect(dialogo).not.toBeNull()
    expect(dialogo.getAttribute('aria-modal')).toBe('true')
    expect(dialogo.textContent).toContain(PROPS.titulo)

    // Sin esto la página de detrás se desplazaba con la rueda del ratón.
    expect(document.body.style.overflow).toBe('hidden')

    // El foco inicial va a la opción no destructiva, no a la de confirmar.
    expect(document.activeElement.textContent.trim()).toBe('Cancelar')
  })

  it('libera el scroll al cerrarse', async () => {
    const wrapper = montar({ abierto: true })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.setProps({ abierto: false })
    await flushPromises()
    expect(document.body.style.overflow).toBe('')
  })

  it('libera el scroll aunque se desmonte con el diálogo abierto', async () => {
    const wrapper = montar({ abierto: true })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')

    // Una navegación puede destruir el componente sin cerrarlo antes.
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  describe('trampa de foco', () => {
    it('cicla el tabulador dentro del diálogo en ambos sentidos', async () => {
      montar({ abierto: true })
      await flushPromises()

      const botones = botonesDelDialogo()
      const primero = botones[0]
      const ultimo = botones[botones.length - 1]

      ultimo.focus()
      pulsar('Tab')
      expect(document.activeElement).toBe(primero)

      primero.focus()
      pulsar('Tab', { shiftKey: true })
      expect(document.activeElement).toBe(ultimo)
    })

    it('recupera el foco si se ha escapado fuera del diálogo', async () => {
      // Éste es el caso que la implementación anterior no cubría: sólo actuaba
      // si el foco estaba exactamente en uno de los dos botones.
      const externo = document.createElement('button')
      document.body.appendChild(externo)

      montar({ abierto: true })
      await flushPromises()

      externo.focus()
      expect(document.querySelector('[role="alertdialog"]').contains(document.activeElement)).toBe(
        false,
      )

      pulsar('Tab')
      expect(document.querySelector('[role="alertdialog"]').contains(document.activeElement)).toBe(
        true,
      )

      externo.remove()
    })
  })

  describe('cancelación', () => {
    it('Escape emite cancelar', async () => {
      const wrapper = montar({ abierto: true })
      await flushPromises()

      pulsar('Escape')
      expect(wrapper.emitted('cancelar')).toHaveLength(1)
    })

    it('Escape no cancela mientras la acción está en curso', async () => {
      const wrapper = montar({ abierto: true, confirmando: true })
      await flushPromises()

      pulsar('Escape')
      expect(wrapper.emitted('cancelar')).toBeUndefined()
    })
  })

  it('muestra la etiqueta de progreso y deshabilita los botones al confirmar', async () => {
    montar({ abierto: true, confirmando: true, etiquetaConfirmando: 'Desactivando…' })
    await flushPromises()

    const dialogo = document.querySelector('[role="alertdialog"]')
    expect(dialogo.textContent).toContain('Desactivando…')
    expect([...dialogo.querySelectorAll('button')].every((b) => b.disabled)).toBe(true)
  })
})
