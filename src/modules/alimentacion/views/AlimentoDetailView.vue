<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import IconoSvg from '@/components/base/IconoSvg.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import { TIPOS_ALIMENTO, UNIDADES, etiquetaDe } from '@/modules/alimentacion/catalogos'
import AlimentoTipoBadge from '@/modules/alimentacion/components/AlimentoTipoBadge.vue'
import { eliminarAlimento, obtenerAlimento } from '@/services/alimentacion.service'
import { formatearNumero } from '@/utils/formato'

const route = useRoute()
const router = useRouter()
const estado = ref('loading')
const alimento = ref(null)
const mensajeError = ref('')
const mensajeExito = ref('')
const dialogoAbierto = ref(false)
const eliminando = ref(false)
let solicitudActual = 0

/** `g` o `ml`: la medida a la que se refieren todas las cifras de la ficha. */
const unidad = computed(() => etiquetaDe(UNIDADES, alimento.value?.unidadBase))

/**
 * Un alimento que forma parte de alguna comida no se puede retirar: el servicio
 * responde 422 y las comidas se quedarían sin sus macros. Sabiendo `usos`, el
 * botón no se ofrece siquiera; el error se sigue manejando por si otro
 * administrador lo usa entre que se cargó la ficha y se pulsa el botón.
 */
const sePuedeRetirar = computed(() => alimento.value?.usos === 0)

async function cargar() {
  const idSolicitud = ++solicitudActual
  estado.value = 'loading'
  alimento.value = null
  dialogoAbierto.value = false
  mensajeError.value = ''

  try {
    const respuesta = await obtenerAlimento(route.params.id)
    if (idSolicitud !== solicitudActual) return
    alimento.value = respuesta
    estado.value = 'success'
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    mensajeError.value = error?.message || 'No pudimos cargar el alimento.'
    estado.value = error?.status === 404 ? 'not-found' : 'error'
  }
}

/**
 * La ficha NO se vacía si la eliminación falla: el alimento sigue existiendo y
 * castigar al administrador quitándole lo que estaba mirando no ayuda. El aviso
 * va encima, y un 422 sin `errors` es una regla de negocio: su `message` explica
 * en cuántas comidas se usa y se muestra tal cual.
 */
async function confirmarEliminacion() {
  if (!alimento.value || eliminando.value) return
  eliminando.value = true

  try {
    await eliminarAlimento(alimento.value.id)
    dialogoAbierto.value = false
    await router.push({ name: 'alimentos-listado', query: { notice: 'deactivated' } })
  } catch (error) {
    dialogoAbierto.value = false
    mensajeError.value = error?.message || 'No pudimos retirar el alimento del catálogo.'
    /*
     * Y se refresca el contador de usos.
     *
     * Este 422 sólo llega si el alimento SE USA, y la ficha creía que no —por
     * eso ofreció el botón—. Sin refrescar, la pantalla se contradice a sí
     * misma: «Comidas que lo usan: 0» junto a un error que dice que se usa en
     * seis, y el botón sigue ahí invitando a repetir el mismo fallo.
     *
     * Se refresca sólo el dato, sin tocar `estado`: la ficha que se está
     * mirando sigue siendo válida y vaciarla sería castigar al usuario por una
     * acción que no procedía.
     */
    await refrescarUsos()
  } finally {
    eliminando.value = false
  }
}

/** Vuelve a pedir el alimento para actualizar `usos`, sin estados de carga. */
async function refrescarUsos() {
  const idSolicitud = solicitudActual
  try {
    const actualizado = await obtenerAlimento(route.params.id)
    if (idSolicitud === solicitudActual) alimento.value = actualizado
  } catch {
    // Si tampoco se puede refrescar, se deja lo que hubiera: el mensaje de
    // error ya explica lo que pasó y encadenar un segundo aviso no aporta.
  }
}

watch(
  () => route.params.id,
  () => {
    mensajeExito.value = ''
    const notice = route.query.notice
    if (notice === 'created') mensajeExito.value = 'Alimento creado correctamente.'
    if (notice === 'updated') mensajeExito.value = 'Alimento actualizado correctamente.'
    if (notice === 'created' || notice === 'updated') {
      router.replace({ name: 'alimento-detalle', params: { id: route.params.id } }).catch(() => {})
    }
    cargar()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  solicitudActual += 1
})
</script>

<template>
  <section class="alimento-detalle">
    <PageHeader
      :titulo="alimento?.nombre ?? 'Detalle del alimento'"
      descripcion="Consulta la ficha nutricional y el uso del alimento en las comidas."
      seccion="Catálogo de alimentos"
      :ruta-seccion="{ name: 'alimentos-listado' }"
      etiqueta="Alimentación"
      :migas="[alimento?.nombre ?? 'Alimento']"
    >
      <template v-if="estado === 'success' && alimento" #acciones>
        <RouterLink
          class="btn btn-ghost alimento-detalle__accion"
          :to="{ name: 'alimento-editar', params: { id: alimento.id } }"
        >
          <IconoSvg nombre="pencil" />
          Editar
        </RouterLink>
        <button
          v-if="sePuedeRetirar"
          type="button"
          class="btn btn-outline-danger alimento-detalle__accion"
          @click="dialogoAbierto = true"
        >
          <IconoSvg nombre="dash-circle" />
          Retirar del catálogo
        </button>
      </template>
    </PageHeader>

    <p v-if="mensajeExito" class="alimento-detalle__exito" role="status">
      <IconoSvg nombre="check-circle-fill" />
      {{ mensajeExito }}
    </p>
    <p v-if="mensajeError && estado === 'success'" class="alert alert-danger" role="alert">
      {{ mensajeError }}
    </p>

    <section
      v-if="estado === 'loading'"
      class="alimento-detalle__estado gb-tarjeta"
      aria-busy="true"
    >
      <span class="spinner-border" aria-hidden="true"></span>
      <p>Cargando información del alimento…</p>
    </section>

    <div v-else-if="estado === 'success' && alimento" class="detalle">
      <section class="detalle__resumen gb-tarjeta">
        <span class="detalle__icono" aria-hidden="true"><IconoSvg nombre="fork-knife" /></span>
        <div>
          <p>Alimento del catálogo</p>
          <h2>{{ alimento.nombre }}</h2>
          <AlimentoTipoBadge :tipo="alimento.tipo" />
        </div>
      </section>

      <div class="detalle__rejilla">
        <section class="detalle__panel gb-tarjeta" aria-labelledby="titulo-nutricion">
          <header>
            <p>Ficha nutricional</p>
            <h2 id="titulo-nutricion">Valores por 100 {{ unidad }}</h2>
          </header>
          <dl>
            <div>
              <dt>Energía</dt>
              <dd class="tabular">{{ formatearNumero(alimento.calorias) }} kcal</dd>
            </div>
            <div>
              <dt>Proteínas</dt>
              <dd class="tabular">{{ formatearNumero(alimento.proteinas) }} g</dd>
            </div>
            <div>
              <dt>Carbohidratos</dt>
              <dd class="tabular">{{ formatearNumero(alimento.carbohidratos) }} g</dd>
            </div>
            <div>
              <dt>Grasas</dt>
              <dd class="tabular">{{ formatearNumero(alimento.grasas) }} g</dd>
            </div>
            <div>
              <dt>Fibra</dt>
              <dd class="tabular">{{ formatearNumero(alimento.fibra) }} g</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{{ etiquetaDe(TIPOS_ALIMENTO, alimento.tipo) }}</dd>
            </div>
          </dl>
        </section>

        <aside class="detalle__lateral">
          <section class="detalle__panel gb-tarjeta" aria-labelledby="titulo-uso">
            <header>
              <p>Resumen operativo</p>
              <h2 id="titulo-uso">Uso en comidas</h2>
            </header>
            <dl class="detalle__metricas">
              <div>
                <dt>Comidas que lo usan</dt>
                <dd>{{ formatearNumero(alimento.usos) }}</dd>
              </div>
            </dl>
            <p class="detalle__nota">
              <template v-if="sePuedeRetirar">
                Ningún plan lo utiliza todavía, así que puede retirarse del catálogo.
              </template>
              <template v-else>
                Mientras forme parte de alguna comida no puede retirarse del catálogo: esas comidas
                se quedarían sin sus macros.
              </template>
            </p>
          </section>
        </aside>
      </div>
    </div>

    <section
      v-else
      class="alimento-detalle__estado gb-tarjeta"
      :role="estado === 'error' ? 'alert' : 'status'"
    >
      <IconoSvg nombre="x-circle" />
      <h2>
        {{ estado === 'not-found' ? 'Alimento no encontrado' : 'No pudimos cargar el alimento' }}
      </h2>
      <p>{{ mensajeError }}</p>
      <div>
        <button v-if="estado === 'error'" type="button" class="btn btn-primary" @click="cargar">
          Reintentar
        </button>
        <RouterLink class="btn btn-ghost" :to="{ name: 'alimentos-listado' }">
          Volver al catálogo
        </RouterLink>
      </div>
    </section>

    <ConfirmDialog
      :abierto="dialogoAbierto"
      titulo="¿Retirar del catálogo?"
      :descripcion="`${alimento?.nombre ?? 'El alimento'} dejará de estar disponible para armar comidas. Esta acción no se puede deshacer.`"
      :confirmando="eliminando"
      etiqueta-confirmar="Retirar alimento"
      etiqueta-confirmando="Retirando…"
      @cancelar="dialogoAbierto = false"
      @confirmar="confirmarEliminacion"
    />
  </section>
</template>

<style scoped>
.alimento-detalle {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: min(100%, 86rem);
  margin: 0 auto;
  padding-bottom: var(--gb-margen);
}

.alimento-detalle__accion {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding-inline: 1rem;
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-decoration: none;
  text-transform: uppercase;
}

.alimento-detalle__exito {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  padding: 0.75rem 1rem;
  background-color: rgba(var(--gb-green-rgb), 0.08);
  border: 1px solid rgba(var(--gb-green-rgb), 0.28);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-green);
  font-size: var(--gb-tipo-sm);
}

.alimento-detalle .alert {
  margin: 0;
}

.alimento-detalle__estado {
  display: grid;
  place-items: center;
  min-height: 28rem;
  padding: 2rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}

.alimento-detalle__estado > svg {
  color: var(--gb-text-soft);
  font-size: 2rem;
}

.alimento-detalle__estado h2,
.alimento-detalle__estado p {
  margin: 0;
}

.alimento-detalle__estado h2 {
  margin-top: 1rem;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.alimento-detalle__estado p {
  margin-top: 0.5rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.alimento-detalle__estado div {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.alimento-detalle__estado .btn {
  text-decoration: none;
}

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

.detalle__icono {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  background-color: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-red-text);
  font-size: 1.75rem;
}

.detalle__resumen p,
.detalle__resumen h2 {
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
  margin: 0.25rem 0 0.5rem;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
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
  margin: 0;
}

.detalle__panel dl > div {
  min-width: 0;
  padding: 1rem 0;
  border-bottom: 1px solid var(--gb-border);
}

.detalle__panel dl > div:last-child {
  border-bottom: 0;
}

.detalle__panel dl > div:nth-child(even) {
  padding-left: 1rem;
}

.detalle__panel dl > div:nth-child(odd) {
  padding-right: 1rem;
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

.detalle__nota {
  margin: 0.875rem 0 0;
  padding-top: 0.875rem;
  border-top: 1px solid var(--gb-border);
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.tabular {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 78rem) {
  .detalle__rejilla {
    grid-template-columns: 1fr;
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
