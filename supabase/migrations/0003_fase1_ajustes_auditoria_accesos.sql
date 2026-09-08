-- Fase 1 · Ajustes, bitácora de auditoría, intentos de acceso y content_access

-- ── app_settings ────────────────────────────────────────────────────────────
-- Clave/valor de configuración. Guarda tanto cosas inocuas (nombre de la plataforma) como el
-- hash de verificación de la contraseña global. Por eso la lectura NO es libre: ver 0004, donde
-- solo un puñado de claves se expone a participantes mediante una función.
create table public.app_settings (
  key        text primary key check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  value      jsonb       not null,
  updated_by uuid        references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is
  'Configuración de la aplicación. Contiene claves sensibles: la lectura es solo admin, y los '
  'ajustes públicos se exponen por public.ajustes_publicos().';

create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.tocar_updated_at();

-- ── audit_log ───────────────────────────────────────────────────────────────
-- Append-only. No hay política de UPDATE ni de DELETE en 0004, a propósito: una bitácora que se
-- puede editar no es una bitácora. Se escribe siempre con la clave de servicio.
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid        references auth.users (id) on delete set null,
  action      text        not null check (action ~ '^[a-z_]+\.[a-z_]+$'),
  entity_type text,
  entity_id   uuid,
  metadata    jsonb       not null default '{}'::jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);

comment on table  public.audit_log        is 'Bitácora de acciones administrativas. Append-only.';
comment on column public.audit_log.action is 'Formato entidad.verbo, ej. usuario.creado, password.rotada, examen.publicado.';
comment on column public.audit_log.actor_id is
  'ON DELETE SET NULL a propósito: borrar a una persona no debe borrar el rastro de lo que hizo.';

create index audit_log_reciente_idx on public.audit_log (created_at desc);
create index audit_log_actor_idx    on public.audit_log (actor_id, created_at desc);
create index audit_log_accion_idx   on public.audit_log (action, created_at desc);
create index audit_log_entidad_idx  on public.audit_log (entity_type, entity_id);

-- ── login_attempts ──────────────────────────────────────────────────────────
-- Alimenta el límite de intentos por IP y por username (brief §4.5, §10.5).
--
-- PK bigint y no uuid, a diferencia del resto del esquema: es la única tabla append-only de alta
-- rotación que se purga periódicamente y a la que nada apunta con llave foránea. Un uuid v4 como
-- PK fragmenta el índice justo en ese patrón de escritura. La desviación es deliberada.
create table public.login_attempts (
  id               bigint generated always as identity primary key,
  username_intento text        not null,
  ip               inet,
  exitoso          boolean     not null,
  created_at       timestamptz not null default now()
);

comment on table public.login_attempts is
  'Intentos de inicio de sesión, para limitar fuerza bruta. Se purga con un cron (fase 4).';

-- Índices parciales sobre los fallidos: son los únicos que el límite consulta, y son minoría.
create index login_attempts_usuario_idx on public.login_attempts (username_intento, created_at desc)
  where not exitoso;
create index login_attempts_ip_idx      on public.login_attempts (ip, created_at desc)
  where not exitoso and ip is not null;
create index login_attempts_purga_idx   on public.login_attempts (created_at);

-- ── content_access ──────────────────────────────────────────────────────────
-- Creada ahora, SIN USO hasta que haga falta.
--
-- El facilitador decidió que en v1 todo el contenido es igual para todos, y el propio brief (§16)
-- advierte contra sobre-diseñar la visibilidad. La tabla existe para que activar la restricción
-- más adelante no requiera una migración de datos; hoy nace y se queda vacía.
create table public.content_access (
  id             uuid primary key default gen_random_uuid(),
  content_type   public.tipo_contenido not null,
  content_id     uuid not null,
  principal_type public.tipo_principal not null,
  principal_id   uuid not null,
  created_at     timestamptz not null default now(),

  constraint content_access_sin_duplicados
    unique (content_type, content_id, principal_type, principal_id)
);

comment on table public.content_access is
  'Excepciones de visibilidad para contenido restringido. VACÍA Y SIN USO en v1 por decisión del '
  'facilitador. La referencia a content_id es polimórfica, así que Postgres no puede imponer '
  'integridad referencial: el trigger de validación y la limpieza en cascada llegan en la fase 2, '
  'cuando existan las tablas de contenido a las que apunta.';

create index content_access_contenido_idx on public.content_access (content_type, content_id);
create index content_access_principal_idx on public.content_access (principal_type, principal_id);
