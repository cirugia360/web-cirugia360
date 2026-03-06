import { Check, MessageCircle } from "lucide-react";
import { ContactModalButton } from "@/components/ContactModalProvider";
import ScrollReveal from "@/components/ScrollReveal";
import { defaultWhatsappMessage, whatsappNumber } from "@/pages/marcacionData";

type MarcacionClosingProps = {
  showMobileStickyCta: boolean;
};

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

const ctaHighlights = [
  "Sin compromiso",
  "Evaluación personalizada",
  "Respuesta en menos de 24h",
  "Cupos limitados por mes",
];

const sideBySideButtonClassName =
  "inline-flex w-full items-center justify-center rounded-sm px-8 py-4 text-sm font-sans font-medium uppercase tracking-[0.18em] transition-all duration-300 hover:-translate-y-0.5 sm:w-[280px]";

const MarcacionClosing = ({ showMobileStickyCta }: MarcacionClosingProps) => (
  <>
    <section id="evaluacion" className="scroll-mt-28 bg-primary">
      <div className="container-premium section-padding">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg border border-background/15 bg-foreground p-8 text-background shadow-[0_24px_70px_rgba(18,24,38,0.18)] lg:p-10">
              <p className="subtitle-premium mb-4 text-accent">Tu evaluación</p>
              <h3 className="font-serif text-3xl font-medium leading-tight text-background">
                Marcación Nivel Dios empieza con una evaluación clara
              </h3>
              <div className="mt-8 grid gap-3">
                {ctaHighlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-sm border border-background/10 bg-background/5 px-4 py-3 text-sm text-background/78"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent">
                      <Check size={14} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-background/62">
                Respuesta rápida del equipo · Orientación inicial según tu anatomía y objetivos
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="mx-auto mt-16 max-w-3xl text-center">
            <h2 className="heading-section text-primary-foreground md:text-5xl">
              ¿Listo para transformar tu contorno corporal?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-primary-foreground">
              Agenda tu evaluación y descubre cómo la técnica Marcación Nivel Dios puede ayudarte a lograr la
              definición que siempre buscaste.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ContactModalButton className={`${sideBySideButtonClassName} bg-background text-foreground hover:shadow-lg`}>
                AGENDAR EVALUACIÓN
              </ContactModalButton>
              <a
                href={buildWhatsAppUrl(defaultWhatsappMessage)}
                target="_blank"
                rel="noreferrer"
                className={`${sideBySideButtonClassName} gap-2 border-[2.5px] border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary`}
              >
                <MessageCircle size={18} />
                O escríbenos por WhatsApp
              </a>
            </div>
            <p className="mt-5 text-sm text-primary-foreground">
              Sin compromiso · Evaluación personalizada · Respuesta en menos de 24h · Cupos limitados por mes
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-10px_30px_rgba(18,24,38,0.08)] backdrop-blur transition-transform duration-300 md:hidden ${
        showMobileStickyCta ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <ContactModalButton className="btn-premium w-full px-6 py-3">
        AGENDAR EVALUACIÓN
      </ContactModalButton>
    </div>
  </>
);

export default MarcacionClosing;
