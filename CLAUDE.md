# Gym Bros — Frontend web administrativo

Panel de administración de escritorio del SaaS Gym Bros. Este repositorio contiene
**únicamente** el frontend web para PC. La app móvil (Joy) y la API (Natan) son
proyectos aparte.

## Stack

Vue 3 · Composition API con `<script setup>` · JavaScript (sin TypeScript) · Vite ·
Vue Router · Pinia · Axios · Bootstrap 5 · Bootstrap Icons.

No introducir Nuxt, Tailwind, jQuery, Vuex ni Options API.

## Reglas de arquitectura

- **Alias `@`** para todo import dentro de `src` (`@/services/api`), nunca `../../..`.
- **Nunca llamar a Axios desde una vista o componente.** El flujo es
  `Vista → Servicio (src/services) → api.js → API Laravel`.
- **Nunca escribir la URL del backend en el código.** Sale de `src/config/env.js`,
  único sitio que lee variables `VITE_*` (la `import.meta.env.BASE_URL` de Vite
  en `router/index.js` es la base de despliegue, no configuración de la app).
- **Pinia sólo para estado realmente global** (sesión, estado del shell). Lo que
  usa una sola vista se queda en la vista con `ref()`.
- **El interruptor de mocks vive sólo en la capa de servicios.** No debe aparecer
  `USE_MOCKS` ni un import de `@/mocks` en vistas, componentes ni stores. Si una
  vista necesita algo que depende del modo mock, se lo pide al servicio (ver
  `pistaDeCredenciales()` en `auth.service.js`).
- Un módulo funcional = una carpeta en `src/modules/<modulo>/views/`.
- **Un listado administrativo nuevo usa `useListadoFiltrable`**
  (`src/composables/`), no una copia de `EmpresasView`. Filtros en la URL,
  búsqueda con rebote, paginación y descarte de respuestas obsoletas ya están
  resueltos ahí; el módulo aporta su servicio, el mapeo de filtros a parámetros
  y sus textos.
- **Un formulario nuevo usa `useFormulario`** (carga de valores, errores 422 por
  campo, foco en el primer error) y saca sus reglas de forma —correo, teléfono,
  color, URL, fecha— de `src/utils/validaciones.js`. No se reescribe un regex de
  correo: afinarlo en un solo formulario deja al otro rechazando datos válidos.
- **Un servicio de recurso nuevo se apoya en `src/services/normalizacion.js`**
  para la paginación de Laravel, los campos editables y la traducción de los 422.
  Lo que sí escribe cada servicio es su propio `normalizarXxx`, que es su contrato.
- **Normalizar es trabajo del servicio, no del componente.** Una vista consume la
  forma que el servicio garantiza y no vuelve a aceptar variantes por su cuenta:
  esos `?? datos.otro_nombre` en un componente no son defensas, enmascaran un
  cambio de contrato que debería fallar a la vista.
- Componentes enfocados: se extrae un subcomponente cuando hay reutilización real
  o la vista se vuelve difícil de leer, no por norma.
- No añadir dependencias sin necesidad real. Cada una debe justificarse.
- No crear carpetas ni archivos vacíos "por si acaso".

## Convenciones de código

- Nomenclatura del dominio en español (`correo`, `contrasena`, `cargando`,
  `iniciarSesion`); las APIs del framework mantienen su nombre original.
- `<style scoped>` en los componentes. Los colores, radios y medidas salen de los
  tokens `--gb-*` de `src/assets/styles/_variables.css`; no escribir colores sueltos.
- **De Bootstrap sólo se compilan los parciales que se usan** (ver
  `src/assets/styles/bootstrap.scss`). Para usar una clase de un componente que
  no esté ya en esa lista —`badge`, `modal`, `table`, utilidades como `py-2`…—
  hay que añadir antes su `@import`, o la clase existirá en el HTML pero no
  tendrá estilo. Si algo aparece sin formato, mirar ahí primero.
- Las fuentes van autoalojadas en WOFF2 subconjuntado; no enlazar Google Fonts
  ni ningún CDN de tipografías.
- Antes de añadir una imagen a `src/assets/`, comprobar su peso frente al tamaño
  al que se muestra. No servir un original de cámara para un avatar de 32 px.
- HTML semántico, `<label for>` en todos los campos, botones reales (nunca
  `<div @click>`), iconos decorativos con `aria-hidden="true"`.

## Backend

Laravel 11, todavía en desarrollo. El contrato de `/auth/login` y `/auth/logout`
documentado en `src/services/auth.service.js` es **provisional**: no darlo por
cerrado ni inventar contratos nuevos para otros módulos.

## Fases del proyecto

El trabajo avanza por fases con aprobación entre una y otra. **No adelantar
trabajo de la fase siguiente**, aunque parezca trivial.

- Fase 1 — Fundación del frontend. **Completada.**
- Fase 2 — Layout administrativo (sidebar y header completos). **Completada.**
- Fase 3 — Dashboard administrativo (service, mocks, KPIs, gráfico y estados). **Completada.**
- Fase 4 — Módulo de empresas (CRUD, filtros, paginación y estados). **Completada.**
- Fase 5 — Módulo de usuarios (CRUD, filtros, historial y estados). **Completada.**

Los módulos CRUD restantes (ejercicios, alimentación, notificaciones, planes,
pagos, perfil) pertenecen a fases posteriores y no deben implementarse hasta que
se pidan. Hoy usan la pantalla compartida «En construcción».

## Antes de dar una tarea por terminada

```bash
npm run lint && npm run test && npm run build
```

Los tres tienen que pasar. Si algo falla, corregir la causa: no desactivar reglas
de ESLint ni silenciar avisos para que desaparezcan.

Lo mismo lo ejecuta CI en cada pull request (`.github/workflows/ci.yml`), junto
con `format:check`, la cobertura y una comprobación de que no se filtren datos
simulados al bundle. Ejecutarlo en local antes de subir sigue siendo más rápido
que esperar al workflow.

> Nota de entorno: en este equipo los scripts npm fallan desde Git Bash
> (`""node"" no se reconoce`). Ejecutarlos desde PowerShell o CMD.
