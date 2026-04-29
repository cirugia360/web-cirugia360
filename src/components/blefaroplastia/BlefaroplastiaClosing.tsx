import ClosingValuationSection from "@/components/landing/ClosingValuationSection";
import { ContactModalButton } from "@/components/ContactModalProvider";

type BlefaroplastiaClosingProps = {
  showMobileStickyCta: boolean;
};

const BlefaroplastiaClosing = ({ showMobileStickyCta }: BlefaroplastiaClosingProps) => (
  <>
    <ClosingValuationSection
      sectionId="evaluacion"
      title="Listo para una mirada mas limpia, fresca y descansada?"
      description="Agenda tu evaluacion y descubre si la blefaroplastia es el procedimiento indicado para corregir parpados pesados, bolsas y mirada cansada segun tu anatomia."
      highlightText="Cupos limitados | Evaluaciones personalizadas"
      footerText="Sin compromiso | Evaluacion personalizada | Respuesta en menos de 24h"
    />

    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-10px_30px_rgba(18,24,38,0.08)] backdrop-blur transition-transform duration-300 md:hidden ${
        showMobileStickyCta ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <ContactModalButton className="btn-premium w-full px-6 py-3">
        Agendar evaluación
      </ContactModalButton>
    </div>
  </>
);

export default BlefaroplastiaClosing;
