import type { Metadata } from "next";
import { Archivo, DM_Mono } from "next/font/google";
import "./globals.css";
import { copy } from "@/lib/copy";

// Archivo: grotesca de raíz modernista, con rango de peso suficiente para
// sostener la jerarquía sin recurrir a más familias. DM Mono para metadatos,
// nombres de usuario y el cuerpo de los prompts.
const archivo = Archivo({
  variable: "--fuente-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--fuente-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: copy.plataforma.nombre,
  description: copy.plataforma.descripcion,
  // No hay área pública: nada de esto debe terminar en un índice de búsqueda.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-MX"
      className={`${archivo.variable} ${dmMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
