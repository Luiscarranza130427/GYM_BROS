# Gym Bros — Frontend web

Panel administrativo de escritorio del SaaS Gym Bros. Vue 3 + Vite.

Este repositorio es sólo el frontend web para PC. La aplicación móvil y la API
REST (Laravel 11) son proyectos independientes.

## Requisitos

Node.js `^20.19.0` o `>=22.12.0`.

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

La aplicación queda en <http://localhost:5173>.

Como el backend todavía no existe, arranca en **modo mock** (`VITE_USE_MOCKS=true`).
Credenciales de desarrollo:

```text
admin@gymbros.test / password123
```

Sólo funcionan contra el mock local; no son credenciales reales.

## Scripts

| Script            | Qué hace                            |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Servidor de desarrollo              |
| `npm run build`   | Build de producción en `dist/`      |
| `npm run preview` | Sirve el build generado             |
| `npm run lint`    | ESLint (falla ante cualquier aviso) |
| `npm run format`  | Formatea con Prettier               |
| `npm run test`    | Pruebas unitarias con Vitest        |

> En Windows, ejecutar los scripts desde PowerShell o CMD. Desde Git Bash el
> lanzador de npm de este equipo falla con `""node"" no se reconoce`.

## Rutas

| Ruta         | Acceso          |
| ------------ | --------------- |
| `/login`     | Sólo sin sesión |
| `/dashboard` | Requiere sesión |
| `/404`       | Pública         |

## Documentación

- [`docs/FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md) — estructura,
  flujo de datos, modo mock, integración pendiente con Laravel.
- [`CLAUDE.md`](CLAUDE.md) — convenciones del proyecto.

## Estado

**Fase 1 (fundación) completada.** Los módulos funcionales —empresas, usuarios,
ejercicios, alimentación, notificaciones, planes, pagos y perfil— pertenecen a
fases posteriores y todavía no están implementados.
