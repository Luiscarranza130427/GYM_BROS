<script setup>
import { useTemplateRef } from 'vue'

import IconoSvg from '@/components/base/IconoSvg.vue'
import { useFormulario } from '@/composables/useFormulario'
import { useVistaPreviaArchivo } from '@/composables/useVistaPreviaArchivo'
import { REGIONES_PERU } from '@/constants/regionesPeru'
import { esColorValido, esCorreoValido, esTelefonoValido, esUrlValida } from '@/utils/validaciones'

const props = defineProps({
  valoresIniciales: { type: Object, default: () => ({}) },
  enviando: { type: Boolean, default: false },
  erroresServidor: { type: Object, default: () => ({}) },
  modo: { type: String, default: 'create' },
})

const emit = defineEmits(['submit', 'cancel'])

const MODELO_VACIO = {
  nombre: '',
  gerente: '',
  ruc: '',
  correo: '',
  telefono: '',
  region: '',
  direccion: '',
  sitioWeb: '',
  estado: 'active',
  logoUrl: '',
  colorPrimario: '#e50914',
  colorSecundario: '#1c1b1b',
}

/** El RUC es opcional; si viene, debe tener entre 8 y 11 dígitos. */
const RUC_VALIDO = /^[0-9]{8,11}$/

const nombreInput = useTemplateRef('nombreInput')
const gerenteInput = useTemplateRef('gerenteInput')
const correoInput = useTemplateRef('correoInput')
const telefonoInput = useTemplateRef('telefonoInput')
const rucInput = useTemplateRef('rucInput')
const sitioWebInput = useTemplateRef('sitioWebInput')
const regionInput = useTemplateRef('regionInput')
const direccionInput = useTemplateRef('direccionInput')
const logoInput = useTemplateRef('logoInput')
const colorPrimarioInput = useTemplateRef('colorPrimarioInput')
const colorSecundarioInput = useTemplateRef('colorSecundarioInput')
const estadoInput = useTemplateRef('estadoInput')

const logo = useVistaPreviaArchivo({ etiqueta: 'logo' })

/** Reglas propias de una empresa. Las de forma salen de `utils/validaciones`. */
function validar(datos, errores) {
  const nombre = datos.nombre.trim()
  if (nombre.length < 3) errores.nombre = 'Introduce un nombre de al menos 3 caracteres.'
  else if (nombre.length > 80) errores.nombre = 'El nombre no puede superar 80 caracteres.'

  if (datos.gerente.trim().length < 3) errores.gerente = 'Introduce el nombre del gerente.'
  if (!esCorreoValido(datos.correo)) errores.correo = 'Introduce un correo válido.'
  if (!esTelefonoValido(datos.telefono)) errores.telefono = 'Introduce un teléfono válido.'

  if (datos.ruc && !RUC_VALIDO.test(datos.ruc.trim())) {
    errores.ruc = 'El RUC debe contener entre 8 y 11 dígitos.'
  }

  if (datos.sitioWeb && !esUrlValida(datos.sitioWeb)) {
    errores.sitioWeb = 'Introduce una URL completa que empiece por http:// o https://.'
  }

  if (!esColorValido(datos.colorPrimario)) {
    errores.colorPrimario = 'Introduce un color hexadecimal válido.'
  }
  if (!esColorValido(datos.colorSecundario)) {
    errores.colorSecundario = 'Introduce un color hexadecimal válido.'
  }
}

const { formulario, erroresLocales, erroresRemotos, errorDe, limpiarError, validarParaEnviar } =
  useFormulario({
    modeloVacio: MODELO_VACIO,
    valoresIniciales: () => props.valoresIniciales,
    erroresServidor: () => props.erroresServidor,
    referencias: {
      nombre: nombreInput,
      gerente: gerenteInput,
      correo: correoInput,
      telefono: telefonoInput,
      ruc: rucInput,
      sitioWeb: sitioWebInput,
      region: regionInput,
      direccion: direccionInput,
      logoUrl: logoInput,
      colorPrimario: colorPrimarioInput,
      colorSecundario: colorSecundarioInput,
      estado: estadoInput,
    },
    validar,
    alCargarValores: (_datos, valores) => logo.reiniciar(valores.logoUrl),
  })

async function enviar() {
  if (props.enviando) return
  if (!(await validarParaEnviar())) return

  emit('submit', {
    ...formulario,
    nombre: formulario.nombre.trim(),
    gerente: formulario.gerente.trim(),
    ruc: formulario.ruc.trim(),
    correo: formulario.correo.trim().toLowerCase(),
    telefono: formulario.telefono.trim(),
    direccion: formulario.direccion.trim(),
    sitioWeb: formulario.sitioWeb.trim(),
  })
}

function seleccionarLogo(evento) {
  limpiarError('logoUrl')
  logo.seleccionar(evento, formulario.logoUrl)
}
</script>

<template>
  <form class="formulario" autocomplete="off" novalidate @submit.prevent="enviar">
    <p class="visually-hidden" aria-live="polite">
      {{
        Object.keys(erroresRemotos).length || Object.keys(erroresLocales).length
          ? 'Revisa los campos marcados en el formulario.'
          : ''
      }}
    </p>
    <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-informacion">
      <header>
        <span aria-hidden="true"><IconoSvg nombre="buildings" /></span>
        <div>
          <h2 id="titulo-informacion">Información principal</h2>
          <p>Datos administrativos y de contacto de la empresa.</p>
        </div>
      </header>

      <div class="formulario__rejilla">
        <div class="campo">
          <label class="form-label" for="empresa-nombre">Nombre de empresa *</label>
          <input
            id="empresa-nombre"
            ref="nombreInput"
            v-model="formulario.nombre"
            class="form-control"
            :class="{ 'is-invalid': errorDe('nombre') }"
            type="text"
            name="nombre"
            maxlength="80"
            autocomplete="organization"
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
          <label class="form-label" for="empresa-gerente">Nombre del gerente *</label>
          <input
            id="empresa-gerente"
            ref="gerenteInput"
            v-model="formulario.gerente"
            class="form-control"
            :class="{ 'is-invalid': errorDe('gerente') }"
            type="text"
            name="gerente"
            autocomplete="name"
            required
            :aria-invalid="Boolean(errorDe('gerente'))"
            :aria-describedby="errorDe('gerente') ? 'error-gerente' : null"
            @input="limpiarError('gerente')"
          />
          <p v-if="errorDe('gerente')" id="error-gerente" class="campo__error">
            {{ errorDe('gerente') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="empresa-correo">Correo *</label>
          <input
            id="empresa-correo"
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
          <label class="form-label" for="empresa-telefono">Teléfono *</label>
          <input
            id="empresa-telefono"
            ref="telefonoInput"
            v-model="formulario.telefono"
            class="form-control"
            :class="{ 'is-invalid': errorDe('telefono') }"
            type="tel"
            name="telefono"
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

        <div class="campo">
          <label class="form-label" for="empresa-ruc">RUC</label>
          <input
            id="empresa-ruc"
            ref="rucInput"
            v-model="formulario.ruc"
            class="form-control"
            :class="{ 'is-invalid': errorDe('ruc') }"
            type="text"
            name="ruc"
            inputmode="numeric"
            maxlength="11"
            :aria-invalid="Boolean(errorDe('ruc'))"
            :aria-describedby="errorDe('ruc') ? 'error-ruc' : 'ayuda-ruc'"
            @input="limpiarError('ruc')"
          />
          <p id="ayuda-ruc" class="campo__ayuda">
            Dato provisional hasta cerrar reglas con Laravel.
          </p>
          <p v-if="errorDe('ruc')" id="error-ruc" class="campo__error">{{ errorDe('ruc') }}</p>
        </div>

        <div class="campo">
          <label class="form-label" for="empresa-region">Región</label>
          <select
            id="empresa-region"
            ref="regionInput"
            v-model="formulario.region"
            class="form-select"
            :class="{ 'is-invalid': errorDe('region') }"
            name="region"
            :aria-invalid="Boolean(errorDe('region'))"
            :aria-describedby="errorDe('region') ? 'error-region' : null"
            @change="limpiarError('region')"
          >
            <option value="">Selecciona una región</option>
            <option v-for="region in REGIONES_PERU" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
          <p v-if="errorDe('region')" id="error-region" class="campo__error">
            {{ errorDe('region') }}
          </p>
        </div>

        <div class="campo campo--completo">
          <label class="form-label" for="empresa-direccion">Dirección</label>
          <textarea
            id="empresa-direccion"
            ref="direccionInput"
            v-model="formulario.direccion"
            class="form-control"
            :class="{ 'is-invalid': errorDe('direccion') }"
            name="direccion"
            rows="2"
            autocomplete="street-address"
            :aria-invalid="Boolean(errorDe('direccion'))"
            :aria-describedby="errorDe('direccion') ? 'error-direccion' : null"
            @input="limpiarError('direccion')"
          ></textarea>
          <p v-if="errorDe('direccion')" id="error-direccion" class="campo__error">
            {{ errorDe('direccion') }}
          </p>
        </div>

        <div class="campo campo--completo">
          <label class="form-label" for="empresa-web">Sitio web</label>
          <input
            id="empresa-web"
            ref="sitioWebInput"
            v-model="formulario.sitioWeb"
            class="form-control"
            :class="{ 'is-invalid': errorDe('sitioWeb') }"
            type="url"
            name="sitioWeb"
            placeholder="https://empresa.test"
            autocomplete="url"
            :aria-invalid="Boolean(errorDe('sitioWeb'))"
            :aria-describedby="errorDe('sitioWeb') ? 'error-sitio-web' : null"
            @input="limpiarError('sitioWeb')"
          />
          <p v-if="errorDe('sitioWeb')" id="error-sitio-web" class="campo__error">
            {{ errorDe('sitioWeb') }}
          </p>
        </div>
      </div>
    </section>

    <div class="formulario__secundarias">
      <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-identidad">
        <header>
          <span aria-hidden="true"><IconoSvg nombre="palette" /></span>
          <div>
            <h2 id="titulo-identidad">Identidad visual</h2>
            <p>Los colores sí se guardan. El logo, todavía no: falta el endpoint de subida.</p>
          </div>
        </header>

        <div class="identidad">
          <div
            class="identidad__logo"
            :style="{ backgroundImage: logo.url ? `url(${logo.url})` : null }"
          >
            <IconoSvg nombre="buildings" />
          </div>
          <div class="campo">
            <label class="form-label" for="empresa-logo">Logo</label>
            <input
              id="empresa-logo"
              ref="logoInput"
              class="form-control"
              :class="{ 'is-invalid': logo.error || errorDe('logoUrl') }"
              type="file"
              name="logo"
              accept="image/*"
              :aria-invalid="Boolean(logo.error || errorDe('logoUrl'))"
              :aria-describedby="logo.error || errorDe('logoUrl') ? 'error-logo' : 'ayuda-logo'"
              @change="seleccionarLogo"
            />
            <p id="ayuda-logo" class="campo__ayuda">
              PNG, JPG o WebP. Máximo 2 MB. Sólo vista previa: al guardar, el archivo
              <strong>no</strong> se envía todavía, porque la API aún no expone dónde subirlo.
            </p>
            <p v-if="logo.error || errorDe('logoUrl')" id="error-logo" class="campo__error">
              {{ logo.error || errorDe('logoUrl') }}
            </p>
          </div>
        </div>

        <div class="colores">
          <div class="campo">
            <label class="form-label" for="color-primario">Color principal</label>
            <div class="campo-color">
              <input
                id="color-primario"
                v-model="formulario.colorPrimario"
                type="color"
                name="colorPrimario"
                @input="limpiarError('colorPrimario')"
              />
              <input
                ref="colorPrimarioInput"
                v-model="formulario.colorPrimario"
                class="form-control"
                :class="{ 'is-invalid': errorDe('colorPrimario') }"
                type="text"
                name="colorPrimarioHex"
                maxlength="7"
                aria-label="Código hexadecimal del color principal"
                :aria-invalid="Boolean(errorDe('colorPrimario'))"
                :aria-describedby="errorDe('colorPrimario') ? 'error-color-primario' : null"
                @input="limpiarError('colorPrimario')"
              />
            </div>
            <p v-if="errorDe('colorPrimario')" id="error-color-primario" class="campo__error">
              {{ errorDe('colorPrimario') }}
            </p>
          </div>
          <div class="campo">
            <label class="form-label" for="color-secundario">Color secundario</label>
            <div class="campo-color">
              <input
                id="color-secundario"
                v-model="formulario.colorSecundario"
                type="color"
                name="colorSecundario"
                @input="limpiarError('colorSecundario')"
              />
              <input
                ref="colorSecundarioInput"
                v-model="formulario.colorSecundario"
                class="form-control"
                :class="{ 'is-invalid': errorDe('colorSecundario') }"
                type="text"
                name="colorSecundarioHex"
                maxlength="7"
                aria-label="Código hexadecimal del color secundario"
                :aria-invalid="Boolean(errorDe('colorSecundario'))"
                :aria-describedby="errorDe('colorSecundario') ? 'error-color-secundario' : null"
                @input="limpiarError('colorSecundario')"
              />
            </div>
            <p v-if="errorDe('colorSecundario')" id="error-color-secundario" class="campo__error">
              {{ errorDe('colorSecundario') }}
            </p>
          </div>
        </div>
      </section>

      <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-estado">
        <header>
          <span aria-hidden="true"><IconoSvg nombre="power" /></span>
          <div>
            <h2 id="titulo-estado">Estado de la empresa</h2>
            <p>Controla el acceso operativo dentro de Gym Bros.</p>
          </div>
        </header>

        <fieldset
          class="estado-opciones"
          :class="{ 'estado-opciones--invalido': errorDe('estado') }"
          aria-labelledby="titulo-estado"
          :aria-describedby="errorDe('estado') ? 'error-estado' : null"
        >
          <label>
            <input
              ref="estadoInput"
              v-model="formulario.estado"
              type="radio"
              name="estado"
              value="active"
              @change="limpiarError('estado')"
            />
            <span><b>Activa</b><small>La empresa puede operar normalmente.</small></span>
          </label>
          <label>
            <input
              v-model="formulario.estado"
              type="radio"
              name="estado"
              value="inactive"
              @change="limpiarError('estado')"
            />
            <span><b>Inactiva</b><small>El acceso de la empresa queda suspendido.</small></span>
          </label>
        </fieldset>
        <p v-if="errorDe('estado')" id="error-estado" class="campo__error">
          {{ errorDe('estado') }}
        </p>
      </section>
    </div>

    <div class="formulario__acciones">
      <button type="button" class="btn btn-ghost" :disabled="enviando" @click="emit('cancel')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ enviando ? 'Guardando…' : modo === 'edit' ? 'Guardar cambios' : 'Guardar empresa' }}
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
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--gb-surface-high);
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

.formulario__rejilla,
.colores {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.campo {
  min-width: 0;
}

.campo--completo {
  grid-column: 1 / -1;
}

.campo__ayuda,
.campo__error {
  margin: 0.375rem 0 0;
  font-size: var(--gb-tipo-xxs);
}

.campo__ayuda {
  color: var(--gb-text-muted);
}

.campo__error {
  color: var(--gb-error);
}

.formulario__secundarias {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr);
  gap: var(--gb-gutter);
  align-items: start;
}

.identidad {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.identidad__logo {
  display: grid;
  place-items: center;
  width: 5rem;
  height: 5rem;
  background-color: var(--gb-surface-lowest);
  background-position: center;
  background-size: cover;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-text-soft);
  font-size: 1.5rem;
}

.colores {
  margin-top: 1rem;
}

.campo-color {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr);
  gap: 0.5rem;
}

.campo-color input[type='color'] {
  width: 3rem;
  height: 3rem;
  padding: 0.25rem;
  background-color: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius);
}

.estado-opciones {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.estado-opciones label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  background-color: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  cursor: pointer;
}

.estado-opciones label:has(input:checked) {
  border-color: var(--gb-red);
  box-shadow: var(--gb-relieve);
}

.estado-opciones--invalido label {
  border-color: var(--gb-error);
}

.estado-opciones input {
  margin-top: 0.2rem;
  accent-color: var(--gb-red);
}

.estado-opciones span {
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

.formulario__acciones {
  position: sticky;
  bottom: 0;
  z-index: 5;
  isolation: isolate;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 0;
  background-color: var(--gb-bg);
  border-top: 1px solid var(--gb-border);
}

/* El contenido principal conserva un margen inferior. Al quedar pegada la
   barra, este fondo sólido prolonga su superficie hasta el borde visible y
   evita que el formulario que pasa por debajo aparezca como una franja. */
.formulario__acciones::after {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  height: var(--gb-margen);
  background-color: var(--gb-bg);
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
  .colores {
    grid-template-columns: 1fr;
  }

  .campo--completo {
    grid-column: auto;
  }
}
</style>
