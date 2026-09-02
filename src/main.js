import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Bootstrap primero y los estilos propios después, para que los tokens de
// Gym Bros puedan sobrescribir a los de Bootstrap por orden de cascada.
// No se importa el CSS distribuido completo, sino la selección de parciales que
// el panel usa de verdad: ver `@/assets/styles/bootstrap.scss`.
// Los iconos ya no son una fuente: son SVG en línea (`@/components/base/Icono.vue`).
import '@/assets/styles/bootstrap.scss'
import '@/assets/styles/main.css'

import App from '@/App.vue'
import router from '@/app/router'
import { registrarManejadorNoAutorizado, registrarProveedorDeToken } from '@/core/api/api'
import { useAuthStore } from '@/core/auth/auth.store'

const app = createApp(App)

/*
 * Red de seguridad. Sin esto, un error en el `setup` de cualquier componente
 * deja la pantalla en blanco sin traza: Vue lo captura y no lo propaga a la
 * consola, así que ni el usuario ve nada ni el desarrollador se entera.
 *
 * No se intenta recuperar la aplicación, sólo dejar constancia: adivinar cómo
 * seguir tras un error desconocido produce estados peores que el fallo.
 *
 * Cuando haya un servicio de monitorización (Sentry o similar), este es el
 * punto donde se le envía.
 */
app.config.errorHandler = (error, _instancia, informacion) => {
  console.error(`[Gym Bros] Error no capturado en ${informacion}:`, error)
}

// Los avisos de Vue en desarrollo también pasan por aquí; en producción Vue no
// los emite, así que no hay coste en el bundle público.
app.config.warnHandler = (aviso, _instancia, traza) => {
  console.warn(`[Gym Bros] ${aviso}${traza}`)
}

/*
 * Una navegación que falla por un error de carga —un chunk que no se descarga
 * porque se ha desplegado una versión nueva, por ejemplo— deja al usuario
 * parado sin explicación. Al menos queda registrado.
 */
router.onError((error, to) => {
  console.error(`[Gym Bros] La navegación a "${to.fullPath}" falló:`, error)
})

// Pinia antes que el router: los guards consultan el store de autenticación en
// la primera navegación, que se dispara al instalar el router.
app.use(createPinia())
app.use(router)

// El cliente HTTP toma el token del store en cada petición. Así no hay dos
// copias del token y `api.js` sigue sin importar Pinia.
registrarProveedorDeToken(() => useAuthStore().token)

// Un 401 del backend significa que la sesión ya no sirve. Se limpia sólo el
// estado local (`olvidarSesion`) para no volver a llamar al backend y entrar en
// bucle, y se devuelve al usuario al login conservando a dónde quería ir.
registrarManejadorNoAutorizado(() => {
  useAuthStore().olvidarSesion()

  const rutaActual = router.currentRoute.value
  if (rutaActual.name !== 'login') {
    // El `.catch()` no sobra: si el 401 llega mientras hay una navegación en
    // curso, vue-router rechaza esta promesa con un NavigationFailure y quedaría
    // como rechazo sin capturar en la consola. Que la redirección se pierda es
    // aceptable —el guard mandará al login igualmente—; ensuciar la consola con
    // un error que no lo es, no.
    router.push({ name: 'login', query: { redirect: rutaActual.fullPath } }).catch(() => {})
  }
})

app.mount('#app')
