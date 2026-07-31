import { useEffect, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/components/ui/sonner";
import { procedureCatalog } from "@/data/procedureCatalog";
import { siteStrings } from "@/i18n/strings";
import { getAttributionSnapshot } from "@/lib/attribution";
import {
  createLeadMetaEventId,
  META_PIXEL_EVENT_NAMES,
  trackMetaCustomEvent,
  updateMetaAdvancedMatching,
} from "@/lib/metaPixel";
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
const contactBookingStrings = siteStrings.contactBooking;

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
  label: contactBookingStrings.appointmentCard.label,
  description: contactBookingStrings.appointmentCard.description,
  procedureName: contactBookingStrings.appointmentCard.procedureName,
};
const promoCopy = contactBookingStrings.promo;

const flowCopy: Record<
  FlowIntent,
  {
    label: string;
    eyebrow: string;
    description: string;
  }
> = {
  contact: contactBookingStrings.flow.contact,
  booking: contactBookingStrings.flow.booking,
};

const fields: Array<{
  key: keyof FormState;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
}> = [
  { key: "rut", ...contactBookingStrings.fields.rut },
  { key: "nombre", ...contactBookingStrings.fields.nombre },
  { key: "apellido", ...contactBookingStrings.fields.apellido },
  { key: "segundoApellido", ...contactBookingStrings.fields.segundoApellido },
  { key: "correo", ...contactBookingStrings.fields.correo, type: "email" },
  { key: "telefono", ...contactBookingStrings.fields.telefono, type: "tel" },
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
  const [flowIntent, setFlowIntent] = useState<FlowIntent | null>("booking");
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
  const [isBookingMetaTrackingComplete, setIsBookingMetaTrackingComplete] = useState(false);
  const trackedMetaStandardEvents = useRef(new Set<string>());
  const appointmentType: AppointmentType = "presencial";
  const contactMetaEvents = [
    META_PIXEL_EVENT_NAMES.prospectCaptured,
    META_PIXEL_EVENT_NAMES.prospectReached,
  ];
  const bookingMetaEvents = [
    META_PIXEL_EVENT_NAMES.prospectCaptured,
    META_PIXEL_EVENT_NAMES.prospectQualified,
  ];

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
      void trackContactLeadMetaEvents(response);
      toast.success(
        response.callStarted
          ? contactBookingStrings.toast.callStarted
          : contactBookingStrings.toast.contactQueued,
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : contactBookingStrings.toast.contactError);
    },
  });

  const bookingMutation = useMutation({
    mutationFn: createReservoBooking,
    onSuccess: (response) => {
      setConfirmedBooking(response);
      setIsBookingMetaTrackingComplete(false);
      setStep(4);
      void trackBookingLeadMetaEvents(response)
        .catch(() => undefined)
        .finally(() => setIsBookingMetaTrackingComplete(true));
      toast.success(
        response.paymentUrl || response.paymentRedirect
          ? contactBookingStrings.toast.redirectingPayment
          : contactBookingStrings.toast.bookingConfirmed,
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : contactBookingStrings.toast.bookingError);
      availabilityQuery.refetch();
    },
  });

  useEffect(() => {
    const paymentRedirect = confirmedBooking?.paymentRedirect;
    const paymentUrl = confirmedBooking?.paymentUrl;

    if (step !== 4 || !isBookingMetaTrackingComplete || (!paymentRedirect && !paymentUrl)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      continueToPayment(paymentUrl, paymentRedirect);
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [confirmedBooking, isBookingMetaTrackingComplete, step]);

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
        ? contactBookingStrings.validation.procedureOther
        : contactBookingStrings.validation.procedureRequired
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
        return isValidRut(form.rut) ? "" : contactBookingStrings.validation.rut;
      case "nombre":
        return form.nombre.trim() ? "" : contactBookingStrings.validation.nombre;
      case "apellido":
        return form.apellido.trim() ? "" : contactBookingStrings.validation.apellido;
      case "segundoApellido":
        return form.segundoApellido.trim() ? "" : contactBookingStrings.validation.segundoApellido;
      case "correo":
        return isValidEmail(form.correo) ? "" : contactBookingStrings.validation.correo;
      case "telefono":
        return isValidPhone(form.telefono) ? "" : contactBookingStrings.validation.telefono;
      default:
        return "";
    }
  };

  const buildFullName = () =>
    [form.nombre, form.apellido, form.segundoApellido]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ");

  const buildMetaEventData = (eventContext: "contact" | "booking") => ({
    content_name: selectedProcedureInterest,
    content_category: "contact_booking_modal",
    procedure_interest: selectedProcedureInterest,
    flow: eventContext,
  });

  const syncMetaAdvancedMatching = () =>
    updateMetaAdvancedMatching({
      email: form.correo,
      phone: form.telefono,
    });

  const trackMetaEventOnce = (
    key: string,
    eventName: string,
    data: Record<string, unknown>,
    eventId: string | null,
  ) => {
    if (!eventId || trackedMetaStandardEvents.current.has(key)) {
      return true;
    }

    const tracked = trackMetaCustomEvent(eventName, data, { eventID: eventId });

    if (tracked) {
      trackedMetaStandardEvents.current.add(key);
    }

    return tracked;
  };

  const trackStandardMetaEvents = async ({
    leadId,
    events,
    data,
    stage,
  }: {
    leadId: string | null | undefined;
    events: string[];
    data: Record<string, unknown>;
    stage: "confirmed";
  }) => {
    if (!leadId) {
      return;
    }

    await syncMetaAdvancedMatching().catch(() => false);

    const eventData = {
      ...data,
      conversion_stage: stage,
    };

    events.forEach((eventName) => {
      const eventId = createLeadMetaEventId(leadId, eventName);

      trackMetaEventOnce(`${leadId}:${eventName}`, eventName, eventData, eventId);
    });
  };

  const trackContactLeadMetaEvents = async (response: Cirugia360ContactResponse) => {
    const eventData = {
      ...buildMetaEventData("contact"),
      lead_id: response.leadId,
      call_started: response.callStarted,
      queued: response.queued,
      lead_status: "created",
    };

    await trackStandardMetaEvents({
      leadId: response.leadId,
      events: contactMetaEvents,
      data: eventData,
      stage: "confirmed",
    });
  };

  const trackBookingLeadMetaEvents = async (response: ReservoBookingResponse) => {
    const leadId = response.bookingFollowUp?.leadId || null;
    const eventData = {
      ...buildMetaEventData("booking"),
      lead_id: leadId,
      appointment_date: response.selectedSlot.date,
      appointment_time: response.selectedSlot.time,
      appointment_type: appointmentType,
      lead_status: response.bookingFollowUp?.leadId ? "created" : "booking_created",
    };

    await trackStandardMetaEvents({
      leadId,
      events: bookingMetaEvents,
      data: eventData,
      stage: "confirmed",
    });
  };

  const submitContactRequest = () => {
    const attribution = getAttributionSnapshot();

    contactMutation.mutate({
      fullName: buildFullName(),
      phone: form.telefono,
      email: form.correo,
      procedure: selectedProcedureInterest,
      message: `${contactBookingStrings.metadata.contactMessage} ${selectedProcedureInterest}.`,
      sourceUrl: window.location.href,
      metadata: {
        flow: "contact_option",
        form: "contact_booking_modal",
        procedureInterest: selectedProcedureInterest,
        procedureOption: form.procedimiento,
        pageTitle: document.title,
        attribution,
      },
    });
  };

  const handlePrimaryAction = () => {
    if (step === 1) {
      if (!flowIntent) {
        toast.error(contactBookingStrings.validation.chooseFlow);
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

      void syncMetaAdvancedMatching();
      setStep(3);
      return;
    }

    if (step !== 3 || !canConfirmBooking) {
      return;
    }

    const attribution = getAttributionSnapshot();

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
      metadata: {
        flow: "booking_option",
        form: "contact_booking_modal",
        procedureInterest: selectedProcedureInterest,
        procedureOption: form.procedimiento,
        pageTitle: document.title,
        attribution,
      },
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
        {contactBookingStrings.copy.requesting}
      </span>
    ) : step === 2 && isContactFlow ? (
      contactBookingStrings.copy.requestContact
    ) : step === 3 ? (
      bookingMutation.isPending ? (
        <span className="inline-flex items-center gap-2">
          <LoaderCircle size={14} className="animate-spin" />
          {contactBookingStrings.copy.confirming}
        </span>
      ) : (
        contactBookingStrings.copy.confirmAndPay
      )
    ) : (
      <span className="inline-flex items-center gap-2">
        {contactBookingStrings.copy.next} <ChevronRight size={14} />
      </span>
    );

  return (
    <div className="card-premium p-5 sm:p-7">
      <div className="mb-5 border-b border-border/70 pb-5 sm:mb-7 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-primary">
              {promoCopy.availability}
            </p>
            <h3 className="mt-2 font-serif text-2xl font-medium leading-tight text-foreground">
              {promoCopy.discount}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {promoCopy.detail}
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-xs font-sans uppercase tracking-[0.16em] text-muted-foreground">
              {promoCopy.previousPrice}
            </p>
            <p className="mt-1 font-serif text-3xl font-medium text-primary">
              {promoCopy.price}
            </p>
          </div>
        </div>
      </div>
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
          <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
            {contactBookingStrings.copy.stepOneTitle}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {contactBookingStrings.copy.stepOneDescription}
          </p>
          <div className="grid gap-4">
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
            {isContactFlow
              ? contactBookingStrings.copy.contactDetailsTitle
              : contactBookingStrings.copy.bookingDetailsTitle}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {isContactFlow
              ? contactBookingStrings.copy.contactDetailsDescription
              : `Completa tus datos para reservar en ${activeCard?.label.toLowerCase()}.`}
          </p>
          <div className="mb-5 rounded-sm border border-border bg-background/70 p-4">
            <p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
              {contactBookingStrings.copy.requestType}
            </p>
            <p className="mt-2 text-sm text-foreground">
              {isContactFlow ? flowCopy.contact.label : activeCard?.label}
            </p>
          </div>
          <div className="mb-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
                {contactBookingStrings.copy.procedureInterest}
              </label>
              <select
                value={form.procedimiento}
                onChange={(event) => setField("procedimiento", event.target.value)}
                className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm font-sans text-foreground transition-colors focus:border-primary focus:outline-none"
              >
                <option value="">{contactBookingStrings.copy.selectProcedure}</option>
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
                  {contactBookingStrings.copy.otherProcedureQuestion}
                </label>
                <input
                  type="text"
                  placeholder={contactBookingStrings.copy.otherProcedurePlaceholder}
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
              <h3 className="font-serif text-xl font-medium text-foreground">
                {contactBookingStrings.copy.scheduleTitle}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {contactBookingStrings.copy.scheduleAvailabilityPrefix}{" "}
                {activeOption?.label || activeCard?.label}.
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
              <p className="font-serif text-lg text-foreground">
                {contactBookingStrings.copy.loadingTitle}
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {contactBookingStrings.copy.loadingDescription}
              </p>
            </div>
          )}

          {availabilityQuery.isError && (
            <div className="rounded-sm border border-destructive/40 bg-destructive/5 px-5 py-6">
              <p className="font-medium text-foreground">
                {contactBookingStrings.copy.scheduleErrorTitle}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {availabilityQuery.error instanceof Error
                  ? availabilityQuery.error.message
                  : contactBookingStrings.copy.scheduleErrorFallback}
              </p>
              <button
                type="button"
                onClick={() => availabilityQuery.refetch()}
                className="btn-outline-premium mt-4 px-5 py-2 text-xs"
              >
                {contactBookingStrings.copy.retry}
              </button>
            </div>
          )}

          {!availabilityQuery.isPending && !availabilityQuery.isError && availableDates.length === 0 && (
            <div className="rounded-sm border border-border px-5 py-6">
              <p className="font-medium text-foreground">
                {contactBookingStrings.copy.noSlotsTitle}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {contactBookingStrings.copy.noSlotsDescription}
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
                  {contactBookingStrings.copy.availableHours}
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
                    {contactBookingStrings.copy.noDaySlots}
                  </p>
                )}
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="mt-6 rounded-sm border border-border bg-background/70 p-4">
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
                {contactBookingStrings.copy.selectedBooking}
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
          <h3 className="mb-3 font-serif text-2xl font-medium text-foreground">
            {contactBookingStrings.copy.contactSuccessTitle}
          </h3>
          <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
            {contactBookingStrings.copy.contactSuccessDescription}
          </p>
          <div className="rounded-sm border border-border bg-background/70 px-5 py-4 text-left">
            <p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground">
              {contactBookingStrings.copy.summary}
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">{buildFullName()}</p>
            <p className="mt-2 text-sm text-muted-foreground">{selectedProcedureInterest}</p>
            <p className="mt-2 text-sm text-muted-foreground">{form.telefono}</p>
            <p className="mt-2 text-sm text-muted-foreground">{form.correo}</p>
            {contactLead.assignedAgent && (
              <p className="mt-3 text-sm text-foreground">
                {contactBookingStrings.copy.assignedAdvisor} {contactLead.assignedAgent}
              </p>
            )}
            {contactLead.queued && (
              <p className="mt-3 text-sm text-muted-foreground">
                {contactBookingStrings.copy.queuedCall}
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
                {contactBookingStrings.copy.paymentRedirectTitle}
              </h3>
              <p className="mb-2 text-muted-foreground">{confirmedBooking.option.procedureName}</p>
              <p className="mb-2 text-sm text-muted-foreground">
                {formatSummaryDate(confirmedBooking.selectedSlot.date, confirmedBooking.selectedSlot.time)}
              </p>
              <p className="mb-8 text-sm text-muted-foreground">
                {contactBookingStrings.copy.paymentRedirectDescription}
              </p>
              <button
                type="button"
                onClick={() => {
                  continueToPayment(confirmedBooking.paymentUrl, confirmedBooking.paymentRedirect);
                }}
                className="btn-premium inline-flex px-8 py-3 text-xs"
              >
                {contactBookingStrings.copy.goToPayment}
              </button>
            </>
          ) : (
            <>
              <h3 className="mb-3 font-serif text-2xl font-medium text-foreground">
                {contactBookingStrings.copy.bookingSuccessTitle}
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
                  {contactBookingStrings.copy.summary}
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
            <ChevronLeft size={16} /> {contactBookingStrings.copy.back}
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
