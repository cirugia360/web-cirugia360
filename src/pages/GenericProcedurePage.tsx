import { useEffect, useState } from "react";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProcedureResultsPreviewSection from "@/components/landing/ProcedureResultsPreviewSection";
import ClosingValuationSection from "@/components/landing/ClosingValuationSection";
import SpecialistSection from "@/components/landing/SpecialistSection";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeading from "@/components/marcacion/SectionHeading";
import { ContactModalButton } from "@/components/ContactModalProvider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import doctorPortrait from "@/assets/doctor-portrait.jpg";
import { getProcedureById, type ProcedureId } from "@/data/procedureCatalog";
import NotFound from "@/pages/NotFound";

type GenericProcedurePageProps = {
  procedureId: ProcedureId;
};

const whatsappNumber = "56912345678";

const doctorAwards = [
  "Mejor Cirujano Plastico Facial 2023 - AMWC World Congress, Monaco",
  "Premio Antiaging Medical Congress - Roma, 2015",
  "Premio Folador SIES - Bolonia, 2015",
];

const doctorMemberships = [
  "Miembro de la Sociedad Americana de Cirugia Plastica",
  "Miembro de la Sociedad Europea de Cirugia Plastica Facial (EAFPS)",
  "Miembro de la Sociedad Italiana de Cirugia Plastica (AICPE)",
  "Miembro del Colegio Medico de Chile (RCM 40135-8)",
  "Miembro Honorario de SOCHIMCE",
];

const doctorParagraphs = [
  "El Dr. Sebastian Torres Farr es medico de la Pontificia Universidad Catolica de Chile, con especializacion en Cirugia de Cabeza, Cuello y Maxilofacial en Italia y una trayectoria construida sobre precision quirurgica, criterio anatomico y seguimiento cercano.",
  "Su enfoque integra evaluacion honesta, planificacion personalizada y una ejecucion enfocada en resultados naturales, proporcionales y coherentes con la anatomia de cada paciente.",
];

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

const GenericProcedurePage = ({ procedureId }: GenericProcedurePageProps) => {
  const procedure = getProcedureById(procedureId);
  const landing = procedure?.landing;
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

  if (!procedure || !landing) {
    return <NotFound />;
  }

  const heroImage = procedure.cases[0]?.src ?? procedure.image;
  const procedureImage = procedure.cases[1]?.src ?? heroImage;
  const defaultWhatsappMessage = `Hola, quiero agendar una evaluacion para ${procedure.title} en Cirugia 360.`;

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
        <section className="relative flex min-h-screen items-center overflow-hidden scroll-mt-28 pt-24">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={`${procedure.title} en Cirugia 360`}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/92 via-foreground/78 to-foreground/38" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(42,122,123,0.22),transparent_32%)]" />
          </div>

          <div className="relative container-premium section-padding pt-32">
            <ScrollReveal className="max-w-4xl">
              <p className="subtitle-premium mb-6 text-accent">{landing.heroLabel}</p>
              <h1 className="heading-display max-w-4xl text-background">{landing.heroTitle}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#F9FAFB99]">
                {landing.heroDescription}
              </p>

              <div className="mt-10 flex flex-col items-start gap-5">
                <ContactModalButton className="btn-premium">Agendar evaluacion</ContactModalButton>
                <div className="flex flex-wrap gap-3">
                  {landing.heroBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-2 rounded-sm border border-background/20 bg-background/10 px-4 py-2.5 text-sm text-background/90 backdrop-blur-sm"
                    >
                      <Check size={14} className="text-accent" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-background">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading
                label="EL DESAFIO"
                title={landing.challengeTitle}
                description={landing.challengeDescription}
              />
            </ScrollReveal>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {landing.challengeCards.map((card, index) => (
                <ScrollReveal key={card.title} delay={index * 0.08}>
                  <article className="card-premium h-full p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      <card.icon size={24} />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-medium text-foreground">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {card.description}
                    </p>
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
                    title={landing.procedureTitle}
                    description={landing.procedureDescription}
                    centered={false}
                  />

                  <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
                    {landing.procedureParagraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {landing.procedureChecks.map((item) => (
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

                  <ContactModalButton className="btn-premium mt-10">
                    Agendar evaluacion
                  </ContactModalButton>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div className="card-premium overflow-hidden rounded-lg">
                  <img
                    src={procedureImage}
                    alt={`Resultado de ${procedure.title}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading
                label="BENEFICIOS ESPERADOS"
                title={landing.benefitsTitle}
                description={landing.benefitsDescription}
              />
            </ScrollReveal>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {landing.benefitCards.map((card, index) => (
                <ScrollReveal key={card.title} delay={index * 0.08}>
                  <article className="card-premium h-full p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      <card.icon size={24} />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-medium text-foreground">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {card.description}
                    </p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted">
          <div className="container-premium section-padding">
            <ScrollReveal>
              <SectionHeading
                label="ES PARA TI?"
                title={landing.candidateTitle}
                description={landing.candidateDescription}
              />
            </ScrollReveal>

            <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {landing.candidatePoints.map((item, index) => (
                <ScrollReveal key={item} delay={index * 0.06}>
                  <article className="card-premium flex h-full flex-col items-start p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check size={20} />
                    </div>
                    <p className="mt-5 font-serif text-xl font-medium text-foreground">{item}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.14}>
              <div className="mt-12 text-center">
                <ContactModalButton className="btn-premium">
                  Resolver mi caso en evaluacion
                </ContactModalButton>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <ProcedureResultsPreviewSection
          procedureId={procedure.id}
          sectionId="resultados"
          backgroundClassName="bg-background"
        />

        <SpecialistSection
          title="Dr. Sebastian Torres Farr - Evaluacion quirurgica con criterio anatomico"
          paragraphs={doctorParagraphs}
          awards={doctorAwards}
          memberships={doctorMemberships}
          image={
            <img
              src={doctorPortrait}
              alt="Dr. Sebastian Torres Farr"
              className="w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          }
        />

        <section id="faq" className="scroll-mt-28 bg-background">
          <div className="container-premium section-padding max-w-5xl">
            <ScrollReveal>
              <SectionHeading
                label="PREGUNTAS FRECUENTES"
                title={`Lo esencial sobre ${procedure.title}`}
              />
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <Accordion
                type="single"
                collapsible
                className="card-premium mt-12 overflow-hidden rounded-lg border-border/80 bg-card"
              >
                {landing.faqItems.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-b border-border px-6 last:border-b-0 md:px-8"
                  >
                    <AccordionTrigger className="py-6 text-left text-base font-medium leading-7 text-foreground hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <p className="text-sm leading-7 text-muted-foreground">{item.answer}</p>
                      <ContactModalButton className="mt-4 inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80">
                        Agendar evaluacion personalizada
                        <ArrowRight size={14} />
                      </ContactModalButton>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollReveal>
          </div>
        </section>

        <ClosingValuationSection
          title={landing.closingTitle}
          description={landing.closingDescription}
          whatsappHref={buildWhatsAppUrl(defaultWhatsappMessage)}
        />
      </main>

      <a
        href={buildWhatsAppUrl(defaultWhatsappMessage)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Escribir por WhatsApp sobre ${procedure.title}`}
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
        <ContactModalButton className="btn-premium w-full px-6 py-3 text-xs">
          AGENDAR EVALUACION
        </ContactModalButton>
      </div>
    </div>
  );
};

export default GenericProcedurePage;
