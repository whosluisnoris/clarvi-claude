# Plataforma de apoyo para capacitación en Claude — Plan de producto y arquitectura

> **Documento de especificación. No contiene código.**
>
> Este es el brief original del producto, conservado como referencia de alcance.
> Su sección 17 ya está resuelta (abajo). El **estado vigente** del proyecto — qué fase va,
> qué se decidió y por qué — vive en `CLAUDE.md`, no aquí.

---

## 0. Cómo usar este documento

Este archivo describe *qué* construir y *por qué*, no *cómo* escribirlo. Claude Code debe:

1. Leerlo completo antes de generar nada.
2. Confirmar las **decisiones abiertas** de la sección 17 antes de tocar el esquema de base de datos.
3. Implementar por fases (sección 14). No intentar la aplicación completa en una sola pasada.
4. Al terminar cada fase, dejar el proyecto desplegable en Vercel y con migraciones aplicables en Supabase.
5. Convertir este documento en `CLAUDE.md` + `docs/` dentro del repo, y mantenerlo actualizado conforme cambien las decisiones.

---

## 1. Contexto y objetivo

Se imparte una **capacitación presencial/remota sobre el uso de Claude**. Hoy el material vive disperso (presentaciones, ejercicios sueltos, prompts en chats). El objetivo es una aplicación web que sirva como **sistema de apoyo** al facilitador y a los participantes.

**No es un LMS ni una plataforma de cursos.** No hay rutas de aprendizaje obligatorias, ni certificados, ni secuencia forzada. Es un **repositorio vivo + banco de práctica** organizado por temas, al que el participante entra a consultar, practicar y evaluarse.

### Objetivos concretos

| # | Objetivo | Cómo se mide |
|---|---|---|
| O1 | Centralizar el material de la capacitación | 100% de presentaciones y PDFs accesibles desde la app |
| O2 | Dar práctica ejercitable con retroalimentación inmediata | Participantes completan ≥1 ejercicio por tema |
| O3 | Medir comprensión real | Exámenes calificados automáticamente con reporte por cohorte |
| O4 | Que el material siga siendo útil después de la sesión | Uso recurrente > 2 semanas después de la capacitación |
| O5 | Que el facilitador administre todo sin tocar código | Alta de contenido 100% desde el panel admin |

---

## 2. Alcance

### Dentro de v1
- Autenticación por usuario con contraseña global (ver sección 4).
- Panel de administración completo (usuarios, cohortes, contenido, resultados).
- Módulo de **Recursos** (presentaciones, PDFs, enlaces, videos embebidos).
- Módulo de **Ejercicios** con motor de reactivos y calificación automática determinista.
- Módulo de **Exámenes** con intentos, tiempo límite y seguimiento de progreso.
- **Biblioteca de prompts** consultable y copiable.
- Reportes básicos por usuario y por cohorte.

### Fuera de v1 (registrar como backlog, no implementar)
- Registro público / recuperación de contraseña por correo.
- Evaluación de respuestas abiertas con IA o revisión manual del instructor.
- Playground con llamadas a la API de Anthropic desde la app.
- Foros, comentarios, mensajería entre participantes.
- Certificados en PDF, integración con RRHH, SSO/SAML.
- App móvil nativa (la web debe ser responsiva, eso basta).
- Multi-tenant / múltiples organizaciones.

---

## 3. Usuarios y roles

| Rol | Quién es | Qué puede hacer |
|---|---|---|
| `participante` | Asistente a la capacitación | Ver recursos y prompts asignados, resolver ejercicios y exámenes, ver su propio progreso |
| `admin` | Facilitador / instructor | Todo lo anterior + CRUD de contenido, alta/baja de usuarios y cohortes, ver resultados de todos, auditoría |

**Solo dos roles en v1.** Si más adelante hace falta un rol intermedio (ej. `observador` que ve reportes pero no edita), el campo `role` debe ser un enum extensible desde el día uno.

---

## 4. Autenticación y control de acceso

> Esta es la sección más importante y la más atípica del proyecto. Leerla completa.

### 4.1 Requisito del negocio

- **No hay página de registro.** El admin da de alta a los usuarios.
- El login es por **nombre de usuario**, no por correo electrónico.
- **Existe una sola contraseña global**, compartida por todos los participantes.
- La contraseña funciona como **llave de entrada al sistema** (¿eres del grupo?).
- El **nombre de usuario determina la identidad y qué contenido ve** esa persona.

### 4.2 Implementación recomendada: Supabase Auth con correos sintéticos

No construir un sistema de sesiones propio. Aprovechar Supabase Auth para conservar JWT, refresh tokens y **Row Level Security** funcionando de forma nativa.

**Mecánica:**
- Al crear un usuario desde el admin, se genera un usuario en `auth.users` con un correo sintético derivado del username: `<username>@usuarios.interno.local` (dominio configurable por variable de entorno).
- La contraseña asignada es la **contraseña global vigente**.
- Se marca el correo como confirmado vía Admin API; **el correo nunca se muestra ni se usa** en la interfaz.
- En el login, el formulario pide **usuario + contraseña**; el servidor traduce el username al correo sintético y llama al método estándar de inicio de sesión.
- El **registro público debe quedar deshabilitado** en la configuración del proyecto Supabase.
- Las plantillas de correo, confirmaciones y magic links quedan desactivadas.

**Ventajas:** RLS con `auth.uid()` funciona sin trucos; sesiones, expiración y refresco resueltos; cero criptografía casera.

### 4.3 Rotación de la contraseña global

- La contraseña global vigente se guarda como configuración de la aplicación (tabla `app_settings`, valor **hasheado** solo para mostrar verificación, nunca en texto plano en el cliente).
- El admin puede **rotar la contraseña** desde el panel: una acción de servidor que recorre todos los usuarios con rol `participante` y actualiza su contraseña usando la Admin API con la clave de servicio.
- La rotación invalida sesiones activas de participantes (forzar `signOut` global de esos usuarios).
- Registrar cada rotación en la bitácora de auditoría.
- Si el número de usuarios crece por encima de ~500, la rotación debe hacerse por lotes con reintentos; documentar el límite.

### 4.4 Los administradores NO usan la contraseña global

**Recomendación firme:** cada admin tiene su propia contraseña individual, distinta de la global, y opcionalmente un correo real para permitir recuperación. La contraseña compartida da acceso al material de la capacitación; nunca debe dar acceso a la gestión de usuarios ni a los resultados de terceros.

Implementación: mismo mecanismo de correo sintético, pero la contraseña se define individualmente al crear el admin y no se incluye en el proceso de rotación global.

### 4.5 Riesgos aceptados del modelo, y mitigaciones

El modelo de contraseña compartida tiene consecuencias que conviene tener escritas:

| Riesgo | Mitigación en v1 |
|---|---|
| Cualquiera que conozca la contraseña y un nombre de usuario puede suplantar a esa persona | Los nombres de usuario no se listan públicamente; el contenido no es sensible; los resultados de exámenes se tratan como formativos, no como calificación oficial |
| La contraseña se filtra fuera del grupo | Rotación de un clic desde el panel; caducidad opcional por cohorte (`ends_at`) que bloquea el acceso |
| Fuerza bruta / enumeración de usuarios | Límite de intentos por IP y por username en tabla `login_attempts`; mensaje de error genérico que no revela si el usuario existe |
| Sesiones olvidadas en equipos compartidos | Expiración de sesión relativamente corta (ej. 12 h) y botón de cerrar sesión visible |

Dejar constancia en el README de que **este esquema no es apto si en algún momento se almacena información confidencial o si las calificaciones tienen consecuencias laborales**. Si eso cambia, migrar a contraseñas individuales (el modelo de datos ya lo soporta: basta dejar de rotar en bloque).

### 4.6 Qué ve cada usuario

El acceso al contenido se resuelve por **cohorte** con posibilidad de **excepciones por usuario**:

- Cada usuario pertenece a cero o una **cohorte** (generación/grupo de capacitación).
- Cada pieza de contenido tiene `visibility`: `publico` (todos los autenticados) o `restringido`.
- Si es `restringido`, filas en `content_access` indican qué cohortes y/o qué usuarios específicos tienen acceso.
- La regla se evalúa en una **función SQL** reutilizable y se aplica desde políticas RLS, no desde el cliente.

---

## 5. Arquitectura técnica

### 5.1 Stack

| Capa | Tecnología | Nota |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server Components por defecto |
| Hosting | Vercel | Funciones serverless, región cercana a la de Supabase |
| Estilos | Tailwind CSS + shadcn/ui | Sistema de componentes consistente, accesible |
| Base de datos | Supabase Postgres | Migraciones versionadas en el repo |
| Auth | Supabase Auth | Sesión en cookies vía el helper SSR oficial |
| Archivos | Supabase Storage | Buckets **privados**, acceso por URL firmada |
| Validación | Zod compartido cliente/servidor | Un solo esquema por entidad |
| Formularios | React Hook Form + Zod | |
| Mutaciones | Server Actions | Route Handlers solo donde se requiera control fino (calificación, subida) |
| Tablas admin | TanStack Table | Ordenamiento, filtros, paginación del lado servidor |
| Pruebas | Vitest (lógica de calificación) + Playwright (flujos críticos) | La calificación **debe** tener pruebas unitarias |

### 5.2 Principios de arquitectura

1. **RLS activo en todas las tablas, con denegación por defecto.** Ninguna tabla queda sin políticas.
2. **La clave de servicio (`service_role`) jamás llega al navegador.** Solo se usa en acciones de servidor concretas: alta de usuarios, rotación de contraseña, calificación.
3. **Las respuestas correctas nunca se envían al cliente.** Están en una tabla aparte con RLS que solo permite lectura a admins y al motor de calificación.
4. **La calificación ocurre en el servidor**, siempre, sin excepción, incluso para opción múltiple.
5. **Server Components para lectura, Server Actions para escritura.** Evitar estado global innecesario.
6. **Todo el contenido es dato, no código.** Agregar un tema, un ejercicio o un tipo de recurso no debe requerir un despliegue.

### 5.3 Flujo de una respuesta calificada

```
Cliente resuelve el reactivo
   → envía únicamente su respuesta (jsonb) al endpoint de servidor
   → el servidor lee la clave de respuesta desde la BD (nunca la tuvo el cliente)
   → aplica el evaluador correspondiente al tipo de reactivo
   → guarda respuesta + puntos obtenidos + marca de tiempo
   → devuelve: correcto/incorrecto, puntos, y explicación (si el ejercicio la muestra)
```

---

## 6. Modelo de datos

Nomenclatura: tablas en plural y `snake_case`; identificadores `uuid`; `created_at` / `updated_at` en todo; borrado lógico (`deleted_at` o `is_active`) donde perder datos sería costoso.

### 6.1 Identidad y acceso

**`profiles`** — extiende `auth.users`
`id` (uuid, PK, FK a auth.users), `username` (único, minúsculas, sin espacios), `display_name`, `role` (enum: `admin`, `participante`), `cohort_id` (FK nullable), `is_active` (bool), `avatar_url` (nullable), `notes` (texto libre del admin), `last_login_at`, `created_at`, `updated_at`.

**`cohorts`**
`id`, `name`, `slug`, `description`, `starts_at`, `ends_at` (nullable; si pasó, se bloquea el acceso), `is_active`, `created_at`.

**`content_access`** — excepciones y asignación de contenido restringido
`id`, `content_type` (enum: `topic`, `resource`, `assessment`, `prompt`), `content_id` (uuid), `principal_type` (enum: `cohort`, `user`), `principal_id` (uuid), `created_at`.
*Nota:* la referencia es polimórfica, así que Postgres no puede imponer la integridad referencial. Compensar con un trigger de validación y limpieza en cascada al borrar contenido.

**`login_attempts`**
`id`, `username_intento`, `ip`, `exitoso` (bool), `created_at`. Se purga con un job periódico o consulta de limpieza.

**`audit_log`**
`id`, `actor_id`, `action` (ej. `usuario.creado`, `password.rotada`, `examen.publicado`), `entity_type`, `entity_id`, `metadata` (jsonb), `ip`, `created_at`.

### 6.2 Organización del contenido

**`topics`** — el eje organizador (temas, no lecciones)
`id`, `name`, `slug`, `description`, `icon`, `color`, `order_index`, `visibility`, `is_published`, `created_at`.

Ejemplos de temas: *Fundamentos de prompting*, *Contexto y archivos*, *Proyectos*, *Casos de uso por área*, *Límites y buenas prácticas*.

**`tags`** y **`content_tags`** — clasificación transversal, independiente del tema.

### 6.3 Recursos (prioridad 1)

**`resources`**
`id`, `topic_id` (nullable), `title`, `description`, `type` (enum: `presentacion`, `pdf`, `documento`, `video`, `enlace`, `imagen`), `storage_path` (nullable), `external_url` (nullable), `file_name`, `file_size`, `mime_type`, `duration_seconds` (para video), `version` (int), `is_downloadable` (bool), `visibility`, `is_published`, `published_at`, `order_index`, `created_by`, `created_at`, `updated_at`.

Regla: debe existir `storage_path` **o** `external_url`, nunca ambos vacíos (restricción a nivel de base de datos).

**`resource_versions`** (opcional, fase tardía) — historial cuando se sube una presentación actualizada.

**`resource_views`** — `id`, `user_id`, `resource_id`, `action` (enum: `vista`, `descarga`), `created_at`. Alimenta las métricas de uso.

### 6.4 Ejercicios y exámenes (prioridades 2 y 3)

**Decisión: una sola tabla para ambos.** Un ejercicio y un examen comparten estructura; solo cambian las reglas. Duplicar el modelo duplicaría el motor de calificación.

**`assessments`**
`id`, `topic_id`, `kind` (enum: `ejercicio`, `examen`), `title`, `slug`, `instructions` (rich text), `difficulty` (enum: `basico`, `intermedio`, `avanzado`), `estimated_minutes`, `time_limit_minutes` (nullable), `max_attempts` (nullable = ilimitado), `pass_threshold` (0–100), `shuffle_questions` (bool), `shuffle_options` (bool), `feedback_mode` (enum: `inmediato`, `al_finalizar`, `oculto`), `show_correct_answers` (bool), `visibility`, `is_published`, `published_at`, `order_index`, `created_by`, `created_at`, `updated_at`.

Configuración típica:
- **Ejercicio**: intentos ilimitados, sin tiempo, feedback inmediato, muestra respuestas correctas.
- **Examen**: 1–2 intentos, con tiempo, feedback al finalizar, no muestra respuestas correctas.

**`questions`**
`id`, `assessment_id`, `type` (enum, ver sección 7), `prompt` (enunciado en rich text), `helper_text`, `media_url` (nullable), `payload` (jsonb — **la parte pública**: opciones, columnas, banco de palabras), `points` (numérico), `explanation` (se muestra tras responder, según `feedback_mode`), `order_index`, `is_active`, `created_at`, `updated_at`.

**`question_answer_keys`** — tabla separada **a propósito**
`question_id` (PK, FK), `answer_key` (jsonb), `grading_options` (jsonb: tolerancias, si acepta crédito parcial, normalización), `updated_at`.
**RLS: lectura solo para `admin`.** El motor de calificación la consulta con clave de servicio. Así, aunque haya un error en el frontend, la respuesta correcta es físicamente inalcanzable para un participante.

**`attempts`**
`id`, `user_id`, `assessment_id`, `attempt_number`, `status` (enum: `en_curso`, `enviado`, `expirado`, `anulado`), `started_at`, `submitted_at`, `expires_at` (calculado si hay tiempo límite), `score` (puntos), `max_score`, `percentage`, `passed` (bool), `question_order` (jsonb — el orden barajado de este intento, para que refrescar la página no lo altere), `created_at`.

**`attempt_answers`**
`id`, `attempt_id`, `question_id`, `response` (jsonb, lo que envió el usuario), `is_correct` (bool), `points_awarded`, `graded_at`, `answered_at`.
Restricción de unicidad: `(attempt_id, question_id)`.

### 6.5 Biblioteca de prompts (prioridad 4)

**`prompts`**
`id`, `topic_id`, `title`, `description` (para qué sirve), `body` (el prompt en sí), `variables` (jsonb — marcadores tipo `{{empresa}}` con descripción y valor de ejemplo), `example_output` (nullable), `use_case`, `recommended_for` (texto libre: qué tipo de tarea), `visibility`, `is_published`, `copy_count`, `order_index`, `created_by`, `created_at`, `updated_at`.

**`prompt_favorites`** — `user_id`, `prompt_id`, `created_at` (PK compuesta).

Funcionalidad clave del módulo: **botón de copiar** que incrementa `copy_count`, buscador por texto completo, filtro por tema y etiquetas, y (si el prompt tiene `variables`) un formulario simple que sustituye los marcadores antes de copiar.

### 6.6 Extras

**`app_settings`** — `key` (PK), `value` (jsonb), `updated_by`, `updated_at`. Guarda: nombre de la plataforma, logo, mensaje de bienvenida, hash de verificación de la contraseña global, dominio sintético.

**`announcements`** (opcional) — avisos que el facilitador fija en el inicio: `id`, `title`, `body`, `starts_at`, `ends_at`, `cohort_id` (nullable), `is_active`.

### 6.7 Storage

| Bucket | Privado | Contenido |
|---|---|---|
| `resources` | Sí | Presentaciones, PDFs, documentos |
| `question-media` | Sí | Imágenes de apoyo en reactivos |
| `branding` | No | Logo, favicon |

Acceso siempre por **URL firmada de corta duración** generada en el servidor tras verificar permisos. Nunca exponer rutas de storage directamente en el HTML.

---

## 7. Tipos de reactivo y su calificación

Todos deterministas. Cada tipo define la forma de `payload` (público), `answer_key` (privado) y `response` (lo que envía el usuario).

### 7.1 `opcion_multiple`
Una respuesta correcta entre N opciones.
- **payload**: lista de opciones con `id` y `text`.
- **answer_key**: el `id` correcto.
- **Calificación**: coincidencia exacta. Todo o nada.

### 7.2 `seleccion_multiple`
Varias respuestas correctas.
- **answer_key**: conjunto de `id` correctos.
- **Calificación**: configurable — todo o nada, o **crédito parcial** (aciertos menos errores, con piso en cero). Definir el modo en `grading_options`.

### 7.3 `verdadero_falso`
Caso simplificado de opción múltiple. Vale la pena tenerlo aparte por la interfaz.

### 7.4 `relacionar_conceptos`
Columna izquierda ↔ columna derecha.
- **payload**: elementos de la izquierda y elementos de la derecha (estos últimos siempre barajados en el cliente).
- **answer_key**: mapa de `id_izquierda → id_derecha`.
- **Calificación**: crédito parcial por par correcto, normalizado sobre el total de pares.
- **Detalle de diseño**: permitir que la columna derecha tenga distractores (más elementos que la izquierda) y que un mismo elemento derecho pueda usarse más de una vez si se configura así.

### 7.5 `completar_con_banco`
Texto con huecos y un banco de palabras del cual elegir (arrastrar o seleccionar).
- **payload**: texto con marcadores de hueco numerados + banco de palabras (incluyendo distractores).
- **answer_key**: mapa de `hueco → id_palabra`.
- **Calificación**: crédito parcial por hueco.
- **Detalle**: definir si una palabra del banco se consume al usarse o puede repetirse.

### 7.6 `completar_texto_libre`
Hueco sin banco, se escribe la respuesta.
- **answer_key**: lista de respuestas aceptadas por hueco.
- **Normalización obligatoria antes de comparar**: minúsculas, recorte de espacios, colapso de espacios múltiples, y **eliminación de acentos configurable**. Opcionalmente, tolerancia a un error tipográfico (distancia de edición ≤1) si `grading_options` lo activa.
- Es el tipo más propenso a falsos negativos: el editor debe advertirlo y facilitar agregar sinónimos.

### 7.7 `ordenar_secuencia`
Ordenar pasos de un proceso.
- **answer_key**: la secuencia correcta de `id`.
- **Calificación**: exacta, o parcial por posiciones correctas / pares adyacentes correctos. Elegir una y documentarla.

### 7.8 `clasificar_en_categorias`
Arrastrar elementos a los grupos que les corresponden.
- **payload**: categorías + elementos.
- **answer_key**: mapa de `elemento → categoría`.
- **Calificación**: crédito parcial por elemento.

### 7.9 Requisitos transversales del motor

- Cada evaluador es una función pura, aislada, con **pruebas unitarias propias** cubriendo: acierto total, fallo total, parcial, respuesta vacía y respuesta malformada.
- Una respuesta vacía o malformada nunca lanza un error: se califica como 0 y se registra.
- Agregar un tipo nuevo debe requerir tocar exactamente tres lugares: el enum, el evaluador y el componente de interfaz. Diseñar un registro (`registry`) que lo haga evidente.
- La suma de `points` de las preguntas define `max_score` del intento; recalcularlo al enviar, no confiar en un valor precomputado.

---

## 8. Mapa de rutas

### Área pública
- `/login` — usuario + contraseña. Único punto de entrada.

### Área de participante
- `/` — inicio: avisos, temas, actividad reciente, progreso resumido
- `/temas` y `/temas/[slug]` — tema con sus recursos, ejercicios y prompts
- `/recursos` — listado filtrable; `/recursos/[id]` — visor (PDF y presentaciones embebidas, video, enlace)
- `/ejercicios` — listado con estado (sin empezar / en curso / completado)
- `/ejercicios/[slug]` — portada con instrucciones e intentos previos
- `/intentos/[id]` — resolución reactivo por reactivo o página completa (configurable)
- `/intentos/[id]/resultado` — puntaje, desglose y explicaciones según `feedback_mode`
- `/examenes` y equivalentes
- `/prompts` — biblioteca con buscador, filtros y favoritos
- `/mi-progreso` — historial de intentos, puntajes, temas cubiertos
- `/cuenta` — nombre visible, cerrar sesión

### Área de administración (`/admin`)
- `/admin` — tablero: usuarios activos, intentos recientes, reactivos con peor desempeño
- `/admin/usuarios` — alta individual y **alta masiva por CSV**, activar/desactivar, asignar cohorte, rotar contraseña global
- `/admin/cohortes`
- `/admin/temas`
- `/admin/recursos` — subida de archivos, publicar/despublicar, ordenar
- `/admin/evaluaciones` — listado de ejercicios y exámenes
- `/admin/evaluaciones/[id]` — **editor de reactivos**: la pantalla más compleja del proyecto
- `/admin/prompts`
- `/admin/resultados` — por evaluación, por cohorte, por usuario; exportación a CSV
- `/admin/ajustes` — branding, mensaje de bienvenida, dominio sintético
- `/admin/auditoria`

---

## 9. Notas de UX

- **Mobile-first real.** En una capacitación la gente consulta desde el teléfono. Relacionar conceptos y arrastrar palabras deben funcionar con el dedo: si el arrastre es frágil en móvil, ofrecer una alternativa de "seleccionar y tocar destino".
- **Español de México** en toda la interfaz. Preparar el copy en un solo archivo de textos para poder ajustarlo sin buscar cadenas por el código.
- **Guardado automático del intento.** Cada respuesta se persiste al momento; cerrar la pestaña no pierde el avance. Al volver, se retoma donde quedó.
- **Estados vacíos con sentido**: un tema sin ejercicios debe decirlo, no mostrar una tabla vacía.
- **Accesibilidad**: navegación por teclado en todos los tipos de reactivo, contraste AA, etiquetas en formularios, foco visible.
- **Modo oscuro** desde el inicio (es más barato hacerlo ahora que después).
- **Retroalimentación inmediata en ejercicios**: mostrar por qué la respuesta era correcta es la mitad del valor educativo. La `explanation` no es opcional en la práctica; el editor debe empujar a llenarla.
- **Elementos de refuerzo ligeros** (opcionales, fase tardía): barra de progreso por tema, racha de días, contador de ejercicios completados. Nada de tablas de clasificación públicas entre compañeros salvo que se pida explícitamente — en una capacitación laboral genera más fricción que motivación.

---

## 10. Seguridad

1. RLS habilitado en **todas** las tablas, con política de denegación por defecto y políticas explícitas por rol.
2. `question_answer_keys` inaccesible para participantes, a nivel de base de datos.
3. Calificación exclusivamente en el servidor. Ningún cálculo de puntaje en el cliente.
4. Validación con Zod en el límite servidor, aunque ya se haya validado en el cliente.
5. Rate limiting en `/login` por IP y por username. Respuesta de error genérica.
6. Buckets privados + URLs firmadas de corta duración. Verificar permiso antes de firmar.
7. La clave `service_role` solo en variables de entorno del servidor, nunca con prefijo público.
8. Cabeceras de seguridad: CSP, `X-Frame-Options`, `Referrer-Policy`.
9. Bitácora de auditoría para toda acción administrativa.
10. Ningún dato personal más allá del nombre visible. No pedir correo real a los participantes.

---

## 11. Restricciones de Vercel serverless y cómo sortearlas

| Restricción | Impacto | Solución |
|---|---|---|
| Límite de tamaño del cuerpo de la petición (~4.5 MB) | Una presentación de 40 MB no puede subirse a través de una función | **Subida directa del navegador a Supabase Storage** usando URL de subida firmada generada en el servidor |
| Sin sistema de archivos persistente | No se puede procesar ni almacenar en disco | Todo el archivo va a Storage; ningún procesamiento local |
| Tiempo máximo de ejecución | La rotación de contraseñas de muchos usuarios puede exceder el límite | Rotación por lotes, con reporte de progreso y reintentos |
| Arranque en frío | Latencia perceptible en horas de baja actividad | Desplegar en la región más cercana a la base de datos Supabase; mantener las páginas críticas como Server Components ligeras |
| Sin proceso de fondo | No hay tareas programadas por sí solas | Vercel Cron para limpieza de `login_attempts`, expiración de intentos abandonados y cálculo de métricas |
| Conexiones a Postgres | Serverless puede agotar el pool | Usar el **pooler** de Supabase, no la conexión directa |

Otro punto: la **previsualización de PPTX en el navegador no es trivial**. Opciones, en orden de preferencia: (a) pedir al admin que suba también una versión PDF y previsualizar el PDF; (b) previsualizar solo PDFs y ofrecer descarga del PPTX; (c) conversión externa. Recomendación: **opción (a)**, con el campo de PDF asociado en el formulario de recursos.

---

## 12. Fases de implementación

Cada fase termina con un despliegue funcional en Vercel.

### Fase 0 — Cimientos
Proyecto Next.js, Tailwind, shadcn/ui, cliente Supabase con helper SSR, estructura de carpetas, variables de entorno, primera migración vacía, despliegue en Vercel.
*Criterio:* la app despliega y conecta a Supabase.

### Fase 1 — Identidad y administración de usuarios
Migraciones de `profiles`, `cohorts`, `app_settings`, `audit_log`, `login_attempts`. Login por username. Middleware de protección de rutas. RLS base. Panel `/admin/usuarios` y `/admin/cohortes` con alta individual, alta por CSV, activar/desactivar y rotación de la contraseña global.
*Criterio:* el admin crea un participante, esa persona entra con usuario + contraseña global y ve una pantalla vacía pero suya.

### Fase 2 — Recursos (prioridad 1)
Tablas `topics`, `resources`, `content_access`, `resource_views`, buckets. Subida directa a Storage. Visor de PDF, video y enlaces. Listado y filtrado del lado participante. Función SQL de visibilidad y sus políticas.
*Criterio:* el facilitador sube las presentaciones de la capacitación y una cohorte específica las ve; otra no.

### Fase 3 — Ejercicios y motor de calificación (prioridad 2)
Tablas `assessments`, `questions`, `question_answer_keys`, `attempts`, `attempt_answers`. Editor de reactivos en el admin. Componentes de resolución para los tipos de la sección 7. Motor de calificación con pruebas unitarias. Guardado automático. Pantalla de resultado con explicaciones.
*Criterio:* un participante resuelve un ejercicio con los cinco tipos principales y recibe retroalimentación inmediata correcta.

### Fase 4 — Exámenes y progreso (prioridad 3)
Tiempo límite con expiración del lado servidor, control de intentos, barajado persistido, modo de feedback diferido. `/mi-progreso`. `/admin/resultados` con desglose por reactivo, por usuario y por cohorte, y exportación a CSV. Cron de expiración de intentos.
*Criterio:* se aplica un examen cronometrado a una cohorte y el facilitador obtiene el reporte.

### Fase 5 — Biblioteca de prompts (prioridad 4)
Tablas `prompts`, `prompt_favorites`, `tags`. Buscador de texto completo, filtros, favoritos, copiar al portapapeles con sustitución de variables.
*Criterio:* un participante encuentra un prompt por búsqueda, sustituye variables y lo copia.

### Fase 6 — Pulido
Avisos, tablero de administración con métricas, elementos de refuerzo, revisión de accesibilidad, pruebas E2E de los flujos críticos, documentación de operación para el facilitador.

---

## 13. Variables de entorno

Documentar en `.env.example`, sin valores reales:

- URL del proyecto Supabase (pública)
- Clave anónima de Supabase (pública)
- Clave de servicio de Supabase (**solo servidor**)
- Dominio sintético para los correos internos
- URL base de la aplicación
- Semilla/credenciales del admin inicial (solo para el script de arranque)

---

## 14. Métricas de éxito de la plataforma

Instrumentar desde fase 2, visibles en `/admin`:
- Usuarios activos por semana y por cohorte
- Recursos más consultados y más descargados
- Ejercicios iniciados vs. completados (tasa de abandono)
- **Reactivos con menor tasa de acierto** — la métrica más valiosa: indica qué tema hay que reexplicar
- Distribución de puntajes por examen
- Prompts más copiados

---

## 15. Datos semilla

Para poder probar sin capturar contenido a mano, el proyecto debe incluir un script de semilla con: 1 admin, 2 cohortes, 8 participantes, 4 temas, 6 recursos de ejemplo, 2 ejercicios que ejerciten **todos** los tipos de reactivo, 1 examen cronometrado y 10 prompts.

---

## 16. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El editor de reactivos crece hasta volverse inmanejable | Alta | Construirlo tipo por tipo, empezando por opción múltiple; no diseñar el editor universal antes de tener tres tipos funcionando |
| La contraseña compartida se filtra | Media | Rotación de un clic + caducidad por cohorte |
| Previsualización de PPTX complicada | Alta | Exigir PDF acompañante desde el diseño del formulario |
| Sobre-ingeniería del modelo de visibilidad | Media | Si en la práctica todo el contenido es público para los autenticados, dejar `content_access` creada pero sin usar; no bloquear la fase 2 por esto |
| Arrastrar y soltar en móvil | Media | Alternativa de "tocar para seleccionar, tocar para colocar" en todos los reactivos de arrastre |
| Alcance creciente hacia un LMS completo | Alta | La sección 2 es el contrato; cualquier adición pasa por backlog |

---

## 17. Decisiones abiertas — RESUELTAS

> Confirmadas por el facilitador antes de escribir la primera migración.
> El estado vigente vive en `CLAUDE.md`; esta sección deja constancia de qué se decidió y qué implica.

1. **Volumen esperado** → **Decenas de participantes, una sola cohorte a la vez.**
   La rotación de contraseña se hace en lotes de 25 (innecesario para este volumen, pero permite
   crecer sin reescribir). La paginación del lado servidor se implementa desde el día uno.
   El módulo de cohortes se mantiene mínimo; la tabla queda completa para cuando haya varias.

2. **¿Los exámenes tienen consecuencia formal?** → **No. Son autoevaluación / formativos.**
   Por eso el modelo de contraseña global compartida es aceptable. Si esto llega a cambiar,
   el modelo de datos ya soporta contraseñas individuales: basta dejar de rotar en bloque.
   Ver la advertencia en `CLAUDE.md`.

3. **¿Una sola cohorte a la vez o varias simultáneas?** → **Una a la vez.**
   El módulo de cohortes se reduce a alta, edición y activar/desactivar.

4. **¿El contenido es el mismo para todos?** → **Sí, por ahora.**
   `content_access` y la función SQL de visibilidad se crean, pero nacen sin uso: todo el
   contenido nace `publico`. Es la mitigación de riesgo que sugiere la propia sección 16
   ("no bloquear la fase 2 por esto"). Activar la restricción después no requiere migración.

5. **Nombre y marca** → **CLARVI CLAUDE.**
   Guardado en `app_settings` y editable desde `/admin/ajustes` sin tocar código.
   La paleta y la tipografía salen del canvas de diseño (`diseno/*.dc.html`).

6. **¿El acceso caduca?** → **No, es permanente.**
   `cohorts.ends_at` existe y es `nullable`; el login lo valida solo si tiene valor. No se fija
   ninguna fecha por defecto, pero el mecanismo queda disponible como mitigación si la
   contraseña se filtra.

7. **Crédito parcial en selección múltiple** → **Configurable por pregunta, default proporcional
   con piso en cero.** Vive en `question_answer_keys.grading_options`. Se implementa en la Fase 3.

8. **Idioma** → **Español de México únicamente.**
   Sin librería de internacionalización. Todo el texto visible se centraliza en `src/lib/copy.ts`,
   de modo que agregar otro idioma después sea un cambio acotado y no una cacería de cadenas.

---

## 18. Convenciones para el repositorio

- Estructura por dominio, no por tipo de archivo: agrupar lo relacionado a `evaluaciones` junto, no repartido entre carpetas de componentes, hooks y utilidades.
- Migraciones SQL versionadas y numeradas en el repositorio; nunca cambios manuales en el panel de Supabase sin su migración correspondiente.
- Tipos de la base de datos generados automáticamente y versionados.
- Un archivo por evaluador de reactivo, con su archivo de pruebas al lado.
- `CLAUDE.md` en la raíz con las reglas del proyecto y el estado de las fases.
- Mensajes de commit en español, con prefijo de fase.
