export type AppointmentType = "presencial";

export type ReservoBookingOption = {
  id: AppointmentType;
  label: string;
  description: string;
  priceLabel: string;
  procedureName: string;
  professionalName: string;
  locationLabel: string;
  durationMinutes: number;
  clinicName: string;
  clinicAddress: string;
  timeZone: string;
};

export type ReservoAvailabilityResponse = {
  ok: true;
  option: ReservoBookingOption;
  availability: Record<string, string[]>;
};

export type ReservoBookingPayload = {
  appointmentType: AppointmentType;
  personal: {
    rut: string;
    firstName: string;
    lastName1: string;
    lastName2: string;
    email: string;
    phone: string;
  };
  selectedSlot: {
    date: string;
    time: string;
  };
  sourceUrl?: string;
};

export type ReservoPaymentRedirect = {
  url: string;
  method: "GET" | "POST";
  fields: Record<string, string>;
};

export type ReservoBookingResponse = {
  ok: true;
  option: ReservoBookingOption;
  selectedSlot: {
    date: string;
    time: string;
    timeZone: string;
  };
  paymentUrl: string | null;
  paymentRedirect: ReservoPaymentRedirect | null;
  source: unknown;
};

type ApiErrorPayload = {
  ok?: false;
  error?: string;
};

const readJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;

  if (!response.ok) {
    throw new Error(
      (payload as ApiErrorPayload | null)?.error || "No se pudo completar la solicitud.",
    );
  }

  return payload as T;
};

export const fetchReservoAvailability = (appointmentType: AppointmentType) =>
  fetch(`/api/reservo/availability?appointmentType=${encodeURIComponent(appointmentType)}`, {
    headers: {
      Accept: "application/json",
    },
  }).then((response) => readJson<ReservoAvailabilityResponse>(response));

export const createReservoBooking = (payload: ReservoBookingPayload) =>
  fetch("/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  }).then((response) => readJson<ReservoBookingResponse>(response));
