<script setup>
import { Building2, Camera, User } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'

import { useVistaPreviaArchivo } from '@/shared/composables/useVistaPreviaArchivo'

const props = defineProps({
  usuarioInicial: { type: Object, default: () => ({}) },
  // Alias usado por algunas vistas; se mantiene usuarioInicial por compatibilidad.
  valoresIniciales: { type: Object, default: null },
  empresas: { type: Array, default: () => [] },
  enviando: { type: Boolean, default: false },
  erroresServidor: { type: Object, default: () => ({}) },
  modo: { type: String, default: 'create' },
})

const emit = defineEmits({
  submit: (payload) => Boolean(payload && typeof payload === 'object'),
  cancel: null,
})

const formulario = ref(crearEstadoInicial())
const erroresLocales = ref({})

const empresaInput = ref(null)
const rolInput = ref(null)
const nombreInput = ref(null)
const apellidoInput = ref(null)
const apodoInput = ref(null)
const correoInput = ref(null)
const tipoDocumentoInput = ref(null)
const numeroDocumentoInput = ref(null)
const fechaNacimientoInput = ref(null)
const estadoInput = ref(null)

const refsCampos = {
  empresaId: empresaInput,
  rol: rolInput,
  nombre: nombreInput,
  apellido: apellidoInput,
  apodo: apodoInput,
  correo: correoInput,
  tipoDocumento: tipoDocumentoInput,
  numeroDocumento: numeroDocumentoInput,
  fechaNacimiento: fechaNacimientoInput,
  estado: estadoInput,
}

const foto = useVistaPreviaArchivo({ etiqueta: 'foto de perfil' })

function crearEstadoInicial() {
  const fuente = props.valoresIniciales ?? props.usuarioInicial ?? {}
  const datosEmpresa = fuente.empresa
  const idEmpresa =
    typeof datosEmpresa === 'object' && datosEmpresa !== null
      ? (datosEmpresa.id ?? '')
      : (fuente.empresaId ?? fuente.company_id ?? '')

  return {
    empresaId: idEmpresa !== '' && idEmpresa !== null ? String(idEmpresa) : '',
    rol: fuente.rol ?? fuente.role ?? 'member',
    nombre: fuente.nombre ?? fuente.nombres ?? fuente.name ?? '',
    apellido: fuente.apellido ?? fuente.last_name ?? '',
    apodo: fuente.apodo ?? fuente.apodos ?? fuente.nickname ?? '',
    correo: fuente.correo ?? fuente.email ?? '',
    telefono: fuente.telefono ?? fuente.phone ?? '',
    tipoDocumento: fuente.tipoDocumento ?? fuente.document_type ?? 'dni',
    numeroDocumento: fuente.numeroDocumento ?? fuente.document_number ?? '',
    fechaNacimiento: normalizarFecha(fuente.fechaNacimiento ?? fuente.birth_date),
    direccion: fuente.direccion ?? fuente.address ?? '',
    estado: normalizarEstado(fuente.estado ?? fuente.status),
  }
}

function normalizarEstado(valor) {
  if (valor === 'inactive' || valor === 'inactivo' || valor === 0 || valor === false) {
    return 'inactive'
  }
  return 'active'
}

function normalizarFecha(valor) {
  if (!valor) return ''
  const cadena = String(valor)
  return cadena.length >= 10 ? cadena.slice(0, 10) : ''
}

watch(
  () => [props.usuarioInicial, props.valoresIniciales],
  () => {
    formulario.value = crearEstadoInicial()
    erroresLocales.value = {}
    const fuente = props.valoresIniciales ?? props.usuarioInicial ?? {}
    foto.reiniciar(fuente.fotoPerfil || '')
  },
  { immediate: true },
)

const errores = computed(() => ({
  ...props.erroresServidor,
  ...erroresLocales.value,
}))

function errorDe(campo) {
  const err = errores.value[campo]
  if (!err) return ''
  return Array.isArray(err) ? err[0] : String(err)
}

function limpiarError(campo) {
  if (erroresLocales.value[campo]) {
    const copia = { ...erroresLocales.value }
    delete copia[campo]
    erroresLocales.value = copia
  }
}

function validar() {
  const nuevos = {}
  const f = formulario.value

  if (!f.nombre.trim()) nuevos.nombre = ['Introduce un nombre.']
  if (!f.apellido.trim()) nuevos.apellido = ['Introduce un apellido.']

  const correo = f.correo.trim()
  if (!correo) {
    nuevos.correo = ['Introduce un correo válido.']
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    nuevos.correo = ['Introduce un correo válido.']
  }

  const numDoc = f.numeroDocumento.trim()
  if (f.tipoDocumento === 'dni') {
    if (numDoc && !/^\d{8}$/.test(numDoc)) {
      nuevos.numeroDocumento = ['El DNI debe tener exactamente 8 dígitos.']
    }
  } else if (numDoc && (numDoc.length < 5 || numDoc.length > 20)) {
    nuevos.numeroDocumento = ['El documento debe tener entre 5 y 20 caracteres.']
  }

  if (f.fechaNacimiento) {
    const hoy = new Date().toISOString().slice(0, 10)
    if (f.fechaNacimiento > hoy) {
      nuevos.fechaNacimiento = ['La fecha de nacimiento no puede ser futura.']
    }
  }

  if (!f.empresaId) nuevos.empresaId = ['Selecciona una empresa.']
  if (!f.rol) nuevos.rol = ['Selecciona un rol.']

  erroresLocales.value = nuevos
  return Object.keys(nuevos).length === 0
}

async function enviar() {
  if (!validar()) {
    await nextTick()
    enfocarPrimerError()
    return
  }

  const f = formulario.value
  const payload = {
    empresaId: isNaN(Number(f.empresaId)) ? f.empresaId : Number(f.empresaId),
    rol: f.rol,
    nombre: f.nombre.trim(),
    apellido: f.apellido.trim(),
    apodo: f.apodo.trim(),
    correo: f.correo.trim(),
    telefono: f.telefono.trim(),
    tipoDocumento: f.tipoDocumento,
    numeroDocumento: f.numeroDocumento.trim(),
    fechaNacimiento: f.fechaNacimiento || null,
    direccion: f.direccion.trim(),
    estado: f.estado,
  }

  emit('submit', payload)
}

function enfocarPrimerError() {
  const primerCampoConError = Object.keys(errores.value)[0]
  if (primerCampoConError && refsCampos[primerCampoConError]?.value) {
    refsCampos[primerCampoConError].value.focus()
  }
}

function seleccionarFoto(evento) {
  foto.seleccionar(evento)
}
</script>

<template>
  <form class="formulario" novalidate @submit.prevent="enviar">
    <!-- Datos personales -->
    <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-personales">
      <header>
        <span aria-hidden="true"><User :size="20" /></span>
        <div>
          <h2 id="titulo-personales">Datos personales</h2>
          <p>Información de identificación y contacto del usuario.</p>
        </div>
      </header>

      <div class="formulario__rejilla">
        <div class="campo">
          <label class="form-label" for="usuario-nombre">Nombre *</label>
          <input
            id="usuario-nombre"
            ref="nombreInput"
            v-model="formulario.nombre"
            class="form-control"
            :class="{ 'is-invalid': errorDe('nombre') }"
            type="text"
            name="nombre"
            maxlength="80"
            autocomplete="given-name"
            required
            :aria-invalid="Boolean(errorDe('nombre'))"
            :aria-describedby="errorDe('nombre') ? 'error-nombre' : null"
            @input="limpiarError('nombre')"
          />
          <p v-if="errorDe('nombre')" id="error-nombre" class="campo__error">
            {{ errorDe('nombre') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="usuario-apellido">Apellido *</label>
          <input
            id="usuario-apellido"
            ref="apellidoInput"
            v-model="formulario.apellido"
            class="form-control"
            :class="{ 'is-invalid': errorDe('apellido') }"
            type="text"
            name="apellido"
            maxlength="80"
            autocomplete="family-name"
            required
            :aria-invalid="Boolean(errorDe('apellido'))"
            :aria-describedby="errorDe('apellido') ? 'error-apellido' : null"
            @input="limpiarError('apellido')"
          />
          <p v-if="errorDe('apellido')" id="error-apellido" class="campo__error">
            {{ errorDe('apellido') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="usuario-apodo">Apodo</label>
          <input
            id="usuario-apodo"
            ref="apodoInput"
            v-model="formulario.apodo"
            class="form-control"
            type="text"
            name="apodo"
            maxlength="80"
            autocomplete="nickname"
            @input="limpiarError('apodo')"
          />
          <p v-if="errorDe('apodo')" id="error-apodo" class="campo__error">
            {{ errorDe('apodo') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="usuario-correo">Correo *</label>
          <input
            id="usuario-correo"
            ref="correoInput"
            v-model="formulario.correo"
            class="form-control"
            :class="{ 'is-invalid': errorDe('correo') }"
            type="email"
            name="correo"
            autocomplete="off"
            spellcheck="false"
            required
            :aria-invalid="Boolean(errorDe('correo'))"
            :aria-describedby="errorDe('correo') ? 'error-correo' : null"
            @input="limpiarError('correo')"
          />
          <p v-if="errorDe('correo')" id="error-correo" class="campo__error">
            {{ errorDe('correo') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="usuario-telefono">Teléfono</label>
          <input
            id="usuario-telefono"
            v-model="formulario.telefono"
            class="form-control"
            type="tel"
            name="telefono"
            autocomplete="tel"
          />
        </div>

        <div class="campo campo--documento">
          <div>
            <label class="form-label" for="usuario-tipo-documento">Tipo de documento *</label>
            <select
              id="usuario-tipo-documento"
              ref="tipoDocumentoInput"
              v-model="formulario.tipoDocumento"
              class="form-select"
              name="tipoDocumento"
              @change="limpiarError('tipoDocumento')"
            >
              <option value="dni">DNI</option>
              <option value="passport">Pasaporte</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label class="form-label" for="usuario-documento">Número de documento *</label>
            <input
              id="usuario-documento"
              ref="numeroDocumentoInput"
              v-model="formulario.numeroDocumento"
              class="form-control"
              :class="{ 'is-invalid': errorDe('numeroDocumento') }"
              type="text"
              name="numeroDocumento"
              maxlength="20"
              :aria-invalid="Boolean(errorDe('numeroDocumento'))"
              :aria-describedby="errorDe('numeroDocumento') ? 'error-documento' : null"
              @input="limpiarError('numeroDocumento')"
            />
            <p v-if="errorDe('numeroDocumento')" id="error-documento" class="campo__error">
              {{ errorDe('numeroDocumento') }}
            </p>
          </div>
        </div>

        <div class="campo">
          <label class="form-label" for="usuario-nacimiento">Fecha de nacimiento</label>
          <input
            id="usuario-nacimiento"
            ref="fechaNacimientoInput"
            v-model="formulario.fechaNacimiento"
            class="form-control"
            :class="{ 'is-invalid': errorDe('fechaNacimiento') }"
            type="date"
            name="fechaNacimiento"
            :aria-invalid="Boolean(errorDe('fechaNacimiento'))"
            :aria-describedby="errorDe('fechaNacimiento') ? 'error-nacimiento' : null"
            @input="limpiarError('fechaNacimiento')"
          />
          <p v-if="errorDe('fechaNacimiento')" id="error-nacimiento" class="campo__error">
            {{ errorDe('fechaNacimiento') }}
          </p>
        </div>

        <div class="campo campo--completo">
          <label class="form-label" for="usuario-direccion">Dirección</label>
          <textarea
            id="usuario-direccion"
            v-model="formulario.direccion"
            class="form-control"
            rows="2"
            autocomplete="street-address"
          ></textarea>
        </div>
      </div>
    </section>

    <!-- Secciones secundarias niveladas: Organización + Foto de perfil -->
    <div class="formulario__secundarias">
      <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-organizacion">
        <header>
          <span aria-hidden="true"><Building2 :size="20" /></span>
          <div>
            <h2 id="titulo-organizacion">Organización y acceso</h2>
            <p>Empresa, rol administrativo y estado operativo.</p>
          </div>
        </header>

        <div class="formulario__rejilla formulario__rejilla--organizacion">
          <div class="campo">
            <label class="form-label" for="usuario-empresa">Empresa *</label>
            <select
              id="usuario-empresa"
              ref="empresaInput"
              v-model="formulario.empresaId"
              class="form-select"
              :class="{ 'is-invalid': errorDe('empresaId') }"
              required
              :aria-invalid="Boolean(errorDe('empresaId'))"
              :aria-describedby="errorDe('empresaId') ? 'error-empresa' : null"
              @change="limpiarError('empresaId')"
            >
              <option value="">Selecciona una empresa</option>
              <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
                {{ empresa.nombre }}
              </option>
            </select>
            <p v-if="errorDe('empresaId')" id="error-empresa" class="campo__error">
              {{ errorDe('empresaId') }}
            </p>
          </div>

          <div class="campo">
            <label class="form-label" for="usuario-rol">Rol *</label>
            <select
              id="usuario-rol"
              ref="rolInput"
              v-model="formulario.rol"
              class="form-select"
              :class="{ 'is-invalid': errorDe('rol') }"
              required
              :aria-invalid="Boolean(errorDe('rol'))"
              :aria-describedby="errorDe('rol') ? 'error-rol' : 'ayuda-rol'"
              @change="limpiarError('rol')"
            >
              <option value="admin">Administrador</option>
              <option value="manager">Empresa</option>
              <option value="trainer">Entrenador</option>
              <option value="member">Usuario</option>
            </select>
            <p id="ayuda-rol" class="campo__ayuda">
              Roles provisionales hasta cerrar permisos con Laravel.
            </p>
            <p v-if="errorDe('rol')" id="error-rol" class="campo__error">{{ errorDe('rol') }}</p>
          </div>
        </div>

        <fieldset
          class="estado-opciones"
          aria-labelledby="titulo-estado"
          :aria-describedby="errorDe('estado') ? 'error-estado' : null"
        >
          <span id="titulo-estado" class="form-label">Estado *</span>
          <div>
            <label
              ><input
                ref="estadoInput"
                v-model="formulario.estado"
                type="radio"
                name="estado"
                value="active"
                @change="limpiarError('estado')"
              /><span><b>Activo</b><small>Puede acceder normalmente.</small></span></label
            >
            <label
              ><input
                v-model="formulario.estado"
                type="radio"
                name="estado"
                value="inactive"
                @change="limpiarError('estado')"
              /><span><b>Inactivo</b><small>Acceso suspendido.</small></span></label
            >
          </div>
        </fieldset>
        <p v-if="errorDe('estado')" id="error-estado" class="campo__error">
          {{ errorDe('estado') }}
        </p>
      </section>

      <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-foto">
        <header>
          <span aria-hidden="true"><Camera :size="20" /></span>
          <div>
            <h2 id="titulo-foto">Foto de perfil</h2>
            <p>Vista previa local. La imagen todavía no se guarda: falta el endpoint de subida.</p>
          </div>
        </header>
        <div class="foto">
          <div
            class="foto__vista"
            :style="{ backgroundImage: foto.url.value ? `url(${foto.url.value})` : null }"
          >
            <User :size="24" />
          </div>
          <div class="campo">
            <label class="form-label" for="usuario-foto">Archivo de imagen</label>
            <input
              id="usuario-foto"
              class="form-control"
              :class="{ 'is-invalid': foto.error.value }"
              type="file"
              accept="image/*"
              :aria-invalid="Boolean(foto.error.value)"
              :aria-describedby="foto.error.value ? 'error-foto' : 'ayuda-foto'"
              @change="seleccionarFoto"
            />
            <p id="ayuda-foto" class="campo__ayuda">
              PNG, JPG o WebP. Máximo 2 MB. Sólo vista previa: al guardar, el archivo
              <strong>no</strong> se envía todavía, porque la API aún no expone dónde subirlo.
            </p>
            <p v-if="foto.error.value" id="error-foto" class="campo__error">
              {{ foto.error.value }}
            </p>
          </div>
        </div>
      </section>
    </div>

    <div class="formulario__acciones">
      <button type="button" class="btn btn-secondary" :disabled="enviando" @click="emit('cancel')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ enviando ? 'Guardando…' : modo === 'edit' ? 'Guardar cambios' : 'Guardar usuario' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.formulario {
  display: grid;
  gap: var(--gb-gutter, 1.25rem);
}
.formulario__seccion {
  padding: 1.25rem 1.5rem;
  border-radius: var(--gb-radius-xl);
}
.formulario__seccion > header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  min-height: 3.5rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--gb-border);
}
.formulario__seccion > header > span {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--gb-surface-high);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-red-text);
  flex-shrink: 0;
}
.formulario__seccion h2,
.formulario__seccion p {
  margin: 0;
}
.formulario__seccion h2 {
  font-size: var(--gb-tipo-md);
  text-transform: uppercase;
}
.formulario__seccion header p {
  margin-top: 0.25rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}
.formulario__rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.formulario__secundarias {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(20rem, 0.75fr);
  align-items: stretch;
  gap: var(--gb-gutter, 1.25rem);
}
.formulario__secundarias .formulario__seccion {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.campo {
  min-width: 0;
}
.campo--completo {
  grid-column: 1 / -1;
}
.campo--documento {
  display: grid;
  grid-template-columns: minmax(9rem, 0.7fr) minmax(0, 1.3fr);
  gap: 0.75rem;
}
.campo__ayuda,
.campo__error {
  margin: 0.375rem 0 0 !important;
  font-size: var(--gb-tipo-xxs);
}
.campo__ayuda {
  color: var(--gb-text-muted);
}
.campo__error {
  color: var(--gb-error);
}
.estado-opciones {
  margin: 1rem 0 0;
  padding: 0;
  border: 0;
}
.estado-opciones > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.375rem;
}
.estado-opciones label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  background: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  cursor: pointer;
}
.estado-opciones label:has(input:checked) {
  border-color: var(--gb-red);
  box-shadow: var(--gb-relieve);
}
.estado-opciones input {
  margin-top: 0.2rem;
  accent-color: var(--gb-red);
}
.estado-opciones label span {
  display: grid;
}
.estado-opciones b {
  font-size: var(--gb-tipo-sm);
}
.estado-opciones small {
  margin-top: 0.125rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
}
.foto {
  flex: 1;
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
.foto__vista {
  display: grid;
  place-items: center;
  width: 5rem;
  height: 5rem;
  background: var(--gb-surface-lowest) center/cover;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-text-soft);
  font-size: 1.5rem;
  flex-shrink: 0;
}
.formulario__acciones {
  position: sticky;
  bottom: 0;
  z-index: 5;
  isolation: isolate;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 0;
  background: var(--gb-bg);
  border-top: 1px solid var(--gb-border);
}
.formulario__acciones::after {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  height: var(--gb-margen);
  background: var(--gb-bg);
  content: '';
  pointer-events: none;
}
.formulario__acciones .btn {
  min-height: 2.6rem;
  padding-inline: 1.25rem;
}
@media (max-width: 78rem) {
  .formulario__secundarias {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 64rem) {
  .formulario__acciones::after {
    height: var(--gb-gutter);
  }
}
@media (max-width: 52rem) {
  .formulario__rejilla,
  .estado-opciones > div {
    grid-template-columns: 1fr;
  }
  .campo--completo {
    grid-column: auto;
  }
}
@media (max-width: 36rem) {
  .campo--documento {
    grid-template-columns: 1fr;
  }
  .foto {
    grid-template-columns: 1fr;
  }
}
</style>
