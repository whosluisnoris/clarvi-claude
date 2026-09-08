-- Fase 1 · Cohortes y perfiles

-- ── cohorts ─────────────────────────────────────────────────────────────────
create table public.cohorts (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (length(btrim(name)) between 1 and 120),
  slug        text        not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Una cohorte que termina antes de empezar es un error de captura, no un caso de negocio.
  constraint cohorts_rango_valido check (ends_at is null or starts_at is null or ends_at > starts_at)
);

comment on table  public.cohorts        is 'Generación o grupo de capacitación.';
comment on column public.cohorts.ends_at is
  'Nullable a propósito: por decisión del facilitador el acceso es permanente. Si tiene valor, '
  'el login lo valida y bloquea la entrada — es la mitigación por si la contraseña global se filtra.';

create index cohorts_activas_idx on public.cohorts (is_active) where is_active;

create trigger cohorts_updated_at
  before update on public.cohorts
  for each row execute function public.tocar_updated_at();

-- ── profiles ────────────────────────────────────────────────────────────────
-- Extiende auth.users. El correo de auth.users es SINTÉTICO (<username>@<dominio>) y nunca
-- se muestra: la identidad visible de una persona es su username, que vive aquí.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text        not null unique,
  display_name  text        not null check (length(btrim(display_name)) between 1 and 120),
  role          public.rol_usuario not null default 'participante',
  cohort_id     uuid        references public.cohorts (id) on delete set null,
  is_active     boolean     not null default true,
  avatar_url    text,
  notes         text,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- El username se guarda ya normalizado. La restricción lo vuelve invariante de la base y no
  -- solo del código: si alguna vez se inserta desde psql o desde un script, sigue siendo válido.
  constraint profiles_username_formato check (username ~ '^[a-z0-9]([a-z0-9._-]{1,30}[a-z0-9])?$')
);

comment on table  public.profiles          is 'Identidad visible de cada persona. El correo de auth.users es sintético y nunca se muestra.';
comment on column public.profiles.username is 'Minúsculas, sin espacios, ya normalizado. Determina qué contenido ve la persona.';
comment on column public.profiles.notes    is 'Texto libre del admin. No es visible para el participante.';

create index profiles_cohorte_idx on public.profiles (cohort_id) where cohort_id is not null;
create index profiles_rol_idx     on public.profiles (role);
create index profiles_activos_idx on public.profiles (is_active) where is_active;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.tocar_updated_at();

-- ── Blindaje contra escalación de privilegios ───────────────────────────────
-- La política RLS deja a una persona actualizar SU propia fila (para /cuenta: nombre visible y
-- avatar). RLS no distingue columnas, así que sin esto un participante podría hacerse admin con
-- un solo UPDATE. Este trigger devuelve a su valor anterior todo campo sensible cuando quien
-- actualiza no es admin — el privilegio no depende de que el frontend se porte bien.
create or replace function public.proteger_campos_de_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.es_admin() then
    return new;
  end if;

  new.id            := old.id;
  new.username      := old.username;
  new.role          := old.role;
  new.cohort_id     := old.cohort_id;
  new.is_active     := old.is_active;
  new.notes         := old.notes;
  new.last_login_at := old.last_login_at;
  new.created_at    := old.created_at;

  return new;
end;
$$;

comment on function public.proteger_campos_de_perfil() is
  'Impide que un participante se otorgue rol, cambie de cohorte o se reactive editando su perfil.';

-- El trigger se declara aquí pero es_admin() se crea en 0004; PL/pgSQL resuelve la llamada en
-- tiempo de ejecución, así que el orden de creación no importa. La migración 0004 verifica que
-- la función exista antes de dar por buenas las políticas.
create trigger profiles_proteger_campos
  before update on public.profiles
  for each row execute function public.proteger_campos_de_perfil();
