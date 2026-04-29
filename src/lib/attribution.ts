const STORAGE_KEY = "c360_attribution_v1";

export type AttributionSnapshot = {
  source: string;
  medium: string;
  channel: string;
  campaign: string | null;
  content: string | null;
  term: string | null;
  fbclid: string | null;
  fbp: string | null;
  fbc: string | null;
  gclid: string | null;
  referrer: string | null;
  landingPage: string;
  firstTouchUrl: string;
  lastTouchUrl: string;
  firstTouchAt: string;
  lastTouchAt: string;
};

const getParam = (params: URLSearchParams, key: string) => {
  const value = params.get(key)?.trim();
  return value || null;
};

const getCookie = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  try {
    return decodeURIComponent(cookie.slice(name.length + 1)) || null;
  } catch {
    return null;
  }
};

const safeParse = (value: string | null): AttributionSnapshot | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as AttributionSnapshot;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const normalizeHost = (value: string | null) => {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

const inferChannel = ({
  source,
  medium,
  referrer,
  fbclid,
  gclid,
}: {
  source: string | null;
  medium: string | null;
  referrer: string | null;
  fbclid: string | null;
  gclid: string | null;
}) => {
  const normalizedSource = (source || "").toLowerCase();
  const normalizedMedium = (medium || "").toLowerCase();
  const referrerHost = normalizeHost(referrer);
  const isInstagramTraffic =
    normalizedSource.includes("instagram") || referrerHost.includes("instagram");

  if (isInstagramTraffic && ["bio", "organic"].includes(normalizedMedium)) {
    return normalizedMedium === "bio" ? "instagram_bio" : "instagram_organic";
  }

  if (gclid || normalizedMedium === "cpc" || normalizedMedium === "paid_search") {
    return "google_ads";
  }

  if (fbclid || ["paid_social", "meta_ads", "facebook_ads"].includes(normalizedMedium)) {
    return "meta_ads";
  }

  if (isInstagramTraffic) {
    return "instagram_organic";
  }

  if (normalizedSource.includes("google") || referrerHost.includes("google")) {
    return "google_organic";
  }

  if (referrerHost) {
    return "referral";
  }

  return "direct";
};

const inferSource = (channel: string, source: string | null) => {
  if (source) {
    return source.toLowerCase();
  }

  if (channel.startsWith("instagram")) {
    return "instagram";
  }

  if (channel === "google_ads" || channel === "google_organic") {
    return "google";
  }

  if (channel === "meta_ads") {
    return "meta";
  }

  return channel;
};

const inferMedium = (channel: string, medium: string | null) => {
  if (medium) {
    return medium.toLowerCase();
  }

  if (channel === "google_ads" || channel === "meta_ads") {
    return "paid";
  }

  if (channel === "referral") {
    return "referral";
  }

  if (channel === "direct") {
    return "direct";
  }

  return "organic";
};

export const captureAttribution = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const url = new URL(window.location.href);
  const params = url.searchParams;
  const previous = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const referrer = document.referrer || previous?.referrer || null;
  const sourceParam = getParam(params, "utm_source");
  const mediumParam = getParam(params, "utm_medium");
  const currentFbclid = getParam(params, "fbclid");
  const currentGclid = getParam(params, "gclid");
  const channel = inferChannel({
    source: sourceParam,
    medium: mediumParam,
    referrer,
    fbclid: currentFbclid,
    gclid: currentGclid,
  });
  const now = new Date().toISOString();
  const next: AttributionSnapshot = {
    source: inferSource(channel, sourceParam || previous?.source || null),
    medium: inferMedium(channel, mediumParam || previous?.medium || null),
    channel,
    campaign: getParam(params, "utm_campaign") || previous?.campaign || null,
    content: getParam(params, "utm_content") || previous?.content || null,
    term: getParam(params, "utm_term") || previous?.term || null,
    fbclid: currentFbclid || previous?.fbclid || null,
    fbp: getCookie("_fbp") || previous?.fbp || null,
    fbc: getCookie("_fbc") || previous?.fbc || null,
    gclid: currentGclid || previous?.gclid || null,
    referrer,
    landingPage: previous?.landingPage || `${url.pathname}${url.search}`,
    firstTouchUrl: previous?.firstTouchUrl || url.href,
    lastTouchUrl: url.href,
    firstTouchAt: previous?.firstTouchAt || now,
    lastTouchAt: now,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const getAttributionSnapshot = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return captureAttribution() || safeParse(window.localStorage.getItem(STORAGE_KEY));
};
