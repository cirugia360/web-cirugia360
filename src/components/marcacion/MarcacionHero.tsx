import { Check } from "lucide-react";
import { ContactModalButton } from "@/components/ContactModalProvider";
import ScrollReveal from "@/components/ScrollReveal";
import marcacionHero from "@/assets/marcacion-hero.jpg";
import { heroBadges } from "@/pages/marcacionData";

const MarcacionHero = () => (
  <section id="inicio" className="relative flex min-h-screen items-center overflow-hidden scroll-mt-28 pt-24">
    <div className="absolute inset-0">
      <img
        src={marcacionHero}
        alt="Torso masculino definido para lipoescultura de alta definición"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,181,98,0.2),transparent_30%)]" />
    </div>

    <div className="relative container-premium section-padding pt-32">
      <ScrollReveal className="max-w-4xl">
        <p className="subtitle-premium mb-6 text-accent">Lipoescultura HD en Chile</p>
        <h1 className="heading-display max-w-4xl text-background">
          Lipoescultura de Alta Definición en Chile — Marcación Abdominal con Tecnología 3D
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#F9FAFB99] md:text-xl">
          La técnica que redefine tu contorno corporal con precisión quirúrgica. +1.500 casos exitosos.
          Resultados que se ven y se sienten.
        </p>
        <div className="mt-10">
          <ContactModalButton className="btn-premium">
            AGENDA TU EVALUACIÓN GRATUITA
          </ContactModalButton>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-background/90">
          {heroBadges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-2 rounded-sm border border-background/20 bg-background/10 px-4 py-2.5 backdrop-blur-sm"
            >
              <Check className="text-accent" size={16} />
              {badge}
            </span>
          ))}
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default MarcacionHero;
