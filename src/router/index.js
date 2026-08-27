import { createRouter, createWebHistory, RouterView } from 'vue-router'

import { aplicarTitulo, guardAutenticacion } from '@/router/guards'
import { SECCIONES, SECCIONES_DE_USUARIO } from '@/router/navegacion'

/**
 * Las vistas se cargan de forma perezosa: cada ruta genera su propio chunk y el
 * arranque de la aplicación no descarga pantallas que el usuario no visita.
 */

/** Pantalla compartida por los módulos cuya vista real todavía no existe. */
const vistaEnConstruccion = () => import('@/views/EnConstruccionView.vue')

/** Reutilizado por /404 y por el comodín, para no duplicar la definición. */
const rutaNoEncontrada = {
  component: () => import('@/views/NotFoundView.vue'),
  meta: { title: 'Página no encontrada' },
}

/**
 * Las rutas simples del panel se derivan de `navegacion.js`. Un módulo sin vista
 * propia usa la pantalla "En construcción"; los árboles CRUD especializados se
 * agregan después manteniendo el mismo nombre padre que usa el sidebar.
 */
const rutasDeSeccion = [...SECCIONES, ...SECCIONES_DE_USUARIO]
  .filter((seccion) => !seccion.arbolPropio)
  .map((seccion) => ({
    path: seccion.path,
    name: seccion.name,
    component: seccion.vista ?? vistaEnConstruccion,
    meta: { title: seccion.title },
  }))

/**
 * El registro padre conserva el nombre que usa el sidebar. Al navegar por una
 * empresa, Vue Router mantiene ese registro en `route.matched`, por lo que el
 * enlace Empresas queda activo sin duplicar lógica de rutas en el menú.
 */
const rutaEmpresas = {
  path: 'empresas',
  name: 'empresas',
  component: RouterView,
  redirect: { name: 'empresas-listado' },
  meta: { title: 'Empresas' },
  children: [
    {
      path: '',
      name: 'empresas-listado',
      component: () => import('@/modules/empresas/views/EmpresasView.vue'),
      meta: { title: 'Empresas' },
    },
    {
      path: 'nueva',
      name: 'empresa-nueva',
      component: () => import('@/modules/empresas/views/EmpresaCreateView.vue'),
      meta: { title: 'Nueva empresa' },
    },
    {
      path: ':id/editar',
      name: 'empresa-editar',
      component: () => import('@/modules/empresas/views/EmpresaEditView.vue'),
      meta: { title: 'Editar empresa' },
    },
    {
      path: ':id',
      name: 'empresa-detalle',
      component: () => import('@/modules/empresas/views/EmpresaDetailView.vue'),
      meta: { title: 'Detalle empresa' },
    },
  ],
}

/** Árbol CRUD de Usuarios; mantiene activo el enlace padre del sidebar. */
const rutaUsuarios = {
  path: 'usuarios',
  name: 'usuarios',
  component: RouterView,
  redirect: { name: 'usuarios-listado' },
  meta: { title: 'Usuarios' },
  children: [
    {
      path: '',
      name: 'usuarios-listado',
      component: () => import('@/modules/usuarios/views/UsuariosView.vue'),
      meta: { title: 'Usuarios' },
    },
    {
      path: 'nuevo',
      name: 'usuario-nuevo',
      component: () => import('@/modules/usuarios/views/UsuarioCreateView.vue'),
      meta: { title: 'Nuevo usuario' },
    },
    {
      path: ':id/editar',
      name: 'usuario-editar',
      component: () => import('@/modules/usuarios/views/UsuarioEditView.vue'),
      meta: { title: 'Editar usuario' },
    },
    {
      path: ':id',
      name: 'usuario-detalle',
      component: () => import('@/modules/usuarios/views/UsuarioDetailView.vue'),
      meta: { title: 'Perfil de usuario' },
    },
  ],
}

/** Árbol CRUD de Ejercicios; mantiene activo el enlace padre del sidebar. */
const rutaEjercicios = {
  path: 'ejercicios',
  name: 'ejercicios',
  component: RouterView,
  redirect: { name: 'ejercicios-listado' },
  meta: { title: 'Ejercicios' },
  children: [
    {
      path: '',
      name: 'ejercicios-listado',
      component: () => import('@/modules/ejercicios/views/EjerciciosView.vue'),
      meta: { title: 'Ejercicios' },
    },
    {
      path: 'nuevo',
      name: 'ejercicio-nuevo',
      component: () => import('@/modules/ejercicios/views/EjercicioCreateView.vue'),
      meta: { title: 'Nuevo ejercicio' },
    },
    {
      path: ':id/editar',
      name: 'ejercicio-editar',
      component: () => import('@/modules/ejercicios/views/EjercicioEditView.vue'),
      meta: { title: 'Editar ejercicio' },
    },
    {
      path: ':id',
      name: 'ejercicio-detalle',
      component: () => import('@/modules/ejercicios/views/EjercicioDetailView.vue'),
      meta: { title: 'Detalle ejercicio' },
    },
  ],
}

/**
 * `requiresAuth` va en el registro PADRE y vue-router lo fusiona hacia las
 * hijas: así ninguna ruta nueva puede quedarse pública por olvido. Si algún día
 * hace falta una hija pública, se excluye de forma explícita.
 */
const routes = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/modules/auth/views/LoginView.vue'),
        meta: { guestOnly: true, title: 'Iniciar sesión' },
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      ...rutasDeSeccion,
      rutaEmpresas,
      rutaUsuarios,
      rutaEjercicios,
    ],
  },
  { path: '/404', name: 'not-found', ...rutaNoEncontrada },
  { path: '/:pathMatch(.*)*', name: 'catch-all', ...rutaNoEncontrada },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(guardAutenticacion)
router.afterEach(aplicarTitulo)

export default router
