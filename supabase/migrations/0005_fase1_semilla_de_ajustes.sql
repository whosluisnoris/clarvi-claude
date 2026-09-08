-- Fase 1 · Ajustes iniciales
--
-- Solo configuración, ningún dato de prueba: los usuarios y cohortes de ejemplo los crea
-- scripts/semilla.ts, que sí puede hablar con Auth. Una migración no puede crear usuarios.
--
-- `on conflict do nothing` para que re-aplicar la migración sobre una base ya configurada no
-- pise lo que el facilitador haya cambiado desde /admin/ajustes.

insert into public.app_settings (key, value) values
  ('nombre_plataforma',  '"CLARVI CLAUDE"'::jsonb),
  ('mensaje_bienvenida', '"Aquí vive el material de la capacitación. Consúltalo cuando lo necesites: no hay orden obligatorio."'::jsonb),
  ('logo_url',           'null'::jsonb),
  ('favicon_url',        'null'::jsonb),
  ('color_marca',        'null'::jsonb),

  -- Hash de verificación de la contraseña global vigente. Sirve para que el panel muestre si la
  -- contraseña que el facilitador tiene apuntada es la que está en uso, sin guardarla en claro.
  -- Lo escribe la acción de rotación; nace nulo porque todavía no se ha rotado ninguna.
  ('password_global_hash', 'null'::jsonb),
  ('password_global_rotada_en', 'null'::jsonb),

  -- Dominio de los correos sintéticos. Se guarda también aquí, además de la variable de entorno,
  -- para que quede constancia de con cuál se dieron de alta los usuarios existentes: cambiarlo
  -- después de crear gente rompería el login de esas personas.
  ('dominio_correo_sintetico', '"usuarios.interno.local"'::jsonb)
on conflict (key) do nothing;
