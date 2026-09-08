"use client";

import { createBrowserClient } from "@supabase/ssr";
import { entorno } from "@/lib/entorno";
import type { Database } from "@/tipos/base-de-datos";

/**
 * Cliente del navegador. Solo clave anónima: todo lo que pueda hacer está
 * limitado por RLS.
 *
 * En esta fase casi no se usa — las lecturas van por Server Components y las
 * escrituras por Server Actions (brief §5.2.5). Existe para lo que de verdad
 * necesite reaccionar en el navegador.
 */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
