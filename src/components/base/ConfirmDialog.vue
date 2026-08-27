<script setup>
import { nextTick, onBeforeUnmount, useId, useTemplateRef, watch } from 'vue'

import IconoSvg from '@/components/base/IconoSvg.vue'

const props = defineProps({
  abierto: { type: Boolean, default: false },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  confirmando: { type: Boolean, default: false },
  etiquetaConfirmar: { type: String, default: 'Confirmar' },
  etiquetaConfirmando: { type: String, default: 'Procesando…' },
})

const emit = defineEmits(['confirmar', 'cancelar'])
const cancelarBoton = useTemplateRef('cancelarBoton')
const dialogo = useTemplateRef('dialogo')
const identificador = useId()
const tituloId = `${identificador}-titulo`
const descripcionId = `${identificador}-descripcion`
let elementoAnterior = null
let overflowPrevio = ''

/** Elementos que pueden recibir foco dentro del diálogo, en orden de tabulación. */
function focoables() {
  if (!dialogo.value) return []
  return [
    ...dialogo.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]'),
  ].filter((el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1')
}

/*
 * Trampa de foco. La versión anterior sólo interceptaba el tabulador cuando el
 * foco estaba exactamente en uno de los dos botones: si acababa en el contenedor
 * o volvía desde la barra del navegador, el tabulador se escapaba al contenido
 * de detrás, que para un lector de pantalla no existe mientras hay un modal.
 *
 * Ahora se calcula la lista real de elementos focoables en cada pulsación, así
 * que sigue funcionando si el diálogo cambia de contenido.
 */
function manejarTecla(evento) {
  if (!props.abierto) return

  if (evento.key === 'Escape' && !props.confirmando) {
    emit('cancelar')
    return
  }
  if (evento.key !== 'Tab') return

  const elementos = focoables()
  if (elementos.length === 0) return

  const primero = elementos[0]
  const ultimo = elementos[elementos.length - 1]
  const activo = document.activeElement

  // Si el foco se ha escapado del diálogo, se recupera.
  if (!dialogo.value?.contains(activo)) {
    evento.preventDefault()
    primero.focus()
    return
  }

  if (evento.shiftKey && activo === primero) {
    evento.preventDefault()
    ultimo.focus()
  } else if (!evento.shiftKey && activo === ultimo) {
    evento.preventDefault()
    primero.focus()
  }
}

/**
 * Congela el scroll del documento mientras el diálogo está abierto. Sin esto,
 * la rueda del ratón desplazaba la página de detrás y el modal parecía flotar
 * sobre un contenido que se movía solo.
 */
function bloquearScroll(bloquear) {
  if (bloquear) {
    overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = overflowPrevio
    overflowPrevio = ''
  }
}

watch(
  () => props.abierto,
  async (abierto, anterior) => {
    if (!abierto) {
      // `anterior === undefined` es el montaje con el diálogo cerrado: no hay
      // nada que deshacer, y tocar el scroll aquí pisaría el de otro modal.
      if (anterior === undefined) return

      window.removeEventListener('keydown', manejarTecla)
      bloquearScroll(false)
      elementoAnterior?.focus?.()
      elementoAnterior = null
      return
    }
    elementoAnterior = document.activeElement
    bloquearScroll(true)
    await nextTick()
    cancelarBoton.value?.focus()
    window.addEventListener('keydown', manejarTecla)
  },
  /*
   * `immediate` importa: sin él, un padre que monte el componente ya abierto
   * —`<ConfirmDialog :abierto="true">` en el primer render— no activaba el
   * bloqueo de scroll, ni el foco inicial, ni la trampa de tabulación. Hoy las
   * vistas siempre parten de `false`, así que no se notaba; era una trampa
   * esperando al primer uso distinto.
   */
  { immediate: true },
)

onBeforeUnmount(() => {
  // Si el componente desaparece con el diálogo abierto (una navegación, por
  // ejemplo), el scroll debe quedar liberado igualmente.
  window.removeEventListener('keydown', manejarTecla)
  bloquearScroll(false)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="abierto" class="dialogo-fondo" @mousedown.self="!confirmando && emit('cancelar')">
      <section
        ref="dialogo"
        class="dialogo gb-tarjeta"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="tituloId"
        :aria-describedby="descripcionId"
      >
        <span class="dialogo__icono" aria-hidden="true">
          <IconoSvg nombre="exclamation-triangle" />
        </span>
        <h2 :id="tituloId">{{ titulo }}</h2>
        <p :id="descripcionId">{{ descripcion }}</p>
        <div class="dialogo__acciones">
          <button
            ref="cancelarBoton"
            type="button"
            class="btn btn-ghost"
            :disabled="confirmando"
            @click="emit('cancelar')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-danger"
            :disabled="confirmando"
            @click="emit('confirmar')"
          >
            <span
              v-if="confirmando"
              class="spinner-border spinner-border-sm"
              aria-hidden="true"
            ></span>
            {{ confirmando ? etiquetaConfirmando : etiquetaConfirmar }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.dialogo-fondo {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 1rem;
  background-color: var(--gb-overlay-strong);
}

.dialogo {
  width: min(100%, 30rem);
  max-height: min(90vh, 32rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.5rem;
  border-radius: var(--gb-radius-xl);
}

.dialogo__icono {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  background-color: rgba(var(--gb-red-rgb), 0.12);
  border: 1px solid rgba(var(--gb-red-rgb), 0.45);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-error);
  font-size: 1.25rem;
}

.dialogo h2 {
  margin: 1rem 0 0;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.dialogo p {
  margin: 0.625rem 0 1.5rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.dialogo__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.dialogo__acciones .btn {
  min-height: 2.75rem;
  padding-inline: 1rem;
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
