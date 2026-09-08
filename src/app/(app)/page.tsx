import { copy } from "@/lib/copy";
import { Rotulo } from "@/componentes/rotulo";
import { ajustesPublicos, perfilActual } from "@/modules/identidad/consultas";

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
});

/**
 * Inicio del participante.
 *
 * Al cerrar la Fase 1 esto es, correctamente, un estado vacío: el facilitador
 * puede dar de alta gente pero todavía no hay material que publicar. En vez de
 * una pantalla en blanco o una tabla sin filas, dice qué está pasando y qué va
 * a aparecer (brief §9).
 */
export default async function PaginaInicio() {
  const [perfil, ajustes] = await Promise.all([perfilActual(), ajustesPublicos()]);
  if (!perfil) return null;

  const bienvenida =
    typeof ajustes.mensaje_bienvenida === "string"
      ? ajustes.mensaje_bienvenida
      : null;

  const primerNombre = perfil.display_name.split(/\s+/)[0] ?? perfil.display_name;

  const secciones = [
    { nombre: copy.navegacion.temas, descripcion: copy.inicio.vacioTemas },
    { nombre: copy.navegacion.recursos, descripcion: copy.inicio.vacioRecursos },
    { nombre: copy.navegacion.ejercicios, descripcion: copy.inicio.vacioEjercicios },
    { nombre: copy.navegacion.prompts, descripcion: copy.inicio.vacioPrompts },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        <div className="flex flex-grow flex-col gap-3">
          <h1 className="text-[34px] font-bold leading-none tracking-[-0.035em] md:text-[46px]">
            {copy.inicio.saludo(primerNombre)}
          </h1>
          {bienvenida ? (
            <p className="max-w-[560px] text-[16px] leading-relaxed text-tinta-suave text-pretty md:text-[17px]">
              {bienvenida}
            </p>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-1.5 border-t-2 border-filete-fuerte pt-2.5 md:w-[232px]">
          <Rotulo>{copy.inicio.tuGrupo}</Rotulo>
          <span className="text-base font-medium tracking-[-0.015em]">
            {perfil.cohorts?.name ?? copy.inicio.sinCohorte}
          </span>
          {perfil.cohorts?.starts_at ? (
            <span className="text-[13px] text-tinta-tenue">
              Inició el {formatoFecha.format(new Date(perfil.cohorts.starts_at))}
            </span>
          ) : null}
        </div>
      </div>

      <div className="h-[3px] bg-filete-fuerte" />

      <div className="flex items-start gap-5 md:gap-7">
        <span className="hidden w-[46px] shrink-0 pt-1 font-mono text-[13px] font-medium text-acento md:block">
          —
        </span>

        <div className="flex flex-grow flex-col gap-8">
          <div className="flex max-w-[620px] flex-col gap-3">
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.026em] md:text-[26px]">
              {copy.inicio.vacioTitulo}
            </h2>
            <p className="text-[15px] leading-relaxed text-tinta-suave text-pretty md:text-[15.5px]">
              {copy.inicio.vacioCuerpo}
            </p>
          </div>

          <div className="flex max-w-[720px] flex-col">
            <Rotulo className="pb-3">{copy.inicio.vacioListaTitulo}</Rotulo>
            {secciones.map((seccion, indice) => (
              <div
                key={seccion.nombre}
                className={`flex min-h-[58px] flex-col justify-center gap-0.5 py-2 md:h-[58px] md:flex-row md:items-center md:gap-5 md:py-0 ${
                  indice === 0
                    ? "border-t-[1.5px] border-filete-fuerte"
                    : "border-t border-filete"
                } ${indice === secciones.length - 1 ? "border-b border-filete" : ""}`}
              >
                <span className="flex-grow text-[17px] font-medium tracking-[-0.018em] text-tinta-suave">
                  {seccion.nombre}
                </span>
                <span className="text-[13px] text-tinta-tenue">
                  {seccion.descripcion}
                </span>
                <span className="hidden w-[34px] text-right font-mono text-[12.5px] text-tinta-tenue md:inline">
                  0
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
