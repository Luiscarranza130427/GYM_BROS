import { USE_MOCKS } from '@/config/env'
import api from '@/services/api'
import { contarNoLeidasMock } from '@/mocks/notificaciones.mock'

/**
 * CONTRATO PROVISIONAL — pendiente de acordar con Natan:
 *   GET /notificaciones/no-leidas  ->  { total: number }
 *
 * De momento sólo se necesita el contador de la cabecera. La bandeja completa
 * llega con el módulo de notificaciones, en una fase posterior.
 */
export async function contarNoLeidas() {
  if (USE_MOCKS) {
    return contarNoLeidasMock()
  }

  const { data } = await api.get('/notificaciones/no-leidas')
  return data.total
}
