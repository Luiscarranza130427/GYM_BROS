import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier/flat'
import globals from 'globals'

/**
 * Configuración plana de ESLint 10.
 * `prettier` va SIEMPRE al final: desactiva las reglas de formato para que el
 * formateo lo decida Prettier y el linter se ocupe sólo de la calidad del código.
 */
export default [
  {
    name: 'gymbros/ignorados',
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    name: 'gymbros/aplicacion',
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'smart'],
    },
  },

  {
    name: 'gymbros/archivos-de-node',
    files: ['*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  prettier,
]
