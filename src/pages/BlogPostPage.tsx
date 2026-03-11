import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";
import useBlogSeo from "@/hooks/useBlogSeo";
import { fetchBlogPost } from "@/lib/blogApi";
import type { BlogPost } from "@/types/blog";
import { ArrowLeft, Calendar, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));

const BlogPostPage = () => {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useBlogSeo(post);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    fetchBlogPost(slug)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setPost(response);
      })
      .catch((fetchError: Error) => {
        if (!isMounted) {
          return;
        }

        setPost(null);
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
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 section-padding">
        <div className="container-premium">
          <div className="mx-auto max-w-5xl">
            <ScrollReveal>
              <div className="mb-10">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary"
                >
                  <ArrowLeft size={14} />
                  Volver al blog
                </Link>
              </div>
            </ScrollReveal>

            {isLoading ? (
              <section className="rounded-[2rem] border border-border/70 bg-card p-8 shadow-sm md:p-12">
                <p className="subtitle-premium mb-3">Cargando articulo</p>
                <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
                <div className="mt-6 h-5 w-full animate-pulse rounded bg-muted" />
                <div className="mt-3 h-5 w-5/6 animate-pulse rounded bg-muted" />
                <div className="mt-10 h-[420px] animate-pulse rounded-[2rem] bg-muted" />
              </section>
            ) : error || !post ? (
              <section className="rounded-[2rem] border border-border/70 bg-card p-8 shadow-sm md:p-12">
                <p className="subtitle-premium mb-3">Contenido no disponible</p>
                <h1 className="heading-section mb-4 text-foreground">No encontramos este articulo</h1>
                <p className="text-base leading-8 text-muted-foreground">
                  {error || "La URL solicitada no corresponde a un articulo publicado."}
                </p>
                <div className="mt-8">
                  <Link to="/blog" className="btn-premium">
                    Volver al blog
                  </Link>
                </div>
              </section>
            ) : (
              <>
                <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <ScrollReveal>
                    <div>
                      <p className="subtitle-premium mb-4">Articulo publicado</p>
                      <h1 className="heading-display mb-6 text-foreground">{post.title}</h1>
                      <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                        {post.metaDescription || post.excerpt}
                      </p>
                      <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Calendar size={16} />
                          {formatDate(post.publishedAt, post.languageCode)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={16} />
                          {post.readingTimeMinutes} min de lectura
                        </span>
                      </div>
                      {post.keywords.length > 0 ? (
                        <div className="mt-6 flex flex-wrap gap-3">
                          {post.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="rounded-full border border-border/70 bg-background px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </ScrollReveal>

                  {post.heroImage ? (
                    <ScrollReveal delay={0.08}>
                      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
                        <img
                          src={post.heroImage.url}
                          alt={post.heroImage.alt || post.title}
                          className="h-full w-full object-cover"
                          width={1600}
                          height={900}
                          loading="eager"
                        />
                      </div>
                    </ScrollReveal>
                  ) : null}
                </section>

                <ScrollReveal delay={0.1}>
                  <article className="mt-16 rounded-[2rem] border border-border/60 bg-card p-8 shadow-sm md:p-12">
                    <div
                      className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-8 prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground prose-img:rounded-3xl"
                      dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                    />
                  </article>
                </ScrollReveal>

                {post.infographicImage ? (
                  <ScrollReveal delay={0.12}>
                    <section className="mt-16">
                      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
                        <img
                          src={post.infographicImage.url}
                          alt={post.infographicImage.alt || `Infografia de ${post.title}`}
                          className="h-full w-full object-cover"
                          width={1600}
                          height={1600}
                          loading="lazy"
                        />
                      </div>
                    </section>
                  </ScrollReveal>
                ) : null}

                {post.faqSchema.length > 0 ? (
                  <ScrollReveal delay={0.14}>
                    <section className="mt-16 rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
                      <p className="subtitle-premium mb-3">Preguntas frecuentes</p>
                      <h2 className="heading-section mb-8 text-foreground">
                        Respuestas claras antes de decidir
                      </h2>
                      <div className="space-y-6">
                        {post.faqSchema.map((item) => (
                          <article
                            key={item.question}
                            className="border-b border-border/70 pb-6 last:border-b-0 last:pb-0"
                          >
                            <h3 className="font-serif text-2xl text-foreground">{item.question}</h3>
                            <p className="mt-3 text-base leading-8 text-muted-foreground">
                              {item.answer}
                            </p>
                          </article>
                        ))}
                      </div>
                    </section>
                  </ScrollReveal>
                ) : null}

                <ScrollReveal delay={0.16}>
                  <section className="mt-16 rounded-[2rem] bg-foreground px-8 py-10 text-background md:px-12">
                    <p className="subtitle-premium mb-3">Siguiente paso</p>
                    <h2 className="heading-section mb-4 text-background">
                      Agenda una evaluacion personalizada
                    </h2>
                    <p className="max-w-2xl text-base leading-8 text-background/75">
                      Si quieres saber si este procedimiento es adecuado para ti, el equipo del Dr.
                      Sebastian Torres puede evaluar tu caso y recomendar la mejor estrategia.
                    </p>
                    <div className="mt-8">
                      <Link to="/" className="btn-premium">
                        Solicitar valoracion
                      </Link>
                    </div>
                  </section>
                </ScrollReveal>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
