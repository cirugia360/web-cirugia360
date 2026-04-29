import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Clock3,
  Shield,
  Sparkles,
  Target,
  Waves,
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

export const heroImage = "/images/liposuccion.png";
export const ogImagePath = "/images/liposuccion.png";
export const canonicalUrl = "https://cirugia360.cl/procedimientos/liposuccion";
export const clinicUrl = "https://cirugia360.cl";

export const heroBadges = [
  "15+ anos de experiencia",
  "Contorno corporal personalizado",
  "Resultado natural y armonico",
];

export const trustLogos = [
  "Abdomen y cintura",
  "Lipo 360",
  "Retraccion segun el caso",
];

export const challengeItems: IconCardItem[] = [
  {
    icon: Clock3,
    title: "La grasa localizada no responde como quisieras",
    description:
      "Hay zonas del cuerpo donde dieta y ejercicio no siempre logran el nivel de cambio que buscas en el contorno.",
  },
  {
    icon: Target,
    title: "Tu silueta se ve menos definida de lo que sientes",
    description:
      "Abdomen, cintura, espalda o muslos pueden perder armonia aunque mantengas habitos estables.",
  },
  {
    icon: Waves,
    title: "Te preocupa que la piel no acompane el resultado",
    description:
      "La calidad de la piel y su elasticidad influyen mucho en como se vera el contorno despues del procedimiento.",
  },
  {
    icon: Shield,
    title: "No buscas bajar de peso, buscas verte mejor proporcionado",
    description:
      "La liposuccion no reemplaza habitos saludables. Se indica para modelar zonas concretas y mejorar la forma corporal.",
  },
];

export const solutionChecks = [
  "Reduce grasa localizada",
  "Contorno mas limpio y proporcionado",
  "Plan por zonas o enfoque 360",
  "Tecnologia segun anatomia y piel",
];

export const audienceCards: AudienceCard[] = [
  {
    title: "Zonas localizadas",
    icon: Sparkles,
    description:
      "Ideal para quienes quieren corregir un area puntual, como abdomen bajo, flancos, espalda, brazos o muslos, sin intervenir todo el contorno.",
    bullets: [
      "Enfoque preciso en la zona que mas te molesta",
      "Permite ajustes puntuales de silueta",
      "Ayuda a mejorar proporciones sin exagerar",
      "Plan definido segun volumen y calidad de piel",
    ],
  },
  {
    title: "Contorno 360",
    icon: Activity,
    description:
      "Cuando varias zonas se conectan entre si, el plan puede ampliarse para armonizar cintura, abdomen, espalda y transiciones del tronco.",
    bullets: [
      "Vision integral del contorno corporal",
      "Mejor armonia entre frente, perfil y espalda",
      "Transiciones mas limpias entre zonas",
      "Resultado mas uniforme y natural",
    ],
  },
];

export const resultHighlights: ResultHighlight[] = [
  {
    title: "Contorno corporal mas limpio",
    description:
      "La liposuccion bien indicada busca reducir volumen donde sobra para que la silueta se vea mas proporcionada, no artificial.",
    image: heroImage,
    alt: "Liposuccion para modelar abdomen y cintura en Cirugia 360",
  },
  {
    title: "Planificacion segun tu anatomia",
    description:
      "Cada evaluacion define que zonas conviene tratar, cuanto volumen corregir y si se necesita complementar con retraccion cutanea.",
    image: technologyImage,
    alt: "Planificacion y tecnologia para liposuccion en Santiago",
  },
  {
    title: "Cirugia y recuperacion guiadas",
    description:
      "El procedimiento se realiza con protocolo medico, indicaciones claras y seguimiento cercano para una evolucion mas segura.",
    image: operatingRoom,
    alt: "Quirofano para liposuccion y contorno corporal en Chile",
  },
];

export const stats: StatItem[] = [
  { target: 15, suffix: "+", label: "Anos de experiencia" },
  { target: 360, suffix: "°", label: "Vision del contorno" },
  { target: 3, label: "Factores clave a evaluar" },
  { target: 1, label: "Plan personalizado" },
];

export const technologyCards: TechnologyCard[] = [
  {
    name: "Extraccion precisa",
    icon: Target,
    description:
      "La liposuccion moderna busca retirar grasa de manera controlada para mantener transiciones suaves y un contorno creible.",
  },
  {
    name: "Retraccion segun la piel",
    icon: Waves,
    description:
      "La elasticidad cutanea importa. Segun el caso, el plan puede considerar tecnologia complementaria para ayudar a la piel a acomodarse mejor.",
  },
  {
    name: "Armonizacion corporal",
    icon: Sparkles,
    description:
      "No se trata solo de quitar volumen. Se trata de decidir donde corregir y donde preservar para mantener proporciones elegantes.",
  },
];

export const processSteps: ProcessStep[] = [
  {
    number: "1",
    title: "Evaluacion corporal personalizada",
    description:
      "Revisamos grasa localizada, calidad de piel, antecedentes medicos y el tipo de cambio que esperas lograr.",
  },
  {
    number: "2",
    title: "Plan quirurgico a medida",
    description:
      "Definimos si conviene tratar una zona puntual o un contorno mas amplio, y si necesitas complementos segun tu anatomia.",
  },
  {
    number: "3",
    title: "Liposuccion con criterio anatomico",
    description:
      "El objetivo es modelar y armonizar, no sobrecorregir ni dejar irregularidades visibles en el cuerpo.",
  },
  {
    number: "4",
    title: "Recuperacion guiada",
    description:
      "Te acompanamos en el manejo de inflamacion, controles y reintegro progresivo para proteger tu resultado.",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Que es la liposuccion y que puede corregir?",
    answer:
      "Es una cirugia para remover grasa localizada y mejorar el contorno corporal en zonas como abdomen, cintura, espalda, brazos, muslos o papada, segun el caso.",
  },
  {
    question: "La liposuccion sirve para bajar de peso?",
    answer:
      "No. La liposuccion esta pensada para modelar areas concretas del cuerpo, no como tratamiento principal para bajar de peso.",
  },
  {
    question: "Soy candidato o candidata para una liposuccion?",
    answer:
      "Suelen ser buenos candidatos quienes estan en buen estado general, tienen expectativas realistas y buscan corregir grasa localizada con un peso relativamente estable.",
  },
  {
    question: "La liposuccion ayuda con la flacidez de la piel?",
    answer:
      "Depende. Si la piel tiene buena elasticidad, suele adaptarse mejor. Si existe laxitud importante, puede ser necesario complementar o incluso indicar otro tipo de procedimiento.",
  },
  {
    question: "La liposuccion elimina celulitis o estrias?",
    answer:
      "No de forma directa. La liposuccion esta orientada a reducir grasa localizada y modelar volumen, pero no corrige por si sola celulitis ni estrias.",
  },
  {
    question: "Que zonas se pueden tratar?",
    answer:
      "Las zonas a tratar dependen de la evaluacion, pero con frecuencia se consideran abdomen, flancos, cintura, espalda, brazos, muslos y otras areas con acumulacion de grasa localizada.",
  },
  {
    question: "Cuanto dura la recuperacion?",
    answer:
      "La inflamacion inicial se concentra en dias y semanas, y el contorno se va definiendo progresivamente durante los meses siguientes.",
  },
  {
    question: "Los resultados son permanentes?",
    answer:
      "La grasa removida no vuelve en la misma cantidad, pero el resultado depende de mantener habitos estables y un peso relativamente constante en el tiempo.",
  },
  {
    question: "Cuanto cuesta una liposuccion en Chile?",
    answer:
      "El valor depende de cuantas zonas se traten, del volumen a corregir, de la calidad de la piel y de si se requieren procedimientos complementarios.",
  },
];

export const doctorAwards = [
  "Mejor Cirujano Plastico Facial 2023 - AMWC World Congress, Monaco",
  "Master en Contorno Corporal Total Definer - Bogota, Colombia",
];

export const doctorMemberships = [
  "Miembro de la Sociedad Americana de Cirugia Plastica",
  "Miembro de la Sociedad Europea de Cirugia Plastica Facial (EAFPS)",
  "Miembro de la Sociedad Italiana de Cirugia Plastica (AICPE)",
  "Miembro del Colegio Medico de Chile (RCM 40135-8)",
  "Miembro Honorario de SOCHIMCE",
];

export const doctorAwardIcon = Award;
