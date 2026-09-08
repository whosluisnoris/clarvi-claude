import Link from "next/link";
import { redirect } from "next/navigation";
import { copy } from "@/lib/copy";
import { cerrarSesion } from "@/modules/identidad/acciones";
import { perfilActual } from "@/modules/identidad/consultas";

export default async function LayoutParticipante({
  children,
}: LayoutProps<"/">) {
  const perfil = await perfilActual();

  // El middleware ya exige sesión; esto cubre el caso de una sesión válida
  // cuyo perfil fue borrado o desactivado entre petición y petición.
  if (!perfil || !perfil.is_active) redirect("/login");

  const iniciales = perfil.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase();

  const enlaces = [
    { href: "/", texto: copy.navegacion.inicio },
  ];

  return (
    <div className="flex min-h-full flex-col bg-papel">
      <header className="flex h-14 shrink-0 items-center gap-4 bg-tinta px-5 text-sobre-tinta md:gap-7 md:px-12">
        <Link href="/" className="text-[15px] font-bold tracking-tight">
          CLARVI<span className="text-acento">·</span>CLAUDE
        </Link>

        <nav className="flex flex-grow items-center">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="flex h-11 items-center px-3 text-[13.5px] font-semibold text-sobre-tinta shadow-[inset_0_-3px_0_var(--acento)]"
            >
              {enlace.texto}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {perfil.role === "admin" ? (
            <Link
              href="/admin"
              className="hidden h-11 items-center px-3 text-[13px] text-sobre-tinta-tenue transition-colors hover:text-sobre-tinta md:flex"
            >
              {copy.admin.seccion}
            </Link>
          ) : null}
          <span className="hidden font-mono text-[11.5px] uppercase tracking-wider text-sobre-tinta-tenue md:inline">
            {perfil.cohorts?.name ?? copy.inicio.sinCohorte}
          </span>
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

      <main className="flex-grow px-5 py-10 md:px-12 md:py-13">{children}</main>
    </div>
  );
}
