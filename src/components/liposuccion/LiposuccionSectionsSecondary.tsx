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
} from "@/pages/liposuccionData";

const LiposuccionSectionsSecondary = () => (
  <>
    <ExperienceMetricsSection
      title="Experiencia y criterio en contorno corporal"
      description="La liposuccion exige una lectura honesta del volumen, la piel y las proporciones para que el resultado se vea armonico y estable."
      metrics={stats}
    />

    <section id="tecnologia" className="scroll-mt-28 bg-background">
      <div className="container-premium section-padding">
        <ScrollReveal>
          <SectionHeading
            label="TECNICA"
            title="Volumen, piel y transiciones tratados en conjunto"
            description="La liposuccion moderna no consiste en aspirar de mas. Requiere decidir cuanto corregir, donde hacerlo y como mantener un contorno suave y natural."
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
            El objetivo es mejorar la forma corporal respetando la anatomia de cada persona y sin
            caer en correcciones excesivas.
          </p>
        </ScrollReveal>
      </div>
    </section>

    <SpecialistSection
      title="Dr. Sebastian Torres Farr - Cirugia de contorno con formacion internacional"
      paragraphs={[
        "El Dr. Sebastian Torres Farr es medico de la Pontificia Universidad Catolica de Chile y cuenta con especializacion en Cirugia de Cabeza, Cuello y Maxilofacial en la Universita degli Studi di Messina, Italia, ademas de formacion avanzada en contorno corporal.",
        "Su enfoque combina criterio anatomico, tecnica quirurgica y una evaluacion honesta de grasa localizada y calidad de piel para lograr liposucciones mas armonicas y naturales.",
      ]}
      awards={doctorAwards}
      memberships={doctorMemberships}
      image={
        <img
          src={doctorPortrait}
          alt="Dr. Sebastian Torres Farr, especialista en liposuccion en Chile"
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
            title="De la evaluacion al resultado en 4 pasos"
            description="Cuando entiendes el proceso, es mas facil tomar una decision con tranquilidad y expectativas realistas."
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
            title="Todo lo que necesitas saber sobre la liposuccion"
            description="La mejor decision se toma con informacion clara sobre indicacion, recuperacion, limites del procedimiento y expectativas."
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

export default LiposuccionSectionsSecondary;
