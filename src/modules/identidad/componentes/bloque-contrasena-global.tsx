"use client";

import { useActionState, useState } from "react";
import { copy } from "@/lib/copy";
import { Boton } from "@/componentes/boton";
import { Campo, Entrada } from "@/componentes/campo";
import {
  Dialogo,
  DialogoContenido,
  DialogoDescripcion,
  DialogoPie,
  DialogoTitulo,
} from "@/componentes/dialogo";
import { Panel } from "@/componentes/panel";
import { Rotulo } from "@/componentes/rotulo";
import {
  rotarContrasenaGlobal,
  type ResumenRotacion,
  type ResultadoAccion,
} from "@/modules/identidad/acciones-admin";
import type { EstadoContrasenaGlobal } from "@/modules/identidad/consultas-admin";

const ESTADO_INICIAL: ResultadoAccion<ResumenRotacion | undefined> = {
  ok: true,
  datos: undefined,
};

/**
 * El bloque más visible de la pantalla, y a propósito: rotar la contraseña
 * saca de su sesión a todos los participantes a la vez. Una acción con esa
 * consecuencia no debe estar escondida en un menú.
 *
 * Se muestra la huella corta del hash, nunca la contraseña: no se guarda en
 * ningún lado. La huella sirve para que el facilitador confirme si la que
 * tiene apuntada es la vigente.
 */
export function BloqueContrasenaGlobal({
  estado,
}: {
  estado: EstadoContrasenaGlobal;
}) {
  const [abierto, setAbierto] = useState(false);
  const [resultado, ejecutar, pendiente] = useActionState(
    rotarContrasenaGlobal,
    ESTADO_INICIAL,
  );

  const resumen = resultado.ok ? resultado.datos : undefined;

  return (
    <>
      <Panel className="flex items-center gap-7 p-[18px_22px]">
        <div className="flex flex-grow flex-col gap-1">
          <Rotulo>{copy.contrasenaGlobal.rotulo}</Rotulo>
          <div className="flex items-baseline gap-3">
            <span className="text-base font-medium tracking-[-0.015em]">
              {estado.diasDesdeRotacion === null
                ? copy.contrasenaGlobal.nuncaRotada
                : copy.contrasenaGlobal.rotadaHace(estado.diasDesdeRotacion)}
            </span>
            {estado.huellaCorta ? (
              <span className="font-mono text-xs text-tinta-tenue">
                {copy.contrasenaGlobal.huella(estado.huellaCorta)}
              </span>
            ) : null}
          </div>
          <p className="text-[12.5px] text-tinta-tenue text-pretty">
            {copy.contrasenaGlobal.alcance(estado.participantes)}
          </p>
        </div>

        <Boton variante="tinta" onClick={() => setAbierto(true)}>
          {copy.contrasenaGlobal.rotar}
        </Boton>
      </Panel>

      <Dialogo open={abierto} onOpenChange={setAbierto}>
        <DialogoContenido>
          <DialogoTitulo>{copy.contrasenaGlobal.rotarTitulo}</DialogoTitulo>

          {resumen ? (
            <div className="flex flex-col gap-4">
              <p className="text-[14.5px] leading-relaxed text-pretty">
                {resumen.fallidos.length === 0
                  ? copy.contrasenaGlobal.rotarListo(resumen.actualizados)
                  : copy.contrasenaGlobal.rotarConFallos(
                      resumen.actualizados,
                      resumen.fallidos.length,
                    )}
              </p>
              <p className="font-mono text-[12.5px] text-tinta-tenue">
                {copy.contrasenaGlobal.huella(resumen.huellaCorta)}
              </p>
              {resumen.fallidos.length > 0 ? (
                <ul className="flex flex-col gap-1 border-l-[3px] border-error bg-error-panel p-3 font-mono text-[12.5px]">
                  {resumen.fallidos.map((usuario) => (
                    <li key={usuario}>{usuario}</li>
                  ))}
                </ul>
              ) : null}
              <DialogoPie>
                <Boton variante="tinta" onClick={() => setAbierto(false)}>
                  {copy.general.cerrar}
                </Boton>
              </DialogoPie>
            </div>
          ) : (
            <form action={ejecutar} className="flex flex-col gap-5">
              <DialogoDescripcion>
                {copy.contrasenaGlobal.rotarAdvertencia}
              </DialogoDescripcion>

              <Campo
                etiqueta={copy.contrasenaGlobal.rotarNueva}
                htmlFor="contrasenaNueva"
                error={!resultado.ok ? resultado.error : undefined}
                requerido
              >
                <Entrada
                  id="contrasenaNueva"
                  name="contrasenaNueva"
                  type="text"
                  mono
                  autoComplete="off"
                  minLength={10}
                  required
                  // En texto plano a propósito: el facilitador tiene que poder
                  // leerla para dictársela al grupo, y ocultarla solo lograría
                  // que la escriba mal sin darse cuenta.
                />
              </Campo>

              <DialogoPie>
                <Boton
                  type="button"
                  variante="contorno"
                  onClick={() => setAbierto(false)}
                  disabled={pendiente}
                >
                  {copy.general.cancelar}
                </Boton>
                <Boton type="submit" variante="peligro" disabled={pendiente}>
                  {pendiente
                    ? copy.general.cargando
                    : copy.contrasenaGlobal.rotarConfirmar}
                </Boton>
              </DialogoPie>
            </form>
          )}
        </DialogoContenido>
      </Dialogo>
    </>
  );
}
