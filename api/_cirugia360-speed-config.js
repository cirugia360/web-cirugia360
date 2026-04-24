import {
  isLocalDevelopment,
  normalizePhoneInput,
  normalizeText,
  parseOptionalBooleanEnv,
  parseOptionalPositiveIntegerEnv,
  resolveAppUrl,
} from "./_cirugia360-speed-shared.js";

const DEFAULT_BUSINESS_TIME_ZONE = "America/Santiago";
const DEFAULT_RETRY_DELAY_SECONDS = 180;
const DEFAULT_AGENT_CALL_COOLDOWN_SECONDS = 180;

const requireEnv = (name) => {
  const value = normalizeText(process.env[name]);

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
};

const assertValidTimeZone = (timeZone) => {
  try {
    new Intl.DateTimeFormat("es-CL", { timeZone }).format(new Date());
  } catch {
    throw new Error(`La zona horaria ${timeZone} no es valida.`);
  }
};

const normalizeAgent = (agent, index, defaultCountryDialCode) => {
  if (!agent || typeof agent !== "object" || Array.isArray(agent)) {
    throw new Error("Cada asesora en CIRUGIA360_STL_AGENTS_JSON debe ser un objeto.");
  }

  const name = normalizeText(agent.name);
  const phone = normalizePhoneInput(agent.phone, defaultCountryDialCode);

  if (!name || !phone) {
    throw new Error("Cada asesora debe incluir name y phone validos.");
  }

  return {
    id: normalizeText(agent.id) || `agent-${index + 1}`,
    name,
    phone,
  };
};

const parseSalesAgents = (defaultCountryDialCode, requireAgents = true) => {
  const rawAgentsJson = normalizeText(process.env.CIRUGIA360_STL_AGENTS_JSON);

  if (rawAgentsJson) {
    let parsedAgents;

    try {
      parsedAgents = JSON.parse(rawAgentsJson);
    } catch {
      throw new Error("CIRUGIA360_STL_AGENTS_JSON debe ser JSON valido.");
    }

    if (!Array.isArray(parsedAgents) || parsedAgents.length === 0) {
      throw new Error("CIRUGIA360_STL_AGENTS_JSON debe contener al menos una asesora.");
    }

    return parsedAgents.map((agent, index) =>
      normalizeAgent(agent, index, defaultCountryDialCode),
    );
  }

  const singleAgentName = normalizeText(process.env.CIRUGIA360_STL_AGENT_NAME);
  const singleAgentPhone = normalizeText(process.env.CIRUGIA360_STL_AGENT_PHONE);

  if (singleAgentName && singleAgentPhone) {
    return [
      {
        id: "agent-1",
        name: singleAgentName,
        phone: normalizePhoneInput(singleAgentPhone, defaultCountryDialCode),
      },
    ];
  }

  if (!requireAgents) {
    return [];
  }

  throw new Error(
    "Define CIRUGIA360_STL_AGENTS_JSON o CIRUGIA360_STL_AGENT_NAME/CIRUGIA360_STL_AGENT_PHONE.",
  );
};

const resolveTwilioConfig = (defaultCountryDialCode, requireTwilio) => {
  const accountSid = normalizeText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = normalizeText(process.env.TWILIO_AUTH_TOKEN);
  const phoneNumber = normalizeText(process.env.TWILIO_PHONE_NUMBER);

  if (!accountSid || !authToken || !phoneNumber) {
    if (requireTwilio) {
      requireEnv("TWILIO_ACCOUNT_SID");
      requireEnv("TWILIO_AUTH_TOKEN");
      requireEnv("TWILIO_PHONE_NUMBER");
    }

    return {
      twilioAccountSid: accountSid,
      twilioAuthToken: authToken,
      twilioPhoneNumber: phoneNumber ? normalizePhoneInput(phoneNumber, defaultCountryDialCode) : "",
      twilioConfigured: false,
    };
  }

  return {
    twilioAccountSid: accountSid,
    twilioAuthToken: authToken,
    twilioPhoneNumber: normalizePhoneInput(phoneNumber, defaultCountryDialCode),
    twilioConfigured: true,
  };
};

export const getCirugia360SpeedConfig = (request, options = {}) => {
  const defaultCountryDialCode = normalizeText(process.env.DEFAULT_COUNTRY_DIAL_CODE) || "56";
  const businessTimeZone =
    normalizeText(process.env.CIRUGIA360_STL_BUSINESS_TIME_ZONE) ||
    normalizeText(process.env.BUSINESS_TIME_ZONE) ||
    DEFAULT_BUSINESS_TIME_ZONE;
  const explicitTwilioSignatureValidation = parseOptionalBooleanEnv("TWILIO_VALIDATE_SIGNATURE");

  assertValidTimeZone(businessTimeZone);

  return {
    appUrl: resolveAppUrl(request),
    defaultCountryDialCode,
    businessTimeZone,
    retryDelaySeconds:
      parseOptionalPositiveIntegerEnv("CIRUGIA360_STL_RETRY_DELAY_SECONDS") ||
      DEFAULT_RETRY_DELAY_SECONDS,
    agentCallCooldownSeconds:
      parseOptionalPositiveIntegerEnv("CIRUGIA360_STL_AGENT_CALL_COOLDOWN_SECONDS") ||
      parseOptionalPositiveIntegerEnv("AGENT_CALL_COOLDOWN_SECONDS") ||
      DEFAULT_AGENT_CALL_COOLDOWN_SECONDS,
    queuePaused: parseOptionalBooleanEnv("CIRUGIA360_STL_QUEUE_PAUSED") ?? false,
    cronSecret:
      normalizeText(process.env.CRON_SECRET) || normalizeText(process.env.CIRUGIA360_STL_CRON_SECRET),
    validateTwilioSignature:
      explicitTwilioSignatureValidation ?? !isLocalDevelopment(),
    salesAgents: parseSalesAgents(defaultCountryDialCode, options.requireAgents !== false),
    ...resolveTwilioConfig(defaultCountryDialCode, Boolean(options.requireTwilio)),
  };
};
