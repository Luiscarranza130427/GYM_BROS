import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ALIMENTO_NUEVO = {
  nombre: 'Kiwicha cocida',
  tipo: 'cereal',
  calorias: 120,
  proteinas: 4,
  carbohidratos: 22,
  grasas: 1.8,
  fibra: 2.5,
}

async function cargarServicioMock() {
  vi.doMock('@/config/env', () => ({ USE_MOCKS: true }))
  vi.doMock('@/services/api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  }))
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const servicio = await import('@/services/alimentacion.service')
  await import('@/mocks/alimentacion.mock')
  return servicio
}

async function completarPeticion(peticion, latencia = 250) {
  await vi.advanceTimersByTimeAsync(0)
  await vi.advanceTimersByTimeAsync(latencia)
  return peticion
}

async function esperarRechazo(peticion, forma) {
  const rechazo = expect(peticion).rejects.toMatchObject(forma)
  await vi.advanceTimersByTimeAsync(0)
  await vi.advanceTimersByTimeAsync(250)
  await rechazo
}

/** Devuelve el error de una petición que se espera que falle, ya inspeccionable. */
async function capturarFallo(peticion, latencia = 250) {
  const capturado = peticion.catch((error) => error)
  await vi.advanceTimersByTimeAsync(0)
  await vi.advanceTimersByTimeAsync(latencia)
  return capturado
}

const sumar = (lista, campo) =>
  Math.round(lista.reduce((total, item) => total + item.macros[campo], 0))

describe('alimentacion.service en modo mock', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('entrega el catálogo paginado con la forma que promete', async () => {
    const servicio = await cargarServicioMock()

    const { items, paginacion } = await completarPeticion(servicio.obtenerAlimentos())

    expect(items.length).toBeGreaterThan(0)
    expect(paginacion.total).toBeGreaterThan(items.length)
    expect(items[0]).toMatchObject({
      id: expect.any(Number),
      nombre: expect.any(String),
      tipo: expect.any(String),
      calorias: expect.any(Number),
      unidadBase: expect.any(String),
    })
  })

  /*
   * `usos` viaja también en el listado.
   *
   * El servicio lo promete en la forma del alimento. Entregarlo sólo en la ficha
   * dejaría a las tarjetas pintando un cero para todo el catálogo: no fallaría
   * nada, simplemente mentiría. Es la clase de fallo que necesita prueba.
   */
  it('el listado trae `usos`, no sólo la ficha', async () => {
    const servicio = await cargarServicioMock()

    const { items } = await completarPeticion(servicio.obtenerAlimentos({ porPagina: 50 }))

    expect(items.every((alimento) => typeof alimento.usos === 'number')).toBe(true)
    expect(items.some((alimento) => alimento.usos > 0)).toBe(true)

    // Y coincide con lo que dice la ficha del mismo alimento.
    const enUso = items.find((alimento) => alimento.usos > 0)
    const ficha = await completarPeticion(servicio.obtenerAlimento(enUso.id))
    expect(ficha.usos).toBe(enUso.usos)
  })

  it('busca sin distinguir tildes ni mayúsculas', async () => {
    const servicio = await cargarServicioMock()

    // 'platano' sin tilde tiene que encontrar 'Plátano'. Sin normalizar, el
    // buscador sería inútil para media base de datos en español.
    const { items } = await completarPeticion(servicio.obtenerAlimentos({ busqueda: 'platano' }))

    expect(items.map((a) => a.nombre)).toContain('Plátano')
  })

  it('filtra por tipo de alimento', async () => {
    const servicio = await cargarServicioMock()

    const { items } = await completarPeticion(
      servicio.obtenerAlimentos({ tipo: 'legumbre', porPagina: 50 }),
    )

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((a) => a.tipo === 'legumbre')).toBe(true)
  })

  /*
   * Los macros del catálogo son por 100 g. Si la cantidad no los escalara, 30 g
   * de aceite de oliva sumarían sus 884 kcal enteras y todos los totales de la
   * ficha serían falsos sin que nada se rompiera: un fallo silencioso.
   */
  it('escala los macros de una porción por su cantidad', async () => {
    const servicio = await cargarServicioMock()

    const plan = await completarPeticion(servicio.obtenerPlan(1))
    const porciones = plan.comidas.flatMap((comida) => comida.alimentos)
    const catalogo = await completarPeticion(servicio.obtenerAlimentosParaElegir(), 150)

    porciones.forEach((porcion) => {
      const base = catalogo.find((a) => a.id === porcion.alimento.id)
      const esperado = Math.round((base.calorias * porcion.cantidad) / 100)
      expect(porcion.macros.calorias).toBe(esperado)
    })
  })

  it('los macros de cada comida son la suma de sus alimentos', async () => {
    const servicio = await cargarServicioMock()

    const plan = await completarPeticion(servicio.obtenerPlan(2))

    expect(plan.comidas.length).toBeGreaterThan(0)
    plan.comidas.forEach((comida) => {
      expect(comida.macros.calorias).toBe(sumar(comida.alimentos, 'calorias'))
    })
  })

  /*
   * Ordenar por HORA, no por el campo `orden`.
   *
   * En los datos de partida ambos criterios coinciden, así que comprobarlo
   * sobre un plan intacto no demuestra nada: la prueba pasaría igual con el
   * criterio equivocado. Por eso se añade una comida madrugadora, que entra la
   * ÚLTIMA en `orden`, y se exige que salga la PRIMERA.
   */
  it('ordena las comidas por hora, no por el orden en que se añadieron', async () => {
    const servicio = await cargarServicioMock()

    const antes = await completarPeticion(servicio.obtenerPlan(3))
    expect(antes.comidas[0].horaSugerida > '05:00').toBe(true)

    await completarPeticion(
      servicio.crearComida(3, {
        tipoComida: 'desayuno',
        horaSugerida: '05:00',
        alimentos: [{ alimentoId: 10, cantidad: 40, unidad: 'gramos' }],
      }),
    )

    const despues = await completarPeticion(servicio.obtenerPlan(3))
    const horas = despues.comidas.map((comida) => comida.horaSugerida)

    expect(horas[0]).toBe('05:00')
    expect(horas).toEqual([...horas].sort())
    // Y es la que más tarde se añadió: su `orden` es el mayor de todas.
    expect(despues.comidas[0].orden).toBe(Math.max(...despues.comidas.map((c) => c.orden)))
  })

  it('separa los planes vigentes de los finalizados', async () => {
    const servicio = await cargarServicioMock()

    const activos = await completarPeticion(
      servicio.obtenerPlanes({ situacion: 'activo', porPagina: 50 }),
    )
    expect(activos.items.every((plan) => plan.activo)).toBe(true)

    const finalizados = await completarPeticion(
      servicio.obtenerPlanes({ situacion: 'inactivo', porPagina: 50 }),
    )
    expect(finalizados.items.every((plan) => !plan.activo)).toBe(true)
    expect(finalizados.items.length).toBeGreaterThan(0)
  })

  /*
   * El mock TIENE que hablar el contrato.
   *
   * En modo mock nadie normaliza: el mock es la respuesta. Emitir los objetivos
   * como cuatro campos sueltos en vez de anidados rompía la tabla de planes con
   * un «Cannot read properties of undefined», y sólo con datos simulados —es
   * decir, sólo en desarrollo, que es donde nadie lo probaría a fondo—.
   */
  it('el mock entrega la forma que el servicio garantiza', async () => {
    const servicio = await cargarServicioMock()

    const { items } = await completarPeticion(servicio.obtenerPlanes())

    expect(items[0]).toMatchObject({
      id: expect.any(Number),
      usuario: { id: expect.any(Number), nombre: expect.any(String) },
      empresa: { id: expect.any(Number), nombre: expect.any(String) },
      objetivo: expect.any(String),
      fechaInicio: expect.any(String),
      activo: expect.any(Boolean),
      objetivos: {
        calorias: expect.any(Number),
        proteinas: expect.any(Number),
        carbohidratos: expect.any(Number),
        grasas: expect.any(Number),
      },
      macros: {
        calorias: expect.any(Number),
        proteinas: expect.any(Number),
        carbohidratos: expect.any(Number),
        grasas: expect.any(Number),
        fibra: expect.any(Number),
      },
    })

    // Y los cuatro campos planos NO deben aparecer: si el backend real los
    // mandara así, el normalizador los anida; el mock no puede saltárselo.
    expect(items[0].caloriasObjetivo).toBeUndefined()

    // La ficha promete lo mismo MÁS las comidas, y `totalComidas` en ambas:
    // sin él el resumen mostraba un 0 con las comidas listadas justo debajo.
    const ficha = await completarPeticion(servicio.obtenerPlan(items[0].id))
    expect(ficha.objetivos.calorias).toBe(items[0].objetivos.calorias)
    expect(ficha.totalComidas).toBe(ficha.comidas.length)
    expect(ficha.totalComidas).toBeGreaterThan(0)
  })

  it('el listado de planes no arrastra las comidas, que sólo usa la ficha', async () => {
    const servicio = await cargarServicioMock()

    const { items } = await completarPeticion(servicio.obtenerPlanes())

    expect(items[0].comidas).toBeUndefined()
    expect(items[0].totalComidas).toBeGreaterThan(0)
  })

  it('crea un alimento y lo deja disponible en el catálogo', async () => {
    const servicio = await cargarServicioMock()

    const creado = await completarPeticion(servicio.crearAlimento(ALIMENTO_NUEVO))
    expect(creado).toMatchObject({ nombre: 'Kiwicha cocida', tipo: 'cereal' })

    const { items } = await completarPeticion(servicio.obtenerAlimentos({ busqueda: 'kiwicha' }))
    expect(items).toHaveLength(1)
  })

  it('rechaza un nombre repetido y un macro negativo', async () => {
    const servicio = await cargarServicioMock()

    await esperarRechazo(servicio.crearAlimento({ ...ALIMENTO_NUEVO, nombre: 'Palta' }), {
      status: 422,
      errors: expect.objectContaining({ nombre: expect.any(Array) }),
    })

    await esperarRechazo(servicio.crearAlimento({ ...ALIMENTO_NUEVO, proteinas: -5 }), {
      status: 422,
      errors: expect.objectContaining({ proteinas: expect.any(Array) }),
    })
  })

  /*
   * La distinción que separa un error de formulario de una regla de negocio: el
   * 422 llega SIN `errors`, así que no hay ningún campo que marcar. La vista
   * tiene que mostrar el mensaje y quedarse donde está.
   */
  it('impide retirar un alimento que ya se usa en alguna comida', async () => {
    const servicio = await cargarServicioMock()

    // 'Avena' es el índice 9 del catálogo y entra en la primera plantilla de
    // desayuno, así que hay comidas que dependen de él.
    const avena = await completarPeticion(servicio.obtenerAlimento(10))
    expect(avena.nombre).toBe('Avena')
    expect(avena.usos).toBeGreaterThan(0)

    const error = await capturarFallo(servicio.eliminarAlimento(10))

    expect(error.status).toBe(422)
    expect(error.message).toContain('no puede retirarse')
    // Y SIN `errors`: no hay ningún campo al que apuntar. `HttpError` lo deja
    // en `null`, no en `undefined`, así que una vista que compruebe
    // `error.errors !== undefined` se creería que hay errores de formulario.
    expect(error.errors).toBeNull()
  })

  it('sí retira un alimento que no usa nadie', async () => {
    const servicio = await cargarServicioMock()

    const creado = await completarPeticion(servicio.crearAlimento(ALIMENTO_NUEVO))
    const retirado = await completarPeticion(servicio.eliminarAlimento(creado.id))

    expect(retirado.id).toBe(creado.id)

    const { items } = await completarPeticion(servicio.obtenerAlimentos({ busqueda: 'kiwicha' }))
    expect(items).toHaveLength(0)
  })

  it('añadir una comida recalcula los totales del plan', async () => {
    const servicio = await cargarServicioMock()

    const antes = await completarPeticion(servicio.obtenerPlan(4))

    await completarPeticion(
      servicio.crearComida(4, {
        tipoComida: 'snack',
        horaSugerida: '22:30',
        alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'gramos' }],
      }),
    )

    const despues = await completarPeticion(servicio.obtenerPlan(4))

    expect(despues.comidas).toHaveLength(antes.comidas.length + 1)
    // 100 g de pechuga de pollo son 165 kcal: el total del plan tiene que
    // moverse, o la ficha mostraría una cifra que ya no corresponde.
    expect(despues.macros.calorias).toBe(antes.macros.calorias + 165)
  })

  it('rechaza una comida sin alimentos o con hora mal escrita', async () => {
    const servicio = await cargarServicioMock()

    await esperarRechazo(
      servicio.crearComida(1, { tipoComida: 'cena', horaSugerida: '20:00', alimentos: [] }),
      { status: 422, errors: expect.objectContaining({ alimentos: expect.any(Array) }) },
    )

    await esperarRechazo(
      servicio.crearComida(1, {
        tipoComida: 'cena',
        horaSugerida: '8pm',
        alimentos: [{ alimentoId: 1, cantidad: 100 }],
      }),
      { status: 422, errors: expect.objectContaining({ horaSugerida: expect.any(Array) }) },
    )
  })

  it('no deja al plan sin ninguna comida', async () => {
    const servicio = await cargarServicioMock()

    const plan = await completarPeticion(servicio.obtenerPlan(1))

    // Se retiran todas menos una; ésas sí salen.
    for (const comida of plan.comidas.slice(1)) {
      await completarPeticion(servicio.eliminarComida(1, comida.id))
    }

    // La última no: un plan vacío daría una ficha que no dice nada.
    await esperarRechazo(servicio.eliminarComida(1, plan.comidas[0].id), {
      status: 422,
      message: expect.stringContaining('al menos una comida'),
    })
  })
})

describe('alimentacion.service con API Laravel', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('traduce la situación del plan al booleano que espera el backend', async () => {
    const get = vi.fn().mockResolvedValue({ data: { data: [], total: 0 } })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { get } }))
    const { obtenerPlanes } = await import('@/services/alimentacion.service')

    await obtenerPlanes({ situacion: 'activo', empresaId: 2 })
    expect(get).toHaveBeenCalledWith('/planes-alimentacion', {
      params: expect.objectContaining({ activo: true, id_empresas: 2 }),
    })

    // Sin filtro no se manda el parámetro: mandar `false` traería sólo los
    // finalizados cuando se pidieron todos.
    await obtenerPlanes({})
    expect(get.mock.calls[1][1].params.activo).toBeUndefined()
  })

  it('normaliza un alimento en snake_case', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 3,
            name: 'Rolled oats',
            type: 'cereal',
            calories: 389,
            protein: 17,
            carbohydrates: 66,
            fat: 7,
            fiber: 11,
            unidad_base: 'gramos',
            usos_count: 4,
          },
        ],
        current_page: 1,
        last_page: 3,
        per_page: 12,
        total: 30,
        from: 1,
        to: 12,
      },
    })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { get } }))
    const { obtenerAlimentos } = await import('@/services/alimentacion.service')

    const { items, paginacion } = await obtenerAlimentos()

    expect(items[0]).toEqual({
      id: 3,
      nombre: 'Rolled oats',
      tipo: 'cereal',
      calorias: 389,
      proteinas: 17,
      carbohidratos: 66,
      grasas: 7,
      fibra: 11,
      unidadBase: 'gramos',
      usos: 4,
    })
    expect(paginacion).toMatchObject({ pagina: 1, ultimaPagina: 3, total: 30 })
  })

  it('normaliza un plan con sus comidas anidadas', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 9,
          user: { id: 2, name: 'Andrea Mendoza' },
          company: { id: 1, name: 'Power Gym' },
          goal: 'Ganar masa muscular',
          start_date: '2026-07-01',
          end_date: '2026-10-01',
          active: true,
          calorias_objetivo: 2400,
          meals: [
            {
              id: 4,
              meal_type: 'desayuno',
              suggested_time: '07:00',
              order: 1,
              foods: [
                {
                  id: 11,
                  food: { id: 10, name: 'Avena', type: 'cereal' },
                  quantity: 60,
                  unit: 'gramos',
                  macros: { calories: 233, protein: 10.2 },
                },
              ],
            },
          ],
        },
      },
    })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { get } }))
    const { obtenerPlan } = await import('@/services/alimentacion.service')

    const plan = await obtenerPlan(9)

    expect(plan).toMatchObject({
      id: 9,
      usuario: { id: 2, nombre: 'Andrea Mendoza' },
      empresa: { id: 1, nombre: 'Power Gym' },
      objetivo: 'Ganar masa muscular',
      fechaInicio: '2026-07-01',
      activo: true,
      totalComidas: 1,
    })
    expect(plan.objetivos.calorias).toBe(2400)
    expect(plan.comidas[0]).toMatchObject({ tipoComida: 'desayuno', horaSugerida: '07:00' })
    expect(plan.comidas[0].alimentos[0]).toMatchObject({
      alimento: { id: 10, nombre: 'Avena', tipo: 'cereal' },
      cantidad: 60,
      unidad: 'gramos',
    })
    expect(plan.comidas[0].alimentos[0].macros.calorias).toBe(233)
  })

  it('traduce los campos de un 422 al vocabulario del formulario', async () => {
    // `api.js` convierte todo fallo en HttpError antes de que el servicio lo
    // vea, así que el normalizador nunca recibe la forma cruda de axios.
    const { HttpError } = await import('@/services/http-error')
    const post = vi.fn().mockRejectedValue(
      new HttpError({
        status: 422,
        message: 'The given data was invalid.',
        errors: { name: ['Obligatorio.'], fat: ['No válido.'] },
      }),
    )
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { post } }))
    const { crearAlimento } = await import('@/services/alimentacion.service')

    // Sin la traducción, el error de `fat` no encontraría su input y el usuario
    // vería un formulario aparentemente correcto que el servidor rechaza.
    await expect(crearAlimento(ALIMENTO_NUEVO)).rejects.toMatchObject({
      status: 422,
      errors: { nombre: ['Obligatorio.'], grasas: ['No válido.'] },
    })
  })

  it('traduce los campos de un 422 de comida', async () => {
    const { HttpError } = await import('@/services/http-error')
    const post = vi.fn().mockRejectedValue(
      new HttpError({
        status: 422,
        message: 'Revisa los datos.',
        errors: { hora_sugerida: ['Formato inválido.'], foods: ['Añade alimentos.'] },
      }),
    )
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { post } }))
    const { crearComida } = await import('@/services/alimentacion.service')

    await expect(
      crearComida(1, { tipoComida: 'cena', horaSugerida: 'x', alimentos: [] }),
    ).rejects.toMatchObject({
      status: 422,
      errors: { horaSugerida: ['Formato inválido.'], alimentos: ['Añade alimentos.'] },
    })
  })

  it('manda el payload de una comida con los nombres del esquema', async () => {
    const post = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { post } }))
    const { crearComida } = await import('@/services/alimentacion.service')

    await crearComida(7, {
      tipoComida: 'almuerzo',
      horaSugerida: '13:00',
      alimentos: [{ alimentoId: 5, cantidad: 200, unidad: 'gramos' }],
    })

    expect(post).toHaveBeenCalledWith('/planes-alimentacion/7/comidas', {
      tipo_comida: 'almuerzo',
      hora_sugerida: '13:00',
      alimentos: [{ id_alimentos: 5, cantidad: 200, unidad: 'gramos' }],
    })
  })

  it('no manda al backend campos que no son editables', async () => {
    const post = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { post } }))
    const { crearAlimento } = await import('@/services/alimentacion.service')

    // `usos` lo calcula el servidor: mandarlo desde el formulario invitaría a
    // que alguien creyera poder cambiarlo aquí.
    await crearAlimento({ ...ALIMENTO_NUEVO, usos: 99, id: 4 })

    const enviado = post.mock.calls[0][1]
    expect(enviado).not.toHaveProperty('usos')
    expect(enviado).not.toHaveProperty('id')
    expect(enviado.nombre).toBe('Kiwicha cocida')
  })
})
