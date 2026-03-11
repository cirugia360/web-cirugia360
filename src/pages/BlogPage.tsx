import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";
import { fetchBlogPosts } from "@/lib/blogApi";
import type { BlogListItem } from "@/types/blog";
import { ArrowRight, Calendar, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const getLocale = (languageCode: string) => {
  if (languageCode.startsWith("en")) {
    return "en-US";
  }

  if (languageCode.startsWith("de")) {
    return "de-DE";
  }

  return "es-CL";
};

const formatDate = (dateValue: string, languageCode: string) =>
  new Intl.DateTimeFormat(getLocale(languageCode), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

const getCategory = (post: BlogListItem) => post.keywords[0] || "Blog";

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBlogPosts()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setPosts(response);
      })
      .catch((fetchError: Error) => {
        if (!isMounted) {
          return;
        }

        setPosts([]);
        setError(fetchError.message);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="subtitle-premium mb-4">Conocimiento</p>
              <h1 className="heading-display mb-4 text-foreground">Blog</h1>
              <div className="divider-accent mx-auto mb-6" />
              <p className="text-muted-foreground">
                Articulos educativos sobre cirugia estetica, tecnologia, recuperacion y decisiones
                clinicas informadas.
              </p>
            </div>
          </ScrollReveal>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="card-premium overflow-hidden p-0"
                >
                  <div className="h-56 animate-pulse bg-muted" />
                  <div className="p-8">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-8 w-5/6 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-muted" />
                    <div className="mt-8 h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="card-premium p-10 text-center">
              <p className="subtitle-premium mb-3">Error de carga</p>
              <h2 className="heading-section mb-4 text-foreground">No pudimos cargar el blog</h2>
              <p className="mx-auto max-w-2xl text-base leading-8 text-muted-foreground">
                {error}
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="card-premium p-10 text-center">
              <p className="subtitle-premium mb-3">Sin articulos</p>
              <h2 className="heading-section mb-4 text-foreground">
                Todavia no hay publicaciones automatizadas
              </h2>
              <p className="mx-auto max-w-2xl text-base leading-8 text-muted-foreground">
                Cuando AutoSEO publique el primer articulo, aparecera automaticamente aqui con su
                pagina individual y sus metadatos SEO.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <ScrollReveal key={post.slug} delay={index * 0.05}>
                  <article className="card-premium flex h-full flex-col overflow-hidden p-0">
                    {post.heroImage ? (
                      <Link to={`/blog/${post.slug}`} className="block overflow-hidden">
                        <img
                          src={post.heroImage.url}
                          alt={post.heroImage.alt || post.title}
                          className="h-56 w-full object-cover transition-transform duration-500 hover:scale-105"
                          width={1200}
                          height={800}
                          loading="lazy"
                        />
                      </Link>
                    ) : (
                      <div className="h-56 bg-muted" />
                    )}

                    <div className="flex flex-1 flex-col p-8">
                      <span className="mb-3 text-xs font-sans uppercase tracking-wider text-accent">
                        {getCategory(post)}
                      </span>
                      <h2 className="mb-3 font-serif text-2xl font-medium text-foreground">
                        <Link to={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
                          {post.title}
                        </Link>
                      </h2>
                      <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>

                      <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(post.publishedAt, post.languageCode)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} />
                          {post.readingTimeMinutes} min
                        </span>
                      </div>

                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary"
                      >
                        Leer articulo
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BlogPage;
