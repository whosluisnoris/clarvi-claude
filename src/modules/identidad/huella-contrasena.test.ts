import { describe, expect, it } from "vitest";
import {
  derivarHuella,
  esRegistroHuella,
  verificarHuella,
} from "./huella-contrasena";

describe("huella de la contraseña global", () => {
  it("verifica la contraseña correcta", () => {
    const registro = derivarHuella("capacitacion-2026");
    expect(verificarHuella("capacitacion-2026", registro)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", () => {
    const registro = derivarHuella("capacitacion-2026");
    expect(verificarHuella("capacitacion-2027", registro)).toBe(false);
    expect(verificarHuella("", registro)).toBe(false);
  });

  it("usa sal distinta cada vez, así que dos huellas de la misma contraseña difieren", () => {
    const a = derivarHuella("misma");
    const b = derivarHuella("misma");
    expect(a.hash).not.toBe(b.hash);
    expect(a.sal).not.toBe(b.sal);
    // …y aun así ambas verifican
    expect(verificarHuella("misma", a)).toBe(true);
    expect(verificarHuella("misma", b)).toBe(true);
  });

  it("no guarda la contraseña en ninguna parte del registro", () => {
    const secreta = "contrasena-muy-secreta-2026";
    const registro = derivarHuella(secreta);
    expect(JSON.stringify(registro)).not.toContain(secreta);
  });

  it("la huella corta es legible y se deriva del hash", () => {
    const registro = derivarHuella("algo");
    expect(registro.huellaCorta).toMatch(/^[0-9a-f]{4}·[0-9a-f]{4}$/);
    expect(registro.hash.startsWith(registro.huellaCorta.replace("·", ""))).toBe(
      true,
    );
  });

  it("aguanta contraseñas con acentos y emoji sin lanzar", () => {
    const registro = derivarHuella("contraseña-ñandú-🔐");
    expect(verificarHuella("contraseña-ñandú-🔐", registro)).toBe(true);
    expect(verificarHuella("contrasena-nandu", registro)).toBe(false);
  });

  it("esRegistroHuella distingue un registro válido de basura", () => {
    expect(esRegistroHuella(derivarHuella("x"))).toBe(true);
    expect(esRegistroHuella(null)).toBe(false);
    expect(esRegistroHuella({})).toBe(false);
    expect(esRegistroHuella({ algoritmo: "md5", sal: "a", hash: "b" })).toBe(
      false,
    );
    expect(esRegistroHuella("cadena")).toBe(false);
  });

  it("un registro con algoritmo desconocido nunca verifica", () => {
    const registro = derivarHuella("x");
    const alterado = { ...registro, algoritmo: "md5" as "scrypt" };
    expect(verificarHuella("x", alterado)).toBe(false);
  });
});
