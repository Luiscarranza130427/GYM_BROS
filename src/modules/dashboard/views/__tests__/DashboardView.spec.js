import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardView from '@/modules/dashboard/views/DashboardView.vue'
import { obtenerDashboard } from '@/services/dashboard.service'

vi.mock('@/services/dashboard.service', () => ({
  obtenerDashboard: vi.fn(),
}))

const DATOS = {
  banner: {
    titulo: 'Gestiona tu gimnasio desde un solo lugar',
    descripcion: 'Resumen operativo',
    accion: { texto: 'Ver usuarios' },
  },
  metricas: [
    {
      id: 'empresas',
      etiqueta: 'Empresas',
      valor: 14,
      icono: 'bi-buildings-fill',
      tendencia: { valor: 2, prefijo: '+', detalle: 'este mes', tono: 'positivo' },
    },
    {
      id: 'usuarios',
      etiqueta: 'Usuarios',
      valor: 346,
      icono: 'bi-people-fill',
      tendencia: { valor: 8.4, sufijo: '%', detalle: 'este mes', tono: 'positivo' },
    },
    {
      id: 'entrenadores',
      etiqueta: 'Entrenadores',
      valor: 27,
      icono: 'bi-person-arms-up',
      tendencia: { valor: 1, detalle: 'este mes', tono: 'positivo' },
    },
    {
      id: 'rutinas',
      etiqueta: 'Rutinas activas',
      valor: 89,
      icono: 'bi-clipboard2-pulse-fill',
      tendencia: { valor: 0, detalle: 'sin cambios', tono: 'neutro' },
    },
  ],
  progreso: {
    titulo: 'Usuarios activos',
    descripcion: 'Últimos meses',
    unidad: 'usuarios activos',
    etiquetas: ['Jul', 'Ago'],
    valores: [317, 346],
    resumen: { etiqueta: 'Total', valor: 346, detalle: '+29' },
  },
  ejerciciosPopulares: [{ id: 1, nombre: 'Press de banca', categoria: 'Pecho', usos: 154 }],
  actividadReciente: [
    {
      id: 1,
      titulo: 'Nuevo usuario registrado',
      detalle: 'Carlos Ramírez',
      fecha: new Date().toISOString(),
      icono: 'bi-person-plus-fill',
    },
  ],
}

const RouterLinkStub = {
  props: ['to'],
  template: '<a href="#"><slot /></a>',
}

const ProgressChartStub = {
  props: ['progreso'],
  template: `
    <section>
      <p v-if="progreso.etiquetas.length">Gráfico de progreso</p>
      <p v-else>Aún no hay progreso suficiente para construir la gráfica.</p>
    </section>
  `,
}

function montarDashboard() {
  return mount(DashboardView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        ProgressChart: ProgressChartStub,
      },
    },
  })
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mantiene el skeleton mientras el servicio está cargando', () => {
    obtenerDashboard.mockReturnValue(new Promise(() => {}))

    const wrapper = montarDashboard()

    expect(wrapper.text()).toContain('Cargando información del dashboard')
    expect(wrapper.findAll('.skeleton__metrica')).toHaveLength(4)
  })

  it('renderiza las cuatro métricas y las secciones operativas', async () => {
    obtenerDashboard.mockResolvedValue(DATOS)

    const wrapper = montarDashboard()
    await flushPromises()

    expect(wrapper.findAll('.metrica')).toHaveLength(4)
    expect(wrapper.text()).toContain('Gestiona tu gimnasio desde un solo lugar')
    expect(wrapper.text()).toContain('Press de banca')
    expect(wrapper.text()).toContain('Nuevo usuario registrado')
    expect(wrapper.text()).toContain('8.4 %')
  })

  it('muestra el error y recupera el contenido al reintentar', async () => {
    obtenerDashboard
      .mockRejectedValueOnce(new Error('Servicio no disponible.'))
      .mockResolvedValueOnce(DATOS)

    const wrapper = montarDashboard()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Servicio no disponible.')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(obtenerDashboard).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Indicadores principales')
  })

  it('tolera progreso, ejercicios y actividad vacíos', async () => {
    obtenerDashboard.mockResolvedValue({
      ...DATOS,
      progreso: { ...DATOS.progreso, etiquetas: [], valores: [] },
      ejerciciosPopulares: [],
      actividadReciente: [],
    })

    const wrapper = montarDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('Aún no hay progreso suficiente')
    expect(wrapper.text()).toContain('Aún no hay ejercicios con usos registrados')
    expect(wrapper.text()).toContain('Aún no hay actividad registrada')
  })

  it('muestra una alternativa estable para fechas de actividad inválidas', async () => {
    obtenerDashboard.mockResolvedValue({
      ...DATOS,
      actividadReciente: [{ ...DATOS.actividadReciente[0], fecha: 'dato-invalido' }],
    })

    const wrapper = montarDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('Fecha no disponible')
    expect(wrapper.get('time').attributes('datetime')).toBeUndefined()
  })
})
