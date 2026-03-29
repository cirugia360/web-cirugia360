import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ContactModalButton } from "@/components/ContactModalProvider";

const buildCases = (folder: string, title: string, files: string[]) =>
  files.map((file, index) => ({
    id: `${folder}-${index + 1}`,
    label: `Caso ${index + 1}`,
    src: `/images/results/${folder}/${file}`,
    alt: `Resultado real de ${title}, caso ${index + 1}`,
  }));

const resultCollections = [
  {
    id: "torres-rhinoplasty",
    title: "Torres Rhinoplasty",
    eyebrow: "Rinoplastia",
    description:
      "Casos reales de rinoplastia con foco en armonia facial, definicion de punta y resultados naturales.",
    href: "/torres-rhinoplasty",
    cases: buildCases("torres-rhinoplasty", "Torres Rhinoplasty", [
      "1.png",
      "2.JPG",
      "3.JPG",
      "4.JPG",
      "5.JPG",
      "6.JPG",
      "7.JPG",
      "8.jpg",
      "9.JPG",
      "10.JPG",
    ]),
  },
  {
    id: "mnd",
    title: "Marcacion Nivel Dios",
    eyebrow: "Lipoescultura HD",
    description:
      "Resultados de marcacion abdominal y contorno corporal masculino con definicion avanzada y transiciones anatomicas limpias.",
    href: "/marcacion-nivel-dios",
    cases: buildCases("mnd", "Marcacion Nivel Dios", [
      "1.png",
      "2.png",
      "3.JPG",
      "4.jpg",
      "5.JPG",
      "6.JPG",
      "7.JPG",
      "8.JPG",
      "9.JPG",
      "10.JPG",
    ]),
  },
  {
    id: "subcision-magic",
    title: "Subcision Magic",
    eyebrow: "Celulitis",
    description:
      "Evolucion de pacientes tratados por celulitis profunda con subcision, liberacion de septos y mejoria visible del relieve cutaneo.",
    href: "/subcision-magic",
    cases: buildCases("subcision-magic", "Subcision Magic", [
      "1.JPG",
      "2.JPG",
      "3.JPG",
      "4.JPG",
      "5.JPG",
      "6.JPG",
      "7.JPG",
      "8.JPG",
      "9.JPG",
      "10.JPG",
    ]),
  },
];

const categories = ["Todos", ...resultCollections.map((collection) => collection.title)];

const ResultsPage = () => {
  const [active, setActive] = useState("Todos");
  const visibleCollections =
    active === "Todos"
      ? resultCollections
      : resultCollections.filter((collection) => collection.title === active);

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
                  key={category}
                  type="button"
                  aria-pressed={active === category}
                  onClick={() => setActive(category)}
                  className={`rounded-sm px-6 py-2 text-xs font-sans uppercase tracking-wider transition-all duration-300 ${
                    active === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mb-16 rounded-lg border border-border/70 bg-muted/60 p-6 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Haz clic en cada imagen para verla en mayor tamano. Las fotografias corresponden a
                pacientes reales y el resultado final siempre depende de la evaluacion, la tecnica y
                el postoperatorio de cada caso.
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
                      <p className="text-muted-foreground">{collection.description}</p>
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

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {collection.cases.map((result, index) => (
                    <ScrollReveal key={result.id} delay={Math.min(index * 0.05, 0.25)}>
                      <figure className="card-premium overflow-hidden">
                        <a
                          href={result.src}
                          target="_blank"
                          rel="noreferrer"
                          className="group block"
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
                                {collection.eyebrow}
                              </span>
                              <p className="mt-2 text-sm text-foreground">{result.label}</p>
                            </div>
                            <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-primary">
                              Abrir
                            </span>
                          </figcaption>
                        </a>
                      </figure>
                    </ScrollReveal>
                  ))}
                </div>
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
