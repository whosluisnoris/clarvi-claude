-- Fase 1 · Corrección: el patrón de username aceptaba un solo carácter
--
-- La restricción original era:
--
--     username ~ '^[a-z0-9]([a-z0-9._-]{1,30}[a-z0-9])?$'
--
-- El grupo lleva `?`, así que puede saltarse por completo: la expresión
-- quedaba satisfecha con UN solo carácter alfanumérico. Justo lo que el mínimo
-- de 3 pretendía impedir. Curiosamente sí rechazaba los de dos caracteres,
-- porque el grupo exige al menos dos — un comportamiento que nadie habría
-- adivinado leyendo la intención.
--
-- Lo encontró una prueba unitaria del patrón equivalente en TypeScript
-- (src/modules/identidad/esquemas.ts). Se corrige en ambos lados: el de
-- TypeScript da el mensaje de error amable, este es el que de verdad impide
-- que entre el dato.
--
-- Sin grupo opcional, el rango de longitud queda explícito: 1 + [1,30] + 1,
-- o sea entre 3 y 32 caracteres.

alter table public.profiles
  drop constraint if exists profiles_username_formato;

alter table public.profiles
  add constraint profiles_username_formato
  check (username ~ '^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$');

comment on constraint profiles_username_formato on public.profiles is
  'Entre 3 y 32 caracteres, empieza y termina en alfanumérico. Debe coincidir con PATRON_USUARIO en src/modules/identidad/esquemas.ts.';
