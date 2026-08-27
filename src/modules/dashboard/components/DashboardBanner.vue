<script setup>
import { RouterLink } from 'vue-router'

import heroUrl from '@/assets/images/stitch/command-streams.jpg'
import IconoSvg from '@/components/base/IconoSvg.vue'

defineProps({
  banner: { type: Object, required: true },
})
</script>

<template>
  <article class="banner gb-tarjeta">
    <img :src="heroUrl" alt="" width="512" height="279" fetchpriority="high" />
    <div class="banner__contenido">
      <p class="banner__estado"><span aria-hidden="true"></span> Sistema operativo</p>
      <h2>{{ banner.titulo }}</h2>
      <p class="banner__descripcion">{{ banner.descripcion }}</p>
      <RouterLink
        v-if="banner.accion?.texto"
        class="btn btn-primary banner__accion"
        :to="{ name: 'usuarios' }"
      >
        <IconoSvg nombre="people" />
        {{ banner.accion.texto }}
      </RouterLink>
    </div>
  </article>
</template>

<style scoped>
.banner {
  position: relative;
  min-height: 14rem;
  overflow: hidden;
  border-radius: var(--gb-radius-xl);
}

.banner > img {
  position: absolute;
  inset: 0 0 0 auto;
  width: 58%;
  height: 100%;
  object-fit: cover;
  opacity: 0.42;
}

.banner::after {
  position: absolute;
  inset: 0;
  background-color: var(--gb-overlay-soft);
  content: '';
}

.banner__contenido {
  position: relative;
  z-index: 1;
  max-width: 47rem;
  padding: 1.75rem 2.25rem;
}

.banner__estado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.625rem;
  color: var(--gb-red-text);
  font-size: var(--gb-tipo-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.banner__estado span {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--gb-green);
  border-radius: var(--gb-radius-pill);
}

.banner h2 {
  margin: 0;
  font-size: var(--gb-tipo-xl);
  font-weight: 900;
  line-height: 1.08;
  text-transform: uppercase;
}

.banner__descripcion {
  max-width: 40rem;
  margin: 0.75rem 0 1.25rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-md);
  line-height: 1.55;
}

.banner__accion {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  padding: 0.625rem 1.375rem;
  text-decoration: none;
}

@media (max-width: 52rem) {
  .banner > img {
    width: 100%;
    opacity: 0.24;
  }

  .banner__contenido {
    padding: 1.5rem;
  }
}
</style>
