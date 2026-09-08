import { describe, expect, it } from "vitest";
import {
  LIMITES,
  evaluarLimite,
  inicioDeVentana,
  ipDeLaPeticion,
} from "./limite-intentos";

describe("evaluarLimite", () => {
  it("deja pasar cuando no hay intentos fallidos", () => {
    const decision = evaluarLimite({ fallidosDelUsuario: 0, fallidosDeLaIp: 0 });
    expect(decision.permitido).toBe(true);
    if (decision.permitido) {
      expect(decision.intentosRestantes).toBe(LIMITES.maxPorUsuario - 1);
    }
  });

  it("bloquea justo al llegar al máximo por usuario, no después", () => {
    expect(
      evaluarLimite({
        fallidosDelUsuario: LIMITES.maxPorUsuario - 1,
        fallidosDeLaIp: 0,
      }).permitido,
    ).toBe(true);

    const bloqueado = evaluarLimite({
      fallidosDelUsuario: LIMITES.maxPorUsuario,
      fallidosDeLaIp: 0,
    });
    expect(bloqueado.permitido).toBe(false);
    if (!bloqueado.permitido) expect(bloqueado.motivo).toBe("usuario");
  });

  it("bloquea por IP para frenar el barrido de muchos usuarios", () => {
    const bloqueado = evaluarLimite({
      fallidosDelUsuario: 0,
      fallidosDeLaIp: LIMITES.maxPorIp,
    });
    expect(bloqueado.permitido).toBe(false);
    if (!bloqueado.permitido) expect(bloqueado.motivo).toBe("ip");
  });

  it("el límite por usuario gana cuando los dos se pasan", () => {
    const bloqueado = evaluarLimite({
      fallidosDelUsuario: 99,
      fallidosDeLaIp: 99,
    });
    expect(bloqueado.permitido).toBe(false);
    if (!bloqueado.permitido) expect(bloqueado.motivo).toBe("usuario");
  });

  it("los intentos restantes nunca son negativos", () => {
    const decision = evaluarLimite({
      fallidosDelUsuario: LIMITES.maxPorUsuario - 1,
      fallidosDeLaIp: 0,
    });
    if (decision.permitido) expect(decision.intentosRestantes).toBe(0);
  });
});

describe("inicioDeVentana", () => {
  it("retrocede exactamente la ventana configurada", () => {
    const ahora = new Date("2026-03-14T12:00:00.000Z");
    expect(inicioDeVentana(ahora)).toBe("2026-03-14T11:45:00.000Z");
  });
});

describe("ipDeLaPeticion", () => {
  it("toma el primer elemento de x-forwarded-for, que es el cliente original", () => {
    const cabeceras = new Headers({
      "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178",
    });
    expect(ipDeLaPeticion(cabeceras)).toBe("203.0.113.7");
  });

  it("cae a x-real-ip cuando no hay x-forwarded-for", () => {
    expect(ipDeLaPeticion(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe(
      "198.51.100.4",
    );
  });

  it("devuelve null cuando no hay nada, sin lanzar", () => {
    expect(ipDeLaPeticion(new Headers())).toBeNull();
  });

  it("no devuelve cadena vacía cuando la cabecera viene malformada", () => {
    expect(ipDeLaPeticion(new Headers({ "x-forwarded-for": " , 1.2.3.4" }))).toBe(
      "1.2.3.4",
    );
  });
});
