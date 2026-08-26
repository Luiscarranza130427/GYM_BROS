<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  seccion: { type: String, required: true },
  rutaSeccion: { type: [Object, String], required: true },
  etiqueta: { type: String, default: 'Gestión administrativa' },
  migas: { type: Array, default: () => [] },
})
</script>

<template>
  <header class="cabecera-pagina">
    <nav aria-label="Migas de pan">
      <ol>
        <li><RouterLink :to="{ name: 'dashboard' }">Dashboard</RouterLink></li>
        <li>
          <RouterLink :to="rutaSeccion" :aria-current="migas.length ? null : 'page'">
            {{ seccion }}
          </RouterLink>
        </li>
        <li
          v-for="(miga, indice) in migas"
          :key="`${indice}-${miga}`"
          :aria-current="indice === migas.length - 1 ? 'page' : null"
        >
          {{ miga }}
        </li>
      </ol>
    </nav>

    <div class="cabecera-pagina__fila">
      <div>
        <p>{{ etiqueta }}</p>
        <h1>{{ titulo }}</h1>
        <span>{{ descripcion }}</span>
      </div>
      <div v-if="$slots.acciones" class="cabecera-pagina__acciones">
        <slot name="acciones" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.cabecera-pagina {
  display: grid;
  gap: 0.75rem;
}

.cabecera-pagina nav ol {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
  list-style: none;
}

.cabecera-pagina nav li:not(:last-child)::after {
  margin-left: 0.5rem;
  color: var(--gb-text-soft);
  content: '/';
}

.cabecera-pagina nav a {
  color: inherit;
  text-decoration: none;
}

.cabecera-pagina nav a:hover {
  color: var(--gb-text);
}

.cabecera-pagina__fila {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.cabecera-pagina p,
.cabecera-pagina h1,
.cabecera-pagina span {
  margin: 0;
}

.cabecera-pagina p {
  color: var(--gb-red-text);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.cabecera-pagina h1 {
  margin-top: 0.25rem;
  font-size: var(--gb-tipo-xl);
  font-weight: 900;
  line-height: 1.1;
  text-transform: uppercase;
}

.cabecera-pagina__fila > div > span {
  display: block;
  margin-top: 0.375rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.cabecera-pagina__acciones {
  flex: none;
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 52rem) {
  .cabecera-pagina__fila {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
