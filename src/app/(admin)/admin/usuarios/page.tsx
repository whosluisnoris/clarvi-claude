import { copy } from "@/lib/copy";
import { Rotulo } from "@/componentes/rotulo";
import {
  USUARIOS_POR_PAGINA,
  estadoContrasenaGlobal,
  listarCohortes,
  listarUsuarios,
} from "@/modules/identidad/consultas-admin";
import { BloqueContrasenaGlobal } from "@/modules/identidad/componentes/bloque-contrasena-global";
import { FiltrosUsuarios } from "@/modules/identidad/componentes/filtros-usuarios";
import { TablaUsuarios } from "@/modules/identidad/componentes/tabla-usuarios";
import { AccionesAltaUsuarios } from "@/modules/identidad/componentes/acciones-alta-usuarios";

export const metadata = { title: `${copy.usuarios.titulo} · ${copy.admin.seccion}` };

export default async function PaginaUsuarios(props: PageProps<"/admin/usuarios">) {
  const parametros = await props.searchParams;

  const leerTexto = (clave: string): string | undefined => {
    const valor = parametros[clave];
    const texto = Array.isArray(valor) ? valor[0] : valor;
    return texto && texto.length > 0 ? texto : undefined;
  };

  const estadoFiltro = leerTexto("estado");
  const pagina = Number.parseInt(leerTexto("pagina") ?? "1", 10) || 1;

  const [{ usuarios, total }, cohortes, contrasena] = await Promise.all([
    listarUsuarios({
      busqueda: leerTexto("q"),
      cohorteId: leerTexto("cohorte") ?? null,
      activo:
        estadoFiltro === "activos"
          ? true
          : estadoFiltro === "inactivos"
            ? false
            : null,
      pagina,
    }),
    listarCohortes(),
    estadoContrasenaGlobal(),
  ]);

  const ultimaPagina = Math.max(1, Math.ceil(total / USUARIOS_POR_PAGINA));

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-end gap-6">
        <div className="flex flex-grow flex-col gap-1.5">
          <Rotulo className="text-acento">{copy.admin.seccion}</Rotulo>
          <h1 className="text-[38px] font-bold leading-none tracking-[-0.034em]">
            {copy.usuarios.titulo}
          </h1>
        </div>
        <AccionesAltaUsuarios cohortes={cohortes} />
      </div>

      <BloqueContrasenaGlobal estado={contrasena} />

      <FiltrosUsuarios cohortes={cohortes} total={total} />

      <TablaUsuarios
        usuarios={usuarios}
        pagina={pagina}
        ultimaPagina={ultimaPagina}
        total={total}
      />
    </div>
  );
}
