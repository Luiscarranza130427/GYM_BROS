import {
  Bell,
  Building2,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  LayoutGrid,
  User,
  Users,
  Utensils,
} from 'lucide-vue-next'

export const SECCIONES = [
  {
    name: 'dashboard',
    path: 'dashboard',
    title: 'Dashboard',
    descripcion: 'Vista general',
    icono: LayoutGrid,
    vista: () => import('@/modules/dashboard/views/DashboardView.vue'),
  },
  {
    name: 'empresas',
    path: 'empresas',
    title: 'Empresas',
    descripcion: 'Gestión de empresas',
    icono: Building2,
    arbolPropio: true,
  },
  {
    name: 'usuarios',
    path: 'usuarios',
    title: 'Usuarios',
    descripcion: 'Miembros y accesos',
    icono: Users,
    arbolPropio: true,
  },
  {
    name: 'ejercicios',
    path: 'ejercicios',
    title: 'Ejercicios',
    descripcion: 'Rutinas y catálogo',
    icono: Dumbbell,
    arbolPropio: true,
  },
  {
    name: 'alimentacion',
    path: 'alimentacion',
    title: 'Alimentación',
    descripcion: 'Planes nutricionales',
    icono: Utensils,
    arbolPropio: true,
  },
  {
    name: 'notificaciones',
    path: 'notificaciones',
    title: 'Notificaciones',
    descripcion: 'Alertas y mensajes',
    icono: Bell,
    vista: () => import('@/modules/notificaciones/views/NotificacionesView.vue'),
  },
  {
    name: 'planes',
    path: 'planes',
    title: 'Planes',
    descripcion: 'Membresías y planes',
    icono: ClipboardCheck,
    arbolPropio: true,
  },
  {
    name: 'pagos',
    path: 'pagos',
    title: 'Reportes de pagos',
    descripcion: 'Cobros y transacciones',
    icono: CreditCard,
    vista: null,
  },
]

export const SECCIONES_DE_USUARIO = [
  {
    name: 'perfil',
    path: 'perfil',
    title: 'Mi perfil',
    icono: User,
    vista: () => import('@/modules/perfil/views/PerfilView.vue'),
  },
]
