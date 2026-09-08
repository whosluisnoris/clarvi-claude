/**
 * Todo el texto visible de la interfaz, en un solo lugar.
 *
 * El brief (§9) lo pide así para poder ajustar el tono sin cazar cadenas por
 * el código. Y deja el proyecto listo para internacionalizar si algún día hace
 * falta: sería cambiar este objeto por un diccionario con idioma, sin tocar
 * ningún componente.
 *
 * Español de México. Se trata de usted a nadie: la capacitación es entre
 * colegas.
 */

export const copy = {
  plataforma: {
    nombre: "CLARVI CLAUDE",
    descripcion:
      "El material de la capacitación en Claude: presentaciones, ejercicios y prompts, organizados por tema.",
  },

  acceso: {
    titulo: "Entrar",
    subtitulo: "Tu nombre de usuario y la contraseña del grupo.",
    marcaFrase: "El material de la capacitación, cuando lo necesites.",
    marcaApoyo:
      "Presentaciones, ejercicios y prompts, organizados por tema. Sin orden obligatorio: entras a lo que te sirva.",
    soloInscritos: "Acceso solo para participantes inscritos",

    campoUsuario: "Usuario",
    campoContrasena: "Contraseña",
    botonEntrar: "Entrar",
    botonEntrando: "Entrando…",

    ayudaTitulo: "¿No puedes entrar?",
    ayudaCuerpo:
      "Las cuentas las da de alta tu facilitador. Escríbele para que te confirme tu usuario o te comparta la contraseña vigente.",

    /**
     * Un solo mensaje para todos los fallos posibles: usuario inexistente,
     * contraseña incorrecta, cuenta desactivada, cohorte vencida.
     *
     * Es deliberado (brief §4.5). Un mensaje que distinga "ese usuario no
     * existe" de "contraseña incorrecta" convierte el formulario en una
     * herramienta para averiguar quién está inscrito. No hay que mejorarlo.
     */
    errorGenerico: "Usuario o contraseña incorrectos.",
    errorIntentosRestantes: (n: number) =>
      `Usuario o contraseña incorrectos. Te ${n === 1 ? "queda 1 intento" : `quedan ${n} intentos`} antes de que se bloquee el acceso por 15 minutos.`,
    errorBloqueado:
      "Demasiados intentos fallidos. Vuelve a intentar en unos minutos.",

    validacionUsuarioVacio: "Escribe tu nombre de usuario.",
    validacionUsuarioFormato:
      "El usuario solo lleva minúsculas, números, punto, guion y guion bajo.",
    validacionContrasenaVacia: "Escribe la contraseña del grupo.",
  },

  inicio: {
    saludo: (nombre: string) => `Hola, ${nombre}.`,
    tuGrupo: "Tu grupo",
    sinCohorte: "Sin grupo asignado",
    vacioTitulo: "Todavía no hay material publicado.",
    vacioCuerpo:
      "Tu facilitador va a ir subiendo las presentaciones, los ejercicios y los prompts conforme avance la capacitación. Cuando publique algo, aparece aquí sin que tengas que hacer nada.",
    vacioListaTitulo: "Lo que va a aparecer aquí",
    vacioTemas: "El eje que organiza todo lo demás",
    vacioRecursos: "Presentaciones, guías y videos",
    vacioEjercicios: "Con retroalimentación inmediata",
    vacioPrompts: "Listos para copiar y ajustar",
  },

  navegacion: {
    inicio: "Inicio",
    temas: "Temas",
    recursos: "Recursos",
    ejercicios: "Ejercicios",
    prompts: "Prompts",
    miProgreso: "Mi progreso",
    cuenta: "Cuenta",
    cerrarSesion: "Cerrar sesión",
  },

  admin: {
    seccion: "Administración",
    tablero: "Tablero",
    usuarios: "Usuarios",
    cohortes: "Cohortes",
    temas: "Temas",
    recursos: "Recursos",
    evaluaciones: "Evaluaciones",
    prompts: "Prompts",
    resultados: "Resultados",
    ajustes: "Ajustes",
    auditoria: "Auditoría",
  },

  usuarios: {
    titulo: "Usuarios",
    buscar: "Buscar por usuario o nombre",
    todosLosEstados: "Todos los estados",
    conteo: (n: number) => (n === 1 ? "1 usuario" : `${n} usuarios`),

    columnaUsuario: "Usuario",
    columnaNombre: "Nombre",
    columnaCohorte: "Cohorte",
    columnaRol: "Rol",
    columnaUltimoAcceso: "Último acceso",
    columnaEstado: "Estado",

    estadoActivo: "Activo",
    estadoDesactivado: "Desactivado",
    estadoSinEntrar: "Sin entrar",
    nuncaEntro: "nunca",

    rolAdmin: "Admin",
    rolParticipante: "Participante",

    agregar: "Agregar usuario",
    cargaCsv: "Carga por CSV",
    activar: "Activar",
    desactivar: "Desactivar",

    altaTitulo: "Agregar usuario",
    altaUsuario: "Nombre de usuario",
    altaUsuarioAyuda:
      "Minúsculas, sin espacios. Es con lo que la persona va a entrar y no se puede cambiar después.",
    altaNombre: "Nombre visible",
    altaCohorte: "Cohorte",
    altaRol: "Rol",
    altaNotas: "Notas",
    altaNotasAyuda: "Solo para ti. El participante no las ve.",
    altaContrasenaAdmin: "Contraseña",
    altaContrasenaAdminAyuda:
      "Los admins usan contraseña propia y quedan fuera de la rotación del grupo.",
    altaGuardar: "Dar de alta",

    csvTitulo: "Carga por CSV",
    csvAyuda:
      "Un archivo con las columnas usuario, nombre y cohorte. Se te muestra qué filas entran y cuáles tienen problemas antes de guardar nada.",
    csvFilasValidas: (n: number) =>
      n === 1 ? "1 fila lista para cargar" : `${n} filas listas para cargar`,
    csvFilasConProblema: (n: number) =>
      n === 1 ? "1 fila con problemas" : `${n} filas con problemas`,
    csvUsuarioRepetido: "Ese usuario ya existe",
    csvUsuarioInvalido: "El usuario tiene caracteres que no se permiten",
    csvFaltaNombre: "Falta el nombre visible",
    csvConfirmar: "Cargar las filas válidas",
  },

  contrasenaGlobal: {
    rotulo: "Contraseña del grupo",
    nuncaRotada: "Todavía no se ha rotado",
    rotadaHace: (dias: number) =>
      dias === 0
        ? "Rotada hoy"
        : dias === 1
          ? "Rotada ayer"
          : `Rotada hace ${dias} días`,
    huella: (h: string) => `huella ${h}`,
    alcance: (n: number) =>
      `Aplica a ${n === 1 ? "1 participante" : `los ${n} participantes`}. Los admins tienen contraseña propia y no entran en la rotación.`,

    rotar: "Rotar contraseña",
    rotarTitulo: "Rotar la contraseña del grupo",
    rotarAdvertencia:
      "Al rotarla, todos los participantes que estén dentro se salen de su sesión y tendrán que entrar de nuevo con la contraseña nueva. Asegúrate de poder compartírsela antes de continuar.",
    rotarNueva: "Contraseña nueva",
    rotarConfirmar: "Rotar y cerrar sesiones",
    rotarEnCurso: (hechos: number, total: number) =>
      `Actualizando ${hechos} de ${total}…`,
    rotarListo: (n: number) =>
      `Listo. Se actualizó la contraseña de ${n === 1 ? "1 participante" : `${n} participantes`}.`,
    rotarConFallos: (ok: number, fallidos: number) =>
      `Se actualizaron ${ok}, pero ${fallidos === 1 ? "1 quedó" : `${fallidos} quedaron`} sin cambiar. Vuelve a intentar: los que ya cambiaron no se ven afectados.`,
  },

  cohortes: {
    titulo: "Cohortes",
    nombre: "Nombre",
    descripcion: "Descripción",
    inicia: "Inicia",
    termina: "Termina",
    terminaAyuda:
      "Opcional. Si le pones fecha, al pasar se bloquea el acceso de ese grupo. Déjalo vacío para acceso permanente.",
    participantes: (n: number) =>
      n === 1 ? "1 participante" : `${n} participantes`,
    agregar: "Agregar cohorte",
  },

  general: {
    guardar: "Guardar",
    cancelar: "Cancelar",
    cerrar: "Cerrar",
    volver: "Volver",
    cargando: "Cargando…",
    sinDatos: "Nada que mostrar todavía.",
    errorInesperado:
      "Algo salió mal. Vuelve a intentar; si sigue pasando, avísale a tu facilitador.",
  },
} as const;
