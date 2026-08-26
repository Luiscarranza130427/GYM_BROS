<script setup>
import { computed } from 'vue'

import EmpresaLogo from '@/modules/empresas/components/EmpresaLogo.vue'
import EmpresaStatusBadge from '@/modules/empresas/components/EmpresaStatusBadge.vue'
import { formatearFecha, formatearNumero } from '@/utils/formato'

const props = defineProps({
  empresa: { type: Object, required: true },
})

const sitioSeguro = computed(() => {
  try {
    const url = new URL(props.empresa.sitioWeb)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
})
</script>

<template>
  <div class="detalle">
    <section class="detalle__resumen gb-tarjeta">
      <EmpresaLogo :nombre="empresa.nombre" :url="empresa.logoUrl" grande />
      <div>
        <p>Empresa registrada</p>
        <h2>{{ empresa.nombre }}</h2>
        <span>{{ empresa.region || 'Región no especificada' }}</span>
      </div>
      <EmpresaStatusBadge :estado="empresa.estado" />
    </section>

    <div class="detalle__rejilla">
      <section class="detalle__panel gb-tarjeta" aria-labelledby="titulo-contacto">
        <header>
          <p>Datos administrativos</p>
          <h2 id="titulo-contacto">Información y contacto</h2>
        </header>
        <dl>
          <div>
            <dt>Gerente</dt>
            <dd>{{ empresa.gerente || 'No especificado' }}</dd>
          </div>
          <div>
            <dt>RUC</dt>
            <dd class="tabular">{{ empresa.ruc || 'No especificado' }}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>
              <a :href="`mailto:${empresa.correo}`">{{ empresa.correo }}</a>
            </dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>
              <a :href="`tel:${empresa.telefono}`">{{ empresa.telefono }}</a>
            </dd>
          </div>
          <div>
            <dt>Región</dt>
            <dd>{{ empresa.region || 'No especificada' }}</dd>
          </div>
          <div class="detalle__completo">
            <dt>Dirección</dt>
            <dd>{{ empresa.direccion || 'No especificada' }}</dd>
          </div>
          <div class="detalle__completo">
            <dt>Sitio web</dt>
            <dd>
              <a v-if="sitioSeguro" :href="sitioSeguro" target="_blank" rel="noopener noreferrer">
                {{ empresa.sitioWeb }} <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
              </a>
              <span v-else>{{ empresa.sitioWeb || 'No especificado' }}</span>
            </dd>
          </div>
        </dl>
      </section>

      <aside class="detalle__lateral">
        <section class="detalle__panel gb-tarjeta" aria-labelledby="titulo-generales">
          <header>
            <p>Resumen operativo</p>
            <h2 id="titulo-generales">Datos generales</h2>
          </header>
          <dl class="detalle__metricas">
            <div>
              <dt>Usuarios</dt>
              <dd>{{ formatearNumero(empresa.usuarios) }}</dd>
            </div>
            <div>
              <dt>Fecha de registro</dt>
              <dd>{{ formatearFecha(empresa.fechaRegistro) }}</dd>
            </div>
          </dl>
        </section>

        <section class="detalle__panel gb-tarjeta" aria-labelledby="titulo-marca">
          <header>
            <p>Configuración visual</p>
            <h2 id="titulo-marca">Identidad visual</h2>
          </header>
          <dl class="detalle__colores">
            <div>
              <dt>Principal</dt>
              <dd>
                <span :style="{ backgroundColor: empresa.colorPrimario }"></span
                >{{ empresa.colorPrimario }}
              </dd>
            </div>
            <div>
              <dt>Secundario</dt>
              <dd>
                <span :style="{ backgroundColor: empresa.colorSecundario }"></span
                >{{ empresa.colorSecundario }}
              </dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.detalle {
  display: grid;
  gap: var(--gb-gutter);
}

.detalle__resumen {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: var(--gb-radius-xl);
}

.detalle__resumen p,
.detalle__resumen h2,
.detalle__resumen span {
  margin: 0;
}

.detalle__resumen p,
.detalle__panel header p {
  color: var(--gb-red-text);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detalle__resumen h2 {
  margin-top: 0.25rem;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.detalle__resumen div > span {
  display: block;
  margin-top: 0.25rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.detalle__rejilla {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(18rem, 0.8fr);
  gap: var(--gb-gutter);
  align-items: start;
}

.detalle__lateral {
  display: grid;
  gap: var(--gb-gutter);
}

.detalle__panel {
  padding: 1.25rem;
  border-radius: var(--gb-radius-xl);
}

.detalle__panel header {
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--gb-border);
}

.detalle__panel header p,
.detalle__panel header h2 {
  margin: 0;
}

.detalle__panel header h2 {
  margin-top: 0.25rem;
  font-size: var(--gb-tipo-md);
  text-transform: uppercase;
}

.detalle__panel dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin: 0;
}

.detalle__panel dl > div {
  min-width: 0;
  padding: 1rem 0;
  border-bottom: 1px solid var(--gb-border);
}

.detalle__panel dl > div:nth-last-child(-n + 2),
.detalle__panel dl > div:last-child {
  border-bottom: 0;
}

.detalle__panel dl > div:nth-child(even) {
  padding-left: 1rem;
}

.detalle__panel dl > div:nth-child(odd) {
  padding-right: 1rem;
}

.detalle__panel .detalle__completo {
  grid-column: 1 / -1;
  padding-right: 0;
  padding-left: 0;
}

.detalle__panel dt {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detalle__panel dd {
  margin: 0.375rem 0 0;
  overflow-wrap: anywhere;
  color: var(--gb-text);
  font-size: var(--gb-tipo-sm);
}

.detalle__panel a {
  color: var(--gb-red-text);
  text-decoration: none;
}

.detalle__panel a:hover {
  color: var(--gb-link-hover);
  text-decoration: underline;
}

.detalle__metricas {
  grid-template-columns: 1fr !important;
}

.detalle__metricas > div {
  padding: 0.875rem 0 !important;
}

.detalle__metricas dd {
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-lg);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.detalle__colores {
  grid-template-columns: 1fr !important;
}

.detalle__colores > div {
  padding: 0.75rem 0 !important;
}

.detalle__colores dd {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: monospace;
}

.detalle__colores dd span {
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--gb-border-soft);
  border-radius: var(--gb-radius);
}

.tabular {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 78rem) {
  .detalle__rejilla {
    grid-template-columns: 1fr;
  }

  .detalle__lateral {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 52rem) {
  .detalle__resumen {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .detalle__resumen > :last-child {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .detalle__lateral,
  .detalle__panel dl {
    grid-template-columns: 1fr;
  }

  .detalle__panel dl > div {
    grid-column: auto;
    padding-right: 0 !important;
    padding-left: 0 !important;
  }
}
</style>
