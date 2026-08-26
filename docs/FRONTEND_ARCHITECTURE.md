# Arquitectura del frontend — Gym Bros

Documento práctico de la Fase 1. Explica cómo está montado el proyecto y cómo
crecer sobre él sin romperlo.

## 1. Stack

| Pieza         | Elección                        | Motivo                                     |
| ------------- | ------------------------------- | ------------------------------------------ |
| Framework     | Vue 3 (`<script setup>`)        | Requisito del proyecto                     |
| Bundler       | Vite 8                          | Arranque y build rápidos, alias sencillos  |
| Rutas         | Vue Router 5                    | Router oficial; guards y lazy loading      |
| Estado global | Pinia 4                         | Store oficial de Vue 3                     |
| HTTP          | Axios 1                         | Interceptores para token y errores         |
| UI            | Bootstrap 5.3 + Bootstrap Icons | Rejilla, formularios e iconos ya resueltos |
| Gráficos      | Chart.js 4                      | Visualización encapsulada del Dashboard    |
| Calidad       | ESLint 10 + Prettier 3          | Lint y formato                             |
| Pruebas       | Vitest 4 + Vue Test Utils       | Comparte la config de Vite                 |

Sin TypeScript, sin Nuxt, sin Tailwind, sin Vuex.

## 2. Estructura

```text
src/
├── assets/styles/      _variables.css (tokens) · base.css · main.css
├── components/layout/  AppHeader.vue · AppSidebar.vue
├── config/             env.js  (único lector de import.meta.env)
├── layouts/            AuthLayout.vue · DashboardLayout.vue
├── mocks/              auth.mock.js · dashboard.mock.js · empresas.mock.js
├── modules/            auth/views · dashboard/{components,views} · empresas/{components,views}
├── router/             index.js · guards.js
├── services/           api.js · auth.service.js · dashboard.service.js · empresas.service.js · session.storage.js
├── stores/             auth.store.js · ui.store.js
├── views/              NotFoundView.vue  (vistas sin módulo propio)
├── App.vue
└── main.js
```

Las carpetas se crean únicamente al aparecer una responsabilidad real. El Dashboard
añade componentes enfocados y utilidades de formato; no necesita store ni composable.

## 3. Flujo de datos

```text
Vista / Componente
        ↓  (llama a una función del servicio)
    Servicio            src/services/*.service.js
        ↓  (mock o HTTP, decide aquí y sólo aquí)
     api.js             instancia única de Axios
        ↓
  API REST Laravel 11
```

Prohibido saltarse un paso. Un componente nunca importa `axios`.

El **store** (Pinia) se apoya en el servicio y guarda el resultado; no habla con
Axios directamente.

## 4. Modo mock

`VITE_USE_MOCKS=true` hace que los servicios de autenticación, Dashboard y Empresas respondan desde `src/mocks/`.
El interruptor está **sólo** en la capa de servicios; el store, el router y las
vistas no saben si hay backend o no.

Credenciales de desarrollo (`src/mocks/auth.mock.js`):

```text
admin@gymbros.test / password123
```

No son un secreto: sólo funcionan contra el mock y dejan de existir con
`VITE_USE_MOCKS=false`.

Los mocks se importan de forma estática, así que el módulo entra en el bundle
también en producción. Es ~1 KB y ninguna ruta puede alcanzarlo con los mocks
apagados; si algún día molesta, se convierte en `await import(...)`.

## 5. Variables de entorno

Se leen **exclusivamente** en `src/config/env.js`, que convierte los booleanos y
aporta valores por defecto para que la app arranque sin `.env`.

| Variable            | Por defecto                    | Para qué              |
| ------------------- | ------------------------------ | --------------------- |
| `VITE_APP_NAME`     | `Gym Bros`                     | Títulos y marca       |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Base de la API        |
| `VITE_USE_MOCKS`    | `true`                         | Datos simulados sí/no |

`.env` está ignorado por Git; se versiona sólo `.env.example`. Todo lo que empieza
por `VITE_` acaba en el bundle público: **nunca poner ahí claves ni tokens**.

## 6. Autenticación (temporal)

1. `LoginView` llama a `auth.store.iniciarSesion()`.
2. El store llama a `auth.service.iniciarSesion()`, que hoy responde desde el mock.
3. El store guarda `usuario` y `token` y los persiste con `session.storage.js`.
4. `guards.js` deja pasar o redirige según `meta.requiresAuth` / `meta.guestOnly`.

`api.js` ya envía `Authorization: Bearer <token>` en cada petición.

> **Aviso de seguridad.** `localStorage` no es un mecanismo de seguridad: es
> legible por cualquier script inyectado en la página. Se usa para no perder la
> sesión simulada al recargar durante el desarrollo. El mecanismo definitivo
> depende de lo que implemente Natan (Sanctum con cookies httpOnly, o token
> Bearer). Al decidirlo, el único archivo a cambiar es `session.storage.js`.

## 7. Errores HTTP

El interceptor de respuesta de `api.js` convierte cualquier fallo en un
`HttpError` con `status`, `message` y `errors`, con mensajes por defecto para
0/401/403/404/422/500 y respetando el `message` que envíe Laravel. Un 401 dispara
el manejador registrado en `main.js`, que limpia la sesión local y vuelve al login.

El mock lanza el **mismo** `HttpError`, así que las vistas ya tratan los errores
como lo harán con el backend real.

## 8. Cómo ejecutar

```bash
npm install
cp .env.example .env
npm run dev
```

| Script            | Qué hace                             |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Servidor de desarrollo (puerto 5173) |
| `npm run build`   | Build de producción en `dist/`       |
| `npm run preview` | Sirve el build                       |
| `npm run lint`    | ESLint, falla con cualquier aviso    |
| `npm run format`  | Formatea con Prettier                |
| `npm run test`    | Pruebas unitarias                    |

## 9. Cómo añadir un módulo nuevo

Ejemplo con `usuarios`:

1. `src/modules/usuarios/views/UsuariosView.vue` — sólo presentación y estado local.
2. `src/services/usuarios.service.js` — llamadas a `api.js`
   (`GET /usuarios`, `POST /usuarios`, …). Si aún no hay backend, un mock en
   `src/mocks/usuarios.mock.js` detrás del mismo interruptor `USE_MOCKS`.
3. Ruta hija de la que monta `DashboardLayout`, con lazy loading:

   ```js
   {
     path: 'usuarios',
     name: 'usuarios',
     component: () => import('@/modules/usuarios/views/UsuariosView.vue'),
     meta: { requiresAuth: true, title: 'Usuarios' },
   }
   ```

4. Entrada en el array `enlaces` de `AppSidebar.vue`.
5. Store en `src/stores/` **sólo** si el estado lo necesita más de una vista.

## 10. Pendiente para la integración con Laravel

- Cerrar con Natan el contrato real de `/auth/login` y `/auth/logout`. Lo que hay
  en `auth.service.js` es una suposición provisional.
- Decidir el mecanismo de sesión (Sanctum con cookies vs. token Bearer) y ajustar
  `session.storage.js` y el interceptor de `api.js`.
- Confirmar el prefijo real de la API (`/api/v1`) y la política de CORS.
- Definir cómo viajan los roles y permisos, para ampliar los guards.
- Poner `VITE_USE_MOCKS=false` y borrar los mocks que ya no hagan falta.

## 11. Dashboard administrativo — Fase 3

El Dashboard mantiene estado local y consume una única frontera de datos:

```text
DashboardView → dashboard.service.js → dashboard.mock.js / GET /dashboard
```

`GET /dashboard` es provisional hasta cerrar el contrato con Natan. La normalización
vive en el servicio, por lo que una futura respuesta de Laravel no obliga a cambiar
componentes. Chart.js se usa directamente y se destruye al desmontar el gráfico.

## 12. Decisiones y restricciones del shell administrativo

Implementado en Fase 2:

- **Rutas de los módulos que aún no existen** (usuarios, ejercicios,
  alimentación, notificaciones, planes, pagos): cada uno mantiene su ruta real,
  apuntando a una vista compartida de "En construcción". Empresas ya reemplazó
  ese placeholder por sus cuatro rutas CRUD anidadas. Todas heredan
  `requiresAuth` del registro padre.
- **Reflow (WCAG 2.1 AA, 1.4.10).** El shell actual usa un sidebar de 280 px
  fijos, así que por debajo de ~640 px de ancho equivalente —lo que produce un
  zoom del 400 % en una pantalla de 1280 px— el contenido deja de ser usable. No
  es un caso móvil: es un usuario con baja visión en escritorio. El layout de la
  Fase 2 debe contemplar un punto de ruptura en el que el menú pase a superponerse
  en lugar de robar ancho al contenido.
- **Cabeceras de seguridad.** El artefacto es estático, así que `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options` y `frame-ancestors` los
  pone el servidor que lo sirva, no este repositorio. Hay que decidirlos al
  definir el despliegue con Natan; sin ellos, guardar el token en `localStorage`
  no tiene ninguna mitigación frente a un XSS.

## 13. Deuda técnica conocida

- Se carga el CSS completo de Bootstrap (~46 KB gzip). Si pesa, compilar sólo los
  componentes usados con Sass.
- Se carga la fuente completa de Bootstrap Icons (~134 KB woff2). Si pesa,
  sustituir por SVG sueltos de los iconos realmente usados.
- No se importa el JavaScript de Bootstrap: no hace falta todavía. Cuando se
  necesiten modales o dropdowns, añadir `bootstrap/dist/js/bootstrap.bundle.min.js`.
- Las credenciales de demostración aparecen como cadenas en el bundle de
  producción aunque no se muestren: `pistaDeCredenciales()` se resuelve en tiempo
  de ejecución y Rollup no puede eliminarlas. No es un riesgo (sólo sirven contra
  el mock, que en producción está apagado), pero conviene saberlo.

## 14. Empresas — Fase 4

El módulo utiliza rutas hijas anidadas para que el enlace del sidebar permanezca
activo en listado, alta, detalle y edición:

```text
/empresas → listado
/empresas/nueva → alta
/empresas/:id → detalle
/empresas/:id/editar → edición
```

El flujo conserva la frontera de datos del proyecto:

```text
Vistas de Empresas → empresas.service.js → empresas.mock.js / API Laravel
```

`empresas.service.js` normaliza tanto el contrato mock como variantes habituales
en `snake_case` de Laravel. Expone listado paginado, detalle, alta, actualización
y desactivación; las vistas no conocen `USE_MOCKS`, Axios ni la forma cruda de la
respuesta HTTP. El mock mantiene una colección mutable durante la sesión y lanza
los mismos `HttpError` 404/422 que la integración real.

Decisiones provisionales que deben confirmarse con backend:

- endpoints `GET/POST /empresas`, `GET/PUT /empresas/:id` y `DELETE /empresas/:id`;
- valores provisionales de estado `active` / `inactive` tanto en filtros como en payloads; el normalizador también tolera `activo` / `inactivo` al leer;
- `DELETE` representa desactivación lógica, no borrado físico;
- RUC es opcional y admite de 8 a 11 dígitos;
- la subida de logo todavía conserva únicamente una vista previa local;
- nombres definitivos de paginación y errores 422.
