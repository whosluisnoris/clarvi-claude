"use client";

import { useActionState, useState, useTransition } from "react";
import { copy } from "@/lib/copy";
import { Boton } from "@/componentes/boton";
import { AreaTexto, Campo, Entrada } from "@/componentes/campo";
import {
  Dialogo,
  DialogoContenido,
  DialogoPie,
  DialogoTitulo,
} from "@/componentes/dialogo";
import { Estado } from "@/componentes/estado";
import {
  cambiarEstadoCohorte,
  guardarCohorte,
  type ResultadoAccion,
} from "@/modules/identidad/acciones-admin";
import type { Cohorte } from "@/tipos/base-de-datos";

type CohorteConConteo = Cohorte & { integrantes: number };

const SIN_RESULTADO: ResultadoAccion = { ok: true, datos: undefined };

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Convierte un timestamp a lo que espera un <input type="date">. */
function aValorDeFecha(iso: string | null): string {
  return iso ? (iso.slice(0, 10) ?? "") : "";
}

export function PanelCohortes({ cohortes }: { cohortes: CohorteConConteo[] }) {
  const [editando, setEditando] = useState<CohorteConConteo | null>(null);
  const [creando, setCreando] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const cerrar = () => {
    setEditando(null);
    setCreando(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Boton variante="contorno" onClick={() => setCreando(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            <path d="M12 4v16" />
            <path d="M4 12h16" />
          </svg>
          {copy.cohortes.agregar}
        </Boton>
      </div>

      {cohortes.length === 0 ? (
        <div className="border-y-[1.5px] border-filete-fuerte py-12 text-center">
          <p className="text-[15px] text-tinta-suave">
            Todavía no hay cohortes. Crea una para poder agrupar a los participantes.
          </p>
        </div>
      ) : (
        <div className={`flex flex-col ${pendiente ? "opacity-60" : ""}`}>
          {cohortes.map((cohorte, indice) => (
            <div
              key={cohorte.id}
              className={`flex min-h-[64px] items-center gap-5 py-2 ${
                indice === 0
                  ? "border-t-[1.5px] border-filete-fuerte"
                  : "border-t border-filete"
              } ${indice === cohortes.length - 1 ? "border-b-[1.5px] border-b-filete-fuerte" : ""}`}
            >
              <div className="flex flex-grow flex-col gap-0.5">
                <span
                  className={`text-[17px] font-medium tracking-[-0.018em] ${
                    cohorte.is_active ? "" : "text-tinta-tenue"
                  }`}
                >
                  {cohorte.name}
                </span>
                <span className="font-mono text-[12px] text-tinta-tenue">
                  {cohorte.slug}
                  {cohorte.starts_at
                    ? ` · desde ${formatoFecha.format(new Date(cohorte.starts_at))}`
                    : ""}
                  {cohorte.ends_at
                    ? ` · hasta ${formatoFecha.format(new Date(cohorte.ends_at))}`
                    : ""}
                </span>
              </div>

              <span className="text-[13.5px] text-tinta-suave">
                {copy.cohortes.participantes(cohorte.integrantes)}
              </span>

              <div className="w-[104px] text-right">
                {cohorte.is_active ? (
                  <Estado tono="exito">Activa</Estado>
                ) : (
                  <Estado tono="error">Inactiva</Estado>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  onClick={() => setEditando(cohorte)}
                >
                  Editar
                </Boton>
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  onClick={() =>
                    iniciar(() => {
                      void cambiarEstadoCohorte(cohorte.id, !cohorte.is_active);
                    })
                  }
                >
                  {cohorte.is_active ? "Desactivar" : "Activar"}
                </Boton>
              </div>
            </div>
          ))}
        </div>
      )}

      <DialogoCohorte
        abierto={creando || editando !== null}
        cohorte={editando}
        cerrar={cerrar}
      />
    </div>
  );
}

function DialogoCohorte({
  abierto,
  cohorte,
  cerrar,
}: {
  abierto: boolean;
  cohorte: CohorteConConteo | null;
  cerrar: () => void;
}) {
  const [resultado, ejecutar, pendiente] = useActionState(
    guardarCohorte,
    SIN_RESULTADO,
  );

  return (
    <Dialogo open={abierto} onOpenChange={(v) => !v && cerrar()}>
      <DialogoContenido>
        <DialogoTitulo>
          {cohorte ? "Editar cohorte" : copy.cohortes.agregar}
        </DialogoTitulo>

        {/* La key remonta el formulario al cambiar de cohorte: sin ella los
            campos conservarían los valores de la cohorte anterior. */}
        <form
          key={cohorte?.id ?? "nueva"}
          action={ejecutar}
          className="mt-5 flex flex-col gap-4"
        >
          {cohorte ? <input type="hidden" name="id" value={cohorte.id} /> : null}

          <Campo etiqueta={copy.cohortes.nombre} htmlFor="nombre" requerido>
            <Entrada
              id="nombre"
              name="nombre"
              required
              defaultValue={cohorte?.name ?? ""}
              autoComplete="off"
            />
          </Campo>

          <Campo etiqueta={copy.cohortes.descripcion} htmlFor="descripcion">
            <AreaTexto
              id="descripcion"
              name="descripcion"
              rows={2}
              defaultValue={cohorte?.description ?? ""}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta={copy.cohortes.inicia} htmlFor="iniciaEn">
              <Entrada
                id="iniciaEn"
                name="iniciaEn"
                type="date"
                defaultValue={aValorDeFecha(cohorte?.starts_at ?? null)}
              />
            </Campo>
            <Campo
              etiqueta={copy.cohortes.termina}
              ayuda={copy.cohortes.terminaAyuda}
              htmlFor="terminaEn"
            >
              <Entrada
                id="terminaEn"
                name="terminaEn"
                type="date"
                defaultValue={aValorDeFecha(cohorte?.ends_at ?? null)}
              />
            </Campo>
          </div>

          {!resultado.ok ? (
            <p className="border-l-[3px] border-error bg-error-panel p-3 text-[13.5px] text-pretty">
              {resultado.error}
            </p>
          ) : null}

          <DialogoPie>
            <Boton type="button" variante="contorno" onClick={cerrar} disabled={pendiente}>
              {copy.general.cancelar}
            </Boton>
            <Boton type="submit" variante="tinta" disabled={pendiente}>
              {pendiente ? copy.general.cargando : copy.general.guardar}
            </Boton>
          </DialogoPie>
        </form>
      </DialogoContenido>
    </Dialogo>
  );
}
