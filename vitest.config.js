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
    },
  }),
)
