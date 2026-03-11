import { sendHtml, toPublicSiteUrl } from "./_blog-shared.js";
import { renderBlogPostHtml, renderNotFoundHtml } from "./_html-template.js";
import { getPostBySlug } from "./_supabase.js";
import { readClientAssets } from "./_vite-assets.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.statusCode = 405;
    response.end("Metodo no permitido.");
    return;
  }

  const rawSlug = request.query?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const siteUrl = toPublicSiteUrl(request);
  const assets = await readClientAssets();

  if (!slug) {
    const html = renderNotFoundHtml({
      assets,
      description: "La URL solicitada no corresponde a un articulo publicado.",
      siteUrl,
      title: "Articulo no encontrado",
    });
    sendHtml(response, 404, html);
    return;
  }

  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      const html = renderNotFoundHtml({
        assets,
        description: "La URL solicitada no corresponde a un articulo publicado.",
        siteUrl,
        title: "Articulo no encontrado",
      });
      sendHtml(response, 404, html);
      return;
    }

    const html = renderBlogPostHtml({ post, siteUrl, assets });
    sendHtml(response, 200, html);
  } catch (error) {
    console.error("Blog page render error", error);
    const html = renderNotFoundHtml({
      assets,
      description: "No se pudo cargar el articulo solicitado.",
      siteUrl,
      title: "Error al cargar el articulo",
    });
    sendHtml(response, 500, html);
  }
}
