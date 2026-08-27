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
         * Trinquete, no objetivo de calidad: impide que la cobertura retroceda
         * sin que nadie se entere.
         *
         * Se mantienen ~2 puntos por debajo de lo medido, no más. Con una
         * holgura mayor la red deja de servir: se puede perder cobertura real
         * durante meses sin que el umbral llegue a saltar. Al subir la
         * cobertura, subir también estos números.
         */
        thresholds: {
          statements: 67,
          branches: 65,
          functions: 67,
          lines: 69,
        },
      },
    },
  }),
)
