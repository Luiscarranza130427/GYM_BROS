export const membresiasRoutes = [
  {
    path: 'planes',
    name: 'planes',
    redirect: { name: 'planes-listado' },
    meta: { title: 'Planes', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'planes-listado',
        component: () => import('@/modules/membresias/views/PlanesView.vue'),
        meta: { title: 'Planes', requiresAuth: true },
      },
      {
        path: 'nuevo',
        name: 'plan-nuevo',
        component: () => import('@/modules/membresias/views/PlanCreateView.vue'),
        meta: { title: 'Nuevo plan', requiresAuth: true },
      },
      {
        path: ':id/editar',
        name: 'plan-editar',
        component: () => import('@/modules/membresias/views/PlanEditView.vue'),
        props: true,
        meta: { title: 'Editar plan', requiresAuth: true },
      },
    ],
  },
]
