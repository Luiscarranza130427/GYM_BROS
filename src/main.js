import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Bootstrap primero y los estilos propios después, para que los tokens de
// Gym Bros puedan sobrescribir a los de Bootstrap por orden de cascada.
// No se importa el CSS distribuido completo, sino la selección de parciales que
// el panel usa de verdad: ver `@/assets/styles/bootstrap.scss`.
import '@/assets/styles/bootstrap.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@/assets/styles/main.css'

import App from '@/App.vue'
import router from '@/router'
import { registrarManejadorNoAutorizado, registrarProveedorDeToken } from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'

const app = createApp(App)

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
    router.push({ name: 'login', query: { redirect: rutaActual.fullPath } })
  }
})

app.mount('#app')
