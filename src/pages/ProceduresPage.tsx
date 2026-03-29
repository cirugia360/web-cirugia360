import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import marcacionCover from "@/assets/marcacion.jpeg";
import rinoplastiaCover from "@/assets/rinoplastia.jpeg";
import subcisionCover from "@/assets/subcision.jpeg";

const liftingCover = "/images/lifting.png";
const blefaroplastiaCover = "/images/blefaroplastia.png";
const liposuccionCover = "/images/liposuccion.png";

const allProcedures = [
  {
    title: "Marcacion Nivel Dios",
    desc: "Liposuccion de alta definicion avanzada para contorno corporal masculino.",
    href: "/marcacion-nivel-dios",
    image: marcacionCover,
  },
  {
    title: "Torres Rhinoplasty",
    desc: "Rinoplastia armonica y natural con mas de 5000 procedimientos.",
    href: "/torres-rhinoplasty",
    image: rinoplastiaCover,
  },
  {
    title: "Subcision Magic",
    desc: "Solucion definitiva para celulitis profunda.",
    href: "/subcision-magic",
    image: subcisionCover,
  },
  {
    title: "Lifting Facial",
    desc: "Rejuvenecimiento facial con tecnicas minimamente invasivas.",
    href: "/procedimientos",
    image: liftingCover,
  },
  {
    title: "Blefaroplastia",
    desc: "Cirugia de parpados para una mirada rejuvenecida y natural.",
    href: "/procedimientos",
    image: blefaroplastiaCover,
  },
  {
    title: "Liposuccion",
    desc: "Remodelacion corporal con tecnologia avanzada.",
    href: "/procedimientos",
    image: liposuccionCover,
  },
];

const ProceduresPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <p className="subtitle-premium mb-4">Especialidades</p>
              <h1 className="heading-display mb-4 text-foreground">Procedimientos</h1>
              <div className="divider-accent mx-auto mb-6" />
              <p className="mx-auto max-w-xl text-muted-foreground">
                Cada procedimiento es personalizado para lograr resultados naturales y armonicos.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {allProcedures.map((procedure, index) => (
              <ScrollReveal key={procedure.title} delay={index * 0.08}>
                <Link to={procedure.href} className="group block">
                  <div className="card-premium overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={procedure.image}
                        alt={procedure.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-8">
                      <h3 className="mb-3 font-serif text-xl font-medium text-foreground">
                        {procedure.title}
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                        {procedure.desc}
                      </p>
                      <span className="inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-wider text-primary">
                        Conocer mas <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ProceduresPage;
