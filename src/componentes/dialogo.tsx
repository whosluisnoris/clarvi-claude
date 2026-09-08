"use client";

import * as React from "react";
import * as DialogoPrimitivo from "@radix-ui/react-dialog";

import { cn } from "@/componentes/utilidades";

/**
 * Diálogo modal sobre @radix-ui/react-dialog. Superposición negra al 40%,
 * contenido centrado con filete de 1.5px, sin redondeo ni sombra, ancho
 * máximo 520px.
 */
const Dialogo = DialogoPrimitivo.Root;
const DialogoDisparador = DialogoPrimitivo.Trigger;

const DialogoSuperposicion = React.forwardRef<
  React.ElementRef<typeof DialogoPrimitivo.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogoPrimitivo.Overlay>
>(({ className, ...resto }, ref) => (
  <DialogoPrimitivo.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/40", className)}
    {...resto}
  />
));
DialogoSuperposicion.displayName = "DialogoSuperposicion";

const DialogoContenido = React.forwardRef<
  React.ElementRef<typeof DialogoPrimitivo.Content>,
  React.ComponentPropsWithoutRef<typeof DialogoPrimitivo.Content>
>(({ className, children, ...resto }, ref) => (
  <DialogoPrimitivo.Portal>
    <DialogoSuperposicion />
    <DialogoPrimitivo.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2",
        "bg-papel border-[1.5px] border-filete-fuerte p-6 outline-none",
        className,
      )}
      {...resto}
    >
      {children}
      <DialogoPrimitivo.Close
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center text-tinta-suave hover:text-tinta"
        aria-label="Cerrar"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1L15 15M15 1L1 15"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </DialogoPrimitivo.Close>
    </DialogoPrimitivo.Content>
  </DialogoPrimitivo.Portal>
));
DialogoContenido.displayName = "DialogoContenido";

const DialogoTitulo = React.forwardRef<
  React.ElementRef<typeof DialogoPrimitivo.Title>,
  React.ComponentPropsWithoutRef<typeof DialogoPrimitivo.Title>
>(({ className, ...resto }, ref) => (
  <DialogoPrimitivo.Title
    ref={ref}
    className={cn(
      "pr-8 text-[24px] font-semibold tracking-tight text-tinta",
      className,
    )}
    {...resto}
  />
));
DialogoTitulo.displayName = "DialogoTitulo";

const DialogoDescripcion = React.forwardRef<
  React.ElementRef<typeof DialogoPrimitivo.Description>,
  React.ComponentPropsWithoutRef<typeof DialogoPrimitivo.Description>
>(({ className, ...resto }, ref) => (
  <DialogoPrimitivo.Description
    ref={ref}
    className={cn("mt-2 text-[13.5px] text-tinta-suave", className)}
    {...resto}
  />
));
DialogoDescripcion.displayName = "DialogoDescripcion";

function DialogoPie({
  className,
  ...resto
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex justify-end gap-3", className)}
      {...resto}
    />
  );
}

export {
  Dialogo,
  DialogoDisparador,
  DialogoContenido,
  DialogoTitulo,
  DialogoDescripcion,
  DialogoPie,
};
