import { getCirugia360SpeedConfigWithSettings } from "../_cirugia360-speed-config.js";
import {
  getFirstQueryValue,
  isLocalDevelopment,
  methodNotAllowed,
  readJsonBody,
  sendJson,
} from "../_cirugia360-speed-shared.js";
import { dispatchDueLeads } from "../_cirugia360-speed-workflow.js";

const getCronSecret = () => {
  const secret =
    process.env.CRON_SECRET?.trim() || process.env.CIRUGIA360_STL_CRON_SECRET?.trim() || "";

  if (secret) {
    return secret;
  }

  if (isLocalDevelopment()) {
    return "";
  }

  throw new Error(
    "Falta CRON_SECRET. Define un secreto para proteger /api/cirugia360-speed/queue-dispatch.",
  );
};

const isAuthorized = (request) => {
  const secret = getCronSecret();

  if (!secret) {
    return true;
  }

  return request.headers.authorization === `Bearer ${secret}`;
};

const parseLimit = async (request) => {
  const queryLimit = Number.parseInt(getFirstQueryValue(request.query?.limit), 10);

  if (Number.isInteger(queryLimit) && queryLimit > 0) {
    return queryLimit;
  }

  if (request.method === "POST") {
    const body = await readJsonBody(request).catch(() => ({}));
    const bodyLimit = Number.parseInt(String(body.limit || ""), 10);

    if (Number.isInteger(bodyLimit) && bodyLimit > 0) {
      return bodyLimit;
    }
  }

  return 20;
};

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method || "")) {
    return methodNotAllowed(response, ["GET", "POST"]);
  }

  try {
    if (!isAuthorized(request)) {
      return sendJson(response, 401, {
        success: false,
        error: "No autorizado.",
      });
    }

    const limit = await parseLimit(request);
    const config = await getCirugia360SpeedConfigWithSettings(request, {
      requireTwilio: true,
    });
    const result = await dispatchDueLeads(config, limit);

    return sendJson(response, 200, {
      success: true,
      ...result,
    });
  } catch (error) {
    return sendJson(response, 500, {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo procesar la cola de Cirugia360 Speed.",
    });
  }
}
