import * as React from "react";

import { cn } from "@/componentes/utilidades";

/**
 * Estilos compartidos por `Entrada` y `AreaTexto`: campo de formulario sin
 * redondeo, con filete de 1.5px que pasa a `border-error` cuando el campo
 * tiene error.
 */
function clasesControl(conError: boolean) {
  return cn(
    "w-full bg-papel-campo border-[1.5px] text-tinta placeholder:text-tinta-tenue outline-none transition-colors",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    conError ? "border-error" : "border-filete-fuerte focus:border-acento",
  );
}

export interface PropsEntrada
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Marca el campo en estado de error (borde en `border-error`). */
  error?: boolean;
  /** Aplica `font-mono`: para usuarios, contraseñas y otros valores literales. */
  mono?: boolean;
}

const Entrada = React.forwardRef<HTMLInputElement, PropsEntrada>(
  ({ className, error = false, mono = false, ...resto }, ref) => (
    <input
      ref={ref}
      className={cn(
        clasesControl(error),
        "h-[50px] px-[15px]",
        mono && "font-mono",
        className,
      )}
      aria-invalid={error || undefined}
      {...resto}
    />
  ),
);
Entrada.displayName = "Entrada";

export interface PropsAreaTexto
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Marca el campo en estado de error (borde en `border-error`). */
  error?: boolean;
  /** Aplica `font-mono`. */
  mono?: boolean;
}

const AreaTexto = React.forwardRef<HTMLTextAreaElement, PropsAreaTexto>(
  ({ className, error = false, mono = false, ...resto }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        clasesControl(error),
        "min-h-[110px] px-[15px] py-3 resize-y",
        mono && "font-mono",
        className,
      )}
      aria-invalid={error || undefined}
      {...resto}
    />
  ),
);
AreaTexto.displayName = "AreaTexto";

export interface PropsCampo {
  /** Texto del rótulo. */
  etiqueta: string;
  /** Texto de ayuda bajo el control, cuando no hay error. */
  ayuda?: string;
  /** Mensaje de error; si está presente, reemplaza a `ayuda`. */
  error?: string;
  /** Marca el rótulo con un asterisco y `aria-required` en el grupo. */
  requerido?: boolean;
  /** id del control asociado, para el `htmlFor` del `<label>`. */
  htmlFor: string;
  /** Control del campo: normalmente `<Entrada>` o `<AreaTexto>`. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Agrupa etiqueta, control, ayuda y error con el tratamiento tipográfico de
 * la dirección (`.rotulo` para la etiqueta, `text-error` para el error).
 */
function Campo({
  etiqueta,
  ayuda,
  error,
  requerido = false,
  htmlFor,
  children,
  className,
}: PropsCampo) {
  const idAyuda = ayuda ? `${htmlFor}-ayuda` : undefined;
  const idError = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="rotulo">
        {etiqueta}
        {requerido && <span className="text-acento"> *</span>}
      </label>

      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              id?: string;
              error?: boolean;
              "aria-describedby"?: string;
            }>,
            {
              id: htmlFor,
              error: Boolean(error),
              "aria-describedby": idError ?? idAyuda,
            },
          )
        : children}

      {error ? (
        <p id={idError} className="text-[13px] text-error">
          {error}
        </p>
      ) : ayuda ? (
        <p id={idAyuda} className="text-[13px] text-tinta-tenue">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

export { Campo, Entrada, AreaTexto };
