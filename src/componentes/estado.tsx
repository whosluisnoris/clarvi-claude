import * as React from "react";

import { cn } from "@/componentes/utilidades";

const coloresPorTono = {
  exito: "text-exito",
  aviso: "text-aviso",
  error: "text-error",
  neutro: "text-tinta-suave",
} as const;

export type TonoEstado = keyof typeof coloresPorTono;

export interface PropsEstado extends React.HTMLAttributes<HTMLSpanElement> {
  tono: TonoEstado;
}

/**
 * Indicador de estado como texto de color, sin píldora ni fondo: la
 * dirección modernista no usa badges rellenas.
 */
function Estado({ tono, className, children, ...resto }: PropsEstado) {
  return (
    <span
      className={cn("text-[13px] font-medium", coloresPorTono[tono], className)}
      {...resto}
    >
      {children}
    </span>
  );
}

export { Estado };
