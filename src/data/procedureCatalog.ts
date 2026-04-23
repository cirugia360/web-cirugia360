import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Droplets,
  HeartPulse,
  Layers3,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";
import marcacionCover from "@/assets/marcacion.jpeg";
import rinoplastiaCover from "@/assets/rinoplastia.jpeg";
import subcisionCover from "@/assets/subcision.jpeg";

export type ProcedureId =
  | "mnd"
  | "torres-rhinoplasty"
  | "subcision-magic"
  | "lifting"
  | "blefaroplastia"
  | "liposuccion"
  | "abdomino"
  | "implantes-mamarios"
  | "lipofilling"
  | "lipopapada"
  | "armtite-renuvion";

export type ProcedureCase = {
  id: string;
  label: string;
  src: string;
  alt: string;
  file: string;
};

type ProcedureLandingCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type ProcedureFaq = {
  question: string;
  answer: string;
};

export type GenericProcedureLandingContent = {
  heroLabel: string;
  heroTitle: string;
  heroDescription: string;
  heroBadges: string[];
  challengeTitle: string;
  challengeDescription: string;
  challengeCards: ProcedureLandingCard[];
  procedureTitle: string;
  procedureDescription: string;
  procedureParagraphs: string[];
  procedureChecks: string[];
  benefitsTitle: string;
  benefitsDescription: string;
  benefitCards: ProcedureLandingCard[];
  candidateTitle: string;
  candidateDescription: string;
  candidatePoints: string[];
  faqItems: ProcedureFaq[];
  closingTitle: string;
  closingDescription: string;
};

type ProcedureDefinition = {
  id: ProcedureId;
  title: string;
  eyebrow: string;
  cardDescription: string;
  resultsDescription?: string;
  href: string;
  image?: string;
  folder?: string;
  files?: string[];
  landing?: GenericProcedureLandingContent;
};

export type ProcedureCatalogItem = Omit<ProcedureDefinition, "files"> & {
  image: string;
  cases: ProcedureCase[];
  previewCases: ProcedureCase[];
};

export const resultsFilterParam = "procedimiento";

const buildResultPath = (folder: string, file: string) =>
  `/images/results/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;

const sortFiles = (files: string[]) =>
  [...files].sort((left, right) => left.localeCompare(right, "es", { numeric: true, sensitivity: "base" }));

const buildCases = (procedureId: ProcedureId, title: string, folder: string, files: string[]) =>
  sortFiles(files).map((file, index) => ({
    id: `${procedureId}-${index + 1}`,
    label: `Caso ${index + 1}`,
    src: buildResultPath(folder, file),
    alt: `Resultado real de ${title}, caso ${index + 1}`,
    file,
  }));

const procedureDefinitions: ProcedureDefinition[] = [
  {
    id: "mnd",
    title: "Marcacion Nivel Dios",
    eyebrow: "Lipoescultura HD",
    cardDescription:
      "Liposuccion de alta definicion avanzada para contorno corporal masculino.",
    resultsDescription:
      "Resultados de marcacion abdominal y contorno corporal masculino con definicion avanzada y transiciones anatomicas limpias.",
    href: "/marcacion-nivel-dios",
    image: marcacionCover,
    folder: "mnd",
    files: [
      "1.png",
      "2.png",
      "3.JPG",
      "4.jpg",
      "5.JPG",
      "6.JPG",
      "7.JPG",
      "8.JPG",
      "9.JPG",
      "10.JPG",
      "11.jpg",
      "12.jpg",
      "13.JPG",
      "default_09504995-4473-4384-ab3d-ec846c9e4ece_0.jpg",
      "default_11952c34-bb68-4e9f-b6ab-f33cbd03c571_0.jpg",
      "default_1730c8a5-f244-4ebc-a139-4a7b13216dee_0.jpg",
      "default_2c2159ae-812d-49b9-88b1-b9804229fc9e_0.jpg",
      "default_33b5dc98-82a6-410b-8136-e714c2db27d3_0.jpg",
      "default_3414513d-ebc9-4c6e-b0eb-5eb0bad36ec8_0 (1).jpg",
      "default_39a481db-ece1-47df-b506-b200fe1cf7cd_0.jpg",
      "default_3a97a2ed-1ae4-4657-b28a-8a13f52c59e6_0.jpg",
      "default_43e6bf76-22aa-4358-80b1-bec71a511c68_0.jpg",
      "default_443b14f0-0416-4f81-9767-96cf3c060762_0.jpg",
      "default_5262d10f-57be-4aec-adcf-c50854856d9f_0.jpg",
      "default_6438d47e-a55f-4a73-b329-017800b016a5_0.jpg",
      "default_809ea4a6-793e-4b3d-8621-81ca704633e3_0.jpg",
      "default_893684d0-5a32-4936-b8cd-e08fa528e578_0.jpg",
      "default_8e26ab58-fbf3-4136-a6d2-ae1fa847bf2d_0.jpg",
      "default_9c469820-192c-463c-bc96-7bb372fc096f_0.jpg",
      "default_9e5a957f-9c86-46e7-adc1-7dc6fd3c205a_0.jpg",
      "default_ae86e924-cb2c-4ee0-90ea-517f00c456ed_0.jpg",
      "default_b1fbd649-f90a-4aae-946b-bf0319bd8cc8_0.jpg",
      "default_b9425d25-7c4e-47fc-aef8-6b0d21d8a9ae_0.jpg",
      "default_bcbe070a-2c96-4b3f-869b-ef502ff7946d_0.jpg",
      "default_c51aca4b-dff2-41c4-8321-6674aa73d9e2_0.jpg",
      "default_c6d6b675-a287-4edd-92c5-36bc0567f4fe_0.jpg",
      "default_cb5efc3a-f6f0-4fc5-8972-1e8d07584236_0.jpg",
      "default_d79c5023-bc3d-4b64-b1ab-386090d141ed_0.jpg",
      "default_dba71733-0287-4292-87f8-bc9fe83df719_0.jpg",
      "default_ef69bd8a-34c0-42ad-8225-b05eca576a9d_0.jpg",
      "default_f6861986-4f82-43ff-b080-56eae417c745_0.jpg",
      "default_fa41e1ab-647b-448e-a72d-0fdf871f8cf1_0.jpg",
      "PCIMG_2026-03-30_21-35-38.JPG",
      "PCIMG_2026-04-07_22-11-54.JPG",
      "Point Blur_Apr072026_135751.jpg",
      "Point Blur_Apr072026_135843.jpg",
      "Point Blur_Apr072026_135931.jpg",
      "Point Blur_Apr072026_202359.jpg",
      "Point Blur_Apr072026_221756.jpg",
    ],
  },
  {
    id: "torres-rhinoplasty",
    title: "Torres Rhinoplasty",
    eyebrow: "Rinoplastia",
    cardDescription:
      "Rinoplastia armonica y natural con mas de 5000 procedimientos.",
    resultsDescription:
      "Casos reales de rinoplastia con foco en armonia facial, definicion de punta y resultados naturales.",
    href: "/torres-rhinoplasty",
    image: rinoplastiaCover,
    folder: "torres-rhinoplasty",
    files: [
      "1.png",
      "2.JPG",
      "3.JPG",
      "4.JPG",
      "5.JPG",
      "6.JPG",
      "7.JPG",
      "8.jpg",
      "9.JPG",
      "10.JPG",
      "default_1f4dded7-41dd-43d0-aa8d-309612a8a49f_0.jpg",
      "default_4103d910-397f-49b8-9e8a-010da19d916f_0.jpg",
      "default_6faa56e1-370e-4b9c-b569-a4862b08981b_0.jpg",
      "default_7df6dc8f-e5fe-407c-a5b8-c62ba3241d39_0.jpg",
      "default_9d4d6172-4b4f-48bb-b433-183bb1e4c7be_0.jpg",
      "default_a30892f3-2090-4852-9bb3-7cf67817e875_0.jpg",
      "default_b53eb638-e97a-420e-a538-af9e254f8ab2_0 (1).jpg",
      "default_db731311-7ccd-4528-b48f-4432ad19dac2_0.jpg",
      "default_e4885e4f-22b3-4db0-9b75-7f8b97079f7c_0.jpg",
      "default_f5d5d924-21b2-475d-93e6-55380a0e8215_0.jpg",
      "default_fb4a7209-2060-4ffb-9e20-55b988290343_0.jpg",
    ],
  },
  {
    id: "subcision-magic",
    title: "Subcision Magic",
    eyebrow: "Celulitis",
    cardDescription: "Solucion definitiva para celulitis profunda.",
    resultsDescription:
      "Evolucion de pacientes tratados por celulitis profunda con subcision, liberacion de septos y mejoria visible del relieve cutaneo.",
    href: "/subcision-magic",
    image: subcisionCover,
    folder: "subcision-magic",
    files: [
      "1.JPG",
      "2.JPG",
      "3.JPG",
      "4.JPG",
      "5.JPG",
      "6.JPG",
      "7.JPG",
      "8.JPG",
      "9.JPG",
      "10.JPG",
      "11.jpg",
      "12.jpg",
      "13.jpg",
      "14.jpg",
      "15.jpg",
      "default_1c547464-2a71-40e2-b46f-1f9b36736c12_0.jpg",
      "default_4677de04-b0f6-4efc-8782-5f04249e11c1_0.jpg",
      "default_48e17ced-16ba-4aff-8628-1c4f5a19d8e1_0.jpg",
      "default_5537b4dd-0c9a-45cf-9c6e-036cf20c05bf_0.jpg",
      "default_612cfbc7-4117-47d6-8b3d-4432c7b27ac9_0.jpg",
      "default_8fa1af74-6772-4a97-8b96-3f2957896014_0.jpg",
      "default_9906a0d0-ff5d-467c-80b5-63fe0d5c6324_0.jpg",
      "default_a1792d6d-1abe-426d-8a26-7cf36e761226_0.jpg",
      "default_b748a0ff-1339-4329-b0d1-04b4449edbcf_0.jpg",
      "default_bfde8341-32c6-401e-8b89-261108ac8a46_0.jpg",
      "default_c927b515-eef8-4557-a3e3-31657d54c6eb_0.jpg",
      "default_e14e7dc4-00ee-4446-b2a0-093ad7c2bab3_0.jpg",
      "default_f04844d4-5732-4c54-a11f-0c7a30d4af2d_0.jpg",
      "PCIMG_2026-04-07_20-20-48.JPG",
    ],
  },
  {
    id: "lifting",
    title: "Lifting Facial",
    eyebrow: "Rejuvenecimiento facial",
    cardDescription:
      "Rejuvenecimiento de rostro y cuello con resultado natural y elegante.",
    resultsDescription:
      "Casos reales de lifting facial con mejor definicion mandibular, reposicion de tejidos y un rejuvenecimiento natural de rostro y cuello.",
    href: "/procedimientos/lifting-facial",
    image: "/images/lifting.png",
    folder: "lifting",
    files: [
      "default_03676cb2-eef7-4ed2-8c95-fca5f77a6e9d_0.jpg",
      "default_066a8d2c-c51d-4c8e-b985-40dc54cac4ee_0.jpg",
      "default_2238c8a9-f1e8-4389-9ace-8c81b11ef283_0.jpg",
      "default_3f4e8d6f-63ce-45df-9503-f6e3d907526c_0.jpg",
      "default_408969ec-9208-4a48-bed5-9dc9071d2fcf_0.jpg",
      "default_4e48be89-cc99-4e9b-8a9c-28364f33119a_0.jpg",
      "default_4f2ecc35-aa2b-4d8d-96a0-7680f41a340b_0.jpg",
      "default_58bc085c-cebe-4749-a6d3-71a5c098c21b_0.jpg",
      "default_657ed917-1da6-4e27-8249-12f33ea09ec4_0 (1).jpg",
      "default_958a8bcc-8862-4ce5-a989-15b5b49f14b1_0.jpg",
      "default_bb063172-117e-422e-ab5f-c65a6b06c46a_0.jpg",
      "default_be77f8a7-54c1-485b-bc2b-d82a1aa63d2d_0.jpg",
      "default_cc5278e9-8245-4c38-a2f8-875400d9b7ca_0.jpg",
      "default_d7ee74aa-4db0-4454-ab62-5b6e9523eab2_0.jpg",
      "default_dc84f6d2-ec81-45b1-9122-3b4cb281e999_0.jpg",
      "default_e7dbed42-17c5-4f7c-abc1-033a5d7d078b_0.jpg",
      "default_fcdcc019-1e6d-4136-a939-1b08fe3b4ae6_0.jpg",
    ],
  },
  {
    id: "blefaroplastia",
    title: "Blefaroplastia",
    eyebrow: "Mirada y parpados",
    cardDescription:
      "Cirugia de parpados para una mirada mas fresca, descansada y natural.",
    resultsDescription:
      "Antes y despues de blefaroplastia con correccion de exceso de piel y bolsas para una mirada mas luminosa y descansada.",
    href: "/procedimientos/blefaroplastia",
    image: "/images/blefaroplastia.png",
    folder: "blefaroplastia",
    files: [
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.jpg",
      "default_1cb3193b-d2d9-44ee-ab8a-291a5360b11b_0.jpg",
      "default_36c1ac12-e6b9-4afa-9743-7e202586cd65_0 (1).jpg",
      "default_39f21710-40d0-4d7b-81eb-97c43e965a5b_0.jpg",
      "default_5d6b347f-f63c-43e2-9553-11edc63b30a1_0.jpg",
      "default_674c6213-342a-4bba-ba1b-ed26439fea20_0.jpg",
      "default_781c8757-fa24-49f5-ac18-90d51ffe412c_0.jpg",
      "default_9c3a2a98-38ea-466e-9b42-2d8b58ccc916_0 (1).jpg",
      "default_a5509d8b-a31e-41b7-b849-d4ecb3901e63_0 (1).jpg",
      "default_da20b0a0-0266-4dd6-a96a-7cdd1d8de429_0.jpg",
      "default_fc85babd-c4e2-467e-a5ae-8d4e6911815d_0 (1).jpg",
    ],
  },
  {
    id: "liposuccion",
    title: "Liposuccion",
    eyebrow: "Contorno corporal",
    cardDescription:
      "Contorno corporal para grasa localizada con resultado natural y armonico.",
    href: "/procedimientos/liposuccion",
    image: "/images/liposuccion.png",
  },
  {
    id: "abdomino",
    title: "Abdominoplastia",
    eyebrow: "Abdomen y pared abdominal",
    cardDescription:
      "Correccion de exceso de piel y flacidez abdominal para un contorno mas firme.",
    resultsDescription:
      "Casos reales de abdominoplastia con mejora de flacidez, exceso de piel y definicion del contorno abdominal.",
    href: "/procedimientos/abdominoplastia",
    folder: "abdomino",
    files: [
      "default_1718306a-559e-422e-8c3e-442702533286_0.jpg",
      "default_2ced5d25-20da-4bcd-8981-3352654f6398_0.jpg",
      "Point Blur_Apr082026_175308.jpg",
      "Point Blur_Apr082026_175351.jpg",
      "Point Blur_Apr082026_175429.jpg",
      "Point Blur_Apr082026_175454.jpg",
      "Point Blur_Apr082026_175616.jpg",
    ],
    landing: {
      heroLabel: "Contorno abdominal",
      heroTitle: "Abdominoplastia para un abdomen mas firme y proporcionado",
      heroDescription:
        "La abdominoplastia ayuda a corregir exceso de piel, flacidez y distension de la pared abdominal cuando dieta y ejercicio ya no alcanzan.",
      heroBadges: ["Exceso de piel y flacidez", "Plan quirurgico personalizado", "Seguimiento postoperatorio"],
      challengeTitle: "Cuando el abdomen no vuelve a su lugar, el problema no es solo grasa",
      challengeDescription:
        "Despues de embarazos, cambios de peso o perdida importante de elasticidad, puede quedar piel excedente y una pared abdominal distendida que no mejora con habitos saludables por si sola.",
      challengeCards: [
        {
          icon: Layers3,
          title: "Exceso de piel visible",
          description:
            "El tejido sobrante puede generar pliegues, incomodidad en la ropa y una silueta menos definida.",
        },
        {
          icon: ShieldCheck,
          title: "Flacidez abdominal persistente",
          description:
            "Aunque bajes de peso, la calidad de la piel puede impedir un contorno firme y limpio.",
        },
        {
          icon: Target,
          title: "Distension de la pared abdominal",
          description:
            "En algunos casos existe separacion muscular o falta de soporte que cambia el perfil del abdomen.",
        },
      ],
      procedureTitle: "Abdominoplastia con evaluacion anatomica y criterio de contorno",
      procedureDescription:
        "El objetivo no es solo retirar tejido. Es reconstruir un abdomen mas equilibrado, con una cicatriz planificada y un resultado coherente con tu cuerpo.",
      procedureParagraphs: [
        "La abdominoplastia permite resecar piel sobrante, tensar la zona cuando corresponde y redefinir el contorno del abdomen en pacientes que presentan laxitud importante.",
        "La indicacion depende de la calidad de la piel, del exceso real de tejido y de si existe distension de la pared abdominal. Cada plan se define tras una evaluacion medica personalizada.",
        "En algunos casos puede combinarse con procedimientos de contorno para mejorar la armonia global, siempre priorizando seguridad y expectativas realistas.",
      ],
      procedureChecks: [
        "Reseccion de exceso de piel",
        "Plan segun calidad de piel y flacidez",
        "Evaluacion de pared abdominal",
        "Recuperacion guiada por el equipo",
      ],
      benefitsTitle: "Lo que buscamos con una abdominoplastia bien indicada",
      benefitsDescription:
        "El resultado ideal es un abdomen mas firme, mas limpio en perfil y mejor integrado con cintura y torso.",
      benefitCards: [
        {
          icon: Sparkles,
          title: "Abdomen mas firme",
          description:
            "Se busca una superficie mas tensa y ordenada cuando existe laxitud importante de piel.",
        },
        {
          icon: Activity,
          title: "Contorno mas proporcionado",
          description:
            "La cirugia puede devolver equilibrio entre abdomen, cintura y tronco segun tu anatomia.",
        },
        {
          icon: HeartPulse,
          title: "Plan ajustado a tu recuperacion",
          description:
            "Cada indicacion contempla tiempos de postoperatorio, cicatriz y seguimiento clinico.",
        },
      ],
      candidateTitle: "La evaluacion es clave para saber si es tu mejor opcion",
      candidateDescription:
        "Suele considerarse en personas con piel excedente o flacidez marcada que entienden el proceso de recuperacion y la presencia de cicatriz.",
      candidatePoints: [
        "Tienes flacidez abdominal despues de embarazos o cambios de peso",
        "Notas exceso de piel que no mejora con entrenamiento",
        "Buscas un abdomen mas plano y ordenado",
        "Entiendes que la cirugia requiere recuperacion y cicatriz",
        "Quieres una propuesta realista segun tu anatomia",
      ],
      faqItems: [
        {
          question: "Quien suele ser candidato para una abdominoplastia?",
          answer:
            "La indicacion depende del grado de flacidez, del exceso de piel y de tu estado general de salud. La evaluacion medica define si esta cirugia es realmente la mejor alternativa para tu caso.",
        },
        {
          question: "La abdominoplastia deja cicatriz?",
          answer:
            "Si. La cicatriz forma parte del procedimiento, por eso se planifica cuidadosamente para que quede en una zona lo mas discreta posible dentro de lo que permite tu anatomia.",
        },
        {
          question: "Se puede combinar con otros procedimientos?",
          answer:
            "En algunos casos si, especialmente cuando se busca una armonizacion global del contorno corporal. La decision depende del tiempo quirurgico, seguridad y objetivos.",
        },
        {
          question: "Cuanto tarda la recuperacion inicial?",
          answer:
            "La recuperacion varia segun la extension del procedimiento y tu respuesta individual. En consulta se explican los tiempos estimados, restricciones y cuidados segun tu caso.",
        },
      ],
      closingTitle: "Agenda tu evaluacion para saber si la abdominoplastia es adecuada para ti",
      closingDescription:
        "Revisaremos flacidez, exceso de piel, pared abdominal y objetivos esteticamente realistas para construir una propuesta personalizada.",
    },
  },
  {
    id: "implantes-mamarios",
    title: "Implantes Mamarios",
    eyebrow: "Volumen y proyeccion",
    cardDescription:
      "Aumento mamario con implantes para mejorar volumen, proyeccion y equilibrio corporal.",
    resultsDescription:
      "Resultados reales de implantes mamarios con aumento de volumen, mejor proyeccion y armonia corporal.",
    href: "/procedimientos/implantes-mamarios",
    folder: "Implantes mamarios",
    files: [
      "PCIMG_2026-04-07_22-09-24.JPG",
      "Point Blur_Apr082026_174806.jpg",
      "Point Blur_Apr082026_174858.jpg",
      "Point Blur_Apr082026_174931.jpg",
      "Point Blur_Apr082026_175034.jpg",
      "Point Blur_Apr082026_175116.jpg",
      "Point Blur_Apr082026_175146.jpg",
      "Point Blur_Apr082026_175308.jpg",
      "Point Blur_Apr082026_175523.jpg",
    ],
    landing: {
      heroLabel: "Volumen mamario",
      heroTitle: "Implantes mamarios con planificacion de volumen y forma",
      heroDescription:
        "El aumento mamario busca mejorar proyeccion, equilibrio y proporcion del busto respetando tu torax, tejidos y objetivos esteticos.",
      heroBadges: ["Volumen personalizado", "Eleccion guiada de implante", "Seguimiento cercano"],
      challengeTitle: "Cuando el volumen del busto no acompana tu proporcion corporal",
      challengeDescription:
        "Algunas pacientes buscan recuperar volumen perdido, corregir asimetrias o lograr una proyeccion mas coherente con su silueta. La clave esta en elegir tamano, perfil y plan quirurgico con criterio.",
      challengeCards: [
        {
          icon: Sparkles,
          title: "Poco volumen o perdida de proyeccion",
          description:
            "El busto puede verse menos lleno por anatomia propia, cambios hormonales o embarazos.",
        },
        {
          icon: ScanFace,
          title: "Asimetrias visibles",
          description:
            "Diferencias de forma, base o posicion pueden hacer que el busto se vea desequilibrado.",
        },
        {
          icon: Target,
          title: "Dudas sobre tamano y resultado final",
          description:
            "Sin una buena evaluacion, elegir implantes por intuicion puede alejar el resultado de lo que realmente buscas.",
        },
      ],
      procedureTitle: "Aumento mamario con una propuesta construida sobre tu anatomia",
      procedureDescription:
        "La decision no parte desde un numero de cc. Parte desde la base de tu torax, calidad de tejidos, cobertura y estilo de resultado que quieres proyectar.",
      procedureParagraphs: [
        "El procedimiento se planifica considerando proyeccion, diametro, perfil y la relacion entre busto, cintura y caderas para buscar un resultado armonico.",
        "Tambien se evalua la calidad de piel y tejido mamario disponible, ya que eso influye en que implante conviene y que expectativas son razonables.",
        "La meta es lograr un aumento proporcionado, elegante y estable en el tiempo, evitando decisiones sobredimensionadas para tu anatomia.",
      ],
      procedureChecks: [
        "Eleccion de implante segun torax y tejidos",
        "Volumen y proyeccion personalizados",
        "Plan de incision y cicatriz",
        "Recuperacion explicada paso a paso",
      ],
      benefitsTitle: "Que buscamos en un aumento mamario bien indicado",
      benefitsDescription:
        "Un busto mas proporcionado no depende solo del tamano. Depende de como dialoga con tu cuerpo completo.",
      benefitCards: [
        {
          icon: Activity,
          title: "Escote mas equilibrado",
          description:
            "La cirugia puede mejorar la distribucion del volumen superior y la proyeccion frontal.",
        },
        {
          icon: ShieldCheck,
          title: "Forma coherente con tu base",
          description:
            "Se prioriza un resultado que respete el ancho de tu torax y la calidad de tus tejidos.",
        },
        {
          icon: HeartPulse,
          title: "Plan de seguimiento claro",
          description:
            "La evolucion se acompana con indicaciones postoperatorias y controles segun cada etapa.",
        },
      ],
      candidateTitle: "La mejor eleccion nace de una evaluacion honesta",
      candidateDescription:
        "El aumento mamario suele indicarse cuando buscas mas volumen o corregir desproporciones y quieres una recomendacion basada en tu anatomia real.",
      candidatePoints: [
        "Quieres aumentar volumen y proyeccion del busto",
        "Buscas equilibrar asimetrias o perdida de forma",
        "Quieres una recomendacion de tamano con criterio medico",
        "Entiendes la recuperacion y los cuidados asociados",
        "Priorizas un resultado proporcional antes que exagerado",
      ],
      faqItems: [
        {
          question: "Como se elige el implante adecuado?",
          answer:
            "Se evalua el ancho del torax, la calidad de los tejidos, tu volumen de base y el estilo de resultado que buscas. La eleccion del implante siempre debe adaptarse a tu anatomia.",
        },
        {
          question: "Se pueden corregir asimetrias con implantes?",
          answer:
            "En muchos casos si, aunque el grado de correccion posible depende del tipo de asimetria, de la piel y de la forma mamaria de base. Eso se revisa en consulta.",
        },
        {
          question: "Cuanto tiempo dura la recuperacion inicial?",
          answer:
            "La recuperacion cambia segun la tecnica utilizada y tu respuesta individual. En la evaluacion se explican tiempos, molestias esperables y restricciones temporales.",
        },
        {
          question: "El resultado se ve natural?",
          answer:
            "Un resultado natural depende de elegir un implante coherente con tu cuerpo y de respetar los limites de tus tejidos. Esa planificacion es lo que mas influye en el acabado final.",
        },
      ],
      closingTitle: "Agenda tu evaluacion para definir volumen, forma y proyeccion con criterio",
      closingDescription:
        "Revisaremos tu anatomia, objetivos y opciones de implantes para construir una propuesta segura, proporcionada y realista.",
    },
  },
  {
    id: "lipofilling",
    title: "Lipofilling",
    eyebrow: "Transferencia de grasa",
    cardDescription:
      "Transferencia de grasa propia para recuperar volumen y suavizar contornos.",
    resultsDescription:
      "Casos reales de lipofilling con mejora de volumen y transiciones mas suaves usando grasa propia.",
    href: "/procedimientos/lipofilling",
    folder: "lipofilling",
    files: [
      "default_1b856e4e-1d29-4168-92a3-b7d52dc5bbae_0 (1).jpg",
      "default_51a32e4e-caba-4038-81ed-e5594ff25ab6_0 (1).jpg",
      "default_6423fc8b-9d7b-41ad-9e2e-78aa258b3803_0.jpg",
      "default_8c6e934f-853a-4a56-8b7e-8fa355056c51_0.jpg",
      "default_ce30f897-289d-4fcf-9905-8bf774b9606f_0.jpg",
    ],
    landing: {
      heroLabel: "Volumen con grasa propia",
      heroTitle: "Lipofilling para devolver volumen y suavizar el contorno",
      heroDescription:
        "El lipofilling utiliza grasa propia para mejorar volumen y transiciones en zonas seleccionadas con un resultado mas organico y personalizado.",
      heroBadges: ["Grasa autologa", "Plan segun zonas dadora y receptora", "Resultados progresivos"],
      challengeTitle: "Cuando falta volumen, no siempre la mejor respuesta es un implante",
      challengeDescription:
        "En pacientes seleccionados, la grasa propia puede ser una buena alternativa para rellenar, mejorar contornos y suavizar depresiones con tejido del mismo cuerpo.",
      challengeCards: [
        {
          icon: Droplets,
          title: "Perdida de volumen localizada",
          description:
            "Algunas zonas pueden verse vacias o menos definidas por anatomia, edad o cambios de peso.",
        },
        {
          icon: Layers3,
          title: "Transiciones poco armonicas",
          description:
            "Depresiones o irregularidades pueden hacer que el contorno se vea menos suave y continuo.",
        },
        {
          icon: Sparkles,
          title: "Buscas una opcion con tejido propio",
          description:
            "Muchas personas prefieren una solucion basada en grasa autologa cuando su caso lo permite.",
        },
      ],
      procedureTitle: "Lipofilling con indicacion precisa y expectativas realistas",
      procedureDescription:
        "No se trata solo de injertar grasa. Se trata de seleccionar bien la paciente, la zona dadora y el volumen que realmente puede integrarse de forma estable.",
      procedureParagraphs: [
        "El procedimiento considera extraccion, preparacion e infiltracion de grasa propia en la zona a tratar, buscando mejorar volumen, relieve y transiciones anatomicas.",
        "La cantidad disponible y la supervivencia del injerto dependen de tu anatomia, de las zonas dadoras y del tejido receptor. Por eso el plan siempre es individual.",
        "El objetivo es lograr una mejoria visible y natural, evitando sobrecorrecciones y priorizando estabilidad en el tiempo.",
      ],
      procedureChecks: [
        "Uso de grasa propia procesada",
        "Plan segun zona dadora y receptora",
        "Volumen acorde a tu anatomia",
        "Explicacion realista de la evolucion",
      ],
      benefitsTitle: "Que puede aportar un lipofilling bien indicado",
      benefitsDescription:
        "Cuando la indicacion es correcta, el lipofilling puede mejorar volumen y textura sin perder naturalidad.",
      benefitCards: [
        {
          icon: Target,
          title: "Volumen mas organico",
          description:
            "La grasa propia puede integrarse de forma armonica cuando existe buena indicacion y tecnica.",
        },
        {
          icon: Activity,
          title: "Contornos mas suaves",
          description:
            "Permite rellenar transiciones o depresiones para mejorar la continuidad visual de la zona.",
        },
        {
          icon: ShieldCheck,
          title: "Plan adaptado a tus limites reales",
          description:
            "La propuesta se construye segun disponibilidad de grasa y objetivos alcanzables.",
        },
      ],
      candidateTitle: "La evaluacion define si realmente te conviene",
      candidateDescription:
        "El lipofilling no es igual para todos. Requiere analizar si tienes grasa disponible y si la zona receptora puede beneficiarse de forma predecible.",
      candidatePoints: [
        "Quieres mejorar volumen con tejido propio",
        "Presentas depresiones o transiciones que quieres suavizar",
        "Tienes zonas dadoras adecuadas para el procedimiento",
        "Entiendes que parte de la evolucion es progresiva",
        "Buscas una propuesta personalizada y no estandar",
      ],
      faqItems: [
        {
          question: "El lipofilling sirve para cualquier zona?",
          answer:
            "No siempre. Depende de la calidad de la piel, del tejido receptor y del volumen que conviene transferir. La evaluacion medica define en que zonas tiene mejor indicacion.",
        },
        {
          question: "Toda la grasa injertada se mantiene?",
          answer:
            "No. Una parte del injerto se integra y otra puede reabsorberse. Por eso la planificacion y las expectativas realistas son fundamentales antes de decidir el procedimiento.",
        },
        {
          question: "Se puede combinar con otros procedimientos?",
          answer:
            "En algunos casos si, sobre todo cuando se busca mejorar contorno y volumen en una misma estrategia. La seguridad y el tiempo quirurgico siempre guian esa decision.",
        },
        {
          question: "Cuanto tarda en verse el resultado?",
          answer:
            "La evolucion es progresiva. El resultado se aprecia mejor a medida que baja la inflamacion y se estabiliza la integracion del injerto en las semanas posteriores.",
        },
      ],
      closingTitle: "Agenda tu evaluacion para saber si el lipofilling es la mejor opcion en tu caso",
      closingDescription:
        "Revisaremos zonas dadoras, volumen disponible y objetivos para definir una propuesta realista y personalizada.",
    },
  },
  {
    id: "lipopapada",
    title: "Lipopapada",
    eyebrow: "Cuello y mandibula",
    cardDescription:
      "Definicion de menton, cuello y angulo mandibular tratando grasa submentoniana.",
    resultsDescription:
      "Antes y despues de lipopapada con mejora de perfil, definicion mandibular y limpieza del cuello.",
    href: "/procedimientos/lipopapada",
    folder: "lipopapada",
    files: [
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "default_1fdca110-cb5b-462a-ba62-842b744e4a7e_0.jpg",
      "default_59f078c6-64de-4538-8bb6-034076c570c7_0.jpg",
      "default_5eb1c00b-75c9-4152-9717-cd511131f2b1_0.jpg",
      "default_6d8e3ca5-3900-4406-b3fb-e84e19dca427_0.jpg",
      "default_a3b8eaf3-27c5-4448-be46-4d454c4a3e94_0.jpg",
      "default_c3e82cab-9347-4001-8ccb-5cd5e9bd892d_0.jpg",
      "default_cf983714-a726-4f45-ad7d-09c1ba3c15c8_0.jpg",
      "default_d0f12f24-ec47-4c3a-b829-a6f91d87f521_0.jpg",
      "default_ea59f09d-10fa-4d3e-b9e4-1b3972e99c21_0.jpg",
      "default_f2fbfe2e-4e52-4ec8-97b9-4e0d2253a379_0.jpg",
      "default_fcfa5bfa-e204-472d-b0a1-8ece5a3c7f5d_0.jpg",
    ],
    landing: {
      heroLabel: "Perfil cervicofacial",
      heroTitle: "Lipopapada para definir menton, cuello y mandibula",
      heroDescription:
        "La lipopapada trata grasa localizada bajo el menton para limpiar el perfil y mejorar la transicion entre rostro y cuello.",
      heroBadges: ["Definicion mandibular", "Tratamiento de grasa localizada", "Evaluacion de calidad de piel"],
      challengeTitle: "A veces el cuello se ve pesado aunque el resto del rostro este en equilibrio",
      challengeDescription:
        "La acumulacion submentoniana puede borrar el angulo cervicomental y hacer que el perfil se vea mas redondo, pesado o menos definido.",
      challengeCards: [
        {
          icon: ScanFace,
          title: "Mandibula poco visible",
          description:
            "La grasa bajo el menton puede ocultar la definicion de la linea mandibular aun en pacientes delgados.",
        },
        {
          icon: Target,
          title: "Perfil menos limpio",
          description:
            "El angulo entre menton y cuello pierde nitidez y puede cambiar la lectura general del rostro.",
        },
        {
          icon: ShieldCheck,
          title: "No todo depende del peso",
          description:
            "La genetica y la calidad de la piel tambien influyen en la presencia de papada y en su tratamiento.",
        },
      ],
      procedureTitle: "Lipopapada con analisis de grasa y elasticidad cutanea",
      procedureDescription:
        "El objetivo no es solo retirar volumen. Es recuperar un perfil mas definido y evaluar si la piel tiene la capacidad de adaptarse de forma adecuada.",
      procedureParagraphs: [
        "La lipopapada ayuda a tratar grasa localizada bajo el menton y en el cuello alto para mejorar la definicion del contorno cervicofacial.",
        "Antes de indicar el procedimiento se evalua la calidad de la piel, porque eso influye directamente en cuanto puede tensarse la zona despues de retirar grasa.",
        "En casos seleccionados puede ser necesario complementar con otras estrategias cuando la flacidez tiene un rol importante en el resultado esperado.",
      ],
      procedureChecks: [
        "Tratamiento de grasa submentoniana",
        "Evaluacion de elasticidad de piel",
        "Busqueda de un perfil mas limpio",
        "Recuperacion explicada con detalle",
      ],
      benefitsTitle: "Que buscamos al tratar la papada",
      benefitsDescription:
        "La meta es que menton, mandibula y cuello se lean de forma mas ordenada, natural y proporcionada.",
      benefitCards: [
        {
          icon: Sparkles,
          title: "Perfil mas definido",
          description:
            "La zona bajo el menton puede verse mas limpia y ligera cuando la indicacion es correcta.",
        },
        {
          icon: Activity,
          title: "Mejor transicion cuello rostro",
          description:
            "Se busca recuperar un angulo cervicomental mas visible y armonico.",
        },
        {
          icon: HeartPulse,
          title: "Plan segun tu tipo de piel",
          description:
            "La calidad cutanea se analiza para entender que resultado es razonable esperar.",
        },
      ],
      candidateTitle: "La evaluacion define si el beneficio sera realmente visible",
      candidateDescription:
        "No todas las papadas se explican solo por grasa. Por eso es importante distinguir entre volumen localizado y flacidez predominante.",
      candidatePoints: [
        "Tienes grasa localizada bajo el menton",
        "Buscas una mandibula mas visible en perfil y frontal",
        "La calidad de tu piel permite una buena adaptacion",
        "Quieres una opcion focalizada y personalizada",
        "Entiendes el proceso de evolucion postoperatoria",
      ],
      faqItems: [
        {
          question: "La lipopapada sirve si tambien tengo flacidez?",
          answer:
            "Depende del grado de laxitud. Si la flacidez es importante, la sola extraccion de grasa puede no ser suficiente. La evaluacion define si conviene complementar o indicar otra alternativa.",
        },
        {
          question: "Cuando se empieza a notar el cambio?",
          answer:
            "El perfil comienza a verse mas limpio a medida que desinflama la zona. El tiempo exacto depende de tu respuesta individual y del cuidado postoperatorio.",
        },
        {
          question: "Es un procedimiento para cualquier edad?",
          answer:
            "La edad por si sola no define la indicacion. Lo importante es cuanta grasa localizada existe y como responde tu piel una vez tratada la zona.",
        },
        {
          question: "Se puede combinar con tecnologias de retraccion?",
          answer:
            "En algunos casos si, especialmente cuando conviene apoyar la adaptacion cutanea. Esa decision se toma segun el examen clinico de tu cuello y mandibula.",
        },
      ],
      closingTitle: "Agenda tu evaluacion para saber si la lipopapada puede definir tu perfil",
      closingDescription:
        "Analizaremos grasa submentoniana, calidad de piel y objetivos para decidir la mejor estrategia para tu cuello y mandibula.",
    },
  },
  {
    id: "armtite-renuvion",
    title: "ArmTite + Renuvion",
    eyebrow: "Retraccion de piel",
    cardDescription:
      "Tecnologias de retraccion para tensar piel y mejorar contorno con minima invasion.",
    resultsDescription:
      "Resultados reales de tecnologias de retraccion ArmTite y Renuvion para mejorar firmeza de piel y limpieza del contorno.",
    href: "/procedimientos/armtite-renuvion",
    folder: "tecnologias de retracci\u00f3n Armtite Renuvion",
    files: [
      "default_0e870a57-29a3-44a8-9f18-a40e68bb6709_0.jpg",
      "default_59f88cd6-2013-487e-a61f-b646954a052b_0.jpg",
      "default_76fbded5-0ed2-46ba-9450-feb50b6b5eba_0.jpg",
      "default_a8ee4c60-6791-40b3-b0ff-8290883f1319_0.jpg",
      "default_c7113747-697d-43e1-9115-bebcc416f870_0.jpg",
      "PCIMG_2025-12-12_09-56-18.JPG",
    ],
    landing: {
      heroLabel: "Tecnologias de firmeza",
      heroTitle: "ArmTite + Renuvion para retraccion de piel y mejor contorno",
      heroDescription:
        "Estas tecnologias ayudan a mejorar firmeza y adaptacion de la piel en zonas con laxitud, especialmente cuando se busca un procedimiento menos extenso que una cirugia abierta.",
      heroBadges: ["Retraccion de piel", "Complemento de contorno corporal", "Plan segun calidad tisular"],
      challengeTitle: "Cuando hay poca grasa pero la piel no acompana el contorno",
      challengeDescription:
        "En algunas zonas, el problema principal no es el volumen sino la flacidez. En esos casos, la retraccion cutanea puede ser la pieza que falta para un resultado mas limpio.",
      challengeCards: [
        {
          icon: WandSparkles,
          title: "Laxitud visible en brazos u otras zonas",
          description:
            "La piel puede verse suelta incluso cuando no hay gran exceso de grasa localizada.",
        },
        {
          icon: Layers3,
          title: "Contorno sin soporte suficiente",
          description:
            "Despues de bajar de peso o tras una lipo, la piel puede no retraerse como esperabas.",
        },
        {
          icon: ShieldCheck,
          title: "Buscas una opcion menos invasiva",
          description:
            "Estas tecnologias se consideran cuando el grado de flacidez permite una alternativa menos extensa que una reseccion quirurgica mayor.",
        },
      ],
      procedureTitle: "Tecnologias de retraccion indicadas segun zona y grado de laxitud",
      procedureDescription:
        "El valor de ArmTite y Renuvion esta en seleccionar bien los casos. No reemplazan todas las cirugias, pero pueden ser excelentes aliados cuando la piel necesita ayuda para adaptarse mejor.",
      procedureParagraphs: [
        "ArmTite y Renuvion trabajan desde el interior para apoyar la contraccion de tejidos y mejorar la lectura del contorno en zonas con flacidez leve o moderada.",
        "Pueden usarse como procedimiento principal en casos seleccionados o como complemento de lipoescultura cuando conviene optimizar la adaptacion de la piel.",
        "La indicacion siempre depende de la calidad del tejido, de la zona corporal y del resultado realista que puede ofrecer una tecnologia de retraccion.",
      ],
      procedureChecks: [
        "Retraccion interna de piel",
        "Plan segun calidad del tejido",
        "Complemento de contorno cuando corresponde",
        "Menor agresion que cirugias extensas en casos seleccionados",
      ],
      benefitsTitle: "Cuando estas tecnologias estan bien indicadas, el objetivo es claro",
      benefitsDescription:
        "Buscamos que la piel acompanhe mejor el nuevo contorno y que la zona se vea mas compacta y ordenada.",
      benefitCards: [
        {
          icon: Activity,
          title: "Mejor adaptacion de la piel",
          description:
            "Ayudan a que el tejido se retraiga mejor alrededor del contorno tratado.",
        },
        {
          icon: Target,
          title: "Contorno mas limpio",
          description:
            "Pueden mejorar la definicion visual de zonas donde la flacidez tiene un rol importante.",
        },
        {
          icon: HeartPulse,
          title: "Indicacion personalizada",
          description:
            "No todos los casos necesitan esta tecnologia. La evaluacion define si realmente suma valor.",
        },
      ],
      candidateTitle: "La clave esta en distinguir entre flacidez tratable y exceso mayor de piel",
      candidateDescription:
        "Estas tecnologias suelen beneficiar mejor a pacientes con laxitud leve o moderada que buscan mejorar firmeza con una estrategia menos invasiva.",
      candidatePoints: [
        "Tienes flacidez leve o moderada en brazos u otras zonas",
        "Buscas mejorar firmeza de piel y limpieza del contorno",
        "Quieres saber si una tecnologia basta o si necesitas otra cirugia",
        "Entiendes que la indicacion depende de tu tejido real",
        "Priorizas un plan honesto y personalizado",
      ],
      faqItems: [
        {
          question: "ArmTite o Renuvion reemplazan una cirugia de reseccion de piel?",
          answer:
            "No siempre. En casos con exceso importante de piel, una tecnologia de retraccion puede no ser suficiente. La evaluacion medica permite definir hasta donde puede ayudarte cada opcion.",
        },
        {
          question: "Se pueden usar junto a liposuccion?",
          answer:
            "Si, en algunos casos se indican como complemento para mejorar la adaptacion de la piel despues de tratar grasa localizada. Todo depende de la zona y del objetivo final.",
        },
        {
          question: "En que zonas suelen indicarse?",
          answer:
            "Puede evaluarse su uso en brazos y otras zonas donde la flacidez tenga protagonismo. La indicacion exacta se confirma segun la calidad del tejido y el resultado que buscas.",
        },
        {
          question: "Cuando se aprecia la retraccion final?",
          answer:
            "La evolucion es progresiva. La piel va adaptandose en las semanas y meses posteriores, por lo que el resultado se interpreta mejor una vez superada la inflamacion inicial.",
        },
      ],
      closingTitle: "Agenda tu evaluacion para saber si ArmTite + Renuvion es la mejor estrategia",
      closingDescription:
        "Revisaremos grado de laxitud, calidad de piel y objetivos para definir si una tecnologia de retraccion puede darte el resultado que buscas.",
    },
  },
];

export const procedureCatalog: ProcedureCatalogItem[] = procedureDefinitions.map((procedure) => {
  const cases = procedure.folder && procedure.files ? buildCases(procedure.id, procedure.title, procedure.folder, procedure.files) : [];

  return {
    ...procedure,
    image: procedure.image ?? cases[0]?.src ?? "/placeholder.svg",
    cases,
    previewCases: cases.slice(0, 3),
  };
});

export const proceduresWithResults = procedureCatalog.filter((procedure) => procedure.cases.length > 0);

export const buildResultsFilterHref = (procedureId: ProcedureId) =>
  `/resultados?${resultsFilterParam}=${encodeURIComponent(procedureId)}`;

export const getProcedureById = (procedureId: ProcedureId | string) =>
  procedureCatalog.find((procedure) => procedure.id === procedureId);
