import api from '@/core/api/api'
import { HttpError } from '@/core/api/http-error'
import { IS_DEV, USE_MOCKS } from '@/core/config/env'

const cargarMock = () => import('@/modules/auth/mocks/auth.mock')

/**
 * ACCESO PROVISIONAL DE DESARROLLO — retirar cuando exista `POST /auth/login`.
 *
 * Busca el correo en `/usuarios` y abre sesión SIN COMPROBAR LA CONTRASEÑA,
 * porque la API todavía no tiene endpoint de autenticación. Es la única forma
 * de entrar al panel mientras Natan lo construye.
 *
 * Va detrás de `IS_DEV` a propósito: en un build de producción esta función no
 * se llama nunca y el usuario recibe el error honesto. Sin esa valla, un
 * despliegue dejaría el panel abierto a cualquiera que conozca un correo
 * registrado, que era exactamente el estado anterior.
 */
async function accesoProvisionalSinBackend(correoNormalizado) {
  const { data } = await api.get('/usuarios')
  const usuarios = Array.isArray(data) ? data : (data?.data ?? [])

  const usuario = usuarios.find((u) => (u.correo ?? '').trim().toLowerCase() === correoNormalizado)

  if (!usuario) {
    throw new HttpError(401, 'Ese correo no está registrado en la API.')
  }
  if (usuario.estado === 0 || usuario.estado === false) {
    throw new HttpError(403, 'Tu cuenta de usuario se encuentra desactivada.')
  }

  console.warn(
    '[Gym Bros] Sesión abierta SIN verificar la contraseña: la API no tiene /auth/login. ' +
      'Sólo ocurre en desarrollo.',
  )

  const nombre = `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim()

  return {
    usuario: {
      id: usuario.id,
      nombre: nombre || (usuario.correo ?? ''),
      correo: usuario.correo ?? correoNormalizado,
      rol: usuario.tipo_usuario ?? 'Empresa',
      tenantId: usuario.id_empresas ?? null,
      foto: usuario.foto_perfil ?? '',
    },
    token: `desarrollo-sin-backend-${usuario.id}`,
  }
}

export async function iniciarSesion({ correo, contrasena }) {
  if (USE_MOCKS) {
    const { iniciarSesionMock } = await cargarMock()
    return iniciarSesionMock({ correo, contrasena })
  }

  const correoNormalizado = (correo ?? '').trim().toLowerCase()

  try {
    const { data } = await api.post('/auth/login', {
      email: correoNormalizado,
      password: contrasena,
      correo: correoNormalizado,
      contrasena,
    })

    const usuarioData = data.user || data.usuario || data
    const token = data.token ?? data.access_token
    if (!token) throw new HttpError(502, 'La API no devolvió un token de sesión.')

    const tenantId =
      usuarioData.tenant_id ?? usuarioData.empresa_id ?? usuarioData.id_empresas ?? null

    return {
      usuario: {
        id: usuarioData.id,
        nombre: usuarioData.nombre_empresa ?? usuarioData.name ?? usuarioData.nombre ?? '',
        correo: usuarioData.email || usuarioData.correo || correoNormalizado,
        rol: 'Empresa',
        tenantId,
        foto: usuarioData.logo ?? usuarioData.logo_empresa ?? usuarioData.foto_perfil ?? '',
      },
      token,
    }
  } catch (err) {
    const status = err.status ?? err.response?.status ?? 401

    // Sólo el 404 activa el acceso provisional: significa que el endpoint no
    // existe. Un 401 es una contraseña mal puesta y debe seguir fallando.
    if (status === 404 && IS_DEV) {
      return accesoProvisionalSinBackend(correoNormalizado)
    }

    const mensaje =
      status === 404
        ? 'El inicio de sesión aún no está disponible en la API.'
        : status === 401
          ? 'Correo o contraseña incorrectos.'
          : err.message || 'No se pudo iniciar sesión.'
    throw new HttpError(status, mensaje)
  }
}

export async function cerrarSesion() {
  if (USE_MOCKS) {
    const { cerrarSesionMock } = await cargarMock()
    return cerrarSesionMock()
  }

  try {
    await api.post('/logout')
  } catch {
    // Si la API falla al cerrar sesión en el servidor, cerramos la sesión local
  }
}

export async function pistaDeCredenciales() {
  if (!USE_MOCKS) return null
  const { PISTA_DEMO } = await cargarMock()
  return PISTA_DEMO
}
