const DEFAULT_API_BASE_URL = "https://reservo.cl/APIpublica/v2";
const DEFAULT_BOOKING_ENDPOINT = "https://reservo.cl/makereserva/confirmApptAPI/";
const DEFAULT_TIME_ZONE = "America/Santiago";
const DEFAULT_WEEKS_AHEAD = 6;
const ONE_WEEK_IN_DAYS = 7;
const PAYMENT_KEYWORDS = ["payment", "pago", "pay", "checkout", "cobro", "webpay", "transbank"];
const FLOW_PAYMENT_HOSTS = new Set(["flow.cl", "www.flow.cl"]);
const HTML_ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const bookingDefinitions = {
  presencial: {
    id: "presencial",
    label: "Evaluacion con el Dr. Torres",
    description: "$100.000 con el Dr. Sebastian Torres.",
    priceLabel: "$100.000",
    procedureName: "Consulta Medica Dr. Sebastian Torres - Presencial o a Distancia",
    professionalName: "Dr. Sebastian Torres",
    locationLabel: "Presencial o a distancia",
    durationMinutes: 30,
    clinicName: "Dr Sebastian Torres Farr",
    clinicAddress: "Avenida La Dehesa 440, oficina 315.",
    envPrefix: "RESERVO_PRESENTIAL",
  },
};

const getEnv = (name) => String(process.env[name] || "").trim();

const requireEnv = (name) => {
  const value = getEnv(name);

  if (!value) {
    const error = new Error(`Falta la variable de entorno ${name}.`);
    error.statusCode = 500;
    throw error;
  }

  return value;
};

const getWeeksAhead = () => {
  const parsed = Number.parseInt(getEnv("RESERVO_WEEKS_AHEAD"), 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_WEEKS_AHEAD;
  }

  return parsed;
};

const formatDateInTimeZone = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";

  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const buildStartDates = (timeZone, weeksAhead) => {
  const today = new Date();
  const startDates = [];

  for (let index = 0; index < weeksAhead; index += 1) {
    startDates.push(formatDateInTimeZone(addDays(today, index * ONE_WEEK_IN_DAYS), timeZone));
  }

  return [...new Set(startDates)];
};

const parseJsonSafely = async (response) => {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
};

const getErrorMessage = (payload, fallbackMessage) => {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  return fallbackMessage;
};

export const getBookingOptionConfig = (appointmentType) => {
  const definition = bookingDefinitions[appointmentType];

  if (!definition) {
    const error = new Error("Tipo de evaluacion invalido.");
    error.statusCode = 400;
    throw error;
  }

  const timeZone = getEnv("RESERVO_TIME_ZONE") || DEFAULT_TIME_ZONE;
  const agendaUuid = requireEnv(`${definition.envPrefix}_AGENDA_UUID`);

  return {
    ...definition,
    timeZone,
    apiBaseUrl: getEnv("RESERVO_API_BASE_URL") || DEFAULT_API_BASE_URL,
    bookingEndpoint: getEnv("RESERVO_BOOKING_ENDPOINT") || DEFAULT_BOOKING_ENDPOINT,
    bookingUrlCode: getEnv(`${definition.envPrefix}_BOOKING_URL_CODE`) || agendaUuid,
    agendaUuid,
    treatmentUuid: requireEnv(`${definition.envPrefix}_TREATMENT_UUID`),
    sucursalUuid: requireEnv(`${definition.envPrefix}_SUCURSAL_UUID`),
    professionalUuid: requireEnv(`${definition.envPrefix}_PROFESSIONAL_UUID`),
    token: requireEnv("RESERVO_TOKEN"),
    weeksAhead: getWeeksAhead(),
  };
};

export const toPublicBookingOption = (config) => ({
  id: config.id,
  label: config.label,
  description: config.description,
  priceLabel: config.priceLabel,
  procedureName: config.procedureName,
  professionalName: config.professionalName,
  locationLabel: config.locationLabel,
  durationMinutes: config.durationMinutes,
  clinicName: config.clinicName,
  clinicAddress: config.clinicAddress,
  timeZone: config.timeZone,
});

const fetchAgendaAvailabilityWindow = async (config, startDate) => {
  const url = new URL(
    `agenda_online/${config.agendaUuid}/horarios_disponibles/`,
    `${config.apiBaseUrl.replace(/\/$/, "")}/`,
  );

  url.searchParams.set("uuid_tratamiento", config.treatmentUuid);
  url.searchParams.set("fecha", startDate);
  url.searchParams.set("uuid_sucursal", config.sucursalUuid);
  url.searchParams.set("uuid_profesional", config.professionalUuid);

  const response = await fetch(url, {
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
    },
  });
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(payload, "No se pudo consultar la disponibilidad en Reservo."),
    );
    error.statusCode = response.status >= 400 && response.status < 500 ? 502 : 500;
    throw error;
  }

  return Array.isArray(payload) ? payload : [];
};

const mergeAvailability = (currentAvailability, remoteDays) => {
  for (const day of remoteDays) {
    const dayKey = String(day?.fecha || "").trim();

    if (!dayKey) {
      continue;
    }

    for (const sucursal of Array.isArray(day?.sucursales) ? day.sucursales : []) {
      const sucursalId = String(sucursal?.uuid || sucursal?.sucursal || "").trim();

      if (sucursalId && sucursalId !== currentAvailability.sucursalUuid) {
        continue;
      }

      for (const profesional of Array.isArray(sucursal?.profesionales) ? sucursal.profesionales : []) {
        const professionalId = String(profesional?.agenda || profesional?.uuid || "").trim();

        if (professionalId && professionalId !== currentAvailability.professionalUuid) {
          continue;
        }

        for (const slot of Array.isArray(profesional?.horas_disponibles)
          ? profesional.horas_disponibles
          : []) {
          const slotDate = String(slot || "").slice(0, 10);
          const slotTime = String(slot || "").slice(11, 16);

          if (!slotDate || !slotTime) {
            continue;
          }

          if (!currentAvailability.days[slotDate]) {
            currentAvailability.days[slotDate] = new Set();
          }

          currentAvailability.days[slotDate].add(slotTime);
        }
      }
    }
  }
};

export const fetchAvailability = async (appointmentType) => {
  const config = getBookingOptionConfig(appointmentType);
  const startDates = buildStartDates(config.timeZone, config.weeksAhead);
  const availabilityState = {
    sucursalUuid: config.sucursalUuid,
    professionalUuid: config.professionalUuid,
    days: {},
  };
  const availabilityWindows = await Promise.all(
    startDates.map((startDate) => fetchAgendaAvailabilityWindow(config, startDate)),
  );

  for (const windowDays of availabilityWindows) {
    mergeAvailability(availabilityState, windowDays);
  }

  const availability = Object.fromEntries(
    Object.entries(availabilityState.days)
      .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
      .map(([date, times]) => [date, [...times].sort((left, right) => left.localeCompare(right))]),
  );

  return {
    option: toPublicBookingOption(config),
    availability,
  };
};

const normalizeText = (value) => String(value || "").trim();

const isPaymentLikeText = (value) => {
  const normalized = normalizeText(value).toLowerCase();

  return PAYMENT_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const toHttpUrl = (value) => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  try {
    const parsedUrl = new URL(normalized);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "";
    }

    return parsedUrl.toString();
  } catch {
    return "";
  }
};

const getHostname = (value) => {
  const normalized = toHttpUrl(value);

  if (!normalized) {
    return "";
  }

  try {
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return "";
  }
};

export const isFlowPaymentUrl = (value) => FLOW_PAYMENT_HOSTS.has(getHostname(value));

const decodeHtmlEntities = (value) =>
  normalizeText(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalizedEntity = String(entity || "").toLowerCase();

    if (normalizedEntity.startsWith("#x")) {
      const codePoint = Number.parseInt(normalizedEntity.slice(2), 16);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    if (normalizedEntity.startsWith("#")) {
      const codePoint = Number.parseInt(normalizedEntity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    return HTML_ENTITY_MAP[normalizedEntity] || match;
  });

const parseHtmlAttributes = (source) => {
  const attributes = {};
  const attributePattern =
    /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of source.matchAll(attributePattern)) {
    const name = String(match[1] || "").toLowerCase();

    if (!name) {
      continue;
    }

    attributes[name] = decodeHtmlEntities(match[2] || match[3] || match[4] || "");
  }

  return attributes;
};

const resolveAgainstBaseUrl = (value, baseUrl) => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return "";
  }
};

const buildUrlWithFields = (url, fields) => {
  const normalized = toHttpUrl(url);

  if (!normalized) {
    return "";
  }

  try {
    const nextUrl = new URL(normalized);

    Object.entries(fields || {}).forEach(([key, rawValue]) => {
      const name = normalizeText(key);

      if (!name) {
        return;
      }

      nextUrl.searchParams.set(name, normalizeText(rawValue));
    });

    return nextUrl.toString();
  } catch {
    return "";
  }
};

const stripHtmlTags = (value) => normalizeText(value).replace(/<[^>]*>/g, " ");

const extractUrlFromInlineScript = (value, baseUrl) => {
  const normalized = decodeHtmlEntities(value);
  const directUrlMatch =
    normalized.match(/https?:\/\/[^\s"'<>]+/i) ||
    normalized.match(/(?:location(?:\.href)?|window\.open)\s*=?\s*\(?\s*['"]([^'"]+)['"]/i) ||
    normalized.match(/['"]((?:\/|\.\/|\.\.\/)[^'"]+)['"]/i);

  if (!directUrlMatch) {
    return "";
  }

  const candidate = directUrlMatch[1] || directUrlMatch[0];
  return resolveAgainstBaseUrl(candidate, baseUrl);
};

const buildPaymentFormFields = (formHtml) => {
  const fields = {};
  const radioGroups = new Map();

  for (const match of formHtml.matchAll(/<input\b([^>]*)>/gi)) {
    const attributes = parseHtmlAttributes(match[1] || "");
    const name = normalizeText(attributes.name);
    const type = normalizeText(attributes.type || "text").toLowerCase();

    if (!name || type === "submit" || type === "button" || type === "image" || type === "reset") {
      continue;
    }

    if (type === "radio" || type === "checkbox") {
      if (!radioGroups.has(name)) {
        radioGroups.set(name, []);
      }

      radioGroups.get(name).push({
        value: attributes.value || "on",
        checked: Object.prototype.hasOwnProperty.call(attributes, "checked"),
      });
      continue;
    }

    fields[name] = attributes.value || "";
  }

  for (const [name, options] of radioGroups.entries()) {
    const checkedOption = options.find((option) => option.checked) || options[0];

    if (checkedOption) {
      fields[name] = checkedOption.value;
    }
  }

  return fields;
};

const extractSubmitAction = (formHtml) => {
  for (const match of formHtml.matchAll(/<(input|button)\b([^>]*)>/gi)) {
    const tagName = String(match[1] || "").toLowerCase();
    const attributes = parseHtmlAttributes(match[2] || "");
    const type = normalizeText(attributes.type || (tagName === "button" ? "submit" : "")).toLowerCase();
    const label = normalizeText(attributes.value || attributes["aria-label"] || attributes.title);

    if (type !== "submit" && !(tagName === "button" && !type)) {
      continue;
    }

    if (!/realizar\s+pago/i.test(label) && !/pagar/i.test(label)) {
      continue;
    }

    return {
      name: normalizeText(attributes.name),
      value: normalizeText(attributes.value),
    };
  }

  return null;
};

export const extractPaymentRedirectFromHtml = (html, pageUrl) => {
  const directFlowUrlMatch = decodeHtmlEntities(html).match(
    /https?:\/\/(?:www\.)?flow\.cl\/app\/web\/pay\.php\?[^"'\\s<>]+/i,
  );

  if (directFlowUrlMatch) {
    return {
      url: directFlowUrlMatch[0],
      method: "GET",
      fields: {},
    };
  }

  const formMatches = [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)];

  for (const match of formMatches) {
    const formAttributes = parseHtmlAttributes(match[1] || "");
    const formHtml = match[2] || "";
    const formText = stripHtmlTags(formHtml).toLowerCase();
    const formAction = resolveAgainstBaseUrl(formAttributes.action || pageUrl, pageUrl);
    const formMethod = normalizeText(formAttributes.method || "GET").toUpperCase();
    const formFields = buildPaymentFormFields(formHtml);
    const submitAction = extractSubmitAction(formHtml);
    const enrichedFields = { ...formFields };

    if (submitAction?.name) {
      enrichedFields[submitAction.name] = submitAction.value;
    }

    if (!formAction) {
      continue;
    }

    const directFlowUrl =
      isFlowPaymentUrl(formAction) && formMethod !== "POST"
        ? buildUrlWithFields(formAction, enrichedFields)
        : "";

    if (directFlowUrl) {
      return {
        url: directFlowUrl,
        method: "GET",
        fields: {},
      };
    }

    const hasPaymentButton =
      /realizar\s+pago/i.test(formText) ||
      /pagar/i.test(formText) ||
      /wflow/i.test(formText) ||
      /flow/i.test(formText) ||
      isPaymentLikeText(formAction) ||
      isPaymentLikeText(formText) ||
      isFlowPaymentUrl(formAction);

    if (!hasPaymentButton) {
      continue;
    }

    return {
      url: formAction,
      method: formMethod === "POST" ? "POST" : "GET",
      fields: enrichedFields,
    };
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = parseHtmlAttributes(match[1] || "");
    const text = stripHtmlTags(match[2] || "");
    const href = resolveAgainstBaseUrl(attributes.href || "", pageUrl);

    if (!href) {
      continue;
    }

    if (
      isFlowPaymentUrl(href) ||
      /realizar\s+pago/i.test(text) ||
      (/pagar/i.test(text) && (isPaymentLikeText(href) || isFlowPaymentUrl(href)))
    ) {
      return {
        url: href,
        method: "GET",
        fields: {},
      };
    }
  }

  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attributes = parseHtmlAttributes(match[1] || "");
    const text = stripHtmlTags(match[2] || "");
    const actionUrl = extractUrlFromInlineScript(attributes.onclick || "", pageUrl);

    if (!actionUrl) {
      continue;
    }

    if (
      isFlowPaymentUrl(actionUrl) ||
      /realizar\s+pago/i.test(text) ||
      (/pagar/i.test(text) && (isPaymentLikeText(actionUrl) || isFlowPaymentUrl(actionUrl)))
    ) {
      return {
        url: actionUrl,
        method: "GET",
        fields: {},
      };
    }
  }

  return null;
};

const resolvePaymentRedirect = async (paymentUrl) => {
  const normalizedPaymentUrl = toHttpUrl(paymentUrl);

  if (!normalizedPaymentUrl) {
    return null;
  }

  try {
    const response = await fetch(normalizedPaymentUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; Cirugia360Bot/1.0)",
      },
    });

    if (!response.ok) {
      return null;
    }

    const responseText = await response.text();
    const finalUrl = toHttpUrl(response.url) || normalizedPaymentUrl;
    const resolvedRedirect = extractPaymentRedirectFromHtml(responseText, finalUrl);

    if (resolvedRedirect) {
      return resolvedRedirect;
    }

    if (finalUrl !== normalizedPaymentUrl) {
      return {
        url: finalUrl,
        method: "GET",
        fields: {},
      };
    }
  } catch (error) {
    console.warn("No se pudo resolver el redirect de pago de Reservo.", error);
  }

  return null;
};

const extractPaymentUrlFromPayload = (payload, appointmentType) => {
  const visited = new Set();
  const paymentUrls = [];
  const candidateUrls = [];

  const visit = (value, parentKey = "", withinPaymentContext = false) => {
    if (typeof value === "string") {
      const url = toHttpUrl(value);

      if (!url) {
        return;
      }

      if (withinPaymentContext || isPaymentLikeText(parentKey) || isPaymentLikeText(url)) {
        paymentUrls.push(url);
        return;
      }

      candidateUrls.push(url);
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    if (visited.has(value)) {
      return;
    }

    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item, parentKey, withinPaymentContext);
      }
      return;
    }

    const entries = Object.entries(value);
    const objectHasPaymentContext =
      withinPaymentContext ||
      entries.some(([key, childValue]) => {
        if (isPaymentLikeText(key)) {
          return true;
        }

        return typeof childValue === "string" && isPaymentLikeText(childValue);
      });

    for (const [key, childValue] of entries) {
      visit(childValue, key, objectHasPaymentContext || isPaymentLikeText(key));
    }
  };

  visit(payload);

  if (paymentUrls.length > 0) {
    return paymentUrls[0];
  }

  const uniqueCandidateUrls = [...new Set(candidateUrls)];

  if (appointmentType === "presencial" && uniqueCandidateUrls.length === 1) {
    return uniqueCandidateUrls[0];
  }

  return null;
};

const getRutRawValue = (value) =>
  normalizeText(value)
    .replace(/[^0-9kK]/g, "")
    .toUpperCase()
    .slice(0, 9);

const normalizeRut = (value) => {
  const rawValue = getRutRawValue(value);

  if (rawValue.length <= 1) {
    return rawValue;
  }

  const verifierDigit = rawValue.slice(-1);
  const body = rawValue.slice(0, -1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${verifierDigit}`;
};

const getRutVerifierDigit = (body) => {
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

const isValidRut = (value) => {
  const rawValue = getRutRawValue(value);

  if (rawValue.length < 8) {
    return false;
  }

  const body = rawValue.slice(0, -1);
  const verifierDigit = rawValue.slice(-1);

  return getRutVerifierDigit(body) === verifierDigit;
};

const normalizePhone = (value) => {
  const rawValue = normalizeText(value);

  if (!rawValue) {
    return "";
  }

  const compact = rawValue.replace(/[^\d+]/g, "");

  if (compact.startsWith("+")) {
    return compact;
  }

  if (compact.startsWith("00")) {
    return `+${compact.slice(2)}`;
  }

  const digits = compact.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("56")) {
    return `+${digits}`;
  }

  if (digits.length === 9) {
    return `+56${digits}`;
  }

  return `+${digits}`;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));
const isValidPhone = (value) => /^\+56\d{9}$/.test(normalizePhone(value));

export const validateBookingPayload = (payload) => {
  const errors = [];
  const appointmentType = normalizeText(payload?.appointmentType);
  const personal = payload?.personal || {};
  const selectedSlot = payload?.selectedSlot || {};

  if (!bookingDefinitions[appointmentType]) {
    errors.push("Selecciona un tipo de evaluacion valido.");
  }

  if (!normalizeRut(personal.rut)) {
    errors.push("El RUT es obligatorio.");
  } else if (!isValidRut(personal.rut)) {
    errors.push("Ingresa un RUT valido.");
  }

  if (!normalizeText(personal.firstName)) {
    errors.push("El nombre es obligatorio.");
  }

  if (!normalizeText(personal.lastName1)) {
    errors.push("El apellido es obligatorio.");
  }

  if (!normalizeText(personal.lastName2)) {
    errors.push("El segundo apellido es obligatorio.");
  }

  if (!isValidEmail(personal.email)) {
    errors.push("Ingresa un correo valido.");
  }

  if (!isValidPhone(personal.phone)) {
    errors.push("Ingresa un telefono valido.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizeText(selectedSlot.date))) {
    errors.push("Selecciona una fecha valida.");
  }

  if (!/^\d{2}:\d{2}$/.test(normalizeText(selectedSlot.time))) {
    errors.push("Selecciona una hora valida.");
  }

  return errors;
};

const buildBookingNotes = (payload, config) =>
  [
    `Origen: web dr-sebastian-torres`,
    `Tipo: ${config.label}`,
    payload?.sourceUrl ? `Pagina: ${normalizeText(payload.sourceUrl)}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

export const createReservoBooking = async (payload) => {
  const config = getBookingOptionConfig(payload.appointmentType);
  const notes = buildBookingNotes(payload, config);
  const requestBody = {
    sucursal: config.sucursalUuid,
    tratamientos_uuid: [config.treatmentUuid],
    agendas_uuid: [config.professionalUuid],
    url: config.bookingUrlCode,
    calendario: {
      date: normalizeText(payload?.selectedSlot?.date),
      hour: normalizeText(payload?.selectedSlot?.time),
      time_zone: config.timeZone,
    },
    procedimiento: config.procedureName,
    comentario: config.procedureName,
    comentarios: notes,
    observaciones: notes,
    nota: notes,
    cliente: {
      rut: normalizeRut(payload?.personal?.rut),
      nombre: normalizeText(payload?.personal?.firstName),
      apellido_paterno: normalizeText(payload?.personal?.lastName1),
      apellido_materno: normalizeText(payload?.personal?.lastName2),
      telefono: normalizePhone(payload?.personal?.phone),
      email: normalizeText(payload?.personal?.email).toLowerCase(),
    },
  };
  const response = await fetch(config.bookingEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  const remotePayload = await parseJsonSafely(response);

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(remotePayload, "Reservo no pudo confirmar la reserva."),
    );
    error.statusCode = response.status === 400 ? 409 : 502;
    error.remotePayload = remotePayload;
    throw error;
  }

  const paymentUrl = extractPaymentUrlFromPayload(remotePayload, config.id);
  const paymentRedirect = paymentUrl ? await resolvePaymentRedirect(paymentUrl) : null;

  return {
    ok: true,
    option: toPublicBookingOption(config),
    selectedSlot: {
      date: requestBody.calendario.date,
      time: requestBody.calendario.hour,
      timeZone: config.timeZone,
    },
    paymentUrl,
    paymentRedirect,
    source: remotePayload,
  };
};
