/**
 * Secciones del panel administrativo, en el orden en que aparecen en el menú.
 *
 * Fuente única del menú y de las rutas simples del DashboardLayout. Los módulos
 * con rutas anidadas, como Empresas, conservan aquí sus metadatos de navegación
 * y declaran su árbol especializado en `router/index.js`.
 *
 * Cada sección declara una de tres cosas:
 *   - `vista`: componente propio, ruta simple.
 *   - `arbolPropio: true`: el módulo declara su árbol CRUD en `router/index.js`
 *     (listado, alta, detalle, edición) conservando este mismo `name` como
 *     padre, para que el enlace del menú siga activo dentro de todo el árbol.
 *   - `vista: null`: todavía no implementado; usa la pantalla compartida
 *     "En construcción".
 *
 * Marcar `arbolPropio` aquí evita tener que mantener a mano en `router/index.js`
 * una lista de nombres excluidos, que había que tocar con cada módulo nuevo.
 */
export const SECCIONES = [
  {
    name: 'dashboard',
    path: 'dashboard',
    title: 'Dashboard',
    icono: 'bi-grid-1x2-fill',
    vista: () => import('@/modules/dashboard/views/DashboardView.vue'),
  },
  {
    name: 'empresas',
    path: 'empresas',
    title: 'Empresas',
    icono: 'bi-buildings-fill',
    arbolPropio: true,
  },
  {
    name: 'usuarios',
    path: 'usuarios',
    title: 'Usuarios',
    icono: 'bi-people-fill',
    arbolPropio: true,
  },
  {
    name: 'ejercicios',
    path: 'ejercicios',
    title: 'Ejercicios',
    icono: 'bi-person-arms-up',
    arbolPropio: true,
  },
  {
    name: 'alimentacion',
    path: 'alimentacion',
    title: 'Alimentación',
    icono: 'bi-fork-knife',
    vista: null,
  },
  {
    name: 'notificaciones',
    path: 'notificaciones',
    title: 'Notificaciones',
    icono: 'bi-bell-fill',
    vista: null,
  },
  {
    name: 'planes',
    path: 'planes',
    title: 'Planes',
    icono: 'bi-clipboard2-check-fill',
    vista: null,
  },
  {
    name: 'pagos',
    path: 'pagos',
    title: 'Reportes de pagos',
    icono: 'bi-cash-stack',
    vista: null,
  },
]

/**
 * Secciones accesibles desde el menú de usuario, no desde el lateral.
 * "Mi perfil" queda visualmente preparado; su módulo llegará más adelante.
 */
export const SECCIONES_DE_USUARIO = [
  { name: 'perfil', path: 'perfil', title: 'Mi perfil', icono: 'bi-person-fill', vista: null },
]
