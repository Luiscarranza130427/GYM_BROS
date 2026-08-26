import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Alias `@` -> src. Permite `import api from '@/services/api'` en lugar de
    // rutas relativas frágiles como '../../../services/api'.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        /*
         * Bootstrap 5.3 sigue escrito con `@import` y la función `if()` de Sass,
         * ambos marcados como obsoletos en Dart Sass. Son avisos de código de
         * terceros que no podemos corregir y que en cada build tapaban la salida
         * útil. Se silencian sólo estas dos categorías: cualquier otro aviso de
         * Sass, incluidos los de nuestro propio SCSS, sigue viéndose.
         */
        silenceDeprecations: ['import', 'if-function', 'global-builtin', 'color-functions'],
      },
    },
  },
  server: {
    port: 5173,
  },
})
