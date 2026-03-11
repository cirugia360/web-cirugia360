import type { BlogListItem, BlogPost } from "@/types/blog";

const apiBaseUrl = (import.meta.env.VITE_BLOG_API_BASE_URL || "").replace(/\/$/, "");

const buildApiUrl = (pathname: string) => `${apiBaseUrl}${pathname}`;

const readJson = async <T>(pathname: string): Promise<T> => {
  const response = await fetch(buildApiUrl(pathname), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      typeof payload?.error === "string" ? payload.error : "No se pudo cargar el contenido.";

    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export const fetchBlogPosts = async () => {
  const payload = await readJson<{ items: BlogListItem[] }>("/api/blog-posts");
  return payload.items;
};

export const fetchBlogPost = async (slug: string) =>
  readJson<BlogPost>(`/api/blog-post?slug=${encodeURIComponent(slug)}`);
