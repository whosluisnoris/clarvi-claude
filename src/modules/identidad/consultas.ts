import "server-only";

import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Cohorte, Perfil } from "@/tipos/base-de-datos";

export type PerfilConCohorte = Perfil & { cohorts: Cohorte | null };

/**
 * El perfil de quien hace la petición, o null si no hay sesión.
 *
 * Envuelto en `cache` de React para que varios Server Components del mismo
 * render (el encabezado, el guardia de /admin, la página) compartan una sola
 * consulta en vez de repetirla.
 *
 * Va por el cliente que respeta RLS a propósito: si la política de profiles
 * estuviera mal escrita, esto devolvería vacío y se notaría, en vez de
 * funcionar por privilegio y esconder el error hasta que alguien lo explote.
 */
export const perfilActual = cache(async (): Promise<PerfilConCohorte | null> => {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, cohorts(*)")
    .eq("id", user.id)
    .maybeSingle();

  return (data as PerfilConCohorte | null) ?? null;
});

export async function esAdmin(): Promise<boolean> {
  const perfil = await perfilActual();
  return perfil?.role === "admin" && perfil.is_active;
}

/**
 * Los ajustes que cualquier autenticado puede ver (nombre de la plataforma,
 * mensaje de bienvenida, logo).
 *
 * Pasa por la función SQL y no por un SELECT a app_settings porque esa tabla
 * guarda también la huella de la contraseña global y el dominio sintético:
 * abrir la lectura de la tabla entera para poder pintar un logo sería regalar
 * lo demás.
 */
export const ajustesPublicos = cache(async () => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("ajustes_publicos");
  return (data ?? {}) as Record<string, unknown>;
});
