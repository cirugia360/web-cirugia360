import { sendJson } from "./_blog-shared.js";
import { getPostBySlug } from "./_supabase.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Metodo no permitido." });
    return;
  }

  const rawSlug = request.query?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) {
    sendJson(response, 400, { error: "Falta el slug del articulo." });
    return;
  }

  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      sendJson(response, 404, { error: "Articulo no encontrado." });
      return;
    }

    sendJson(response, 200, post);
  } catch (error) {
    console.error("Blog post API error", error);
    sendJson(response, 500, { error: "No se pudo cargar el articulo." });
  }
}
