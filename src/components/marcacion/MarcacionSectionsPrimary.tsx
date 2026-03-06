import { Check, ChevronRight } from "lucide-react";
import { ContactModalButton } from "@/components/ContactModalProvider";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeading from "@/components/marcacion/SectionHeading";
import technologyImage from "@/assets/technology.jpg";
import {
  audienceCards,
  challengeItems,
  resultHighlights,
  solutionChecks,
  trustLogos,
} from "@/pages/marcacionData";

const MarcacionSectionsPrimary = () => (
  <>
    <section className="border-y border-border bg-background/95">
      <div className="container-premium px-6 py-8 md:px-12 lg:px-20">
        <ScrollReveal>
          <div className="text-center">
            <p className="subtitle-premium mb-5">Tecnología de clase mundial</p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {trustLogos.map((logo) => (
                <div
                  key={logo}
                  className="rounded-sm border border-border bg-card px-6 py-3 text-xs font-sans font-medium uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="bg-muted">
      <div className="container-premium section-padding">
        <ScrollReveal>
          <SectionHeading
            label="EL DESAFÍO"
            title="¿Entrenas durante años sin lograr la definición que mereces?"
            description="La lipoescultura de alta definición nace para quienes ya hicieron su parte y aún así no consiguen una marcación abdominal visible, firme y proporcionada."
          />
        </ScrollReveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {challengeItems.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 0.08}>
              <article className="card-premium h-full p-7">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <item.icon size={26} />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>

    <section id="procedimiento" className="scroll-mt-28 bg-background">
      <div className="container-premium section-padding">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <ScrollReveal>
            <div>
              <SectionHeading
                label="LA SOLUCIÓN"
                title="Liposucción de Alta Definición Avanzada: Marcación Nivel Dios"
                centered={false}
                description="Marcación Nivel Dios no solo elimina grasa. Esculpe y redefine líneas musculares en 3D para construir un contorno corporal más atlético, firme y expresivo."
              />
              <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
                <p>
                  Esta lipoescultura HD combina lipoescultura, retracción de piel y lipotransferencia para crear
                  abdominales marcados con cirugía y transiciones anatómicas naturales.
                </p>
                <p>
                  Cada plan es 100% personalizado según tu anatomía, tu porcentaje de grasa, tu sexo y el
                  resultado que quieres proyectar frente al espejo.
                </p>
                <p>
                  El objetivo no es verte operado. Es conseguir una definición muscular quirúrgica que se vea
                  potente, armónica y coherente con tu cuerpo.
                </p>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {solutionChecks.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-sm border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-foreground"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check size={14} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <ContactModalButton className="btn-premium mt-10">
                Agendar evaluación
              </ContactModalButton>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="card-premium overflow-hidden rounded-lg border-border/70 bg-card">
              <img
                src={technologyImage}
                alt="Tecnología para lipoescultura de alta definición con marcación abdominal 3D"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>

    <section id="resultados" className="scroll-mt-28 bg-muted">
      <div className="container-premium section-padding">
        <ScrollReveal>
          <SectionHeading
            label="RESULTADOS PERSONALIZADOS"
            title="Un plan diseñado para tu cuerpo"
            description="La marcación abdominal se adapta a tus objetivos. La anatomía femenina y masculina requieren decisiones distintas para que la lipo de alta definición se vea natural y poderosa."
          />
        </ScrollReveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {audienceCards.map((card, index) => (
            <ScrollReveal key={card.title} delay={index * 0.1}>
              <article className="card-premium h-full p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <card.icon size={30} />
                </div>
                <h3 className="font-serif text-2xl font-medium text-foreground">{card.title}</h3>
                <p className="mt-4 text-base leading-8 text-muted-foreground">{card.description}</p>
                <ul className="mt-6 space-y-3">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check size={12} />
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <ContactModalButton className="mt-8 inline-flex items-center gap-2 text-sm font-sans font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80">
                  Agendar evaluación <ChevronRight size={16} />
                </ContactModalButton>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {resultHighlights.map((result, index) => (
            <ScrollReveal key={result.title} delay={index * 0.08}>
              <article className="card-premium overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={result.image}
                    alt={result.alt}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-medium text-foreground">{result.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{result.description}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default MarcacionSectionsPrimary;
