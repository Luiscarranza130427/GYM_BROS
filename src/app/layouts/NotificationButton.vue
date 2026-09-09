<script setup>
import { Bell } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { contarNoLeidas } from '@/modules/notificaciones/services/notificaciones.service'

const sinLeer = ref(0)

onMounted(async () => {
  try {
    sinLeer.value = await contarNoLeidas()
  } catch {
    // Si el contador falla, la campana se muestra sin distintivo
  }
})
</script>

<template>
  <RouterLink class="campana" :to="{ name: 'notificaciones' }" aria-label="Notificaciones">
    <Bell :size="18" aria-hidden="true" />
    <span v-if="sinLeer > 0" class="campana__badge" aria-hidden="true">
      {{ sinLeer > 99 ? '99+' : sinLeer }}
    </span>
    <span class="visually-hidden">
      Notificaciones{{ sinLeer > 0 ? `: ${sinLeer} sin leer` : '' }}
    </span>
  </RouterLink>
</template>

<style scoped>
.campana {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.625rem;
  height: 2.625rem;
  background-color: #181818;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  color: var(--gb-text-muted);
  font-size: 1.125rem;
  line-height: 1;
  text-decoration: none;
  transition: all 0.2s ease;
}

.campana:hover {
  background-color: #222222;
  border-color: rgba(229, 9, 20, 0.45);
  color: var(--gb-text);
  box-shadow: 0 0 10px rgba(229, 9, 20, 0.25);
}

.campana__badge {
  position: absolute;
  top: -0.15rem;
  right: -0.15rem;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--gb-red);
  color: #ffffff;
  border: 2px solid #141414;
  border-radius: 9999px;
  font-family: var(--gb-fuente-titulo);
  font-size: 0.625rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 0 8px rgba(229, 9, 20, 0.7);
}
</style>
