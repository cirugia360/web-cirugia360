import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Clock3,
  Eye,
  Heart,
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

export const heroImage = "/images/lifting.png";
export const ogImagePath = "/images/lifting.png";
export const canonicalUrl = "https://cirugia360.cl/procedimientos/lifting-facial";
export const clinicUrl = "https://cirugia360.cl";

export const heroBadges = [
  "15+ anos de experiencia",
  "Rejuvenecimiento de rostro y cuello",
  "Resultados naturales y elegantes",
];

export const trustLogos = [
  "Reposicion profunda",
  "Rostro y cuello",
  "Cicatriz discreta",
];

export const challengeItems: IconCardItem[] = [
  {
    icon: Clock3,
    title: "Tu rostro se ve cansado aunque descanses bien",
    description:
      "La caida de tejidos y la perdida de soporte pueden hacer que tu expresion se vea agotada o triste antes de tiempo.",
  },
  {
    icon: Target,
    title: "La mandibula pierde definicion",
    description:
      "Cuando aparecen jowls y desdibujamiento del contorno, el perfil deja de verse firme y armonico.",
  },
  {
    icon: Shield,
    title: "El cuello empieza a mostrar laxitud",
    description:
      "La flacidez cervical suele adelantar el envejecimiento facial, incluso en personas que aun se ven bien en otras zonas.",
  },
  {
    icon: Eye,
    title: "Los tratamientos no quirurgicos ya no te alcanzan",
    description:
      "Rellenos y aparatologia pueden ayudar, pero no reposicionan tejidos cuando el descolgamiento ya es evidente.",
  },
];

export const solutionChecks = [
  "Reposicion de tejidos profundos",
  "Mandibula y cuello mas definidos",
  "Resultado natural y no estirado",
  "Plan totalmente personalizado",
];

export const audienceCards: AudienceCard[] = [
  {
    title: "Rostro",
    icon: Sparkles,
    description:
      "Ideal para quienes notan descolgamiento en mejillas, surcos mas marcados y una expresion menos fresca de la que sienten tener.",
    bullets: [
      "Reposicion del tercio medio y tejido facial",
      "Suaviza jowls y surcos sin perder identidad",
      "Recupera definicion en el marco facial",
      "Resultado elegante y coherente con tu edad",
    ],
  },
  {
    title: "Rostro + cuello",
    icon: Heart,
    description:
      "Cuando la laxitud tambien afecta el cuello, el lifting puede ampliarse para rejuvenecer el perfil completo y limpiar la mandibula.",
    bullets: [
      "Mejora de cuello y angulo cervicomandibular",
      "Transicion mas firme entre cara y cuello",
      "Perfil mas descansado y definido",
      "Mayor armonia desde frente y perfil",
    ],
  },
];

export const resultHighlights: ResultHighlight[] = [
  {
    title: "Rejuvenecimiento visible y natural",
    description:
      "El objetivo no es cambiar tu cara. Es devolverte definicion, soporte y frescura respetando tu identidad.",
    image: heroImage,
    alt: "Lifting facial para rejuvenecimiento de rostro y cuello en Cirugia 360",
  },
  {
    title: "Planificacion precisa de cada caso",
    description:
      "La evaluacion define que estructuras conviene reposicionar, que zonas conviene tratar y como mantener un resultado armonico.",
    image: technologyImage,
    alt: "Tecnologia y planificacion para lifting facial en Santiago",
  },
  {
    title: "Entorno quirurgico controlado",
    description:
      "Cada procedimiento se realiza con protocolo medico, seguimiento cercano y foco en una recuperacion segura.",
    image: operatingRoom,
    alt: "Quirofano para lifting facial y rejuvenecimiento facial en Chile",
  },
];

export const stats: StatItem[] = [
  { target: 15, suffix: "+", label: "Anos de experiencia" },
  { target: 3, label: "Planos a evaluar" },
  { target: 2, label: "Zonas clave: rostro y cuello" },
  { target: 1, label: "Plan quirurgico para ti" },
];

export const technologyCards: TechnologyCard[] = [
  {
    name: "Reposicion profunda",
    icon: Activity,
    description:
      "El lifting facial moderno no solo tensa piel. Reposiciona estructuras profundas para un rejuvenecimiento mas estable y natural.",
  },
  {
    name: "Definicion cervicofacial",
    icon: Target,
    description:
      "El tratamiento del cuello y la mandibula es clave para que el resultado se vea limpio, elegante y proporcionado.",
  },
  {
    name: "Armonizacion del resultado",
    icon: Sparkles,
    description:
      "Segun el caso, el plan puede complementarse para equilibrar volumen, textura y transiciones del rostro.",
  },
];

export const processSteps: ProcessStep[] = [
  {
    number: "1",
    title: "Evaluacion facial personalizada",
    description:
      "Revisamos laxitud, volumen, cuello, calidad de piel y el tipo de rejuvenecimiento que estas buscando.",
  },
  {
    number: "2",
    title: "Plan quirurgico a medida",
    description:
      "Definimos si conviene tratar solo rostro o tambien cuello, y que complementos pueden mejorar el resultado.",
  },
  {
    number: "3",
    title: "Cirugia con criterio anatomico",
    description:
      "El objetivo es reposicionar, definir y rejuvenecer sin dejar un rostro tirante ni artificial.",
  },
  {
    number: "4",
    title: "Recuperacion guiada",
    description:
      "Te acompanamos en controles, manejo de inflamacion y reintegro progresivo para proteger el resultado.",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Que es un lifting facial y para que sirve?",
    answer:
      "Es una cirugia de rejuvenecimiento que reposiciona tejidos faciales y cervicales para mejorar flacidez, jowls, mandibula y cuello con un resultado mas fresco y natural.",
  },
  {
    question: "En que se diferencia de rellenos o bioestimuladores?",
    answer:
      "Los tratamientos no quirurgicos pueden mejorar calidad de piel o aportar volumen, pero no corrigen de forma suficiente el descolgamiento cuando la laxitud ya es evidente.",
  },
  {
    question: "Soy candidato o candidata para un lifting facial?",
    answer:
      "Suelen ser buenos candidatos quienes notan perdida de definicion facial, flacidez en mejillas o cuello y buscan un cambio mas duradero que el que ofrecen tratamientos temporales.",
  },
  {
    question: "Las cicatrices del lifting se notan mucho?",
    answer:
      "Se planifican en zonas discretas, normalmente alrededor de la oreja y la linea del cabello, para que queden lo mas camufladas posible.",
  },
  {
    question: "El resultado puede verse artificial o demasiado estirado?",
    answer:
      "Un lifting bien indicado y bien ejecutado busca lo contrario: devolver soporte y definicion sin borrar tus rasgos ni alterar tu expresion.",
  },
  {
    question: "El lifting facial tambien puede mejorar el cuello?",
    answer:
      "Si. En muchos casos el rejuvenecimiento del cuello es parte esencial del plan, porque la cara y el cuello deben verse armados como una sola unidad estetica.",
  },
  {
    question: "Cuanto dura la recuperacion?",
    answer:
      "La fase inicial suele medirse en dias y semanas, mientras que la inflamacion residual termina de asentarse de manera progresiva durante los meses siguientes.",
  },
  {
    question: "Cuanto duran los resultados del lifting facial?",
    answer:
      "Los resultados pueden mantenerse durante anos, aunque el envejecimiento natural continua. La tecnica, tu anatomia y tus habitos influyen en esa duracion.",
  },
  {
    question: "Cuanto cuesta un lifting facial en Chile?",
    answer:
      "El valor depende del grado de laxitud, si se trata rostro o rostro y cuello, y de los procedimientos complementarios que convenga sumar segun tu caso.",
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
