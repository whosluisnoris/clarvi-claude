@AGENTS.md

# CLARVI CLAUDE

Plataforma de apoyo para una capacitación sobre el uso de Claude: **repositorio vivo de
material + banco de práctica**, organizado por temas.

**No es un LMS.** No hay rutas de aprendizaje obligatorias, ni certificados, ni secuencia
forzada. El participante entra a consultar, practicar y evaluarse. La sección 2 del brief
(`docs/brief-producto.md`) es el contrato de alcance: cualquier adición pasa por backlog.

Interfaz en **español de México**. Todo el texto visible vive en `src/lib/copy.ts`.

---

## Decisiones cerradas

Estas resuelven la sección 17 del brief. No volver a abrirlas sin decirlo aquí.

| Decisión | Resuelta | Consecuencia en el código |
|---|---|---|
| Nombre y marca | CLARVI CLAUDE | `app_settings.nombre_plataforma`, editable desde `/admin/ajustes` |
| Exámenes | Autoevaluación / formativo | La contraseña global compartida **es adecuada**. Si esto cambia, migrar a contraseñas individuales (el modelo ya lo soporta: basta dejar de rotar en bloque) |
| Volumen | Decenas, 1 cohorte a la vez | Rotación de contraseña en lotes de 25 (suficiente y crece sin reescribir); paginación del lado servidor desde el día uno |
| Visibilidad de contenido | Igual para todos por ahora | `content_access` se crea pero **nace vacía y sin uso**; todo el contenido nace `publico`. Activarla después no requiere migración |
| Crédito parcial en `seleccion_multiple` | Configurable por pregunta, default proporcional con piso en cero | Vive en `question_answer_keys.grading_options` (Fase 3) |
| Caducidad de acceso | Permanente | `cohorts.ends_at` es `nullable`; el login solo lo valida si tiene valor |
| Idioma | Español de México únicamente | Copy centralizado, sin librería de i18n. La estructura permite agregarla después |
| Duración de sesión | 12 h | Mitiga sesiones olvidadas en equipos compartidos (brief §4.5) |
| Sistema de componentes | Radix primitivos + Tailwind, en `src/componentes/` | **No se usó la CLI de shadcn**: `ui.shadcn.com` está bloqueado por la política de red del entorno (403 en el proxy). Se construyó sobre las mismas primitivas de Radix que shadcn usa por dentro, lo cual además conviene: sus componentes traen redondeos y sombras que la dirección modernista obliga a deshacer |
| Dirección visual | Modernista | Radio 0, sin sombras, un solo golpe de color. Tokens en `src/app/globals.css`, transcritos del canvas `diseno/*.dc.html`, que es la fuente de verdad |

---

## Reglas del proyecto

Las seis de arquitectura (brief §5.2). No son sugerencias:

1. **RLS activo en todas las tablas, con denegación por defecto.** Ninguna tabla sin políticas.
2. **La clave `service_role` jamás llega al navegador.** Solo en acciones de servidor concretas:
   alta de usuarios, rotación de contraseña, calificación. El archivo que la usa empieza con
   `import 'server-only'`.
3. **Las respuestas correctas nunca se envían al cliente.** Viven en `question_answer_keys`,
   con RLS que solo permite lectura a admins.
4. **La calificación ocurre en el servidor**, siempre, sin excepción, incluso para opción múltiple.
5. **Server Components para lectura, Server Actions para escritura.** Sin estado global innecesario.
6. **Todo el contenido es dato, no código.** Agregar un tema, un ejercicio o un tipo de recurso
   no debe requerir un despliegue.

Convenciones (brief §18):

- **Estructura por dominio, no por tipo de archivo.** Lo de evaluaciones vive junto, no repartido
  entre carpetas de componentes, hooks y utilidades.
- Migraciones SQL versionadas y numeradas en `supabase/migrations/`. **Nunca** un cambio manual
  en el panel de Supabase sin su migración correspondiente.
- Tipos de la base generados automáticamente y versionados en `src/tipos/base-de-datos.ts`.
- Un archivo por evaluador de reactivo, con su archivo de pruebas al lado.
- Mensajes de commit en español, con prefijo de fase.

Nomenclatura de base de datos: tablas en plural y `snake_case`, identificadores `uuid`,
`created_at` / `updated_at` en todo, borrado lógico donde perder datos sería costoso.

---

## Advertencia sobre el modelo de acceso

Existe **una sola contraseña global** compartida por todos los participantes. El nombre de
usuario determina la identidad; la contraseña es la llave de entrada al grupo.

**Este esquema no es apto si en algún momento se almacena información confidencial, o si las
calificaciones tienen consecuencias laborales.** Si eso cambia, migrar a contraseñas
individuales antes de seguir. Los administradores ya usan contraseña individual y quedan
fuera de la rotación global.

---

## Infraestructura

| Pieza | Valor |
|---|---|
| Supabase | proyecto `clarvi-claude`, ref `pkobtwpsfdrafllrpgsc`, región `us-east-1` |
| Hosting | Vercel, misma región que Supabase |
| Canvas de diseño | fuente en `diseno/*.dc.html`; el `.html` sembrado se regenera, no se versiona |

Variables de entorno documentadas en `.env.example`. Ningún valor real se versiona.

---

## Estado de las fases

| Fase | Estado | Cerrada | Criterio de aceptación |
|---|---|---|---|
| Diseño | **cerrada** | 2026-09-08 | Dirección modernista aprobada, con las pantallas de la Fase 1 dibujadas |
| 0 — Cimientos | **cerrada** | 2026-09-09 | La app despliega y conecta a Supabase |
| 1 — Identidad y usuarios | en curso | — | El admin crea un participante; esa persona entra con usuario + contraseña global y ve su pantalla |
| 2 — Recursos | no iniciada | — | El facilitador sube las presentaciones y una cohorte las ve; otra no |
| 3 — Ejercicios y calificación | no iniciada | — | Un participante resuelve los cinco tipos principales y recibe retroalimentación correcta |
| 4 — Exámenes y progreso | no iniciada | — | Se aplica un examen cronometrado y el facilitador obtiene el reporte |
| 5 — Biblioteca de prompts | no iniciada | — | Un participante encuentra un prompt, sustituye variables y lo copia |
| 6 — Pulido | no iniciada | — | Accesibilidad revisada, E2E de flujos críticos, documentación de operación |

---

## Bitácora

Una entrada por fase cerrada. Cada una registra qué quedó construido, qué decisión técnica se
tomó y por qué, qué quedó deliberadamente fuera, y qué deuda pasa a la siguiente fase. Es lo que
permite retomar sin releer el brief entero.

### Diseño — cerrada el 2026-09-08

Tres direcciones visuales dibujadas sobre la misma pantalla (`/temas/fundamentos-de-prompting`),
con el mismo contenido, para que la comparación sea de estilo y no de contenido: **Técnica**
(carbón templado, acento ámbar, mono para prompts, densidad alta), **Editorial** (hueso,
Newsreader + Karla, lectura larga cómoda en teléfono) y **Expresiva** (bloques de color,
numerales grandes, contraste alto).

Los design systems por defecto de claude.ai/design **no son alcanzables** desde una sesión
remota: `DesignSync` exige `/design-login` interactivo, y el `/design` de Claude Code es un
preview sin tokens de design system. Por eso las direcciones se dibujaron sobre vocabulario
shadcn propio en vez de heredar un kit.

Ninguna de las tres convenció del todo. El facilitador señaló que la Expresiva le llamaba la
atención pero pidió algo **más cuidado y menos "hecho por AI"**, y mencionó un design system
llamado *modernist* de claude.ai/design. Ese kit no es alcanzable desde una sesión remota, así
que se construyó una dirección **modernista** desde los principios del movimiento: retícula,
filetes y aire agrupan en lugar de tarjetas; sin esquinas redondeadas, sin sombras, sin
degradados —justo los rasgos que delatan un diseño generado— sobre papel cálido y con un solo
golpe de color colocado con intención. Archivo + DM Mono.

Aprobada con un cambio: los prompts se despliegan y muestran su cuerpo en tipografía de código.

Una revisión encontró que el texto secundario quedaba entre 2.6:1 y 4.4:1 de contraste cuando
AA exige 4.5:1, en las cuatro direcciones. Corregido antes de transcribir los tokens.

Deuda: el modo oscuro de `globals.css` está **derivado, no dibujado**. Conviene revisarlo a ojo
antes de darlo por bueno.

### Fase 0 — Cerrada el 2026-09-09

Next.js 16 + React 19 + Tailwind v4 + TypeScript estricto. Estructura por dominio. Tres clientes
de Supabase separados (`cliente`, `servidor`, `admin`); `admin.ts` abre con `import "server-only"`
para que la compilación falle si alguien lo importa desde el navegador. Cabeceras de seguridad
—CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `nosniff`— verificadas en producción.

**Decisión: sin la CLI de shadcn.** `ui.shadcn.com` responde 403 por política de red del entorno.
Se escribió la capa de componentes sobre Radix directo, que es lo que shadcn genera. Para la
dirección modernista sale ganando: no hay redondeos ni sombras que deshacer.

**Corrección durante el despliegue.** La validación de entorno se ejecutaba al cargar el módulo,
así que el primer despliegue con páginas reales tumbó el build entero por un secreto que solo
hace falta en ejecución. La clave de servicio ahora se lee dentro de la función. Las variables
públicas siguen validándose al arrancar, y eso es correcto: fallar ruidosamente ante una
configuración a medias cuesta mucho menos que depurar sesiones que se caen de forma
intermitente.

**Deuda que pasa a la Fase 1:** la protección de despliegue de Vercel (`ssoProtection`) está
activa para todo salvo dominios propios, así que ningún participante puede llegar a la
aplicación. Hay que apagarla para producción o conectar un dominio propio antes de poder dar la
capacitación.
