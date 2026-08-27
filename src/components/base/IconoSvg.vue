<script setup>
import { computed } from 'vue'

import { ICONOS, LIENZO_ICONOS } from '@/assets/iconos'

/**
 * Icono SVG en línea.
 *
 * Sustituye a `<i class="bi bi-x">`, que obligaba a descargar la fuente entera
 * de Bootstrap Icons —unos 131 KB de WOFF2 y 95 KB de CSS— para los 56 iconos
 * que este panel dibuja.
 *
 * Hereda `currentColor` y `1em`, así que sigue tiñéndose y escalándose con el
 * texto que lo rodea, igual que hacía la fuente.
 */
const props = defineProps({
  /** Nombre de Bootstrap Icons, con o sin el prefijo `bi-`. */
  nombre: { type: String, required: true },
  /**
   * Texto alternativo. Vacío —lo habitual— marca el icono como decorativo y lo
   * oculta a los lectores de pantalla: si el icono acompaña a una etiqueta
   * visible, repetirlo sólo añade ruido.
   */
  etiqueta: { type: String, default: '' },
})

const clave = computed(() => props.nombre?.replace(/^bi-/, '') ?? '')

const trazos = computed(() => {
  const encontrado = ICONOS[clave.value]
  if (encontrado) return encontrado

  /*
   * Los nombres que llegan de datos (la navegación, las métricas del
   * dashboard) no se pueden comprobar de forma estática. Si el backend manda
   * uno desconocido, se avisa en desarrollo en lugar de dejar un hueco mudo.
   */
  if (import.meta.env.DEV) {
    console.warn(`[Gym Bros] Icono desconocido: "${props.nombre}". Añádelo a src/assets/iconos.js.`)
  }
  return []
})
</script>

<template>
  <svg
    class="icono"
    :viewBox="`0 0 ${LIENZO_ICONOS} ${LIENZO_ICONOS}`"
    width="1em"
    height="1em"
    fill="currentColor"
    :role="etiqueta ? 'img' : undefined"
    :aria-label="etiqueta || undefined"
    :aria-hidden="etiqueta ? undefined : 'true'"
    focusable="false"
  >
    <path
      v-for="(trazo, indice) in trazos"
      :key="indice"
      :d="trazo.d"
      :fill-rule="trazo.fillRule"
    />
  </svg>
</template>

<style scoped>
.icono {
  /* `inline-block` con alineación al texto evita el salto de línea base que
     tenían los iconos de fuente dentro de botones y etiquetas. */
  display: inline-block;
  flex: none;
  vertical-align: -0.125em;
}
</style>
