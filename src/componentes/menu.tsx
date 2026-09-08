"use client";

import * as React from "react";
import * as MenuPrimitivo from "@radix-ui/react-dropdown-menu";

import { cn } from "@/componentes/utilidades";

/**
 * Menú desplegable sobre @radix-ui/react-dropdown-menu. Mismo tratamiento
 * visual que el resto: sin redondeo, sin sombra, filete de 1.5px. Items de
 * 40px de alto.
 */
const Menu = MenuPrimitivo.Root;
const MenuDisparador = MenuPrimitivo.Trigger;
const MenuGrupo = MenuPrimitivo.Group;

const MenuContenido = React.forwardRef<
  React.ElementRef<typeof MenuPrimitivo.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitivo.Content>
>(({ className, sideOffset = 6, ...resto }, ref) => (
  <MenuPrimitivo.Portal>
    <MenuPrimitivo.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[200px] bg-papel border-[1.5px] border-filete-fuerte p-1",
        className,
      )}
      {...resto}
    />
  </MenuPrimitivo.Portal>
));
MenuContenido.displayName = "MenuContenido";

const MenuItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitivo.Item>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitivo.Item>
>(({ className, ...resto }, ref) => (
  <MenuPrimitivo.Item
    ref={ref}
    className={cn(
      "flex h-10 cursor-pointer select-none items-center px-3 text-[13.5px] text-tinta outline-none",
      "data-[highlighted]:bg-papel-panel",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className,
    )}
    {...resto}
  />
));
MenuItem.displayName = "MenuItem";

const MenuEtiqueta = React.forwardRef<
  React.ElementRef<typeof MenuPrimitivo.Label>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitivo.Label>
>(({ className, ...resto }, ref) => (
  <MenuPrimitivo.Label
    ref={ref}
    className={cn("rotulo px-3 py-2", className)}
    {...resto}
  />
));
MenuEtiqueta.displayName = "MenuEtiqueta";

const MenuSeparador = React.forwardRef<
  React.ElementRef<typeof MenuPrimitivo.Separator>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitivo.Separator>
>(({ className, ...resto }, ref) => (
  <MenuPrimitivo.Separator
    ref={ref}
    className={cn("my-1 h-px bg-filete", className)}
    {...resto}
  />
));
MenuSeparador.displayName = "MenuSeparador";

export { Menu, MenuDisparador, MenuGrupo, MenuContenido, MenuItem, MenuEtiqueta, MenuSeparador };
