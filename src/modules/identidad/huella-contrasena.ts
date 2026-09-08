import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Huella de verificación de la contraseña global.
 *
 * Sirve para UNA sola cosa: que el facilitador pueda confirmar si la
 * contraseña que tiene apuntada es la que está vigente, sin que la contraseña
 * se guarde en ningún lado. La aplicación nunca la necesita para autenticar —
 * de eso se encarga Supabase Auth, que tiene su propio hash.
 *
 * scrypt del módulo `crypto` de Node y no bcrypt: viene incluido, está
 * diseñado contra ataques de hardware dedicado, y evita una dependencia más
 * para algo que se ejecuta un puñado de veces al año.
 */

const LONGITUD_SAL = 16;
const LONGITUD_CLAVE = 32;
const COSTO = 16384; // 2^14

export type RegistroHuella = {
  algoritmo: "scrypt";
  sal: string;
  hash: string;
  /** Prefijo legible para mostrar en el panel, ej. "4f2a·9c81". */
  huellaCorta: string;
};

function formatearHuellaCorta(hash: string): string {
  return `${hash.slice(0, 4)}·${hash.slice(4, 8)}`;
}

export function derivarHuella(contrasena: string): RegistroHuella {
  const sal = randomBytes(LONGITUD_SAL).toString("hex");
  const hash = scryptSync(contrasena, sal, LONGITUD_CLAVE, {
    N: COSTO,
  }).toString("hex");

  return {
    algoritmo: "scrypt",
    sal,
    hash,
    huellaCorta: formatearHuellaCorta(hash),
  };
}

/**
 * Comparación en tiempo constante: aunque aquí el riesgo sea remoto (hay que
 * ser admin para llegar), comparar hashes con `===` es el tipo de atajo que
 * después se copia a un lugar donde sí importa.
 */
export function verificarHuella(
  contrasena: string,
  registro: RegistroHuella,
): boolean {
  if (registro.algoritmo !== "scrypt") return false;

  const candidato = scryptSync(contrasena, registro.sal, LONGITUD_CLAVE, {
    N: COSTO,
  });
  const guardado = Buffer.from(registro.hash, "hex");

  if (candidato.length !== guardado.length) return false;
  return timingSafeEqual(candidato, guardado);
}

export function esRegistroHuella(valor: unknown): valor is RegistroHuella {
  if (typeof valor !== "object" || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  return (
    posible.algoritmo === "scrypt" &&
    typeof posible.sal === "string" &&
    typeof posible.hash === "string" &&
    typeof posible.huellaCorta === "string"
  );
}
