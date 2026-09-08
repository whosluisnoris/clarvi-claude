"use client";

import * as React from "react";
import * as SelectorPrimitivo from "@radix-ui/react-select";

import { cn } from "@/componentes/utilidades";

/**
 * Selector sobre @radix-ui/react-select. Mismo tratamiento visual que el
 * resto: sin redondeo, sin sombra, filete de 1.5px. Disparador de 42px.
 */
const Selector = SelectorPrimitivo.Root;
const SelectorGrupo = SelectorPrimitivo.Group;
const SelectorValor = SelectorPrimitivo.Value;

const SelectorDisparador = React.forwardRef<
  React.ElementRef<typeof SelectorPrimitivo.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectorPrimitivo.Trigger>
>(({ className, children, ...resto }, ref) => (
  <SelectorPrimitivo.Trigger
    ref={ref}
    className={cn(
      "flex h-[42px] w-full items-center justify-between gap-2 bg-papel-campo px-[15px] text-[13.5px] text-tinta",
      "border-[1.5px] border-filete-fuerte outline-none",
      "data-[placeholder]:text-tinta-tenue",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      className,
    )}
    {...resto}
  >
    {children}
    <SelectorPrimitivo.Icon asChild>
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-tinta-suave"
      >
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </SelectorPrimitivo.Icon>
  </SelectorPrimitivo.Trigger>
));
SelectorDisparador.displayName = "SelectorDisparador";

const SelectorContenido = React.forwardRef<
  React.ElementRef<typeof SelectorPrimitivo.Content>,
  React.ComponentPropsWithoutRef<typeof SelectorPrimitivo.Content>
>(({ className, children, position = "popper", sideOffset = 6, ...resto }, ref) => (
  <SelectorPrimitivo.Portal>
    <SelectorPrimitivo.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[var(--radix-select-trigger-width)] bg-papel border-[1.5px] border-filete-fuerte",
        className,
      )}
      {...resto}
    >
      <SelectorPrimitivo.Viewport className="p-1">
        {children}
      </SelectorPrimitivo.Viewport>
    </SelectorPrimitivo.Content>
  </SelectorPrimitivo.Portal>
));
SelectorContenido.displayName = "SelectorContenido";

const SelectorItem = React.forwardRef<
  React.ElementRef<typeof SelectorPrimitivo.Item>,
  React.ComponentPropsWithoutRef<typeof SelectorPrimitivo.Item>
>(({ className, children, ...resto }, ref) => (
  <SelectorPrimitivo.Item
    ref={ref}
    className={cn(
      "flex h-10 cursor-pointer select-none items-center px-3 text-[13.5px] text-tinta outline-none",
      "data-[highlighted]:bg-papel-panel",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className,
    )}
    {...resto}
  >
    <SelectorPrimitivo.ItemText>{children}</SelectorPrimitivo.ItemText>
  </SelectorPrimitivo.Item>
));
SelectorItem.displayName = "SelectorItem";

const SelectorEtiqueta = React.forwardRef<
  React.ElementRef<typeof SelectorPrimitivo.Label>,
  React.ComponentPropsWithoutRef<typeof SelectorPrimitivo.Label>
>(({ className, ...resto }, ref) => (
  <SelectorPrimitivo.Label
    ref={ref}
    className={cn("rotulo px-3 py-2", className)}
    {...resto}
  />
));
SelectorEtiqueta.displayName = "SelectorEtiqueta";

const SelectorSeparador = React.forwardRef<
  React.ElementRef<typeof SelectorPrimitivo.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectorPrimitivo.Separator>
>(({ className, ...resto }, ref) => (
  <SelectorPrimitivo.Separator
    ref={ref}
    className={cn("my-1 h-px bg-filete", className)}
    {...resto}
  />
));
SelectorSeparador.displayName = "SelectorSeparador";

export {
  Selector,
  SelectorGrupo,
  SelectorValor,
  SelectorDisparador,
  SelectorContenido,
  SelectorItem,
  SelectorEtiqueta,
  SelectorSeparador,
};
