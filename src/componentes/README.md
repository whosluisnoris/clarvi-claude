# Componentes

Componentes de interfaz de la aplicación, construidos a mano sobre
primitivas de [Radix UI](https://www.radix-ui.com) y con la dirección
visual modernista del proyecto (radio 0, sin sombras, acento reservado).

## Por qué no se usó shadcn/ui

1. **El registro está bloqueado.** El CLI de shadcn (`npx shadcn@latest add
   ...`) descarga cada componente desde `ui.shadcn.com`, y ese dominio
   responde 403 bajo la política de red de este entorno. No hay forma de
   correr el CLI aquí.
2. **Aunque funcionara, habría que deshacer casi todo su estilo por
   defecto.** shadcn/ui viene pensado para una estética con esquinas
   redondeadas (`rounded-md`, `rounded-lg`) y sombras (`shadow-sm`,
   `shadow-md`) en prácticamente todos sus componentes. La dirección de este
   proyecto prohíbe ambas cosas de forma explícita, así que adoptar el
   output del CLI habría significado generar el componente y reescribirle
   las clases de todas formas — el CLI no ahorra trabajo, lo duplica.

Por eso se optó por instalar directamente los mismos paquetes de Radix que
usa shadcn/ui (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`,
`@radix-ui/react-select`, etc. — disponibles en npm sin restricción) y
escribir los componentes de interfaz propios a partir de esas primitivas,
con las clases de Tailwind de la dirección modernista desde el primer
momento.

## Convenciones

- Todo en español: nombres de archivo, componentes, props y comentarios.
- `"use client"` solo en los componentes que usan Radix o manejan eventos
  (`boton`, `dialogo`, `menu`, `selector`). Los puramente presentacionales
  (`campo`, `tabla`, `estado`, `panel`, `rotulo`) no lo llevan.
- `cn()` (en `utilidades.ts`) combina clases con `clsx` + `tailwind-merge`;
  se usa en todos los componentes para que un `className` recibido por
  props pueda sobrescribir las clases por defecto sin conflictos.
- Ningún componente usa `rounded-*`, `shadow-*` ni `blur`. Los tokens de
  color, tipografía y filete vienen de las utilidades definidas en
  `src/app/globals.css` (no se redefinen aquí).
