"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/componentes/utilidades";

/**
 * Variantes del botón. Radio 0 y sin sombra en todos los casos: la
 * dirección modernista no las contempla. `md` y `lg` respetan el mínimo de
 * 44px de área táctil.
 */
const variantesBoton = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variante: {
        solida: "bg-acento text-sobre-acento hover:bg-acento-hover",
        tinta: "bg-tinta text-sobre-tinta hover:opacity-90",
        contorno:
          "border-[1.5px] border-filete-fuerte bg-transparent text-tinta hover:bg-papel-panel",
        fantasma: "bg-transparent text-tinta hover:bg-papel-panel",
        peligro: "bg-error text-sobre-acento hover:opacity-90",
      },
      tamano: {
        sm: "h-9 px-3 text-[13px] font-medium",
        md: "h-11 min-h-[44px] px-4 text-[13.5px] font-semibold",
        lg: "h-[52px] min-h-[44px] px-5 text-[14.5px] font-semibold",
      },
    },
    defaultVariants: {
      variante: "solida",
      tamano: "md",
    },
  },
);

export interface PropsBoton
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBoton> {
  /** Renderiza las props sobre el hijo directo (vía Radix Slot) en vez de un <button>. */
  asChild?: boolean;
}

/**
 * Botón base de la aplicación. Sin redondeo, sin sombra; el acento se
 * reserva para la variante `solida`.
 */
const Boton = React.forwardRef<HTMLButtonElement, PropsBoton>(
  ({ className, variante, tamano, asChild = false, ...resto }, ref) => {
    const Componente = asChild ? Slot : "button";
    return (
      <Componente
        ref={ref}
        className={cn(variantesBoton({ variante, tamano }), className)}
        {...resto}
      />
    );
  },
);
Boton.displayName = "Boton";

export { Boton, variantesBoton };
