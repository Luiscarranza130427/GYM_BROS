<script setup>
import { nextTick, onBeforeUnmount, useId, useTemplateRef, watch } from 'vue'

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
const confirmarBoton = useTemplateRef('confirmarBoton')
const identificador = useId()
const tituloId = `${identificador}-titulo`
const descripcionId = `${identificador}-descripcion`
let elementoAnterior = null

function manejarTecla(evento) {
  if (!props.abierto) return
  if (evento.key === 'Escape' && !props.confirmando) emit('cancelar')
  if (evento.key !== 'Tab') return

  if (evento.shiftKey && document.activeElement === cancelarBoton.value) {
    evento.preventDefault()
    confirmarBoton.value?.focus()
  } else if (!evento.shiftKey && document.activeElement === confirmarBoton.value) {
    evento.preventDefault()
    cancelarBoton.value?.focus()
  }
}

watch(
  () => props.abierto,
  async (abierto) => {
    if (!abierto) {
      window.removeEventListener('keydown', manejarTecla)
      elementoAnterior?.focus?.()
      elementoAnterior = null
      return
    }
    elementoAnterior = document.activeElement
    await nextTick()
    cancelarBoton.value?.focus()
    window.addEventListener('keydown', manejarTecla)
  },
)

onBeforeUnmount(() => window.removeEventListener('keydown', manejarTecla))
</script>

<template>
  <Teleport to="body">
    <div v-if="abierto" class="dialogo-fondo" @mousedown.self="!confirmando && emit('cancelar')">
      <section
        class="dialogo gb-tarjeta"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="tituloId"
        :aria-describedby="descripcionId"
      >
        <span class="dialogo__icono" aria-hidden="true">
          <i class="bi bi-exclamation-triangle"></i>
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
            ref="confirmarBoton"
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
