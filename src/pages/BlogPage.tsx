import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";

const posts = [
  { title: "¿Qué es la marcación abdominal de alta definición?", excerpt: "Descubre cómo la liposucción de alta definición puede redefinir tu contorno corporal.", date: "15 Feb 2026", category: "Procedimientos" },
  { title: "Rinoplastía: mitos y realidades", excerpt: "Todo lo que necesitas saber antes de considerar una rinoplastía.", date: "10 Feb 2026", category: "Educación" },
  { title: "Tecnología Renuvion: revolución en retracción de piel", excerpt: "Cómo el plasma de helio está transformando los resultados quirúrgicos.", date: "5 Feb 2026", category: "Tecnología" },
  { title: "Recuperación después de una cirugía estética", excerpt: "Guía completa para una recuperación óptima y resultados duraderos.", date: "28 Ene 2026", category: "Cuidados" },
  { title: "Subcisión: la solución para la celulitis persistente", excerpt: "Conoce la técnica avanzada que está cambiando el tratamiento de la celulitis.", date: "20 Ene 2026", category: "Procedimientos" },
  { title: "Cómo elegir a tu cirujano plástico", excerpt: "Los factores clave que debes considerar al elegir un cirujano estético.", date: "15 Ene 2026", category: "Consejos" },
];

const BlogPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="subtitle-premium mb-4">Conocimiento</p>
              <h1 className="heading-display text-foreground mb-4">Blog</h1>
              <div className="divider-accent mx-auto mb-6" />
              <p className="text-muted-foreground max-w-xl mx-auto">Artículos educativos sobre cirugía estética, tecnología y cuidados.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <article className="card-premium p-8 h-full flex flex-col">
                  <span className="text-xs font-sans tracking-wider uppercase text-accent mb-3">{post.category}</span>
                  <h2 className="font-serif text-xl font-medium text-foreground mb-3">{post.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} /> {post.date}
                    </span>
                    <span className="text-xs font-sans font-medium text-primary flex items-center gap-1 cursor-pointer">
                      Leer <ArrowRight size={12} />
                    </span>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BlogPage;
