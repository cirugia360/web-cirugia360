import { sendText, toPublicSiteUrl } from "./_blog-shared.js";
import { getSitemapEntries } from "./_supabase.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.statusCode = 405;
    response.end("Metodo no permitido.");
    return;
  }

  const siteUrl = toPublicSiteUrl(request);

  try {
    const entries = await getSitemapEntries(siteUrl);
    const staticUrls = [
      `${siteUrl}/`,
      `${siteUrl}/blog`,
      `${siteUrl}/el-doctor`,
      `${siteUrl}/procedimientos`,
      `${siteUrl}/resultados`,
      `${siteUrl}/tecnologia`,
      `${siteUrl}/marcacion-nivel-dios`,
      `${siteUrl}/torres-rhinoplasty`,
      `${siteUrl}/subcision-magic`,
    ];
    const urls = [
      ...staticUrls.map((loc) => ({
        loc,
        lastmod: new Date().toISOString(),
      })),
      ...entries,
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    sendText(response, 200, xml, "application/xml; charset=utf-8");
  } catch (error) {
    console.error("Sitemap error", error);
    sendText(response, 500, "No se pudo construir el sitemap.");
  }
}
