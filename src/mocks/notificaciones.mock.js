/**
 * Notificaciones simuladas. En esta fase sólo existe el contador que alimenta el
 * distintivo de la campana: ni bandeja, ni tiempo real, ni programación.
 */
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Simula GET /notificaciones/no-leidas */
export async function contarNoLeidasMock() {
  await esperar(150)
  return 3
}
