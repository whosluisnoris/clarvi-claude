import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { entorno } from "@/lib/entorno";
import type { Database } from "@/tipos/base-de-datos";

/**
 * Cliente para Server Components y Server Actions.
 *
 * Actúa CON la sesión de quien hace la petición, así que sigue sujeto a RLS:
 * es el cliente correcto para todo salvo las tres operaciones que necesitan
 * privilegio (alta de usuarios, rotación de contraseña, escritura de la
 * bitácora), que usan lib/supabase/admin.ts.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient<Database>(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return almacen.getAll();
        },
        setAll(cookiesPorEscribir) {
          try {
            for (const { name, value, options } of cookiesPorEscribir) {
              almacen.set(name, value, options);
            }
          } catch {
            // Un Server Component no puede escribir cookies, y Next lanza si
            // se intenta. No es un error: el middleware ya refrescó la sesión
            // antes de que este componente se renderizara.
          }
        },
      },
    },
  );
}

/**
 * El usuario autenticado, verificado contra el servidor de Auth.
 *
 * Siempre `getUser()` y nunca `getSession()`: getSession se cree lo que diga
 * la cookie sin revalidar la firma del JWT, así que una cookie manipulada
 * pasaría. getUser hace la llamada y confirma.
 */
export async function usuarioActual() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
