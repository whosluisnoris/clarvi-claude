import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind resolviendo conflictos (p. ej. `px-2` vs `px-4`)
 * y descartando valores falsy. Uso estándar en todos los componentes de esta
 * carpeta.
 */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas));
}
