import { MessageCircle } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { ContactModalButton } from "@/components/ContactModalProvider";

type ClosingValuationSectionProps = {
  title: string;
  description: string;
  whatsappHref: string;
  sectionId?: string;
  subtitle?: string;
  buttonText?: string;
  whatsappText?: string;
  highlightText?: string;
  footerText?: string;
};

const ClosingValuationSection = ({
  title,
  description,
  whatsappHref,
  sectionId,
  subtitle = "Cierre de valoración",
  buttonText = "Agendar valoración",
  whatsappText = "O escríbenos por WhatsApp",
  highlightText = "Cupos limitados · Valoraciones personalizadas",
  footerText = "Sin compromiso · Valoración personalizada · Respuesta en menos de 24h",
}: ClosingValuationSectionProps) => (
  <section id={sectionId} className="scroll-mt-28 bg-foreground">
    <div className="container-premium section-padding max-w-5xl text-center">
      <ScrollReveal>
        <p className="subtitle-premium text-accent">{subtitle}</p>
        <h2 className="heading-section mt-4 text-background">{title}</h2>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-background/72">{description}</p>
        <p className="mt-4 text-sm uppercase tracking-[0.2em] text-accent">{highlightText}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <ContactModalButton className="inline-flex items-center justify-center rounded-sm border border-background/60 px-10 py-4 text-sm font-medium uppercase tracking-[0.18em] text-background transition-all duration-300 hover:bg-background hover:text-foreground">
            {buttonText}
          </ContactModalButton>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-background/80 transition-colors hover:text-background"
          >
            <MessageCircle size={18} />
            {whatsappText}
          </a>
        </div>
        <p className="mt-6 text-sm text-background/55">{footerText}</p>
      </ScrollReveal>
    </div>
  </section>
);

export default ClosingValuationSection;
