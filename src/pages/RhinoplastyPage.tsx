import { CheckCircle, Award, Eye, Smile, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Counter from "@/components/Counter";
import { ContactModalButton } from "@/components/ContactModalProvider";
import heroDoctor from "@/assets/hero-doctor.jpg";
import operatingRoom from "@/assets/operating-room.jpg";

const RhinoplastyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroDoctor} alt="Rinoplastía" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-transparent" />
        </div>
        <div className="relative container-premium section-padding pt-32">
          <div className="max-w-2xl">
            <p className="subtitle-premium text-accent mb-4">Torres Rhinoplasty</p>
            <h1 className="heading-display text-background mb-6">Rinoplastía armónica y natural</h1>
            <p className="text-lg text-background/70 font-sans leading-relaxed mb-10">
              Más de 5000 rinoplastías realizadas con resultados consistentes y naturales.
            </p>
            <ContactModalButton className="btn-premium">Agendar Evaluación</ContactModalButton>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section-padding bg-background">
        <div className="container-premium max-w-4xl text-center">
          <ScrollReveal>
            <p className="subtitle-premium mb-4">El Desafío</p>
            <h2 className="heading-section text-foreground mb-6">¿Buscas mejorar tu nariz sin perder naturalidad?</h2>
            <div className="divider-accent mx-auto mb-8" />
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Muchos pacientes desean mejorar la apariencia de su nariz pero temen un resultado artificial o desproporcionado. La rinoplastía requiere un cirujano con visión artística y experiencia excepcional.
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
                <h2 className="heading-section text-foreground mb-6">Rinoplastía Personalizada</h2>
                <div className="divider-accent mb-8" />
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Cada nariz es única. El Dr. Torres diseña un plan quirúrgico personalizado que respeta la armonía facial de cada paciente, logrando resultados que lucen naturales y mejoran la proporción estética del rostro.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Smile, text: "Armonía facial completa" },
                    { icon: Eye, text: "Mejor proporción estética" },
                    { icon: Sparkles, text: "Resultados naturales y duraderos" },
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
                <img src={operatingRoom} alt="Quirófano" className="w-full h-full object-cover" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding bg-foreground">
        <div className="container-premium text-center">
          <ScrollReveal>
            <p className="subtitle-premium text-accent mb-4">Credenciales</p>
            <h2 className="heading-section text-background mb-12">Resultados que Hablan</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <ScrollReveal delay={0.1}>
              <div className="text-background"><Counter target={5000} suffix="+" /></div>
              <p className="text-sm text-background/60 mt-2">Rinoplastías realizadas</p>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="text-background stat-number">&lt;1%</div>
              <p className="text-sm text-background/60 mt-2">Tasa de revisión</p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="text-background"><Counter target={4} /></div>
              <p className="text-sm text-background/60 mt-2">Premios internacionales</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="section-padding bg-background">
        <div className="container-premium max-w-3xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="subtitle-premium mb-4">Reconocimiento</p>
              <h2 className="heading-section text-foreground">Premios Internacionales</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Master en Rinoplastía", loc: "Università Cattolica di Roma, Italia" },
              { title: "Mejor Cirujano Plástico Facial 2023", loc: "AMWC World Congress, Monaco" },
              { title: "Mejor Cirujano EACMFS 2010", loc: "Brujas, Bélgica" },
              { title: "Premio Folador SIES", loc: "Boloña, Italia 2015" },
            ].map((a, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="card-premium p-6 text-center">
                  <Award className="text-accent mx-auto mb-3" size={24} />
                  <h3 className="font-serif text-sm font-medium text-foreground mb-1">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">{a.loc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-premium text-center">
          <ScrollReveal>
            <h2 className="heading-section text-primary-foreground mb-6">
              Descubre cómo lograr la nariz que siempre soñaste
            </h2>
            <p className="text-primary-foreground/70 font-sans mb-10 max-w-xl mx-auto">
              Agenda tu evaluación con el equipo del Dr. Torres y da el primer paso hacia una armonía facial perfecta.
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

export default RhinoplastyPage;
