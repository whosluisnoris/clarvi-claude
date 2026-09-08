import { NextResponse, type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

/**
 * Protección de rutas y refresco de sesión.
 *
 * Esta aplicación no tiene área pública: /login es la única puerta y todo lo
 * demás exige sesión (brief §8). La denegación es por defecto — se listan las
 * rutas abiertas, no las cerradas, para que una ruta nueva nazca protegida y
 * no haya que acordarse de añadirla a ninguna lista.
 *
 * El rol NO se verifica aquí. Saber si alguien es admin exige consultar
 * profiles, y hacerlo en el middleware costaría una consulta en cada petición,
 * incluida cada imagen. El guardia de rol vive en el layout de /admin, que es
 * un Server Component y ya está consultando el perfil de todas formas; y por
 * debajo, RLS impide leer datos ajenos aunque el guardia fallara.
 */

const RUTAS_ABIERTAS = ["/login"];

export async function middleware(peticion: NextRequest) {
  const { respuesta, usuario } = await actualizarSesion(peticion);
  const ruta = peticion.nextUrl.pathname;
  const esRutaAbierta = RUTAS_ABIERTAS.some(
    (abierta) => ruta === abierta || ruta.startsWith(`${abierta}/`),
  );

  if (!usuario && !esRutaAbierta) {
    const destino = peticion.nextUrl.clone();
    destino.pathname = "/login";
    // Sin parámetro de retorno a propósito: aceptar una URL de destino desde
    // la petición es el vector clásico de redirección abierta, y en una app
    // con una sola puerta y pocas pantallas no compensa el riesgo.
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  if (usuario && esRutaAbierta) {
    const destino = peticion.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: [
    /*
     * Todo salvo lo que no puede llevar sesión de todos modos: los internos de
     * Next, los archivos estáticos y las imágenes. Ejecutar el middleware en
     * cada uno de esos añadiría una llamada a Auth por recurso.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
