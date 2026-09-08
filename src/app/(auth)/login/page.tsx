import { copy } from "@/lib/copy";
import { FormularioAcceso } from "@/modules/identidad/componentes/formulario-acceso";

export const metadata = { title: `${copy.acceso.titulo} · ${copy.plataforma.nombre}` };

export default function PaginaLogin() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Bloque de marca: la única superficie de tinta a plena altura. En
          teléfono se encoge a una franja para no comerse la pantalla antes
          de que se vea el formulario. */}
      <div className="flex shrink-0 flex-col gap-0 bg-tinta px-8 py-8 text-sobre-tinta md:w-[490px] md:px-12 md:py-13">
        <div className="text-[17px] font-bold tracking-tight">
          CLARVI<span className="text-acento">·</span>CLAUDE
        </div>

        <div className="hidden flex-grow md:block" />

        <div className="mt-8 flex flex-col gap-5 md:mt-0">
          <div className="h-1 w-18 bg-acento" />
          <h1 className="max-w-[370px] text-[28px] font-bold leading-[1.04] tracking-[-0.035em] text-pretty md:text-[40px]">
            {copy.acceso.marcaFrase}
          </h1>
          <p className="hidden max-w-[340px] text-[15px] leading-relaxed text-sobre-tinta-tenue text-pretty md:block">
            {copy.acceso.marcaApoyo}
          </p>
        </div>

        <div className="hidden flex-grow md:block" />

        <div className="mt-6 hidden font-mono text-[11px] uppercase tracking-[0.14em] text-sobre-tinta-tenue md:mt-0 md:block">
          {copy.acceso.soloInscritos}
        </div>
      </div>

      <div className="flex flex-grow items-center justify-center px-6 py-10 md:p-13">
        <FormularioAcceso />
      </div>
    </div>
  );
}
