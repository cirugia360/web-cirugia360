import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Dumbbell,
  Facebook,
  Instagram,
  Shield,
  Sparkles,
  Target,
  Youtube,
} from "lucide-react";
import marcacionHero from "@/assets/marcacion-hero.jpg";
import marcacionImage from "@/assets/marcacion.jpeg";
import operatingRoom from "@/assets/operating-room.jpg";

export type IconCardItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type AudienceCard = {
  title: string;
  icon: LucideIcon;
  description: string;
  bullets: string[];
};

export type ResultHighlight = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

export type StatItem = {
  target: number;
  label: string;
  suffix?: string;
};

export type TechnologyCard = {
  name: string;
  icon: LucideIcon;
  description: string;
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type SocialLink = {
  label: string;
  icon: LucideIcon;
  href: string;
};

export const navLinks = [
  { label: "Procedimiento", href: "#procedimiento" },
  { label: "Resultados", href: "#resultados" },
  { label: "Tecnologia", href: "#tecnologia" },
  { label: "Doctor", href: "#doctor" },
  { label: "FAQ", href: "#faq" },
];

export const heroBadges = [
  "+1.500 pacientes",
  "15+ años de experiencia",
  "Pionero en Latinoamérica",
];

export const challengeItems: IconCardItem[] = [
  {
    icon: Dumbbell,
    title: "Tu entrenamiento no se refleja como debería",
    description:
      "La genética y la grasa localizada impiden que tus músculos se marquen aunque seas constante.",
  },
  {
    icon: Target,
    title: "La grasa rebelde oculta la definición",
    description:
      "Dieta y ejercicio no siempre logran eliminar los depósitos del abdomen y la cintura.",
  },
  {
    icon: Shield,
    title: "La piel pierde firmeza con el tiempo",
    description:
      "La flacidez puede esconder tu esfuerzo y apagar la definición que buscas proyectar.",
  },
  {
    icon: Sparkles,
    title: "La lipo convencional no crea marcación real",
    description:
      "Eliminar volumen no basta cuando quieres una definición muscular quirúrgica visible y armoniosa.",
  },
];

export const solutionChecks = [
  "Definición abdominal de competición",
  "Resultados naturales y armoniosos",
  "Recuperación optimizada",
  "Tecnología de vanguardia",
];

export const audienceCards: AudienceCard[] = [
  {
    title: "Mujeres",
    icon: Sparkles,
    description:
      "Marcación abdominal mujeres con foco en cintura, transición suave y una silueta femenina, atlética y sensual.",
    bullets: [
      "Definición de línea alba, semilunares y oblicuos",
      "Acentuación de cintura y contorno corporal",
      "Lipotransferencia a glúteos según el plan quirúrgico",
      "Resultado femenino, elegante y proporcional",
    ],
  },
  {
    title: "Hombres",
    icon: Dumbbell,
    description:
      "Marcación abdominal hombres con six-pack definido, más proyección muscular y un físico atlético equilibrado.",
    bullets: [
      "Six-pack quirúrgicamente definido y natural",
      "UGRAFT para volumen en bíceps, pectorales y deltoides",
      "Transiciones firmes entre abdomen, tórax y cintura",
      "Resultado atlético, masculino y personalizado",
    ],
  },
];

export const resultHighlights: ResultHighlight[] = [
  {
    title: "Marcación abdominal masculina",
    description:
      "Lipo HD Chile enfocada en líneas musculares, definición de six-pack y contorno atlético.",
    image: marcacionHero,
    alt: "Resultado de lipoescultura de alta definición - marcación abdominal masculina",
  },
  {
    title: "Marcación abdominal femenina",
    description:
      "Cirugía de contorno corporal con cintura marcada, oblicuos suaves y armonía femenina.",
    image: marcacionImage,
    alt: "Resultado de lipoescultura de alta definición - marcación abdominal femenina",
  },
  {
    title: "Tecnología y recuperación guiada",
    description:
      "Plan quirúrgico 3D con seguimiento postoperatorio para proteger el resultado en cada fase.",
    image: operatingRoom,
    alt: "Quirófano para liposucción de alta definición Santiago con tecnología 3D",
  },
];

export const stats: StatItem[] = [
  { target: 1500, suffix: "+", label: "Casos exitosos" },
  { target: 15, suffix: "+", label: "Años de experiencia" },
  { target: 3, label: "Tecnologías combinadas" },
  { target: 98, suffix: "%", label: "Satisfacción de pacientes" },
];

export const technologyCards: TechnologyCard[] = [
  {
    name: "Renuvion",
    icon: Sparkles,
    description:
      "Retracción de piel con plasma de helio para máxima firmeza sin incisiones extensas.",
  },
  {
    name: "BodyTite",
    icon: Activity,
    description:
      "Radiofrecuencia interna para contorno y compactación superior del tejido.",
  },
  {
    name: "UGRAFT",
    icon: Target,
    description:
      "Lipotransferencia ecoguiada intramuscular para volumen atlético con precisión milimétrica.",
  },
];

export const processSteps: ProcessStep[] = [
  {
    number: "1",
    title: "Evaluación personalizada",
    description:
      "Revisamos tu salud, elasticidad de piel y objetivos para una planificación 3D.",
  },
  {
    number: "2",
    title: "Plan quirúrgico a medida",
    description:
      "Diseñamos el mapa de marcación según tu anatomía, sexo y metas estéticas.",
  },
  {
    number: "3",
    title: "Procedimiento con tecnología 3D",
    description:
      "Lipoescultura, retracción y lipotransferencia integradas en una sola sesión.",
  },
  {
    number: "4",
    title: "Recuperación guiada",
    description:
      "Seguimiento postoperatorio, apoyo nutricional y pauta de reintegro al ejercicio.",
  },
];

export const faqItems: FaqItem[] = [
  {
    question:
      "¿Qué es la lipoescultura de alta definición y en qué se diferencia de una lipo convencional?",
    answer:
      "La lipoescultura de alta definición no solo reduce grasa. También dibuja líneas musculares, mejora transiciones y trabaja la retracción de piel para una marcación abdominal visible. Agenda tu evaluación para resolver todas tus dudas.",
  },
  {
    question: "¿Qué es la técnica Marcación Nivel Dios de Cirugía 360?",
    answer:
      "Es el protocolo de Cirugía 360 para lipo de alta definición con planificación 3D, retracción cutánea avanzada y lipotransferencia estratégica según cada anatomía. Agenda tu evaluación para revisar si encaja contigo.",
  },
  {
    question: "¿Soy candidato/a para una marcación abdominal de alta definición?",
    answer:
      "Suelen ser buenos candidatos quienes están cerca de su peso ideal, cuidan su estilo de vida y buscan más definición muscular quirúrgica. La evaluación médica confirma seguridad y expectativas realistas. Agenda tu evaluación para salir de dudas.",
  },
  {
    question: "¿Cuánto dura la recuperación de una lipoescultura de alta definición?",
    answer:
      "La recuperación inicial suele medirse en semanas y el resultado se va afinando durante los meses siguientes, dependiendo de tu piel, inflamación y protocolo postoperatorio. Agenda tu evaluación para conocer tiempos según tu caso.",
  },
  {
    question: "¿Qué tecnologías se utilizan: Renuvion, BodyTite y UGRAFT?",
    answer:
      "Renuvion ayuda a retraer piel, BodyTite optimiza el contorno y UGRAFT aporta volumen muscular donde conviene. La combinación permite un resultado más definido y personalizado. Agenda tu evaluación para saber cuál necesitas.",
  },
  {
    question: "¿La marcación abdominal es solo para hombres?",
    answer:
      "No. La marcación abdominal mujeres y hombres se diseña con objetivos distintos: cintura y sensualidad en mujeres, o six-pack y volumen atlético en hombres. Agenda tu evaluación para definir tu plan ideal.",
  },
  {
    question: "¿Los resultados de la lipo de alta definición son permanentes?",
    answer:
      "Los resultados pueden mantenerse a largo plazo si conservas hábitos estables, peso controlado y adherencia al postoperatorio. No reemplaza el autocuidado, pero sí potencia la base anatómica. Agenda tu evaluación para proyectar tu resultado.",
  },
  {
    question: "¿Cuánto cuesta una lipoescultura de alta definición en Chile?",
    answer:
      "El valor depende de la anatomía, la extensión del procedimiento y las tecnologías necesarias. Por eso no trabajamos con precios estándar sin evaluación previa. Agenda tu evaluación para recibir una propuesta personalizada.",
  },
];

export const socialLinks: SocialLink[] = [
  { label: "Instagram", icon: Instagram, href: "https://instagram.com/cirugia360" },
  { label: "Facebook", icon: Facebook, href: "https://facebook.com/cirugia360" },
  { label: "YouTube", icon: Youtube, href: "https://youtube.com/@cirugia360" },
];

export const doctorAwards = [
  "Mejor Cirujano Plástico Facial 2023 — AMWC World Congress, Mónaco",
  "Master en Contorno Corporal Total Definer — Bogotá, Colombia",
];

export const trustLogos = ["Renuvion", "BodyTite", "UGRAFT"];

export const canonicalUrl = "https://cirugia360.cl/marcacion-nivel-dios";

export const whatsappNumber = "56912345678";

export const defaultWhatsappMessage =
  "Hola, quiero agendar una evaluación para Marcación Nivel Dios en Cirugía 360.";

export const footerHighlights = [
  "Lipoescultura de alta definición",
  "Marcación abdominal",
  "Tecnología 3D",
];

export const doctorAwardIcon = Award;
