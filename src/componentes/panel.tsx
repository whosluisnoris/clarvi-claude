import * as React from "react";

import { cn } from "@/componentes/utilidades";

const clasesPorTono = {
  acento: "bg-papel-panel border-l-acento",
  error: "bg-error-panel border-l-error",
} as const;

export type TonoPanel = keyof typeof clasesPorTono;

export interface PropsPanel extends React.HTMLAttributes<HTMLDivElement> {
  tono?: TonoPanel;
}

/**
 * Bloque destacado con filete de acento a la izquierda. Sin redondeo ni
 * sombra: la jerarquía la marca el filete de 3px, no una caja.
 */
function Panel({ tono = "acento", className, ...resto }: PropsPanel) {
  return (
    <div
      className={cn("border-l-[3px] p-4", clasesPorTono[tono], className)}
      {...resto}
    />
  );
}

export { Panel };
