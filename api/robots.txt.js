import { sendText, toPublicSiteUrl } from "./_blog-shared.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.statusCode = 405;
    response.end("Metodo no permitido.");
    return;
  }

  const siteUrl = toPublicSiteUrl(request);
  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  sendText(response, 200, robots);
}
