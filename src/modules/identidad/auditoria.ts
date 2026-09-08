import "server-only";

import { crearClienteAdmin } from "@/lib/supabase/admin";

/**
 * Bitácora de auditoría (brief §10.9).
 *
 * Se escribe SIEMPRE con la clave de servicio, porque audit_log no tiene
 * política de INSERT: ni un admin autenticado puede escribir ahí por su
 * cuenta, y nadie puede editar ni borrar lo ya escrito. Una bitácora que el
 * auditado puede modificar no sirve de nada.
 */

export type AccionAuditada =
  | "usuario.creado"
  | "usuario.actualizado"
  | "usuario.activado"
  | "usuario.desactivado"
  | "usuario.carga_masiva"
  | "cohorte.creada"
  | "cohorte.actualizada"
  | "password.rotada"
  | "sesion.iniciada"
  | "sesion.cerrada";

export async function registrarAuditoria(evento: {
  accion: AccionAuditada;
  actorId?: string | null;
  tipoEntidad?: string | null;
  entidadId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  const admin = crearClienteAdmin();

  const { error } = await admin.from("audit_log").insert({
    action: evento.accion,
    actor_id: evento.actorId ?? null,
    entity_type: evento.tipoEntidad ?? null,
    entity_id: evento.entidadId ?? null,
    metadata: (evento.metadata ?? {}) as never,
    ip: evento.ip ?? null,
  });

  if (error) {
    // Que falle la bitácora no debe tumbar la operación que se estaba
    // auditando: sería peor dejar a medias un alta de usuario por no poder
    // registrarla. Queda en los logs del servidor para poder investigarlo.
    console.error("[auditoría] no se pudo registrar", evento.accion, error);
  }
}
