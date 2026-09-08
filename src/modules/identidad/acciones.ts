"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { copy } from "@/lib/copy";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { registrarAuditoria } from "./auditoria";
import { correoSintetico, esquemaAcceso } from "./esquemas";
import {
  evaluarLimite,
  inicioDeVentana,
  ipDeLaPeticion,
} from "./limite-intentos";

export type EstadoAcceso = { error: string | null };

const DOMINIO_POR_DEFECTO = "usuarios.interno.local";

function dominioSintetico(): string {
  return (
    z
      .string()
      .min(1)
      .safeParse(process.env.DOMINIO_CORREO_SINTETICO).data ??
    DOMINIO_POR_DEFECTO
  );
}

/**
 * Inicio de sesión con nombre de usuario.
 *
 * El orden de los pasos importa y no es casual:
 *
 *   1. Validar y normalizar ANTES de tocar nada. Si la entrada no puede ser un
 *      usuario válido, no vale la pena gastar una consulta ni una llamada.
 *   2. Consultar el límite de intentos ANTES de llamar a Auth. Si ya está
 *      bloqueado, no se le da a un atacante ni la señal de tiempo que deja una
 *      verificación real de contraseña.
 *   3. Recién entonces autenticar.
 *   4. Verificar que la persona siga habilitada y su cohorte vigente. Auth no
 *      sabe nada de eso; si falla, se cierra la sesión que se acaba de abrir.
 *
 * Todos los caminos de fallo devuelven EL MISMO mensaje (brief §4.5). Un
 * mensaje que distinga "ese usuario no existe" de "contraseña incorrecta"
 * convierte el formulario de acceso en un directorio de quién está inscrito.
 */
export async function iniciarSesion(
  _estadoPrevio: EstadoAcceso,
  datosFormulario: FormData,
): Promise<EstadoAcceso> {
  const validacion = esquemaAcceso.safeParse({
    usuario: datosFormulario.get("usuario"),
    contrasena: datosFormulario.get("contrasena"),
  });

  if (!validacion.success) {
    // Ni siquiera se registra el intento: no llegó a ser uno.
    return { error: copy.acceso.errorGenerico };
  }

  const { usuario, contrasena } = validacion.data;
  const ip = ipDeLaPeticion(await headers());
  const admin = crearClienteAdmin();
  const desde = inicioDeVentana();

  // ── Límite de intentos ────────────────────────────────────────────────
  // Con la clave de servicio porque login_attempts no tiene política de
  // lectura ni de escritura para nadie: quien está intentando entrar todavía
  // no tiene sesión, y aunque la tuviera no debería poder consultar ni
  // ensuciar el contador.
  const [porUsuario, porIp] = await Promise.all([
    admin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("username_intento", usuario)
      .eq("exitoso", false)
      .gte("created_at", desde),
    ip
      ? admin
          .from("login_attempts")
          .select("id", { count: "exact", head: true })
          .eq("ip", ip)
          .eq("exitoso", false)
          .gte("created_at", desde)
      : Promise.resolve({ count: 0 }),
  ]);

  const decision = evaluarLimite({
    fallidosDelUsuario: porUsuario.count ?? 0,
    fallidosDeLaIp: porIp.count ?? 0,
  });

  if (!decision.permitido) {
    await admin.from("login_attempts").insert({
      username_intento: usuario,
      ip,
      exitoso: false,
    });
    return { error: copy.acceso.errorBloqueado };
  }

  // ── Autenticación ─────────────────────────────────────────────────────
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correoSintetico(usuario, dominioSintetico()),
    password: contrasena,
  });

  const registrarFallo = async () => {
    await admin.from("login_attempts").insert({
      username_intento: usuario,
      ip,
      exitoso: false,
    });
  };

  if (error || !data.user) {
    await registrarFallo();
    return {
      error:
        decision.intentosRestantes > 0
          ? copy.acceso.errorIntentosRestantes(decision.intentosRestantes)
          : copy.acceso.errorGenerico,
    };
  }

  // ── Habilitación ──────────────────────────────────────────────────────
  // Auth solo sabe que la contraseña es correcta. Que la persona siga activa y
  // que su cohorte no haya vencido vive en nuestras tablas, y hay que
  // comprobarlo aquí: si falla, la sesión recién abierta se cierra.
  const { data: perfil } = await admin
    .from("profiles")
    .select("id, is_active, role, cohorts(is_active, ends_at)")
    .eq("id", data.user.id)
    .maybeSingle();

  const cohorte = perfil?.cohorts as
    | { is_active: boolean; ends_at: string | null }
    | null
    | undefined;

  const cohorteVigente =
    !cohorte ||
    (cohorte.is_active &&
      (cohorte.ends_at === null || new Date(cohorte.ends_at) > new Date()));

  if (!perfil || !perfil.is_active || !cohorteVigente) {
    await supabase.auth.signOut();
    await registrarFallo();
    return { error: copy.acceso.errorGenerico };
  }

  // ── Éxito ─────────────────────────────────────────────────────────────
  await Promise.all([
    admin.from("login_attempts").insert({
      username_intento: usuario,
      ip,
      exitoso: true,
    }),
    admin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.user.id),
    registrarAuditoria({
      accion: "sesion.iniciada",
      actorId: data.user.id,
      tipoEntidad: "profile",
      entidadId: data.user.id,
      ip,
    }),
  ]);

  // redirect lanza por dentro, así que va fuera del try/catch de arriba y al
  // final: nada después de esta línea se ejecuta.
  redirect(perfil.role === "admin" ? "/admin" : "/");
}

export async function cerrarSesion(): Promise<never> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  if (user) {
    await registrarAuditoria({
      accion: "sesion.cerrada",
      actorId: user.id,
      tipoEntidad: "profile",
      entidadId: user.id,
      ip: ipDeLaPeticion(await headers()),
    });
  }

  redirect("/login");
}
