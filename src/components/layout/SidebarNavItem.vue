<script setup>
import { RouterLink } from 'vue-router'

import IconoSvg from '@/components/base/IconoSvg.vue'

defineProps({
  /** Entrada de SECCIONES: { name, title, icono }. */
  seccion: { type: Object, required: true },
  /** Menú contraído por el usuario. El caso "ventana estrecha" lo cubre el CSS. */
  compacto: { type: Boolean, default: false },
})
</script>

<template>
  <li>
    <RouterLink
      class="enlace"
      :class="{ 'enlace--compacto': compacto }"
      :to="{ name: seccion.name }"
      :title="compacto ? seccion.title : null"
    >
      <span class="enlace__icono">
        <IconoSvg :nombre="seccion.icono" />
      </span>

      <!-- El texto se dibuja siempre: al contraer el menú deja de verse, pero
           sigue dando su nombre accesible al enlace. -->
      <span class="enlace__texto gb-oculto-al-contraer">{{ seccion.title }}</span>
    </RouterLink>
  </li>
</template>

<style scoped>
.enlace {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  /* La franja izquierda transparente reserva el sitio del indicador activo, para
     que el texto no se desplace al cambiar de sección. */
  border-left: 4px solid transparent;
  border-radius: var(--gb-radius);
  color: var(--gb-text-muted);
  font-family: var(--gb-fuente-titulo);
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.enlace--compacto {
  justify-content: center;
  padding-inline: 0.5rem;
}

.enlace:hover {
  background-color: var(--gb-surface-highest);
  color: var(--gb-text);
}

/* Clase que aplica vue-router a la sección activa. */
.enlace.router-link-active {
  background-color: var(--gb-surface-high);
  border-left-color: var(--gb-red);
  box-shadow: var(--gb-relieve);
  color: var(--gb-text);
  font-weight: 800;
}

.enlace.router-link-active .enlace__icono {
  color: var(--gb-red-text);
}

.enlace__icono {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  font-size: 1.125rem;
  line-height: 1;
}

.enlace__texto {
  overflow: hidden;
  font-size: var(--gb-tipo-sm);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
}

/* Ventana demasiado estrecha para el menú ancho: se centra igual que al
   contraerlo a mano. El texto lo oculta la utilidad global. */
@media (max-width: 64rem) {
  .enlace {
    justify-content: center;
    padding-inline: 0.5rem;
  }
}
</style>
