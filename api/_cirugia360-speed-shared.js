import { parseRawBody, sendJson } from "./_blog-shared.js";

export { parseRawBody, sendJson };

export const normalizeText = (value) => String(value ?? "").trim();

export const methodNotAllowed = (response, allowedMethods) => {
  response.setHeader("Allow", allowedMethods.join(", "));
  sendJson(response, 405, {
    success: false,
    error: "Metodo no permitido.",
  });
};

export const sendXml = (response, xml) => {
  response.statusCode = 200;
  response.setHeader("Content-Type", "text/xml; charset=utf-8");
  response.end(xml);
};

const hasBodyObject = (request) =>
  request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body);

export const readJsonBody = async (request) => {
  if (hasBodyObject(request)) {
    return request.body;
  }

  if (typeof request.body === "string" && request.body.trim()) {
    return JSON.parse(request.body);
  }

  if (Buffer.isBuffer(request.body) && request.body.length > 0) {
    return JSON.parse(request.body.toString("utf8"));
  }

  const rawBody = await parseRawBody(request);
  return rawBody ? JSON.parse(rawBody) : {};
};

export const readFormBody = async (request) => {
  if (hasBodyObject(request)) {
    return Object.fromEntries(
      Object.entries(request.body).map(([key, value]) => [key, normalizeText(value)]),
    );
  }

  const rawBody =
    typeof request.body === "string"
      ? request.body
      : Buffer.isBuffer(request.body)
        ? request.body.toString("utf8")
        : await parseRawBody(request);

  const params = new URLSearchParams(rawBody || "");
  return Object.fromEntries(params.entries());
};

export const getHeader = (request, name) => {
  const loweredName = name.toLowerCase();
  const match = Object.entries(request.headers || {}).find(
    ([headerName]) => headerName.toLowerCase() === loweredName,
  );

  if (!match) {
    return "";
  }

  const [, value] = match;
  return Array.isArray(value) ? normalizeText(value[0]) : normalizeText(value);
};

export const getFirstQueryValue = (value) => {
  if (Array.isArray(value)) {
    return getFirstQueryValue(value[0]);
  }

  return normalizeText(value);
};

export const parseOptionalBooleanEnv = (name) => {
  const rawValue = process.env[name];

  if (!rawValue?.trim()) {
    return null;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  throw new Error(`La variable ${name} debe ser "true" o "false".`);
};

export const parseOptionalPositiveIntegerEnv = (name) => {
  const rawValue = process.env[name];

  if (!rawValue?.trim()) {
    return null;
  }

  const parsedValue = Number(rawValue.trim());

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`La variable ${name} debe ser un entero mayor a 0.`);
  }

  return parsedValue;
};

export const isLocalDevelopment = () => {
  const nodeEnv = normalizeText(process.env.NODE_ENV).toLowerCase();
  return nodeEnv === "development" && !normalizeText(process.env.VERCEL);
};

export const normalizePhoneInput = (value, defaultCountryDialCode = "56") => {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "";
  }

  const compactValue = normalizedValue.replace(/[^\d+]/g, "");

  if (compactValue.startsWith("+")) {
    return compactValue;
  }

  if (compactValue.startsWith("00")) {
    return `+${compactValue.slice(2)}`;
  }

  const digits = compactValue.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith(defaultCountryDialCode)) {
    return `+${digits}`;
  }

  return `+${defaultCountryDialCode}${digits}`;
};

export const normalizeEmail = (value) => {
  const normalizedValue = normalizeText(value).toLowerCase();
  return normalizedValue || null;
};

export const uniqueStrings = (values) => {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const normalizedValue = normalizeText(value);

    if (!normalizedValue || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    result.push(normalizedValue);
  }

  return result;
};

export const resolveAppUrl = (request) => {
  const explicitAppUrl =
    normalizeText(process.env.APP_URL) || normalizeText(process.env.PUBLIC_SITE_URL);

  if (explicitAppUrl) {
    return explicitAppUrl.replace(/\/+$/, "");
  }

  const forwardedHost =
    normalizeText(getHeader(request, "x-forwarded-host")) || normalizeText(getHeader(request, "host"));
  const forwardedProto = normalizeText(getHeader(request, "x-forwarded-proto")) || "https";

  if (!forwardedHost) {
    throw new Error("No pudimos resolver APP_URL. Define APP_URL o PUBLIC_SITE_URL.");
  }

  return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
};

export const getRequestUrl = (request) => {
  const appUrl = resolveAppUrl(request);
  const requestPath = normalizeText(request.url) || "/";
  return new URL(requestPath, appUrl).toString();
};
