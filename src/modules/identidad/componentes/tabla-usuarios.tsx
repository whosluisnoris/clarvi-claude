"use client";

import { useTransition } from "react";
import Link from "next/link";
import { copy } from "@/lib/copy";
import { Estado } from "@/componentes/estado";
import {
  Menu,
  MenuContenido,
  MenuDisparador,
  MenuItem,
} from "@/componentes/menu";
import { cambiarEstadoUsuario } from "@/modules/identidad/acciones-admin";
import type { UsuarioListado } from "@/modules/identidad/consultas-admin";

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function ultimoAcceso(valor: string | null): string {
  if (!valor) return copy.usuarios.nuncaEntro;
  return formatoFecha.format(new Date(valor));
}

/**
 * Tabla de usuarios: filetes finos, sin zebra ni sombras, y los datos duros
 * (usuario, fechas) en mono para que aliñen en columna.
 */
export function TablaUsuarios({
  usuarios,
  pagina,
  ultimaPagina,
  total,
}: {
  usuarios: UsuarioListado[];
  pagina: number;
  ultimaPagina: number;
  total: number;
}) {
  const [pendiente, iniciar] = useTransition();

  if (usuarios.length === 0) {
    return (
      <div className="border-y-[1.5px] border-filete-fuerte py-12 text-center">
        <p className="text-[15px] text-tinta-suave">
          {total === 0
            ? "Todavía no hay usuarios. Empieza dando de alta uno."
            : "Ningún usuario coincide con el filtro."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex h-[34px] items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-tinta-tenue">
        <div className="w-[168px]">{copy.usuarios.columnaUsuario}</div>
        <div className="flex-grow">{copy.usuarios.columnaNombre}</div>
        <div className="w-[132px]">{copy.usuarios.columnaCohorte}</div>
        <div className="w-[104px]">{copy.usuarios.columnaRol}</div>
        <div className="w-[128px]">{copy.usuarios.columnaUltimoAcceso}</div>
        <div className="w-[92px]">{copy.usuarios.columnaEstado}</div>
        <div className="w-7" />
      </div>

      {usuarios.map((usuario, indice) => {
        const inactivo = !usuario.is_active;
        return (
          <div
            key={usuario.id}
            className={`flex h-[54px] items-center gap-4 ${
              indice === 0
                ? "border-t-[1.5px] border-filete-fuerte"
                : "border-t border-filete"
            } ${indice === usuarios.length - 1 ? "border-b-[1.5px] border-b-filete-fuerte" : ""} ${
              pendiente ? "opacity-60" : ""
            }`}
          >
            <div
              className={`w-[168px] font-mono text-[13.5px] ${inactivo ? "text-tinta-tenue" : ""}`}
            >
              {usuario.username}
            </div>
            <div
              className={`flex-grow text-[15px] font-medium ${inactivo ? "text-tinta-tenue" : ""}`}
            >
              {usuario.display_name}
            </div>
            <div className="w-[132px] text-[13.5px] text-tinta-suave">
              {usuario.cohorts?.name ?? "—"}
            </div>
            <div
              className={`w-[104px] font-mono text-[11px] uppercase tracking-[0.1em] ${
                usuario.role === "admin" ? "text-acento" : "text-tinta-tenue"
              }`}
            >
              {usuario.role === "admin"
                ? copy.usuarios.rolAdmin
                : copy.usuarios.rolParticipante}
            </div>
            <div className="w-[128px] font-mono text-[12.5px] text-tinta-suave">
              {ultimoAcceso(usuario.last_login_at)}
            </div>
            <div className="w-[92px]">
              {inactivo ? (
                <Estado tono="error">{copy.usuarios.estadoDesactivado}</Estado>
              ) : usuario.last_login_at ? (
                <Estado tono="exito">{copy.usuarios.estadoActivo}</Estado>
              ) : (
                <Estado tono="aviso">{copy.usuarios.estadoSinEntrar}</Estado>
              )}
            </div>
            <div className="flex w-7 justify-end">
              <Menu>
                <MenuDisparador aria-label={`Acciones para ${usuario.username}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5.5" r="1.6" />
                    <circle cx="12" cy="12" r="1.6" />
                    <circle cx="12" cy="18.5" r="1.6" />
                  </svg>
                </MenuDisparador>
                <MenuContenido align="end">
                  <MenuItem
                    onSelect={() =>
                      iniciar(() => {
                        void cambiarEstadoUsuario(usuario.id, inactivo);
                      })
                    }
                  >
                    {inactivo ? copy.usuarios.activar : copy.usuarios.desactivar}
                  </MenuItem>
                </MenuContenido>
              </Menu>
            </div>
          </div>
        );
      })}

      <div className="flex h-[52px] items-center gap-4">
        <span className="font-mono text-xs text-tinta-tenue">
          {usuarios.length} de {total}
        </span>
        <div className="flex-grow" />
        <EnlacePagina destino={pagina - 1} activo={pagina > 1} direccion="anterior" />
        <EnlacePagina
          destino={pagina + 1}
          activo={pagina < ultimaPagina}
          direccion="siguiente"
        />
      </div>
    </div>
  );
}

function EnlacePagina({
  destino,
  activo,
  direccion,
}: {
  destino: number;
  activo: boolean;
  direccion: "anterior" | "siguiente";
}) {
  const flecha =
    direccion === "anterior" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7";
  const etiqueta = direccion === "anterior" ? "Página anterior" : "Página siguiente";

  const clases = `flex h-10 w-11 items-center justify-center border ${
    activo
      ? "border-[1.5px] border-filete-fuerte hover:bg-papel-panel"
      : "border-filete text-tinta-tenue pointer-events-none opacity-50"
  }`;

  const icono = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d={flecha} />
    </svg>
  );

  if (!activo) {
    return (
      <span className={clases} aria-disabled="true" aria-label={etiqueta}>
        {icono}
      </span>
    );
  }

  return (
    <Link href={`?pagina=${destino}`} className={clases} aria-label={etiqueta}>
      {icono}
    </Link>
  );
}
