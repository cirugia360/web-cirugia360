const SITE_NAME = "Cirugia360";
const SITE_DESCRIPTION =
  "Cirugia estetica de precision internacional con tecnologia avanzada y foco en resultados naturales.";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripHtml = (value = "") =>
  String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const absoluteUrl = (siteUrl, relativeOrAbsoluteUrl) => {
  if (!relativeOrAbsoluteUrl) {
    return "";
  }

  try {
    return new URL(relativeOrAbsoluteUrl, siteUrl).toString();
  } catch {
    return relativeOrAbsoluteUrl;
  }
};

const buildAssetTags = (assets) => {
  const styles = (assets?.styles || [])
    .map((href) => `<link rel="stylesheet" crossorigin href="${escapeHtml(href)}" />`)
    .join("\n");
  const scripts = (assets?.scripts || [])
    .map((src) => `<script type="module" crossorigin src="${escapeHtml(src)}"></script>`)
    .join("\n");

  return `${styles}\n${scripts}`.trim();
};

const buildSchema = (post, siteUrl) => {
  const imageUrl =
    absoluteUrl(siteUrl, post.heroImage?.url) ||
    absoluteUrl(siteUrl, post.infographicImage?.url) ||
    absoluteUrl(siteUrl, "/opengraph-image.jpg");

  const graph = [
    {
      "@type": "BlogPosting",
      "@id": `${post.url}#blogposting`,
      headline: post.title,
      description: post.metaDescription || post.excerpt || stripHtml(post.contentHtml),
      articleBody: stripHtml(post.contentHtml),
      url: post.url,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      inLanguage: post.languageCode || "es",
      image: imageUrl ? [imageUrl] : undefined,
      keywords: post.metaKeywords || post.keywords?.join(", "),
      author: {
        "@type": "Person",
        name: "Dr. Sebastian Torres Farr",
      },
      publisher: {
        "@type": "MedicalBusiness",
        name: SITE_NAME,
        url: siteUrl,
      },
      mainEntityOfPage: post.url,
    },
  ];

  if (Array.isArray(post.faqSchema) && post.faqSchema.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${post.url}#faq`,
      mainEntity: post.faqSchema.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
};

export const renderBlogPostHtml = ({ post, siteUrl, assets }) => {
  const title = `${post.title} | Blog ${SITE_NAME}`;
  const description = post.metaDescription || post.excerpt || SITE_DESCRIPTION;
  const imageUrl =
    absoluteUrl(siteUrl, post.heroImage?.url) ||
    absoluteUrl(siteUrl, post.infographicImage?.url) ||
    absoluteUrl(siteUrl, "/opengraph-image.jpg");
  const assetTags = buildAssetTags(assets);
  const heroImageMarkup = post.heroImage
    ? `
      <div class="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
        <img
          class="h-full w-full object-cover"
          src="${escapeHtml(post.heroImage.url)}"
          alt="${escapeHtml(post.heroImage.alt || post.title)}"
          loading="eager"
          width="1600"
          height="900"
        />
      </div>
    `
    : "";
  const infographicMarkup = post.infographicImage
    ? `
      <section class="mt-16">
        <div class="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
          <img
            class="h-full w-full object-cover"
            src="${escapeHtml(post.infographicImage.url)}"
            alt="${escapeHtml(post.infographicImage.alt || `Infografia de ${post.title}`)}"
            loading="lazy"
            width="1600"
            height="1600"
          />
        </div>
      </section>
    `
    : "";
  const faqMarkup =
    Array.isArray(post.faqSchema) && post.faqSchema.length > 0
      ? `
        <section class="mt-16 rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
          <p class="subtitle-premium mb-3">Preguntas frecuentes</p>
          <h2 class="heading-section mb-8 text-foreground">Respuestas claras antes de decidir</h2>
          <div class="space-y-6">
            ${post.faqSchema
              .map(
                (item) => `
                  <article class="border-b border-border/70 pb-6 last:border-b-0 last:pb-0">
                    <h3 class="font-serif text-2xl text-foreground">${escapeHtml(item.question)}</h3>
                    <p class="mt-3 text-base leading-8 text-muted-foreground">${escapeHtml(item.answer)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
      `
      : "";
  const keywordMarkup =
    Array.isArray(post.keywords) && post.keywords.length > 0
      ? `
        <div class="mt-6 flex flex-wrap gap-3">
          ${post.keywords
            .map(
              (keyword) =>
                `<span class="rounded-full border border-border/70 bg-background px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${escapeHtml(keyword)}</span>`,
            )
            .join("")}
        </div>
      `
      : "";

  return `<!doctype html>
<html lang="${escapeHtml(post.languageCode || "es")}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(post.metaKeywords || post.keywords?.join(", ") || "")}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(post.url)}" />
    <meta property="article:published_time" content="${escapeHtml(post.publishedAt)}" />
    <meta property="article:modified_time" content="${escapeHtml(post.updatedAt)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:alt" content="${escapeHtml(post.heroImage?.alt || post.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <link rel="canonical" href="${escapeHtml(post.url)}" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <script type="application/ld+json">${buildSchema(post, siteUrl)}</script>
    ${assetTags}
  </head>
  <body>
    <div id="root">
      <div class="min-h-screen bg-background">
        <header class="fixed left-0 right-0 top-0 z-50 bg-white shadow-sm">
          <nav class="container-premium flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
            <a href="/" class="flex items-center gap-2">
              <span class="font-serif text-2xl font-semibold tracking-tight text-foreground">
                Cirugia<span class="text-primary">360</span>
              </span>
            </a>
            <div class="hidden items-center gap-8 lg:flex">
              <a href="/" class="font-sans text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">Inicio</a>
              <a href="/el-doctor" class="font-sans text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">El Doctor</a>
              <a href="/procedimientos" class="font-sans text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">Procedimientos</a>
              <a href="/resultados" class="font-sans text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">Resultados</a>
              <a href="/tecnologia" class="font-sans text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">Tecnologia</a>
              <a href="/blog" class="font-sans text-xs uppercase tracking-widest text-primary">Blog</a>
            </div>
          </nav>
        </header>

        <main class="pt-32 section-padding">
          <div class="container-premium">
            <div class="mx-auto max-w-5xl">
              <div class="mb-10">
                <a href="/blog" class="subtitle-premium">Volver al blog</a>
              </div>

              <section class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <p class="subtitle-premium mb-4">Articulo publicado</p>
                  <h1 class="heading-display mb-6 text-foreground">${escapeHtml(post.title)}</h1>
                  <p class="max-w-2xl text-lg leading-8 text-muted-foreground">${escapeHtml(description)}</p>
                  <div class="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <span>Publicado ${escapeHtml(post.publishedAt)}</span>
                    <span>${escapeHtml(String(post.readingTimeMinutes || 1))} min de lectura</span>
                  </div>
                  ${keywordMarkup}
                </div>
                ${heroImageMarkup}
              </section>

              <article class="mt-16 rounded-[2rem] border border-border/60 bg-card p-8 shadow-sm md:p-12">
                <div class="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-8 prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground prose-img:rounded-3xl">
                  ${post.contentHtml}
                </div>
              </article>

              ${infographicMarkup}
              ${faqMarkup}
            </div>
          </div>
        </main>
      </div>
    </div>
  </body>
</html>`;
};

export const renderNotFoundHtml = ({ siteUrl, assets, title, description }) => {
  const assetTags = buildAssetTags(assets);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="${escapeHtml(siteUrl)}" />
    ${assetTags}
  </head>
  <body>
    <div id="root">
      <main class="min-h-screen bg-background px-6 py-24">
        <div class="mx-auto max-w-3xl rounded-[2rem] border border-border/70 bg-card p-12 text-center shadow-sm">
          <p class="subtitle-premium mb-4">Contenido no disponible</p>
          <h1 class="heading-display mb-4 text-foreground">${escapeHtml(title)}</h1>
          <p class="text-lg leading-8 text-muted-foreground">${escapeHtml(description)}</p>
          <div class="mt-8">
            <a href="/blog" class="btn-premium">Volver al blog</a>
          </div>
        </div>
      </main>
    </div>
  </body>
</html>`;
};
