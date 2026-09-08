"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { registrarAuditoria } from "./auditoria";
import { leerCsv, type FilaCsv } from "./csv";
import { correoSintetico, esquemaAltaUsuario, esquemaRotacion } from "./esquemas";
import { derivarHuella } from "./huella-contrasena";
import { ipDeLaPeticion } from "./limite-intentos";

/**
 * Acciones de administración de usuarios.
 *
 * REGLA QUE NO SE ROMPE: cada acción exportada de este archivo vuelve a
 * comprobar que quien llama es admin.
 *
 * Una Server Action no es una función privada: Next publica un endpoint HTTP
 * por cada una, y cualquiera con una sesión válida puede invocarla con el
 * cuerpo que se le antoje. Que el botón solo aparezca en /admin no protege
 * nada. La comprobación va aquí, del lado del servidor, en cada una.
 */

const DOMINIO_POR_DEFECTO = "usuarios.interno.local";
const TAMANO_LOTE = 25;

function dominioSintetico(): string {
  const configurado = process.env.DOMINIO_CORREO_SINTETICO?.trim();
  return configurado && configurado.length > 0
    ? configurado
    : DOMINIO_POR_DEFECTO;
}

export type ResultadoAccion<T = undefined> =
  | { ok: true; datos: T }
  | { ok: false; error: string };

/**
 * Guardia de rol. Devuelve el id del admin para poder firmar la auditoría, o
 * un error si quien llama no lo es.
 *
 * Va por el cliente que respeta RLS a propósito: si la política de profiles
 * estuviera mal, esto devolvería vacío y fallaría cerrado, en vez de funcionar
 * por privilegio y esconder el problema.
 */
async function exigirAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; error: string }
> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Necesitas iniciar sesión." };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil || perfil.role !== "admin" || !perfil.is_active) {
    return { ok: false, error: "No tienes permiso para hacer esto." };
  }

  return { ok: true, adminId: perfil.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// Alta individual
// ─────────────────────────────────────────────────────────────────────────────

export async function crearUsuario(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  const guardia = await exigirAdmin();
  if (!guardia.ok) return guardia;

  const validacion = esquemaAltaUsuario.safeParse({
    usuario: datos.get("usuario"),
    nombreVisible: datos.get("nombreVisible"),
    cohorteId: datos.get("cohorteId") || null,
    rol: datos.get("rol") ?? "participante",
    notas: datos.get("notas") || null,
    contrasena: datos.get("contrasena") || undefined,
  });

  if (!validacion.success) {
    return {
      ok: false,
      error: validacion.error.issues[0]?.message ?? "Revisa los datos.",
    };
  }

  const persona = validacion.data;

  // La contraseña se pide siempre y de forma explícita, incluso para un
  // participante que va a usar la del grupo. Es a propósito: la contraseña
  // global NO se guarda en claro en ningún lado (brief §4.3), solo su huella
  // de verificación. Que el admin la escriba al dar de alta es el precio de
  // no tenerla almacenada, y es el precio correcto.
  const contrasena = persona.contrasena;

  if (!contrasena) {
    return {
      ok: false,
      error:
        persona.rol === "admin"
          ? "Escribe una contraseña para este admin."
          : "Escribe la contraseña del grupo vigente, que es con la que va a entrar.",
    };
  }

  const admin = crearClienteAdmin();

  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: correoSintetico(persona.usuario, dominioSintetico()),
    password: contrasena,
    // Se confirma a mano: no hay correo real al que mandar nada, y sin esto la
    // persona no podría iniciar sesión.
    email_confirm: true,
    user_metadata: { username: persona.usuario },
  });

  if (errorAuth || !creado.user) {
    const yaExiste =
      errorAuth?.message?.toLowerCase().includes("already") ?? false;
    return {
      ok: false,
      error: yaExiste
        ? `El usuario "${persona.usuario}" ya existe.`
        : "No se pudo crear el usuario. Vuelve a intentar.",
    };
  }

  const { error: errorPerfil } = await admin.from("profiles").insert({
    id: creado.user.id,
    username: persona.usuario,
    display_name: persona.nombreVisible,
    role: persona.rol,
    cohort_id: persona.cohorteId,
    notes: persona.notas,
  });

  if (errorPerfil) {
    // COMPENSACIÓN. Sin esto queda un usuario huérfano en auth.users que
    // ocupa el correo sintético y bloquea para siempre ese nombre de usuario,
    // sin aparecer en ninguna pantalla del panel. Es el error más difícil de
    // diagnosticar de todo este flujo.
    await admin.auth.admin.deleteUser(creado.user.id);

    const duplicado = errorPerfil.code === "23505";
    return {
      ok: false,
      error: duplicado
        ? `El usuario "${persona.usuario}" ya existe.`
        : "No se pudo guardar el perfil. No se creó nada.",
    };
  }

  await registrarAuditoria({
    accion: "usuario.creado",
    actorId: guardia.adminId,
    tipoEntidad: "profile",
    entidadId: creado.user.id,
    metadata: { usuario: persona.usuario, rol: persona.rol },
    ip: ipDeLaPeticion(await headers()),
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, datos: undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// Alta masiva por CSV
// ─────────────────────────────────────────────────────────────────────────────

export type ResumenCarga = {
  creados: number;
  fallidos: { usuario: string; motivo: string }[];
};

export async function cargarUsuariosCsv(
  _previo: ResultadoAccion<ResumenCarga | undefined>,
  datos: FormData,
): Promise<ResultadoAccion<ResumenCarga | undefined>> {
  const guardia = await exigirAdmin();
  if (!guardia.ok) return guardia;

  const texto = String(datos.get("contenido") ?? "");
  const contrasena = String(datos.get("contrasena") ?? "");
  const cohorteId = (datos.get("cohorteId") as string) || null;

  if (contrasena.length === 0) {
    return {
      ok: false,
      error: "Escribe la contraseña del grupo con la que van a entrar.",
    };
  }

  const { validas } = leerCsv(texto);
  if (validas.length === 0) {
    return { ok: false, error: "El archivo no tiene ninguna fila utilizable." };
  }

  const admin = crearClienteAdmin();
  const fallidos: ResumenCarga["fallidos"] = [];
  let creados = 0;

  // En lotes y en serie dentro de cada lote: la Admin API de Auth no agradece
  // ráfagas, y una función de Vercel tiene tiempo límite. Con decenas de
  // usuarios sobra, y así crece sin reescribir (brief §11).
  for (let i = 0; i < validas.length; i += TAMANO_LOTE) {
    const lote = validas.slice(i, i + TAMANO_LOTE);

    for (const fila of lote) {
      const resultado = await altaIndividualDesdeCsv(
        admin,
        fila,
        contrasena,
        cohorteId,
      );
      if (resultado.ok) creados += 1;
      else fallidos.push({ usuario: fila.usuario, motivo: resultado.motivo });
    }
  }

  await registrarAuditoria({
    accion: "usuario.carga_masiva",
    actorId: guardia.adminId,
    metadata: { creados, fallidos: fallidos.length },
    ip: ipDeLaPeticion(await headers()),
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, datos: { creados, fallidos } };
}

async function altaIndividualDesdeCsv(
  admin: ReturnType<typeof crearClienteAdmin>,
  fila: FilaCsv,
  contrasena: string,
  cohorteId: string | null,
): Promise<{ ok: true } | { ok: false; motivo: string }> {
  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: correoSintetico(fila.usuario, dominioSintetico()),
    password: contrasena,
    email_confirm: true,
    user_metadata: { username: fila.usuario },
  });

  if (errorAuth || !creado.user) {
    return {
      ok: false,
      motivo: errorAuth?.message?.toLowerCase().includes("already")
        ? "Ya existe"
        : "No se pudo crear en Auth",
    };
  }

  const { error: errorPerfil } = await admin.from("profiles").insert({
    id: creado.user.id,
    username: fila.usuario,
    display_name: fila.nombreVisible,
    role: "participante",
    cohort_id: cohorteId,
  });

  if (errorPerfil) {
    await admin.auth.admin.deleteUser(creado.user.id);
    return {
      ok: false,
      motivo: errorPerfil.code === "23505" ? "Ya existe" : "No se pudo guardar",
    };
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Activar y desactivar
// ─────────────────────────────────────────────────────────────────────────────

export async function cambiarEstadoUsuario(
  usuarioId: string,
  activar: boolean,
): Promise<ResultadoAccion> {
  const guardia = await exigirAdmin();
  if (!guardia.ok) return guardia;

  if (usuarioId === guardia.adminId && !activar) {
    // Sin esto, un admin puede dejarse fuera de su propio panel y, si es el
    // único, dejar la plataforma sin nadie que pueda administrarla.
    return { ok: false, error: "No puedes desactivarte a ti mismo." };
  }

  const admin = crearClienteAdmin();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: activar })
    .eq("id", usuarioId);

  if (error) return { ok: false, error: "No se pudo cambiar el estado." };

  if (!activar) {
    // Desactivar sin cerrar la sesión abierta no desactiva nada: la persona
    // sigue navegando hasta que su token caduque.
    await admin.rpc("cerrar_sesiones_de", { id_usuario: usuarioId });
  }

  await registrarAuditoria({
    accion: activar ? "usuario.activado" : "usuario.desactivado",
    actorId: guardia.adminId,
    tipoEntidad: "profile",
    entidadId: usuarioId,
    ip: ipDeLaPeticion(await headers()),
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, datos: undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rotación de la contraseña global
// ─────────────────────────────────────────────────────────────────────────────

export type ResumenRotacion = {
  actualizados: number;
  fallidos: string[];
  huellaCorta: string;
};

export async function rotarContrasenaGlobal(
  _previo: ResultadoAccion<ResumenRotacion | undefined>,
  datos: FormData,
): Promise<ResultadoAccion<ResumenRotacion | undefined>> {
  const guardia = await exigirAdmin();
  if (!guardia.ok) return guardia;

  const validacion = esquemaRotacion.safeParse({
    contrasenaNueva: datos.get("contrasenaNueva"),
  });
  if (!validacion.success) {
    return {
      ok: false,
      error: validacion.error.issues[0]?.message ?? "Revisa la contraseña.",
    };
  }

  const nueva = validacion.data.contrasenaNueva;
  const admin = crearClienteAdmin();

  // Solo participantes: los admins tienen contraseña propia y quedan fuera
  // (brief §4.4). La contraseña compartida da acceso al material; nunca debe
  // dar acceso a la gestión de usuarios ni a los resultados de terceros.
  const { data: participantes, error: errorLista } = await admin
    .from("profiles")
    .select("id, username")
    .eq("role", "participante");

  if (errorLista || !participantes) {
    return { ok: false, error: "No se pudo obtener la lista de participantes." };
  }

  const fallidos: string[] = [];
  let actualizados = 0;

  for (let i = 0; i < participantes.length; i += TAMANO_LOTE) {
    const lote = participantes.slice(i, i + TAMANO_LOTE);

    for (const persona of lote) {
      const exito = await rotarUnaConReintento(admin, persona.id, nueva);
      if (exito) {
        actualizados += 1;
        // Cambiar la contraseña NO revoca los refresh tokens ya emitidos. Sin
        // esta llamada, quien tuviera sesión abierta seguiría dentro — y la
        // rotación existe precisamente para sacarlo.
        await admin.rpc("cerrar_sesiones_de", { id_usuario: persona.id });
      } else {
        fallidos.push(persona.username);
      }
    }
  }

  // La huella deja verificar después cuál está vigente, sin guardar la
  // contraseña en ningún lado.
  const huella = derivarHuella(nueva);
  await admin.from("app_settings").upsert([
    {
      key: "password_global_hash",
      value: huella as never,
      updated_by: guardia.adminId,
    },
    {
      key: "password_global_rotada_en",
      value: new Date().toISOString() as never,
      updated_by: guardia.adminId,
    },
  ]);

  await registrarAuditoria({
    accion: "password.rotada",
    actorId: guardia.adminId,
    metadata: {
      actualizados,
      fallidos: fallidos.length,
      huella_corta: huella.huellaCorta,
    },
    ip: ipDeLaPeticion(await headers()),
  });

  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    datos: { actualizados, fallidos, huellaCorta: huella.huellaCorta },
  };
}

/**
 * Un reintento con espera corta.
 *
 * La rotación es parcialmente idempotente: reintentar sobre alguien que ya
 * cambió no le hace daño. Por eso vale más reintentar que dejar a una persona
 * con la contraseña vieja — que es el peor resultado posible, porque la
 * rotación se hace justo cuando la vieja se filtró.
 */
async function rotarUnaConReintento(
  admin: ReturnType<typeof crearClienteAdmin>,
  usuarioId: string,
  contrasena: string,
): Promise<boolean> {
  for (let intento = 0; intento < 2; intento += 1) {
    const { error } = await admin.auth.admin.updateUserById(usuarioId, {
      password: contrasena,
    });
    if (!error) return true;
    if (intento === 0) await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}
