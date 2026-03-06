import ScrollReveal from "@/components/ScrollReveal";
import ExperienceMetricsSection from "@/components/landing/ExperienceMetricsSection";
import SpecialistSection from "@/components/landing/SpecialistSection";
import SectionHeading from "@/components/marcacion/SectionHeading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import doctorPortrait from "@/assets/doctor-portrait.jpg";
import {
  doctorAwards,
  doctorMemberships,
  faqItems,
  processSteps,
  stats,
  technologyCards,
} from "@/pages/marcacionData";

const MarcacionSectionsSecondary = () => (
  <>
    <ExperienceMetricsSection title="Los mejores resultados en Latinoamérica" metrics={stats} />

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

    <SpecialistSection
      title="Dr. Sebastián Torres Farr — Más de 15 Años y 1.500 Casos de Marcación de Alta Definición"
      paragraphs={[
        "El Dr. Sebastián Torres Farr ha liderado la evolución de la lipoescultura HD en la región, combinando técnica quirúrgica, criterio estético y formación internacional en cirugía facial, reconstructiva y contorno corporal.",
        "Su trayectoria incluye más de 1.500 casos exitosos de marcación abdominal y una planificación quirúrgica capaz de adaptar la técnica a hombres, mujeres y protocolos de aumento estratégico con UGRAFT para lograr resultados definidos, naturales y proporcionales.",
      ]}
      awards={doctorAwards}
      memberships={doctorMemberships}
      image={
        <img
          src={doctorPortrait}
          alt="Dr. Sebastián Torres Farr, especialista en lipoescultura de alta definición en Chile"
          className="w-full object-cover"
          loading="lazy"
        />
      }
    />

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
