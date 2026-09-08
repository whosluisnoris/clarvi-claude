import { z } from "zod";

/**
 * Variables de entorno públicas, validadas al arrancar.
 *
 * Se leen con `process.env.NOMBRE_LITERAL` y no por índice dinámico: Next
 * sustituye las `NEXT_PUBLIC_*` en tiempo de compilación por coincidencia
 * textual, así que `process.env[nombre]` se compilaría a `undefined` en el
 * navegador sin avisar.
 *
 * La clave de servicio NO vive aquí. Está en lib/supabase/admin.ts, detrás de
 * `import "server-only"`, para que ni siquiera pueda importarse desde un
 * componente de cliente.
 */
const esquemaPublico = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY"),
});

const resultado = esquemaPublico.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!resultado.success) {
  const faltantes = resultado.error.issues
    .map((problema) => `  · ${problema.message}`)
    .join("\n");
  throw new Error(
    `Faltan variables de entorno o están mal escritas:\n${faltantes}\n\n` +
      `Copia .env.example a .env.local y llena los valores.`,
  );
}

export const entorno = resultado.data;
