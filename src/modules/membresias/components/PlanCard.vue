<script setup>
import {
  Check,
  Clock,
  Crown,
  Dumbbell,
  ExternalLink,
  Flame,
  Pencil,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  plan: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['eliminar'])

const formatearMonto = (monto) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(monto || 0)
}

const servicios = computed(() => {
  if (!props.plan.contenido) return []
  return props.plan.contenido
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
})

const esDestacado = computed(() => {
  const nombre = props.plan.nombre?.toLowerCase() || ''
  return nombre.includes('titanio') || nombre.includes('fuerza') || nombre.includes('pro')
})

const porcentajeDescuento = computed(() => {
  if (
    props.plan.precioOriginal &&
    props.plan.precioInicial &&
    props.plan.precioOriginal > props.plan.precioInicial
  ) {
    return Math.round(
      ((props.plan.precioOriginal - props.plan.precioInicial) / props.plan.precioOriginal) * 100,
    )
  }
  return 0
})

const iconoPlan = computed(() => {
  const nombre = props.plan.nombre?.toLowerCase() || ''
  if (nombre.includes('titanio')) return Crown
  if (nombre.includes('fuerza')) return Dumbbell
  if (nombre.includes('pro') || nombre.includes('anual')) return Sparkles
  if (nombre.includes('impulso')) return Zap
  return Flame
})
</script>

<template>
  <article
    class="plan-card gb-tarjeta"
    :class="{
      'plan-card--destacado': esDestacado,
      'plan-card--inactivo': !plan.activo,
    }"
  >
    <!-- Cinta de recomendación para planes destacados -->
    <div v-if="esDestacado" class="plan-card__cinta">
      <Sparkles :size="12" aria-hidden="true" />
      <span>Más Popular</span>
    </div>

    <div class="plan-card__cuerpo">
      <!-- Cabecera de la tarjeta: Icono, Título y Badge de Estado -->
      <header class="plan-card__cabecera">
        <div class="plan-card__icono-caja" aria-hidden="true">
          <component :is="iconoPlan" :size="22" />
        </div>
        <div class="plan-card__titulos">
          <div class="plan-card__nombre-fila">
            <h3 class="plan-card__nombre">{{ plan.nombre }}</h3>
            <span
              class="plan-card__badge-estado"
              :class="
                plan.activo
                  ? 'plan-card__badge-estado--activo'
                  : 'plan-card__badge-estado--inactivo'
              "
            >
              {{ plan.activo ? 'Disponible' : 'Inactivo' }}
            </span>
          </div>
          <p class="plan-card__descripcion">{{ plan.descripcion }}</p>
        </div>
      </header>

      <!-- Bloque Hero del Precio -->
      <div class="plan-card__precio-bloque">
        <div class="plan-card__precio-monto">
          <span class="plan-card__precio-actual">{{ formatearMonto(plan.precioInicial) }}</span>
          <span class="plan-card__precio-periodo">/ {{ plan.duracionDias }} días</span>
        </div>

        <div v-if="porcentajeDescuento > 0" class="plan-card__descuento-fila">
          <span class="plan-card__precio-tachado">{{ formatearMonto(plan.precioOriginal) }}</span>
          <span class="plan-card__descuento-tag">-{{ porcentajeDescuento }}% OFF</span>
        </div>
      </div>

      <!-- Especificaciones clave: Capacidad y Duración -->
      <div class="plan-card__specs">
        <div class="plan-card__spec-chip">
          <Users :size="14" class="plan-card__spec-icono" aria-hidden="true" />
          <span
            >Hasta <strong>{{ plan.limiteUsuarios.toLocaleString('es-PE') }}</strong> usuarios</span
          >
        </div>
        <div class="plan-card__spec-chip">
          <Clock :size="14" class="plan-card__spec-icono" aria-hidden="true" />
          <span
            >Vigencia: <strong>{{ plan.duracionDias }} días</strong></span
          >
        </div>
      </div>

      <!-- Lista de Beneficios y Servicios -->
      <div class="plan-card__servicios">
        <h4 class="plan-card__servicios-titulo">
          <ShieldCheck :size="14" aria-hidden="true" />
          <span>Servicios y beneficios incluidos</span>
        </h4>
        <ul class="plan-card__servicios-lista">
          <li v-for="(servicio, idx) in servicios" :key="idx" class="plan-card__servicio-item">
            <span class="plan-card__check-icono" aria-hidden="true">
              <Check :size="12" />
            </span>
            <span class="plan-card__servicio-texto">{{ servicio }}</span>
          </li>
          <li
            v-if="servicios.length === 0"
            class="plan-card__servicio-item plan-card__servicio-item--vacio"
          >
            <span>Sin servicios adicionales especificados</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Barra inferior de acciones CRUD -->
    <footer class="plan-card__pie">
      <a
        v-if="plan.enlaceWhatsapp"
        :href="plan.enlaceWhatsapp"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-secondary plan-card__btn-whatsapp"
        title="Contactar o consultar por WhatsApp"
      >
        <span>WhatsApp</span>
        <ExternalLink :size="14" aria-hidden="true" />
      </a>

      <div class="plan-card__acciones-secundarias">
        <RouterLink
          class="btn btn-secondary plan-card__btn-editar"
          :to="{ name: 'plan-editar', params: { id: plan.id } }"
          title="Editar plan"
        >
          <Pencil :size="15" aria-hidden="true" />
          <span>Editar</span>
        </RouterLink>

        <button
          type="button"
          class="btn btn-ghost plan-card__btn-eliminar btn-icono-accion--peligro"
          title="Eliminar plan comercial"
          aria-label="Eliminar plan"
          @click="emit('eliminar', plan)"
        >
          <Trash2 :size="16" aria-hidden="true" />
        </button>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  border-radius: var(--gb-radius-xl, 1rem);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(32, 33, 38, 0.95) 0%, rgba(20, 21, 26, 0.98) 100%);
  padding: 1.5rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.plan-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.5),
    0 0 15px rgba(225, 29, 72, 0.1);
}

/* Variante Destacada (Más Popular) */
.plan-card--destacado {
  border-color: rgba(225, 29, 20, 0.45);
  background: linear-gradient(180deg, rgba(42, 24, 28, 0.95) 0%, rgba(22, 20, 24, 0.98) 100%);
  box-shadow: 0 6px 24px rgba(225, 29, 20, 0.18);
}

.plan-card--destacado:hover {
  border-color: rgba(225, 29, 20, 0.7);
  box-shadow: 0 14px 36px rgba(225, 29, 20, 0.28);
}

/* Cinta flotante Más Popular */
.plan-card__cinta {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.95rem;
  background: linear-gradient(135deg, #e50914 0%, #b8000c 100%);
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom-left-radius: var(--gb-radius-lg, 0.5rem);
  box-shadow: 0 2px 8px rgba(229, 9, 20, 0.4);
}

.plan-card__cuerpo {
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Cabecera */
.plan-card__cabecera {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.plan-card__icono-caja {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--gb-radius-lg, 0.5rem);
  background: linear-gradient(135deg, rgba(225, 29, 20, 0.18) 0%, rgba(225, 29, 20, 0.05) 100%);
  border: 1px solid rgba(225, 29, 20, 0.3);
  color: var(--gb-red-text, #ffb4aa);
  flex-shrink: 0;
}

.plan-card--destacado .plan-card__icono-caja {
  background: linear-gradient(135deg, rgba(225, 29, 20, 0.3) 0%, rgba(225, 29, 20, 0.1) 100%);
  border-color: rgba(225, 29, 20, 0.55);
  color: #ffb4aa;
}

.plan-card__titulos {
  flex: 1;
  min-width: 0;
}

.plan-card__nombre-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.plan-card__nombre {
  margin: 0;
  font-family: var(--gb-fuente-titulo, sans-serif);
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.plan-card__descripcion {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--gb-text-muted, #c6c6c6);
  line-height: 1.35;
  min-height: 2.2rem;
}

.plan-card__badge-estado {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--gb-radius-pill, 9999px);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.plan-card__badge-estado--activo {
  background-color: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.plan-card__badge-estado--inactivo {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--gb-text-muted, #c6c6c6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Precio Hero */
.plan-card__precio-bloque {
  padding: 1rem 1.1rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--gb-radius-lg, 0.5rem);
  margin-bottom: 1rem;
}

.plan-card__precio-monto {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.plan-card__precio-actual {
  font-family: var(--gb-fuente-titulo, sans-serif);
  font-size: 1.75rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.plan-card__precio-periodo {
  font-size: 0.8125rem;
  color: var(--gb-text-muted, #c6c6c6);
  font-weight: 600;
}

.plan-card__descuento-fila {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.35rem;
}

.plan-card__precio-tachado {
  font-size: 0.8125rem;
  color: var(--gb-text-muted, #c6c6c6);
  text-decoration: line-through;
  opacity: 0.75;
}

.plan-card__descuento-tag {
  font-size: 0.6875rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: var(--gb-radius-sm, 0.25rem);
  background-color: rgba(225, 29, 20, 0.18);
  color: #ff8a93;
  border: 1px solid rgba(225, 29, 20, 0.35);
}

/* Specs */
.plan-card__specs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.plan-card__spec-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--gb-radius-pill, 9999px);
  font-size: 0.75rem;
  color: var(--gb-text-soft, #e9bcb6);
}

.plan-card__spec-icono {
  color: var(--gb-text-muted, #c6c6c6);
}

/* Servicios */
.plan-card__servicios {
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  flex: 1;
}

.plan-card__servicios-titulo {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gb-text-soft, #e9bcb6);
  margin: 0 0 0.75rem;
}

.plan-card__servicios-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

.plan-card__servicio-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.8125rem;
  color: var(--gb-text, #e5e2e1);
  line-height: 1.3;
}

.plan-card__check-icono {
  display: grid;
  place-items: center;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #22c55e;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.plan-card__servicio-item--vacio {
  color: var(--gb-text-muted, #c6c6c6);
  font-style: italic;
}

/* Pie y Botones */
.plan-card__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.plan-card__btn-whatsapp {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background-color: rgba(37, 211, 102, 0.12);
  border-color: rgba(37, 211, 102, 0.35);
  color: #25d366;
  font-size: 0.8125rem;
  padding-inline: 0.85rem;
}

.plan-card__btn-whatsapp:hover {
  background-color: rgba(37, 211, 102, 0.22);
  border-color: rgba(37, 211, 102, 0.55);
  color: #4ef089;
  transform: translateY(-1px);
}

.plan-card__acciones-secundarias {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.plan-card__btn-editar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  padding-inline: 0.9rem;
}

.plan-card__btn-eliminar {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  border-radius: var(--gb-radius-pill, 9999px);
  color: var(--gb-text-muted, #c6c6c6);
}

.plan-card__btn-eliminar:hover {
  color: #ff5555;
  background-color: rgba(229, 9, 20, 0.15);
  border-color: rgba(229, 9, 20, 0.35);
}

@media (max-width: 28rem) {
  .plan-card {
    padding: 1.15rem;
  }

  .plan-card__pie {
    flex-direction: column;
    align-items: stretch;
  }

  .plan-card__btn-whatsapp {
    width: 100%;
  }

  .plan-card__acciones-secundarias {
    width: 100%;
    justify-content: space-between;
  }

  .plan-card__btn-editar {
    flex: 1;
    justify-content: center;
  }
}
</style>
