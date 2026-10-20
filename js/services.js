/*
  SERVICIOS DE BOREALIS
  Para agregar o cambiar un servicio, copiá un bloque { ... } y editá los textos.
  hue: número de 0 a 360 que define el color de la tarjeta.
  category: agrupa los servicios en los filtros del sitio.
  status: "available" = se contratan hoy. "in_development" = todavía no se
    entrega; el sitio lo muestra marcado y sin botón de consulta para no
    prometer lo que aún no existe. Pasalo a "available" cuando haya entrega.
*/
window.SERVICES = [
  {
    id: "auditoria-tecnica",
    status: "available",
    name: "Auditoría técnica de software",
    category: "Software",
    hue: 200,
    summary: "Informe priorizado de tu código, con precio fijo y plazos cerrados.",
    description: "Revisamos tu código como lo haría un equipo senior: arquitectura, dependencias, deuda técnica, seguridad básica, rendimiento y mantenibilidad. Te entregamos un informe priorizado de P0 a P3 que separa lo urgente de lo cosmético y de lo que se puede ignorar, más una sesión de 45 minutos para explicarlo.",
    tags: ["Arquitectura", "Deuda técnica", "Seguridad básica", "Rendimiento"],
    metrics: [
      { label: "Entregable", value: "Informe priorizado P0 a P3" },
      { label: "Modalidad", value: "Precio fijo y plazos cerrados" }
    ]
  },
  {
    id: "saneamiento-codigo",
    status: "available",
    name: "Saneamiento y limpieza de código",
    category: "Software",
    hue: 175,
    summary: "Arreglos entregados como pull requests sobre tu repositorio.",
    description: "Con la auditoría como base, entregamos los arreglos como pull requests: refactor, actualización de dependencias, corrección de errores de rendimiento y de seguridad, y eliminación de código muerto. Nunca escribimos directamente en tu repositorio ni tocamos producción sin tu aprobación.",
    tags: ["Refactor", "Dependencias", "Rendimiento", "Seguridad", "Código muerto"],
    metrics: [
      { label: "Entregable", value: "Pull requests en tu repositorio" },
      { label: "Control", value: "Nada en producción sin tu aprobación" }
    ]
  },
  {
    id: "documentacion-traspaso",
    status: "available",
    name: "Documentación y traspaso a equipos",
    category: "Software",
    hue: 225,
    summary: "Proyecto documentado y equipo listo para continuar sin depender de una persona.",
    description: "Dejamos el proyecto documentado y acompañamos a tu equipo en sesiones de traspaso, para que el conocimiento no quede en una sola persona. Es ideal antes de una entrega a un cliente o cuando el equipo cambia.",
    tags: ["Documentación", "Traspaso", "Equipos"],
    metrics: [
      { label: "Entregable", value: "Documentación y sesiones de traspaso" },
      { label: "Ideal para", value: "Entregas a clientes y cambios de equipo" }
    ]
  },
  {
    id: "automatizacion-ia",
    status: "in_development",
    name: "Automatización con IA",
    category: "Automatización con IA",
    hue: 265,
    summary: "Agentes que hacen el trabajo repetitivo dentro de tus herramientas.",
    description: "Diseñamos e implementamos agentes que hacen el trabajo repetitivo: respuesta automática a consultas, precalificación de clientes, confirmación de citas, seguimiento de presupuestos y resúmenes internos. Se integran con las herramientas que ya usás, no las reemplazan.",
    tags: ["Consultas", "Precalificación", "Citas", "Presupuestos", "Resúmenes"],
    metrics: [
      { label: "Integración", value: "Con las herramientas que ya usás" },
      { label: "Tareas típicas", value: "Consultas, citas y presupuestos" }
    ]
  },
  {
    id: "agentes-whatsapp-instagram",
    status: "in_development",
    name: "Agentes de atención en WhatsApp e Instagram",
    category: "Automatización con IA",
    hue: 150,
    summary: "Bot conversacional en tus canales, con traspaso a una persona.",
    description: "Un bot conversacional conectado a tus canales actuales, con traspaso a una persona cuando hace falta. En WhatsApp además optimizamos las conversaciones para que ocurran dentro de la ventana de mensajes gratuitos, que es donde está el ahorro real.",
    tags: ["WhatsApp", "Instagram", "Atención al cliente"],
    metrics: [
      { label: "Canales", value: "WhatsApp e Instagram" },
      { label: "Traspaso", value: "A una persona cuando hace falta" }
    ]
  },
  {
    id: "prospeccion-leads",
    status: "in_development",
    name: "Prospección y generación de leads",
    category: "Ventas y marketing",
    hue: 250,
    summary: "Flujo completo para llegar a tu cliente ideal, con tus propias bases de datos.",
    description: "Diseñamos el flujo completo: identificación del cliente ideal, redacción de mensajes personalizados para cada empresa, seguimiento y reporte de resultados. Trabajamos con las bases de datos que nos provee el cliente: no compramos ni revendemos listas de contactos.",
    tags: ["Cliente ideal", "Mensajes personalizados", "Seguimiento", "Reportes"],
    metrics: [
      { label: "Punto de partida", value: "Las bases de datos que nos das" },
      { label: "Entregable", value: "Flujo, mensajes y reporte de resultados" }
    ]
  },
  {
    id: "seo-local",
    status: "in_development",
    name: "SEO local y fichas de negocio",
    category: "Ventas y marketing",
    hue: 160,
    summary: "Más presencia en buscadores y mapas, con trabajo por objetivo.",
    description: "Optimizamos tu presencia en buscadores y mapas: ficha de negocio, reseñas, contenido local y estructura del sitio. Trabajamos por objetivo y te enviamos un reporte todos los meses.",
    tags: ["Ficha de negocio", "Reseñas", "Contenido local"],
    metrics: [
      { label: "Modalidad", value: "Trabajo por objetivo" },
      { label: "Reporte", value: "Mensual" }
    ]
  },
  {
    id: "analisis-datos",
    status: "in_development",
    name: "Análisis de datos a medida",
    category: "Datos",
    hue: 210,
    summary: "Información de negocio ordenada para decidir con datos.",
    description: "Recopilamos, limpiamos y organizamos información de negocio para que tu equipo pueda decidir con datos: segmentación de clientes, análisis de competencia, tableros y reportes periódicos.",
    tags: ["Segmentación", "Competencia", "Tableros", "Reportes"],
    metrics: [
      { label: "Entregable", value: "Tableros y reportes periódicos" },
      { label: "Incluye", value: "Segmentación y análisis de competencia" }
    ]
  }
];
