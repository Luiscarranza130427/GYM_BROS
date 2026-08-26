import { nextTick, reactive, ref, watch } from 'vue'

/**
 * Formulario administrativo con errores locales y del servidor.
 *
 * `EmpresaForm` y `UsuarioForm` tenían idéntica la mitad no visual: cargar los
 * valores iniciales, recibir los 422 del backend, resolver qué error mostrar en
 * cada campo, limpiarlo al escribir, validar antes de enviar y llevar el foco al
 * primer campo con problema. Unas 90 líneas por formulario, copiadas.
 *
 * Aquí vive eso. Lo que cambia en cada formulario —qué campos hay, qué reglas se
 * aplican y qué se envía— entra por parámetro.
 *
 * PRECEDENCIA DE ERRORES: gana el local sobre el remoto. Si el usuario acaba de
 * escribir algo inválido, ver su propio error es más útil que ver el 422 de la
 * petición anterior.
 */

/**
 * @param {object} opciones
 * @param {object} opciones.modeloVacio    Campos del formulario y sus valores por defecto.
 * @param {() => object} opciones.valoresIniciales  Getter de la prop homónima.
 * @param {() => object} opciones.erroresServidor   Getter de la prop homónima.
 * @param {Record<string, import('vue').Ref>} [opciones.referencias]
 *   Campo -> ref de plantilla, para enfocar el primer error.
 * @param {(formulario: object, errores: object) => void} opciones.validar
 *   Escribe en `errores` un mensaje por cada campo inválido.
 * @param {(formulario: object, valores: object) => void} [opciones.alCargarValores]
 *   Ajustes propios tras cargar (por ejemplo, derivar un id de un objeto anidado
 *   o reiniciar la vista previa de un archivo).
 */
export function useFormulario({
  modeloVacio,
  valoresIniciales,
  erroresServidor,
  referencias = {},
  validar,
  alCargarValores,
}) {
  const formulario = reactive({ ...modeloVacio })
  const erroresLocales = reactive({})
  const erroresRemotos = ref({})

  function olvidarErroresLocales() {
    Object.keys(erroresLocales).forEach((campo) => delete erroresLocales[campo])
  }

  function cargarValores(valores = {}) {
    Object.keys(modeloVacio).forEach((campo) => {
      formulario[campo] = valores[campo] ?? modeloVacio[campo]
    })
    olvidarErroresLocales()
    erroresRemotos.value = {}
    alCargarValores?.(formulario, valores)
  }

  watch(valoresIniciales, cargarValores, { immediate: true, deep: true })
  watch(
    erroresServidor,
    (errores) => {
      erroresRemotos.value = { ...errores }
    },
    { immediate: true, deep: true },
  )

  /** Laravel manda un array de mensajes por campo; se muestra el primero. */
  function primerMensaje(valor) {
    return Array.isArray(valor) ? valor[0] : valor
  }

  function errorDe(campo) {
    return erroresLocales[campo] || primerMensaje(erroresRemotos.value[campo]) || ''
  }

  /** Al escribir en un campo se retira su error, venga de donde venga. */
  function limpiarError(campo) {
    delete erroresLocales[campo]
    if (!erroresRemotos.value[campo]) return
    const copia = { ...erroresRemotos.value }
    delete copia[campo]
    erroresRemotos.value = copia
  }

  async function enfocarPrimerError() {
    await nextTick()
    referencias[Object.keys(erroresLocales)[0]]?.value?.focus()
  }

  /**
   * Valida y, si todo está bien, devuelve `true` para que la vista emita.
   * Si no, deja los errores puestos y lleva el foco al primero.
   */
  async function validarParaEnviar() {
    olvidarErroresLocales()
    validar(formulario, erroresLocales)

    if (Object.keys(erroresLocales).length > 0) {
      await enfocarPrimerError()
      return false
    }
    return true
  }

  return {
    formulario,
    erroresLocales,
    erroresRemotos,
    errorDe,
    limpiarError,
    validarParaEnviar,
  }
}
