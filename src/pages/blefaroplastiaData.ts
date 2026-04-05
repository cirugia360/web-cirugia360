import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Clock3,
  Eye,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import operatingRoom from "@/assets/operating-room.jpg";
import technologyImage from "@/assets/technology.jpg";

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

export const heroImage = "/images/blefaroplastia.png";
export const ogImagePath = "/images/blefaroplastia.png";
export const canonicalUrl = "https://cirugia360.cl/procedimientos/blefaroplastia";
export const clinicUrl = "https://cirugia360.cl";
export const whatsappNumber = "56912345678";
export const defaultWhatsappMessage =
  "Hola, quiero agendar una evaluacion para Blefaroplastia en Cirugia 360.";

export const heroBadges = [
  "15+ anos de experiencia",
  "Parpados superiores e inferiores",
  "Mirada mas fresca y natural",
];

export const trustLogos = [
  "Parpado superior",
  "Parpado inferior",
  "Cicatriz discreta",
];

export const challengeItems: IconCardItem[] = [
  {
    icon: Clock3,
    title: "Tu mirada se ve cansada aunque te sientas bien",
    description:
      "El exceso de piel y las bolsas pueden hacer que el contorno de ojos proyecte una expresion agotada o envejecida.",
  },
  {
    icon: Eye,
    title: "Los parpados superiores se ven pesados",
    description:
      "Cuando el parpado cae o se pliega demasiado, la mirada pierde definicion y en algunos casos puede incluso interferir con el campo visual.",
  },
  {
    icon: Target,
    title: "Las bolsas inferiores marcan sombra y volumen",
    description:
      "La prominencia bajo los ojos puede hacer que el rostro se vea mas duro, triste o con menos descanso del que realmente tienes.",
  },
  {
    icon: Shield,
    title: "Cremas y tratamientos ya no logran el cambio que buscas",
    description:
      "Cuando hay exceso de piel o grasa en parpados, la solucion real suele requerir una correccion quirurgica bien indicada.",
  },
];

export const solutionChecks = [
  "Parpados mas limpios y definidos",
  "Mirada descansada y natural",
  "Correccion superior, inferior o combinada",
  "Plan segun tu anatomia ocular",
];

export const audienceCards: AudienceCard[] = [
  {
    title: "Parpados superiores",
    icon: Sparkles,
    description:
      "Pensado para quienes sienten el ojo mas pesado, con exceso de piel o una mirada menos abierta de la que les gustaria.",
    bullets: [
      "Reduce exceso de piel en el pliegue superior",
      "Abre la mirada sin cambiar tus rasgos",
      "Puede mejorar la sensacion de parpado pesado",
      "Cicatriz planificada en el pliegue natural",
    ],
  },
  {
    title: "Parpados inferiores o combinada",
    icon: Activity,
    description:
      "Cuando el problema principal son las bolsas o el contorno inferior, el plan puede enfocarse abajo o combinar ambos parpados para un resultado integral.",
    bullets: [
      "Mejora bolsas y exceso de piel inferior",
      "Transicion mas limpia entre parpado y mejilla",
      "Puede hacerse sola o junto al parpado superior",
      "Resultado fresco sin sobrecorregir",
    ],
  },
];

export const resultHighlights: ResultHighlight[] = [
  {
    title: "Mirada rejuvenecida sin perder naturalidad",
    description:
      "La blefaroplastia busca que te veas menos cansado y mas fresco, no que tus ojos se vean operados o diferentes a ti.",
    image: heroImage,
    alt: "Blefaroplastia para rejuvenecer la mirada en Cirugia 360",
  },
  {
    title: "Evaluacion detallada del contorno ocular",
    description:
      "No todo se resuelve igual. La evaluacion define si el foco esta en piel, bolsas, soporte o en la relacion entre parpado y ceja.",
    image: technologyImage,
    alt: "Evaluacion y planificacion para blefaroplastia en Santiago",
  },
  {
    title: "Cirugia y recuperacion guiadas",
    description:
      "El procedimiento se realiza con protocolo medico, indicaciones postoperatorias claras y seguimiento cercano para una evolucion segura.",
    image: operatingRoom,
    alt: "Quirofano para blefaroplastia y cirugia de parpados en Chile",
  },
];

export const stats: StatItem[] = [
  { target: 15, suffix: "+", label: "Anos de experiencia" },
  { target: 2, label: "Parpados a evaluar" },
  { target: 3, label: "Objetivos: piel, bolsas y contorno" },
  { target: 1, label: "Plan quirurgico para ti" },
];

export const technologyCards: TechnologyCard[] = [
  {
    name: "Parpado superior",
    icon: Eye,
    description:
      "La cirugia superior trata el exceso de piel y el aspecto de parpado pesado, buscando una mirada mas abierta y limpia.",
  },
  {
    name: "Parpado inferior",
    icon: Target,
    description:
      "La correccion inferior se enfoca en bolsas, exceso de piel y transiciones para suavizar el cansancio del contorno ocular.",
  },
  {
    name: "Analisis de mirada completa",
    icon: Sparkles,
    description:
      "Una buena indicacion considera ceja, parpados y proporcion facial para evitar un resultado exagerado o insuficiente.",
  },
];

export const processSteps: ProcessStep[] = [
  {
    number: "1",
    title: "Evaluacion personalizada",
    description:
      "Revisamos exceso de piel, bolsas, calidad del tejido, antecedentes oculares y el resultado que esperas lograr.",
  },
  {
    number: "2",
    title: "Plan quirurgico a medida",
    description:
      "Definimos si conviene tratar parpado superior, inferior o ambos, y si necesitas un enfoque mas funcional o mas estetico.",
  },
  {
    number: "3",
    title: "Cirugia precisa y conservadora",
    description:
      "El objetivo es rejuvenecer la mirada con una correccion equilibrada, evitando retirar mas tejido del necesario.",
  },
  {
    number: "4",
    title: "Recuperacion guiada",
    description:
      "Te acompanamos con controles, indicaciones para inflamacion y reintegro progresivo a tu rutina.",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Que es la blefaroplastia y que corrige?",
    answer:
      "Es la cirugia de parpados que trata exceso de piel en parpados superiores y bolsas o exceso de tejido en parpados inferiores para rejuvenecer la mirada.",
  },
  {
    question: "La blefaroplastia puede hacerse arriba, abajo o en ambos parpados?",
    answer:
      "Si. El procedimiento puede enfocarse en parpados superiores, inferiores o ambos, segun donde este el problema principal y la anatomia de cada paciente.",
  },
  {
    question: "Soy candidato o candidata para una blefaroplastia?",
    answer:
      "Suelen ser buenos candidatos quienes estan sanos, tienen expectativas realistas y presentan parpados pesados, bolsas o exceso de piel en la zona ocular.",
  },
  {
    question: "La blefaroplastia puede ayudar cuando el parpado superior tapa la vision?",
    answer:
      "En algunos casos si. Cuando el exceso de piel del parpado superior interfiere con el campo visual, la evaluacion medica determina si la cirugia puede aportar una mejora funcional ademas de estetica.",
  },
  {
    question: "La blefaroplastia elimina patas de gallo o ojeras oscuras?",
    answer:
      "No necesariamente. La blefaroplastia corrige piel sobrante y bolsas, pero no trata por si sola todas las arrugas finas ni todas las causas de ojeras.",
  },
  {
    question: "Donde quedan las cicatrices?",
    answer:
      "En el parpado superior suelen ir en el pliegue natural. En el inferior pueden ubicarse bajo la linea de pestañas o, en algunos casos, por dentro del parpado.",
  },
  {
    question: "Cuanto dura la recuperacion?",
    answer:
      "La inflamacion y los moretones suelen concentrarse en los primeros dias. Muchas personas retoman su vida social en 10 a 14 dias, aunque la evolucion completa toma mas tiempo.",
  },
  {
    question: "Cuanto duran los resultados de la blefaroplastia?",
    answer:
      "Los resultados suelen durar anos, aunque el envejecimiento natural continua. La duracion exacta depende de tu anatomia, la tecnica usada y tus habitos.",
  },
  {
    question: "Cuanto cuesta una blefaroplastia en Chile?",
    answer:
      "El valor depende de si se corrige parpado superior, inferior o ambos, del grado de complejidad y de si se requieren procedimientos complementarios.",
  },
];

export const doctorAwards = [
  "Mejor Cirujano Plastico Facial 2023 - AMWC World Congress, Monaco",
  "Master en Cirugia Estetica - Fondazione Fatebenefratelli, Roma",
];

export const doctorMemberships = [
  "Miembro de la Sociedad Americana de Cirugia Plastica",
  "Miembro de la Sociedad Europea de Cirugia Plastica Facial (EAFPS)",
  "Miembro de la Sociedad Italiana de Cirugia Plastica (AICPE)",
  "Miembro del Colegio Medico de Chile (RCM 40135-8)",
  "Miembro Honorario de SOCHIMCE",
];

export const doctorAwardIcon = Award;
