<script setup>
import { useTemplateRef } from 'vue'

import IconoSvg from '@/components/base/IconoSvg.vue'
import { useFormulario } from '@/composables/useFormulario'
import { TIPOS_ALIMENTO, valoresDe } from '@/modules/alimentacion/catalogos'

const props = defineProps({
  valoresIniciales: { type: Object, default: () => ({}) },
  enviando: { type: Boolean, default: false },
  erroresServidor: { type: Object, default: () => ({}) },
  modo: { type: String, default: 'create' },
})

const emit = defineEmits(['submit', 'cancel'])

/**
 * Los siete campos que el servicio envía (`CAMPOS_EDITABLES_ALIMENTO`).
 *
 * No hay control de estado ni de unidad a propósito: el servicio no los manda
 * —la unidad la deriva el backend del tipo— y un campo que nadie lee haría creer
 * al administrador que ha cambiado algo.
 *
 * Los macros arrancan vacíos y no en cero: un cero prerrellenado se envía sin
 * mirar, y «0 g de proteínas» es un dato, no un campo sin rellenar.
 */
const MODELO_VACIO = {
  nombre: '',
  tipo: '',
  calorias: '',
  proteinas: '',
  carbohidratos: '',
  grasas: '',
  fibra: '',
}

const nombreInput = useTemplateRef('nombreInput')
const tipoInput = useTemplateRef('tipoInput')
const caloriasInput = useTemplateRef('caloriasInput')
const proteinasInput = useTemplateRef('proteinasInput')
const carbohidratosInput = useTemplateRef('carbohidratosInput')
const grasasInput = useTemplateRef('grasasInput')
const fibraInput = useTemplateRef('fibraInput')

/**
 * Macro admisible: número mayor o igual que cero, con decimales.
 *
 * El vacío se rechaza explícitamente porque `Number('')` es 0: sin esta
 * comprobación, borrar el campo se guardaría como un cero silencioso. Y son
 * decimales, no enteros: 3,6 g de grasa por 100 g es un valor corriente.
 */
function esNumeroNoNegativo(valor) {
  const texto = String(valor).trim()
  if (!texto) return false
  const numero = Number(texto)
  return Number.isFinite(numero) && numero >= 0
}

const MACROS = ['calorias', 'proteinas', 'carbohidratos', 'grasas', 'fibra']

function validar(datos, errores) {
  if (datos.nombre.trim().length < 3) {
    errores.nombre = 'Introduce un nombre de al menos 3 caracteres.'
  }

  if (!valoresDe(TIPOS_ALIMENTO).includes(datos.tipo)) {
    errores.tipo = 'Selecciona un tipo válido.'
  }

  MACROS.forEach((campo) => {
    if (!esNumeroNoNegativo(datos[campo])) {
      errores[campo] = 'Introduce un número igual o mayor que 0.'
    }
  })
}

const { formulario, erroresLocales, erroresRemotos, errorDe, limpiarError, validarParaEnviar } =
  useFormulario({
    modeloVacio: MODELO_VACIO,
    valoresIniciales: () => props.valoresIniciales,
    erroresServidor: () => props.erroresServidor,
    referencias: {
      nombre: nombreInput,
      tipo: tipoInput,
      calorias: caloriasInput,
      proteinas: proteinasInput,
      carbohidratos: carbohidratosInput,
      grasas: grasasInput,
      fibra: fibraInput,
    },
    validar,
  })

async function enviar() {
  if (props.enviando) return
  if (!(await validarParaEnviar())) return

  emit('submit', {
    ...formulario,
    nombre: formulario.nombre.trim(),
    ...Object.fromEntries(MACROS.map((campo) => [campo, Number(formulario[campo])])),
  })
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

    <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-alimento">
      <header>
        <span aria-hidden="true"><IconoSvg nombre="fork-knife" /></span>
        <div>
          <h2 id="titulo-alimento">Identificación del alimento</h2>
          <p>Cómo se llama y en qué grupo entra dentro del catálogo.</p>
        </div>
      </header>

      <div class="formulario__rejilla">
        <div class="campo">
          <label class="form-label" for="alimento-nombre">Nombre del alimento *</label>
          <input
            id="alimento-nombre"
            ref="nombreInput"
            v-model="formulario.nombre"
            class="form-control"
            :class="{ 'is-invalid': errorDe('nombre') }"
            type="text"
            name="nombre"
            maxlength="80"
            required
            :aria-invalid="Boolean(errorDe('nombre'))"
            :aria-describedby="errorDe('nombre') ? 'error-nombre' : null"
            @input="limpiarError('nombre')"
          />
          <p v-if="errorDe('nombre')" id="error-nombre" class="campo__error" role="alert">
            {{ errorDe('nombre') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="alimento-tipo">Tipo *</label>
          <select
            id="alimento-tipo"
            ref="tipoInput"
            v-model="formulario.tipo"
            class="form-select"
            :class="{ 'is-invalid': errorDe('tipo') }"
            name="tipo"
            required
            :aria-invalid="Boolean(errorDe('tipo'))"
            :aria-describedby="errorDe('tipo') ? 'error-tipo' : 'ayuda-tipo'"
            @change="limpiarError('tipo')"
          >
            <option value="">Selecciona un tipo</option>
            <option v-for="opcion in TIPOS_ALIMENTO" :key="opcion.valor" :value="opcion.valor">
              {{ opcion.etiqueta }}
            </option>
          </select>
          <p id="ayuda-tipo" class="campo__ayuda">
            De él depende la unidad en que se mide el alimento al añadirlo a una comida.
          </p>
          <p v-if="errorDe('tipo')" id="error-tipo" class="campo__error" role="alert">
            {{ errorDe('tipo') }}
          </p>
        </div>
      </div>
    </section>

    <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-nutricion">
      <header>
        <span aria-hidden="true"><IconoSvg nombre="clipboard2-pulse-fill" /></span>
        <div>
          <h2 id="titulo-nutricion">Información nutricional</h2>
          <p>
            Todos los valores se entienden <b>por cada 100 g o 100 ml</b> del alimento. Al armar una
            comida se escalan según la cantidad servida.
          </p>
        </div>
      </header>

      <div class="formulario__rejilla formulario__rejilla--macros">
        <div class="campo">
          <label class="form-label" for="alimento-calorias">Energía (kcal) *</label>
          <input
            id="alimento-calorias"
            ref="caloriasInput"
            v-model="formulario.calorias"
            class="form-control"
            :class="{ 'is-invalid': errorDe('calorias') }"
            type="number"
            name="calorias"
            inputmode="decimal"
            min="0"
            step="0.1"
            required
            :aria-invalid="Boolean(errorDe('calorias'))"
            :aria-describedby="errorDe('calorias') ? 'error-calorias' : null"
            @input="limpiarError('calorias')"
          />
          <p v-if="errorDe('calorias')" id="error-calorias" class="campo__error" role="alert">
            {{ errorDe('calorias') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="alimento-proteinas">Proteínas (g) *</label>
          <input
            id="alimento-proteinas"
            ref="proteinasInput"
            v-model="formulario.proteinas"
            class="form-control"
            :class="{ 'is-invalid': errorDe('proteinas') }"
            type="number"
            name="proteinas"
            inputmode="decimal"
            min="0"
            step="0.1"
            required
            :aria-invalid="Boolean(errorDe('proteinas'))"
            :aria-describedby="errorDe('proteinas') ? 'error-proteinas' : null"
            @input="limpiarError('proteinas')"
          />
          <p v-if="errorDe('proteinas')" id="error-proteinas" class="campo__error" role="alert">
            {{ errorDe('proteinas') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="alimento-carbohidratos">Carbohidratos (g) *</label>
          <input
            id="alimento-carbohidratos"
            ref="carbohidratosInput"
            v-model="formulario.carbohidratos"
            class="form-control"
            :class="{ 'is-invalid': errorDe('carbohidratos') }"
            type="number"
            name="carbohidratos"
            inputmode="decimal"
            min="0"
            step="0.1"
            required
            :aria-invalid="Boolean(errorDe('carbohidratos'))"
            :aria-describedby="errorDe('carbohidratos') ? 'error-carbohidratos' : null"
            @input="limpiarError('carbohidratos')"
          />
          <p
            v-if="errorDe('carbohidratos')"
            id="error-carbohidratos"
            class="campo__error"
            role="alert"
          >
            {{ errorDe('carbohidratos') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="alimento-grasas">Grasas (g) *</label>
          <input
            id="alimento-grasas"
            ref="grasasInput"
            v-model="formulario.grasas"
            class="form-control"
            :class="{ 'is-invalid': errorDe('grasas') }"
            type="number"
            name="grasas"
            inputmode="decimal"
            min="0"
            step="0.1"
            required
            :aria-invalid="Boolean(errorDe('grasas'))"
            :aria-describedby="errorDe('grasas') ? 'error-grasas' : null"
            @input="limpiarError('grasas')"
          />
          <p v-if="errorDe('grasas')" id="error-grasas" class="campo__error" role="alert">
            {{ errorDe('grasas') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="alimento-fibra">Fibra (g) *</label>
          <input
            id="alimento-fibra"
            ref="fibraInput"
            v-model="formulario.fibra"
            class="form-control"
            :class="{ 'is-invalid': errorDe('fibra') }"
            type="number"
            name="fibra"
            inputmode="decimal"
            min="0"
            step="0.1"
            required
            :aria-invalid="Boolean(errorDe('fibra'))"
            :aria-describedby="errorDe('fibra') ? 'error-fibra' : 'ayuda-fibra'"
            @input="limpiarError('fibra')"
          />
          <p id="ayuda-fibra" class="campo__ayuda">Cero en los alimentos que no aportan fibra.</p>
          <p v-if="errorDe('fibra')" id="error-fibra" class="campo__error" role="alert">
            {{ errorDe('fibra') }}
          </p>
        </div>
      </div>
    </section>

    <div class="formulario__acciones">
      <button type="button" class="btn btn-ghost" :disabled="enviando" @click="emit('cancel')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ enviando ? 'Guardando…' : modo === 'edit' ? 'Guardar cambios' : 'Guardar alimento' }}
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
  max-width: 46rem;
  margin-top: 0.25rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.formulario__seccion header b {
  color: var(--gb-text);
}

.formulario__rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.formulario__rejilla--macros {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.campo {
  min-width: 0;
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

@media (max-width: 64rem) {
  .formulario__acciones::after {
    height: var(--gb-gutter);
  }
}

@media (max-width: 52rem) {
  .formulario__rejilla,
  .formulario__rejilla--macros {
    grid-template-columns: 1fr;
  }
}
</style>
