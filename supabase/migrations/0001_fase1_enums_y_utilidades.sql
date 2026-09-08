-- Fase 1 · Enums y utilidades compartidas
--
-- Los enums se declaran extensibles a propósito: el brief (§3) advierte que puede hacer falta
-- un rol intermedio (ej. `observador`) más adelante. Agregar un valor a un enum de Postgres es
-- una operación barata; cambiar una columna de texto a enum después, no.

-- ── Roles de usuario ────────────────────────────────────────────────────────
create type public.rol_usuario as enum ('admin', 'participante');

-- ── Visibilidad de una pieza de contenido ───────────────────────────────────
-- `publico`     = cualquier usuario autenticado y activo
-- `restringido` = solo quien aparezca en content_access
create type public.visibilidad_contenido as enum ('publico', 'restringido');

-- ── Referencia polimórfica de content_access ────────────────────────────────
create type public.tipo_contenido as enum ('topic', 'resource', 'assessment', 'prompt');
create type public.tipo_principal as enum ('cohort', 'user');

-- ── Trigger de updated_at ───────────────────────────────────────────────────
-- Una sola función para todas las tablas. `search_path = ''` evita que un esquema plantado
-- por un atacante secuestre la resolución de nombres dentro de una función privilegiada.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.tocar_updated_at() is
  'Trigger BEFORE UPDATE: mantiene updated_at al día sin depender del cliente.';
