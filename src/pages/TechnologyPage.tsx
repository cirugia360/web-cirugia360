import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Zap, Target, Shield, CheckCircle } from "lucide-react";
import { ContactModalButton } from "@/components/ContactModalProvider";
import technology from "@/assets/technology.jpg";
import operatingRoom from "@/assets/operating-room.jpg";

const techs = [
  {
    name: "Renuvion",
    subtitle: "Plasma de Helio + Radiofrecuencia",
    desc: "Tecnología que combina plasma de helio con energía de radiofrecuencia para lograr una retracción de piel sin precedentes. Permite resultados superiores en contorno corporal con mínima invasividad.",
    benefits: ["Retracción de piel superior", "Recuperación más rápida", "Resultados inmediatos y progresivos", "Mayor seguridad"],
    icon: Zap,
    image: technology,
  },
  {
    name: "Bodytite",
    subtitle: "Radiofrecuencia Interna",
    desc: "Sistema de radiofrecuencia asistida que permite remodelar el contorno corporal con precisión milimétrica, logrando resultados que antes solo eran posibles con cirugía abierta.",
    benefits: ["Contorno corporal de alta definición", "Retracción cutánea controlada", "Procedimiento mínimamente invasivo", "Resultados naturales"],
    icon: Target,
    image: operatingRoom,
  },
  {
    name: "Ugraft",
    subtitle: "Tecnología Avanzada de Injerto",
    desc: "Sistema de última generación para procedimientos de injerto con máxima precisión, minimizando el trauma tisular y optimizando los resultados estéticos.",
    benefits: ["Mayor precisión", "Mínimo trauma tisular", "Resultados más naturales", "Recuperación acelerada"],
    icon: Shield,
    image: technology,
  },
];

const TechnologyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="subtitle-premium mb-4">Innovación Médica</p>
              <h1 className="heading-display text-foreground mb-4">Tecnología de Vanguardia</h1>
              <div className="divider-accent mx-auto mb-6" />
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Utilizamos las tecnologías más avanzadas del mundo para garantizar mayor precisión, mejor retracción de piel y máxima seguridad en cada procedimiento.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-24">
            {techs.map((tech, i) => (
              <ScrollReveal key={i}>
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${i % 2 === 1 ? "lg:direction-rtl" : ""}`}>
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mb-6">
                      <tech.icon className="text-primary" size={24} />
                    </div>
                    <h2 className="font-serif text-3xl font-medium text-foreground mb-2">{tech.name}</h2>
                    <p className="text-sm text-accent font-sans tracking-wider uppercase mb-6">{tech.subtitle}</p>
                    <p className="text-muted-foreground leading-relaxed mb-8">{tech.desc}</p>
                    <div className="space-y-3">
                      {tech.benefits.map((b, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <CheckCircle className="text-primary flex-shrink-0" size={16} />
                          <p className="text-sm text-foreground">{b}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden">
                      <img src={tech.image} alt={tech.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center mt-20">
              <ContactModalButton className="btn-premium">Agendar Evaluación</ContactModalButton>
            </div>
          </ScrollReveal>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default TechnologyPage;
