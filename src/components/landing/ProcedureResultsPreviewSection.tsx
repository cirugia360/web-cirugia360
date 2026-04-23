import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeading from "@/components/marcacion/SectionHeading";
import ResultsGalleryGrid from "@/components/results/ResultsGalleryGrid";
import {
  buildResultsFilterHref,
  getProcedureById,
  type ProcedureId,
} from "@/data/procedureCatalog";

type ProcedureResultsPreviewSectionProps = {
  procedureId: ProcedureId;
  sectionId?: string;
  label?: string;
  title?: string;
  description?: string;
  backgroundClassName?: string;
};

const ProcedureResultsPreviewSection = ({
  procedureId,
  sectionId,
  label = "CASOS REALES",
  title,
  description,
  backgroundClassName = "bg-background",
}: ProcedureResultsPreviewSectionProps) => {
  const procedure = getProcedureById(procedureId);

  if (!procedure || procedure.previewCases.length === 0) {
    return null;
  }

  return (
    <section id={sectionId} className={`scroll-mt-28 ${backgroundClassName}`}>
      <div className="container-premium section-padding">
        <ScrollReveal>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <SectionHeading
                label={label}
                title={title ?? `Antes y despues de ${procedure.title}`}
                description={
                  description ??
                  `Revisa una muestra de resultados reales de ${procedure.title} y abre la galeria completa filtrada para este procedimiento.`
                }
                centered={false}
              />
            </div>

            <span className="inline-flex w-fit rounded-full bg-muted px-4 py-2 text-xs font-sans uppercase tracking-[0.18em] text-muted-foreground">
              {procedure.cases.length} resultados
            </span>
          </div>
        </ScrollReveal>

        <div className="mt-14">
          <ResultsGalleryGrid
            cases={procedure.previewCases}
            eyebrow={procedure.eyebrow}
            gridClassName="grid grid-cols-1 gap-6 md:grid-cols-3"
            delayStep={0.08}
            maxDelay={0.16}
          />
        </div>

        <ScrollReveal delay={0.18}>
          <div className="mt-12 text-center">
            <Link
              to={buildResultsFilterHref(procedure.id)}
              className="inline-flex items-center gap-2 rounded-sm border border-primary/20 bg-primary/10 px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              Ver mas resultados
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ProcedureResultsPreviewSection;
