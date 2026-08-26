import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Estado de interfaz compartido entre varios componentes del shell
 * administrativo (layout, cabecera y menú lateral).
 *
 * Regla: aquí sólo entra el estado visual que necesitan ver varios componentes
 * a la vez. Lo que afecta a una sola vista se queda dentro de esa vista.
 *
 * El menú también se dibuja compacto cuando la ventana es estrecha, pero eso lo
 * resuelve una media query en CSS y no este store: depender de `matchMedia` y de
 * su evento `change` añadía un estado que podía quedarse desincronizado del
 * tamaño real de la ventana.
 */
export const useUiStore = defineStore('ui', () => {
  /** Lo controla el usuario desde el conmutador de la cabecera. */
  const sidebarCompacto = ref(false)

  function alternarSidebar() {
    sidebarCompacto.value = !sidebarCompacto.value
  }

  return {
    sidebarCompacto,
    alternarSidebar,
  }
})
