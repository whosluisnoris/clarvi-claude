import Link from "next/link";
import { copy } from "@/lib/copy";
import { Rotulo } from "@/componentes/rotulo";
import { estadoContrasenaGlobal } from "@/modules/identidad/consultas-admin";

export const metadata = { title: `${copy.admin.tablero} · ${copy.admin.seccion}` };

/**
 * Tablero de administración.
 *
 * Deliberadamente escueto en esta fase: las métricas que el brief pide (§14)
 * necesitan datos de recursos y de intentos que todavía no existen. Poner
 * tarjetas con ceros no informaría de nada; mejor decir qué hay hoy y qué
 * llega con cada fase.
 */
export default async function PaginaTablero() {
  const contrasena = await estadoContrasenaGlobal();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Rotulo className="text-acento">{copy.admin.seccion}</Rotulo>
        <h1 className="text-[38px] font-bold leading-none tracking-[-0.034em]">
          {copy.admin.tablero}
        </h1>
      </div>

      <div className="flex flex-col">
        <div className="flex h-[58px] items-center gap-5 border-t-[1.5px] border-filete-fuerte">
          <span className="flex-grow text-[17px] font-medium tracking-[-0.018em]">
            Participantes dados de alta
          </span>
          <span className="font-mono text-[15px]">{contrasena.participantes}</span>
        </div>
        <div className="flex h-[58px] items-center gap-5 border-t border-filete">
          <span className="flex-grow text-[17px] font-medium tracking-[-0.018em]">
            Contraseña del grupo
          </span>
          <span className="font-mono text-[13px] text-tinta-tenue">
            {contrasena.huellaCorta
              ? copy.contrasenaGlobal.huella(contrasena.huellaCorta)
              : copy.contrasenaGlobal.nuncaRotada}
          </span>
        </div>
        <div className="flex h-[58px] items-center gap-5 border-t border-filete border-b-[1.5px] border-b-filete-fuerte">
          <span className="flex-grow text-[17px] font-medium tracking-[-0.018em] text-tinta-suave">
            Recursos, ejercicios y prompts
          </span>
          <span className="text-[13px] text-tinta-tenue">Llegan en las fases 2 a 5</span>
        </div>
      </div>

      <p className="max-w-xl text-[15px] leading-relaxed text-tinta-suave text-pretty">
        Las métricas de uso —recursos más consultados, reactivos con menor tasa
        de acierto, distribución de puntajes— necesitan datos que todavía no
        existen. Aparecen aquí conforme se construyan sus módulos.
      </p>

      <Link
        href="/admin/usuarios"
        className="w-fit border-[1.5px] border-filete-fuerte px-4 py-3 text-[13.5px] font-semibold transition-colors hover:bg-papel-panel"
      >
        Ir a {copy.usuarios.titulo.toLowerCase()}
      </Link>
    </div>
  );
}
