import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Zap, Target, Shield, CheckCircle } from "lucide-react";
import { ContactModalButton } from "@/components/ContactModalProvider";

const renuvionImage = "/images/renuvion.jpg";
const bodytiteImage = "/images/Bodytite.webp";
const ugraftImage = "/images/ugraft.jpg";

const techs = [
  {
    name: "Renuvion",
    subtitle: "Plasma de Helio + Radiofrecuencia",
    desc: "Tecnologia que combina plasma de helio con energia de radiofrecuencia para lograr una retraccion de piel sin precedentes. Permite resultados superiores en contorno corporal con minima invasividad.",
    benefits: [
      "Retraccion de piel superior",
      "Recuperacion mas rapida",
      "Resultados inmediatos y progresivos",
      "Mayor seguridad",
    ],
    icon: Zap,
    image: renuvionImage,
    imageFit: "contain",
  },
  {
    name: "Bodytite",
    subtitle: "Radiofrecuencia Interna",
    desc: "Sistema de radiofrecuencia asistida que permite remodelar el contorno corporal con precision milimetrica, logrando resultados que antes solo eran posibles con cirugia abierta.",
    benefits: [
      "Contorno corporal de alta definicion",
      "Retraccion cutanea controlada",
      "Procedimiento minimamente invasivo",
      "Resultados naturales",
    ],
    icon: Target,
    image: bodytiteImage,
    imageFit: "contain",
  },
  {
    name: "Ugraft",
    subtitle: "Tecnologia Avanzada de Injerto",
    desc: "Sistema de ultima generacion para procedimientos de injerto con maxima precision, minimizando el trauma tisular y optimizando los resultados esteticos.",
    benefits: [
      "Mayor precision",
      "Minimo trauma tisular",
      "Resultados mas naturales",
      "Recuperacion acelerada",
    ],
    icon: Shield,
    image: ugraftImage,
    imageFit: "contain",
  },
];

const TechnologyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="mb-20 text-center">
              <p className="subtitle-premium mb-4">Innovacion medica</p>
              <h1 className="heading-display mb-4 text-foreground">Tecnologia de vanguardia</h1>
              <div className="divider-accent mx-auto mb-6" />
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Utilizamos las tecnologias mas avanzadas del mundo para garantizar mayor precision,
                mejor retraccion de piel y maxima seguridad en cada procedimiento.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-24">
            {techs.map((tech, i) => (
              <ScrollReveal key={tech.name}>
                <div
                  className={`grid grid-cols-1 items-center gap-16 lg:grid-cols-2 ${
                    i % 2 === 1 ? "lg:direction-rtl" : ""
                  }`}
                >
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10">
                      <tech.icon className="text-primary" size={24} />
                    </div>
                    <h2 className="mb-2 font-serif text-3xl font-medium text-foreground">
                      {tech.name}
                    </h2>
                    <p className="mb-6 font-sans text-sm uppercase tracking-wider text-accent">
                      {tech.subtitle}
                    </p>
                    <p className="mb-8 leading-relaxed text-muted-foreground">{tech.desc}</p>
                    <div className="space-y-3">
                      {tech.benefits.map((benefit) => (
                        <div key={benefit} className="flex items-center gap-3">
                          <CheckCircle className="shrink-0 text-primary" size={16} />
                          <p className="text-sm text-foreground">{benefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted/40">
                      <img
                        src={tech.image}
                        alt={tech.name}
                        className={`h-full w-full ${
                          tech.imageFit === "contain" ? "object-contain p-6" : "object-cover"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="mt-20 text-center">
              <ContactModalButton className="btn-premium">Agendar evaluacion</ContactModalButton>
            </div>
          </ScrollReveal>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default TechnologyPage;
