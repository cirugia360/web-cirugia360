import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";

const assetMimeTypes = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const mimeExtensions = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
};

const stripHtml = (value) =>
  String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const stripLeadingHeading = (html, title = "") => {
  if (!html) {
    return "";
  }

  const trimmed = String(html).trimStart();

  if (!title) {
    return trimmed.replace(/^<h1\b[^>]*>[\s\S]*?<\/h1>/i, "").trimStart();
  }

  const normalizedTitle = stripHtml(title);
  const headingMatch = trimmed.match(/^<h1\b[^>]*>([\s\S]*?)<\/h1>/i);

  if (!headingMatch) {
    return trimmed;
  }

  const headingText = stripHtml(headingMatch[1]);
  const expected = new RegExp(`^${escapeRegExp(normalizedTitle)}$`, "i");

  return expected.test(headingText)
    ? trimmed.replace(/^<h1\b[^>]*>[\s\S]*?<\/h1>/i, "").trimStart()
    : trimmed;
};

export const createExcerpt = (html, fallbackDescription = "") => {
  const plainText = stripHtml(html);
  const baseText = String(fallbackDescription || "").trim() || plainText;

  if (!baseText) {
    return "";
  }

  return baseText.length <= 180 ? baseText : `${baseText.slice(0, 177).trimEnd()}...`;
};

export const estimateReadingTimeMinutes = (html) => {
  const words = stripHtml(html)
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
};

export const slugify = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export const ensureUniqueSlug = (requestedSlug, posts, currentArticleId) => {
  const baseSlug = slugify(requestedSlug) || `articulo-${currentArticleId}`;
  let candidate = baseSlug;
  let suffix = 2;

  while (
    posts.some(
      (post) => post.slug === candidate && Number(post.auto_seo_id) !== Number(currentArticleId),
    )
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

export const normalizeFaqSchema = (faqSchema) => {
  if (!Array.isArray(faqSchema)) {
    return [];
  }

  return faqSchema
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      question: String(item.question || "").trim(),
      answer: String(item.answer || "").trim(),
    }))
    .filter((item) => item.question && item.answer);
};

export const normalizeIsoDate = (value, fallbackValue) => {
  const candidate = value || fallbackValue || new Date().toISOString();
  const date = new Date(candidate);

  return Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString();
};

export const verifyAutoSeoSignature = (rawBody, signature, secret) => {
  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = String(signature).trim().toLowerCase();

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(expected, "utf8"));
};

export const toPublicSiteUrl = (request) => {
  const configured = process.env.PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const forwardedProto =
    request.headers["x-forwarded-proto"] || request.headers["x-vercel-forwarded-proto"];
  const host =
    request.headers["x-forwarded-host"] || request.headers.host || "localhost:3000";
  const protocol =
    typeof forwardedProto === "string" && forwardedProto
      ? forwardedProto.split(",")[0]
      : "https";

  return `${protocol}://${host}`;
};

export const parseRawBody = async (request) => {
  let body = "";

  for await (const chunk of request) {
    body += chunk;

    if (body.length > 15 * 1024 * 1024) {
      throw new Error("Payload demasiado grande.");
    }
  }

  return body;
};

export const sendJson = (response, statusCode, payload) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const sendHtml = (response, statusCode, html) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.end(html);
};

export const sendText = (response, statusCode, text, contentType = "text/plain; charset=utf-8") => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", contentType);
  response.end(text);
};

const inferContentTypeFromPath = (sourceUrl) => {
  try {
    const url = new URL(sourceUrl);
    const extension = path.extname(url.pathname).toLowerCase();

    return assetMimeTypes[extension] || "image/jpeg";
  } catch {
    return "image/jpeg";
  }
};

export const downloadRemoteAsset = async (sourceUrl) => {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`No se pudo descargar el recurso (${response.status}).`);
  }

  const contentType =
    String(response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase() || inferContentTypeFromPath(sourceUrl);

  return {
    contentType,
    buffer: Buffer.from(await response.arrayBuffer()),
  };
};

export const getAssetExtension = (contentType, sourceUrl) => {
  const cleanType = String(contentType || "").split(";")[0].trim().toLowerCase();

  if (cleanType && mimeExtensions[cleanType]) {
    return mimeExtensions[cleanType];
  }

  try {
    const url = new URL(sourceUrl);
    const sourceExtension = path.extname(url.pathname).toLowerCase();

    if (sourceExtension && assetMimeTypes[sourceExtension]) {
      return sourceExtension;
    }
  } catch {
    return "";
  }

  return "";
};

export const buildStoragePath = (autoSeoId, role, extension = "") =>
  `articles/${autoSeoId}/${role}${extension}`;
