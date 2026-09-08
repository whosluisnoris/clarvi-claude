/**
 * Límite de intentos de acceso (brief §4.5 y §10.5).
 *
 * La decisión es una función pura: recibe cuántos intentos fallidos hubo y
 * devuelve si se deja pasar. Así se puede probar el comportamiento —
 * especialmente los bordes— sin base de datos ni reloj falso.
 *
 * Dos contadores con propósitos distintos:
 *
 *   · POR USUARIO protege a una persona concreta de que le adivinen la
 *     contraseña. Es estricto, porque la contraseña es compartida: si alguien
 *     la conoce, lo único que le falta para suplantar es el nombre de usuario.
 *
 *   · POR IP protege contra el barrido — probar la contraseña conocida contra
 *     muchos usuarios. Es más holgado porque en una capacitación presencial
 *     todo el grupo suele salir por la misma IP, y bloquear ahí dejaría fuera
 *     al salón entero.
 */

export const LIMITES = {
  ventanaMinutos: 15,
  maxPorUsuario: 5,
  maxPorIp: 20,
} as const;

export type DecisionAcceso =
  | { permitido: true; intentosRestantes: number }
  | { permitido: false; motivo: "usuario" | "ip" };

export function evaluarLimite(conteos: {
  fallidosDelUsuario: number;
  fallidosDeLaIp: number;
}): DecisionAcceso {
  if (conteos.fallidosDelUsuario >= LIMITES.maxPorUsuario) {
    return { permitido: false, motivo: "usuario" };
  }

  if (conteos.fallidosDeLaIp >= LIMITES.maxPorIp) {
    return { permitido: false, motivo: "ip" };
  }

  return {
    permitido: true,
    // Cuántos le quedan DESPUÉS de este intento, que es lo que tiene sentido
    // decirle a alguien que está a punto de fallar otra vez.
    intentosRestantes: Math.max(
      0,
      LIMITES.maxPorUsuario - conteos.fallidosDelUsuario - 1,
    ),
  };
}

/**
 * Instante desde el cual cuentan los intentos.
 *
 * Recibe el "ahora" en vez de llamar a Date.now() por dentro, para que las
 * pruebas puedan fijarlo sin parchar el reloj global.
 */
export function inicioDeVentana(ahora: Date = new Date()): string {
  return new Date(
    ahora.getTime() - LIMITES.ventanaMinutos * 60 * 1000,
  ).toISOString();
}

/**
 * Saca la IP del cliente de las cabeceras de proxy.
 *
 * En Vercel siempre hay un proxy delante, así que la IP del socket es la del
 * borde y no sirve. x-forwarded-for llega como lista separada por comas donde
 * el PRIMER elemento es el cliente original.
 *
 * Es falsificable por quien controle la petición, y eso está asumido: el
 * contador por IP mitiga barridos automáticos, no a un atacante decidido. El
 * contador por usuario, que no depende de esto, es el que hace el trabajo
 * serio.
 */
export function ipDeLaPeticion(cabeceras: Headers): string | null {
  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) {
    // Se toma el primer elemento NO VACÍO, no el primero a secas: una cabecera
    // malformada como " , 1.2.3.4" dejaría la IP en null y con ella se caería
    // el límite por IP de esa petición, en silencio.
    const primera = reenviada
      .split(",")
      .map((parte) => parte.trim())
      .find((parte) => parte.length > 0);
    if (primera) return primera;
  }

  const real = cabeceras.get("x-real-ip")?.trim();
  return real && real.length > 0 ? real : null;
}
