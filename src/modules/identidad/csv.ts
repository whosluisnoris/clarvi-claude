import { PATRON_USUARIO, normalizarUsuario, sugerirUsuario } from "./esquemas";

/**
 * Lectura del CSV de alta masiva.
 *
 * Función pura, sin base de datos: recibe el texto del archivo y devuelve qué
 * filas sirven y cuáles no, con el motivo. La previsualización del panel se
 * arma con esto mismo, así que lo que el facilitador ve antes de confirmar es
 * exactamente lo que se va a guardar.
 *
 * Los tres detalles que rompen esto en la vida real, y que aquí están
 * cubiertos:
 *
 *   · El BOM que Excel mete al inicio, que convierte la primera columna en
 *     "﻿usuario" y hace que no se encuentre el encabezado.
 *   · El punto y coma como separador, que es lo que produce Excel en
 *     configuración regional de México.
 *   · Los campos entre comillas con comas dentro, típicos de un nombre
 *     capturado como "Ríos Pérez, Mariana".
 */

export type FilaCsv = {
  /** 1 = primera fila de datos, sin contar el encabezado. */
  numero: number;
  usuario: string;
  nombreVisible: string;
  cohorte: string | null;
};

export type ProblemaCsv = {
  numero: number;
  crudo: string;
  motivo: string;
};

export type LecturaCsv = {
  validas: FilaCsv[];
  problemas: ProblemaCsv[];
};

/** Detecta el separador contando cuál aparece más en el encabezado. */
function detectarSeparador(encabezado: string): "," | ";" | "\t" {
  const comas = (encabezado.match(/,/g) ?? []).length;
  const puntoYComa = (encabezado.match(/;/g) ?? []).length;
  const tabuladores = (encabezado.match(/\t/g) ?? []).length;

  if (puntoYComa > comas && puntoYComa >= tabuladores) return ";";
  if (tabuladores > comas && tabuladores > puntoYComa) return "\t";
  return ",";
}

/** Parte una línea respetando las comillas dobles y el escape "" dentro. */
function partirLinea(linea: string, separador: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let dentroDeComillas = false;

  for (let i = 0; i < linea.length; i += 1) {
    const caracter = linea[i];

    if (caracter === '"') {
      if (dentroDeComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else {
        dentroDeComillas = !dentroDeComillas;
      }
      continue;
    }

    if (caracter === separador && !dentroDeComillas) {
      campos.push(actual);
      actual = "";
      continue;
    }

    actual += caracter;
  }

  campos.push(actual);
  return campos.map((campo) => campo.trim());
}

/**
 * Normaliza un nombre de columna para compararlo: minúsculas, sin acentos, y
 * punto/guion/guion bajo tratados como espacio.
 *
 * Se aplica a AMBOS lados de la comparación. Aplicarla solo a las columnas del
 * archivo hacía que "display_name" se convirtiera en "display name" y ya no
 * coincidiera con el alias escrito como "display_name" — el archivo se
 * rechazaba entero diciendo que faltaba la columna del nombre.
 */
function normalizarEncabezado(columna: string): string {
  return normalizarUsuario(columna)
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nombres de columna que se aceptan, para no obligar a un formato exacto. */
const ALIAS = {
  usuario: ["usuario", "username", "user", "nombre de usuario"],
  nombre: ["nombre", "nombre visible", "nombre completo", "display name", "name"],
  cohorte: ["cohorte", "cohort", "grupo", "generacion"],
} as const;

function indiceDe(encabezados: string[], alias: readonly string[]): number {
  return encabezados.findIndex((columna) =>
    alias.includes(normalizarEncabezado(columna) as (typeof alias)[number]),
  );
}

export function leerCsv(texto: string): LecturaCsv {
  // El BOM de Excel va primero: si no se quita, el encabezado no se reconoce.
  const limpio = texto.replace(/^﻿/, "");
  const lineas = limpio
    .split(/\r\n|\n|\r/)
    .filter((linea) => linea.trim().length > 0);

  if (lineas.length === 0) {
    return { validas: [], problemas: [] };
  }

  const separador = detectarSeparador(lineas[0] ?? "");
  const encabezados = partirLinea(lineas[0] ?? "", separador);

  const iUsuario = indiceDe(encabezados, ALIAS.usuario);
  const iNombre = indiceDe(encabezados, ALIAS.nombre);
  const iCohorte = indiceDe(encabezados, ALIAS.cohorte);

  if (iNombre === -1) {
    return {
      validas: [],
      problemas: [
        {
          numero: 0,
          crudo: lineas[0] ?? "",
          motivo:
            "No se encontró la columna del nombre. El archivo necesita al menos una columna llamada nombre.",
        },
      ],
    };
  }

  const validas: FilaCsv[] = [];
  const problemas: ProblemaCsv[] = [];
  const vistos = new Set<string>();

  for (let i = 1; i < lineas.length; i += 1) {
    const crudo = lineas[i] ?? "";
    const numero = i;
    const campos = partirLinea(crudo, separador);

    const nombreVisible = (campos[iNombre] ?? "").trim();
    if (nombreVisible.length === 0) {
      problemas.push({ numero, crudo, motivo: "Falta el nombre visible." });
      continue;
    }

    // Si no hay columna de usuario, se propone uno a partir del nombre: es lo
    // que el facilitador haría a mano, y se le muestra antes de confirmar.
    const usuarioCrudo =
      iUsuario === -1 ? "" : (campos[iUsuario] ?? "").trim();
    const usuario =
      usuarioCrudo.length > 0
        ? normalizarUsuario(usuarioCrudo)
        : sugerirUsuario(nombreVisible);

    if (!PATRON_USUARIO.test(usuario)) {
      problemas.push({
        numero,
        crudo,
        motivo:
          usuario.length === 0
            ? "No se pudo derivar un nombre de usuario a partir del nombre."
            : `"${usuario}" no sirve como nombre de usuario: solo minúsculas, números, punto, guion y guion bajo, entre 3 y 32 caracteres.`,
      });
      continue;
    }

    if (vistos.has(usuario)) {
      problemas.push({
        numero,
        crudo,
        motivo: `"${usuario}" está repetido dentro del mismo archivo.`,
      });
      continue;
    }

    vistos.add(usuario);
    const cohorte =
      iCohorte === -1 ? null : (campos[iCohorte] ?? "").trim() || null;

    validas.push({ numero, usuario, nombreVisible, cohorte });
  }

  return { validas, problemas };
}
