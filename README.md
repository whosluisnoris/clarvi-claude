# CLARVI CLAUDE

Plataforma de apoyo para una capacitación sobre el uso de Claude: **repositorio vivo de material
+ banco de práctica**, organizado por temas.

No es un LMS. No hay rutas de aprendizaje obligatorias, ni certificados, ni secuencia forzada.
El participante entra a consultar, practicar y evaluarse.

- **Qué construir y por qué:** `docs/brief-producto.md`
- **Estado del proyecto, decisiones y reglas:** `CLAUDE.md`

---

## ⚠️ Advertencia sobre el modelo de acceso

Esta aplicación usa **una sola contraseña global compartida** por todos los participantes. El
nombre de usuario determina la identidad; la contraseña es únicamente la llave de entrada al
grupo. Cualquiera que conozca la contraseña y un nombre de usuario puede entrar como esa persona.

**Este esquema no es apto si en algún momento se almacena información confidencial, o si las
calificaciones tienen consecuencias laborales.** Se eligió sabiendo que los resultados son
formativos y el contenido no es sensible.

Si eso cambia, hay que migrar a contraseñas individuales **antes** de seguir. El modelo de datos
ya lo soporta: basta dejar de rotar en bloque. Los administradores ya usan contraseña individual
y quedan fuera de la rotación global.

Mitigaciones vigentes: rotación de la contraseña con un clic desde el panel, límite de intentos
por IP y por usuario, mensaje de error genérico que no revela si un usuario existe, sesión de
12 h, y caducidad opcional por cohorte.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y llenar los valores
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run typecheck` | Tipos, sin emitir |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run e2e` | Flujos críticos (Playwright) |

## Base de datos

Las migraciones viven numeradas en `supabase/migrations/` y se aplican **en orden**. Nunca se
hace un cambio manual en el panel de Supabase sin su migración correspondiente: el repositorio
es la fuente de verdad del esquema.

Después de aplicar migraciones, correr el linter de seguridad de Supabase y verificar que no
haya ninguna tabla sin RLS ni función con `search_path` mutable.
