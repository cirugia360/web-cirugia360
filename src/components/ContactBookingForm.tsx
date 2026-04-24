import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  PhoneCall,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/components/ui/sonner";
import { procedureCatalog } from "@/data/procedureCatalog";
import {
  createCirugia360ContactLead,
  createReservoBooking,
  fetchReservoAvailability,
  type AppointmentType,
  type Cirugia360ContactResponse,
  type ReservoBookingOption,
  type ReservoPaymentRedirect,
  type ReservoBookingResponse,
} from "@/lib/reservo";

type Step = 1 | 2 | 3 | 4;
type FlowIntent = "contact" | "booking";

type FormState = {
  procedimiento: string;
  otroProcedimiento: string;
  rut: string;
  nombre: string;
  apellido: string;
  segundoApellido: string;
  correo: string;
  telefono: string;
};

const OTHER_PROCEDURE_VALUE = "__other__";

const procedureOptions = [
  ...procedureCatalog.map((procedure) => ({
    value: procedure.title,
    label: procedure.title,
  })),
  {
    value: OTHER_PROCEDURE_VALUE,
    label: "Otro",
  },
];

const normalizePath = (value: string) => value.replace(/\/+$/, "") || "/";

const getInitialProcedureInterest = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const currentPath = normalizePath(window.location.pathname);
  return (
    procedureCatalog.find((procedure) => normalizePath(procedure.href) === currentPath)?.title || ""
  );
};

const appointmentCard: {
  label: string;
  description: string;
  procedureName: string;
} = {
  label: "Evaluacion con el Dr. Torres",
  description: "$100.000 - Consulta medica con el Dr. Torres",
  procedureName: "Consulta Medica Dr. Sebastian Torres - Presencial o a Distancia",
};

const flowCopy: Record<
  FlowIntent,
  {
    label: string;
    eyebrow: string;
    description: string;
  }
> = {
  contact: {
    label: "Ser contactado por una asesora",
    eyebrow: "Contacto inmediato",
    description: "Dejanos tus datos y una asesora intentara llamarte para resolver dudas.",
  },
  booking: {
    label: "Agendar y pagar evaluacion",
    eyebrow: "Reserva online",
    description: "Elige una hora real de Reservo y completa el pago de la evaluacion.",
  },
};

const fields: Array<{
  key: keyof FormState;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
}> = [
  { key: "rut", label: "RUT", placeholder: "12.345.678-9" },
  { key: "nombre", label: "Nombre", placeholder: "Tu nombre" },
  { key: "apellido", label: "Apellido", placeholder: "Tu apellido" },
  { key: "segundoApellido", label: "Segundo Apellido", placeholder: "Tu segundo apellido" },
  { key: "correo", label: "Correo Electronico", placeholder: "correo@ejemplo.com", type: "email" },
  { key: "telefono", label: "Telefono", placeholder: "+56 9 1234 5678", type: "tel" },
];

const contactFields = fields.filter(({ key }) =>
  ["nombre", "apellido", "correo", "telefono"].includes(key),
);

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string) => new Date(`${dateKey}T12:00:00`);

const formatLongDate = (dateKey: string) =>
  new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseDateKey(dateKey));

const formatSummaryDate = (dateKey: string, time: string) =>
  `${new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateKey(dateKey))} a las ${time}`;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const getRutRawValue = (value: string) =>
  value
    .replace(/[^0-9kK]/g, "")
    .toUpperCase()
    .slice(0, 9);

const formatRutInput = (value: string) => {
  const rawValue = getRutRawValue(value);

  if (rawValue.length <= 1) {
    return rawValue;
  }

  const verifierDigit = rawValue.slice(-1);
  const body = rawValue.slice(0, -1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${verifierDigit}`;
};

const getRutVerifierDigit = (body: string) => {
  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);

  if (remainder === 11) {
    return "0";
  }

  if (remainder === 10) {
    return "K";
  }

  return String(remainder);
};

const isValidRut = (value: string) => {
  const rawValue = getRutRawValue(value);

  if (rawValue.length < 8) {
    return false;
  }

  const body = rawValue.slice(0, -1);
  const verifierDigit = rawValue.slice(-1);

  return getRutVerifierDigit(body) === verifierDigit;
};

const formatPhoneInput = (value: string) => {
  const trimmedValue = value.trim();
  const digits = trimmedValue.replace(/\D/g, "");

  if (!digits) {
    return trimmedValue.startsWith("+") ? "+" : "";
  }

  const subscriberDigits = digits.startsWith("56") ? digits.slice(2) : digits;
  const limitedSubscriberDigits = subscriberDigits.slice(0, 9);
  const firstGroup = limitedSubscriberDigits.slice(0, 1);
  const secondGroup = limitedSubscriberDigits.slice(1, 5);
  const thirdGroup = limitedSubscriberDigits.slice(5, 9);
  const groups = [firstGroup, secondGroup, thirdGroup].filter(Boolean);

  return groups.length > 0 ? `+56 ${groups.join(" ")}` : "+56";
};

const isValidPhone = (value: string) => /^\+56 \d \d{4} \d{4}$/.test(value.trim());
const RESERVO_PAYMENT_HOSTS = new Set(["reservo.cl", "www.reservo.cl"]);

const getPaymentHost = (value: string) => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const isReservoPaymentUrl = (value: string) => RESERVO_PAYMENT_HOSTS.has(getPaymentHost(value));

const buildPaymentBridgeUrl = (paymentUrl: string) =>
  `/api/reservo/payment-bridge?target=${encodeURIComponent(paymentUrl)}`;

const submitPaymentRedirect = (redirect: ReservoPaymentRedirect) => {
  const form = document.createElement("form");
  form.method = redirect.method;
  form.action = redirect.url;
  form.style.display = "none";

  Object.entries(redirect.fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

const continueToPayment = (
  paymentUrl: string | null,
  paymentRedirect: ReservoPaymentRedirect | null,
) => {
  if (paymentRedirect) {
    submitPaymentRedirect(paymentRedirect);
    return;
  }

  if (paymentUrl && isReservoPaymentUrl(paymentUrl)) {
    window.location.assign(buildPaymentBridgeUrl(paymentUrl));
    return;
  }

  if (paymentUrl) {
    window.location.assign(paymentUrl);
  }
};

const ContactBookingForm = () => {
  const [step, setStep] = useState<Step>(1);
  const [flowIntent, setFlowIntent] = useState<FlowIntent | null>(null);
  const [showDetailErrors, setShowDetailErrors] = useState(false);
  const [form, setForm] = useState<FormState>(() => ({
    procedimiento: getInitialProcedureInterest(),
    otroProcedimiento: "",
    rut: "",
    nombre: "",
    apellido: "",
    segundoApellido: "",
    correo: "",
    telefono: "",
  }));
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<ReservoBookingResponse | null>(null);
  const [contactLead, setContactLead] = useState<Cirugia360ContactResponse | null>(null);
  const appointmentType: AppointmentType = "presencial";

  const availabilityQuery = useQuery({
    queryKey: ["reservo-availability", appointmentType],
    queryFn: () => fetchReservoAvailability(appointmentType),
    enabled: flowIntent === "booking",
    staleTime: 60_000,
  });

  const contactMutation = useMutation({
    mutationFn: createCirugia360ContactLead,
    onSuccess: (response) => {
      setContactLead(response);
      setStep(4);
      toast.success(
        response.callStarted
          ? "Solicitud recibida. Estamos llamando a la asesora."
          : "Solicitud recibida. La asesora te contactara a la brevedad.",
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo solicitar el contacto.");
    },
  });

  const bookingMutation = useMutation({
    mutationFn: createReservoBooking,
    onSuccess: (response) => {
      setConfirmedBooking(response);
      setStep(4);
      toast.success(
        response.paymentUrl || response.paymentRedirect
          ? "Te estamos redirigiendo al pago para completar tu reserva."
          : "Tu evaluacion quedo reservada.",
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo confirmar la reserva.");
      availabilityQuery.refetch();
    },
  });

  useEffect(() => {
    const paymentRedirect = confirmedBooking?.paymentRedirect;
    const paymentUrl = confirmedBooking?.paymentUrl;

    if (step !== 4 || (!paymentRedirect && !paymentUrl)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      continueToPayment(paymentUrl, paymentRedirect);
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [confirmedBooking, step]);

  useEffect(() => {
    const nextAvailability = availabilityQuery.data?.availability || {};
    const nextDates = Object.keys(nextAvailability);

    if (nextDates.length === 0) {
      setSelectedDate("");
      setSelectedTime("");
      return;
    }

    if (!selectedDate || !nextDates.includes(selectedDate)) {
      setSelectedDate(nextDates[0]);
      setSelectedTime("");
    }
  }, [availabilityQuery.data, selectedDate]);

  useEffect(() => {
    const daySlots = (availabilityQuery.data?.availability || {})[selectedDate] || [];

    if (daySlots.length === 0) {
      setSelectedTime("");
      return;
    }

    if (!selectedTime || !daySlots.includes(selectedTime)) {
      setSelectedTime(daySlots[0]);
    }
  }, [availabilityQuery.data, selectedDate, selectedTime]);

  const activeCard = appointmentCard;
  const isContactFlow = flowIntent === "contact";
  const isBookingFlow = flowIntent === "booking";
  const visibleFields = isContactFlow ? contactFields : fields;
  const progressStepIds: Step[] = isContactFlow ? [1, 2, 4] : [1, 2, 3, 4];
  const activeProgressIndex = Math.max(progressStepIds.indexOf(step), 0);
  const activeOption: ReservoBookingOption | null = availabilityQuery.data?.option || null;
  const availability = availabilityQuery.data?.availability || {};
  const availableDates = Object.keys(availability);
  const availableTimes = selectedDate ? availability[selectedDate] || [] : [];
  const isOtherProcedure = form.procedimiento === OTHER_PROCEDURE_VALUE;
  const selectedProcedureInterest = isOtherProcedure
    ? form.otroProcedimiento.trim()
    : form.procedimiento.trim();
  const hasProcedureInterest = Boolean(selectedProcedureInterest);
  const procedureError =
    showDetailErrors && !hasProcedureInterest
      ? isOtherProcedure
        ? "Escribe el procedimiento de interes."
        : "Selecciona un procedimiento de interes."
      : "";

  const canContinueFromDetails = isContactFlow
    ? Boolean(
        hasProcedureInterest &&
          form.nombre.trim() &&
          form.apellido.trim() &&
          isValidEmail(form.correo) &&
          isValidPhone(form.telefono),
      )
    : Boolean(
        hasProcedureInterest &&
          isValidRut(form.rut) &&
          form.nombre.trim() &&
          form.apellido.trim() &&
          form.segundoApellido.trim() &&
          isValidEmail(form.correo) &&
          isValidPhone(form.telefono),
      );

  const canConfirmBooking =
    isBookingFlow &&
    Boolean(selectedDate) &&
    Boolean(selectedTime) &&
    !availabilityQuery.isPending &&
    !bookingMutation.isPending;

  const setField = (key: keyof FormState, value: string) => {
    const nextValue =
      key === "rut" ? formatRutInput(value) : key === "telefono" ? formatPhoneInput(value) : value;

    setForm((previous) => ({
      ...previous,
      [key]: nextValue,
      ...(key === "procedimiento" && nextValue !== OTHER_PROCEDURE_VALUE
        ? { otroProcedimiento: "" }
        : {}),
    }));
  };

  const getFieldError = (key: keyof FormState) => {
    if (!showDetailErrors) {
      return "";
    }

    switch (key) {
      case "rut":
        return isValidRut(form.rut) ? "" : "Ingresa un RUT valido.";
      case "nombre":
        return form.nombre.trim() ? "" : "El nombre es obligatorio.";
      case "apellido":
        return form.apellido.trim() ? "" : "El apellido es obligatorio.";
      case "segundoApellido":
        return form.segundoApellido.trim() ? "" : "El segundo apellido es obligatorio.";
      case "correo":
        return isValidEmail(form.correo) ? "" : "Ingresa un correo valido.";
      case "telefono":
        return isValidPhone(form.telefono) ? "" : "Ingresa un telefono en formato +56 9 1234 5678.";
      default:
        return "";
    }
  };

  const buildFullName = () =>
    [form.nombre, form.apellido, form.segundoApellido]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ");

  const submitContactRequest = () => {
    contactMutation.mutate({
      fullName: buildFullName(),
      phone: form.telefono,
      email: form.correo,
      procedure: selectedProcedureInterest,
      message: `Paciente eligio ser contactado por una asesora antes de agendar evaluacion. Procedimiento de interes: ${selectedProcedureInterest}.`,
      sourceUrl: window.location.href,
      metadata: {
        flow: "contact_option",
        form: "contact_booking_modal",
        procedureInterest: selectedProcedureInterest,
        procedureOption: form.procedimiento,
        pageTitle: document.title,
      },
    });
  };

  const handlePrimaryAction = () => {
    if (step === 1) {
      if (!flowIntent) {
        toast.error("Elige si prefieres ser contactado o agendar la evaluacion.");
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!canContinueFromDetails) {
        setShowDetailErrors(true);
        return;
      }

      setShowDetailErrors(false);
      if (isContactFlow) {
        submitContactRequest();
        return;
      }

      setStep(3);
      return;
    }

    if (step !== 3 || !canConfirmBooking) {
      return;
    }

    bookingMutation.mutate({
      appointmentType,
      procedureInterest: selectedProcedureInterest,
      personal: {
        rut: form.rut,
        firstName: form.nombre,
        lastName1: form.apellido,
        lastName2: form.segundoApellido,
        email: form.correo,
        phone: form.telefono,
      },
      selectedSlot: {
        date: selectedDate,
        time: selectedTime,
      },
      sourceUrl: window.location.href,
    });
  };

  const handleBack = () => {
    if (bookingMutation.isPending || contactMutation.isPending) {
      return;
    }

    if (step === 3) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(1);
    }
  };

  const primaryButtonDisabled =
    (step === 1 && !flowIntent) ||
    (step === 2 && contactMutation.isPending) ||
    (step === 3 && !canConfirmBooking);

  const primaryButtonContent =
    step === 2 && contactMutation.isPending ? (
      <span className="inline-flex items-center gap-2">
        <LoaderCircle size={14} className="animate-spin" />
        Solicitando...
      </span>
    ) : step === 2 && isContactFlow ? (
      "Solicitar contacto"
    ) : step === 3 ? (
      bookingMutation.isPending ? (
        <span className="inline-flex items-center gap-2">
          <LoaderCircle size={14} className="animate-spin" />
          Confirmando...
        </span>
      ) : (
        "Confirmar y pagar"
      )
    ) : (
      <span className="inline-flex items-center gap-2">
        Siguiente <ChevronRight size={14} />
      </span>
    );

  return (
    <div className="card-premium p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-2 sm:mb-8">
        {progressStepIds.map((currentStep, index) => {
          const isActiveStep = index <= activeProgressIndex;
          const isCompleteStep = index < activeProgressIndex;

          return (
            <div key={currentStep} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-sans font-medium transition-colors ${
                  isActiveStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleteStep ? <CheckCircle size={14} /> : index + 1}
              </div>
              {index < progressStepIds.length - 1 && (
                <div className={`h-px flex-1 ${isCompleteStep ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div>
          <h3 className="mb-2 font-serif text-xl font-medium text-foreground">Como quieres avanzar?</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Puedes pedir que una asesora te contacte o reservar directamente la evaluacion con el Dr. Torres.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFlowIntent("contact")}
              className={`rounded-sm border-2 p-5 text-left transition-all ${
                flowIntent === "contact"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PhoneCall size={20} />
              </span>
              <span className="block text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
                {flowCopy.contact.eyebrow}
              </span>
              <span className="mt-2 block font-serif text-lg font-medium text-foreground">
                {flowCopy.contact.label}
              </span>
              <span className="mt-2 block text-sm text-muted-foreground">
                {flowCopy.contact.description}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFlowIntent("booking")}
              className={`rounded-sm border-2 p-5 text-left transition-all ${
                flowIntent === "booking"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CalendarIcon size={20} />
              </span>
              <span className="block text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
                {flowCopy.booking.eyebrow}
              </span>
              <span className="mt-2 block font-serif text-lg font-medium text-foreground">
                {flowCopy.booking.label}
              </span>
              <span className="mt-2 block text-sm text-muted-foreground">
                {flowCopy.booking.description}
              </span>
              <span className="mt-4 block rounded-sm bg-muted px-3 py-2 text-xs text-muted-foreground">
                {activeCard.description}
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
            {isContactFlow ? "Datos de Contacto" : "Datos Personales"}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {isContactFlow
              ? "Completa tus datos y activaremos el contacto con una asesora."
              : `Completa tus datos para reservar en ${activeCard?.label.toLowerCase()}.`}
          </p>
          <div className="mb-5 rounded-sm border border-border bg-background/70 p-4">
            <p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
              Tipo de solicitud
            </p>
            <p className="mt-2 text-sm text-foreground">
              {isContactFlow ? flowCopy.contact.label : activeCard?.label}
            </p>
          </div>
          <div className="mb-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
                Procedimiento de interes
              </label>
              <select
                value={form.procedimiento}
                onChange={(event) => setField("procedimiento", event.target.value)}
                className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm font-sans text-foreground transition-colors focus:border-primary focus:outline-none"
              >
                <option value="">Selecciona un procedimiento</option>
                {procedureOptions.map((procedure) => (
                  <option key={procedure.value} value={procedure.value}>
                    {procedure.label}
                  </option>
                ))}
              </select>
              {procedureError && !isOtherProcedure && (
                <p className="mt-2 text-sm text-destructive">{procedureError}</p>
              )}
            </div>
            {isOtherProcedure && (
              <div>
                <label className="mb-1.5 block text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
                  Cual procedimiento?
                </label>
                <input
                  type="text"
                  placeholder="Escribe el procedimiento o consulta"
                  value={form.otroProcedimiento}
                  onChange={(event) => setField("otroProcedimiento", event.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm font-sans text-foreground transition-colors focus:border-primary focus:outline-none"
                />
                {procedureError && <p className="mt-2 text-sm text-destructive">{procedureError}</p>}
              </div>
            )}
          </div>
          <div className="space-y-4">
            {visibleFields.map((field) => {
              const fieldError = getFieldError(field.key);

              return (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
                    {field.label}
                  </label>
                  <input
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(event) => setField(field.key, event.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm font-sans text-foreground transition-colors focus:border-primary focus:outline-none"
                  />
                  {fieldError && <p className="mt-2 text-sm text-destructive">{fieldError}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-sm border border-border bg-background/70 p-4">
            <div>
              <h3 className="font-serif text-xl font-medium text-foreground">Seleccionar Horario</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Estas viendo la disponibilidad real de {activeOption?.label || activeCard?.label}.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin size={14} />
                {activeOption?.locationLabel || activeCard?.description}
              </p>
              <p>{activeOption?.professionalName}</p>
            </div>
          </div>

          {availabilityQuery.isPending && (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-sm border border-dashed border-border px-6 py-10 text-center">
              <LoaderCircle className="mb-4 animate-spin text-primary" size={28} />
              <p className="font-serif text-lg text-foreground">Cargando horarios desde Reservo</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Estamos consultando la agenda seleccionada para mostrar solo horas disponibles.
              </p>
            </div>
          )}

          {availabilityQuery.isError && (
            <div className="rounded-sm border border-destructive/40 bg-destructive/5 px-5 py-6">
              <p className="font-medium text-foreground">No pudimos cargar la agenda.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {availabilityQuery.error instanceof Error
                  ? availabilityQuery.error.message
                  : "Intenta nuevamente en unos segundos."}
              </p>
              <button
                type="button"
                onClick={() => availabilityQuery.refetch()}
                className="btn-outline-premium mt-4 px-5 py-2 text-xs"
              >
                Reintentar
              </button>
            </div>
          )}

          {!availabilityQuery.isPending && !availabilityQuery.isError && availableDates.length === 0 && (
            <div className="rounded-sm border border-border px-5 py-6">
              <p className="font-medium text-foreground">No hay horas disponibles por ahora.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Puedes volver a intentarlo mas tarde. La agenda se consulta en tiempo real.
              </p>
            </div>
          )}

          {!availabilityQuery.isPending && !availabilityQuery.isError && availableDates.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-sm border border-border p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate ? parseDateKey(selectedDate) : undefined}
                  onSelect={(date) => {
                    if (!date) {
                      return;
                    }

                    setSelectedDate(formatDateKey(date));
                    setSelectedTime("");
                  }}
                  disabled={(date) => !availableDates.includes(formatDateKey(date))}
                  className="w-full"
                />
              </div>
              <div>
                <p className="mb-3 text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
                  Horas disponibles
                </p>
                {selectedDate && (
                  <p className="mb-4 text-sm text-foreground">{formatLongDate(selectedDate)}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-sm py-3 text-sm font-sans transition-all ${
                        selectedTime === time
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-primary/10"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                {selectedDate && availableTimes.length === 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No encontramos horas para ese dia.
                  </p>
                )}
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="mt-6 rounded-sm border border-border bg-background/70 p-4">
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
                Reserva seleccionada
              </p>
              <p className="mt-2 text-sm text-foreground">{formatSummaryDate(selectedDate, selectedTime)}</p>
            </div>
          )}
        </div>
      )}

      {step === 4 && contactLead && (
        <div className="py-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="text-primary" size={32} />
          </div>
          <h3 className="mb-3 font-serif text-2xl font-medium text-foreground">Solicitud Recibida</h3>
          <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
            Guardamos tus datos y el sistema Speed-to-Lead ya activo el flujo para que una asesora pueda
            contactarte al telefono indicado.
          </p>
          <div className="rounded-sm border border-border bg-background/70 px-5 py-4 text-left">
            <p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
              Resumen
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">{buildFullName()}</p>
            <p className="mt-2 text-sm text-muted-foreground">{selectedProcedureInterest}</p>
            <p className="mt-2 text-sm text-muted-foreground">{form.telefono}</p>
            <p className="mt-2 text-sm text-muted-foreground">{form.correo}</p>
            {contactLead.assignedAgent && (
              <p className="mt-3 text-sm text-foreground">Asesora asignada: {contactLead.assignedAgent}</p>
            )}
            {contactLead.queued && (
              <p className="mt-3 text-sm text-muted-foreground">
                Si la asesora estaba ocupada, la llamada quedo en cola para el siguiente intento.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 4 && confirmedBooking && (
        <div className="py-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="text-primary" size={32} />
          </div>
          {confirmedBooking.paymentUrl || confirmedBooking.paymentRedirect ? (
            <>
              <h3 className="mb-3 font-serif text-2xl font-medium text-foreground">
                Redirigiendo al Pago
              </h3>
              <p className="mb-2 text-muted-foreground">{confirmedBooking.option.procedureName}</p>
              <p className="mb-2 text-sm text-muted-foreground">
                {formatSummaryDate(confirmedBooking.selectedSlot.date, confirmedBooking.selectedSlot.time)}
              </p>
              <p className="mb-8 text-sm text-muted-foreground">
                Tu hora fue apartada y te llevaremos al link de pago para completar la reserva.
              </p>
              <button
                type="button"
                onClick={() => {
                  continueToPayment(confirmedBooking.paymentUrl, confirmedBooking.paymentRedirect);
                }}
                className="btn-premium inline-flex px-8 py-3 text-xs"
              >
                Ir al pago ahora
              </button>
            </>
          ) : (
            <>
              <h3 className="mb-3 font-serif text-2xl font-medium text-foreground">
                Evaluacion Agendada
              </h3>
              <p className="mb-2 text-muted-foreground">{confirmedBooking.option.procedureName}</p>
              <p className="mb-2 text-sm font-medium text-foreground">
                {form.nombre} {form.apellido}
              </p>
              <p className="mb-2 text-sm text-muted-foreground">{selectedProcedureInterest}</p>
              <p className="mb-2 text-sm text-muted-foreground">
                {formatSummaryDate(confirmedBooking.selectedSlot.date, confirmedBooking.selectedSlot.time)}
              </p>
              <p className="mb-8 text-sm text-muted-foreground">
                {confirmedBooking.option.locationLabel}
                {` - ${confirmedBooking.option.clinicAddress}`}
              </p>
              <div className="rounded-sm border border-border bg-background/70 px-5 py-4 text-left">
                <p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
                  Resumen
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm text-foreground">
                  <CalendarIcon size={14} />
                  {confirmedBooking.selectedSlot.date} - {confirmedBooking.selectedSlot.time}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
                  <MapPin size={14} />
                  {confirmedBooking.option.locationLabel}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {step < 4 && (
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            className={`flex items-center gap-2 text-sm font-sans text-muted-foreground transition-colors ${
              step === 1 || bookingMutation.isPending || contactMutation.isPending
                ? "invisible"
                : "hover:text-foreground"
            }`}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={primaryButtonDisabled}
            className={`btn-premium px-8 py-3 text-xs ${primaryButtonDisabled ? "cursor-not-allowed opacity-40" : ""}`}
          >
            {primaryButtonContent}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactBookingForm;
