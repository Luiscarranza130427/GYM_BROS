import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useBreakpoint } from '@/shared/composables/useBreakpoint'

const ComponentePrueba = defineComponent({
  setup() {
    return useBreakpoint('(max-width: 40rem)')
  },
  template: '<span>{{ coincide }}</span>',
})

describe('useBreakpoint', () => {
  afterEach(() => {
    delete window.matchMedia
  })

  it('sincroniza el breakpoint, escucha cambios y libera el listener', async () => {
    let alCambiar
    const removeEventListener = vi.fn()
    const matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn((evento, listener) => {
        if (evento === 'change') alCambiar = listener
      }),
      removeEventListener,
    }))
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMedia,
    })

    const wrapper = mount(ComponentePrueba)
    await nextTick()

    expect(matchMedia).toHaveBeenCalledWith('(max-width: 40rem)')
    expect(wrapper.text()).toBe('true')
    alCambiar({ matches: false })
    await nextTick()
    expect(wrapper.text()).toBe('false')

    wrapper.unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', alCambiar)
  })
})
