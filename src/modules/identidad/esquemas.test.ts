import { describe, expect, it } from "vitest";
import {
  PATRON_USUARIO,
  correoSintetico,
  esquemaAcceso,
  normalizarUsuario,
  sugerirUsuario,
} from "./esquemas";

describe("normalizarUsuario", () => {
  it("recorta y baja a minúsculas", () => {
    expect(normalizarUsuario("  Mariana.Rios  ")).toBe("mariana.rios");
  });

  it("quita acentos, que es la diferencia que la gente no ve al teclear", () => {
    expect(normalizarUsuario("José.García")).toBe("jose.garcia");
    expect(normalizarUsuario("MUÑOZ")).toBe("munoz");
    expect(normalizarUsuario("Peña.Íñiguez")).toBe("pena.iniguez");
  });

  it("no inventa: deja los espacios para que la validación los rechace", () => {
    // Si aquí se “arreglaran”, dos entradas distintas resolverían al mismo
    // usuario y un dedazo entraría como otra persona.
    expect(normalizarUsuario("mariana rios")).toBe("mariana rios");
  });

  it("es idempotente", () => {
    const una = normalizarUsuario("José.García");
    expect(normalizarUsuario(una)).toBe(una);
  });

  it("aguanta la cadena vacía", () => {
    expect(normalizarUsuario("")).toBe("");
    expect(normalizarUsuario("   ")).toBe("");
  });
});

describe("PATRON_USUARIO", () => {
  it("acepta lo que la base acepta", () => {
    for (const valido of [
      "abc",
      "mariana.rios",
      "jorge_medina",
      "ana-valdez",
      "a1b",
      "a".repeat(32),
    ]) {
      expect(PATRON_USUARIO.test(valido), valido).toBe(true);
    }
  });

  it("rechaza lo que la base rechazaría", () => {
    for (const invalido of [
      "",
      "x", // un solo carácter: el grupo opcional lo dejaba pasar
      "ab", // menos de 3
      "a".repeat(33), // más de 32
      ".empieza.con.punto",
      "termina.con.punto.",
      "-guion-al-inicio",
      "con espacio",
      "MAYUSCULAS",
      "acentú.ado",
      "arroba@dentro",
    ]) {
      expect(PATRON_USUARIO.test(invalido), invalido).toBe(false);
    }
  });
});

describe("sugerirUsuario", () => {
  it("convierte un nombre visible en algo que la base acepta", () => {
    expect(sugerirUsuario("José García Ruiz")).toBe("jose.garcia.ruiz");
    expect(sugerirUsuario("Ana  Valdez")).toBe("ana.valdez");
    expect(sugerirUsuario("Ñoño Peña")).toBe("nono.pena");
  });

  it("no deja puntos colgando en los extremos", () => {
    expect(sugerirUsuario("  Ana  ")).toBe("ana");
    expect(sugerirUsuario("¿Ana?")).toBe("ana");
  });

  it("recorta a 32 sin dejar un separador al final", () => {
    const sugerido = sugerirUsuario("A".repeat(40));
    expect(sugerido.length).toBeLessThanOrEqual(32);
    expect(sugerido.endsWith(".")).toBe(false);
  });

  it("lo que sugiere siempre pasa el patrón, o queda vacío para que el admin decida", () => {
    for (const nombre of ["José García", "Ana", "Ñ", "12345", "!!!"]) {
      const sugerido = sugerirUsuario(nombre);
      if (sugerido.length > 0) {
        expect(
          PATRON_USUARIO.test(sugerido) || sugerido.length < 3,
          `${nombre} -> ${sugerido}`,
        ).toBe(true);
      }
    }
  });
});

describe("correoSintetico", () => {
  it("arma el correo interno a partir del usuario", () => {
    expect(correoSintetico("mariana.rios", "usuarios.interno.local")).toBe(
      "mariana.rios@usuarios.interno.local",
    );
  });

  it("normaliza el usuario antes de armarlo", () => {
    expect(correoSintetico("  José.García ", "interno.local")).toBe(
      "jose.garcia@interno.local",
    );
  });

  it("tolera que el dominio venga con arroba o en mayúsculas", () => {
    expect(correoSintetico("ana", "@Interno.Local")).toBe("ana@interno.local");
  });
});

describe("esquemaAcceso", () => {
  it("normaliza el usuario al validar", () => {
    const salida = esquemaAcceso.parse({
      usuario: "  Mariana.Rios ",
      contrasena: "loquesea",
    });
    expect(salida.usuario).toBe("mariana.rios");
  });

  it("rechaza usuario vacío y contraseña vacía", () => {
    expect(esquemaAcceso.safeParse({ usuario: "", contrasena: "x" }).success).toBe(
      false,
    );
    expect(
      esquemaAcceso.safeParse({ usuario: "ana", contrasena: "" }).success,
    ).toBe(false);
  });

  it("rechaza un usuario con espacios en vez de arreglarlo por su cuenta", () => {
    expect(
      esquemaAcceso.safeParse({ usuario: "mariana rios", contrasena: "x" })
        .success,
    ).toBe(false);
  });
});
