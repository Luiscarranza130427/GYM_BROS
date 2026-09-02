<script setup>
import { Download, RotateCw } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import PageHeader from '@/shared/components/PageHeader.vue'
import { useListadoFiltrable } from '@/shared/composables/useListadoFiltrable'
import PagosFilters from '@/modules/billing/components/PagosFilters.vue'
import PagosKpis from '@/modules/billing/components/PagosKpis.vue'
import PagosTable from '@/modules/billing/components/PagosTable.vue'
import PagoReceiptModal from '@/modules/billing/components/PagoReceiptModal.vue'
import {
  obtenerMetricasPagos,
  obtenerReportePagos,
} from '@/modules/billing/services/billing.service'

const metricas = ref({
  totalIngresos: 0,
  totalTransacciones: 0,
  ticketPromedio: 0,
  totalMeses: 0,
  moneda: 'PEN',
})
const cargandoMetricas = ref(false)

const pagoSeleccionado = ref(null)
const modalDetalleAbierto = ref(false)

const {
  estadoVista,
  items,
  paginacion,
  busqueda,
  filtros,
  hayFiltros,
  cargarListado,
  cambiarBusqueda,
  cambiarFiltro,
  cambiarPagina,
  limpiarFiltros,
} = useListadoFiltrable({
  nombreRuta: 'pagos',
  cargar: obtenerReportePagos,
  filtros: {
    empresaId: { permitidos: ['', '1', '2', '3', '4', '5', '6'] },
    planId: { permitidos: ['', '1', '2', '3', '4'] },
  },
  mapearParametros: (f, b) => ({
    busqueda: b,
    empresaId: f.empresaId,
    planId: f.planId,
  }),
  mensajeDeError: 'No pudimos cargar los reportes de pagos.',
})

async function cargarMetricas() {
  cargandoMetricas.value = true
  try {
    const res = await obtenerMetricasPagos({
      busqueda: busqueda.value,
      empresaId: filtros.empresaId,
      planId: filtros.planId,
    })
    metricas.value = res
  } catch {
    // Si fallan métricas se mantienen en 0
  } finally {
    cargandoMetricas.value = false
  }
}

async function recargarTodo() {
  await Promise.all([cargarListado(), cargarMetricas()])
}

function abrirDetalle(pago) {
  pagoSeleccionado.value = pago
  modalDetalleAbierto.value = true
}

function exportarCsv() {
  if (!items.value.length) return

  const encabezados = [
    'ID',
    'Comprobante',
    'Fecha',
    'Empresa',
    'Plan',
    'Meses',
    'Monto (PEN)',
    'Método',
    'Estado',
  ]
  const filas = items.value.map((p) => [
    p.id,
    p.codigo,
    p.fecha,
    `"${p.empresa.nombre}"`,
    `"${p.plan.nombre}"`,
    p.cantidadMeses,
    p.precio,
    `"${p.metodoPago}"`,
    p.estado,
  ])

  const contenidoCsv = [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n')
  const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.setAttribute(
    'download',
    `reporte_pagos_gym_bros_${new Date().toISOString().slice(0, 10)}.csv`,
  )
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

/*
 * Cambiar un filtro rehace también las métricas, que se calculan sobre el
 * conjunto filtrado y no sobre la página visible.
 *
 * Van como funciones con nombre y no como expresiones de dos sentencias en la
 * plantilla: escritas en línea, Prettier las reparte en varias líneas sin
 * separador y el parser de Vue deja de entenderlas —lo que rompió esta vista—.
 */
function cambiarEmpresa(valor) {
  cambiarFiltro('empresaId', valor)
  cargarMetricas()
}

function cambiarPlan(valor) {
  cambiarFiltro('planId', valor)
  cargarMetricas()
}

function limpiar() {
  limpiarFiltros()
  cargarMetricas()
}

onMounted(() => {
  cargarMetricas()
})
</script>

<template>
  <section class="pagos-view">
    <PageHeader
      titulo="Reportes de pagos"
      descripcion="Monitorea la facturación de suscripciones SaaS, transacciones y cobros procesados."
      seccion="Reportes de pagos"
      :ruta-seccion="{ name: 'pagos' }"
      etiqueta="Administración Financiera SaaS"
    >
      <template #acciones>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="estadoVista === 'loading' || cargandoMetricas"
          title="Actualizar datos"
          @click="recargarTodo"
        >
          <RotateCw
            :size="16"
            :class="{ 'icono-girando': estadoVista === 'loading' || cargandoMetricas }"
            aria-hidden="true"
          />
          <span>Actualizar</span>
        </button>

        <button
          type="button"
          class="btn btn-primary"
          :disabled="items.length === 0 || estadoVista === 'loading'"
          title="Exportar listado a archivo CSV"
          @click="exportarCsv"
        >
          <Download :size="16" aria-hidden="true" />
          <span>Exportar CSV</span>
        </button>
      </template>
    </PageHeader>

    <!-- Métricas financieras -->
    <PagosKpis :metricas="metricas" :cargando="cargandoMetricas" />

    <!-- Barra de filtros -->
    <PagosFilters
      :busqueda="busqueda"
      :empresa-id="filtros.empresaId"
      :plan-id="filtros.planId"
      :cargando="estadoVista === 'loading'"
      :hay-filtros-activos="hayFiltros"
      @update:busqueda="cambiarBusqueda"
      @update:empresa-id="cambiarEmpresa"
      @update:plan-id="cambiarPlan"
      @limpiar="limpiar"
    />

    <!-- Tabla de transacciones -->
    <PagosTable
      :items="items"
      :paginacion="paginacion"
      :cargando="estadoVista === 'loading'"
      @ver-detalle="abrirDetalle"
      @cambiar-pagina="cambiarPagina"
    />

    <!-- Modal de comprobante / recibo -->
    <PagoReceiptModal
      :abierto="modalDetalleAbierto"
      :pago="pagoSeleccionado"
      @cerrar="modalDetalleAbierto = false"
    />
  </section>
</template>

<style scoped>
.pagos-view {
  display: grid;
  gap: var(--gb-dashboard-gap, 1.5rem);
  width: min(100%, 86rem);
  margin: 0 auto;
  padding-bottom: var(--gb-margen, 2rem);
}

.icono-girando {
  animation: girar 1s linear infinite;
}

@keyframes girar {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
