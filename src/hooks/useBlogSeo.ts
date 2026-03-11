import { useEffect } from "react";
import type { BlogPost } from "@/types/blog";

const upsertMetaTag = (
  head: HTMLHeadElement,
  selector: string,
  attributes: Record<string, string>,
  content: string,
  cleanups: Array<() => void>,
) => {
  let element = head.querySelector(selector) as HTMLMetaElement | null;

  if (element) {
    const previousContent = element.getAttribute("content");
    cleanups.push(() => {
      if (previousContent === null) {
        element.removeAttribute("content");
        return;
      }

      element.setAttribute("content", previousContent);
    });
  } else {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    head.appendChild(element);
    cleanups.push(() => element?.remove());
  }

  element.setAttribute("content", content);
};

const upsertLinkTag = (
  head: HTMLHeadElement,
  selector: string,
  attributes: Record<string, string>,
  href: string,
  cleanups: Array<() => void>,
) => {
  let element = head.querySelector(selector) as HTMLLinkElement | null;

  if (element) {
    const previousHref = element.getAttribute("href");
    cleanups.push(() => {
      if (previousHref === null) {
        element.removeAttribute("href");
        return;
      }

      element.setAttribute("href", previousHref);
    });
  } else {
    element = document.createElement("link");
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    head.appendChild(element);
    cleanups.push(() => element?.remove());
  }

  element.setAttribute("href", href);
};

const absoluteUrl = (url: string | null | undefined) => {
  if (!url) {
    return "";
  }

  return new URL(url, window.location.origin).toString();
};

const stripHtml = (value: string) =>
  value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const createSchema = (post: BlogPost) => {
  const imageUrl =
    absoluteUrl(post.heroImage?.url) ||
    absoluteUrl(post.infographicImage?.url) ||
    absoluteUrl("/opengraph-image.jpg");

  const graph: Array<Record<string, unknown>> = [
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
      keywords: post.metaKeywords || post.keywords.join(", "),
      author: {
        "@type": "Person",
        name: "Dr. Sebastian Torres Farr",
      },
      publisher: {
        "@type": "MedicalBusiness",
        name: "Cirugia360",
        url: "https://cirugia360.cl",
      },
      mainEntityOfPage: post.url,
    },
  ];

  if (post.faqSchema.length > 0) {
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

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
};

const useBlogSeo = (post: BlogPost | null) => {
  useEffect(() => {
    if (!post) {
      return;
    }

    const head = document.head;
    const cleanups: Array<() => void> = [];
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const imageUrl =
      absoluteUrl(post.heroImage?.url) ||
      absoluteUrl(post.infographicImage?.url) ||
      absoluteUrl("/opengraph-image.jpg");
    const title = `${post.title} | Blog Cirugia360`;
    const description = post.metaDescription || post.excerpt;

    document.title = title;
    document.documentElement.lang = post.languageCode || "es";

    upsertMetaTag(head, 'meta[name="description"]', { name: "description" }, description, cleanups);
    upsertMetaTag(
      head,
      'meta[name="keywords"]',
      { name: "keywords" },
      post.metaKeywords || post.keywords.join(", "),
      cleanups,
    );
    upsertMetaTag(head, 'meta[property="og:title"]', { property: "og:title" }, title, cleanups);
    upsertMetaTag(
      head,
      'meta[property="og:description"]',
      { property: "og:description" },
      description,
      cleanups,
    );
    upsertMetaTag(head, 'meta[property="og:type"]', { property: "og:type" }, "article", cleanups);
    upsertMetaTag(head, 'meta[property="og:url"]', { property: "og:url" }, post.url, cleanups);
    upsertMetaTag(head, 'meta[property="og:image"]', { property: "og:image" }, imageUrl, cleanups);
    upsertMetaTag(
      head,
      'meta[property="og:image:alt"]',
      { property: "og:image:alt" },
      post.heroImage?.alt || post.title,
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="article:published_time"]',
      { property: "article:published_time" },
      post.publishedAt,
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="article:modified_time"]',
      { property: "article:modified_time" },
      post.updatedAt,
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:card"]',
      { name: "twitter:card" },
      "summary_large_image",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:title"]',
      { name: "twitter:title" },
      title,
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      description,
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:image"]',
      { name: "twitter:image" },
      imageUrl,
      cleanups,
    );
    upsertLinkTag(head, 'link[rel="canonical"]', { rel: "canonical" }, post.url, cleanups);

    const schemaScript = document.createElement("script");
    schemaScript.type = "application/ld+json";
    schemaScript.id = "blog-post-schema";
    schemaScript.text = JSON.stringify(createSchema(post));
    head.appendChild(schemaScript);
    cleanups.push(() => schemaScript.remove());

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLang;
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, [post]);
};

export default useBlogSeo;
