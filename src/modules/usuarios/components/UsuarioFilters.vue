<script setup>
import { computed } from 'vue'

import IconoSvg from '@/components/base/IconoSvg.vue'

const props = defineProps({
  busqueda: { type: String, default: '' },
  empresa: { type: String, default: 'all' },
  estado: { type: String, default: 'all' },
  suscripcion: { type: String, default: 'all' },
  rol: { type: String, default: 'all' },
  empresas: { type: Array, default: () => [] },
  cargando: { type: Boolean, default: false },
})

defineEmits([
  'update:busqueda',
  'update:empresa',
  'update:estado',
  'update:suscripcion',
  'update:rol',
  'limpiar',
])

const filtrosActivos = computed(
  () =>
    props.busqueda.trim() ||
    props.empresa !== 'all' ||
    props.estado !== 'all' ||
    props.suscripcion !== 'all' ||
    props.rol !== 'all',
)
</script>

<template>
  <section class="filtros gb-tarjeta" aria-label="Filtros de usuarios" :aria-busy="cargando">
    <div class="filtros__busqueda">
      <label class="visually-hidden" for="buscar-usuario">Buscar usuario</label>
      <IconoSvg nombre="search" />
      <input
        id="buscar-usuario"
        :value="busqueda"
        class="form-control"
        type="search"
        name="buscarUsuario"
        placeholder="Buscar por nombre, correo o documento…"
        autocomplete="off"
        @input="$emit('update:busqueda', $event.target.value)"
      />
    </div>

    <div class="filtros__campo">
      <label for="filtro-empresa">Empresa</label>
      <select
        id="filtro-empresa"
        :value="empresa"
        class="form-select"
        @change="$emit('update:empresa', $event.target.value)"
      >
        <option value="all">Todas</option>
        <option v-for="opcion in empresas" :key="opcion.id" :value="String(opcion.id)">
          {{ opcion.nombre }}
        </option>
      </select>
    </div>

    <div class="filtros__campo">
      <label for="filtro-estado">Estado</label>
      <select
        id="filtro-estado"
        :value="estado"
        class="form-select"
        @change="$emit('update:estado', $event.target.value)"
      >
        <option value="all">Todos</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>

    <div class="filtros__campo">
      <label for="filtro-suscripcion">Suscripción</label>
      <select
        id="filtro-suscripcion"
        :value="suscripcion"
        class="form-select"
        @change="$emit('update:suscripcion', $event.target.value)"
      >
        <option value="all">Todas</option>
        <option value="active">Activa</option>
        <option value="expiring">Por vencer</option>
        <option value="expired">Vencida</option>
        <option value="none">Sin suscripción</option>
      </select>
    </div>

    <div class="filtros__campo">
      <label for="filtro-rol">Rol</label>
      <select
        id="filtro-rol"
        :value="rol"
        class="form-select"
        @change="$emit('update:rol', $event.target.value)"
      >
        <option value="all">Todos</option>
        <option value="admin">Administrador</option>
        <option value="manager">Empresa</option>
        <option value="trainer">Entrenador</option>
        <option value="member">Usuario</option>
      </select>
    </div>

    <button
      v-if="filtrosActivos"
      type="button"
      class="btn btn-ghost filtros__limpiar"
      @click="$emit('limpiar')"
    >
      <IconoSvg nombre="x-circle" />
      Limpiar filtros
    </button>
  </section>
</template>

<style scoped>
.filtros {
  display: grid;
  grid-template-columns: minmax(17rem, 2fr) repeat(4, minmax(8.5rem, 1fr)) auto;
  align-items: end;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: var(--gb-radius-lg);
}

.filtros__busqueda {
  position: relative;
}

.filtros__busqueda i {
  position: absolute;
  top: 50%;
  left: 0.875rem;
  z-index: 1;
  color: var(--gb-text-muted);
  transform: translateY(-50%);
}

.filtros__busqueda .form-control {
  min-height: 2.75rem;
  padding-left: 2.5rem;
  background-color: var(--gb-surface-lowest);
}

.filtros__campo label {
  display: block;
  margin: 0 0 0.375rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.filtros__campo .form-select {
  min-height: 2.75rem;
  background-color: var(--gb-surface-lowest);
  font-size: var(--gb-tipo-sm);
}

.filtros__limpiar {
  min-height: 2.75rem;
  padding-inline: 0.75rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
  white-space: nowrap;
}

.filtros__limpiar i {
  margin-right: 0.375rem;
}

@media (max-width: 90rem) {
  .filtros {
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  }

  .filtros__busqueda {
    grid-column: 1 / -1;
  }
}

@media (max-width: 60rem) {
  .filtros {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filtros__limpiar {
    justify-self: start;
  }
}

@media (max-width: 36rem) {
  .filtros {
    grid-template-columns: 1fr;
  }

  .filtros__busqueda {
    grid-column: auto;
  }
}
</style>
