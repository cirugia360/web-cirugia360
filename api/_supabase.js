import { createClient } from "@supabase/supabase-js";
import {
  buildStoragePath,
  createExcerpt,
  downloadRemoteAsset,
  ensureUniqueSlug,
  estimateReadingTimeMinutes,
  getAssetExtension,
  normalizeFaqSchema,
  normalizeIsoDate,
  stripLeadingHeading,
} from "./_blog-shared.js";

const tableName = process.env.SUPABASE_BLOG_TABLE || "blog_articles";
const bucketName = process.env.SUPABASE_BLOG_BUCKET || "blog-media";

const getAdminClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const mapImage = (url, alt) => (url ? { url, alt: alt || "" } : null);

const mapRowToPost = (row) => ({
  autoSeoId: row.auto_seo_id,
  title: row.title,
  slug: row.slug,
  url: row.url,
  metaDescription: row.meta_description,
  excerpt: row.excerpt,
  contentHtml: row.content_html,
  contentMarkdown: row.content_markdown,
  heroImage: mapImage(row.hero_image_url, row.hero_image_alt || row.title),
  infographicImage: mapImage(
    row.infographic_image_url,
    row.infographic_image_alt || `Infografia de ${row.title}`,
  ),
  keywords: Array.isArray(row.keywords) ? row.keywords : [],
  metaKeywords: row.meta_keywords,
  faqSchema: Array.isArray(row.faq_schema) ? row.faq_schema : [],
  languageCode: row.language_code,
  status: row.status,
  publishedAt: row.published_at,
  updatedAt: row.updated_at,
  createdAt: row.created_at,
  readingTimeMinutes: row.reading_time_minutes,
  updatedOnSiteAt: row.updated_on_site_at,
  createdOnSiteAt: row.created_on_site_at,
});

const getPublicImageUrl = (client, storagePath) => {
  if (!storagePath) {
    return null;
  }

  const { data } = client.storage.from(bucketName).getPublicUrl(storagePath);
  return data.publicUrl;
};

const uploadArticleAsset = async (client, sourceUrl, autoSeoId, role) => {
  if (!sourceUrl) {
    return null;
  }

  const { buffer, contentType } = await downloadRemoteAsset(sourceUrl);
  const extension = getAssetExtension(contentType, sourceUrl);
  const storagePath = buildStoragePath(autoSeoId, role, extension);
  const { error } = await client.storage.from(bucketName).upload(storagePath, buffer, {
    cacheControl: "31536000",
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`No se pudo subir ${role} a Supabase Storage.`);
  }

  return {
    publicUrl: getPublicImageUrl(client, storagePath),
    storagePath,
  };
};

const listExistingSlugs = async (client) => {
  const { data, error } = await client.from(tableName).select("slug, auto_seo_id");

  if (error) {
    throw new Error("No se pudo consultar los slugs existentes.");
  }

  return data || [];
};

const getArticleByAutoSeoId = async (client, autoSeoId) => {
  const { data, error } = await client
    .from(tableName)
    .select("*")
    .eq("auto_seo_id", Number(autoSeoId))
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo consultar el articulo existente.");
  }

  return data;
};

export const listPostSummaries = async () => {
  const client = getAdminClient();
  const { data, error } = await client
    .from(tableName)
    .select(
      "auto_seo_id,title,slug,url,meta_description,excerpt,hero_image_url,hero_image_alt,infographic_image_url,infographic_image_alt,keywords,meta_keywords,language_code,status,published_at,updated_at,reading_time_minutes",
    )
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error("No se pudo cargar el listado del blog.");
  }

  return (data || []).map(mapRowToPost);
};

export const getPostBySlug = async (slug) => {
  const client = getAdminClient();
  const { data, error } = await client
    .from(tableName)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar el articulo.");
  }

  return data ? mapRowToPost(data) : null;
};

export const getSitemapEntries = async (siteUrl) => {
  const client = getAdminClient();
  const { data, error } = await client
    .from(tableName)
    .select("slug,url,updated_at,published_at,created_at")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error("No se pudo construir el sitemap.");
  }

  return (data || []).map((row) => ({
    loc: row.url || `${siteUrl}/blog/${row.slug}`,
    lastmod: row.updated_at || row.published_at || row.created_at,
  }));
};

export const upsertAutoSeoArticle = async (payload, siteUrl) => {
  const client = getAdminClient();
  const currentArticle = await getArticleByAutoSeoId(client, payload.id);
  const existingSlugs = await listExistingSlugs(client);
  const slug = ensureUniqueSlug(payload.slug || payload.title, existingSlugs, payload.id);
  const heroAsset = payload.heroImageUrl
    ? await uploadArticleAsset(client, payload.heroImageUrl, payload.id, "hero")
    : null;
  const infographicAsset = payload.infographicImageUrl
    ? await uploadArticleAsset(client, payload.infographicImageUrl, payload.id, "infographic")
    : null;
  const publishedAt = normalizeIsoDate(payload.publishedAt, payload.createdAt);
  const createdAt = normalizeIsoDate(payload.createdAt, currentArticle?.created_at || publishedAt);
  const updatedAt = normalizeIsoDate(payload.updatedAt, payload.publishedAt || createdAt);
  const contentHtml = stripLeadingHeading(String(payload.content_html || ""), payload.title);
  const metaDescription = String(payload.metaDescription || "").trim();
  const now = new Date().toISOString();

  const row = {
    auto_seo_id: Number(payload.id),
    title: String(payload.title || "").trim(),
    slug,
    url: `${siteUrl}/blog/${slug}`,
    meta_description: metaDescription,
    excerpt: createExcerpt(contentHtml, metaDescription),
    content_html: contentHtml,
    content_markdown: String(payload.content_markdown || "").trim(),
    hero_image_url: heroAsset?.publicUrl || currentArticle?.hero_image_url || null,
    hero_image_alt:
      String(payload.heroImageAlt || currentArticle?.hero_image_alt || payload.title || "").trim() ||
      null,
    infographic_image_url:
      infographicAsset?.publicUrl || currentArticle?.infographic_image_url || null,
    infographic_image_alt:
      currentArticle?.infographic_image_alt ||
      `Infografia de ${String(payload.title || "").trim()}` ||
      null,
    keywords: Array.isArray(payload.keywords)
      ? payload.keywords.map((keyword) => String(keyword).trim()).filter(Boolean)
      : [],
    meta_keywords: String(payload.metaKeywords || "").trim() || null,
    faq_schema: normalizeFaqSchema(payload.faqSchema),
    language_code: String(payload.languageCode || "es").trim() || "es",
    status: String(payload.status || "published").trim() || "published",
    published_at: publishedAt,
    updated_at: updatedAt,
    created_at: createdAt,
    reading_time_minutes: estimateReadingTimeMinutes(contentHtml),
    updated_on_site_at: now,
    created_on_site_at: currentArticle?.created_on_site_at || now,
  };

  const { data, error } = await client
    .from(tableName)
    .upsert(row, { onConflict: "auto_seo_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error("No se pudo guardar el articulo en Supabase.");
  }

  return mapRowToPost(data);
};
