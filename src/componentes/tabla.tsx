import * as React from "react";

import { cn } from "@/componentes/utilidades";

/**
 * Primitivas de tabla presentacionales. Sin cebra, sin sombra, sin
 * redondeo: la separación entre filas se resuelve con filetes horizontales,
 * nunca con fondos alternos. `TablaCuerpo` decide el grosor de los filetes
 * de cada fila por posición (primera y última más marcadas) mediante
 * selectores CSS, para que quien use el componente no tenga que pasar props
 * extra por fila.
 */

function Tabla({
  className,
  ...resto
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-[13.5px] text-tinta", className)}
        {...resto}
      />
    </div>
  );
}

function TablaCabecera({
  className,
  ...resto
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b-[1.5px] border-filete-fuerte", className)}
      {...resto}
    />
  );
}

function TablaCuerpo({
  className,
  ...resto
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        // Filete por defecto entre filas.
        "[&>tr]:border-t [&>tr]:border-t-filete",
        // Primera fila: filete de arriba marcado (cierra el bloque de cabecera).
        "[&>tr:first-child]:border-t-[1.5px] [&>tr:first-child]:border-t-filete-fuerte",
        // Última fila: además, filete de abajo marcado (cierra la tabla).
        "[&>tr:last-child]:border-b-[1.5px] [&>tr:last-child]:border-b-filete-fuerte",
        className,
      )}
      {...resto}
    />
  );
}

function TablaFila({
  className,
  ...resto
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("h-[54px]", className)} {...resto} />;
}

function TablaEncabezado({
  className,
  style,
  ...resto
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("rotulo px-4 text-left align-middle font-normal", className)}
      // El rótulo global es 10.5px; en cabecera de tabla se usa 10px. Se fija
      // por estilo en línea porque `.rotulo` no está en una capa de Tailwind
      // y una utilidad `text-[10px]` no podría ganarle por cascada.
      style={{ fontSize: "10px", ...style }}
      {...resto}
    />
  );
}

function TablaCelda({
  className,
  ...resto
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 align-middle", className)} {...resto} />;
}

export { Tabla, TablaCabecera, TablaCuerpo, TablaFila, TablaEncabezado, TablaCelda };
