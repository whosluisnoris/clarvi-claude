-- Fase 1 · Cerrar por la fuerza las sesiones de una persona
--
-- POR QUÉ HACE FALTA
--
-- La rotación de la contraseña global existe para cortar el acceso cuando la
-- contraseña se filtra (brief §4.3). Pero cambiarla con la Admin API de Auth
-- NO revoca los refresh tokens ya emitidos: quien tuviera la sesión abierta
-- seguiría dentro hasta que expirara sola, que es exactamente lo que la
-- rotación pretende evitar. Sin esto, rotar da una sensación de seguridad que
-- no corresponde a lo que realmente pasa.
--
-- Borrar la sesión de auth.sessions arrastra en cascada sus refresh tokens, y
-- es la forma documentada de revocar.
--
-- Se usa también al desactivar a una persona: si is_active pasa a false pero
-- su sesión sigue viva, seguiría entrando hasta que caduque.

create or replace function public.cerrar_sesiones_de(id_usuario uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cerradas integer;
begin
  delete from auth.sessions where user_id = id_usuario;
  get diagnostics cerradas = row_count;
  return cerradas;
end;
$$;

comment on function public.cerrar_sesiones_de(uuid) is
  'Revoca todas las sesiones activas de una persona. Solo para service_role: la llaman la rotación de contraseña y la desactivación de usuarios.';

-- Nadie con sesión de navegador puede invocarla: solo el servidor, con la
-- clave de servicio. Un participante que pudiera llamarla desconectaría a
-- cualquiera pasando un uuid.
revoke execute on function public.cerrar_sesiones_de(uuid)
  from public, anon, authenticated;
grant execute on function public.cerrar_sesiones_de(uuid) to service_role;
