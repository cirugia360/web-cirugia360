import type { ReactNode } from "react";
import { BadgeCheck, Trophy } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeading from "@/components/marcacion/SectionHeading";

type SpecialistSectionProps = {
  title: string;
  paragraphs: string[];
  awards: string[];
  memberships: string[];
  image: ReactNode;
};

const SpecialistSection = ({
  title,
  paragraphs,
  awards,
  memberships,
  image,
}: SpecialistSectionProps) => (
  <section id="doctor" className="scroll-mt-28 bg-muted">
    <div className="container-premium section-padding">
      <div className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <ScrollReveal>
          <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">{image}</div>
        </ScrollReveal>

        <ScrollReveal delay={0.12}>
          <div>
            <SectionHeading label="TU ESPECIALISTA" title={title} centered={false} />
            <div className="mt-8 space-y-5 text-base leading-8 text-muted-foreground">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {awards.map((award) => (
                <article
                  key={award}
                  className="rounded-2xl border border-primary/25 bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-3">
                    <Trophy className="mt-0.5 flex-shrink-0 text-accent" size={18} />
                    <p className="text-sm leading-6 text-foreground">{award}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6">
              <h3 className="font-serif text-2xl font-medium text-foreground">Membresías</h3>
              <div className="mt-5 grid gap-3">
                {memberships.map((membership) => (
                  <div key={membership} className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 flex-shrink-0 text-primary" size={18} />
                    <p className="text-sm leading-6 text-muted-foreground">{membership}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

export default SpecialistSection;
