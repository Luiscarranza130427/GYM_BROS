<script setup>
import { RouterView } from 'vue-router'

import marcaHorizontalUrl from '@/assets/images/brand/gym-bros-lockup.webp'
import atletaUrl from '@/assets/images/brand/login-athlete.webp'
</script>

<template>
  <div class="acceso">
    <main class="acceso__panel">
      <section class="acceso__formulario" aria-label="Acceso administrativo">
        <div class="acceso__formulario-interior">
          <img class="acceso__marca" :src="marcaHorizontalUrl" alt="Gym Bros" />
          <RouterView />
        </div>
      </section>

      <section class="acceso__visual" aria-label="Entrenamiento de fuerza Gym Bros">
        <img :src="atletaUrl" alt="Atleta entrenando peso muerto en un gimnasio Gym Bros" />
        <div class="acceso__mensaje">
          <p><span aria-hidden="true"></span>Centro de mando activo</p>
          <h2>Fuerza en cada decisión.</h2>
          <span>Empresas, atletas y rendimiento en una sola plataforma.</span>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.acceso {
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  display: grid;
  place-items: center;
  padding: clamp(0.75rem, 2vw, 1.5rem);
  overflow: hidden;
  background-color: var(--gb-bg);
}

.acceso__panel {
  display: grid;
  grid-template-columns: minmax(23.5rem, 0.84fr) minmax(0, 1.16fr);
  width: min(100%, 72rem);
  height: 100%;
  max-height: 42rem;
  min-height: 0;
  overflow: hidden;
  background-color: var(--gb-surface);
  border: 1px solid var(--gb-border);
  border-radius: 1rem;
  box-shadow: var(--gb-relieve);
}

.acceso__formulario {
  z-index: 1;
  display: grid;
  place-items: center;
  padding: clamp(1.5rem, 4vw, 3.25rem);
  background-color: var(--gb-surface);
}

.acceso__formulario-interior {
  width: min(100%, 25rem);
}

.acceso__marca {
  display: block;
  width: min(100%, 16rem);
  height: auto;
  margin: 0 0 1.5rem;
  object-fit: contain;
}

.acceso__visual {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background-color: var(--gb-surface-lowest);
  border-left: 1px solid var(--gb-border);
}

.acceso__visual > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 54% center;
}

.acceso__mensaje {
  position: absolute;
  right: 2rem;
  bottom: 2rem;
  left: 2rem;
  padding: 1.25rem;
  background-color: var(--gb-overlay-strong);
  border: 1px solid var(--gb-border-soft);
  border-left: 3px solid var(--gb-red);
  border-radius: var(--gb-radius-lg);
}

.acceso__mensaje p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.625rem;
  color: var(--gb-red-text);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.acceso__mensaje p span {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--gb-green);
  border-radius: var(--gb-radius-pill);
}

.acceso__mensaje h2 {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 900;
  line-height: 1.08;
  text-transform: uppercase;
}

.acceso__mensaje > span {
  display: block;
  margin-top: 0.625rem;
  color: var(--gb-text-muted);
  font-size: 0.875rem;
}

@media (max-width: 64rem) {
  .acceso {
    padding: 0.75rem;
  }
}

@media (max-height: 48rem) and (min-width: 42.01rem) {
  .acceso__panel {
    max-height: 100%;
  }

  .acceso__formulario {
    padding-block: 1.25rem;
  }

  .acceso__marca {
    width: min(100%, 14rem);
    margin-bottom: 1rem;
  }

  .acceso__mensaje {
    right: 1.25rem;
    bottom: 1.25rem;
    left: 1.25rem;
  }
}

@media (max-width: 56rem) {
  .acceso__panel {
    grid-template-columns: minmax(22rem, 1fr) minmax(18rem, 0.75fr);
  }

  .acceso__mensaje {
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
  }
}

@media (max-width: 42rem) {
  .acceso {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 0;
    overflow: auto;
  }

  .acceso__panel {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
    min-height: 100vh;
    min-height: 100dvh;
    border: 0;
    border-radius: 0;
  }

  .acceso__formulario {
    min-height: 100vh;
    min-height: 100dvh;
    padding: 1.5rem;
  }

  .acceso__visual {
    display: none;
  }
}
</style>
