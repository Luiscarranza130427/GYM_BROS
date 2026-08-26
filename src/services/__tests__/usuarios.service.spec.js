import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const USUARIO_NUEVO = {
  nombre: 'Rosa',
  apellido: 'Quispe',
  correo: 'rosa.quispe@gymbros.test',
  tipoDocumento: 'dni',
  numeroDocumento: '79999999',
  telefono: '+51 987 654 321',
  direccion: 'Av. Javier Prado 1550, San Isidro',
  fotoPerfil: '',
  fechaNacimiento: '1996-05-12',
  rol: 'member',
  estado: 'active',
  empresaId: 1,
}

async function cargarServicioMock() {
  vi.doMock('@/config/env', () => ({ USE_MOCKS: true }))
  vi.doMock('@/services/api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  }))
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  return import('@/services/usuarios.service')
}

async function completarPeticion(peticion, latencia = 250) {
  await vi.advanceTimersByTimeAsync(latencia)
  return peticion
}

describe('usuarios.service en modo mock', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('lista usuarios con paginación real y latencia acotada', async () => {
    const servicio = await cargarServicioMock()
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const temporizador = vi.spyOn(globalThis, 'setTimeout')

    const peticion = servicio.obtenerUsuarios({ pagina: 2, porPagina: 7 })

    expect(temporizador).toHaveBeenCalledWith(expect.any(Function), 600)
    const resultado = await completarPeticion(peticion, 600)
    expect(resultado.items).toHaveLength(7)
    expect(resultado.paginacion).toEqual({
      pagina: 2,
      ultimaPagina: 5,
      porPagina: 7,
      total: 30,
      desde: 8,
      hasta: 14,
    })
    expect(resultado.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        nombre: expect.any(String),
        empresa: { id: expect.any(Number), nombre: expect.any(String) },
        suscripcion: expect.objectContaining({ estado: expect.any(String) }),
        actividad: expect.objectContaining({ rutinas: expect.any(Number) }),
      }),
    )
  })

  it('combina búsqueda y filtros de empresa, estado, rol y suscripción', async () => {
    const servicio = await cargarServicioMock()
    const peticion = servicio.obtenerUsuarios({
      busqueda: 'Carlos Ramírez',
      empresaId: 1,
      estado: 'inactive',
      rol: 'admin',
      suscripcion: 'active',
    })
    const resultado = await completarPeticion(peticion)

    expect(resultado.items).toHaveLength(1)
    expect(resultado.items[0]).toEqual(
      expect.objectContaining({ nombre: 'Carlos', apellido: 'Ramírez', estado: 'inactive' }),
    )

    const porDocumento = servicio.obtenerUsuarios({ busqueda: '71000002' })
    expect((await completarPeticion(porDocumento)).items[0].nombre).toBe('Andrea')
  })

  it('obtiene un usuario mediante copia segura y devuelve opciones desde Empresas', async () => {
    const servicio = await cargarServicioMock()

    const primera = await completarPeticion(servicio.obtenerUsuario(1))
    primera.empresa.nombre = 'Alterada desde la vista'
    const segunda = await completarPeticion(servicio.obtenerUsuario(1))
    expect(segunda.empresa.nombre).toBe('Power Gym')

    const opciones = await completarPeticion(servicio.obtenerOpcionesEmpresas())
    expect(opciones).toHaveLength(24)
    expect(opciones[0]).toEqual(
      expect.objectContaining({ id: 1, nombre: 'Power Gym', estado: 'active' }),
    )
  })

  it('crea un usuario, lo lista y registra su historial', async () => {
    const servicio = await cargarServicioMock()

    const creado = await completarPeticion(servicio.crearUsuario(USUARIO_NUEVO))
    expect(creado).toEqual(
      expect.objectContaining({
        id: 31,
        nombre: 'Rosa',
        estado: 'active',
        empresa: { id: 1, nombre: 'Power Gym' },
        fechaRegistro: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        suscripcion: expect.objectContaining({ estado: 'none' }),
        actividad: { rutinas: 0, asistenciasMes: 0, ultimaActividad: '' },
      }),
    )

    const listado = await completarPeticion(
      servicio.obtenerUsuarios({ busqueda: 'rosa.quispe@gymbros.test' }),
    )
    expect(listado.items).toHaveLength(1)
    expect(listado.items[0].id).toBe(creado.id)

    const historial = await completarPeticion(servicio.obtenerHistorialUsuario(creado.id))
    expect(historial[0]).toEqual(
      expect.objectContaining({ accion: 'created', autor: 'Administrador Demo' }),
    )
  })

  it('actualiza solo campos editables, desactiva y conserva ambos cambios en historial', async () => {
    const servicio = await cargarServicioMock()

    const actualizado = await completarPeticion(
      servicio.actualizarUsuario(2, {
        telefono: '+51 999 000 111',
        empresaId: 3,
        fechaRegistro: '2000-01-01',
        actividad: { rutinas: 999 },
      }),
    )
    expect(actualizado.telefono).toBe('+51 999 000 111')
    expect(actualizado.empresa).toEqual({ id: 3, nombre: 'Titan Fitness' })
    expect(actualizado.fechaRegistro).not.toBe('2000-01-01')
    expect(actualizado.actividad.rutinas).not.toBe(999)

    const desactivado = await completarPeticion(servicio.desactivarUsuario(2))
    expect(desactivado.estado).toBe('inactive')

    const historial = await completarPeticion(servicio.obtenerHistorialUsuario(2))
    expect(historial.map(({ accion }) => accion).slice(0, 2)).toEqual(['deactivated', 'updated'])
  })

  it('normaliza validaciones duplicadas e inválidas como errores 422 por campo', async () => {
    const servicio = await cargarServicioMock()
    const existente = await completarPeticion(servicio.obtenerUsuario(1))
    const duplicado = servicio.crearUsuario({
      ...USUARIO_NUEVO,
      correo: existente.correo,
      numeroDocumento: existente.numeroDocumento,
    })
    const rechazoDuplicado = expect(duplicado).rejects.toMatchObject({
      status: 422,
      errors: {
        correo: ['El correo ya se encuentra registrado.'],
        numeroDocumento: ['El documento ya se encuentra registrado.'],
      },
    })
    await vi.advanceTimersByTimeAsync(250)
    await rechazoDuplicado

    const invalido = servicio.crearUsuario({})
    const rechazoInvalido = expect(invalido).rejects.toMatchObject({
      status: 422,
      errors: expect.objectContaining({
        nombre: expect.any(Array),
        correo: expect.any(Array),
        empresaId: expect.any(Array),
      }),
    })
    await vi.advanceTimersByTimeAsync(250)
    await rechazoInvalido
  })

  it('entrega 404 para ids inexistentes y permite simular un 500 de una sola operación', async () => {
    const servicio = await cargarServicioMock()
    const inexistente = servicio.obtenerUsuario(999)
    const rechazoNoEncontrado = expect(inexistente).rejects.toMatchObject({ status: 404 })
    await vi.advanceTimersByTimeAsync(250)
    await rechazoNoEncontrado

    servicio.simularSiguienteErrorUsuarios(500)
    const fallida = servicio.obtenerUsuarios()
    const rechazoServidor = expect(fallida).rejects.toMatchObject({
      status: 500,
      message: 'No pudimos procesar la solicitud de usuarios.',
    })
    await vi.advanceTimersByTimeAsync(250)
    await rechazoServidor

    const recuperada = servicio.obtenerUsuarios({ porPagina: 1 })
    expect((await completarPeticion(recuperada)).items).toHaveLength(1)
  })
})

describe('usuarios.service con API Laravel', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normaliza listado paginado snake_case y serializa filtros combinables', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 7,
            nombre: 'Carlos',
            apellido: 'Ramírez',
            correo: 'carlos@gymbros.test',
            tipo_documento: 'dni',
            numero_documento: '71000007',
            telefono: '+51 910000007',
            direccion: 'Av. Principal 107',
            foto_perfil: '/avatars/carlos.webp',
            fecha_nacimiento: '1995-03-18',
            fecha_registro: '2026-01-15',
            tipo_usuario: 'member',
            estado: 'activo',
            empresa: { id: 1, nombre: 'Power Gym' },
            suscripcion: {
              estado: 'active',
              fecha_inicio: '2026-08-01',
              fecha_vencimiento: '2026-09-01',
              dias_restantes: 6,
              nombre_plan: 'Mensual',
            },
            actividad: {
              rutinas_count: 4,
              asistencias_mes: 12,
              ultima_actividad: '2026-08-25T18:30:00Z',
            },
          },
        ],
        meta: {
          current_page: 2,
          last_page: 4,
          per_page: 5,
          total: 16,
          from: 6,
          to: 6,
        },
      },
    })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { get } }))
    const { obtenerUsuarios } = await import('@/services/usuarios.service')

    const resultado = await obtenerUsuarios({
      busqueda: 'carlos',
      empresaId: 1,
      estado: 'active',
      rol: 'member',
      suscripcion: 'active',
      pagina: 2,
      porPagina: 5,
    })

    expect(get).toHaveBeenCalledWith('/usuarios', {
      params: {
        search: 'carlos',
        id_empresas: 1,
        estado: 'active',
        tipo_usuario: 'member',
        estado_suscripcion: 'active',
        page: 2,
        per_page: 5,
      },
    })
    expect(resultado.items[0]).toEqual(
      expect.objectContaining({
        tipoDocumento: 'dni',
        numeroDocumento: '71000007',
        fotoPerfil: '/avatars/carlos.webp',
        estado: 'active',
        empresa: { id: 1, nombre: 'Power Gym' },
        suscripcion: expect.objectContaining({ nombrePlan: 'Mensual', diasRestantes: 6 }),
        actividad: { rutinas: 4, asistenciasMes: 12, ultimaActividad: '2026-08-25T18:30:00Z' },
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

  it('usa endpoints provisionales y serializa el payload español a snake_case', async () => {
    const respuestaApi = {
      id: 31,
      nombre: USUARIO_NUEVO.nombre,
      apellido: USUARIO_NUEVO.apellido,
      correo: USUARIO_NUEVO.correo,
      tipo_documento: USUARIO_NUEVO.tipoDocumento,
      numero_documento: USUARIO_NUEVO.numeroDocumento,
      telefono: USUARIO_NUEVO.telefono,
      tipo_usuario: USUARIO_NUEVO.rol,
      estado: 'active',
      id_empresas: 1,
      empresa: { id: 1, nombre: 'Power Gym' },
    }
    const get = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: respuestaApi } })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 3,
              created_at: '2026-08-20T10:00:00Z',
              action: 'updated',
              description: 'Datos actualizados.',
              author: { name: 'Administrador Demo' },
            },
          ],
        },
      })
    const post = vi.fn().mockResolvedValue({ data: { data: respuestaApi } })
    const put = vi.fn().mockResolvedValue({
      data: { data: { ...respuestaApi, telefono: '+51 999 000 111' } },
    })
    const eliminar = vi.fn().mockResolvedValue({ data: null })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { get, post, put, delete: eliminar } }))
    const servicio = await import('@/services/usuarios.service')

    await servicio.obtenerUsuario(31)
    await servicio.crearUsuario(USUARIO_NUEVO)
    await servicio.actualizarUsuario(31, {
      telefono: '+51 999 000 111',
      empresaId: 2,
      fechaRegistro: '2000-01-01',
      actividad: { rutinas: 999 },
    })
    const desactivado = await servicio.desactivarUsuario(31)
    const historial = await servicio.obtenerHistorialUsuario(31)

    expect(get).toHaveBeenNthCalledWith(1, '/usuarios/31')
    expect(post).toHaveBeenCalledWith(
      '/usuarios',
      expect.objectContaining({
        tipo_documento: 'dni',
        numero_documento: '79999999',
        tipo_usuario: 'member',
        id_empresas: 1,
      }),
    )
    expect(put).toHaveBeenCalledWith('/usuarios/31', {
      telefono: '+51 999 000 111',
      id_empresas: 2,
    })
    expect(eliminar).toHaveBeenCalledWith('/usuarios/31')
    expect(desactivado).toEqual(expect.objectContaining({ id: 31, estado: 'inactive' }))
    expect(get).toHaveBeenNthCalledWith(2, '/usuarios/31/historial')
    expect(historial[0]).toEqual({
      id: 3,
      fecha: '2026-08-20T10:00:00Z',
      accion: 'updated',
      descripcion: 'Datos actualizados.',
      autor: 'Administrador Demo',
    })
  })

  it('traduce errores 422 de Laravel a los nombres del formulario', async () => {
    const post = vi.fn().mockRejectedValue({
      status: 422,
      message: 'Los datos no son válidos.',
      errors: {
        email: ['El correo ya se encuentra registrado.'],
        numero_documento: ['El documento ya está registrado.'],
        tipo_usuario: ['Selecciona un rol válido.'],
        id_empresas: ['Selecciona una empresa.'],
      },
    })
    vi.doMock('@/config/env', () => ({ USE_MOCKS: false }))
    vi.doMock('@/services/api', () => ({ default: { post } }))
    const { crearUsuario } = await import('@/services/usuarios.service')

    await expect(crearUsuario(USUARIO_NUEVO)).rejects.toMatchObject({
      name: 'HttpError',
      status: 422,
      errors: {
        correo: ['El correo ya se encuentra registrado.'],
        numeroDocumento: ['El documento ya está registrado.'],
        rol: ['Selecciona un rol válido.'],
        empresaId: ['Selecciona una empresa.'],
      },
    })
  })
})
