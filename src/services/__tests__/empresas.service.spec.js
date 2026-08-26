import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const EMPRESA_NUEVA = {
  nombre: 'Nova Fitness',
  gerente: 'Andrea Morales',
  ruc: '20987654321',
  correo: 'contacto@novafitness.test',
  telefono: '+51 987 654 321',
  region: 'Lima',
  direccion: 'Av. Javier Prado 1550, San Isidro',
  sitioWeb: 'https://novafitness.example',
  colorPrimario: '#e50914',
  colorSecundario: '#111111',
  estado: 'active',
}

async function cargarServicioMock() {
  vi.doMock('@/config/env', () => ({ USE_MOCKS: true }))
  vi.doMock('@/services/api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  }))
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  return import('@/services/empresas.service')
}

async function completarPeticion(peticion, latencia = 250) {
  await vi.advanceTimersByTimeAsync(latencia)
  return peticion
}

describe('empresas.service en modo mock', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('lista 24 empresas ficticias con paginación y latencia acotada', async () => {
    const servicio = await cargarServicioMock()
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const temporizador = vi.spyOn(globalThis, 'setTimeout')

    const peticion = servicio.obtenerEmpresas({ pagina: 2, porPagina: 5 })

    expect(temporizador).toHaveBeenCalledWith(expect.any(Function), 600)
    const resultado = await completarPeticion(peticion, 600)
    expect(resultado.items).toHaveLength(5)
    expect(resultado.paginacion).toEqual({
      pagina: 2,
      ultimaPagina: 5,
      porPagina: 5,
      total: 24,
      desde: 6,
      hasta: 10,
    })
    expect(resultado.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        nombre: expect.any(String),
        estado: expect.stringMatching(/^(active|inactive)$/),
        usuarios: expect.any(Number),
      }),
    )
  })

  it('busca por texto, filtra por estado y conserva metadatos coherentes', async () => {
    const servicio = await cargarServicioMock()

    const busqueda = servicio.obtenerEmpresas({ busqueda: 'Power Gym', estado: 'active' })
    const resultado = await completarPeticion(busqueda)
    expect(resultado.items).toHaveLength(1)
    expect(resultado.items[0].nombre).toBe('Power Gym')

    const inactivas = servicio.obtenerEmpresas({ estado: 'inactive', porPagina: 24 })
    const resultadoInactivas = await completarPeticion(inactivas)
    expect(resultadoInactivas.items).not.toHaveLength(0)
    expect(resultadoInactivas.items.every(({ estado }) => estado === 'inactive')).toBe(true)
    expect(resultadoInactivas.paginacion.total).toBe(resultadoInactivas.items.length)
  })

  it('obtiene una empresa mediante una copia segura', async () => {
    const servicio = await cargarServicioMock()

    const primera = await completarPeticion(servicio.obtenerEmpresa(1))
    primera.nombre = 'Alterada desde la vista'
    const segunda = await completarPeticion(servicio.obtenerEmpresa(1))

    expect(segunda.nombre).toBe('Power Gym')
  })

  it('crea una empresa y la hace visible inmediatamente en el listado', async () => {
    const servicio = await cargarServicioMock()

    const creada = await completarPeticion(servicio.crearEmpresa(EMPRESA_NUEVA))
    expect(creada).toEqual(
      expect.objectContaining({
        id: 25,
        nombre: EMPRESA_NUEVA.nombre,
        estado: 'active',
        usuarios: 0,
        fechaRegistro: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )

    const listado = await completarPeticion(servicio.obtenerEmpresas({ busqueda: 'Nova Fitness' }))
    expect(listado.items).toHaveLength(1)
    expect(listado.items[0].id).toBe(creada.id)
  })

  it('actualiza parcialmente una empresa y persiste los cambios', async () => {
    const servicio = await cargarServicioMock()

    const actualizada = await completarPeticion(
      servicio.actualizarEmpresa(2, { gerente: 'Elena Suárez', usuarios: 71 }),
    )
    const recargada = await completarPeticion(servicio.obtenerEmpresa(2))

    expect(actualizada.gerente).toBe('Elena Suárez')
    expect(recargada.gerente).toBe('Elena Suárez')
    expect(recargada.usuarios).toBe(64)
    expect(recargada.nombre).toBe('Iron House')
  })

  it('desactiva una empresa sin eliminarla', async () => {
    const servicio = await cargarServicioMock()

    const desactivada = await completarPeticion(servicio.desactivarEmpresa(1))
    const recargada = await completarPeticion(servicio.obtenerEmpresa(1))

    expect(desactivada.estado).toBe('inactive')
    expect(recargada.estado).toBe('inactive')
  })

  it('rechaza correo y RUC duplicados con errores 422 por campo', async () => {
    const servicio = await cargarServicioMock()
    const existente = await completarPeticion(servicio.obtenerEmpresa(1))
    const peticion = servicio.crearEmpresa({
      ...EMPRESA_NUEVA,
      correo: existente.correo,
      ruc: existente.ruc,
    })
    const rechazo = expect(peticion).rejects.toMatchObject({
      status: 422,
      errors: {
        correo: ['Ya existe una empresa con este correo.'],
        ruc: ['Ya existe una empresa con este RUC.'],
      },
    })

    await vi.advanceTimersByTimeAsync(250)
    await rechazo
  })

  it('responde con 422 ante datos inválidos y con 404 ante ids inexistentes', async () => {
    const servicio = await cargarServicioMock()
    const invalida = servicio.crearEmpresa({})
    const rechazoValidacion = expect(invalida).rejects.toMatchObject({
      status: 422,
      errors: expect.objectContaining({ nombre: expect.any(Array), correo: expect.any(Array) }),
    })
    await vi.advanceTimersByTimeAsync(250)
    await rechazoValidacion

    const inexistente = servicio.obtenerEmpresa(999)
    const rechazoNoEncontrada = expect(inexistente).rejects.toMatchObject({ status: 404 })
    await vi.advanceTimersByTimeAsync(250)
    await rechazoNoEncontrada
  })
})

describe('empresas.service con API Laravel', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normaliza el listado paginado snake_case y los parámetros de consulta', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 7,
            nombre: 'Power Gym',
            gerente: 'Mariana Torres',
            ruc: '20100000001',
            correo: 'contacto@powergym.test',
            telefono: '+51 910000001',
            region: 'Lima',
            direccion: 'Av. Arequipa 1840',
            sitio_web: 'https://powergym.example',
            estado: 'active',
            usuarios_count: 86,
            fecha_registro: '2024-01-15',
            logo_url: '/logos/power.svg',
            color_primario: '#e50914',
            color_secundario: '#111111',
          },
        ],
        current_page: 2,
        last_page: 4,
        per_page: 5,
        total: 16,
        from: 6,
        to: 6,
      },
    })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { get } }))
    const { obtenerEmpresas } = await import('@/services/empresas.service')

    const resultado = await obtenerEmpresas({
      busqueda: 'power',
      estado: 'active',
      pagina: 2,
      porPagina: 5,
    })

    expect(get).toHaveBeenCalledWith('/empresas', {
      params: { search: 'power', status: 'active', page: 2, per_page: 5 },
    })
    expect(resultado.items[0]).toEqual(
      expect.objectContaining({
        sitioWeb: 'https://powergym.example',
        estado: 'active',
        usuarios: 86,
        fechaRegistro: '2024-01-15',
        colorPrimario: '#e50914',
      }),
    )
    expect(resultado.paginacion).toEqual({
      pagina: 2,
      ultimaPagina: 4,
      porPagina: 5,
      total: 16,
      desde: 6,
      hasta: 6,
    })
  })

  it('usa los endpoints provisionales y serializa payloads camelCase a snake_case', async () => {
    const empresaApi = {
      id: 30,
      ...EMPRESA_NUEVA,
      sitio_web: EMPRESA_NUEVA.sitioWeb,
      logo_url: '/logos/nova.svg',
      color_primario: EMPRESA_NUEVA.colorPrimario,
      color_secundario: EMPRESA_NUEVA.colorSecundario,
      estado: 'active',
      usuarios_count: 0,
      fecha_registro: '2025-02-01',
    }
    const get = vi.fn().mockResolvedValue({ data: { data: empresaApi } })
    const post = vi.fn().mockResolvedValue({ data: { data: empresaApi } })
    const put = vi
      .fn()
      .mockResolvedValue({ data: { data: { ...empresaApi, gerente: 'Nueva Gerente' } } })
    const eliminar = vi.fn().mockResolvedValue({ data: null })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { get, post, put, delete: eliminar } }))
    const servicio = await import('@/services/empresas.service')

    await servicio.obtenerEmpresa(30)
    await servicio.crearEmpresa(EMPRESA_NUEVA)
    await servicio.actualizarEmpresa(30, {
      gerente: 'Nueva Gerente',
      sitioWeb: 'https://nova.example',
      estado: 'inactive',
      usuarios: 999,
      fechaRegistro: '2020-01-01',
    })
    const desactivada = await servicio.desactivarEmpresa(30)

    expect(get).toHaveBeenCalledWith('/empresas/30')
    expect(post).toHaveBeenCalledWith(
      '/empresas',
      expect.objectContaining({
        sitio_web: EMPRESA_NUEVA.sitioWeb,
        color_primario: EMPRESA_NUEVA.colorPrimario,
      }),
    )
    expect(put).toHaveBeenCalledWith('/empresas/30', {
      gerente: 'Nueva Gerente',
      sitio_web: 'https://nova.example',
      estado: 'inactive',
    })
    expect(eliminar).toHaveBeenCalledWith('/empresas/30')
    expect(desactivada).toEqual(expect.objectContaining({ id: 30, estado: 'inactive' }))
  })

  it('traduce a camelCase los campos de un error 422 de Laravel', async () => {
    const post = vi.fn().mockRejectedValue({
      status: 422,
      message: 'Los datos no son válidos.',
      errors: {
        manager_name: ['El gerente es obligatorio.'],
        email: ['El correo ya existe.'],
        sitio_web: ['La URL no es válida.'],
        color_primario: ['El color no es válido.'],
      },
    })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { post } }))
    const { crearEmpresa } = await import('@/services/empresas.service')

    await expect(crearEmpresa(EMPRESA_NUEVA)).rejects.toMatchObject({
      name: 'HttpError',
      status: 422,
      errors: {
        gerente: ['El gerente es obligatorio.'],
        correo: ['El correo ya existe.'],
        sitioWeb: ['La URL no es válida.'],
        colorPrimario: ['El color no es válido.'],
      },
    })
  })
})
