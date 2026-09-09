/**
 * Datos de arranque para poder probar sin capturar nada a mano (brief §15).
 *
 * Crea 1 admin, 2 cohortes y 8 participantes. Los temas, recursos, ejercicios
 * y prompts que el brief también menciona llegan con sus fases: sus tablas
 * todavía no existen.
 *
 * IDEMPOTENTE: se puede correr las veces que haga falta. Si un usuario ya
 * existe se salta y avisa, en vez de fallar a medias dejando la base en un
 * estado que nadie sabe describir.
 *
 * Uso:
 *   node --experimental-strip-types scripts/semilla.ts
 *
 * Necesita en el entorno (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY     ← solo servidor, nunca con NEXT_PUBLIC_
 *   DOMINIO_CORREO_SINTETICO
 *   ADMIN_INICIAL_USUARIO
 *   ADMIN_INICIAL_PASSWORD
 *   PASSWORD_GRUPO_SEMILLA        ← la que van a compartir los participantes
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Database } from "../src/tipos/base-de-datos.ts";

// ── Entorno ─────────────────────────────────────────────────────────────────
// Se lee .env.local a mano: este script corre fuera de Next, que es quien
// normalmente carga ese archivo.
function cargarEnvLocal(): void {
  try {
    const contenido = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const linea of contenido.split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const separador = limpia.indexOf("=");
      if (separador === -1) continue;
      const clave = limpia.slice(0, separador).trim();
      const valor = limpia.slice(separador + 1).trim();
      if (!process.env[clave]) process.env[clave] = valor;
    }
  } catch {
    // Sin .env.local se sigue: las variables pueden venir del entorno.
  }
}

cargarEnvLocal();

function exigir(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) {
    console.error(`\n✗ Falta la variable ${nombre}.\n`);
    process.exit(1);
  }
  return valor;
}

const URL_SUPABASE = exigir("NEXT_PUBLIC_SUPABASE_URL");
const CLAVE_SERVICIO = exigir("SUPABASE_SERVICE_ROLE_KEY");
const DOMINIO = process.env.DOMINIO_CORREO_SINTETICO?.trim() || "usuarios.interno.local";
const ADMIN_USUARIO = exigir("ADMIN_INICIAL_USUARIO");
const ADMIN_PASSWORD = exigir("ADMIN_INICIAL_PASSWORD");
const PASSWORD_GRUPO = exigir("PASSWORD_GRUPO_SEMILLA");

if (ADMIN_PASSWORD.length < 12) {
  console.error("\n✗ ADMIN_INICIAL_PASSWORD debe tener al menos 12 caracteres.\n");
  process.exit(1);
}

const supabase = createClient<Database>(URL_SUPABASE, CLAVE_SERVICIO, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const correoDe = (usuario: string) => `${usuario}@${DOMINIO}`;

// ── Alta idempotente ────────────────────────────────────────────────────────
async function crearPersona(persona: {
  usuario: string;
  nombre: string;
  rol: "admin" | "participante";
  contrasena: string;
  cohorteId: string | null;
}): Promise<"creado" | "ya-existia" | "error"> {
  const { data: existente } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", persona.usuario)
    .maybeSingle();

  if (existente) return "ya-existia";

  const { data: creado, error: errorAuth } = await supabase.auth.admin.createUser({
    email: correoDe(persona.usuario),
    password: persona.contrasena,
    email_confirm: true,
    user_metadata: { username: persona.usuario },
  });

  if (errorAuth || !creado.user) {
    // Puede existir en auth.users sin perfil, de un intento anterior que falló
    // entre las dos escrituras. Se avisa en vez de fingir que se creó.
    console.error(`  ✗ ${persona.usuario}: ${errorAuth?.message ?? "sin usuario"}`);
    return "error";
  }

  const { error: errorPerfil } = await supabase.from("profiles").insert({
    id: creado.user.id,
    username: persona.usuario,
    display_name: persona.nombre,
    role: persona.rol,
    cohort_id: persona.cohorteId,
  });

  if (errorPerfil) {
    // Misma compensación que en el alta desde el panel: sin esto queda un
    // usuario huérfano en auth.users que bloquea ese nombre para siempre.
    await supabase.auth.admin.deleteUser(creado.user.id);
    console.error(`  ✗ ${persona.usuario}: ${errorPerfil.message}`);
    return "error";
  }

  return "creado";
}

async function crearCohorte(cohorte: {
  nombre: string;
  slug: string;
  descripcion: string;
}): Promise<string | null> {
  const { data: existente } = await supabase
    .from("cohorts")
    .select("id")
    .eq("slug", cohorte.slug)
    .maybeSingle();

  if (existente) return existente.id;

  const { data, error } = await supabase
    .from("cohorts")
    .insert({
      name: cohorte.nombre,
      slug: cohorte.slug,
      description: cohorte.descripcion,
      starts_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  ✗ cohorte ${cohorte.slug}: ${error.message}`);
    return null;
  }
  return data.id;
}

// ── Ejecución ───────────────────────────────────────────────────────────────
const PARTICIPANTES = [
  { usuario: "mariana.rios", nombre: "Mariana Ríos", cohorte: 0 },
  { usuario: "jorge.medina", nombre: "Jorge Medina", cohorte: 0 },
  { usuario: "ana.valdez", nombre: "Ana Valdez", cohorte: 0 },
  { usuario: "pablo.sena", nombre: "Pablo Sena", cohorte: 0 },
  { usuario: "sofia.arriaga", nombre: "Sofía Arriaga", cohorte: 0 },
  { usuario: "rocio.tapia", nombre: "Rocío Tapia", cohorte: 1 },
  { usuario: "diego.lozano", nombre: "Diego Lozano", cohorte: 1 },
  { usuario: "elena.cordova", nombre: "Elena Córdova", cohorte: 1 },
] as const;

async function main() {
  console.log("\nSembrando CLARVI CLAUDE\n");

  console.log("Cohortes");
  const cohorteA = await crearCohorte({
    nombre: "Generación 01",
    slug: "generacion-01",
    descripcion: "Primer grupo de la capacitación.",
  });
  const cohorteB = await crearCohorte({
    nombre: "Generación 02",
    slug: "generacion-02",
    descripcion: "Segundo grupo.",
  });
  console.log(`  ✓ 2 cohortes listas\n`);

  console.log("Administrador");
  const resultadoAdmin = await crearPersona({
    usuario: ADMIN_USUARIO,
    nombre: "Facilitador",
    rol: "admin",
    contrasena: ADMIN_PASSWORD,
    cohorteId: null,
  });
  console.log(
    `  ${resultadoAdmin === "creado" ? "✓" : resultadoAdmin === "ya-existia" ? "·" : "✗"} ${ADMIN_USUARIO} (${resultadoAdmin})\n`,
  );

  console.log("Participantes");
  const conteo = { creado: 0, "ya-existia": 0, error: 0 };
  for (const persona of PARTICIPANTES) {
    const resultado = await crearPersona({
      usuario: persona.usuario,
      nombre: persona.nombre,
      rol: "participante",
      contrasena: PASSWORD_GRUPO,
      cohorteId: persona.cohorte === 0 ? cohorteA : cohorteB,
    });
    conteo[resultado] += 1;
    if (resultado === "creado") console.log(`  ✓ ${persona.usuario}`);
    if (resultado === "ya-existia") console.log(`  · ${persona.usuario} (ya existía)`);
  }

  console.log(
    `\n${conteo.creado} creados, ${conteo["ya-existia"]} ya existían, ${conteo.error} con error\n`,
  );

  console.log("Para entrar:");
  console.log(`  admin        → ${ADMIN_USUARIO} / la de ADMIN_INICIAL_PASSWORD`);
  console.log(`  participante → mariana.rios / la de PASSWORD_GRUPO_SEMILLA\n`);

  if (conteo.error > 0) process.exit(1);
}

main().catch((error) => {
  console.error("\n✗ La semilla falló:", error);
  process.exit(1);
});
