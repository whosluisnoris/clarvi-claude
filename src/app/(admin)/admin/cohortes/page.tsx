import { copy } from "@/lib/copy";
import { Rotulo } from "@/componentes/rotulo";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { PanelCohortes } from "@/modules/identidad/componentes/panel-cohortes";

export const metadata = { title: `${copy.cohortes.titulo} · ${copy.admin.seccion}` };

export default async function PaginaCohortes() {
  const supabase = await crearClienteServidor();

  // Se cuenta la gente de cada cohorte en la misma consulta: sin esto habría
  // una consulta por fila, que es el problema N+1 clásico de estas pantallas.
  const { data } = await supabase
    .from("cohorts")
    .select("*, profiles(count)")
    .order("created_at", { ascending: false });

  const cohortes = (data ?? []).map((fila) => {
    const { profiles, ...cohorte } = fila as typeof fila & {
      profiles: { count: number }[];
    };
    return { ...cohorte, integrantes: profiles?.[0]?.count ?? 0 };
  });

  return (
    <div className="flex max-w-4xl flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <Rotulo className="text-acento">{copy.admin.seccion}</Rotulo>
        <h1 className="text-[38px] font-bold leading-none tracking-[-0.034em]">
          {copy.cohortes.titulo}
        </h1>
        <p className="max-w-xl pt-1 text-[14.5px] leading-relaxed text-tinta-suave text-pretty">
          Una cohorte agrupa a los participantes de una generación. Si le pones
          fecha de término, al pasar se bloquea el acceso de ese grupo.
        </p>
      </div>

      <PanelCohortes cohortes={cohortes} />
    </div>
  );
}
