import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Video,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/components/ui/sonner";
import {
  createReservoBooking,
  fetchReservoAvailability,
  type AppointmentType,
  type ReservoBookingOption,
  type ReservoPaymentRedirect,
  type ReservoBookingResponse,
} from "@/lib/reservo";

type Step = 1 | 2 | 3 | 4;

type FormState = {
  rut: string;
  nombre: string;
  apellido: string;
  segundoApellido: string;
  correo: string;
  telefono: string;
};

const appointmentCards: Record<
  AppointmentType,
  {
    label: string;
    description: string;
    procedureName: string;
  }
> = {
  online: {
    label: "Evaluacion Online",
    description: "Gratuita - Videollamada con el equipo",
    procedureName: "Consulta Medica Diagnostica Gratuita - Online",
  },
  presencial: {
    label: "Evaluacion Presencial",
    description: "$100.000 - Con el Dr. Torres en clinica",
    procedureName: "Consulta Medica Dr. Sebastian Torres - Presencial o a Distancia",
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
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [showDetailErrors, setShowDetailErrors] = useState(false);
  const [form, setForm] = useState<FormState>({
    rut: "",
    nombre: "",
    apellido: "",
    segundoApellido: "",
    correo: "",
    telefono: "",
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<ReservoBookingResponse | null>(null);

  const availabilityQuery = useQuery({
    queryKey: ["reservo-availability", appointmentType],
    queryFn: () => fetchReservoAvailability(appointmentType as AppointmentType),
    enabled: appointmentType !== null,
    staleTime: 60_000,
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
    setSelectedDate("");
    setSelectedTime("");
    setShowDetailErrors(false);
  }, [appointmentType]);

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

  const activeCard = appointmentType ? appointmentCards[appointmentType] : null;
  const activeOption: ReservoBookingOption | null = availabilityQuery.data?.option || null;
  const availability = availabilityQuery.data?.availability || {};
  const availableDates = Object.keys(availability);
  const availableTimes = selectedDate ? availability[selectedDate] || [] : [];

  const canContinueFromDetails = Boolean(
    isValidRut(form.rut) &&
      form.nombre.trim() &&
      form.apellido.trim() &&
      form.segundoApellido.trim() &&
      isValidEmail(form.correo) &&
      isValidPhone(form.telefono),
  );

  const canConfirmBooking =
    Boolean(selectedDate) &&
    Boolean(selectedTime) &&
    !availabilityQuery.isPending &&
    !bookingMutation.isPending;

  const setField = (key: keyof FormState, value: string) => {
    const nextValue =
      key === "rut" ? formatRutInput(value) : key === "telefono" ? formatPhoneInput(value) : value;

    setForm((previous) => ({ ...previous, [key]: nextValue }));
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

  const handlePrimaryAction = () => {
    if (step === 1 && appointmentType) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!canContinueFromDetails) {
        setShowDetailErrors(true);
        return;
      }

      setShowDetailErrors(false);
      setStep(3);
      return;
    }

    if (step !== 3 || !appointmentType || !canConfirmBooking) {
      return;
    }

    bookingMutation.mutate({
      appointmentType,
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

  const primaryButtonDisabled =
    (step === 1 && !appointmentType) || (step === 3 && !canConfirmBooking);

  return (
    <div className="card-premium p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-2 sm:mb-8">
        {[1, 2, 3, 4].map((currentStep) => (
          <div key={currentStep} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-sans font-medium transition-colors ${
                currentStep <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep < step ? <CheckCircle size={14} /> : currentStep}
            </div>
            {currentStep < 4 && (
              <div className={`h-px flex-1 ${currentStep < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 className="mb-2 font-serif text-xl font-medium text-foreground">Tipo de Evaluacion</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Selecciona el tipo de evaluacion que prefieres.
          </p>
          <div className="space-y-4">
            {(["online", "presencial"] as AppointmentType[]).map((type) => {
              const card = appointmentCards[type];
              const isActive = appointmentType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAppointmentType(type)}
                  className={`w-full rounded-sm border-2 p-5 text-left transition-all ${
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="font-serif text-lg font-medium text-foreground">{card.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="mb-2 font-serif text-xl font-medium text-foreground">Datos Personales</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Completa tus datos para reservar en {activeCard?.label.toLowerCase()}.
          </p>
          <div className="mb-5 rounded-sm border border-border bg-background/70 p-4">
            <p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
              Tratamiento
            </p>
            <p className="mt-2 text-sm text-foreground">{activeCard?.procedureName}</p>
          </div>
          <div className="space-y-4">
            {fields.map((field) => {
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
                {appointmentType === "online" ? <Video size={14} /> : <MapPin size={14} />}
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
              <p className="mb-2 text-sm text-muted-foreground">
                {formatSummaryDate(confirmedBooking.selectedSlot.date, confirmedBooking.selectedSlot.time)}
              </p>
              <p className="mb-8 text-sm text-muted-foreground">
                {confirmedBooking.option.locationLabel}
                {confirmedBooking.option.id === "presencial"
                  ? ` - ${confirmedBooking.option.clinicAddress}`
                  : ` - ${confirmedBooking.option.professionalName}`}
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
                  {confirmedBooking.option.id === "online" ? <Video size={14} /> : <MapPin size={14} />}
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
            onClick={() => step > 1 && setStep((step - 1) as Step)}
            className={`flex items-center gap-2 text-sm font-sans text-muted-foreground transition-colors ${
              step === 1 || bookingMutation.isPending ? "invisible" : "hover:text-foreground"
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
            {step === 3 ? (
              bookingMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle size={14} className="animate-spin" />
                  Confirmando...
                </span>
              ) : (
                appointmentType === "presencial" ? "Confirmar y pagar" : "Confirmar reserva"
              )
            ) : (
              <span className="inline-flex items-center gap-2">
                Siguiente <ChevronRight size={14} />
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactBookingForm;
