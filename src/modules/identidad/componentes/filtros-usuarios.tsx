"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import type { Cohorte } from "@/tipos/base-de-datos";

/**
 * Filtros del listado.
 *
 * El estado vive en la URL, no en React: así el filtro sobrevive a un refresco,
 * se puede compartir por enlace, y el botón de atrás del navegador hace lo que
 * uno espera. Además la consulta la resuelve el servidor, que es donde debe
 * estar con paginación real.
 */
export function FiltrosUsuarios({
  cohortes,
  total,
}: {
  cohortes: Cohorte[];
  total: number;
}) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [busqueda, setBusqueda] = useState(parametros.get("q") ?? "");

  // Se espera a que la persona deje de teclear: sin esto habría una consulta
  // al servidor por cada letra.
  useEffect(() => {
    const actual = parametros.get("q") ?? "";
    if (busqueda === actual) return;

    const temporizador = setTimeout(() => {
      const siguientes = new URLSearchParams(parametros.toString());
      if (busqueda) siguientes.set("q", busqueda);
      else siguientes.delete("q");
      siguientes.delete("pagina");
      router.replace(`?${siguientes.toString()}`);
    }, 300);

    return () => clearTimeout(temporizador);
  }, [busqueda, parametros, router]);

  const cambiarParametro = (clave: string, valor: string) => {
    const siguientes = new URLSearchParams(parametros.toString());
    if (valor) siguientes.set(clave, valor);
    else siguientes.delete(clave);
    siguientes.delete("pagina");
    router.replace(`?${siguientes.toString()}`);
  };

  const claseSelector =
    "h-[42px] border border-borde-campo bg-papel-campo px-3 text-[13.5px] text-tinta";

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-[42px] w-[268px] items-center gap-2.5 border border-borde-campo bg-papel-campo px-3">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="square"
          className="shrink-0 text-tinta-tenue"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L21 21" />
        </svg>
        <input
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder={copy.usuarios.buscar}
          aria-label={copy.usuarios.buscar}
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-tinta-tenue"
        />
      </div>

      <select
        aria-label={copy.usuarios.columnaCohorte}
        value={parametros.get("cohorte") ?? ""}
        onChange={(evento) => cambiarParametro("cohorte", evento.target.value)}
        className={claseSelector}
      >
        <option value="">Todas las cohortes</option>
        {cohortes.map((cohorte) => (
          <option key={cohorte.id} value={cohorte.id}>
            {cohorte.name}
          </option>
        ))}
      </select>

      <select
        aria-label={copy.usuarios.columnaEstado}
        value={parametros.get("estado") ?? ""}
        onChange={(evento) => cambiarParametro("estado", evento.target.value)}
        className={claseSelector}
      >
        <option value="">{copy.usuarios.todosLosEstados}</option>
        <option value="activos">{copy.usuarios.estadoActivo}</option>
        <option value="inactivos">{copy.usuarios.estadoDesactivado}</option>
      </select>

      <div className="flex-grow" />
      <span className="font-mono text-xs text-tinta-tenue">
        {copy.usuarios.conteo(total)}
      </span>
    </div>
  );
}
