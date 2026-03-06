import ClosingValuationSection from "@/components/landing/ClosingValuationSection";
import { ContactModalButton } from "@/components/ContactModalProvider";
import { defaultWhatsappMessage, whatsappNumber } from "@/pages/marcacionData";

type MarcacionClosingProps = {
  showMobileStickyCta: boolean;
};

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

const MarcacionClosing = ({ showMobileStickyCta }: MarcacionClosingProps) => (
  <>
    <ClosingValuationSection
      sectionId="evaluacion"
      title="¿Listo para un contorno más definido y una silueta más atlética?"
      description="Agenda tu evaluación y descubre si Marcación Nivel Dios es la técnica adecuada para lograr la definición, retracción y proyección que buscas."
      whatsappHref={buildWhatsAppUrl(defaultWhatsappMessage)}
      buttonText="Agendar evaluación"
      highlightText="Cupos limitados · Evaluaciones personalizadas"
      footerText="Sin compromiso · Evaluación personalizada · Respuesta en menos de 24h"
    />

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
