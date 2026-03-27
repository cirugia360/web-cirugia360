import { sendJson } from "../_blog-shared.js";
import { fetchAvailability } from "../_reservo.js";

const pickQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
    return;
  }

  const appointmentType = pickQueryValue(request.query?.appointmentType);

  if (!appointmentType) {
    sendJson(response, 400, {
      ok: false,
      error: "Falta el parametro appointmentType.",
    });
    return;
  }

  try {
    const payload = await fetchAvailability(appointmentType);
    sendJson(response, 200, { ok: true, ...payload });
  } catch (error) {
    console.error("Reservo availability API error", error);
    sendJson(response, error.statusCode || 500, {
      ok: false,
      error: error.message || "No se pudo cargar la disponibilidad.",
    });
  }
}
