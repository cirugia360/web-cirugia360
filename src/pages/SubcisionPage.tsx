import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleOff,
  Clock3,
  Dna,
  Droplets,
  HeartPulse,
  Layers3,
  MapPinned,
  MessageCircle,
  Scissors,
  Shirt,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  WandSparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ContactModalButton } from "@/components/ContactModalProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import useSubcisionSeo from "@/hooks/useSubcisionSeo";
import SectionHeading from "@/components/marcacion/SectionHeading";
import { faqItems, whatsappUrl } from "@/pages/subcisionData";

type IconCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Metric = {
  label: string;
  target: number;
  formatter: (value: number) => string;
};

const heroProof = [
  "+4.000 pacientes tratados",
  "80-90% eliminación de lesiones",
  "Recuperación en 4-5 días",
];

const painPoints: IconCard[] = [
  {
    icon: CircleOff,
    title: "Promesas sin cambio real",
    description: "Cremas, masajes y tratamientos que prometen mucho y no cambian nada.",
  },
  {
    icon: Shirt,
    title: "Evitas mostrar tu piel",
    description: "Evitas bikinis, shorts o ropa ajustada por la piel de naranja.",
  },
  {
    icon: Dna,
    title: "No es falta de disciplina",
    description: "No es falta de ejercicio ni de dieta: es estructural, hormonal y genético.",
  },
  {
    icon: Target,
    title: "La causa quedó intacta",
    description: "Tratamientos anteriores no atacaron el origen real del problema.",
  },
];

const solutionChecks = [
  "Marcación precisa en reposo y contracción",
  "Liberación de septos con micro bisturí Nokor",
  "Lipoinjerto autólogo para reducir recurrencia",
  "Retracción con BodyTite y Renuvion cuando se requiere",
];

const pillars = [
  {
    number: "01",
    icon: MapPinned,
    title: "Marcación Precisa",
    description:
      "Se identifican y marcan todas las lesiones retráctiles de piel de naranja en glúteos y muslos, tanto en reposo como en contracción muscular. Esta doble evaluación asegura una corrección integral que otros tratamientos pasan por alto.",
  },
  {
    number: "02",
    icon: Scissors,
    title: "Liberación con Nokor",
    description:
      "Con agujas de Nokor se cortan de forma controlada los septos fibrosos que tiran de la piel y crean los desniveles. Es mínimamente invasivo, se realiza en anestesia local con sedación y permite un control preciso de cada lesión.",
  },
  {
    number: "03",
    icon: Droplets,
    title: "Lipoinjerto + Retracción",
    description:
      "Se rellena con grasa autóloga para suavizar depresiones y neutralizar la memoria cutánea. Si hay laxitud en muslos internos o rodilla, se complementa con BodyTite y Renuvion para máxima firmeza y mínima recurrencia.",
  },
];

const results: IconCard[] = [
  {
    icon: Target,
    title: "80% eliminación de lesiones",
    description:
      "Con una sola sesión de subcisión, la mayoría de pacientes experimenta una reducción cercana al 80% de los desniveles durante el primer mes.",
  },
  {
    icon: Droplets,
    title: "Hasta 90% con lipoinjerto",
    description:
      "Cuando se combina con lipoinjerto autólogo, la tasa de mejora se eleva al 90%, con resultados más estables y duraderos.",
  },
  {
    icon: Clock3,
    title: "Recuperación en 4-5 días",
    description:
      "Reincorporación a la vida diaria y al ejercicio en pocos días. Procedimiento en anestesia local con sedación.",
  },
];

const metrics: Metric[] = [
  {
    label: "Pacientes tratados",
    target: 4000,
    formatter: (value) => `${value.toLocaleString("es-CL")}+`,
  },
  {
    label: "Años de experiencia",
    target: 20,
    formatter: (value) => `${value}+`,
  },
  {
    label: "Tasa de eliminación",
    target: 90,
    formatter: (value) => {
      if (value === 0) {
        return "0%";
      }

      return value < 80 ? `${value}%` : `80-${value}%`;
    },
  },
  {
    label: "Días de recuperación",
    target: 5,
    formatter: (value) => {
      if (value === 0) {
        return "0";
      }

      return value === 1 ? "1" : `${value - 1}-${value}`;
    },
  },
];

const technologyCards: IconCard[] = [
  {
    icon: Scissors,
    title: "Nokor",
    description:
      "Aguja con micro bisturí en la punta para subcisión controlada. Corta septos fibrosos con mínima invasión y máximo control.",
  },
  {
    icon: Layers3,
    title: "BodyTite",
    description:
      "Radiofrecuencia interna para retracción de piel. Trata laxitud y pseudocelulitis en muslos y rodilla para una firmeza superior.",
  },
  {
    icon: WandSparkles,
    title: "Renuvion",
    description:
      "Retracción de piel con plasma de helio. Complementa la subcisión para una compactación cutánea óptima sin incisiones extensas.",
  },
];

const awards = [
  "Mejor Cirujano Plástico Facial 2023 — AMWC World Congress, Mónaco",
  "Mejor Cirujano EACMFS 2010 — Brujas, Bélgica",
  "Premio Antiaging Medical Congress — Roma, 2015",
  "Premio Folador SIES — Boloña, Italia, 2015",
];

const memberships = [
  "Miembro de la Sociedad Americana de Cirugía Plástica",
  "Miembro de la Sociedad Europea de Cirugía Plástica Facial (EAFPS)",
  "Miembro de la Sociedad Italiana de Cirugía Plástica (AICPE)",
  "Miembro del Colegio Médico de Chile (RCM 40135-8)",
  "Miembro Honorario de SOCHIMCE",
];

const processSteps = [
  {
    title: "Valoración personalizada",
    description:
      "Evaluación del tipo de celulitis, tono de piel, laxitud y objetivos estéticos para definir el plan completo.",
    icon: Stethoscope,
  },
  {
    title: "Marcación de precisión",
    description:
      "Identificamos cada lesión en reposo y en contracción para no dejar ningún desnivel sin tratar.",
    icon: MapPinned,
  },
  {
    title: "Subcisión + Lipoinjerto",
    description:
      "Liberación de septos con Nokor en anestesia local, relleno autólogo y retracción si se requiere. Todo en una sesión.",
    icon: Scissors,
  },
  {
    title: "Recuperación rápida",
    description:
      "En 4-5 días retomas tu vida normal. Las mejoras visibles progresan con fuerza durante el primer mes.",
    icon: HeartPulse,
  },
];

const candidacyItems = [
  "Tienes piel de naranja pronunciada en glúteos o muslos",
  "Ya probaste cremas, masajes o tratamientos sin resultado real",
  "Quieres resultados visibles en una sola sesión",
  "Buscas una recuperación rápida para volver a tu rutina",
  "Quieres combinar tratamiento de celulitis con firmeza de piel",
];

const faqCtaText = "Agenda tu valoración para resolver todas tus dudas.";

const AnimatedMetric = ({ label, target, formatter }: Metric) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) {
      return;
    }

    let frame = 0;
    let startTime = 0;
    const duration = 1600;

    const tick = (time: number) => {
      if (!startTime) {
        startTime = time;
      }

      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="stat-number text-accent">{formatter(value)}</div>
      <p className="mt-3 text-sm text-background/68">{label}</p>
    </div>
  );
};

const SubcisionPage = () => {
  useSubcisionSeo();

  const isMobile = useIsMobile();
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setShowStickyCta(false);
      return;
    }

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      setShowStickyCta(currentScrollY > 320 && isScrollingDown);
      lastScrollY = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="bg-background pb-24 md:pb-0">
        <section className="relative isolate flex min-h-[96vh] items-center overflow-hidden pt-24">
          <div className="absolute inset-0">
            <picture>
              <source
                srcSet="/images/subcision/hero-768.webp 768w, /images/subcision/hero-1280.webp 1280w, /images/subcision/hero-1920.webp 1920w"
                sizes="100vw"
                type="image/webp"
              />
              <img
                src="/images/subcision/hero-1280.webp"
                alt="Tratamiento de celulitis con Subcision Magic — piel suave y uniforme en glúteos"
                className="h-full w-full object-cover object-[78%_center]"
                fetchPriority="high"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/88 to-foreground/42" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,122,123,0.22),transparent_38%)]" />
          </div>

          <div className="relative container-premium section-padding pt-24">
            <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="subtitle-premium mb-6 text-accent"
              >
                Tratamiento celulitis Chile
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="heading-display mb-6 max-w-2xl text-background"
              >
                Tratamiento de Celulitis en Chile — Subcision Magic con Liberación de Septos y Lipoinjerto
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="max-w-2xl text-lg leading-relaxed text-[#F9FAFB99]"
              >
                Elimina la piel de naranja desde la raíz. Resultados visibles en una sola sesión. +4.000
                pacientes tratados. Más de 20 años de experiencia.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.25 }}
                className="mt-10 flex flex-col items-start gap-5"
              >
                <ContactModalButton className="btn-premium px-10 py-4">
                  Agenda tu valoración
                </ContactModalButton>
                <div className="flex flex-wrap gap-3">
                  {heroProof.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-4 py-2 text-sm text-[#F9FAFB99] backdrop-blur-sm"
                    >
                      <CheckCircle2 size={16} className="text-accent" />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-background">
          <div className="container-premium">
            <ScrollReveal>
              <SectionHeading
                label="EL DESAFÍO"
                title="¿La celulitis te impide sentirte cómoda con tu cuerpo?"
                description="Si sientes que ya probaste de todo y sigues viendo la misma piel de naranja, no estás exagerando ni haciendo algo mal. El problema suele ser más profundo de lo que parece."
              />
            </ScrollReveal>
            <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {painPoints.map((item, index) => (
                <ScrollReveal key={item.title} delay={index * 0.06}>
                  <article className="card-premium h-full p-8 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="text-primary" size={24} />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-muted">
          <div className="container-premium">
            <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
              <ScrollReveal>
                <div>
                  <SectionHeading
                    label="¿POR QUÉ EXISTE LA CELULITIS?"
                    title="La celulitis no es grasa. Es un problema estructural bajo la piel."
                    centered={false}
                  />
                  <div className="mt-8 space-y-5 text-base leading-8 text-muted-foreground">
                    <p>
                      La celulitis se produce por septos fibrosos que tiran de la piel hacia abajo, creando
                      hoyuelos y desniveles. No es un problema de peso ni de falta de ejercicio: es anatómico
                      y multifactorial.
                    </p>
                    <p>
                      La genética, las hormonas, la elasticidad de la piel y la estructura del tejido
                      subcutáneo determinan su aparición. Por eso las cremas y los masajes no la eliminan: no
                      llegan a la causa.
                    </p>
                    <p>
                      Para tratar la celulitis de verdad, hay que liberar esos septos fibrosos y restaurar la
                      superficie de la piel desde adentro. Eso es exactamente lo que hace Subcision Magic.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.12}>
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
                  <img
                    src="/images/subcision/structure-illustration.svg"
                    alt="Septos fibrosos de la celulitis bajo la piel en glúteos y muslos"
                    className="w-full rounded-xl"
                    loading="lazy"
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="section-padding bg-background">
          <div className="container-premium">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <ScrollReveal>
                <div>
                  <SectionHeading
                    label="LA SOLUCIÓN"
                    title="Subcision Magic: Liberación de Septos + Lipoinjerto para Eliminar la Celulitis"
                    centered={false}
                  />
                  <div className="mt-8 space-y-5 text-base leading-8 text-muted-foreground">
                    <p>
                      Subcision Magic es un procedimiento exclusivo de Cirugía 360 que ataca la celulitis desde
                      su origen. Con agujas de Nokor se liberan los septos fibrosos que producen los hoyuelos y
                      desniveles en glúteos y muslos.
                    </p>
                    <p>
                      Tras la liberación, se realiza un lipoinjerto con grasa autóloga para rellenar las
                      depresiones y neutralizar la memoria cutánea, reduciendo la recurrencia entre un 10% y
                      20%.
                    </p>
                    <p>
                      Cuando hay laxitud o pseudocelulitis en interiores de muslo y rodilla, se complementa con
                      retracción mediante BodyTite y Renuvion para una piel más firme y uniforme.
                    </p>
                  </div>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {solutionChecks.map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4">
                        <CheckCircle2 className="mt-0.5 flex-shrink-0 text-primary" size={18} />
                        <p className="text-sm leading-6 text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.12}>
                <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
                  <picture>
                    <source
                      srcSet="/images/subcision/result-640.webp 640w, /images/subcision/result-1024.webp 1024w"
                      sizes="(min-width: 1024px) 42vw, 100vw"
                      type="image/webp"
                    />
                    <img
                      src="/images/subcision/result-1024.webp"
                      alt="Subcision Magic para eliminar celulitis en glúteos con mejora visible de la piel"
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  </picture>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="section-padding bg-muted">
          <div className="container-premium">
            <ScrollReveal>
              <SectionHeading
                label="TÉCNICA EXCLUSIVA"
                title="Los 3 pilares de Subcision Magic"
                description="La diferencia no está solo en tratar la celulitis, sino en cómo se aborda cada lesión para corregirla con precisión y estabilidad."
              />
            </ScrollReveal>
            <div className="mt-16 grid gap-6 lg:grid-cols-3">
              {pillars.map((pillar, index) => (
                <ScrollReveal key={pillar.title} delay={index * 0.08}>
                  <article className="card-premium flex h-full flex-col p-8">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-5xl leading-none text-primary/22">{pillar.number}</span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <pillar.icon className="text-primary" size={22} />
                      </div>
                    </div>
                    <h3 className="mt-8 font-serif text-2xl font-medium text-foreground">{pillar.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{pillar.description}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-background">
          <div className="container-premium">
            <ScrollReveal>
              <SectionHeading
                label="RESULTADOS REALES"
                title="Lo que puedes esperar de Subcision Magic"
                description="El objetivo no es camuflar la piel de naranja, sino reducir las lesiones reales y dejar una superficie más uniforme con una recuperación corta."
              />
            </ScrollReveal>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {results.map((item, index) => (
                <ScrollReveal key={item.title} delay={index * 0.08}>
                  <article className="card-premium h-full p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="text-primary" size={24} />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-medium text-foreground">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={0.12}>
              <div className="mt-12 text-center">
                <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
                  Los resultados progresan notablemente en el primer mes y se estabilizan con el plan de cuidado
                  posterior.
                </p>
                <ContactModalButton className="btn-premium mt-8 px-10 py-4">
                  Agenda tu valoración
                </ContactModalButton>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="section-padding bg-foreground">
          <div className="container-premium">
            <ScrollReveal>
              <SectionHeading
                label="EXPERIENCIA"
                title="Referente en tratamiento de celulitis en Latinoamérica"
                centered
                inverted
              />
            </ScrollReveal>
            <div className="mt-16 grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric, index) => (
                <ScrollReveal key={metric.label} delay={index * 0.08}>
                  <AnimatedMetric {...metric} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-background">
          <div className="container-premium">
            <ScrollReveal>
              <SectionHeading
                label="TECNOLOGÍA"
                title="Equipamiento de Última Generación"
                description="Cada herramienta cumple una función concreta dentro del protocolo: liberar, rellenar y retraer para mejorar textura y firmeza."
              />
            </ScrollReveal>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {technologyCards.map((item, index) => (
                <ScrollReveal key={item.title} delay={index * 0.08}>
                  <article className="card-premium h-full p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                      <item.icon className="text-primary" size={24} />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-medium text-foreground">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={0.12}>
              <p className="mx-auto mt-10 max-w-4xl text-center text-base leading-8 text-muted-foreground">
                Cirugía 360 es el único centro en Chile que combina subcisión con Nokor, lipoinjerto autólogo y
                retracción con BodyTite y Renuvion en un mismo protocolo para celulitis.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="section-padding bg-muted">
          <div className="container-premium">
            <div className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr]">
              <ScrollReveal>
                <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
                  <picture>
                    <source
                      srcSet="/images/subcision/doctor-640.webp 640w, /images/subcision/doctor-1024.webp 1024w"
                      sizes="(min-width: 1024px) 36vw, 100vw"
                      type="image/webp"
                    />
                    <img
                      src="/images/subcision/doctor-1024.webp"
                      alt="Dr. Sebastián Torres Farr, especialista en tratamiento de celulitis en Chile"
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  </picture>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.12}>
                <div>
                  <SectionHeading
                    label="TU ESPECIALISTA"
                    title="Dr. Sebastián Torres Farr — Más de 20 Años y 4.000 Pacientes en Tratamiento de Celulitis"
                    centered={false}
                  />
                  <div className="mt-8 space-y-5 text-base leading-8 text-muted-foreground">
                    <p>
                      El Dr. Sebastián Torres Farr es médico de la Pontificia Universidad Católica de Chile, con
                      especialización en Cirugía de Cabeza, Cuello y Maxilofacial en la Università degli Studi di
                      Messina, Master en Cirugía Estética en la Fondazione Fatebenefratelli y Master en Cirugía
                      Reconstructiva Mamaria en Humanitas Milano. Su título es válido en toda la Comunidad
                      Europea, Suiza, Mónaco y el Reino Unido.
                    </p>
                    <p>
                      Es uno de los referentes en Subcision Magic en Latinoamérica, con más de dos décadas de
                      experiencia en la técnica y más de 4.000 pacientes tratados con resultados estables y
                      naturales. Su enfoque integra marcación precisa, procedimientos mini invasivos y una
                      recuperación rápida con prioridad absoluta en seguridad.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {awards.map((item) => (
                      <article
                        key={item}
                        className="rounded-2xl border border-primary/25 bg-card p-5 shadow-[var(--shadow-card)]"
                      >
                        <div className="flex items-start gap-3">
                          <Trophy className="mt-0.5 flex-shrink-0 text-accent" size={18} />
                          <p className="text-sm leading-6 text-foreground">{item}</p>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6">
                    <h3 className="font-serif text-2xl font-medium text-foreground">Membresías</h3>
                    <div className="mt-5 grid gap-3">
                      {memberships.map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <BadgeCheck className="mt-0.5 flex-shrink-0 text-primary" size={18} />
                          <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="section-padding bg-background">
          <div className="container-premium">
            <ScrollReveal>
              <SectionHeading
                label="TU PROCESO"
                title="De la valoración al resultado en 4 pasos"
                description="Una secuencia clara reduce ansiedad, evita expectativas irreales y te permite entender exactamente cómo se trata tu tipo de celulitis."
              />
            </ScrollReveal>
            <div className="relative mt-16">
              <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-border lg:block" />
              <div className="grid gap-6 lg:grid-cols-4">
                {processSteps.map((step, index) => (
                  <ScrollReveal key={step.title} delay={index * 0.08}>
                    <article className="relative rounded-2xl border border-border/70 bg-card p-7 shadow-[var(--shadow-card)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                          {index + 1}
                        </div>
                        <step.icon className="text-primary" size={24} />
                      </div>
                      <h3 className="mt-6 font-serif text-2xl font-medium text-foreground">{step.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            </div>
            <ScrollReveal delay={0.12}>
              <div className="mt-12 text-center">
                <ContactModalButton className="btn-premium px-10 py-4">
                  Agenda tu primer paso
                </ContactModalButton>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="section-padding bg-muted">
          <div className="container-premium">
            <ScrollReveal>
              <SectionHeading label="¿ES PARA TI?" title="Subcision Magic es para ti si..." />
            </ScrollReveal>
            <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {candidacyItems.map((item, index) => (
                <ScrollReveal key={item} delay={index * 0.06}>
                  <ContactModalButton
                    className="card-premium flex h-full w-full flex-col items-start p-6 text-left"
                    aria-label={`Agendar valoración si ${item}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="text-primary" size={22} />
                    </div>
                    <h3 className="mt-5 font-serif text-xl font-medium text-foreground">{item}</h3>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                      Agendar valoración <ArrowRight size={14} />
                    </span>
                  </ContactModalButton>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-background">
          <div className="container-premium max-w-5xl">
            <ScrollReveal>
              <SectionHeading
                label="PREGUNTAS FRECUENTES"
                title="Todo lo que necesitas saber sobre el tratamiento de celulitis"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <div className="mt-16 rounded-2xl border border-border/70 bg-card px-6 py-2 shadow-[var(--shadow-card)] md:px-8">
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={item.question} value={`faq-${index}`} className="border-border/60">
                      <AccordionTrigger
                        className="py-6 text-left font-serif text-lg font-medium text-foreground hover:no-underline"
                        aria-label={`Expandir respuesta: ${item.question}`}
                      >
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <p className="text-base leading-8 text-muted-foreground">{item.answer}</p>
                        <ContactModalButton className="mt-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                          {faqCtaText}
                          <ArrowRight size={14} />
                        </ContactModalButton>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="section-padding bg-foreground">
          <div className="container-premium max-w-5xl text-center">
            <ScrollReveal>
              <p className="subtitle-premium text-accent">Cierre de valoración</p>
              <h2 className="heading-section mt-4 text-background">
                ¿Lista para una piel más suave y una silueta más definida?
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-background/72">
                Agenda tu valoración y descubre si Subcision Magic es el tratamiento adecuado para tu tipo de
                celulitis.
              </p>
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-accent">
                Cupos limitados · Valoraciones personalizadas
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
                <ContactModalButton className="inline-flex items-center justify-center rounded-sm border border-background/60 px-10 py-4 text-sm font-medium uppercase tracking-[0.18em] text-background transition-all duration-300 hover:bg-background hover:text-foreground">
                  Agendar valoración
                </ContactModalButton>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-background/80 transition-colors hover:text-background"
                >
                  <MessageCircle size={18} />
                  O escríbenos por WhatsApp
                </a>
              </div>
              <p className="mt-6 text-sm text-background/55">
                Sin compromiso · Valoración personalizada · Respuesta en menos de 24h
              </p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp a Cirugía 360"
        className="animate-soft-pulse fixed bottom-[5.5rem] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-premium)] transition-transform duration-300 hover:-translate-y-1 md:bottom-6 md:right-6"
      >
        <MessageCircle size={20} />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      <AnimatePresence>
        {showStickyCta ? (
          <motion.div
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/96 px-4 py-3 shadow-[0_-10px_30px_-20px_rgba(26,26,46,0.45)] backdrop-blur md:hidden"
          >
            <ContactModalButton className="btn-premium flex w-full items-center justify-center gap-2 px-6 py-4">
              Agendar valoración
              <ArrowRight size={16} />
            </ContactModalButton>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default SubcisionPage;
