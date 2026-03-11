import {
  parseRawBody,
  sendJson,
  toPublicSiteUrl,
  verifyAutoSeoSignature,
} from "../_blog-shared.js";
import { upsertAutoSeoArticle } from "../_supabase.js";

const requiredFields = ["id", "title", "slug", "metaDescription", "content_html"];

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Metodo no permitido." });
    return;
  }

  const authorizationHeader = request.headers.authorization || "";
  const expectedBearerToken = process.env.AUTOSEO_BEARER_TOKEN?.trim();

  if (expectedBearerToken) {
    const receivedToken = authorizationHeader.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length).trim()
      : "";

    if (!receivedToken || receivedToken !== expectedBearerToken) {
      sendJson(response, 401, { error: "Bearer token invalido." });
      return;
    }
  }

  let rawBody = "";

  try {
    rawBody = await parseRawBody(request);
  } catch (error) {
    sendJson(response, 413, { error: error.message || "Payload invalido." });
    return;
  }

  const signatureSecret = process.env.AUTOSEO_SIGNATURE_SECRET?.trim();
  const signatureHeader = request.headers["x-autoseo-signature"];
  const hasSignatureHeader =
    typeof signatureHeader === "string" && signatureHeader.trim().length > 0;

  if (
    signatureSecret &&
    hasSignatureHeader &&
    !verifyAutoSeoSignature(
      rawBody,
      signatureHeader,
      signatureSecret,
    )
  ) {
    sendJson(response, 401, { error: "Firma HMAC invalida." });
    return;
  }

  let payload;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    sendJson(response, 400, { error: "JSON invalido." });
    return;
  }

  const siteUrl = toPublicSiteUrl(request);

  if (payload?.event === "test") {
    sendJson(response, 200, { url: `${siteUrl}/test` });
    return;
  }

  if (payload?.event !== "article.published") {
    sendJson(response, 400, { error: "Evento no soportado." });
    return;
  }

  const missingField = requiredFields.find(
    (field) => payload[field] === undefined || payload[field] === null,
  );

  if (missingField) {
    sendJson(response, 400, { error: `Falta el campo requerido: ${missingField}.` });
    return;
  }

  try {
    const post = await upsertAutoSeoArticle(payload, siteUrl);
    sendJson(response, 200, { url: post.url });
  } catch (error) {
    console.error("AutoSEO webhook error", error);
    sendJson(response, 500, { error: "No se pudo publicar el articulo." });
  }
}
