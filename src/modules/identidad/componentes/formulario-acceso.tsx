"use client";

import { useActionState } from "react";
import { copy } from "@/lib/copy";
import { Boton } from "@/componentes/boton";
import { Campo, Entrada } from "@/componentes/campo";
import { iniciarSesion, type EstadoAcceso } from "@/modules/identidad/acciones";

const SIN_ERROR: EstadoAcceso = { error: null };

export function FormularioAcceso() {
  const [estado, ejecutar, pendiente] = useActionState(iniciarSesion, SIN_ERROR);

  return (
    <div className="flex w-full max-w-[372px] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-[34px] font-bold leading-tight tracking-[-0.032em]">
          {copy.acceso.titulo}
        </h2>
        <p className="text-[14.5px] leading-relaxed text-tinta-suave text-pretty">
          {copy.acceso.subtitulo}
        </p>
      </div>

      <form action={ejecutar} className="flex flex-col gap-5">
        <Campo etiqueta={copy.acceso.campoUsuario} htmlFor="usuario" requerido>
          <Entrada
            id="usuario"
            name="usuario"
            mono
            required
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            error={Boolean(estado.error)}
          />
        </Campo>

        <Campo etiqueta={copy.acceso.campoContrasena} htmlFor="contrasena" requerido>
          <Entrada
            id="contrasena"
            name="contrasena"
            type="password"
            mono
            required
            autoComplete="current-password"
            error={Boolean(estado.error)}
          />
        </Campo>

        {/* El mensaje es el mismo para todos los fallos: usuario inexistente,
            contraseña incorrecta, cuenta desactivada o cohorte vencida.
            Distinguirlos convertiría esta pantalla en un directorio de quién
            está inscrito. */}
        {estado.error ? (
          <div
            role="alert"
            className="flex items-start gap-3 border-l-[3px] border-error bg-error-panel p-[13px_15px]"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              className="mt-0.5 shrink-0 text-error"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5.5" />
              <path d="M12 16.2v.6" />
            </svg>
            <p className="text-[13.5px] leading-snug text-pretty">{estado.error}</p>
          </div>
        ) : null}

        <Boton type="submit" variante="tinta" tamano="lg" disabled={pendiente}>
          {pendiente ? copy.acceso.botonEntrando : copy.acceso.botonEntrar}
        </Boton>
      </form>

      <div className="h-px bg-filete" />

      {/* Sin registro y sin recuperación de contraseña: las cuentas las crea
          el facilitador (brief §4.1). Decir a quién escribirle es más útil
          que un enlace que no lleva a ningún lado. */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[13.5px] font-semibold">{copy.acceso.ayudaTitulo}</p>
        <p className="text-[13.5px] leading-relaxed text-tinta-tenue text-pretty">
          {copy.acceso.ayudaCuerpo}
        </p>
      </div>
    </div>
  );
}
