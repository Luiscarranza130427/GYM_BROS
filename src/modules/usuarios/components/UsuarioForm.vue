<script setup>
import { useTemplateRef } from 'vue'

import IconoSvg from '@/components/base/IconoSvg.vue'
import { useFormulario } from '@/composables/useFormulario'
import { useVistaPreviaArchivo } from '@/composables/useVistaPreviaArchivo'
import { esCorreoValido, esFechaPasada, esTelefonoValido } from '@/utils/validaciones'

const props = defineProps({
  valoresIniciales: { type: Object, default: () => ({}) },
  empresas: { type: Array, default: () => [] },
  enviando: { type: Boolean, default: false },
  erroresServidor: { type: Object, default: () => ({}) },
  modo: { type: String, default: 'create' },
})

const emit = defineEmits(['submit', 'cancel'])

const MODELO_VACIO = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  tipoDocumento: 'dni',
  numeroDocumento: '',
  fechaNacimiento: '',
  direccion: '',
  fotoPerfil: '',
  empresaId: '',
  rol: 'member',
  estado: 'active',
}

/** El DNI peruano son exactamente 8 dígitos. */
const DNI_VALIDO = /^[0-9]{8}$/
/** Pasaporte y otros documentos: alfanumérico con guiones, de 5 a 20. */
const DOCUMENTO_VALIDO = /^[a-z0-9-]{5,20}$/i

const nombreInput = useTemplateRef('nombreInput')
const apellidoInput = useTemplateRef('apellidoInput')
const correoInput = useTemplateRef('correoInput')
const telefonoInput = useTemplateRef('telefonoInput')
const documentoInput = useTemplateRef('documentoInput')
const empresaInput = useTemplateRef('empresaInput')
const rolInput = useTemplateRef('rolInput')
const estadoInput = useTemplateRef('estadoInput')

const foto = useVistaPreviaArchivo({ etiqueta: 'foto' })

/** Reglas propias de un usuario. Las de forma salen de `utils/validaciones`. */
function validar(datos, errores) {
  if (datos.nombre.trim().length < 2) {
    errores.nombre = 'Introduce un nombre de al menos 2 caracteres.'
  }
  if (datos.apellido.trim().length < 2) {
    errores.apellido = 'Introduce un apellido de al menos 2 caracteres.'
  }
  if (!esCorreoValido(datos.correo)) errores.correo = 'Introduce un correo válido.'
  if (!esTelefonoValido(datos.telefono)) errores.telefono = 'Introduce un teléfono válido.'

  // A cada tipo de documento le toca su regla, y sólo la suya.
  const documento = datos.numeroDocumento.trim()
  if (!documento) {
    errores.numeroDocumento = 'Introduce el número de documento.'
  } else if (datos.tipoDocumento === 'dni') {
    if (!DNI_VALIDO.test(documento)) {
      errores.numeroDocumento = 'El DNI debe contener exactamente 8 dígitos.'
    }
  } else if (!DOCUMENTO_VALIDO.test(documento)) {
    errores.numeroDocumento = 'El documento debe contener entre 5 y 20 caracteres.'
  }

  if (datos.fechaNacimiento && !esFechaPasada(datos.fechaNacimiento)) {
    errores.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.'
  }

  if (!datos.empresaId) errores.empresaId = 'Selecciona una empresa.'
  if (!datos.rol) errores.rol = 'Selecciona un rol.'
  if (!['active', 'inactive'].includes(datos.estado)) {
    errores.estado = 'Selecciona un estado válido.'
  }
}

const { formulario, erroresLocales, erroresRemotos, errorDe, limpiarError, validarParaEnviar } =
  useFormulario({
    modeloVacio: MODELO_VACIO,
    valoresIniciales: () => props.valoresIniciales,
    erroresServidor: () => props.erroresServidor,
    referencias: {
      nombre: nombreInput,
      apellido: apellidoInput,
      correo: correoInput,
      telefono: telefonoInput,
      numeroDocumento: documentoInput,
      empresaId: empresaInput,
      rol: rolInput,
      estado: estadoInput,
    },
    validar,
    alCargarValores: (datos, valores) => {
      // La empresa llega anidada al editar y plana al crear.
      datos.empresaId = valores.empresa?.id ?? valores.empresaId ?? ''
      foto.reiniciar(valores.fotoPerfil)
    },
  })

async function enviar() {
  if (props.enviando) return
  if (!(await validarParaEnviar())) return

  emit('submit', {
    nombre: formulario.nombre.trim(),
    apellido: formulario.apellido.trim(),
    correo: formulario.correo.trim().toLowerCase(),
    telefono: formulario.telefono.trim(),
    tipoDocumento: formulario.tipoDocumento,
    numeroDocumento: formulario.numeroDocumento.trim(),
    fechaNacimiento: formulario.fechaNacimiento,
    direccion: formulario.direccion.trim(),
    fotoPerfil: formulario.fotoPerfil,
    empresaId: Number(formulario.empresaId),
    rol: formulario.rol,
    estado: formulario.estado,
  })
}

function seleccionarFoto(evento) {
  foto.seleccionar(evento, formulario.fotoPerfil)
}
</script>

<template>
  <form class="formulario" autocomplete="off" novalidate @submit.prevent="enviar">
    <p class="visually-hidden" aria-live="polite">
      {{
        Object.keys(erroresLocales).length || Object.keys(erroresRemotos).length
          ? 'Revisa los campos marcados en el formulario.'
          : ''
      }}
    </p>

    <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-personales">
      <header>
        <span aria-hidden="true"><IconoSvg nombre="person-vcard" /></span>
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
            maxlength="60"
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
            maxlength="60"
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
          <label class="form-label" for="usuario-correo">Correo *</label>
          <input
            id="usuario-correo"
            ref="correoInput"
            v-model="formulario.correo"
            class="form-control"
            :class="{ 'is-invalid': errorDe('correo') }"
            type="email"
            autocomplete="email"
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
          <label class="form-label" for="usuario-telefono">Teléfono *</label>
          <input
            id="usuario-telefono"
            ref="telefonoInput"
            v-model="formulario.telefono"
            class="form-control"
            :class="{ 'is-invalid': errorDe('telefono') }"
            type="tel"
            autocomplete="tel"
            required
            :aria-invalid="Boolean(errorDe('telefono'))"
            :aria-describedby="errorDe('telefono') ? 'error-telefono' : null"
            @input="limpiarError('telefono')"
          />
          <p v-if="errorDe('telefono')" id="error-telefono" class="campo__error">
            {{ errorDe('telefono') }}
          </p>
        </div>

        <div class="campo campo--documento">
          <div>
            <label class="form-label" for="usuario-tipo-documento">Tipo de documento *</label>
            <select
              id="usuario-tipo-documento"
              v-model="formulario.tipoDocumento"
              class="form-select"
              @change="limpiarError('numeroDocumento')"
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
              ref="documentoInput"
              v-model="formulario.numeroDocumento"
              class="form-control"
              :class="{ 'is-invalid': errorDe('numeroDocumento') }"
              type="text"
              maxlength="20"
              required
              :inputmode="formulario.tipoDocumento === 'dni' ? 'numeric' : 'text'"
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
            v-model="formulario.fechaNacimiento"
            class="form-control"
            :class="{ 'is-invalid': errorDe('fechaNacimiento') }"
            type="date"
            :max="new Date().toISOString().slice(0, 10)"
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

    <div class="formulario__secundarias">
      <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-organizacion">
        <header>
          <span aria-hidden="true"><IconoSvg nombre="buildings" /></span>
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
          <span aria-hidden="true"><IconoSvg nombre="camera" /></span>
          <div>
            <h2 id="titulo-foto">Foto de perfil</h2>
            <p>Vista previa local. La imagen todavía no se guarda: falta el endpoint de subida.</p>
          </div>
        </header>
        <div class="foto">
          <div
            class="foto__vista"
            :style="{ backgroundImage: foto.url ? `url(${foto.url})` : null }"
          >
            <IconoSvg nombre="person" />
          </div>
          <div class="campo">
            <label class="form-label" for="usuario-foto">Archivo de imagen</label>
            <input
              id="usuario-foto"
              class="form-control"
              :class="{ 'is-invalid': foto.error }"
              type="file"
              accept="image/*"
              :aria-invalid="Boolean(foto.error)"
              :aria-describedby="foto.error ? 'error-foto' : 'ayuda-foto'"
              @change="seleccionarFoto"
            />
            <p id="ayuda-foto" class="campo__ayuda">
              PNG, JPG o WebP. Máximo 2 MB. Sólo vista previa: al guardar, el archivo
              <strong>no</strong> se envía todavía, porque la API aún no expone dónde subirlo.
            </p>
            <p v-if="foto.error" id="error-foto" class="campo__error">{{ foto.error }}</p>
          </div>
        </div>
      </section>
    </div>

    <div class="formulario__acciones">
      <button type="button" class="btn btn-ghost" :disabled="enviando" @click="emit('cancel')">
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
  gap: var(--gb-gutter);
}
.formulario__seccion {
  padding: 1.25rem;
  border-radius: var(--gb-radius-xl);
}
.formulario__seccion > header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.formulario__seccion > header > span {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--gb-surface-high);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-red-text);
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
  grid-template-columns: minmax(0, 1.35fr) minmax(20rem, 0.65fr);
  align-items: start;
  gap: var(--gb-gutter);
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
  display: grid;
  gap: 1rem;
}
.foto__vista {
  display: grid;
  place-items: center;
  width: 6rem;
  height: 6rem;
  background: var(--gb-surface-lowest) center/cover;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-pill);
  color: var(--gb-text-soft);
  font-size: 2rem;
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
  min-height: 2.75rem;
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
}
</style>
