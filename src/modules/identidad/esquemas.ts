import { z } from "zod";
import { copy } from "@/lib/copy";

/**
 * Esquemas y normalización de identidad.
 *
 * Todo lo de este archivo son funciones puras, sin acceso a red ni a base de
 * datos, para poder probarlas sin montar nada (brief §18). El mismo esquema lo
 * usan el formulario en el cliente y la acción de servidor: una sola fuente de
 * verdad de qué es un usuario válido (brief §5.1).
 */

/**
 * Lo que la base acepta como username, expresado igual que la restricción
 * CHECK de la migración 0006. Si uno cambia, el otro también.
 *
 * Entre 3 y 32 caracteres, empieza y termina en letra o número, y en medio
 * admite punto, guion y guion bajo.
 *
 * Sin grupo opcional: la primera versión era
 * `^[a-z0-9]([a-z0-9._-]{1,30}[a-z0-9])?$` y al poder saltarse el grupo
 * aceptaba un usuario de UN solo carácter — justo lo que el mínimo de 3
 * pretendía impedir. Una prueba lo encontró; la migración 0006 cierra el
 * mismo hueco en la base.
 */
export const PATRON_USUARIO = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/;

/**
 * Normaliza lo que la persona escribió en el campo de usuario.
 *
 * Conservadora a propósito: recorta, baja a minúsculas y quita acentos, porque
 * son diferencias que la gente no percibe al teclear. NO arregla espacios ni
 * caracteres raros — eso se rechaza en la validación, no se adivina. Adivinar
 * aquí haría que dos entradas distintas resolvieran al mismo usuario.
 *
 * Quitar acentos importa de verdad: "josé.garcía" y "jose.garcia" se ven casi
 * igual en un teclado y la base solo guarda la segunda.
 */
export function normalizarUsuario(entrada: string): string {
  return entrada
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // \u0300-\u036f es el bloque de marcas diacríticas combinantes: lo que NFD
    // separa de la letra base. Escrito con escapes a propósito — los caracteres
    // literales son invisibles en un editor y se rompen sin que nadie lo note.
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Propone un username a partir de un nombre visible. Solo para el alta y la
 * carga por CSV, nunca para el login: aquí sí conviene ser generoso, porque el
 * admin está capturando y agradece que "José García Ruiz" se convierta solo.
 */
export function sugerirUsuario(nombreVisible: string): string {
  const base = normalizarUsuario(nombreVisible)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return base.slice(0, 32).replace(/[^a-z0-9]+$/, "");
}

/**
 * Traduce un username al correo sintético con el que vive en auth.users.
 *
 * El correo nunca se muestra ni se pide: existe solo porque Supabase Auth
 * necesita un identificador con forma de correo, y aprovecharlo nos deja RLS,
 * refresh tokens y expiración de sesión resueltos sin criptografía casera
 * (brief §4.2).
 *
 * Ojo: cambiar el dominio después de dar de alta gente rompe el login de esas
 * personas. Por eso el dominio vigente también queda guardado en app_settings.
 */
export function correoSintetico(usuario: string, dominio: string): string {
  const limpio = dominio.trim().replace(/^@+/, "").toLowerCase();
  return `${normalizarUsuario(usuario)}@${limpio}`;
}

export const esquemaUsuario = z
  .string()
  .transform(normalizarUsuario)
  .pipe(
    z
      .string()
      .min(1, copy.acceso.validacionUsuarioVacio)
      .regex(PATRON_USUARIO, copy.acceso.validacionUsuarioFormato),
  );

export const esquemaAcceso = z.object({
  usuario: esquemaUsuario,
  contrasena: z.string().min(1, copy.acceso.validacionContrasenaVacia),
});

export type DatosAcceso = z.infer<typeof esquemaAcceso>;

export const esquemaAltaUsuario = z.object({
  usuario: esquemaUsuario,
  nombreVisible: z
    .string()
    .trim()
    .min(1, "Escribe el nombre visible.")
    .max(120, "El nombre visible no puede pasar de 120 caracteres."),
  cohorteId: z.uuid().nullable().default(null),
  rol: z.enum(["admin", "participante"]).default("participante"),
  notas: z.string().trim().max(2000).nullable().default(null),
  // Solo para admins: los participantes reciben la contraseña global vigente.
  contrasena: z
    .string()
    .min(12, "La contraseña de un admin debe tener al menos 12 caracteres.")
    .optional(),
});

export type DatosAltaUsuario = z.infer<typeof esquemaAltaUsuario>;

export const esquemaRotacion = z.object({
  contrasenaNueva: z
    .string()
    .min(10, "La contraseña del grupo debe tener al menos 10 caracteres.")
    .max(72, "La contraseña no puede pasar de 72 caracteres."),
});
