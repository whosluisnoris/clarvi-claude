import { describe, expect, it } from "vitest";
import { leerCsv } from "./csv";

describe("leerCsv", () => {
  it("lee un archivo bien formado con comas", () => {
    const { validas, problemas } = leerCsv(
      "usuario,nombre,cohorte\nmariana.rios,Mariana Ríos,Generación 01\njorge.medina,Jorge Medina,Generación 01",
    );
    expect(problemas).toHaveLength(0);
    expect(validas).toHaveLength(2);
    expect(validas[0]).toEqual({
      numero: 1,
      usuario: "mariana.rios",
      nombreVisible: "Mariana Ríos",
      cohorte: "Generación 01",
    });
  });

  it("quita el BOM que mete Excel, que si no rompe el encabezado", () => {
    const { validas, problemas } = leerCsv(
      "﻿usuario,nombre\nana.valdez,Ana Valdez",
    );
    expect(problemas).toHaveLength(0);
    expect(validas[0]?.usuario).toBe("ana.valdez");
  });

  it("acepta punto y coma, que es lo que exporta Excel en México", () => {
    const { validas } = leerCsv(
      "usuario;nombre;cohorte\npablo.sena;Pablo Sena;Generación 01",
    );
    expect(validas).toHaveLength(1);
    expect(validas[0]?.nombreVisible).toBe("Pablo Sena");
  });

  it("acepta tabuladores, por si pegaron desde una hoja de cálculo", () => {
    const { validas } = leerCsv("usuario\tnombre\nana.v\tAna Valdez");
    expect(validas[0]?.nombreVisible).toBe("Ana Valdez");
  });

  it("respeta las comas dentro de comillas", () => {
    const { validas } = leerCsv(
      'usuario,nombre\nmariana.rios,"Ríos Pérez, Mariana"',
    );
    expect(validas[0]?.nombreVisible).toBe("Ríos Pérez, Mariana");
  });

  it("entiende las comillas escapadas como dos comillas", () => {
    const { validas } = leerCsv('usuario,nombre\nana.v,"Ana ""La Jefa"" Valdez"');
    expect(validas[0]?.nombreVisible).toBe('Ana "La Jefa" Valdez');
  });

  it("deriva el usuario del nombre cuando no hay columna de usuario", () => {
    const { validas } = leerCsv("nombre\nJosé García Ruiz");
    expect(validas[0]?.usuario).toBe("jose.garcia.ruiz");
  });

  it("aguanta CRLF y líneas en blanco de más", () => {
    const { validas, problemas } = leerCsv(
      "usuario,nombre\r\nana.v,Ana Valdez\r\n\r\npablo.s,Pablo Sena\r\n",
    );
    expect(problemas).toHaveLength(0);
    expect(validas).toHaveLength(2);
  });

  it("señala la fila sin nombre en vez de tirar todo el archivo", () => {
    const { validas, problemas } = leerCsv(
      "usuario,nombre\nana.v,Ana Valdez\nsin.nombre,\npablo.s,Pablo Sena",
    );
    expect(validas).toHaveLength(2);
    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.numero).toBe(2);
    expect(problemas[0]?.motivo).toContain("nombre");
  });

  it("señala un usuario inválido con su motivo", () => {
    const { validas, problemas } = leerCsv(
      "usuario,nombre\nx,Nombre Corto\nana.v,Ana Valdez",
    );
    expect(validas).toHaveLength(1);
    expect(problemas[0]?.motivo).toContain("no sirve como nombre de usuario");
  });

  it("detecta repetidos dentro del mismo archivo y conserva el primero", () => {
    const { validas, problemas } = leerCsv(
      "usuario,nombre\nana.v,Ana Valdez\nana.v,Ana Otra",
    );
    expect(validas).toHaveLength(1);
    expect(validas[0]?.nombreVisible).toBe("Ana Valdez");
    expect(problemas[0]?.motivo).toContain("repetido");
  });

  it("normaliza acentos y mayúsculas del usuario que venga en el archivo", () => {
    const { validas } = leerCsv("usuario,nombre\nJosé.García,José García");
    expect(validas[0]?.usuario).toBe("jose.garcia");
  });

  it("acepta encabezados con otros nombres razonables", () => {
    const { validas } = leerCsv("username,display_name,grupo\nana.v,Ana,G1");
    expect(validas[0]).toMatchObject({ usuario: "ana.v", cohorte: "G1" });
  });

  it("avisa claro cuando falta la columna del nombre", () => {
    const { validas, problemas } = leerCsv("columna1,columna2\na,b");
    expect(validas).toHaveLength(0);
    expect(problemas[0]?.motivo).toContain("columna del nombre");
  });

  it("no lanza con archivo vacío ni con solo encabezado", () => {
    expect(leerCsv("")).toEqual({ validas: [], problemas: [] });
    expect(leerCsv("   \n  ")).toEqual({ validas: [], problemas: [] });
    expect(leerCsv("usuario,nombre")).toEqual({ validas: [], problemas: [] });
  });

  it("deja la cohorte en null cuando la columna existe pero viene vacía", () => {
    const { validas } = leerCsv("usuario,nombre,cohorte\nana.v,Ana Valdez,");
    expect(validas[0]?.cohorte).toBeNull();
  });
});
