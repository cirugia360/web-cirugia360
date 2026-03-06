import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Calendar,
  CircleHelp,
  Eye,
  RefreshCcw,
  Sparkles,
  Star,
  Target,
  Wind,
} from "lucide-react";

export type IconTextItem = {
  icon: LucideIcon;
  text: string;
};

export type TechnologyItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type ResultCard = {
  icon: LucideIcon;
  title: string;
  points: string[];
};

export type StatItem = {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
};

export type DoctorAward = {
  icon: LucideIcon;
  title: string;
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type MotivationItem = {
  icon: LucideIcon;
  title: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const canonicalUrl = "https://cirugia360.cl/torres-rhinoplasty";

export const whatsappNumber = "56912345678";

export const defaultWhatsappMessage =
  "Hola, quiero agendar una evaluacion para Torres Rhinoplasty en Cirugia 360.";

export const heroBadges = [
  "+5.000 rinoplastias",
  "<1% tasa de revision",
  "Simulacion 3D previa",
];

export const challengeItems: IconTextItem[] = [
  {
    icon: Sparkles,
    text: "Sientes que tu nariz no armoniza con el resto de tu rostro",
  },
  {
    icon: Wind,
    text: "Tienes dificultad para respirar por desviacion o malformacion nasal",
  },
  {
    icon: RefreshCcw,
    text: "Una cirugia anterior no te dejo el resultado que esperabas",
  },
  {
    icon: CircleHelp,
    text: "No sabes como vas a quedar; el miedo a lo desconocido te frena",
  },
];

export const solutionChecks = [
  "Estetica + funcion respiratoria en un solo procedimiento",
  "Simulacion 3D para visualizar resultados antes de la cirugia",
  "Tecnologia ultrasonica: menos inflamacion, recuperacion rapida",
  "Resultados naturales que respetan tu identidad facial",
];

export const simulationBenefits: IconTextItem[] = [
  {
    icon: Eye,
    text: "Visualiza diferentes resultados posibles desde todos los angulos",
  },
  {
    icon: Target,
    text: "Alinea tus expectativas con el plan quirurgico real",
  },
  {
    icon: Activity,
    text: "Toma decisiones informadas, sin sorpresas",
  },
];

export const resultCards: ResultCard[] = [
  {
    icon: Sparkles,
    title: "Estetica",
    points: [
      "Punta definida y natural",
      "Dorso armonioso, sin bump",
      "Simetria facial mejorada",
      "Perfil equilibrado y coherente con tus rasgos",
      "Ancho nasal proporcionado",
    ],
  },
  {
    icon: Wind,
    title: "Funcional",
    points: [
      "Correccion de desviacion de tabique",
      "Mejora del flujo respiratorio",
      "Reparacion de colapso nasal",
      "Eliminacion de obstruccion cronica",
      "Mejor calidad de sueno y actividad fisica",
    ],
  },
];

export const stats: StatItem[] = [
  { target: 5000, suffix: "+", label: "Rinoplastias realizadas" },
  { target: 1, prefix: "<", suffix: "%", label: "Tasa de revision" },
  { target: 15, suffix: "+", label: "Anios de experiencia" },
  { target: 3, label: "Tecnologias integradas" },
];

export const technologyCards: TechnologyItem[] = [
  {
    icon: Target,
    title: "Rinoplastia Abierta",
    description:
      "Acceso directo a la estructura nasal. Control milimetrico del dorso, punta y soporte cartilaginoso para correcciones precisas.",
  },
  {
    icon: Eye,
    title: "Simulacion 3D",
    description:
      "Modelado tridimensional previo a la cirugia. Visualizacion de multiples escenarios para decisiones informadas y resultados predecibles.",
  },
  {
    icon: Activity,
    title: "Tecnologia Ultrasonica",
    description:
      "Instrumentos mini invasivos de ultima generacion. Menor trauma tisular, menos inflamacion y recuperacion significativamente mas rapida.",
  },
];

export const doctorAwards: DoctorAward[] = [
  {
    icon: Award,
    title: "Mejor Cirujano Plastico Facial 2023 - AMWC World Congress, Monaco",
  },
  {
    icon: Award,
    title: "Mejor Cirujano EACMFS 2010 - Brujas, Belgica",
  },
  {
    icon: Award,
    title: "Premio Antiaging Medical Congress - Roma, 2015",
  },
  {
    icon: Award,
    title: "Master en Rinoplastia - Universita Cattolica di Roma, Italia",
  },
];

export const doctorMemberships = [
  "Miembro de la Sociedad Americana de Cirugia Plastica",
  "Miembro de la Sociedad Europea de Cirugia Plastica Facial (EAFPS)",
  "Miembro de la Sociedad Italiana de Cirugia Plastica (AICPE)",
  "Miembro del Colegio Medico de Chile (RCM 40135-8)",
];

export const processSteps: ProcessStep[] = [
  {
    number: "1",
    title: "Evaluacion personalizada",
    description:
      "Analisis facial completo, evaluacion funcional respiratoria y definicion de tus objetivos esteticos.",
  },
  {
    number: "2",
    title: "Simulacion 3D",
    description:
      "Visualizas tu nariz desde todos los angulos y ajustamos el plan juntos hasta que estes conforme.",
  },
  {
    number: "3",
    title: "Cirugia con tecnologia de punta",
    description:
      "Rinoplastia abierta con instrumentos ultrasonicos y mini invasivos para maxima precision.",
  },
  {
    number: "4",
    title: "Recuperacion guiada",
    description:
      "Protocolo postoperatorio personalizado con seguimiento cercano del Dr. Torres Farr.",
  },
];

export const motivationItems: MotivationItem[] = [
  { icon: Sparkles, title: "Armonizar mi rostro" },
  { icon: Wind, title: "Respirar mejor" },
  { icon: RefreshCcw, title: "Corregir una cirugia previa" },
  { icon: Target, title: "Eliminar el bump del dorso" },
  { icon: Star, title: "Ganar confianza en mi" },
  { icon: Calendar, title: "Prepararme para un momento importante" },
];

export const faqItems: FaqItem[] = [
  {
    question: "¿Que es la rinoplastia abierta y por que es la tecnica preferida en Torres Rhinoplasty?",
    answer:
      "La rinoplastia abierta permite acceder directamente a la estructura nasal para trabajar dorso, punta y soporte con control milimetrico. En Torres Rhinoplasty se prefiere porque ofrece precision superior en cirugia de nariz compleja, revision y correcciones funcionales. La incision en la columela es discreta y suele evolucionar sin marca visible.",
  },
  {
    question: "¿En que consiste la simulacion 3D antes de la rinoplastia?",
    answer:
      "Antes de la rinoplastia en Chile, se construye un modelo tridimensional de tu nariz y de tu rostro para revisar varias posibilidades desde distintos angulos. Eso permite conversar expectativas reales, tomar decisiones informadas y planificar una rinoplastia con simulacion 3D mucho mas predecible.",
  },
  {
    question: "¿Que es la tecnologia ultrasonica en rinoplastia y que ventajas tiene?",
    answer:
      "La rinoplastia ultrasonica utiliza instrumentos especializados para remodelar el hueso nasal con mas precision y menos trauma sobre los tejidos vecinos. En comparacion con tecnicas convencionales, suele traducirse en menos moretones, menos inflamacion y una recuperacion mas rapida.",
  },
  {
    question: "¿Cuanto dura la recuperacion despues de una rinoplastia?",
    answer:
      "De manera orientativa, muchos pacientes pueden retomar vida social entre 7 y 10 dias y volver a actividad fisica completa en unas 3 a 4 semanas, siempre segun evolucion individual. La tecnologia ultrasonica ayuda a que la recuperacion de la operacion de nariz Chile sea mas llevadera.",
  },
  {
    question: "¿La rinoplastia puede mejorar mi respiracion ademas de la estetica?",
    answer:
      "Si. Torres Rhinoplasty aborda rinoplastia estetica y funcional en una sola intervencion para mejorar el perfil nasal y, al mismo tiempo, corregir tabique desviado, colapso nasal u otras obstrucciones. El objetivo es que tu nariz se vea mejor y respire mejor.",
  },
  {
    question: "¿Soy candidato o candidata para una rinoplastia?",
    answer:
      "Suelen ser candidatos quienes tienen expectativas realistas, buena salud general y una anatomia nasal que puede evaluarse con claridad. En consulta se revisa si la rinoplastia Santiago es la mejor opcion para tu caso y la simulacion 3D ayuda a precisar objetivos y limites reales.",
  },
  {
    question: "¿Que diferencia a Torres Rhinoplasty de una rinoplastia convencional?",
    answer:
      "La diferencia principal es el protocolo integral: simulacion 3D, rinoplastia abierta y tecnologia ultrasonica dentro de una misma estrategia quirurgica. A eso se suma la experiencia del Dr. Sebastian Torres Farr con mas de 5.000 casos y una tasa de revision menor al 1%.",
  },
  {
    question: "¿Cuanto cuesta una rinoplastia en Chile?",
    answer:
      "El costo rinoplastia Chile depende de la complejidad del caso, si hay componente funcional, si es rinoplastia de revision y de los recursos quirurgicos necesarios. Por eso el presupuesto se entrega en una evaluacion personalizada, clara y transparente.",
  },
  {
    question: "¿Que pasa si ya me opere antes y no quede conforme?",
    answer:
      "La rinoplastia de revision requiere mas planificacion porque la estructura nasal ya fue intervenida y puede haber cicatrices internas o falta de soporte. Torres Rhinoplasty tiene amplia experiencia en estos casos, y la simulacion 3D resulta especialmente util para proyectar una correccion precisa.",
  },
  {
    question: "¿Los resultados de la rinoplastia son permanentes?",
    answer:
      "Los cambios estructurales de una rinoplastia suelen ser permanentes, aunque la nariz sigue refinandose entre 12 y 18 meses despues de la cirugia. La baja tasa de revision del Dr. Torres Farr refleja resultados estables, funcionales y duraderos.",
  },
];
