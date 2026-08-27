import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ICONOS } from '@/assets/iconos'

/*
 * Guardián del catálogo de iconos.
 *
 * Al pasar de la fuente de Bootstrap Icons a SVG en línea aparece un riesgo
 * nuevo: usar un nombre que no esté en `iconos.js` no rompe nada, simplemente
 * no dibuja. Un hueco mudo es de los fallos que más tardan en notarse, porque
 * nadie mira dos veces un botón sin icono.
 *
 * Estas pruebas recorren el código y comprueban las dos direcciones: que todo
 * icono referenciado exista, y que el catálogo no acumule iconos que ya no usa
 * nadie —que es justo el peso del que veníamos huyendo—.
 */

// `process.cwd()` es la raíz del proyecto: vitest.config.js la fija de forma
// explícita. Bajo jsdom, `import.meta.url` no es una URL `file:` y no sirve.
const RAIZ = join(process.cwd(), 'src') + sep

function ficherosDeFuente(directorio = join(process.cwd(), 'src'), acumulado = []) {
  for (const entrada of readdirSync(directorio)) {
    const ruta = join(directorio, entrada)
    if (statSync(ruta).isDirectory()) {
      if (entrada !== '__tests__') ficherosDeFuente(ruta, acumulado)
    } else if (/\.(vue|js)$/.test(entrada) && entrada !== 'iconos.js') {
      acumulado.push(ruta)
    }
  }
  return acumulado
}

/*
 * `IconoSvg.vue` queda fuera del barrido: no consume iconos, define el mecanismo,
 * y su comentario documenta el patrón `<i class="bi ...">` que sustituye. Sin
 * esta exclusión, esa documentación contaría como un uso real.
 */
const COMPONENTE_ICONO = 'components/base/IconoSvg.vue'

const FUENTES = ficherosDeFuente()
  .map((ruta) => ({
    ruta: ruta.slice(RAIZ.length).replace(/\\/g, '/'),
    contenido: readFileSync(ruta, 'utf8'),
  }))
  .filter(({ ruta }) => ruta !== COMPONENTE_ICONO)

/*
 * Un icono puede aparecer de dos formas, y ambas cuentan:
 *
 *  - `<IconoSvg nombre="bell" />`  — nombre literal ya sin prefijo, en plantillas.
 *  - `'bi-bell'`                — con prefijo, dentro de expresiones, datos de
 *                                 navegación, mocks o ternarios.
 *
 * El componente acepta las dos y normaliza, así que aquí hay que mirar las dos
 * o el recuento sale mal en alguna dirección.
 */
const RE_LITERAL_EN_PLANTILLA = /<IconoSvg[^>]*\snombre="(?!\$)([a-z0-9-]+)"/g
const RE_CON_PREFIJO = /\bbi-[a-z0-9-]+/g

const sinPrefijo = (nombre) => nombre.replace(/^bi-/, '')

/** @returns {Map<string, string>} nombre sin prefijo -> primer fichero donde aparece. */
function recolectar(...expresiones) {
  const encontrados = new Map()
  for (const { ruta, contenido } of FUENTES) {
    for (const expresion of expresiones) {
      for (const coincidencia of contenido.matchAll(expresion)) {
        const nombre = sinPrefijo(coincidencia[1] ?? coincidencia[0])
        if (!encontrados.has(nombre)) encontrados.set(nombre, ruta)
      }
    }
  }
  return encontrados
}

const USADOS = recolectar(RE_LITERAL_EN_PLANTILLA, RE_CON_PREFIJO)

describe('catálogo de iconos', () => {
  it('contiene trazos válidos y no está vacío', () => {
    const nombres = Object.keys(ICONOS)
    expect(nombres.length).toBeGreaterThan(0)

    for (const nombre of nombres) {
      expect(Array.isArray(ICONOS[nombre]), `${nombre} debería ser un array`).toBe(true)
      expect(ICONOS[nombre].length, `${nombre} no tiene ningún trazo`).toBeGreaterThan(0)
      for (const trazo of ICONOS[nombre]) {
        expect(typeof trazo.d, `${nombre} tiene un trazo sin "d"`).toBe('string')
        expect(trazo.d.length).toBeGreaterThan(0)
      }
    }
  })

  it('incluye todos los iconos que el código referencia', () => {
    expect(USADOS.size).toBeGreaterThan(0)

    const ausentes = [...USADOS]
      .filter(([nombre]) => !ICONOS[nombre])
      .map(([nombre, ruta]) => `${nombre} (usado en ${ruta})`)

    expect(
      ausentes,
      'Copia sus trazos desde node_modules/bootstrap-icons a src/assets/iconos.js',
    ).toEqual([])
  })

  it('no arrastra iconos que ya no usa nadie', () => {
    const sobrantes = Object.keys(ICONOS).filter((nombre) => !USADOS.has(nombre))
    expect(sobrantes, 'Retíralos de src/assets/iconos.js').toEqual([])
  })

  it('ya no queda ninguna etiqueta de la fuente de iconos', () => {
    const restos = FUENTES.filter(({ contenido }) =>
      /<i\s[^>]*\bclass="[^"]*\bbi\b/.test(contenido),
    )

    expect(
      restos.map((f) => f.ruta),
      'Sustitúyelas por <IconoSvg nombre="…" />',
    ).toEqual([])
  })
})
