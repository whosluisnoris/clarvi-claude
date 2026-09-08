import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { entorno } from "@/lib/entorno";
import type { Database } from "@/tipos/base-de-datos";

/**
 * Refresca la sesión en cada petición y devuelve tanto la respuesta con las
 * cookies actualizadas como el usuario verificado.
 *
 * El baile de cookies de aquí es el que exige @supabase/ssr: hay que escribir
 * los tokens renovados TANTO en la petición (para que el render que viene
 * después los vea) como en la respuesta (para que el navegador los guarde).
 * Saltarse cualquiera de los dos produce un cierre de sesión intermitente que
 * cuesta muchísimo diagnosticar.
 */
export async function actualizarSesion(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient<Database>(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return peticion.cookies.getAll();
        },
        setAll(cookiesPorEscribir) {
          for (const { name, value } of cookiesPorEscribir) {
            peticion.cookies.set(name, value);
          }
          respuesta = NextResponse.next({ request: peticion });
          for (const { name, value, options } of cookiesPorEscribir) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser y no getSession: getSession se fía de la cookie sin revalidar la
  // firma del JWT. En un middleware que decide quién pasa, eso no alcanza.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { respuesta, usuario: user };
}
