import ClosingValuationSection from "@/components/landing/ClosingValuationSection";
import { ContactModalButton } from "@/components/ContactModalProvider";
import { defaultWhatsappMessage, whatsappNumber } from "@/pages/liposuccionData";

type LiposuccionClosingProps = {
  showMobileStickyCta: boolean;
};

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

const LiposuccionClosing = ({ showMobileStickyCta }: LiposuccionClosingProps) => (
  <>
    <ClosingValuationSection
      sectionId="evaluacion"
      title="Listo para un contorno mas limpio, armonico y proporcionado?"
      description="Agenda tu evaluacion y descubre si la liposuccion es el procedimiento indicado para corregir grasa localizada y mejorar tu silueta segun tu anatomia."
      whatsappHref={buildWhatsAppUrl(defaultWhatsappMessage)}
      buttonText="Agendar evaluacion"
      highlightText="Cupos limitados | Evaluaciones personalizadas"
      footerText="Sin compromiso | Evaluacion personalizada | Respuesta en menos de 24h"
    />

    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-10px_30px_rgba(18,24,38,0.08)] backdrop-blur transition-transform duration-300 md:hidden ${
        showMobileStickyCta ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <ContactModalButton className="btn-premium w-full px-6 py-3">
        AGENDAR EVALUACION
      </ContactModalButton>
    </div>
  </>
);

export default LiposuccionClosing;
