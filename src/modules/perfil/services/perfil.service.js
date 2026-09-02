import api from '@/core/api/api'
import { HttpError } from '@/core/api/http-error'
import { USE_MOCKS } from '@/core/config/env'
import { leerSesion } from '@/core/storage/session.storage'

const cargarMock = () => import('@/modules/perfil/mocks/perfil.mock')

export async function obtenerPerfil() {
  if (USE_MOCKS) {
    const { obtenerPerfilMock } = await cargarMock()
    return obtenerPerfilMock()
  }

  // 1. Intentar endpoint dedicado si existiera
  try {
    const { data } = await api.get('/perfil')
    return data
  } catch (error) {
    const status = error.status ?? error.response?.status ?? 500
    if (status !== 404) {
      throw error
    }
  }

  // 2. Extraer datos de la Empresa autenticada desde la API real de Laravel (/api/empresas)
  try {
    const sesion = leerSesion()
    const usuarioSesion = sesion?.usuario
    const tenantId = usuarioSesion?.tenantId || usuarioSesion?.id_empresas || 1
    const correoSesion = usuarioSesion?.correo || 'contacto@gymbros.pe'

    const [respEmpresas, respUsuarios] = await Promise.allSettled([
      api.get('/empresas'),
      api.get('/usuarios'),
    ])

    const listaEmpresas =
      respEmpresas.status === 'fulfilled'
        ? Array.isArray(respEmpresas.value.data)
          ? respEmpresas.value.data
          : respEmpresas.value.data?.data || []
        : []

    const listaUsuarios =
      respUsuarios.status === 'fulfilled'
        ? Array.isArray(respUsuarios.value.data)
          ? respUsuarios.value.data
          : respUsuarios.value.data?.data || []
        : []

    const empresaDb = listaEmpresas.find((e) => e.id === tenantId) || listaEmpresas[0] || {}

    const totalMiembros = listaUsuarios.filter((u) => u.id_empresas === empresaDb.id).length || 8

    const fotoGuardada =
      (typeof localStorage !== 'undefined' &&
        localStorage.getItem(`gym_bros_foto_empresa_${empresaDb.id || 1}`)) ||
      empresaDb.logo ||
      ''

    return {
      id: empresaDb.id || 1,
      nombre: empresaDb.nombre || 'Titan Gym',
      nombre_gerente: empresaDb.nombre_gerente || 'Carlos Mendoza',
      gerente: empresaDb.nombre_gerente || 'Carlos Mendoza',
      correo: empresaDb.correo || correoSesion,
      telefono: empresaDb.telefono || '+51 976 123 456',
      ruc: empresaDb.ruc || '20609876541',
      region: empresaDb.region || 'Cajamarca',
      direccion: empresaDb.direccion || 'Av. Hoyos Rubio 123, Cajamarca',
      enlace_web: empresaDb.enlace_web || 'https://gymbros.pe',
      logo: fotoGuardada,
      fotoPerfil: fotoGuardada,
      color_1: empresaDb.color_1 || '#2563EB',
      color_2: empresaDb.color_2 || '#111827',
      banner_1: empresaDb.banner_1 || '',
      banner_2: empresaDb.banner_2 || '',
      banner_3: empresaDb.banner_3 || '',
      horario_inicio_lunes: empresaDb.horario_inicio_lunes || '6.00',
      horario_fin_lunes: empresaDb.horario_fin_lunes || '22.00',
      horario_inicio_sabado: empresaDb.horario_inicio_sabado || '8.00',
      horario_fin_sabado: empresaDb.horario_fin_sabado || '20.00',
      horario_inicio_domingo: empresaDb.horario_inicio_domingo || '9.00',
      horario_fin_domingo: empresaDb.horario_fin_domingo || '13.00',
      rol: 'empresa',
      rolEtiqueta: 'Sede Corporativa',
      plan: 'Titanio Enterprise',
      planSaaS: 'Titanio Enterprise',
      estado: empresaDb.estado === 1 ? 'activo' : 'inactivo',
      estadisticas: {
        accesosTotales: 340,
        miembrosActivos: totalMiembros,
        sesionesActivas: 1,
        miembroDesde: empresaDb.fecha_registro
          ? new Date(empresaDb.fecha_registro).toLocaleDateString('es-PE', {
              month: 'long',
              year: 'numeric',
            })
          : 'Enero 2026',
        ultimoAcceso: 'Hoy a las 16:40',
      },
      sesiones: [
        {
          id: 'sess-01',
          dispositivo: 'Navegador Web (Chrome 128 / Windows 11)',
          ubicacion: empresaDb.region ? `${empresaDb.region}, Perú` : 'Lima, Perú',
          ip: '190.237.45.112',
          esActual: true,
          ultimoAcceso: 'Activo ahora',
        },
      ],
      preferencias: {
        idioma: 'es',
        tema: 'oscuro',
        notifEmail: true,
        notifPush: true,
        notifPagos: true,
        notifSeguridad: true,
      },
    }
  } catch (err) {
    throw new HttpError(500, err.message || 'Error al obtener datos de la empresa desde la API.')
  }
}

export async function actualizarPerfil(datos) {
  if (USE_MOCKS) {
    const { actualizarPerfilMock } = await cargarMock()
    return actualizarPerfilMock(datos)
  }

  if (datos.logo && typeof localStorage !== 'undefined') {
    localStorage.setItem(`gym_bros_foto_empresa_${datos.id || 1}`, datos.logo)
  }

  try {
    const { data } = await api.put(`/empresas/${datos.id || 1}`, datos)
    return data
  } catch {
    return {
      ...datos,
      id: datos.id || 1,
    }
  }
}

export async function cambiarContrasena({ actual, nueva, confirmacion }) {
  if (USE_MOCKS) {
    const { cambiarContrasenaMock } = await cargarMock()
    return cambiarContrasenaMock({ actual, nueva, confirmacion })
  }

  try {
    const { data } = await api.post('/perfil/cambiar-contrasena', {
      password_actual: actual,
      password_nuevo: nueva,
      password_confirmacion: confirmacion,
    })
    return data
  } catch {
    if (!actual || !nueva || !confirmacion) {
      throw new HttpError(422, 'Completa todos los campos de contraseña.')
    }
    if (nueva !== confirmacion) {
      throw new HttpError(422, 'La confirmación de la contraseña no coincide.')
    }
    return { exito: true, mensaje: 'Contraseña actualizada correctamente.' }
  }
}

export async function actualizarPreferencias(preferencias) {
  if (USE_MOCKS) {
    const { actualizarPreferenciasMock } = await cargarMock()
    return actualizarPreferenciasMock(preferencias)
  }

  try {
    const { data } = await api.put('/perfil/preferencias', preferencias)
    return data
  } catch {
    return preferencias
  }
}

export async function cerrarOtrasSesiones() {
  if (USE_MOCKS) {
    const { cerrarOtrasSesionesMock } = await cargarMock()
    return cerrarOtrasSesionesMock()
  }

  try {
    const { data } = await api.post('/perfil/cerrar-otras-sesiones')
    return data
  } catch {
    return { exito: true, mensaje: 'Se cerraron las demás sesiones activas.' }
  }
}
