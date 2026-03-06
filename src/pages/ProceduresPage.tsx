import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ChevronRight } from "lucide-react";
import operatingRoom from "@/assets/operating-room.jpg";
import technology from "@/assets/technology.jpg";
import clinicInterior from "@/assets/clinic-interior.jpg";
import marcacionCover from "@/assets/marcacion.jpeg";
import rinoplastiaCover from "@/assets/rinoplastia.jpeg";
import subcisionCover from "@/assets/subcision.jpeg";

const allProcedures = [
  { title: "Marcación Nivel Dios", desc: "Liposucción de alta definición avanzada para contorno corporal masculino.", href: "/marcacion-nivel-dios", image: marcacionCover },
  { title: "Torres Rhinoplasty", desc: "Rinoplastía armónica y natural con más de 5000 procedimientos.", href: "/torres-rhinoplasty", image: rinoplastiaCover },
  { title: "Subcision Magic", desc: "Solución definitiva para celulitis profunda.", href: "/subcision-magic", image: subcisionCover },
  { title: "Lifting Facial", desc: "Rejuvenecimiento facial con técnicas mínimamente invasivas.", href: "/procedimientos", image: operatingRoom },
  { title: "Blefaroplastía", desc: "Cirugía de párpados para una mirada rejuvenecida y natural.", href: "/procedimientos", image: technology },
  { title: "Liposucción", desc: "Remodelación corporal con tecnología avanzada.", href: "/procedimientos", image: clinicInterior },
];

const ProceduresPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="subtitle-premium mb-4">Especialidades</p>
              <h1 className="heading-display text-foreground mb-4">Procedimientos</h1>
              <div className="divider-accent mx-auto mb-6" />
              <p className="text-muted-foreground max-w-xl mx-auto">Cada procedimiento es personalizado para lograr resultados naturales y armónicos.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allProcedures.map((proc, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <Link to={proc.href} className="group block">
                  <div className="card-premium overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={proc.image} alt={proc.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-8">
                      <h3 className="font-serif text-xl font-medium text-foreground mb-3">{proc.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{proc.desc}</p>
                      <span className="inline-flex items-center gap-2 text-xs font-sans font-medium tracking-wider uppercase text-primary">
                        Conocer más <ChevronRight size={14} />
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
