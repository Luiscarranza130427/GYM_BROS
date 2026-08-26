<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: [String, Object], default: '' },
})

const emit = defineEmits({
  retry: null,
})

const CAMPOS_SENSIBLES = /password|contrase(?:n|ñ)a|hash|token|secret|credencial/i

const historialSeguro = computed(() =>
  props.items.filter((item) => {
    const campo = item?.campo ?? item?.field ?? ''
    const descripcion = item?.descripcion ?? item?.description ?? ''
    return !CAMPOS_SENSIBLES.test(`${campo} ${descripcion}`)
  }),
)

const mensajeError = computed(() => {
  if (typeof props.error === 'string') return props.error
  return props.error?.message ?? 'No pudimos cargar el historial.'
})

function fechaEvento(item) {
  return item?.creadoEn ?? item?.createdAt ?? item?.fecha ?? ''
}

function fechaLegible(fecha) {
  const instante = new Date(fecha)
  if (!fecha || Number.isNaN(instante.getTime())) return 'Fecha no disponible'

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(instante)
}

function descripcionDe(item) {
  return item?.descripcion ?? item?.description ?? 'Información actualizada'
}

function responsableDe(item) {
  const responsable =
    item?.realizadoPor ?? item?.performedBy ?? item?.responsable ?? item?.autor ?? item?.author
  if (typeof responsable === 'string') return responsable
  return responsable?.nombre ?? responsable?.name ?? 'Sistema Gym Bros'
}

function valorSeguro(valor) {
  if (valor === null || valor === undefined || valor === '') return 'Sin dato'
  if (['string', 'number', 'boolean'].includes(typeof valor)) return String(valor)
  return 'Información actualizada'
}

function valorAnterior(item) {
  return item?.valorAnterior ?? item?.previousValue
}

function valorNuevo(item) {
  return item?.valorNuevo ?? item?.newValue
}

function tieneComparacion(item) {
  const anterior = valorAnterior(item)
  const nuevo = valorNuevo(item)
  return anterior !== undefined || nuevo !== undefined
}
</script>

<template>
  <section class="historial gb-tarjeta" aria-labelledby="titulo-historial">
    <header class="historial__cabecera">
      <span class="historial__icono"><i class="bi bi-clock-history" aria-hidden="true"></i></span>
      <div>
        <p>Auditoría administrativa</p>
        <h2 id="titulo-historial">Historial de cambios</h2>
      </div>
    </header>

    <div v-if="loading" class="historial__cargando" aria-busy="true" aria-live="polite">
      <span class="visually-hidden">Cargando historial de cambios…</span>
      <div v-for="indice in 3" :key="indice" class="historial__skeleton" aria-hidden="true">
        <span></span>
        <div>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="historial__estado" role="alert">
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
      <div>
        <h3>No pudimos cargar el historial</h3>
        <p>{{ mensajeError }}</p>
      </div>
      <button type="button" class="btn btn-ghost" @click="emit('retry')">
        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
        Reintentar
      </button>
    </div>

    <div v-else-if="historialSeguro.length === 0" class="historial__estado" role="status">
      <i class="bi bi-clock" aria-hidden="true"></i>
      <div>
        <h3>Sin cambios registrados</h3>
        <p>Aún no existen cambios registrados para este usuario.</p>
      </div>
    </div>

    <ol v-else class="historial__lista">
      <li
        v-for="(item, indice) in historialSeguro"
        :key="item.id ?? `${fechaEvento(item)}-${indice}`"
      >
        <span class="historial__marca" aria-hidden="true"></span>
        <article>
          <div class="historial__evento">
            <div>
              <h3>{{ descripcionDe(item) }}</h3>
              <p>Realizado por {{ responsableDe(item) }}</p>
            </div>
            <time :datetime="fechaEvento(item)">{{ fechaLegible(fechaEvento(item)) }}</time>
          </div>

          <dl v-if="tieneComparacion(item)" class="historial__cambio">
            <div>
              <dt>Antes</dt>
              <dd>{{ valorSeguro(valorAnterior(item)) }}</dd>
            </div>
            <i class="bi bi-arrow-right" aria-hidden="true"></i>
            <div>
              <dt>Ahora</dt>
              <dd>{{ valorSeguro(valorNuevo(item)) }}</dd>
            </div>
          </dl>
        </article>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.historial {
  min-width: 0;
  padding: 1.25rem;
  border-radius: var(--gb-radius-xl);
}

.historial__cabecera {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--gb-border);
}

.historial__cabecera p,
.historial__cabecera h2 {
  margin: 0;
}

.historial__cabecera p {
  color: var(--gb-red-text);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.historial__cabecera h2 {
  margin-top: 0.125rem;
  font-size: var(--gb-tipo-md);
  text-transform: uppercase;
}

.historial__icono {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--gb-surface-high);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-red-text);
}

.historial__lista {
  margin: 0;
  padding: 0;
  list-style: none;
}

.historial__lista > li {
  position: relative;
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  gap: 0.875rem;
  padding: 1.125rem 0;
}

.historial__lista > li:not(:last-child) {
  border-bottom: 1px solid var(--gb-border);
}

.historial__lista article {
  min-width: 0;
}

.historial__marca {
  width: 0.625rem;
  height: 0.625rem;
  margin-top: 0.3rem;
  background-color: var(--gb-red);
  border: 2px solid var(--gb-bg);
  border-radius: var(--gb-radius-pill);
  box-shadow: 0 0 0 1px var(--gb-red);
}

.historial__evento {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.historial__evento h3,
.historial__evento p {
  margin: 0;
}

.historial__evento h3,
.historial__estado h3 {
  font-family: var(--gb-fuente-texto);
  font-size: var(--gb-tipo-sm);
  font-weight: 700;
}

.historial__evento p,
.historial__evento time,
.historial__estado p {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.historial__evento p {
  margin-top: 0.25rem;
}

.historial__evento time {
  flex: none;
  font-variant-numeric: tabular-nums;
}

.historial__cambio {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  margin: 0.875rem 0 0;
  padding: 0.75rem;
  background-color: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
}

.historial__cambio > div {
  min-width: 0;
}

.historial__cambio dt {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.historial__cambio dd {
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
  color: var(--gb-text);
  font-size: var(--gb-tipo-xs);
}

.historial__cambio > i {
  color: var(--gb-red-text);
}

.historial__estado {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-height: 7.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
}

.historial__estado > i {
  flex: none;
  color: var(--gb-text-soft);
  font-size: 1.35rem;
}

.historial__estado > div {
  min-width: 0;
}

.historial__estado h3,
.historial__estado p {
  margin: 0;
}

.historial__estado p {
  margin-top: 0.25rem;
}

.historial__estado .btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
  font-size: var(--gb-tipo-xs);
}

.historial__cargando {
  display: grid;
  gap: 0.75rem;
  padding-top: 1rem;
}

.historial__skeleton {
  display: grid;
  grid-template-columns: 0.75rem minmax(0, 1fr);
  gap: 0.875rem;
  padding: 0.875rem 0;
}

.historial__skeleton > span,
.historial__skeleton div span {
  display: block;
  background-color: var(--gb-surface-high);
  border-radius: var(--gb-radius);
  animation: pulso 1.4s ease-in-out infinite;
}

.historial__skeleton > span {
  width: 0.625rem;
  height: 0.625rem;
}

.historial__skeleton div span:first-child {
  width: min(18rem, 65%);
  height: 0.875rem;
}

.historial__skeleton div span:last-child {
  width: min(11rem, 42%);
  height: 0.625rem;
  margin-top: 0.5rem;
}

@keyframes pulso {
  50% {
    opacity: 0.45;
  }
}

@media (max-width: 42rem) {
  .historial__evento {
    flex-direction: column;
    gap: 0.375rem;
  }

  .historial__cambio {
    grid-template-columns: 1fr;
  }

  .historial__cambio > i {
    transform: rotate(90deg);
  }

  .historial__estado {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .historial__estado .btn {
    width: 100%;
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .historial__skeleton > span,
  .historial__skeleton div span {
    animation: none;
  }
}
</style>
