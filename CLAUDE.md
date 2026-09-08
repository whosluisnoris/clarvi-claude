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
| Sistema de componentes | shadcn/ui + Tailwind | Componentes copiados al repo, Radix debajo: accesibilidad y navegación por teclado resueltas |

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
| Diseño | en curso | — | Tres direcciones dibujadas; el facilitador elige una |
| 0 — Cimientos | en curso | — | La app despliega y conecta a Supabase |
| 1 — Identidad y usuarios | pendiente | — | El admin crea un participante; esa persona entra con usuario + contraseña global y ve su pantalla |
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

### Diseño — en curso

Tres direcciones visuales dibujadas sobre la misma pantalla (`/temas/fundamentos-de-prompting`),
con el mismo contenido, para que la comparación sea de estilo y no de contenido: **Técnica**
(carbón templado, acento ámbar, mono para prompts, densidad alta), **Editorial** (hueso,
Newsreader + Karla, lectura larga cómoda en teléfono) y **Expresiva** (bloques de color,
numerales grandes, contraste alto).

Los design systems por defecto de claude.ai/design **no son alcanzables** desde una sesión
remota: `DesignSync` exige `/design-login` interactivo, y el `/design` de Claude Code es un
preview sin tokens de design system. Por eso las direcciones se dibujaron sobre vocabulario
shadcn propio en vez de heredar un kit.

Pendiente: la elección del facilitador. De la dirección ganadora salen los tokens de
`src/app/globals.css` — el canvas es la fuente de verdad del diseño, no una ilustración suelta.
