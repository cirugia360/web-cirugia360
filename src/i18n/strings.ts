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
      description: "$50.000 - 50% OFF este mes - POCOS CUPOS",
      procedureName: "Consulta Médica Dr. Sebastián Torres - Presencial o a Distancia",
    },
    promo: {
      availability: "POCOS CUPOS",
      discount: "50% OFF este mes",
      price: "$50.000",
      previousPrice: "Antes $100.000",
      detail: "Promoción por tiempo limitado para evaluaciones reservadas desde la web.",
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
        description: "Elige fecha y hora online y paga la evaluación con valor promocional.",
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
      stepOneTitle: "Agenda tu evaluación con 50% OFF",
      stepOneDescription:
        "Reserva tu evaluación online. Este mes queda en $50.000 por tiempo limitado.",
      contactDetailsTitle: "Datos de Contacto",
      bookingDetailsTitle: "Tus datos",
      contactDetailsDescription: "Completa tus datos y activaremos el contacto con una asesora.",
      requestType: "Tipo de solicitud",
      procedureInterest: "Procedimiento de interés",
      selectProcedure: "Selecciona un procedimiento",
      otherProcedureQuestion: "¿Cuál procedimiento?",
      otherProcedurePlaceholder: "Escribe el procedimiento o consulta",
      scheduleTitle: "Elige horario",
      scheduleAvailabilityPrefix: "Estás viendo horarios disponibles de",
      loadingTitle: "Buscando horarios",
      loadingDescription: "Te mostramos solo horas disponibles.",
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
      paymentRedirectTitle: "Ir al pago",
      paymentRedirectDescription: "Tu hora quedó apartada. Completa el pago para reservar.",
      goToPayment: "Ir al pago ahora",
      bookingSuccessTitle: "Evaluación Agendada",
      back: "Anterior",
      requesting: "Solicitando...",
      requestContact: "Solicitar contacto",
      confirming: "Confirmando...",
      confirmAndPay: "Confirmar y pagar $50.000",
      next: "Siguiente",
    },
    metadata: {
      contactMessage:
        "Paciente eligió ser contactado por una asesora antes de agendar evaluación. Procedimiento de interés:",
    },
  },
} as const;
