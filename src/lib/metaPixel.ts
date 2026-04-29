type MetaPixelCommand =
  | "init"
  | "set"
  | "track"
  | "trackCustom"
  | "trackSingle"
  | "trackSingleCustom";

type MetaPixelFn = {
  (...args: [MetaPixelCommand, ...unknown[]]): void;
};

type AdvancedMatchingInput = {
  email?: string | null;
  phone?: string | null;
};

type MetaEventOptions = {
  eventID?: string | null;
};

declare global {
  interface Window {
    fbq?: MetaPixelFn;
    _fbq?: MetaPixelFn;
  }
}

const META_PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID || "").trim();
const META_PIXEL_DEBUG =
  import.meta.env.DEV || (import.meta.env.VITE_META_PIXEL_DEBUG || "").toLowerCase() === "true";

export const META_PIXEL_EVENT_NAMES = {
  prospectCaptured: import.meta.env.VITE_META_EVENT_NAME_LEAD || "ProspectCaptured",
  prospectReached: import.meta.env.VITE_META_EVENT_NAME_CONTACT || "ProspectReached",
  prospectQualified: import.meta.env.VITE_META_EVENT_NAME_SCHEDULE || "ProspectQualified",
  prospectClosed: import.meta.env.VITE_META_EVENT_NAME_PURCHASE || "ProspectClosed",
};

let lastPageViewUrl = "";
let lastAdvancedMatchingSignature = "";

const logMetaPixel = (message: string, payload: Record<string, unknown> = {}) => {
  if (!META_PIXEL_DEBUG || typeof console === "undefined") {
    return;
  }

  console.info(`[Meta Pixel] ${message}`, payload);
};

const getFbq = () => {
  if (typeof window === "undefined" || !META_PIXEL_ID || typeof window.fbq !== "function") {
    logMetaPixel("fbq unavailable", {
      pixelIdConfigured: Boolean(META_PIXEL_ID),
      fbqLoaded: typeof window !== "undefined" && typeof window.fbq === "function",
    });
    return null;
  }

  return window.fbq;
};

const normalizeEmail = (value?: string | null) => (value || "").trim().toLowerCase();

const normalizePhone = (value?: string | null) => {
  const digits = (value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.startsWith("56") ? digits : `56${digits}`;
};

const toSha256Hex = async (value: string) => {
  if (!value || typeof crypto === "undefined" || !crypto.subtle) {
    return "";
  }

  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
};

export const createMetaEventId = (eventName: string, scope = "browser") => {
  const randomValue =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${eventName}:${scope}:${randomValue}`;
};

export const trackMetaEvent = (
  eventName: string,
  data: Record<string, unknown> = {},
  options: MetaEventOptions = {},
) => {
  const fbq = getFbq();

  if (!fbq) {
    return false;
  }

  try {
    if (options.eventID) {
      fbq("track", eventName, data, { eventID: options.eventID });
    } else {
      fbq("track", eventName, data);
    }

    logMetaPixel("event tracked", { eventName, data, options });
    return true;
  } catch (error) {
    logMetaPixel("event failed", {
      eventName,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

export const trackMetaCustomEvent = (
  eventName: string,
  data: Record<string, unknown> = {},
  options: MetaEventOptions = {},
) => {
  const fbq = getFbq();

  if (!fbq) {
    return false;
  }

  try {
    if (options.eventID) {
      fbq("trackCustom", eventName, data, { eventID: options.eventID });
    } else {
      fbq("trackCustom", eventName, data);
    }

    logMetaPixel("custom event tracked", { eventName, data, options });
    return true;
  } catch (error) {
    logMetaPixel("custom event failed", {
      eventName,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

export const trackMetaPageView = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const currentUrl = window.location.href;

  if (currentUrl === lastPageViewUrl) {
    return false;
  }

  lastPageViewUrl = currentUrl;
  return trackMetaEvent("PageView");
};

export const updateMetaAdvancedMatching = async ({ email, phone }: AdvancedMatchingInput) => {
  const fbq = getFbq();

  if (!fbq) {
    return false;
  }

  const [emailHash, phoneHash] = await Promise.all([
    toSha256Hex(normalizeEmail(email)),
    toSha256Hex(normalizePhone(phone)),
  ]);
  const matchingData = Object.fromEntries(
    Object.entries({
      em: emailHash || undefined,
      ph: phoneHash || undefined,
    }).filter(([, value]) => value),
  );
  const signature = JSON.stringify(matchingData);

  if (!Object.keys(matchingData).length || signature === lastAdvancedMatchingSignature) {
    return false;
  }

  lastAdvancedMatchingSignature = signature;
  try {
    fbq("set", "autoConfig", true, META_PIXEL_ID);
    fbq("init", META_PIXEL_ID, matchingData, { autoConfig: true });
    logMetaPixel("advanced matching updated", {
      fields: Object.keys(matchingData),
    });
  } catch (error) {
    logMetaPixel("advanced matching failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }

  return true;
};
