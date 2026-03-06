import ScrollReveal from "@/components/ScrollReveal";
import { ContactModalButton } from "@/components/ContactModalProvider";
import SectionHeading from "@/components/marcacion/SectionHeading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Counter from "@/components/Counter";
import doctorPortrait from "@/assets/doctor-portrait.jpg";
import {
  doctorAwardIcon as Award,
  doctorAwards,
  faqItems,
  processSteps,
  stats,
  technologyCards,
} from "@/pages/marcacionData";
import { ArrowRight } from "lucide-react";

const MarcacionSectionsSecondary = () => (
  <>
    <section className="bg-foreground">
      <div className="container-premium section-padding">
        <ScrollReveal>
          <SectionHeading
            label="EXPERIENCIA"
            title="Los mejores resultados en Latinoamérica"
            description="Experiencia quirúrgica, tecnología combinada y una ejecución diseñada para convertir definición en confianza."
            inverted
          />
        </ScrollReveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <ScrollReveal key={stat.label} delay={index * 0.08}>
              <article className="rounded-lg border border-background/15 bg-background/5 p-8 text-center backdrop-blur">
                <div className="text-primary">
                  <Counter target={stat.target} suffix={stat.suffix} />
                </div>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.18em] text-[#F9FAFB99]">{stat.label}</p>
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
            label="TECNOLOGÍA"
            title="Equipamiento de Última Generación"
            description="La lipoescultura de alta definición exige herramientas que trabajen profundidad, retracción y proyección con precisión real."
          />
        </ScrollReveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {technologyCards.map((tech, index) => (
            <ScrollReveal key={tech.name} delay={index * 0.08}>
              <article className="card-premium h-full bg-muted/60 p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <tech.icon size={30} />
                </div>
                <h3 className="font-serif text-2xl font-medium text-foreground">{tech.name}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{tech.description}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mt-10 max-w-[900px] text-center text-base leading-8 text-muted-foreground">
            Somos el único centro en Chile que combina estas 3 tecnologías en un mismo procedimiento de
            lipoescultura de alta definición.
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
                src={doctorPortrait}
                alt="Dr. Sebastián Torres Farr, pionero en marcación abdominal de alta definición"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div>
              <SectionHeading
                label="TU CIRUJANO"
                title="Dr. Sebastián Torres Farr — Pionero en Marcación de Alta Definición"
                centered={false}
                description="El Dr. Torres Farr ha liderado la evolución de la lipoescultura HD en la región, combinando técnica quirúrgica, criterio estético y formación internacional."
              />
              <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
                <p>
                  Su trayectoria incluye más de 1.500 casos exitosos de marcación abdominal, formación avanzada
                  en contorno corporal y una visión enfocada en resultados de alto impacto y alta naturalidad.
                </p>
                <p>
                  Esa experiencia le permite diseñar planes quirúrgicos distintos para marcación abdominal
                  hombres, marcación abdominal mujeres y aumento estratégico de volumen con UGRAFT
                  lipotransferencia.
                </p>
              </div>
              <div id="doctor-credenciales" className="mt-8 grid gap-4 md:grid-cols-2">
                {doctorAwards.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-lg border border-border bg-background px-5 py-4 text-sm leading-7 text-foreground"
                  >
                    <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-primary">
                      <Award className="text-primary" size={24} strokeWidth={2.2} />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <ContactModalButton className="btn-premium">
                  Agendar evaluación
                </ContactModalButton>
                <a
                  href="#doctor-credenciales"
                  className="inline-flex items-center gap-2 text-sm font-sans font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80"
                >
                  Conoce más sobre el Dr. Torres Farr <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>

    <section className="bg-background">
      <div className="container-premium section-padding">
        <ScrollReveal>
          <SectionHeading
            label="TU PROCESO"
            title="De la evaluación al resultado en 4 pasos"
            description="Cuanto menos incertidumbre sientes, más fácil es decidir. Por eso el proceso está diseñado para que sepas qué viene, cuándo y para qué."
          />
        </ScrollReveal>
        <ol className="mt-14 grid gap-6 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.08}>
              <li className="card-premium h-full bg-muted/60 p-7">
                <div className="mb-5 text-3xl font-bold leading-none text-primary">
                  {step.number}
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{step.description}</p>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>

    <section id="faq" className="scroll-mt-28 bg-muted">
      <div className="container-premium section-padding">
        <ScrollReveal>
          <SectionHeading
            label="PREGUNTAS FRECUENTES"
            title="Todo lo que necesitas saber sobre la lipoescultura de alta definición"
            description="La decisión correcta se toma con información clara. Aquí resolvemos las objeciones más comunes antes de tu evaluación."
          />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
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
                <AccordionTrigger className="py-6 text-left text-base font-medium leading-7 text-foreground hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  </>
);

export default MarcacionSectionsSecondary;
