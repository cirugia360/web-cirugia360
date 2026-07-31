import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  BadgePercent,
  CalendarCheck,
  ChevronRight,
  Clock3,
  Globe,
  GraduationCap,
  Shield,
  Star,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Counter from "@/components/Counter";
import { ContactModalButton } from "@/components/ContactModalProvider";
import marcacionCover from "@/assets/marcacion.jpeg";
import rinoplastiaCover from "@/assets/rinoplastia.jpeg";
import subcisionCover from "@/assets/subcision.jpeg";

const technology = "/images/Bodytite.webp";
const heroDoctorImages = {
  avif:
    "/images/home/hero-doctor-768.avif 768w, /images/home/hero-doctor-1280.avif 1280w, /images/home/hero-doctor-1920.avif 1920w",
  webp:
    "/images/home/hero-doctor-768.webp 768w, /images/home/hero-doctor-1280.webp 1280w, /images/home/hero-doctor-1920.webp 1920w",
  fallback: "/images/home/hero-doctor-1280.webp",
  sizes: "100vw",
};

const credentials = [
  { icon: GraduationCap, title: "Médico", desc: "Pontificia Universidad Católica de Chile" },
  { icon: Shield, title: "Colegio Médico de Chile", desc: "RCM 40135-8" },
  { icon: Globe, title: "Médico - Università degli Studi di Catania", desc: "Título válido en Comunidad Europea, Suiza, Mónaco y Reino Unido" },
  { icon: GraduationCap, title: "Especialista Cirugía Cabeza, Cuello y Maxilofacial", desc: "Università degli Studi di Messina, Italia" },
  { icon: Star, title: "Master en Cirugía Estética", desc: "Fondazione Fatenebenefratelli, Roma, Italia" },
  { icon: Star, title: "Master en Cirugía Reconstructiva Mamaria", desc: "Humanitas Milano, Italia" },
  { icon: Star, title: "Master en Rinoplastía", desc: "Università Cattolica di Roma, Italia" },
  { icon: Star, title: "Master en Contorno Corporal Total Definer", desc: "Bogotá, Colombia" },
];

const memberships = [
  "Sociedad Italiana de Cirugía Plástica (AICPE)",
  "Sociedad Europea de Cirugía Plástica Facial (EAFPS)",
  "Sociedad Americana de Cirugía Plástica",
  "Miembro honorario de SOCHIMCE",
];

const awards = [
  { title: "Mejor Cirujano EACMFS 2010", location: "Brujas, Bélgica" },
  { title: "Premio Folador SIES", location: "Boloña, Italia 2015" },
  { title: "Premio Antiaging Medical Congress", location: "Roma 2015" },
  { title: "Mejor Cirujano Plástico Facial 2023", location: "AMWC World Congress, Monaco" },
];

const procedures = [
  {
    title: "Marcación Nivel Dios",
    desc: "Liposucción de alta definición que redefine el contorno corporal masculino con precisión quirúrgica.",
    href: "/marcacion-nivel-dios",
    image: marcacionCover,
  },
  {
    title: "Torres Rhinoplasty",
    desc: "Rinoplastía armónica y natural con más de 5000 procedimientos realizados.",
    href: "/torres-rhinoplasty",
    image: rinoplastiaCover,
  },
  {
    title: "Subcision Magic",
    desc: "La solución definitiva para tratar la celulitis profunda con técnica avanzada.",
    href: "/subcision-magic",
    image: subcisionCover,
  },
];

const stats = [
  { number: 5000, suffix: "+", label: "Rinoplastías realizadas" },
  { number: 1, suffix: "%", prefix: "<", label: "Tasa de revisión" },
  { number: 1500, suffix: "+", label: "Casos de marcación abdominal" },
  { number: 4000, suffix: "+", label: "Pacientes tratados en celulitis" },
];

const bookingHighlights = [
  {
    icon: BadgePercent,
    title: "50% OFF este mes",
    desc: "Evaluación médica a $50.000, antes $100.000.",
  },
  {
    icon: CalendarCheck,
    title: "Toma tu hora online",
    desc: "Haz clic en Agendar Evaluación y elige fecha y hora online.",
  },
  {
    icon: Clock3,
    title: "Por tiempo limitado",
    desc: "Promoción activa solo este mes, con pocos cupos disponibles.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-28 md:pb-24">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <picture className="block h-full w-full">
            <source type="image/avif" srcSet={heroDoctorImages.avif} sizes={heroDoctorImages.sizes} />
            <source type="image/webp" srcSet={heroDoctorImages.webp} sizes={heroDoctorImages.sizes} />
            <img
              src={heroDoctorImages.fallback}
              alt="Dr. Sebastián Torres"
              width={1920}
              height={1080}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover object-top"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        <div className="relative container-premium section-padding pt-32">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="subtitle-premium text-accent mb-6"
            >
              Dr. Sebastián Torres
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="heading-display text-background mb-6"
            >
              Cirugía estética de precisión internacional
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-6 max-w-lg font-sans text-lg leading-relaxed text-background/70"
            >
              Resultados naturales, tecnología avanzada y décadas de experiencia quirúrgica.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.42 }}
              className="mb-8 max-w-xl border-l-2 border-accent pl-4 text-background"
            >
              <p className="text-xs font-sans font-semibold uppercase tracking-[0.22em] text-accent">
                POCOS CUPOS | 50% OFF ESTE MES
              </p>
              <p className="mt-2 text-base font-medium leading-relaxed text-background">
                Evaluación médica a $50.000 por tiempo limitado. Toma tu hora en el botón
                Agendar Evaluación y elige fecha y hora online.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <ContactModalButton className="btn-premium">Tomar Hora 50% OFF</ContactModalButton>
              <Link to="/procedimientos" className="btn-outline-premium border-background/30 text-background hover:bg-background hover:text-foreground">
                Ver Procedimientos
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-background">
        <div className="container-premium grid gap-6 px-6 py-8 md:grid-cols-3 md:px-12 lg:px-20">
          {bookingHighlights.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <item.icon size={18} />
              </div>
              <div>
                <p className="font-serif text-base font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Credentials */}
      <section className="section-padding bg-background">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="subtitle-premium mb-4">Formación & Reconocimiento</p>
              <h2 className="heading-section text-foreground mb-4">Credenciales de Prestigio Internacional</h2>
              <div className="divider-accent mx-auto" />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {credentials.map((cred, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <div className="card-premium p-6 h-full">
                  <cred.icon className="text-primary mb-4" size={28} strokeWidth={1.5} />
                  <h3 className="font-serif text-base font-medium text-foreground mb-2">{cred.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cred.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Memberships & Awards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <ScrollReveal>
              <div>
                <h3 className="font-serif text-2xl font-medium text-foreground mb-6">Sociedades Médicas</h3>
                <div className="space-y-4">
                  {memberships.map((m, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Shield className="text-primary mt-0.5 flex-shrink-0" size={16} />
                      <p className="text-sm text-muted-foreground">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div>
                <h3 className="font-serif text-2xl font-medium text-foreground mb-6">Premios & Reconocimientos</h3>
                <div className="space-y-4">
                  {awards.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Award className="text-accent mt-0.5 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Procedures */}
      <section className="section-padding bg-muted">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="subtitle-premium mb-4">Especialidades</p>
              <h2 className="heading-section text-foreground mb-4">Procedimientos Destacados</h2>
              <div className="divider-accent mx-auto" />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {procedures.map((proc, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <Link to={proc.href} className="group block">
                  <div className="card-premium overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={proc.image}
                        alt={proc.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-8">
                      <h3 className="font-serif text-xl font-medium text-foreground mb-3">{proc.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{proc.desc}</p>
                      <span className="inline-flex items-center gap-2 text-xs font-sans font-medium tracking-wider uppercase text-primary">
                        Conocer Procedimiento <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding bg-foreground">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="subtitle-premium text-accent mb-4">Experiencia Quirúrgica</p>
              <h2 className="heading-section text-background mb-4">Resultados que Hablan</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div className="text-background">
                    <Counter target={stat.number} suffix={stat.suffix} prefix={stat.prefix} />
                  </div>
                  <p className="text-sm text-background/60 mt-2 font-sans">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="section-padding bg-background">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <div>
                <p className="subtitle-premium mb-4">Innovación</p>
                <h2 className="heading-section text-foreground mb-6">Tecnología de Vanguardia</h2>
                <div className="divider-accent mb-8" />
                <div className="space-y-6">
                  {[
                    { name: "Renuvion", desc: "Retracción de piel con plasma de helio para resultados superiores.", icon: Zap },
                    { name: "Bodytite", desc: "Radiofrecuencia interna para contorno corporal de alta definición.", icon: Target },
                    { name: "Ugraft", desc: "Tecnología avanzada para procedimientos mínimamente invasivos.", icon: Shield },
                  ].map((tech, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <tech.icon className="text-primary" size={18} />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-medium text-foreground mb-1">{tech.name}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{tech.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted/40">
                <img src={technology} alt="Tecnología avanzada" className="w-full h-full object-cover" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-premium text-center">
          <ScrollReveal>
            <h2 className="heading-section text-primary-foreground mb-6">
              Evaluación con 50% OFF este mes
            </h2>
            <p className="text-primary-foreground/70 font-sans mb-10 max-w-xl mx-auto">
              Toma tu hora directamente desde la web, elige fecha y hora online y paga $50.000 por tiempo limitado.
            </p>
            <ContactModalButton className="inline-flex items-center justify-center px-10 py-4 rounded-sm font-sans font-medium text-sm tracking-widest uppercase bg-background text-foreground transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5" style={{letterSpacing:"0.1em"}}>
              Tomar hora online
            </ContactModalButton>
          </ScrollReveal>
        </div>
      </section>

      <Footer />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-3 shadow-[0_-12px_32px_rgba(18,24,38,0.12)] backdrop-blur md:px-8 md:pb-4">
        <div className="container-premium flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-primary">
              POCOS CUPOS | 50% OFF ESTE MES
            </p>
            <p className="mt-1 text-sm font-medium text-foreground md:text-base">
              Evaluación médica a $50.000. Toma tu hora online.
            </p>
          </div>
          <ContactModalButton className="btn-premium w-full px-6 py-3 text-xs md:w-auto">
            Abrir agenda
          </ContactModalButton>
        </div>
      </div>
    </div>
  );
};

export default Index;
