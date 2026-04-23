import { useState } from "react";
import { X } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProcedureCase } from "@/data/procedureCatalog";

type ResultsGalleryGridProps = {
  cases: ProcedureCase[];
  eyebrow: string;
  gridClassName?: string;
  delayStep?: number;
  maxDelay?: number;
};

const ResultsGalleryGrid = ({
  cases,
  eyebrow,
  gridClassName = "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3",
  delayStep = 0.05,
  maxDelay = 0.25,
}: ResultsGalleryGridProps) => {
  const [activeCase, setActiveCase] = useState<ProcedureCase | null>(null);

  return (
    <>
      <div className={gridClassName}>
        {cases.map((result, index) => (
          <ScrollReveal key={result.id} delay={Math.min(index * delayStep, maxDelay)}>
            <figure className="card-premium overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveCase(result)}
                className="group block w-full text-left"
                aria-label={`Abrir ${result.label} en popup`}
              >
                <div className="aspect-square bg-muted/35 p-4">
                  <img
                    src={result.src}
                    alt={result.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full rounded-md object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <figcaption className="flex items-center justify-between gap-4 border-t border-border/60 p-5">
                  <div>
                    <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-accent">
                      {eyebrow}
                    </span>
                    <p className="mt-2 text-sm text-foreground">{result.label}</p>
                  </div>
                  <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-primary">
                    Abrir
                  </span>
                </figcaption>
              </button>
            </figure>
          </ScrollReveal>
        ))}
      </div>

      <Dialog open={Boolean(activeCase)} onOpenChange={(open) => !open && setActiveCase(null)}>
        <DialogContent className="w-[min(94vw,1120px)] max-w-[1120px] border-white/10 bg-foreground/95 p-3 text-background shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:rounded-2xl [&>button:last-child]:hidden">
          <DialogTitle className="sr-only">{activeCase?.label ?? "Imagen ampliada"}</DialogTitle>
          <DialogDescription className="sr-only">
            {activeCase?.alt ?? "Vista ampliada del resultado seleccionado"}
          </DialogDescription>

          <DialogClose className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white transition-all duration-300 hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white/60">
            <X size={18} />
            <span className="sr-only">Cerrar popup</span>
          </DialogClose>

          {activeCase ? (
            <div className="overflow-hidden rounded-xl bg-black/25">
              <img
                src={activeCase.src}
                alt={activeCase.alt}
                className="max-h-[82vh] w-full object-contain"
              />
            </div>
          ) : null}

          {activeCase ? (
            <div className="flex items-center justify-between gap-4 px-2 pb-2 pt-3">
              <div>
                <p className="text-[11px] font-sans uppercase tracking-[0.18em] text-accent">
                  {eyebrow}
                </p>
                <p className="mt-2 text-sm text-background">{activeCase.label}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-background/65">Cerrar con X</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResultsGalleryGrid;
