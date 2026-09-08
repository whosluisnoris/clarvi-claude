import * as React from "react";

import { cn } from "@/componentes/utilidades";

export type PropsRotulo = React.HTMLAttributes<HTMLSpanElement>;

/** Versalitas mono de la dirección (clase `.rotulo` de globals.css), tipadas como componente. */
function Rotulo({ className, ...resto }: PropsRotulo) {
  return <span className={cn("rotulo", className)} {...resto} />;
}

export { Rotulo };
