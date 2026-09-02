<script setup>
import { Activity, Dumbbell, Power } from 'lucide-vue-next'
import { useTemplateRef } from 'vue'

import { useFormulario } from '@/shared/composables/useFormulario'
import { CATEGORIAS, EQUIPOS, NIVELES, valoresDe } from '@/modules/ejercicios/catalogos'

const props = defineProps({
  valoresIniciales: { type: Object, default: () => ({}) },
  enviando: { type: Boolean, default: false },
  erroresServidor: { type: Object, default: () => ({}) },
  modo: { type: String, default: 'create' },
})

const emit = defineEmits(['submit', 'cancel'])

const MODELO_VACIO = {
  nombre: '',
  categoria: '',
  nivel: '',
  equipo: '',
  descripcion: '',
  seriesSugeridas: 3,
  repeticionesSugeridas: 10,
  estado: 'active',
}

const nombreInput = useTemplateRef('nombreInput')
const categoriaInput = useTemplateRef('categoriaInput')
const nivelInput = useTemplateRef('nivelInput')
const equipoInput = useTemplateRef('equipoInput')
const descripcionInput = useTemplateRef('descripcionInput')
const seriesInput = useTemplateRef('seriesInput')
const repeticionesInput = useTemplateRef('repeticionesInput')
const estadoInput = useTemplateRef('estadoInput')

/**
 * Serie o repetición admisible: entero mayor o igual que cero.
 *
 * El vacío se rechaza explícitamente porque `Number('')` es 0: sin esta
 * comprobación, borrar el campo se guardaría como un cero silencioso.
 */
function esEnteroNoNegativo(valor) {
  const texto = String(valor).trim()
  if (!texto) return false
  const numero = Number(texto)
  return Number.isInteger(numero) && numero >= 0
}

/** Reglas propias de un ejercicio. Los catálogos son el vocabulario cerrado. */
function validar(datos, errores) {
  if (datos.nombre.trim().length < 3) {
    errores.nombre = 'Introduce un nombre de al menos 3 caracteres.'
  }

  if (!valoresDe(CATEGORIAS).includes(datos.categoria)) {
    errores.categoria = 'Selecciona una categoría válida.'
  }
  if (!valoresDe(NIVELES).includes(datos.nivel)) {
    errores.nivel = 'Selecciona un nivel válido.'
  }
  if (!valoresDe(EQUIPOS).includes(datos.equipo)) {
    errores.equipo = 'Selecciona un equipamiento válido.'
  }

  if (!esEnteroNoNegativo(datos.seriesSugeridas)) {
    errores.seriesSugeridas = 'Introduce un número entero igual o mayor que 0.'
  }
  if (!esEnteroNoNegativo(datos.repeticionesSugeridas)) {
    errores.repeticionesSugeridas = 'Introduce un número entero igual o mayor que 0.'
  }
}

const { formulario, erroresLocales, erroresRemotos, errorDe, limpiarError, validarParaEnviar } =
  useFormulario({
    modeloVacio: MODELO_VACIO,
    valoresIniciales: () => props.valoresIniciales,
    erroresServidor: () => props.erroresServidor,
    referencias: {
      nombre: nombreInput,
      categoria: categoriaInput,
      nivel: nivelInput,
      equipo: equipoInput,
      descripcion: descripcionInput,
      seriesSugeridas: seriesInput,
      repeticionesSugeridas: repeticionesInput,
      estado: estadoInput,
    },
    validar,
  })

async function enviar() {
  if (props.enviando) return
  if (!(await validarParaEnviar())) return

  emit('submit', {
    ...formulario,
    nombre: formulario.nombre.trim(),
    descripcion: formulario.descripcion.trim(),
    seriesSugeridas: Number(formulario.seriesSugeridas),
    repeticionesSugeridas: Number(formulario.repeticionesSugeridas),
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

    <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-ejercicio">
      <header>
        <span aria-hidden="true"><Dumbbell :size="20" /></span>
        <div>
          <h2 id="titulo-ejercicio">Información del ejercicio</h2>
          <p>Cómo se identifica y se clasifica dentro del catálogo.</p>
        </div>
      </header>

      <div class="formulario__rejilla">
        <div class="campo campo--completo">
          <label class="form-label" for="ejercicio-nombre">Nombre del ejercicio *</label>
          <input
            id="ejercicio-nombre"
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
          <label class="form-label" for="ejercicio-categoria">Categoría *</label>
          <select
            id="ejercicio-categoria"
            ref="categoriaInput"
            v-model="formulario.categoria"
            class="form-select"
            :class="{ 'is-invalid': errorDe('categoria') }"
            name="categoria"
            required
            :aria-invalid="Boolean(errorDe('categoria'))"
            :aria-describedby="errorDe('categoria') ? 'error-categoria' : null"
            @change="limpiarError('categoria')"
          >
            <option value="">Selecciona una categoría</option>
            <option v-for="opcion in CATEGORIAS" :key="opcion.valor" :value="opcion.valor">
              {{ opcion.etiqueta }}
            </option>
          </select>
          <p v-if="errorDe('categoria')" id="error-categoria" class="campo__error" role="alert">
            {{ errorDe('categoria') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="ejercicio-nivel">Nivel *</label>
          <select
            id="ejercicio-nivel"
            ref="nivelInput"
            v-model="formulario.nivel"
            class="form-select"
            :class="{ 'is-invalid': errorDe('nivel') }"
            name="nivel"
            required
            :aria-invalid="Boolean(errorDe('nivel'))"
            :aria-describedby="errorDe('nivel') ? 'error-nivel' : null"
            @change="limpiarError('nivel')"
          >
            <option value="">Selecciona un nivel</option>
            <option v-for="opcion in NIVELES" :key="opcion.valor" :value="opcion.valor">
              {{ opcion.etiqueta }}
            </option>
          </select>
          <p v-if="errorDe('nivel')" id="error-nivel" class="campo__error" role="alert">
            {{ errorDe('nivel') }}
          </p>
        </div>

        <div class="campo">
          <label class="form-label" for="ejercicio-equipo">Equipamiento *</label>
          <select
            id="ejercicio-equipo"
            ref="equipoInput"
            v-model="formulario.equipo"
            class="form-select"
            :class="{ 'is-invalid': errorDe('equipo') }"
            name="equipo"
            required
            :aria-invalid="Boolean(errorDe('equipo'))"
            :aria-describedby="errorDe('equipo') ? 'error-equipo' : null"
            @change="limpiarError('equipo')"
          >
            <option value="">Selecciona un equipamiento</option>
            <option v-for="opcion in EQUIPOS" :key="opcion.valor" :value="opcion.valor">
              {{ opcion.etiqueta }}
            </option>
          </select>
          <p v-if="errorDe('equipo')" id="error-equipo" class="campo__error" role="alert">
            {{ errorDe('equipo') }}
          </p>
        </div>

        <div class="campo campo--completo">
          <label class="form-label" for="ejercicio-descripcion">Descripción</label>
          <textarea
            id="ejercicio-descripcion"
            ref="descripcionInput"
            v-model="formulario.descripcion"
            class="form-control"
            :class="{ 'is-invalid': errorDe('descripcion') }"
            name="descripcion"
            rows="3"
            :aria-invalid="Boolean(errorDe('descripcion'))"
            :aria-describedby="errorDe('descripcion') ? 'error-descripcion' : 'ayuda-descripcion'"
            @input="limpiarError('descripcion')"
          ></textarea>
          <p id="ayuda-descripcion" class="campo__ayuda">
            Qué trabaja y cómo se ejecuta. Es lo que verá el entrenador en la ficha.
          </p>
          <p v-if="errorDe('descripcion')" id="error-descripcion" class="campo__error" role="alert">
            {{ errorDe('descripcion') }}
          </p>
        </div>
      </div>
    </section>

    <div class="formulario__secundarias">
      <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-prescripcion">
        <header>
          <span aria-hidden="true"><Activity :size="20" /></span>
          <div>
            <h2 id="titulo-prescripcion">Prescripción sugerida</h2>
            <p>Punto de partida para las rutinas. Cada plan puede ajustarlo.</p>
          </div>
        </header>

        <div class="formulario__rejilla">
          <div class="campo">
            <label class="form-label" for="ejercicio-series">Series sugeridas *</label>
            <input
              id="ejercicio-series"
              ref="seriesInput"
              v-model="formulario.seriesSugeridas"
              class="form-control"
              :class="{ 'is-invalid': errorDe('seriesSugeridas') }"
              type="number"
              name="seriesSugeridas"
              inputmode="numeric"
              min="0"
              step="1"
              required
              :aria-invalid="Boolean(errorDe('seriesSugeridas'))"
              :aria-describedby="errorDe('seriesSugeridas') ? 'error-series' : null"
              @input="limpiarError('seriesSugeridas')"
            />
            <p
              v-if="errorDe('seriesSugeridas')"
              id="error-series"
              class="campo__error"
              role="alert"
            >
              {{ errorDe('seriesSugeridas') }}
            </p>
          </div>

          <div class="campo">
            <label class="form-label" for="ejercicio-repeticiones">Repeticiones sugeridas *</label>
            <input
              id="ejercicio-repeticiones"
              ref="repeticionesInput"
              v-model="formulario.repeticionesSugeridas"
              class="form-control"
              :class="{ 'is-invalid': errorDe('repeticionesSugeridas') }"
              type="number"
              name="repeticionesSugeridas"
              inputmode="numeric"
              min="0"
              step="1"
              required
              :aria-invalid="Boolean(errorDe('repeticionesSugeridas'))"
              :aria-describedby="
                errorDe('repeticionesSugeridas') ? 'error-repeticiones' : 'ayuda-repeticiones'
              "
              @input="limpiarError('repeticionesSugeridas')"
            />
            <p id="ayuda-repeticiones" class="campo__ayuda">
              Cero en los ejercicios que se miden por tiempo o distancia.
            </p>
            <p
              v-if="errorDe('repeticionesSugeridas')"
              id="error-repeticiones"
              class="campo__error"
              role="alert"
            >
              {{ errorDe('repeticionesSugeridas') }}
            </p>
          </div>
        </div>
      </section>

      <section class="formulario__seccion gb-tarjeta" aria-labelledby="titulo-estado">
        <header>
          <span aria-hidden="true"><Power :size="20" /></span>
          <div>
            <h2 id="titulo-estado">Estado del ejercicio</h2>
            <p>Controla si puede asignarse en rutinas nuevas.</p>
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
            <span><b>Activo</b><small>Disponible para las rutinas.</small></span>
          </label>
          <label>
            <input
              v-model="formulario.estado"
              type="radio"
              name="estado"
              value="inactive"
              @change="limpiarError('estado')"
            />
            <span><b>Inactivo</b><small>Se retira del catálogo asignable.</small></span>
          </label>
        </fieldset>
        <p v-if="errorDe('estado')" id="error-estado" class="campo__error" role="alert">
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
        {{ enviando ? 'Guardando…' : modo === 'edit' ? 'Guardar cambios' : 'Guardar ejercicio' }}
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

.formulario__rejilla {
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
  .formulario__rejilla {
    grid-template-columns: 1fr;
  }

  .campo--completo {
    grid-column: auto;
  }
}
</style>
