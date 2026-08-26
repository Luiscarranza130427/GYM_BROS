<script setup>
import { computed } from 'vue'

import { formatearNumero } from '@/utils/formato'

const props = defineProps({
  metrica: { type: Object, required: true },
})

const iconoTendencia = computed(() => {
  if (props.metrica.tendencia.tono === 'neutro') return 'bi-dash'
  return props.metrica.tendencia.tono === 'negativo' ? 'bi-graph-down-arrow' : 'bi-graph-up-arrow'
})

const valorFormateado = computed(() => formatearNumero(props.metrica.valor))
const tendenciaFormateada = computed(() => {
  const tendencia = props.metrica.tendencia
  const sufijo = tendencia.sufijo ?? ''
  const separador = sufijo === '%' ? ' ' : ''
  return `${tendencia.prefijo ?? ''}${formatearNumero(tendencia.valor)}${separador}${sufijo}`
})
</script>

<template>
  <article class="metrica gb-tarjeta" :class="`metrica--${metrica.tendencia.tono}`">
    <div class="metrica__cabecera">
      <span>{{ metrica.etiqueta }}</span>
      <i class="bi" :class="metrica.icono" aria-hidden="true"></i>
    </div>

    <strong>{{ valorFormateado }}</strong>

    <p class="metrica__tendencia" :class="`metrica__tendencia--${metrica.tendencia.tono}`">
      <i class="bi" :class="iconoTendencia" aria-hidden="true"></i>
      <b>{{ tendenciaFormateada }}</b>
      <span>{{ metrica.tendencia.detalle }}</span>
    </p>
  </article>
</template>

<style scoped>
.metrica {
  position: relative;
  min-width: 0;
  padding: 1.25rem;
  overflow: hidden;
  border-radius: var(--gb-radius-lg);
}

.metrica::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 0.25rem;
  background-color: var(--gb-border);
  content: '';
}

.metrica--positivo::after {
  background-color: var(--gb-green);
}

.metrica--neutro::after {
  background-color: var(--gb-amber);
}

.metrica--negativo::after {
  background-color: var(--gb-red);
}

.metrica__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--gb-text-muted);
}

.metrica__cabecera span {
  font-size: var(--gb-tipo-xs);
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.metrica__cabecera i {
  color: var(--gb-text-soft);
  font-size: 1.125rem;
}

.metrica > strong {
  display: block;
  margin-top: 1.125rem;
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-metrica);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1;
  white-space: nowrap;
}

.metrica__tendencia {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0.875rem 0 0;
  font-size: var(--gb-tipo-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.metrica__tendencia span {
  min-width: 0;
  overflow: hidden;
  color: var(--gb-text-muted);
  text-overflow: ellipsis;
}

.metrica__tendencia--positivo {
  color: var(--gb-green);
}

.metrica__tendencia--neutro {
  color: var(--gb-amber);
}

.metrica__tendencia--negativo {
  color: var(--gb-error);
}
</style>
