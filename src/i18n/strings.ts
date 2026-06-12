export const siteStrings = {
  brand: {
    name: "Cirugía360",
    prefix: "Cirugía",
    suffix: "360",
    doctorName: "Dr. Sebastián Torres",
    doctorFullName: "Dr. Sebastián Torres Farr",
  },
  nav: {
    links: [
      { label: "Inicio", href: "/" },
      { label: "El Doctor", href: "/el-doctor" },
      { label: "Procedimientos", href: "/procedimientos" },
      { label: "Resultados", href: "/resultados" },
      { label: "Tecnología", href: "/tecnologia" },
      { label: "Blog", href: "/blog" },
    ],
    cta: "Agendar Evaluación",
  },
  footer: {
    description:
      "Cirugía estética de precisión internacional. Resultados naturales con tecnología avanzada.",
    columns: {
      procedures: "Procedimientos",
      navigation: "Navegación",
      contact: "Contacto",
    },
    procedures: [
      { label: "Marcación Nivel Dios", href: "/marcacion-nivel-dios" },
      { label: "Torres Rhinoplasty", href: "/torres-rhinoplasty" },
      { label: "Subcision Magic", href: "/subcision-magic" },
    ],
    contact: {
      phone: {
        label: "+56 9 5414 8181",
        href: "tel:+56954148181",
      },
      email: {
        label: "agendamiento.cirugia360@gmail.com",
        href: "mailto:agendamiento.cirugia360@gmail.com",
      },
      location: "Santiago, Chile",
      instagram: {
        label: "@cirugia360oficial",
        href: "https://www.instagram.com/cirugia360oficial/",
      },
    },
    copyright: "© 2026 Cirugía360. Todos los derechos reservados.",
    credential: "Dr. Sebastián Torres · RCM 40135-8",
  },
  notFound: {
    eyebrow: "Error 404",
    title: "Página no encontrada",
    description:
      "La dirección que intentaste abrir no existe o fue movida. Puedes continuar explorando el sitio desde una de estas secciones.",
    blogCta: "Ir al blog",
    proceduresCta: "Ver procedimientos",
  },
  contactBooking: {
    appointmentCard: {
      label: "Evaluación con el Dr. Torres",
      description: "$100.000 - Consulta médica con el Dr. Torres",
      procedureName: "Consulta Médica Dr. Sebastián Torres - Presencial o a Distancia",
    },
    flow: {
      contact: {
        label: "Ser contactado por una asesora",
        eyebrow: "Contacto inmediato",
        description: "Déjanos tus datos y una asesora intentará llamarte para resolver dudas.",
      },
      booking: {
        label: "Agendar y pagar evaluación",
        eyebrow: "Reserva online",
        description: "Elige una hora real de Reservo y completa el pago de la evaluación.",
      },
    },
    fields: {
      rut: { label: "RUT", placeholder: "12.345.678-9" },
      nombre: { label: "Nombre", placeholder: "Tu nombre" },
      apellido: { label: "Apellido", placeholder: "Tu apellido" },
      segundoApellido: { label: "Segundo Apellido", placeholder: "Tu segundo apellido" },
      correo: { label: "Correo Electrónico", placeholder: "correo@ejemplo.com" },
      telefono: { label: "Teléfono", placeholder: "+56 9 1234 5678" },
    },
    validation: {
      procedureOther: "Escribe el procedimiento de interés.",
      procedureRequired: "Selecciona un procedimiento de interés.",
      rut: "Ingresa un RUT válido.",
      nombre: "El nombre es obligatorio.",
      apellido: "El apellido es obligatorio.",
      segundoApellido: "El segundo apellido es obligatorio.",
      correo: "Ingresa un correo válido.",
      telefono: "Ingresa un teléfono en formato +56 9 1234 5678.",
      chooseFlow: "Elige agendar la evaluación.",
    },
    toast: {
      callStarted: "Solicitud recibida. Estamos llamando a la asesora.",
      contactQueued: "Solicitud recibida. La asesora te contactará a la brevedad.",
      redirectingPayment: "Te estamos redirigiendo al pago para completar tu reserva.",
      bookingConfirmed: "Tu evaluación quedó reservada.",
      contactError: "No se pudo solicitar el contacto.",
      bookingError: "No se pudo confirmar la reserva.",
    },
    copy: {
      stepOneTitle: "Agenda tu evaluación",
      stepOneDescription:
        "Reserva una hora real en Reservo y completa el pago de la evaluación con el Dr. Torres.",
      contactDetailsTitle: "Datos de Contacto",
      bookingDetailsTitle: "Datos Personales",
      contactDetailsDescription: "Completa tus datos y activaremos el contacto con una asesora.",
      requestType: "Tipo de solicitud",
      procedureInterest: "Procedimiento de interés",
      selectProcedure: "Selecciona un procedimiento",
      otherProcedureQuestion: "¿Cuál procedimiento?",
      otherProcedurePlaceholder: "Escribe el procedimiento o consulta",
      scheduleTitle: "Seleccionar Horario",
      scheduleAvailabilityPrefix: "Estás viendo la disponibilidad real de",
      loadingTitle: "Cargando horarios desde Reservo",
      loadingDescription:
        "Estamos consultando la agenda seleccionada para mostrar solo horas disponibles.",
      scheduleErrorTitle: "No pudimos cargar la agenda.",
      scheduleErrorFallback: "Intenta nuevamente en unos segundos.",
      retry: "Reintentar",
      noSlotsTitle: "No hay horas disponibles por ahora.",
      noSlotsDescription:
        "Puedes volver a intentarlo más tarde. La agenda se consulta en tiempo real.",
      availableHours: "Horas disponibles",
      noDaySlots: "No encontramos horas para ese día.",
      selectedBooking: "Reserva seleccionada",
      contactSuccessTitle: "Solicitud Recibida",
      contactSuccessDescription:
        "Guardamos tus datos y el sistema Speed-to-Lead ya activó el flujo para que una asesora pueda contactarte al teléfono indicado.",
      summary: "Resumen",
      assignedAdvisor: "Asesora asignada:",
      queuedCall:
        "Si la asesora estaba ocupada, la llamada quedó en cola para el siguiente intento.",
      paymentRedirectTitle: "Redirigiendo al Pago",
      paymentRedirectDescription:
        "Tu hora fue apartada y te llevaremos al link de pago para completar la reserva.",
      goToPayment: "Ir al pago ahora",
      bookingSuccessTitle: "Evaluación Agendada",
      back: "Anterior",
      requesting: "Solicitando...",
      requestContact: "Solicitar contacto",
      confirming: "Confirmando...",
      confirmAndPay: "Confirmar y pagar",
      next: "Siguiente",
    },
    metadata: {
      contactMessage:
        "Paciente eligió ser contactado por una asesora antes de agendar evaluación. Procedimiento de interés:",
    },
  },
} as const;
