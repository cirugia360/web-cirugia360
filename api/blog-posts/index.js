import { sendJson } from "../_blog-shared.js";
import { listPostSummaries } from "../_supabase.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Metodo no permitido." });
    return;
  }

  try {
    const items = await listPostSummaries();
    sendJson(response, 200, { items });
  } catch (error) {
    console.error("Blog posts API error", error);
    sendJson(response, 500, { error: "No se pudo cargar el listado del blog." });
  }
}
