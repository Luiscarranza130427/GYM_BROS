# Paneles — qué contiene cada pantalla

Alcance funcional del panel administrativo, tal como lo definió el cliente.
Junto a [`MODELO_DE_DATOS.md`](MODELO_DE_DATOS.md), es la referencia para decidir
qué construir: uno dice **qué datos hay**, éste dice **qué se hace con ellos**.

Lo que aquí no figure no se implementa sin acordarlo.

---

## Armazón

- **Menú lateral retráctil.**
- **Notificaciones** y **Perfil** accesibles desde la cabecera.

---

## Inicio

| Elemento                                                    | Estado                                             |
| ----------------------------------------------------------- | -------------------------------------------------- |
| Banner con botón                                            | hecho                                              |
| Cajas de administración: usuarios, alimentación, ejercicios | **accesos directos a los módulos**, no indicadores |
| Tabla de progreso general de todos los usuarios             | **tabla**, no gráfico                              |
| Ejercicios más usados                                       | hecho                                              |

> Las «cajas» son atajos de navegación a tres módulos concretos. Hoy el
> dashboard muestra en su lugar cuatro tarjetas de indicadores (empresas,
> usuarios, entrenadores, rutinas), que no es lo pedido.
>
> El «progreso general» es una **tabla** de usuarios. Hoy hay un gráfico de
> líneas con la evolución agregada de usuarios activos, que tampoco lo es. Los
> datos por usuario salen de `progresos` (peso, grasa, masa muscular, medidas).

---

## Empresa

- Buscador de texto y filtro por estado.
- Ficha de empresa: **nombre, empresa, días**. Crear, editar, borrar, ver.

> «Días» son los **horarios de apertura** (`empresas.horario_inicio_*` /
> `horario_fin_*`, catorce columnas). El formulario actual no los tiene, ni
> tampoco los banners ni los enlaces de botón que sí están en el esquema.

---

## Usuarios

- Filtro por **tiempo de suscripción**.
- Buscador.
- Ficha de usuario: nombre, empresa, días. Crear, **editar perfil**, borrar,
  ver, **editar datos**, e **historial de cambios**.

> Son **dos acciones de edición distintas** —«editar perfil» y «editar datos»—,
> no una. Falta acordar qué campos entran en cada una.
>
> **Conflicto pendiente**: aquí se pide filtrar usuarios por tiempo de
> suscripción, pero en el esquema la suscripción cuelga de `empresas`, no de
> `usuarios`. O el filtro es «por la suscripción de su empresa», o falta una
> relación. Ver la nota del modelo de datos.

---

## Ejercicios

- Filtro por **grupo muscular** y por nivel.
- **Rejilla de tarjetas**: imagen, nombre y acción de añadir.
- Crear ejercicio: nombre, **imagen**, **vídeo**.

> Es una rejilla de tarjetas, no una tabla. Y el filtro es por grupo muscular
> (tabla `grupos_musculares`), no por una categoría inventada en el frontend.

---

## Alimentación

- Horario de alimentación.
- **Rejilla de tarjetas** de comidas: imagen, nombre y texto.
- Crear y editar comida.

> Se apoya en `alimentos`, `planes_alimentacion`, `comidas` y
> `comida_alimentos`. El «horario» sale de `comidas.hora_sugerida` y
> `comidas.tipo_comida`.

---

## Notificaciones

Tres secciones, no un listado único:

1. **Crear** — dirigida a usuarios, agrupados por empresa.
2. **Programadas** — `fecha_envio` futura, `enviada = false`.
3. **Enviadas** — `enviada = true`.

---

## Planes

- Crear planes.
- Ficha: **nombre, número de usuarios, días, beneficios**, botón «comprar
  ahora» y botón de WhatsApp.

> Corresponde exactamente a `planes.limite_usuarios`, `duracion_dias`,
> `contenido` y `enlace_whatsapp`. La duración se cuenta en **días**, no en
> meses.

---

## Reportes de pagos

Columnas: **fecha, empresa, nombre del plan, precio, cantidad de meses**.

> Es un **informe de consulta**: no se crean ni se editan pagos desde el panel.
> Sale de `pagos` unido a `suscripciones` y `planes`.

---

## Distancia entre lo construido y esto

Estado a fecha de recibir el esquema y este documento. Los módulos anteriores se
construyeron con campos inventados y marcados como provisionales; ahora hay
referencia y se puede medir cuánto se desvían.

### Planes — todavía en pull request, se corrige antes de entrar

| Frontend                         | Esquema                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `precio` único                   | `precio_original` **y** `precio_inicial`                         |
| `duracionMeses` (1, 3, 6, 12)    | `duracion_dias` (entero libre)                                   |
| `publico` (individual / empresa) | no existe → `limite_usuarios`                                    |
| `caracteristicas` (array)        | `contenido` (TEXT)                                               |
| `destacado`                      | no existe                                                        |
| `suscriptores`                   | no está en `planes`; se cuenta desde `suscripciones`             |
| —                                | falta `enlace_whatsapp` y los botones «comprar ahora» y WhatsApp |

### Ejercicios — ya fusionado, requiere corrección

| Frontend                                   | Esquema                                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `categoria`: 7 valores propios             | `id_grupos_musculares` → 10 valores reales (incluye bíceps, tríceps, cuádriceps, isquiotibiales, glúteos, pantorrillas, abdomen; **no hay «cardio» ni «piernas»**) |
| `equipo`: lista cerrada de 6               | `equipamiento` VARCHAR(100), **texto libre**                                                                                                                       |
| `seriesSugeridas`, `repeticionesSugeridas` | **no existen**: son de `ejercicios_rutina`                                                                                                                         |
| `nivel` en minúsculas                      | `Principiante`, `Intermedio`, `Avanzado`                                                                                                                           |
| tabla                                      | **rejilla de tarjetas** con imagen                                                                                                                                 |
| —                                          | faltan `instrucciones`, `enlace_video`, `imagen_ejercicio`, `id_empresas`                                                                                          |

### Usuarios — ya fusionado

- `tipoDocumento` usa `dni` / `passport` / `other`; el esquema dice `DNI`,
  `Pasaporte`, `Otro`.
- `rol` usa `admin` / `manager` / `trainer` / `member`; el esquema dice
  `Administrador`, `Empresa`, `Entrenador`, `Usuario`.
- La **suscripción anidada por usuario no existe**: pertenece a su empresa.
- Falta `asistencia_semanal` y la segunda acción de edición.

### Empresas — ya fusionado

- Faltan los **catorce campos de horario** («días» en el diseño).
- Faltan `banner_1..3` y `link_boton_1..3`.

### Inicio

- Las cajas deben ser **accesos a usuarios, alimentación y ejercicios**, no
  cuatro tarjetas de indicadores.
- El progreso general debe ser una **tabla por usuario**, no un gráfico agregado.

### Sin empezar

Alimentación (cinco tablas), Notificaciones (tres secciones), Reportes de pagos,
Perfil.
