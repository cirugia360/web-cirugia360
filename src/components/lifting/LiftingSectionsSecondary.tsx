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
} from "@/pages/liftingData";

const LiftingSectionsSecondary = () => (
  <>
    <ExperienceMetricsSection
      title="Precision y experiencia en rejuvenecimiento facial"
      description="El lifting facial exige criterio anatomico, una indicacion honesta y una ejecucion que priorice resultados naturales."
      metrics={stats}
    />

    <section id="tecnologia" className="scroll-mt-28 bg-background">
      <div className="container-premium section-padding">
        <ScrollReveal>
          <SectionHeading
            label="TECNICA"
            title="Rostro, cuello y contorno tratados como una sola unidad"
            description="Un buen lifting facial no se limita a estirar. Requiere decisiones precisas sobre soporte, cuello, mandibula y armonia global."
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
            El objetivo es rejuvenecer tu cara completa con una lectura anatomica real, no con un
            cambio evidente o artificial.
          </p>
        </ScrollReveal>
      </div>
    </section>

    <SpecialistSection
      title="Dr. Sebastian Torres Farr - Cirugia facial con formacion internacional"
      paragraphs={[
        "El Dr. Sebastian Torres Farr es medico de la Pontificia Universidad Catolica de Chile y cuenta con especializacion en Cirugia de Cabeza, Cuello y Maxilofacial en la Universita degli Studi di Messina, Italia, ademas de formacion avanzada en cirugia estetica facial.",
        "Su enfoque combina tecnica quirurgica, criterio estetico y una lectura precisa del envejecimiento facial para lograr lifting faciales mas frescos, definidos y naturales.",
      ]}
      awards={doctorAwards}
      memberships={doctorMemberships}
      image={
        <img
          src={doctorPortrait}
          alt="Dr. Sebastian Torres Farr, especialista en rejuvenecimiento facial en Chile"
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
            description="Mientras mas claro es el proceso, mas facil es tomar una decision con tranquilidad y expectativas realistas."
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
            title="Todo lo que necesitas saber sobre el lifting facial"
            description="La mejor decision se toma con informacion clara sobre resultados, cicatrices, recuperacion y expectativas."
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

export default LiftingSectionsSecondary;
