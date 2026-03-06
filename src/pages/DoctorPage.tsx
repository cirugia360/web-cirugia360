import { Award, GraduationCap, Globe, Shield, Star, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ContactModalButton } from "@/components/ContactModalProvider";
import doctorPortrait from "@/assets/doctor-portrait.jpg";
import clinicInterior from "@/assets/clinic-interior.jpg";

const education = [
  "Médico — Pontificia Universidad Católica de Chile",
  "Médico — Università degli Studi di Catania, Italia",
  "Especialista en Cirugía Cabeza, Cuello y Maxilofacial — Università degli Studi di Messina, Italia",
  "Master en Cirugía Estética — Fondazione Fatenebenefratelli, Roma, Italia",
  "Master en Cirugía Reconstructiva Mamaria — Humanitas Milano, Italia",
  "Master en Rinoplastía — Università Cattolica di Roma, Italia",
  "Master en Contorno Corporal Total Definer — Bogotá, Colombia",
];

const awards = [
  { title: "Mejor Cirujano EACMFS 2010", location: "Brujas, Bélgica" },
  { title: "Premio Folador SIES", location: "Boloña, Italia 2015" },
  { title: "Premio Antiaging Medical Congress", location: "Roma 2015" },
  { title: "Mejor Cirujano Plástico Facial 2023", location: "AMWC World Congress, Monaco" },
];

const DoctorPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 section-padding bg-background">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <div>
                <p className="subtitle-premium mb-4">El Doctor</p>
                <h1 className="heading-display text-foreground mb-6">Dr. Sebastián Torres</h1>
                <div className="divider-accent mb-8" />
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Cirujano estético con formación y reconocimiento internacional. Con décadas de experiencia y miles de procedimientos realizados, el Dr. Torres combina precisión quirúrgica con una visión artística para lograr resultados naturales y armónicos.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Su formación abarca las mejores instituciones de Europa y Latinoamérica, con especializaciones en cirugía facial, corporal y reconstructiva.
                </p>
                <p className="text-sm text-muted-foreground">
                  <Shield className="inline mr-2 text-primary" size={14} />
                  Miembro del Colegio Médico de Chile · RCM 40135-8
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="aspect-[3/4] rounded-lg overflow-hidden">
                <img src={doctorPortrait} alt="Dr. Sebastián Torres" className="w-full h-full object-cover" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="section-padding bg-muted">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="subtitle-premium mb-4">Formación</p>
              <h2 className="heading-section text-foreground mb-4">Educación Internacional</h2>
              <div className="divider-accent mx-auto" />
            </div>
          </ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-6">
            {education.map((edu, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <div className="flex items-start gap-4 card-premium p-6">
                  <GraduationCap className="text-primary flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-foreground">{edu}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="section-padding bg-background">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="subtitle-premium mb-4">Reconocimiento</p>
              <h2 className="heading-section text-foreground mb-4">Premios Internacionales</h2>
              <div className="divider-accent mx-auto" />
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {awards.map((award, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="card-premium p-8 text-center">
                  <Award className="text-accent mx-auto mb-4" size={32} strokeWidth={1.5} />
                  <h3 className="font-serif text-lg font-medium text-foreground mb-2">{award.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin size={12} /> {award.location}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic */}
      <section className="section-padding bg-muted">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <div className="aspect-[4/3] rounded-lg overflow-hidden">
                <img src={clinicInterior} alt="Clínica Cirugia360" className="w-full h-full object-cover" />
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div>
                <p className="subtitle-premium mb-4">La Clínica</p>
                <h2 className="heading-section text-foreground mb-6">Excelencia en Cada Detalle</h2>
                <div className="divider-accent mb-8" />
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Nuestra clínica cuenta con instalaciones de última generación, equipamiento médico de vanguardia y un equipo multidisciplinario comprometido con los más altos estándares de seguridad y calidad.
                </p>
                <ContactModalButton className="btn-premium">Agendar Evaluación</ContactModalButton>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DoctorPage;
