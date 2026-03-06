import { CheckCircle, Award, Heart, Clock, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Counter from "@/components/Counter";
import { ContactModalButton } from "@/components/ContactModalProvider";
import clinicInterior from "@/assets/clinic-interior.jpg";
import technology from "@/assets/technology.jpg";

const SubcisionPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-primary-dark" />
        <div className="relative container-premium section-padding pt-32">
          <div className="max-w-2xl mx-auto text-center">
            <p className="subtitle-premium text-accent mb-4">Subcision Magic</p>
            <h1 className="heading-display text-background mb-6">La solución definitiva para tratar la celulitis</h1>
            <p className="text-lg text-background/70 font-sans leading-relaxed mb-10">
              Técnica avanzada para liberar las adherencias responsables de la celulitis profunda.
            </p>
            <ContactModalButton className="btn-premium">Agendar Evaluación</ContactModalButton>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section-padding bg-background">
        <div className="container-premium max-w-4xl text-center">
          <ScrollReveal>
            <p className="subtitle-premium mb-4">El Problema</p>
            <h2 className="heading-section text-foreground mb-6">Celulitis que no responde a tratamientos convencionales</h2>
            <div className="divider-accent mx-auto mb-8" />
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              La celulitis afecta a la gran mayoría de las mujeres. Los tratamientos convencionales como cremas, masajes y radiofrecuencia externa ofrecen resultados temporales e insuficientes. La causa real son las adherencias fibrosas bajo la piel.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Solution */}
      <section className="section-padding bg-muted">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <div>
                <p className="subtitle-premium mb-4">La Solución</p>
                <h2 className="heading-section text-foreground mb-6">Subcisión Avanzada</h2>
                <div className="divider-accent mb-8" />
                <p className="text-muted-foreground leading-relaxed mb-6">
                  La técnica Subcision Magic libera las adherencias fibrosas responsables de la celulitis de manera precisa y controlada, permitiendo que la piel recupere su suavidad natural.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Heart, text: "Resultados estables y duraderos" },
                    { icon: Clock, text: "Recuperación rápida" },
                    { icon: Shield, text: "Procedimiento mínimamente invasivo" },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Icon className="text-primary flex-shrink-0" size={18} />
                      <p className="text-sm text-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="aspect-[4/3] rounded-lg overflow-hidden">
                <img src={clinicInterior} alt="Clínica" className="w-full h-full object-cover" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding bg-foreground">
        <div className="container-premium text-center">
          <ScrollReveal>
            <p className="subtitle-premium text-accent mb-4">Experiencia</p>
            <h2 className="heading-section text-background mb-12">Miles de Pacientes Satisfechas</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <ScrollReveal delay={0.1}>
              <div className="text-background"><Counter target={4000} suffix="+" /></div>
              <p className="text-sm text-background/60 mt-2">Pacientes tratados</p>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="text-background"><Counter target={15} suffix="+" /></div>
              <p className="text-sm text-background/60 mt-2">Años de experiencia</p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="text-background"><Counter target={98} suffix="%" /></div>
              <p className="text-sm text-background/60 mt-2">Satisfacción</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-premium text-center">
          <ScrollReveal>
            <h2 className="heading-section text-primary-foreground mb-6">
              Libérate de la celulitis de manera definitiva
            </h2>
            <p className="text-primary-foreground/70 font-sans mb-10 max-w-xl mx-auto">
              Agenda tu evaluación y descubre cómo la técnica Subcision Magic puede transformar la textura de tu piel.
            </p>
            <ContactModalButton className="inline-flex items-center justify-center px-10 py-4 rounded-sm font-sans font-medium text-sm tracking-widest uppercase bg-background text-foreground transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5" style={{letterSpacing:"0.1em"}}>
              Agendar Evaluación
            </ContactModalButton>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SubcisionPage;
