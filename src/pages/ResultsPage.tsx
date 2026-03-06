import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ContactModalButton } from "@/components/ContactModalProvider";

const categories = ["Todos", "Rinoplastía", "Marcación Abdominal", "Celulitis"];

const results = [
  { category: "Rinoplastía", desc: "Rinoplastía armónica — resultado a 6 meses" },
  { category: "Rinoplastía", desc: "Corrección funcional y estética" },
  { category: "Marcación Abdominal", desc: "Marcación de alta definición" },
  { category: "Marcación Abdominal", desc: "Contorno corporal masculino" },
  { category: "Celulitis", desc: "Subcisión avanzada — resultado a 3 meses" },
  { category: "Celulitis", desc: "Tratamiento integral de celulitis" },
];

const ResultsPage = () => {
  const [active, setActive] = useState("Todos");
  const filtered = active === "Todos" ? results : results.filter(r => r.category === active);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="subtitle-premium mb-4">Galería</p>
              <h1 className="heading-display text-foreground mb-4">Resultados</h1>
              <div className="divider-accent mx-auto mb-6" />
              <p className="text-muted-foreground max-w-xl mx-auto">Resultados reales de nuestros pacientes. Cada caso es único y personalizado.</p>
            </div>
          </ScrollReveal>

          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-6 py-2 rounded-sm text-xs font-sans tracking-wider uppercase transition-all duration-300 ${
                  active === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((result, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="card-premium overflow-hidden">
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="w-24 h-32 bg-primary/5 rounded-sm flex items-center justify-center text-xs text-muted-foreground border border-border">Antes</div>
                        <div className="text-muted-foreground">→</div>
                        <div className="w-24 h-32 bg-primary/10 rounded-sm flex items-center justify-center text-xs text-primary border border-primary/20">Después</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-sans tracking-wider uppercase text-accent">{result.category}</span>
                    <p className="text-sm text-foreground mt-2">{result.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center mt-16">
              <ContactModalButton className="btn-premium">Agendar Evaluación</ContactModalButton>
            </div>
          </ScrollReveal>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ResultsPage;
