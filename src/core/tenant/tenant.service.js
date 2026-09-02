import api from '@/core/api/api'
import { USE_MOCKS } from '@/core/config/env'
import { leerSesion } from '@/core/storage/session.storage'

export async function obtenerTenantActual() {
  if (USE_MOCKS) {
    return {
      id: 1,
      nombre: 'Gym Bros Central',
      slug: 'gym-bros-central',
      activo: true,
      planSaaS: 'Enterprise',
      limiteUsuarios: 1000,
      logo: '',
      color1: '#2563EB',
      color2: '#111827',
    }
  }

  // 1. Intentar endpoint dedicado si estuviera registrado
  try {
    const { data } = await api.get('/tenant/current')
    return data.data ?? data
  } catch (error) {
    const status = error.status ?? error.response?.status ?? 500
    if (status !== 404) {
      throw error
    }
  }

  // 2. Extraer la empresa vinculada desde la API en vivo de Laravel (/api/empresas)
  const sesion = leerSesion()
  const usuarioSesion = sesion?.usuario
  const tenantId = usuarioSesion?.tenantId || usuarioSesion?.id_empresas || 1

  const { data: respEmpresas } = await api.get('/empresas')
  const empresas = Array.isArray(respEmpresas) ? respEmpresas : respEmpresas?.data || []
  const empresa = empresas.find((e) => e.id === tenantId) || empresas[0] || {}

  return {
    id: empresa.id || 1,
    nombre: empresa.nombre || 'Gym Bros',
    slug: (empresa.nombre || 'gym-bros').toLowerCase().replace(/\s+/g, '-'),
    logo: empresa.logo || '',
    color1: empresa.color_1 || '#2563EB',
    color2: empresa.color_2 || '#111827',
    banner1: empresa.banner_1 || '',
    region: empresa.region || 'Cajamarca',
    direccion: empresa.direccion || '',
    telefono: empresa.telefono || '',
    correo: empresa.correo || '',
    enlaceWeb: empresa.enlace_web || '',
    activo: empresa.estado === 1 || empresa.estado === true,
    planSaaS: 'Enterprise',
    limiteUsuarios: 1000,
  }
}
