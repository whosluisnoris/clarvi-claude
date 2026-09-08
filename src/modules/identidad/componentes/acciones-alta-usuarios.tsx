"use client";

import { useActionState, useRef, useState } from "react";
import { copy } from "@/lib/copy";
import { Boton } from "@/componentes/boton";
import { Campo, AreaTexto, Entrada } from "@/componentes/campo";
import {
  Dialogo,
  DialogoContenido,
  DialogoDescripcion,
  DialogoPie,
  DialogoTitulo,
} from "@/componentes/dialogo";
import { Rotulo } from "@/componentes/rotulo";
import {
  cargarUsuariosCsv,
  crearUsuario,
  type ResumenCarga,
  type ResultadoAccion,
} from "@/modules/identidad/acciones-admin";
import { leerCsv, type LecturaCsv } from "@/modules/identidad/csv";
import { sugerirUsuario } from "@/modules/identidad/esquemas";
import type { Cohorte } from "@/tipos/base-de-datos";

const SIN_RESULTADO: ResultadoAccion = { ok: true, datos: undefined };
const SIN_CARGA: ResultadoAccion<ResumenCarga | undefined> = {
  ok: true,
  datos: undefined,
};

export function AccionesAltaUsuarios({ cohortes }: { cohortes: Cohorte[] }) {
  const [dialogo, setDialogo] = useState<"alta" | "csv" | null>(null);

  return (
    <>
      <div className="flex items-center gap-2.5">
        <Boton variante="contorno" onClick={() => setDialogo("alta")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            <path d="M12 4v16" />
            <path d="M4 12h16" />
          </svg>
          {copy.usuarios.agregar}
        </Boton>
        <Boton variante="contorno" onClick={() => setDialogo("csv")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            <path d="M12 15V3" />
            <path d="M7.5 10.5L12 15l4.5-4.5" />
            <path d="M3 17v4h18v-4" />
          </svg>
          {copy.usuarios.cargaCsv}
        </Boton>
      </div>

      <DialogoAlta
        abierto={dialogo === "alta"}
        cerrar={() => setDialogo(null)}
        cohortes={cohortes}
      />
      <DialogoCsv
        abierto={dialogo === "csv"}
        cerrar={() => setDialogo(null)}
        cohortes={cohortes}
      />
    </>
  );
}

function DialogoAlta({
  abierto,
  cerrar,
  cohortes,
}: {
  abierto: boolean;
  cerrar: () => void;
  cohortes: Cohorte[];
}) {
  const [resultado, ejecutar, pendiente] = useActionState(
    crearUsuario,
    SIN_RESULTADO,
  );
  const [rol, setRol] = useState<"participante" | "admin">("participante");
  const refUsuario = useRef<HTMLInputElement>(null);
  const [usuarioTocado, setUsuarioTocado] = useState(false);

  // El usuario se propone a partir del nombre mientras no se haya editado a
  // mano. Deja de proponer en cuanto la persona lo toca: sobrescribir lo que
  // alguien acaba de teclear es de las cosas más molestas de un formulario.
  const alEscribirNombre = (nombre: string) => {
    if (usuarioTocado || !refUsuario.current) return;
    refUsuario.current.value = sugerirUsuario(nombre);
  };

  const claseSelector =
    "h-[50px] w-full border-[1.5px] border-filete-fuerte bg-papel-campo px-[15px] text-[14px]";

  return (
    <Dialogo open={abierto} onOpenChange={(v) => !v && cerrar()}>
      <DialogoContenido>
        <DialogoTitulo>{copy.usuarios.altaTitulo}</DialogoTitulo>
        <form action={ejecutar} className="mt-5 flex flex-col gap-4">
          <Campo etiqueta={copy.usuarios.altaNombre} htmlFor="nombreVisible" requerido>
            <Entrada
              id="nombreVisible"
              name="nombreVisible"
              required
              autoComplete="off"
              onChange={(evento) => alEscribirNombre(evento.target.value)}
            />
          </Campo>

          <Campo
            etiqueta={copy.usuarios.altaUsuario}
            ayuda={copy.usuarios.altaUsuarioAyuda}
            htmlFor="usuario"
            requerido
          >
            <Entrada
              ref={refUsuario}
              id="usuario"
              name="usuario"
              mono
              required
              autoComplete="off"
              onChange={() => setUsuarioTocado(true)}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta={copy.usuarios.altaRol} htmlFor="rol">
              <select
                id="rol"
                name="rol"
                value={rol}
                onChange={(evento) =>
                  setRol(evento.target.value as "participante" | "admin")
                }
                className={claseSelector}
              >
                <option value="participante">{copy.usuarios.rolParticipante}</option>
                <option value="admin">{copy.usuarios.rolAdmin}</option>
              </select>
            </Campo>

            <Campo etiqueta={copy.usuarios.altaCohorte} htmlFor="cohorteId">
              <select id="cohorteId" name="cohorteId" className={claseSelector}>
                <option value="">Sin cohorte</option>
                {cohortes.map((cohorte) => (
                  <option key={cohorte.id} value={cohorte.id}>
                    {cohorte.name}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo
            etiqueta={
              rol === "admin"
                ? copy.usuarios.altaContrasenaAdmin
                : "Contraseña del grupo"
            }
            ayuda={
              rol === "admin"
                ? copy.usuarios.altaContrasenaAdminAyuda
                : "La contraseña vigente del grupo. No se guarda en ningún lado, por eso hay que escribirla aquí."
            }
            htmlFor="contrasena"
            requerido
          >
            <Entrada
              id="contrasena"
              name="contrasena"
              type="text"
              mono
              required
              autoComplete="off"
              minLength={rol === "admin" ? 12 : 1}
            />
          </Campo>

          <Campo
            etiqueta={copy.usuarios.altaNotas}
            ayuda={copy.usuarios.altaNotasAyuda}
            htmlFor="notas"
          >
            <AreaTexto id="notas" name="notas" rows={2} />
          </Campo>

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
              {pendiente ? copy.general.cargando : copy.usuarios.altaGuardar}
            </Boton>
          </DialogoPie>
        </form>
      </DialogoContenido>
    </Dialogo>
  );
}

function DialogoCsv({
  abierto,
  cerrar,
  cohortes,
}: {
  abierto: boolean;
  cerrar: () => void;
  cohortes: Cohorte[];
}) {
  const [resultado, ejecutar, pendiente] = useActionState(
    cargarUsuariosCsv,
    SIN_CARGA,
  );
  const [contenido, setContenido] = useState("");
  const [lectura, setLectura] = useState<LecturaCsv | null>(null);

  // La previsualización se calcula en el navegador con EXACTAMENTE la misma
  // función que usa el servidor al guardar. Lo que se ve aquí es lo que se va
  // a crear; no hay una segunda interpretación del archivo.
  const alElegirArchivo = async (archivo: File | undefined) => {
    if (!archivo) return;
    const texto = await archivo.text();
    setContenido(texto);
    setLectura(leerCsv(texto));
  };

  const resumen = resultado.ok ? resultado.datos : undefined;
  const claseSelector =
    "h-[50px] w-full border-[1.5px] border-filete-fuerte bg-papel-campo px-[15px] text-[14px]";

  return (
    <Dialogo open={abierto} onOpenChange={(v) => !v && cerrar()}>
      <DialogoContenido>
        <DialogoTitulo>{copy.usuarios.csvTitulo}</DialogoTitulo>

        {resumen ? (
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-[14.5px] leading-relaxed">
              Se crearon {resumen.creados}
              {resumen.fallidos.length > 0
                ? `, y ${resumen.fallidos.length} no se pudieron crear.`
                : "."}
            </p>
            {resumen.fallidos.length > 0 ? (
              <ul className="flex max-h-48 flex-col gap-1 overflow-auto border-l-[3px] border-error bg-error-panel p-3 font-mono text-[12.5px]">
                {resumen.fallidos.map((fallo) => (
                  <li key={fallo.usuario}>
                    {fallo.usuario} — {fallo.motivo}
                  </li>
                ))}
              </ul>
            ) : null}
            <DialogoPie>
              <Boton variante="tinta" onClick={cerrar}>
                {copy.general.cerrar}
              </Boton>
            </DialogoPie>
          </div>
        ) : (
          <form action={ejecutar} className="mt-5 flex flex-col gap-4">
            <DialogoDescripcion>{copy.usuarios.csvAyuda}</DialogoDescripcion>

            <input type="hidden" name="contenido" value={contenido} />

            <Campo etiqueta="Archivo" htmlFor="archivo" requerido>
              <input
                id="archivo"
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={(evento) => void alElegirArchivo(evento.target.files?.[0])}
                className="w-full border-[1.5px] border-filete-fuerte bg-papel-campo p-3 text-[13.5px] file:mr-3 file:border file:border-filete file:bg-papel-panel file:px-3 file:py-1.5 file:text-[13px]"
              />
            </Campo>

            {lectura ? (
              <div className="flex flex-col gap-2 border-l-[3px] border-acento bg-papel-panel p-3">
                <Rotulo>Previsualización</Rotulo>
                <p className="text-[13.5px]">
                  {copy.usuarios.csvFilasValidas(lectura.validas.length)}
                  {lectura.problemas.length > 0
                    ? ` · ${copy.usuarios.csvFilasConProblema(lectura.problemas.length)}`
                    : ""}
                </p>
                {lectura.problemas.length > 0 ? (
                  <ul className="flex max-h-32 flex-col gap-1 overflow-auto font-mono text-[12px] text-tinta-suave">
                    {lectura.problemas.map((problema) => (
                      <li key={`${problema.numero}-${problema.motivo}`}>
                        Fila {problema.numero}: {problema.motivo}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <Campo etiqueta={copy.usuarios.altaCohorte} htmlFor="cohorteIdCsv">
              <select id="cohorteIdCsv" name="cohorteId" className={claseSelector}>
                <option value="">Sin cohorte</option>
                {cohortes.map((cohorte) => (
                  <option key={cohorte.id} value={cohorte.id}>
                    {cohorte.name}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo
              etiqueta="Contraseña del grupo"
              ayuda="Con la que van a entrar todas las personas del archivo."
              htmlFor="contrasenaCsv"
              requerido
            >
              <Entrada
                id="contrasenaCsv"
                name="contrasena"
                type="text"
                mono
                required
                autoComplete="off"
              />
            </Campo>

            {!resultado.ok ? (
              <p className="border-l-[3px] border-error bg-error-panel p-3 text-[13.5px] text-pretty">
                {resultado.error}
              </p>
            ) : null}

            <DialogoPie>
              <Boton type="button" variante="contorno" onClick={cerrar} disabled={pendiente}>
                {copy.general.cancelar}
              </Boton>
              <Boton
                type="submit"
                variante="tinta"
                disabled={pendiente || !lectura || lectura.validas.length === 0}
              >
                {pendiente ? copy.general.cargando : copy.usuarios.csvConfirmar}
              </Boton>
            </DialogoPie>
          </form>
        )}
      </DialogoContenido>
    </Dialogo>
  );
}
