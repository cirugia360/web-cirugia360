import { parseRawBody, sendJson } from "./_blog-shared.js";
import { getCirugia360SpeedConfigWithSettings } from "./_cirugia360-speed-config.js";
import { createBookingLeadFromBooking } from "./_cirugia360-speed-workflow.js";
import { createReservoBooking, validateBookingPayload } from "./_reservo.js";

const readJsonPayload = async (request) => {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
    return;
  }

  let payload;

  try {
    payload = await readJsonPayload(request);
  } catch {
    sendJson(response, 400, { ok: false, error: "JSON invalido." });
    return;
  }

  const errors = validateBookingPayload(payload);

  if (errors.length > 0) {
    sendJson(response, 400, { ok: false, error: errors[0], errors });
    return;
  }

  try {
    const booking = await createReservoBooking(payload);
    let bookingFollowUp = null;

    try {
      const speedConfig = await getCirugia360SpeedConfigWithSettings(request, {
        requireAgents: true,
        requireTwilio: false,
      });

      bookingFollowUp = await createBookingLeadFromBooking(
        {
          bookingPayload: payload,
          bookingResponse: booking,
          sourceUrl: payload?.sourceUrl || "",
        },
        speedConfig,
      );
    } catch (bookingFollowUpError) {
      console.error("Cirugia360 booking follow-up setup error", bookingFollowUpError);
    }

    sendJson(response, 200, {
      ...booking,
      bookingFollowUp,
    });
  } catch (error) {
    console.error("Reservo booking API error", error);
    sendJson(response, error.statusCode || 500, {
      ok: false,
      error: error.message || "No se pudo crear la reserva.",
    });
  }
}
