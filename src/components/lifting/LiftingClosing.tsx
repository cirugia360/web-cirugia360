import ClosingValuationSection from "@/components/landing/ClosingValuationSection";
import { ContactModalButton } from "@/components/ContactModalProvider";

type LiftingClosingProps = {
  showMobileStickyCta: boolean;
};

const LiftingClosing = ({ showMobileStickyCta }: LiftingClosingProps) => (
  <>
    <ClosingValuationSection
      sectionId="evaluacion"
      title="Listo para verte mas fresco, definido y natural?"
      description="Agenda tu evaluacion y descubre si un lifting facial es el procedimiento indicado para rejuvenecer rostro y cuello segun tu anatomia."
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

export default LiftingClosing;
