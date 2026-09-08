import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { entorno } from "@/lib/entorno";
import type { Database } from "@/tipos/base-de-datos";

/**
 * ⚠️ CLIENTE CON CLAVE DE SERVICIO — SALTA RLS POR COMPLETO ⚠️
 *
 * `import "server-only"` en la primera línea no es decorativo: hace que la
 * compilación FALLE si algún día este archivo se importa, aunque sea de forma
 * transitiva, desde un componente de cliente. Es la única barrera automática
 * contra filtrar la clave al navegador; no quitarla.
 *
 * Se usa exclusivamente en tres lugares (brief §5.2.2):
 *   1. Alta y baja de usuarios (necesita la Admin API de Auth)
 *   2. Rotación de la contraseña global
 *   3. Escritura de audit_log y login_attempts, que no tienen política de
 *      INSERT justamente para que nadie más pueda tocarlos
 *
 * Para cualquier otra cosa se usa lib/supabase/servidor.ts, que respeta RLS.
 * Si te encuentras alcanzando este cliente para una consulta normal, casi
 * siempre significa que falta una política, no que haga falta privilegio.
 */

/**
 * La clave se lee y valida DENTRO de la función, no al cargar el módulo.
 *
 * Leerla arriba hacía fallar `next build` entero: al recolectar los datos de
 * las páginas, Next evalúa los módulos, y una página que ni siquiera usa el
 * cliente de servicio tumbaba la compilación por un secreto que solo hace
 * falta en tiempo de ejecución. Además obliga a tener el secreto disponible
 * en el entorno de build, que es justo donde no debería hacer falta.
 */
function leerClaveDeServicio(): string {
  return z
    .string()
    .min(1, "Falta SUPABASE_SERVICE_ROLE_KEY (solo servidor, sin NEXT_PUBLIC_)")
    .parse(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function crearClienteAdmin() {
  return createClient<Database>(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    leerClaveDeServicio(),
    {
      auth: {
        // Este cliente no representa a nadie: no debe persistir ni refrescar
        // sesión, ni leer la cookie de quien hizo la petición.
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}
