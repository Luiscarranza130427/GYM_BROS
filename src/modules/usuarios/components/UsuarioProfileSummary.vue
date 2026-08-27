<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import IconoSvg from '@/components/base/IconoSvg.vue'
import UsuarioAvatar from '@/modules/usuarios/components/UsuarioAvatar.vue'
import UsuarioStatusBadge from '@/modules/usuarios/components/UsuarioStatusBadge.vue'
import UsuarioSubscriptionBadge from '@/modules/usuarios/components/UsuarioSubscriptionBadge.vue'
import { formatearFecha, formatearNumero, formatearTiempoRelativo } from '@/utils/formato'

const props = defineProps({
  usuario: { type: Object, required: true },
})

/*
 * Este componente confía en la forma que garantiza `usuarios.service`. Antes
 * aceptaba además un vocabulario inglés en camelCase —firstName, lastName,
 * email, phone, address, profilePhoto, avatarUrl, company, status, role,
 * subscription, activity, startedAt, daysRemaining…— que el servicio no produce
 * en ningún caso, ni con mocks ni con API.
 *
 * Eran ramas muertas, y además peligrosas: si el normalizador cambiase un
 * nombre de campo, el perfil no fallaría, se limitaría a mostrar «No
 * especificado» sin que nadie se enterase. La anticorrupción vive en el
 * servicio; duplicarla aquí sólo servía para enmascarar sus fallos.
 */
const nombreCompleto = computed(
  () =>
    [props.usuario.nombre, props.usuario.apellido].filter(Boolean).join(' ').trim() ||
    'Usuario sin nombre',
)
const empresa = computed(() => props.usuario.empresa ?? null)
const suscripcion = computed(() => props.usuario.suscripcion ?? null)
const metricas = computed(() => props.usuario.actividad ?? {})

const etiquetasRol = {
  admin: 'Administrador',
  administrator: 'Administrador',
  administrador: 'Administrador',
  company: 'Empresa',
  empresa: 'Empresa',
  manager: 'Empresa',
  trainer: 'Entrenador',
  entrenador: 'Entrenador',
  user: 'Usuario',
  usuario: 'Usuario',
  member: 'Usuario',
}
const etiquetasDocumento = { dni: 'DNI', passport: 'Pasaporte', other: 'Otro' }

const rolLegible = computed(
  () => etiquetasRol[props.usuario.rol] ?? props.usuario.rol ?? 'No especificado',
)
const documento = computed(() => {
  const { tipoDocumento = '', numeroDocumento = '' } = props.usuario
  return (
    [etiquetasDocumento[tipoDocumento] ?? tipoDocumento, numeroDocumento]
      .filter(Boolean)
      .join(' ') || 'No especificado'
  )
})

const suscripcionPlan = computed(() => suscripcion.value?.nombrePlan || 'Sin plan asignado')
const diasRestantes = computed(() => {
  const valor = Number(suscripcion.value?.diasRestantes)
  return Number.isFinite(valor) ? Math.max(0, valor) : null
})

function fechaLegible(fecha) {
  return fecha ? formatearFecha(fecha) : 'No especificada'
}

function metrica(valor) {
  return valor === null || valor === undefined ? '—' : formatearNumero(valor)
}
</script>

<template>
  <div class="perfil">
    <section class="perfil__cabecera gb-tarjeta" aria-labelledby="usuario-nombre">
      <UsuarioAvatar
        :nombre="usuario.nombre"
        :apellido="usuario.apellido"
        :url="usuario.fotoPerfil"
        grande
      />

      <div class="perfil__identidad">
        <p>Perfil administrativo</p>
        <h2 id="usuario-nombre">{{ nombreCompleto }}</h2>
        <div class="perfil__metadatos">
          <UsuarioStatusBadge :estado="usuario.estado" />
          <span class="perfil__rol"><IconoSvg nombre="shield-check" />{{ rolLegible }}</span>
        </div>
      </div>

      <div class="perfil__empresa">
        <span>Empresa</span>
        <RouterLink
          v-if="empresa?.id && empresa?.nombre"
          :to="{ name: 'empresa-detalle', params: { id: empresa.id } }"
        >
          {{ empresa.nombre }}
          <IconoSvg nombre="arrow-up-right" />
        </RouterLink>
        <strong v-else>{{ empresa?.nombre || 'No asignada' }}</strong>
      </div>
    </section>

    <div class="perfil__rejilla">
      <section class="perfil__panel gb-tarjeta" aria-labelledby="titulo-personal">
        <header>
          <span class="perfil__icono"><IconoSvg nombre="person-vcard" /></span>
          <div>
            <p>Datos de gestión</p>
            <h2 id="titulo-personal">Información personal</h2>
          </div>
        </header>

        <dl class="perfil__datos">
          <div>
            <dt>Correo</dt>
            <dd>
              <a v-if="usuario.correo" :href="`mailto:${usuario.correo}`">{{ usuario.correo }}</a>
              <span v-else>No especificado</span>
            </dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>
              <a v-if="usuario.telefono" :href="`tel:${usuario.telefono}`">{{
                usuario.telefono
              }}</a>
              <span v-else>No especificado</span>
            </dd>
          </div>
          <div>
            <dt>Documento</dt>
            <dd class="tabular">{{ documento }}</dd>
          </div>
          <div>
            <dt>Fecha de nacimiento</dt>
            <dd>{{ fechaLegible(usuario.fechaNacimiento) }}</dd>
          </div>
          <div class="perfil__dato-completo">
            <dt>Dirección</dt>
            <dd>{{ usuario.direccion || 'No especificada' }}</dd>
          </div>
          <div class="perfil__dato-completo">
            <dt>Fecha de registro</dt>
            <dd>{{ fechaLegible(usuario.fechaRegistro) }}</dd>
          </div>
        </dl>
      </section>

      <aside class="perfil__lateral">
        <section class="perfil__panel gb-tarjeta" aria-labelledby="titulo-suscripcion">
          <header>
            <span class="perfil__icono"><IconoSvg nombre="credit-card" /></span>
            <div>
              <p>Membresía</p>
              <h2 id="titulo-suscripcion">Suscripción</h2>
            </div>
            <UsuarioSubscriptionBadge :estado="suscripcion?.estado ?? 'none'" />
          </header>

          <dl class="perfil__suscripcion">
            <div>
              <dt>Plan</dt>
              <dd>{{ suscripcionPlan }}</dd>
            </div>
            <div>
              <dt>Inicio</dt>
              <dd>{{ fechaLegible(suscripcion?.fechaInicio) }}</dd>
            </div>
            <div>
              <dt>Vencimiento</dt>
              <dd>{{ fechaLegible(suscripcion?.fechaVencimiento) }}</dd>
            </div>
            <div>
              <dt>Días restantes</dt>
              <dd class="perfil__dias tabular">
                {{ diasRestantes === null ? '—' : diasRestantes }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="perfil__panel gb-tarjeta" aria-labelledby="titulo-actividad">
          <header>
            <span class="perfil__icono"><IconoSvg nombre="activity" /></span>
            <div>
              <p>Lectura provisional</p>
              <h2 id="titulo-actividad">Actividad resumida</h2>
            </div>
          </header>

          <dl class="perfil__kpis">
            <div>
              <dt>Rutinas asignadas</dt>
              <dd>
                {{ metrica(metricas.rutinas) }}
              </dd>
            </div>
            <div>
              <dt>Asistencias este mes</dt>
              <dd>{{ metrica(metricas.asistenciasMes) }}</dd>
            </div>
            <div>
              <dt>Última actividad</dt>
              <dd>
                {{
                  metricas.ultimaActividad
                    ? formatearTiempoRelativo(metricas.ultimaActividad)
                    : 'Sin actividad'
                }}
              </dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.perfil {
  display: grid;
  gap: var(--gb-gutter);
}

.perfil__cabecera {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(12rem, auto);
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: var(--gb-radius-xl);
}

.perfil__identidad > p,
.perfil__identidad h2,
.perfil__empresa > span,
.perfil__empresa strong {
  margin: 0;
}

.perfil__identidad > p,
.perfil__panel header p,
.perfil__empresa > span {
  color: var(--gb-red-text);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.perfil__identidad h2 {
  margin-top: 0.25rem;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.perfil__metadatos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

.perfil__rol {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
  font-weight: 600;
}

.perfil__empresa {
  min-width: 0;
  padding-left: 1.25rem;
  border-left: 1px solid var(--gb-border);
}

.perfil__empresa > span {
  display: block;
}

.perfil__empresa a,
.perfil__empresa strong {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.375rem;
  overflow-wrap: anywhere;
  color: var(--gb-text);
  font-size: var(--gb-tipo-sm);
  font-weight: 700;
  text-decoration: none;
}

.perfil__empresa a:hover {
  color: var(--gb-link-hover);
  text-decoration: underline;
}

.perfil__rejilla {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(22rem, 0.85fr);
  align-items: start;
  gap: var(--gb-gutter);
}

.perfil__lateral {
  display: grid;
  gap: var(--gb-gutter);
}

.perfil__panel {
  min-width: 0;
  padding: 1.25rem;
  border-radius: var(--gb-radius-xl);
}

.perfil__panel header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--gb-border);
}

.perfil__panel header > :last-child:not(:nth-child(2)) {
  margin-left: auto;
}

.perfil__panel header p,
.perfil__panel header h2 {
  margin: 0;
}

.perfil__panel header h2 {
  margin-top: 0.125rem;
  font-size: var(--gb-tipo-md);
  text-transform: uppercase;
}

.perfil__icono {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--gb-surface-high);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-red-text);
}

.perfil__panel dl {
  margin: 0;
}

.perfil__datos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.perfil__datos > div,
.perfil__suscripcion > div {
  min-width: 0;
  padding: 1rem 0;
  border-bottom: 1px solid var(--gb-border);
}

.perfil__datos > div:nth-child(odd):not(.perfil__dato-completo) {
  padding-right: 1rem;
}

.perfil__datos > div:nth-child(even):not(.perfil__dato-completo) {
  padding-left: 1rem;
}

.perfil__datos .perfil__dato-completo {
  grid-column: 1 / -1;
}

.perfil__datos > div:last-child,
.perfil__suscripcion > div:last-child {
  border-bottom: 0;
}

.perfil__panel dt {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.perfil__panel dd {
  margin: 0.375rem 0 0;
  overflow-wrap: anywhere;
  color: var(--gb-text);
  font-size: var(--gb-tipo-sm);
}

.perfil__panel dd a {
  color: var(--gb-red-text);
  text-decoration: none;
}

.perfil__panel dd a:hover {
  color: var(--gb-link-hover);
  text-decoration: underline;
}

.perfil__suscripcion {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.perfil__suscripcion > div:nth-child(odd) {
  padding-right: 0.75rem;
}

.perfil__suscripcion > div:nth-child(even) {
  padding-left: 0.75rem;
}

.perfil__dias {
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-lg) !important;
  font-weight: 800;
}

.perfil__kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding-top: 1rem;
}

.perfil__kpis > div {
  min-width: 0;
  padding: 0.875rem;
  background-color: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
}

.perfil__kpis dd {
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-md);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.tabular {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 78rem) {
  .perfil__rejilla {
    grid-template-columns: 1fr;
  }

  .perfil__lateral {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 52rem) {
  .perfil__cabecera {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .perfil__empresa {
    grid-column: 1 / -1;
    padding-top: 1rem;
    padding-left: 0;
    border-top: 1px solid var(--gb-border);
    border-left: 0;
  }

  .perfil__lateral,
  .perfil__datos,
  .perfil__suscripcion {
    grid-template-columns: 1fr;
  }

  .perfil__datos > div,
  .perfil__suscripcion > div {
    grid-column: auto;
    padding-right: 0 !important;
    padding-left: 0 !important;
  }
}

@media (max-width: 34rem) {
  .perfil__cabecera {
    grid-template-columns: 1fr;
  }

  .perfil__kpis {
    grid-template-columns: 1fr;
  }
}
</style>
