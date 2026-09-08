import { redirect } from "next/navigation";
import Link from "next/link";
import { copy } from "@/lib/copy";
import { perfilActual } from "@/modules/identidad/consultas";
import { cerrarSesion } from "@/modules/identidad/acciones";

/**
 * Guardia de rol del área de administración.
 *
 * Va aquí y no en el middleware a propósito: saber si alguien es admin exige
 * consultar profiles, y hacerlo en el middleware costaría una consulta por
 * cada petición, incluida cada imagen. Este layout ya está consultando el
 * perfil de todas formas, y `cache` de React hace que la página de abajo
 * comparta esa misma consulta.
 *
 * Esto es defensa en profundidad, no la única defensa: cada Server Action de
 * administración revalida el rol por su cuenta, y por debajo RLS impide leer
 * datos ajenos aunque este guardia fallara.
 */
export default async function LayoutAdmin({
  children,
}: LayoutProps<"/admin">) {
  const perfil = await perfilActual();

  if (!perfil || perfil.role !== "admin" || !perfil.is_active) {
    redirect("/");
  }

  const enlaces = [
    { href: "/admin", texto: copy.admin.tablero },
    { href: "/admin/usuarios", texto: copy.admin.usuarios },
    { href: "/admin/cohortes", texto: copy.admin.cohortes },
  ];

  const iniciales = perfil.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-full flex-col bg-papel">
      {/* La franja de acento es lo que distingue el área de administración
          de la del participante de un vistazo. */}
      <div className="h-[3px] shrink-0 bg-acento" />

      <header className="flex h-[54px] shrink-0 items-center gap-6 bg-tinta px-8 text-sobre-tinta">
        <Link href="/admin" className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">
            CLARVI<span className="text-acento">·</span>CLAUDE
          </span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-acento">
            {copy.admin.seccion}
          </span>
        </Link>

        <nav className="flex flex-grow items-center">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="flex h-11 items-center px-3 text-[13px] text-sobre-tinta-tenue transition-colors hover:text-sobre-tinta"
            >
              {enlace.texto}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-11 items-center px-3 text-[13px] text-sobre-tinta-tenue transition-colors hover:text-sobre-tinta"
          >
            Ver como participante
          </Link>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex h-11 items-center px-3 text-[13px] text-sobre-tinta-tenue transition-colors hover:text-sobre-tinta"
            >
              {copy.navegacion.cerrarSesion}
            </button>
          </form>
          <div className="flex size-[30px] items-center justify-center bg-acento text-[11.5px] font-semibold text-sobre-acento">
            {iniciales}
          </div>
        </div>
      </header>

      <main className="flex-grow px-8 py-9">{children}</main>
    </div>
  );
}
