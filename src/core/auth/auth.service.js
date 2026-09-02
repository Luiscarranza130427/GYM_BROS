import api from '@/core/api/api'
import { HttpError } from '@/core/api/http-error'
import { USE_MOCKS } from '@/core/config/env'
import { resolverUrlStorage } from '@/shared/utils/storage'

const cargarMock = () => import('@/modules/auth/mocks/auth.mock')

export async function iniciarSesion({ correo, contrasena }) {
  if (USE_MOCKS) {
    const { iniciarSesionMock } = await cargarMock()
    return iniciarSesionMock({ correo, contrasena })
  }

  const correoNormalizado = (correo ?? '').trim().toLowerCase()

  // 1. Validar contra los usuarios y empresas registrados en la API en vivo de Laravel
  try {
    const [respUsuarios, respEmpresas] = await Promise.allSettled([
      api.get('/usuarios'),
      api.get('/empresas'),
    ])

    const usuarios =
      respUsuarios.status === 'fulfilled'
        ? Array.isArray(respUsuarios.value.data)
          ? respUsuarios.value.data
          : respUsuarios.value.data?.data || []
        : []

    const empresas =
      respEmpresas.status === 'fulfilled'
        ? Array.isArray(respEmpresas.value.data)
          ? respEmpresas.value.data
          : respEmpresas.value.data?.data || []
        : []

    const usuarioEncontrado = usuarios.find(
      (u) => (u.correo ?? '').trim().toLowerCase() === correoNormalizado,
    )

    if (usuarioEncontrado) {
      if (usuarioEncontrado.estado === 0 || usuarioEncontrado.estado === false) {
        throw new HttpError(403, 'Tu cuenta de usuario se encuentra desactivada.')
      }

      const tenantId = usuarioEncontrado.id_empresas || 1
      const empresaEncontrada = empresas.find((e) => e.id === tenantId) || empresas[0]

      const nombreMostrar =
        empresaEncontrada?.nombre ||
        `${usuarioEncontrado.nombre ?? ''} ${usuarioEncontrado.apellidos ?? ''}`.trim() ||
        usuarioEncontrado.correo

      const foto = usuarioEncontrado.foto_perfil
        ? resolverUrlStorage(usuarioEncontrado.foto_perfil)
        : ''
      const logoEmpresa = empresaEncontrada?.logo ? resolverUrlStorage(empresaEncontrada.logo) : ''

      return {
        usuario: {
          id: usuarioEncontrado.id,
          nombre: nombreMostrar,
          correo: usuarioEncontrado.correo,
          rol: 'Empresa',
          tenantId,
          foto,
          logoEmpresa,
        },
        token: `bearer-token-usuario-${usuarioEncontrado.id}-${Date.now()}`,
      }
    }
  } catch (error) {
    if (error instanceof HttpError && error.status === 403) {
      throw error
    }
  }

  // 2. Intentar endpoint dedicado si estuviera configurado
  try {
    const { data } = await api.post('/login', {
      email: correoNormalizado,
      password: contrasena,
      correo: correoNormalizado,
      contrasena,
    })

    const usuarioData = data.user || data.usuario || data
    const tenantId = usuarioData.tenant_id ?? usuarioData.empresa_id ?? usuarioData.id_empresas ?? 1

    return {
      usuario: {
        id: usuarioData.id,
        nombre: usuarioData.nombre_empresa || usuarioData.name || 'Titan Gym',
        correo: usuarioData.email || usuarioData.correo || correoNormalizado,
        rol: 'Empresa',
        tenantId,
        foto: resolverUrlStorage(
          usuarioData.logo || usuarioData.logo_empresa || usuarioData.foto_perfil || '',
        ),
      },
      token: data.token || data.access_token || `bearer-token-${usuarioData.id}-${Date.now()}`,
    }
  } catch (err) {
    const status = err.status ?? err.response?.status ?? 401
    const mensaje =
      status === 404 || status === 401
        ? 'Credenciales incorrectas. No se encontró el usuario en la base de datos.'
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
