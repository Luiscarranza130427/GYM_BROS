<script setup>
import { Building2, Clock3, Palette, Power } from 'lucide-vue-next'
import { computed, ref, useTemplateRef } from 'vue'

import { useFormulario } from '@/shared/composables/useFormulario'
import { useVistaPreviaArchivo } from '@/shared/composables/useVistaPreviaArchivo'
import { REGIONES_PERU } from '@/shared/constants/regionesPeru'
import { normalizarLogoEmpresa } from '@/shared/utils/logoEmpresa'
import {
  esColorValido,
  esCorreoValido,
  esTelefonoValido,
  esUrlValida,
} from '@/shared/utils/validaciones'

const props = defineProps({
  valoresIniciales: { type: Object, default: () => ({}) },
  enviando: { type: Boolean, default: false },
  erroresServidor: { type: Object, default: () => ({}) },
  modo: { type: String, default: 'create' },
})

const emit = defineEmits(['submit', 'cancel'])

const DIAS = [
  { valor: 'lunes', etiqueta: 'Lunes' },
  { valor: 'martes', etiqueta: 'Martes' },
  { valor: 'miercoles', etiqueta: 'Miércoles' },
  { valor: 'jueves', etiqueta: 'Jueves' },
  { valor: 'viernes', etiqueta: 'Viernes' },
  { valor: 'sabado', etiqueta: 'Sábado' },
  { valor: 'domingo', etiqueta: 'Domingo' },
]

const MODELO_HORARIOS = Object.fromEntries(
  DIAS.flatMap(({ valor }) => [
    [`horario_inicio_${valor}`, ''],
    [`horario_fin_${valor}`, ''],
  ]),
)

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
  ...MODELO_HORARIOS,
}

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
const primerHorarioInput = ref(null)

function registrarPrimerHorario(elemento, indice) {
  if (indice === 0) primerHorarioInput.value = elemento
}

const logo = useVistaPreviaArchivo({ etiqueta: 'logo', procesarImagen: normalizarLogoEmpresa })
const logoImagenFallida = ref(false)
const logoRenderUrl = computed(() => logo.url.value || '')
const mensajeHorarios = ref('')

/** Reglas propias de una empresa. Las de forma salen de `utils/validaciones`. */
function validar(datos, errores) {
  const nombre = datos.nombre.trim()
  if (nombre.length < 3) errores.nombre = 'Introduce un nombre de al menos 3 caracteres.'
  else if (nombre.length > 80) errores.nombre = 'El nombre no puede superar 80 caracteres.'

  if (datos.gerente.trim().length < 3) errores.gerente = 'Introduce el nombre del gerente.'
  if (!esCorreoValido(datos.correo)) errores.correo = 'Introduce un correo válido.'
  if (!esTelefonoValido(datos.telefono)) errores.telefono = 'Introduce un teléfono válido.'

  if (datos.sitioWeb && !esUrlValida(datos.sitioWeb)) {
    errores.sitioWeb = 'Introduce una URL completa que empiece por http:// o https://.'
  }

  if (!esColorValido(datos.colorPrimario)) {
    errores.colorPrimario = 'Introduce un color hexadecimal válido.'
  }
  if (!esColorValido(datos.colorSecundario)) {
    errores.colorSecundario = 'Introduce un color hexadecimal válido.'
  }

  for (const { valor, etiqueta } of DIAS) {
    const inicio = datos[`horario_inicio_${valor}`]
    const fin = datos[`horario_fin_${valor}`]
    if (!inicio || !fin) {
      errores.horarios = `Completa el horario de ${etiqueta.toLowerCase()}.`
      break
    }
    if (inicio >= fin) {
      errores.horarios = `En ${etiqueta}, la hora de cierre debe ser posterior a la apertura.`
      break
    }
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
      horarios: primerHorarioInput,
    },
    validar,
    alCargarValores: (_datos, valores) =>
      (() => {
        logoImagenFallida.value = false
        logo.reiniciar(valores.logoUrl || '')
      })(),
  })

const horarioLunesCompleto = computed(
  () => Boolean(formulario.horario_inicio_lunes) && Boolean(formulario.horario_fin_lunes),
)

function copiarHorarioLunes() {
  if (!horarioLunesCompleto.value) return

  for (const { valor } of DIAS.slice(1)) {
    formulario[`horario_inicio_${valor}`] = formulario.horario_inicio_lunes
    formulario[`horario_fin_${valor}`] = formulario.horario_fin_lunes
  }
  limpiarError('horarios')
  mensajeHorarios.value = 'Horario del lunes aplicado de martes a domingo.'
}

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

async function seleccionarLogo(evento) {
  limpiarError('logoUrl')
  await logo.seleccionar(evento, formulario.logoUrl)
  if (!logo.error.value) formulario.logoUrl = logo.url.value
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
        <span aria-hidden="true"><Building2 :size="20" /></span>
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
            maxlength="12"
            :aria-invalid="Boolean(errorDe('ruc'))"
            :aria-describedby="errorDe('ruc') ? 'error-ruc' : 'ayuda-ruc'"
            @input="limpiarError('ruc')"
          />
          <p id="ayuda-ruc" class="campo__ayuda">
            El API admite hasta 12 caracteres. Laravel aplica la validación definitiva.
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

    <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-horarios">
      <header class="horarios-encabezado">
        <span aria-hidden="true"><Clock3 :size="20" /></span>
        <div class="horarios-encabezado__texto">
          <h2 id="titulo-horarios">Horarios de atención</h2>
          <p>Configura la apertura y el cierre que utilizará la aplicación móvil.</p>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-sm horarios-encabezado__accion"
          :disabled="!horarioLunesCompleto || enviando"
          @click="copiarHorarioLunes"
        >
          Copiar lunes al resto
        </button>
      </header>

      <div class="horarios" :class="{ 'horarios--invalidos': errorDe('horarios') }">
        <div class="horarios__cabecera" aria-hidden="true">
          <span>Día</span>
          <span>Apertura</span>
          <span>Cierre</span>
        </div>
        <div v-for="(dia, indice) in DIAS" :key="dia.valor" class="horario">
          <strong>{{ dia.etiqueta }}</strong>
          <div class="campo">
            <label class="visually-hidden" :for="`horario-inicio-${dia.valor}`">
              Apertura del {{ dia.etiqueta.toLowerCase() }}
            </label>
            <input
              :id="`horario-inicio-${dia.valor}`"
              :ref="(elemento) => registrarPrimerHorario(elemento, indice)"
              v-model="formulario[`horario_inicio_${dia.valor}`]"
              class="form-control"
              type="time"
              :name="`horario_inicio_${dia.valor}`"
              required
              :aria-invalid="Boolean(errorDe('horarios'))"
              :aria-describedby="errorDe('horarios') ? 'error-horarios' : null"
              @input="limpiarError('horarios')"
            />
          </div>
          <div class="campo">
            <label class="visually-hidden" :for="`horario-fin-${dia.valor}`">
              Cierre del {{ dia.etiqueta.toLowerCase() }}
            </label>
            <input
              :id="`horario-fin-${dia.valor}`"
              v-model="formulario[`horario_fin_${dia.valor}`]"
              class="form-control"
              type="time"
              :name="`horario_fin_${dia.valor}`"
              required
              :aria-invalid="Boolean(errorDe('horarios'))"
              :aria-describedby="errorDe('horarios') ? 'error-horarios' : null"
              @input="limpiarError('horarios')"
            />
          </div>
        </div>
      </div>
      <p v-if="errorDe('horarios')" id="error-horarios" class="campo__error" role="alert">
        {{ errorDe('horarios') }}
      </p>
      <p class="visually-hidden" aria-live="polite">{{ mensajeHorarios }}</p>
    </section>

    <div class="formulario__secundarias">
      <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-identidad">
        <header>
          <span aria-hidden="true"><Palette :size="20" /></span>
          <div>
            <h2 id="titulo-identidad">Identidad visual</h2>
            <p>Personaliza el logo y los colores de tu empresa.</p>
          </div>
        </header>

        <div class="identidad">
          <div class="identidad__logo" :class="{ 'identidad__logo--con-imagen': logo.url }">
            <img
              v-if="logoRenderUrl && !logoImagenFallida"
              :src="logoRenderUrl"
              alt="Logo actual de la empresa"
              @error="logoImagenFallida = true"
            />
            <Building2 v-if="!logo.url || logoImagenFallida" :size="24" />
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
              accept="image/png,image/jpeg,image/webp"
              :disabled="logo.procesando"
              :aria-invalid="Boolean(logo.error || errorDe('logoUrl'))"
              :aria-describedby="logo.error || errorDe('logoUrl') ? 'error-logo' : 'ayuda-logo'"
              @change="seleccionarLogo"
            />
            <p id="ayuda-logo" class="campo__ayuda">
              PNG, JPG o WebP. Máximo 2 MB. Se adapta automáticamente a
              <strong>400 × 180 px</strong>. Puedes reemplazar el logo cuando el API habilite la
              subida.
            </p>
            <p v-if="logo.error || errorDe('logoUrl')" id="error-logo" class="campo__error">
              {{ logo.error || errorDe('logoUrl') }}
            </p>
          </div>
        </div>

        <div class="colores">
          <div class="campo">
            <label class="form-label" for="color-primario">Color de fondo</label>
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
                aria-label="Código hexadecimal del color de fondo"
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
            <label class="form-label" for="color-secundario">Color de texto</label>
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
                aria-label="Código hexadecimal del color de texto"
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
          <span aria-hidden="true"><Power :size="20" /></span>
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
      <button type="button" class="btn btn-secondary" :disabled="enviando" @click="emit('cancel')">
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

.horarios {
  display: grid;
  gap: 0;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  overflow: hidden;
}

.horarios-encabezado__texto {
  flex: 1;
  min-width: 0;
}

.horarios-encabezado__accion {
  flex: none;
  align-self: center;
}

.horarios__cabecera,
.horario {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) repeat(2, minmax(8rem, 0.75fr));
  gap: 1rem;
}

.horarios__cabecera {
  padding: 0.625rem 1rem;
  background-color: var(--gb-surface-high);
  border-bottom: 1px solid var(--gb-border);
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.horario {
  align-items: center;
  padding: 0.625rem 1rem;
  background-color: var(--gb-surface-lowest);
  border-bottom: 1px solid var(--gb-border);
}

.horario:last-child {
  border-bottom: 0;
}

.horario > strong {
  align-self: center;
  font-size: var(--gb-tipo-sm);
}

.horario .form-control {
  width: 100%;
  min-width: 0;
}

.horarios--invalidos {
  border-color: var(--gb-error);
}

.formulario__secundarias {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(20rem, 0.75fr);
  gap: var(--gb-gutter, 1.25rem);
  align-items: stretch;
}

.formulario__secundarias .formulario__seccion {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.formulario__secundarias .formulario__seccion > header {
  min-height: 3.5rem;
  margin-bottom: 1rem;
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
  background-size: contain;
  background-repeat: no-repeat;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-text-soft);
  font-size: 1.5rem;
}

.identidad__logo--con-imagen {
  padding: 0.25rem;
}

.identidad__logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
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
  flex: 1;
  display: grid;
  gap: 0.75rem;
  align-content: space-around;
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

  .horarios-encabezado {
    flex-wrap: wrap;
  }

  .horarios-encabezado__accion {
    width: 100%;
  }

  .horarios__cabecera,
  .horario {
    grid-template-columns: minmax(5rem, 0.65fr) repeat(2, minmax(0, 1fr));
    gap: 0.625rem;
  }
}
</style>
