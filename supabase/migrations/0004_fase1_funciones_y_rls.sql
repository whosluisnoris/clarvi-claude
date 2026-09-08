-- Fase 1 · Funciones de autorización y políticas RLS
--
-- Principio rector (brief §5.2.1): denegación por defecto. Se habilita RLS en todas las tablas
-- y solo se concede lo que está escrito abajo. Una tabla nueva sin políticas es una tabla
-- inaccesible, que es exactamente lo que queremos si a alguien se le olvida escribirlas.

-- ═══════════════════════════════════════════════════════════════════════════
-- Funciones de autorización
-- ═══════════════════════════════════════════════════════════════════════════

-- ¿Quien hace esta petición es admin?
--
-- SECURITY DEFINER es obligatorio aquí, no una optimización: una política sobre `profiles` que
-- consultara `profiles` para saber el rol volvería a disparar la misma política, y Postgres
-- aborta con recursión infinita. Al ejecutarse como su dueño, la función salta RLS y corta el
-- ciclo. `set search_path = ''` cierra el vector de secuestro de esquema que abre DEFINER.
--
-- Se descartó leer el rol de auth.jwt() -> app_metadata: es más rápido, pero el rol queda
-- obsoleto hasta el siguiente refresh del token, y degradar a un admin debe surtir efecto ya.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and is_active
  );
$$;

comment on function public.es_admin() is
  'True si quien hace la petición es admin y está activo. SECURITY DEFINER para evitar recursión '
  'de RLS sobre profiles.';

-- ¿La persona sigue habilitada para entrar?
-- Se usa como guarda transversal: desactivar a alguien lo saca de todo sin tocar cada política.
create or replace function public.usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.cohorts c on c.id = p.cohort_id
    where p.id = (select auth.uid())
      and p.is_active
      and (c.id is null or (c.is_active and (c.ends_at is null or c.ends_at > now())))
  );
$$;

comment on function public.usuario_activo() is
  'True si la persona está activa y su cohorte (si tiene) sigue vigente. Una cohorte con ends_at '
  'vencido bloquea el acceso a nivel de base, no solo en el login.';

-- ¿A qué cohorte pertenece?
create or replace function public.cohorte_actual()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cohort_id from public.profiles where id = (select auth.uid());
$$;

-- Ajustes que sí puede ver un participante.
--
-- app_settings guarda en la misma tabla el nombre de la plataforma y el hash de verificación de
-- la contraseña global. Abrir la lectura de la tabla entera para poder pintar un logo sería
-- regalar lo segundo. Esta función devuelve solo la lista blanca.
create or replace function public.ajustes_publicos()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
  from public.app_settings
  where key in (
    'nombre_plataforma',
    'mensaje_bienvenida',
    'logo_url',
    'favicon_url',
    'color_marca'
  );
$$;

comment on function public.ajustes_publicos() is
  'Lista blanca de ajustes visibles para cualquier usuario autenticado. Deja fuera el hash de la '
  'contraseña global y el dominio sintético.';

-- Solo usuarios autenticados pueden invocarlas. No hay área pública en esta aplicación.
revoke execute on function public.es_admin(), public.usuario_activo(),
                          public.cohorte_actual(), public.ajustes_publicos()
  from public, anon;
grant execute on function public.es_admin(), public.usuario_activo(),
                          public.cohorte_actual(), public.ajustes_publicos()
  to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.cohorts        enable row level security;
alter table public.profiles       enable row level security;
alter table public.app_settings   enable row level security;
alter table public.audit_log      enable row level security;
alter table public.login_attempts enable row level security;
alter table public.content_access enable row level security;

-- No hay registro público ni área anónima: `anon` no tiene nada que hacer en ninguna tabla.
-- Esto es redundante con RLS a propósito — si un día alguien agrega una política mal escrita,
-- la falta de GRANT sigue deteniendo a un visitante sin sesión.
revoke all on public.cohorts, public.profiles, public.app_settings,
               public.audit_log, public.login_attempts, public.content_access
  from anon;

-- ── profiles ────────────────────────────────────────────────────────────────
-- Una persona se ve a sí misma. Nadie más. El admin ve a todos.
create policy "perfiles: leer el propio o todos si es admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.es_admin());

-- Actualizar el propio perfil habilita /cuenta (nombre visible, avatar). Las columnas sensibles
-- las blinda el trigger profiles_proteger_campos de 0002: RLS no distingue columnas.
create policy "perfiles: actualizar el propio o cualquiera si es admin"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.es_admin())
  with check (id = (select auth.uid()) or public.es_admin());

create policy "perfiles: solo el admin da de alta"
  on public.profiles for insert to authenticated
  with check (public.es_admin());

create policy "perfiles: solo el admin borra"
  on public.profiles for delete to authenticated
  using (public.es_admin());

-- ── cohorts ─────────────────────────────────────────────────────────────────
-- Un participante necesita leer el nombre de SU cohorte para verlo en pantalla; no le interesan
-- las demás, y saber cuántas generaciones hay no es asunto suyo.
create policy "cohortes: la propia, o todas si es admin"
  on public.cohorts for select to authenticated
  using (public.es_admin() or id = public.cohorte_actual());

create policy "cohortes: solo el admin escribe"
  on public.cohorts for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ── app_settings ────────────────────────────────────────────────────────────
-- Lectura directa solo para admin. El resto pasa por public.ajustes_publicos().
create policy "ajustes: solo el admin"
  on public.app_settings for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ── audit_log ───────────────────────────────────────────────────────────────
-- Solo SELECT, y solo admin. La ausencia de políticas de INSERT, UPDATE y DELETE es intencional:
-- se escribe exclusivamente con la clave de servicio, y nadie puede alterar ni borrar el rastro.
create policy "auditoria: solo lectura y solo el admin"
  on public.audit_log for select to authenticated
  using (public.es_admin());

revoke insert, update, delete on public.audit_log from authenticated;

-- ── login_attempts ──────────────────────────────────────────────────────────
-- Igual: el motor de login escribe con clave de servicio. Un participante no debe poder ni
-- consultar si un username existe (sería enumeración por la puerta de atrás) ni ensuciar el
-- contador de intentos.
create policy "intentos: solo lectura y solo el admin"
  on public.login_attempts for select to authenticated
  using (public.es_admin());

revoke insert, update, delete on public.login_attempts from authenticated;

-- ── content_access ──────────────────────────────────────────────────────────
-- Sin uso en v1, pero con RLS puesta desde ya: una tabla vacía sin políticas es una tabla que
-- alguien va a llenar en la fase 2 sin acordarse de protegerla.
create policy "accesos: solo el admin"
  on public.content_access for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());
