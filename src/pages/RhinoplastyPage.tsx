import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronRight, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Counter from "@/components/Counter";
import { ContactModalButton } from "@/components/ContactModalProvider";
import SectionHeading from "@/components/marcacion/SectionHeading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import useRhinoplastySeo from "@/hooks/useRhinoplastySeo";
import {
  challengeItems,
  defaultWhatsappMessage,
  doctorAwards,
  doctorMemberships,
  faqItems,
  heroBadges,
  motivationItems,
  processSteps,
  resultCards,
  simulationBenefits,
  solutionChecks,
  stats,
  technologyCards,
  whatsappNumber,
} from "@/pages/rhinoplastyData";

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

const RhinoplastyPage = () => {
  useRhinoplastySeo();

  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isMobile = window.innerWidth < 768;
      setShowMobileStickyCta(isMobile && window.scrollY > 360);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <a
        href="#contenido-principal"
        className="skip-link fixed left-4 top-4 z-[70] -translate-y-24 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <Navbar />

      <main id="contenido-principal" className="overflow-hidden">
        <section id="inicio" className="relative flex min-h-screen items-center overflow-hidden scroll-mt-28 pt-24">
          <div className="absolute inset-0">
            <picture>
              <source
                srcSet="/images/rhinoplasty/hero-768.webp 768w, /images/rhinoplasty/hero-1280.webp 1280w, /images/rhinoplasty/hero-1920.webp 1920w"
                sizes="100vw"
                type="image/webp"
              />
              <img
                src="/images/rhinoplasty/hero-1280.webp"
                alt="Resultado de rinoplastia abierta en Chile con perfil nasal armonioso Torres Rhinoplasty"
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/35" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,181,98,0.2),transparent_30%)]" />
          </div>
          <div className="relative container-premium section-padding pt-32">
            <ScrollReveal className="max-w-4xl">
              <header>
                <p className="subtitle-premium mb-6 text-accent">Torres Rhinoplasty</p>
                <h1 className="heading-display max-w-4xl text-background">
                  Rinoplastia en Chile - Cirugia de Nariz con Simulacion 3D y Tecnologia Ultrasonica
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[#F9FAFB99] md:text-xl">
                  Resultados naturales que armonizan tu rostro y mejoran tu respiracion. +5.000
                  rinoplastias exitosas. Tasa de revision menor al 1%.
                </p>
                <div className="mt-10">
                  <ContactModalButton
                    className="btn-premium"
                    aria-label="Abrir evaluacion para Torres Rhinoplasty"
                  >
                    AGENDA TU EVALUACION
                  </ContactModalButton>
                </div>
                <ul className="mt-8 flex flex-wrap gap-3 text-sm text-background/90" aria-label="Pruebas sociales destacadas">
                  {heroBadges.map((badge) => (
                    <li
                      key={badge}
                      className="inline-flex items-center gap-2 rounded-sm border border-background/20 bg-background/10 px-4 py-2.5 backdrop-blur-sm"
                    >
                      <Check size={14} className="text-accent" />
                      {badge}
                    </li>
                  ))}
                </ul>
              </header>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-background">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading label="EL DESAFIO" title="¿Tu nariz afecta tu confianza o tu respiracion?" />
            </ScrollReveal>
            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {challengeItems.map((item, index) => (
                <ScrollReveal key={item.text} delay={index * 0.08}>
                  <article className="card-premium h-full p-7">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      <item.icon size={26} />
                    </div>
                    <p className="text-base leading-8 text-muted-foreground">{item.text}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="procedimiento" className="scroll-mt-28 bg-muted">
          <div className="container-premium section-padding">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <ScrollReveal>
                <div>
                  <SectionHeading
                    label="LA SOLUCION"
                    title="Torres Rhinoplasty: Rinoplastia Abierta con Precision 3D"
                    centered={false}
                  />
                  <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
                    <p>
                      Torres Rhinoplasty no es una rinoplastia convencional. Es un protocolo integral
                      que combina tecnica abierta de precision, simulacion 3D previa y tecnologia
                      ultrasonica mini invasiva para lograr resultados naturales y armoniosos.
                    </p>
                    <p>
                      Mediante la tecnica abierta, el Dr. Torres Farr accede directamente a la
                      estructura nasal para tener control milimetrico del dorso, la punta y el soporte
                      cartilaginoso. Cada cambio se planifica previamente con simulacion 3D.
                    </p>
                    <p>
                      La tecnologia ultrasonica reduce el trauma quirurgico, minimiza la inflamacion y
                      acelera la recuperacion. Estetica y funcion respiratoria se resuelven en una sola
                      intervencion.
                    </p>
                  </div>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {solutionChecks.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-sm border border-border bg-background/75 px-4 py-3 text-sm font-medium text-foreground"
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check size={14} />
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div className="card-premium overflow-hidden rounded-lg">
                  <img
                    src="/images/rhinoplasty/procedure-1024.webp"
                    srcSet="/images/rhinoplasty/procedure-640.webp 640w, /images/rhinoplasty/procedure-1024.webp 1024w"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    alt="Quirofano para rinoplastia abierta y funcional en Santiago de Chile"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section id="simulacion-3d" className="scroll-mt-28 bg-background">
          <div className="container-premium section-padding">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              <ScrollReveal>
                <div className="card-premium overflow-hidden rounded-lg">
                  <img
                    src="/images/rhinoplasty/simulation-1024.webp"
                    srcSet="/images/rhinoplasty/simulation-640.webp 640w, /images/rhinoplasty/simulation-1024.webp 1024w"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    alt="Simulacion 3D de rinoplastia en Chile para visualizar resultados antes y despues"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div>
                  <SectionHeading
                    label="SIMULACION 3D"
                    title="Mira tu resultado antes de operarte"
                    centered={false}
                  />
                  <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
                    <p>
                      Antes de entrar al quirofano, ves tu nariz desde multiples angulos en un modelo
                      3D. Se exploran diferentes escenarios y se ajusta el plan hasta que estes
                      conforme.
                    </p>
                    <p>
                      Esto elimina la incertidumbre, alinea expectativas y aumenta la satisfaccion
                      postoperatoria en una rinoplastia con simulacion 3D realmente personalizada.
                    </p>
                  </div>
                  <div className="mt-8 grid gap-4">
                    {simulationBenefits.map((item) => (
                      <div key={item.text} className="rounded-lg border border-border bg-muted/50 p-5">
                        <div className="flex items-start gap-4">
                          <span className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <item.icon size={20} />
                          </span>
                          <p className="text-sm leading-7 text-muted-foreground">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ContactModalButton className="btn-premium mt-10" aria-label="Abrir simulacion 3D de rinoplastia">
                    AGENDA TU SIMULACION 3D
                  </ContactModalButton>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="bg-muted">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading
                label="RESULTADOS INTEGRALES"
                title="No solo se ve mejor - tambien respiras mejor"
              />
            </ScrollReveal>
            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {resultCards.map((card, index) => (
                <ScrollReveal key={card.title} delay={index * 0.08}>
                  <article className="card-premium h-full bg-background p-8">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      <card.icon size={30} />
                    </div>
                    <h3 className="font-serif text-2xl font-medium text-foreground">{card.title}</h3>
                    <ul className="mt-6 space-y-3">
                      {card.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                          <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Check size={12} />
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={0.16}>
              <p className="mx-auto mt-10 max-w-3xl text-center text-base leading-8 text-muted-foreground">
                En Torres Rhinoplasty, ambos objetivos se logran en una sola intervencion.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-foreground">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading
                label="EXPERIENCIA"
                title="Referente en rinoplastia en Chile y Latinoamerica"
                inverted
              />
            </ScrollReveal>
            <div className="mt-14 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <ScrollReveal key={stat.label} delay={index * 0.08}>
                  <article className="rounded-lg border border-background/15 bg-background/5 p-8 text-center backdrop-blur">
                    <div className="text-primary">
                      <Counter
                        target={stat.target}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        locale="es-CL"
                      />
                    </div>
                    <p className="mt-3 text-sm font-medium uppercase tracking-[0.18em] text-[#F9FAFB99]">
                      {stat.label}
                    </p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="tecnologia" className="scroll-mt-28 bg-background">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading
                label="TECNOLOGIA"
                title="Herramientas de Precision Quirurgica"
              />
            </ScrollReveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {technologyCards.map((tech, index) => (
                <ScrollReveal key={tech.title} delay={index * 0.08}>
                  <article className="card-premium h-full bg-muted/60 p-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      <tech.icon size={30} />
                    </div>
                    <h3 className="font-serif text-2xl font-medium text-foreground">{tech.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{tech.description}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={0.18}>
              <p className="mx-auto mt-10 max-w-[940px] text-center text-base leading-8 text-muted-foreground">
                Torres Rhinoplasty es el unico protocolo en Chile que integra simulacion 3D, tecnica
                abierta y tecnologia ultrasonica en cada rinoplastia.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section id="doctor" className="scroll-mt-28 bg-muted">
          <div className="container-premium section-padding">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              <ScrollReveal>
                <div className="card-premium overflow-hidden rounded-lg">
                  <img
                    src="/images/rhinoplasty/doctor-1024.webp"
                    srcSet="/images/rhinoplasty/doctor-640.webp 640w, /images/rhinoplasty/doctor-1024.webp 1024w"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    alt="Dr. Sebastian Torres Farr, especialista en rinoplastia en Chile con resultados naturales"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div>
                  <SectionHeading
                    label="TU CIRUJANO"
                    title="Dr. Sebastian Torres Farr - Mas de 5.000 Rinoplastias con Resultados Naturales"
                    centered={false}
                  />
                  <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
                    <p>
                      El Dr. Sebastian Torres Farr es medico de la Pontificia Universidad Catolica de
                      Chile, con especializacion en Cirugia de Cabeza, Cuello y Maxilofacial en la
                      Universita degli Studi di Messina, Italia, y Master en Rinoplastia de la
                      Universita Cattolica di Roma. Su titulo es valido en toda la Comunidad Europea,
                      Suiza, Monaco y el Reino Unido.
                    </p>
                    <p>
                      Con mas de 5.000 rinoplastias realizadas y una tasa de revision menor al 1%, el
                      Dr. Torres Farr combina un enfoque integral de estetica y funcion respiratoria con
                      simulacion 3D y tecnologia ultrasonica de vanguardia. Sus resultados son
                      consistentes, naturales y respetuosos de la identidad facial de cada paciente.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {doctorAwards.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-3 rounded-lg border border-primary/20 bg-background px-5 py-4 text-sm leading-7 text-foreground"
                      >
                        <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-primary">
                          <item.icon size={22} strokeWidth={2.2} />
                        </span>
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {doctorMemberships.map((membership) => (
                      <div
                        key={membership}
                        className="rounded-sm border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground"
                      >
                        {membership}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section id="proceso" className="scroll-mt-28 bg-background">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading label="TU PROCESO" title="De la evaluacion al resultado en 4 pasos" />
            </ScrollReveal>
            <div className="relative mt-14">
              <div
                className="absolute left-[13%] right-[13%] top-10 hidden h-px bg-border lg:block"
                aria-hidden="true"
              />
              <ol className="grid gap-6 lg:grid-cols-4">
                {processSteps.map((step, index) => (
                  <ScrollReveal key={step.number} delay={index * 0.08}>
                    <li className="relative card-premium h-full bg-muted/60 p-7">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                        {step.number}
                      </div>
                      <h3 className="font-serif text-xl font-medium text-foreground">{step.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </li>
                  </ScrollReveal>
                ))}
              </ol>
            </div>
            <ScrollReveal delay={0.18}>
              <div className="mt-12 text-center">
                <ContactModalButton className="btn-premium" aria-label="Agendar el primer paso de tu rinoplastia">
                  AGENDA TU PRIMER PASO
                </ContactModalButton>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section id="motivaciones" className="scroll-mt-28 bg-muted">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading
                label="¿TE IDENTIFICAS?"
                title="Razones por las que nuestros pacientes eligen operarse"
              />
            </ScrollReveal>
            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {motivationItems.map((item, index) => (
                <ScrollReveal key={item.title} delay={index * 0.06}>
                  <ContactModalButton
                    className="card-premium flex h-full w-full flex-col items-start rounded-lg p-7 text-left transition-all duration-300 hover:border-primary/30"
                    aria-label={`Abrir evaluacion por motivo: ${item.title}`}
                  >
                    <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      <item.icon size={26} />
                    </span>
                    <span className="font-serif text-xl font-medium text-foreground">{item.title}</span>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-[0.18em] text-primary">
                      Agendar evaluacion <ChevronRight size={14} />
                    </span>
                  </ContactModalButton>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-28 bg-background">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading
                label="PREGUNTAS FRECUENTES"
                title="Todo lo que necesitas saber sobre la rinoplastia"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <Accordion
                type="single"
                collapsible
                className="card-premium mt-12 overflow-hidden rounded-lg border-border/80 bg-card"
              >
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-b border-border px-6 last:border-b-0 md:px-8"
                  >
                    <AccordionTrigger
                      className="py-6 text-left text-base font-medium leading-7 text-foreground hover:no-underline"
                      aria-label={`Expandir pregunta frecuente: ${item.question}`}
                    >
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <p className="text-sm leading-7 text-muted-foreground">{item.answer}</p>
                      <ContactModalButton
                        className="mt-4 inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80"
                        aria-label={`Agendar evaluacion desde pregunta frecuente: ${item.question}`}
                      >
                        Agenda tu evaluacion para resolver todas tus dudas.
                        <ArrowRight size={14} />
                      </ContactModalButton>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollReveal>
          </div>
        </section>

        <section id="evaluacion" className="scroll-mt-28 bg-primary">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="heading-section text-primary-foreground md:text-5xl">
                  ¿Listo para ver tu nueva nariz?
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-primary-foreground">
                  Agenda tu evaluacion y descubre con simulacion 3D como puede transformarse tu rostro
                  con Torres Rhinoplasty.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <ContactModalButton
                    className="inline-flex w-full items-center justify-center rounded-sm bg-background px-8 py-4 text-sm font-sans font-medium uppercase tracking-[0.18em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-[280px]"
                    aria-label="Abrir evaluacion final de Torres Rhinoplasty"
                  >
                    AGENDAR EVALUACION
                  </ContactModalButton>
                  <a
                    href={buildWhatsAppUrl(defaultWhatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-sm border-[2.5px] border-primary-foreground bg-transparent px-8 py-4 text-sm font-sans font-medium uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-foreground hover:text-primary sm:w-[280px]"
                  >
                    <MessageCircle size={18} />
                    O escribenos por WhatsApp
                  </a>
                </div>
                <p className="mt-5 text-sm text-primary-foreground">
                  Sin compromiso · Evaluacion personalizada · Respuesta en menos de 24h · Evaluaciones
                  limitadas por semana
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <a
        href={buildWhatsAppUrl(defaultWhatsappMessage)}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp a Cirugia 360"
        className={cn(
          "animate-soft-pulse fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_34px_-16px_rgba(42,122,123,0.55)] transition-all duration-300 hover:bg-primary-dark md:h-auto md:w-auto md:gap-2 md:rounded-full md:px-5 md:py-4",
          showMobileStickyCta ? "bottom-24" : "bottom-5",
          "md:bottom-6",
        )}
      >
        <MessageCircle size={22} />
        <span className="hidden text-sm font-medium md:inline">WhatsApp</span>
      </a>

      <Footer />

      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-10px_30px_rgba(18,24,38,0.08)] backdrop-blur transition-transform duration-300 md:hidden ${
          showMobileStickyCta ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <ContactModalButton
          className="btn-premium w-full px-6 py-3 text-xs"
          aria-label="Abrir barra fija de evaluacion en mobile"
        >
          AGENDAR EVALUACION
        </ContactModalButton>
      </div>
    </div>
  );
};

export default RhinoplastyPage;
