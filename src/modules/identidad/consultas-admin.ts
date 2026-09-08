import "server-only";

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esRegistroHuella } from "./huella-contrasena";
import type { Cohorte, Perfil } from "@/tipos/base-de-datos";

export type UsuarioListado = Perfil & {
  cohorts: Pick<Cohorte, "id" | "name"> | null;
};

export type PaginaUsuarios = {
  usuarios: UsuarioListado[];
  total: number;
};

export const USUARIOS_POR_PAGINA = 25;

/**
 * Listado de usuarios para el panel.
 *
 * Paginado y filtrado del lado del servidor desde el primer día, aunque hoy
 * sean decenas: traer la tabla entera al navegador para filtrarla ahí es la
 * clase de atajo que funciona con 20 personas y hay que rehacer con 200.
 *
 * Va por el cliente que respeta RLS: si la política de profiles estuviera mal
 * escrita, esto devolvería vacío para un no-admin y se notaría, en vez de
 * funcionar por privilegio.
 */
export async function listarUsuarios(opciones: {
  busqueda?: string;
  cohorteId?: string | null;
  activo?: boolean | null;
  pagina?: number;
}): Promise<PaginaUsuarios> {
  const supabase = await crearClienteServidor();
  const pagina = Math.max(1, opciones.pagina ?? 1);
  const desde = (pagina - 1) * USUARIOS_POR_PAGINA;

  let consulta = supabase
    .from("profiles")
    .select("*, cohorts(id, name)", { count: "exact" })
    .order("role", { ascending: true })
    .order("username", { ascending: true })
    .range(desde, desde + USUARIOS_POR_PAGINA - 1);

  const busqueda = opciones.busqueda?.trim();
  if (busqueda) {
    // Se escapan la coma y el paréntesis: PostgREST usa esos caracteres como
    // separadores en `or`, y sin escaparlos una búsqueda por "Ríos, Mariana"
    // se interpretaría como dos condiciones y rompería la consulta.
    const seguro = busqueda.replace(/[,()]/g, " ");
    consulta = consulta.or(
      `username.ilike.%${seguro}%,display_name.ilike.%${seguro}%`,
    );
  }

  if (opciones.cohorteId) consulta = consulta.eq("cohort_id", opciones.cohorteId);
  if (typeof opciones.activo === "boolean") {
    consulta = consulta.eq("is_active", opciones.activo);
  }

  const { data, count } = await consulta;

  return {
    usuarios: (data ?? []) as UsuarioListado[],
    total: count ?? 0,
  };
}

export async function listarCohortes(): Promise<Cohorte[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("cohorts")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type EstadoContrasenaGlobal = {
  huellaCorta: string | null;
  rotadaEn: string | null;
  diasDesdeRotacion: number | null;
  participantes: number;
};

/**
 * Estado de la contraseña del grupo, para el bloque destacado del panel.
 *
 * Devuelve la huella corta y cuándo se rotó — nunca la contraseña, que no se
 * guarda en ningún lado.
 */
export async function estadoContrasenaGlobal(): Promise<EstadoContrasenaGlobal> {
  const supabase = await crearClienteServidor();

  const [ajustes, conteo] = await Promise.all([
    supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["password_global_hash", "password_global_rotada_en"]),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "participante"),
  ]);

  const porClave = new Map(
    (ajustes.data ?? []).map((fila) => [fila.key, fila.value]),
  );

  const registro = porClave.get("password_global_hash");
  const huellaCorta = esRegistroHuella(registro) ? registro.huellaCorta : null;

  const rotadaBruto = porClave.get("password_global_rotada_en");
  const rotadaEn = typeof rotadaBruto === "string" ? rotadaBruto : null;

  const diasDesdeRotacion = rotadaEn
    ? Math.floor(
        (Date.now() - new Date(rotadaEn).getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  return {
    huellaCorta,
    rotadaEn,
    diasDesdeRotacion,
    participantes: conteo.count ?? 0,
  };
}
