import { requireDashboardAuth } from "../_cirugia360-dashboard-auth.js";
import { methodNotAllowed, normalizeText, sendJson } from "../_cirugia360-speed-shared.js";

const maskValue = (value) => {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length <= 8) {
    return "configured";
  }

  return `${normalizedValue.slice(0, 4)}...${normalizedValue.slice(-4)}`;
};

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return methodNotAllowed(response, ["GET"]);
  }

  const user = await requireDashboardAuth(request, response);

  if (!user) {
    return;
  }

  return sendJson(response, 200, {
    success: true,
    data: {
      accessTokenConfigured: Boolean(normalizeText(process.env.META_ACCESS_TOKEN)),
      pixelId: maskValue(process.env.META_PIXEL_ID),
      adAccountId: maskValue(process.env.META_AD_ACCOUNT_ID),
      apiVersion: normalizeText(process.env.META_API_VERSION) || "v23.0",
      testEventCodeConfigured: Boolean(normalizeText(process.env.META_TEST_EVENT_CODE)),
      eventNames: {
        lead: normalizeText(process.env.META_EVENT_NAME_LEAD) || "ProspectCaptured",
        contact: normalizeText(process.env.META_EVENT_NAME_CONTACT) || "ProspectReached",
        schedule: normalizeText(process.env.META_EVENT_NAME_SCHEDULE) || "ProspectQualified",
        scheduled: normalizeText(process.env.META_EVENT_NAME_SCHEDULED) || "ProspectScheduled",
        purchase: normalizeText(process.env.META_EVENT_NAME_PURCHASE) || "ProspectClosed",
      },
    },
  });
}
