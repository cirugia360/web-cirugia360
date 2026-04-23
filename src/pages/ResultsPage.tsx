import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ContactModalButton } from "@/components/ContactModalProvider";
import ResultsGalleryGrid from "@/components/results/ResultsGalleryGrid";
import {
  proceduresWithResults,
  resultsFilterParam,
} from "@/data/procedureCatalog";

const categories = [
  { id: "todos", label: "Todos" },
  ...proceduresWithResults.map((procedure) => ({
    id: procedure.id,
    label: procedure.title,
  })),
];

const ResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeParam = searchParams.get(resultsFilterParam);
  const active =
    activeParam && proceduresWithResults.some((collection) => collection.id === activeParam)
      ? activeParam
      : "todos";

  const visibleCollections =
    active === "todos"
      ? proceduresWithResults
      : proceduresWithResults.filter((collection) => collection.id === active);

  const handleFilterChange = (filterId: string) => {
    if (filterId === "todos") {
      setSearchParams({});
      return;
    }

    setSearchParams({ [resultsFilterParam]: filterId });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="subtitle-premium mb-4">Galeria clinica</p>
              <h1 className="heading-display mb-4 text-foreground">Resultados por cirugia</h1>
              <div className="divider-accent mx-auto mb-6" />
              <p className="text-muted-foreground">
                Explora resultados reales del Dr. Sebastian Torres Farr agrupados por procedimiento.
                Cada paciente tiene anatomia, objetivos y tiempos de recuperacion propios.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mb-12 flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active === category.id}
                  onClick={() => handleFilterChange(category.id)}
                  className={`rounded-sm px-6 py-2 text-xs font-sans uppercase tracking-wider transition-all duration-300 ${
                    active === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mb-16 rounded-lg border border-border/70 bg-muted/60 p-6 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Haz clic en cada imagen para verla en mayor tamano dentro de un popup y cerrarla
                con la X. Las fotografias corresponden a pacientes reales y el resultado final
                siempre depende de la evaluacion, la tecnica y el postoperatorio de cada caso.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-20">
            {visibleCollections.map((collection, collectionIndex) => (
              <section
                key={collection.id}
                id={collection.id}
                className={collectionIndex > 0 ? "border-t border-border/60 pt-20" : ""}
              >
                <ScrollReveal>
                  <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                      <p className="subtitle-premium mb-3">{collection.eyebrow}</p>
                      <h2 className="heading-section mb-3 text-foreground">{collection.title}</h2>
                      <p className="text-muted-foreground">{collection.resultsDescription}</p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <span className="rounded-full bg-muted px-4 py-2 text-xs font-sans uppercase tracking-[0.18em] text-muted-foreground">
                        {collection.cases.length} casos reales
                      </span>
                      <Link
                        to={collection.href}
                        className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80"
                      >
                        Ver procedimiento
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>

                <ResultsGalleryGrid cases={collection.cases} eyebrow={collection.eyebrow} />
              </section>
            ))}
          </div>

          <ScrollReveal>
            <div className="mt-16 text-center">
              <ContactModalButton className="btn-premium">Agendar evaluacion</ContactModalButton>
            </div>
          </ScrollReveal>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ResultsPage;
