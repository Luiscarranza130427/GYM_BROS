import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDebounce } from '@/shared/composables/useDebounce'

const origen = ref('inicial')
const ComponentePrueba = defineComponent({
  setup() {
    return { resultado: useDebounce(origen, 100) }
  },
  template: '<span>{{ resultado }}</span>',
})

describe('useDebounce', () => {
  afterEach(() => {
    vi.useRealTimers()
    origen.value = 'inicial'
  })

  it('publica sólo el último valor al terminar el retraso y limpia al desmontar', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ComponentePrueba)

    origen.value = 'primero'
    await nextTick()
    origen.value = 'definitivo'
    await nextTick()
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.text()).toBe('definitivo')

    origen.value = 'descartado'
    await nextTick()
    wrapper.unmount()
    vi.runAllTimers()
  })
})
