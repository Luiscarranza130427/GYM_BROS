import { fileURLToPath } from 'node:url'

import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'

import viteConfig from './vite.config.js'

// Se reutiliza la configuración de Vite (alias `@`, plugin de Vue) y sólo se
// añade lo propio de las pruebas, para que tests y aplicación resuelvan igual.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.spec.js'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'lcov'],
        // Se mide sólo el código propio. Quedan fuera los mocks (datos de
        // desarrollo, no lógica), la configuración y los puntos de montaje.
        include: ['src/**/*.{js,vue}'],
        exclude: [
          'src/mocks/**',
          'src/constants/**',
          'src/main.js',
          'src/App.vue',
          '**/__tests__/**',
        ],
        /*
         * Umbrales fijados justo por debajo de la cobertura actual (~64%). No
         * son un objetivo de calidad, son un trinquete: impiden que un cambio
         * la haga retroceder sin que nadie se entere. Al subir la cobertura
         * real conviene subir también estos números.
         */
        thresholds: {
          statements: 60,
          branches: 60,
          functions: 60,
          lines: 60,
        },
      },
    },
  }),
)
