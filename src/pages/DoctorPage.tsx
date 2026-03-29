import { Award, GraduationCap, MapPin, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import doctorPortrait from "@/assets/doctor-portrait.jpg";

const education = [
  "Medico - Pontificia Universidad Catolica de Chile",
  "Medico - Universita degli Studi di Catania, Italia",
  "Especialista en Cirugia Cabeza, Cuello y Maxilofacial - Universita degli Studi di Messina, Italia",
  "Master en Cirugia Estetica - Fondazione Fatenebenefratelli, Roma, Italia",
  "Master en Cirugia Reconstructiva Mamaria - Humanitas Milano, Italia",
  "Master en Rinoplastia - Universita Cattolica di Roma, Italia",
  "Master en Contorno Corporal Total Definer - Bogota, Colombia",
];

const awards = [
  { title: "Mejor Cirujano EACMFS 2010", location: "Brujas, Belgica" },
  { title: "Premio Folador SIES", location: "Bolona, Italia 2015" },
  { title: "Premio Antiaging Medical Congress", location: "Roma 2015" },
  { title: "Mejor Cirujano Plastico Facial 2023", location: "AMWC World Congress, Monaco" },
];

const DoctorPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-background pt-32 section-padding">
        <div className="container-premium">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <ScrollReveal>
              <div>
                <p className="subtitle-premium mb-4">El Doctor</p>
                <h1 className="heading-display mb-6 text-foreground">Dr. Sebastian Torres</h1>
                <div className="divider-accent mb-8" />
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Cirujano estetico con formacion y reconocimiento internacional. Con decadas de
                  experiencia y miles de procedimientos realizados, el Dr. Torres combina precision
                  quirurgica con una vision artistica para lograr resultados naturales y armonicos.
                </p>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Su formacion abarca las mejores instituciones de Europa y Latinoamerica, con
                  especializaciones en cirugia facial, corporal y reconstructiva.
                </p>
                <p className="text-sm text-muted-foreground">
                  <Shield className="mr-2 inline text-primary" size={14} />
                  Miembro del Colegio Medico de Chile - RCM 40135-8
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="aspect-[3/4] overflow-hidden rounded-lg">
                <img
                  src={doctorPortrait}
                  alt="Dr. Sebastian Torres"
                  className="h-full w-full object-cover"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="bg-muted section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <p className="subtitle-premium mb-4">Formacion</p>
              <h2 className="heading-section mb-4 text-foreground">Educacion Internacional</h2>
              <div className="divider-accent mx-auto" />
            </div>
          </ScrollReveal>

          <div className="mx-auto max-w-3xl space-y-6">
            {education.map((item, index) => (
              <ScrollReveal key={item} delay={index * 0.05}>
                <div className="card-premium flex items-start gap-4 p-6">
                  <GraduationCap className="mt-0.5 shrink-0 text-primary" size={20} />
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background section-padding">
        <div className="container-premium">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <p className="subtitle-premium mb-4">Reconocimiento</p>
              <h2 className="heading-section mb-4 text-foreground">Premios Internacionales</h2>
              <div className="divider-accent mx-auto" />
            </div>
          </ScrollReveal>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            {awards.map((award, index) => (
              <ScrollReveal key={award.title} delay={index * 0.1}>
                <div className="card-premium p-8 text-center">
                  <Award className="mx-auto mb-4 text-accent" size={32} strokeWidth={1.5} />
                  <h3 className="mb-2 font-serif text-lg font-medium text-foreground">
                    {award.title}
                  </h3>
                  <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <MapPin size={12} /> {award.location}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DoctorPage;
