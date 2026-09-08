-- Fase 1 · Las funciones de trigger no deben ser invocables como RPC
--
-- Lo encontró el linter de seguridad de Supabase después de aplicar la fase 1:
-- `tocar_updated_at()` y `proteger_campos_de_perfil()` son SECURITY DEFINER y
-- quedaron con EXECUTE para `public`, lo que las expone en
-- /rest/v1/rpc/<nombre> incluso para `anon`, que ni siquiera tiene sesión.
--
-- Llamarlas fuera de un trigger falla (no hay NEW ni OLD), así que el riesgo
-- práctico es bajo. Pero son funciones privilegiadas publicadas en la API sin
-- que nadie lo haya decidido, y eso es exactamente el tipo de superficie que
-- no debe quedarse ahí "porque no se puede explotar hoy".
--
-- Revocar no rompe los triggers: un trigger se ejecuta por el mecanismo del
-- motor con los privilegios del dueño de la tabla, no por el EXECUTE de quien
-- hace el INSERT o el UPDATE.

revoke execute on function public.tocar_updated_at()
  from public, anon, authenticated;

revoke execute on function public.proteger_campos_de_perfil()
  from public, anon, authenticated;

-- Las otras cuatro SÍ conservan EXECUTE para `authenticated`, y es
-- deliberado: las políticas RLS evalúan sus expresiones como el usuario que
-- consulta, así que sin este permiso toda política que las use fallaría.
--
-- Exponerlas por RPC es aceptable porque ninguna revela nada que quien llama
-- no pueda averiguar de todos modos:
--   · es_admin()        → si uno mismo es admin
--   · usuario_activo()  → si uno mismo sigue habilitado
--   · cohorte_actual()  → la propia cohorte, legible ya desde el propio perfil
--   · ajustes_publicos()→ la lista blanca de ajustes, pensada para eso
--
-- Ninguna acepta argumentos, así que tampoco se pueden usar para consultar por
-- terceros. `anon` ya las tiene revocadas desde la migración 0004.
comment on function public.es_admin() is
  'True si quien hace la petición es admin y está activo. SECURITY DEFINER para evitar recursión de RLS sobre profiles. EXECUTE para authenticated es necesario: las políticas la evalúan como el usuario que consulta.';
