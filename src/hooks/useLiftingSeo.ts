import { useEffect } from "react";
import { canonicalUrl, clinicUrl, faqItems, ogImagePath } from "@/pages/liftingData";

const upsertMetaTag = (
  head: HTMLHeadElement,
  selector: string,
  attributes: Record<string, string>,
  content: string,
  cleanups: Array<() => void>,
) => {
  let element = head.querySelector(selector) as HTMLMetaElement | null;

  if (element) {
    const previousContent = element.getAttribute("content");
    cleanups.push(() => {
      if (previousContent === null) {
        element.removeAttribute("content");
        return;
      }

      element.setAttribute("content", previousContent);
    });
  } else {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    head.appendChild(element);
    cleanups.push(() => element?.remove());
  }

  element.setAttribute("content", content);
};

const upsertLinkTag = (
  head: HTMLHeadElement,
  selector: string,
  attributes: Record<string, string>,
  href: string,
  cleanups: Array<() => void>,
) => {
  let element = head.querySelector(selector) as HTMLLinkElement | null;

  if (element) {
    const previousHref = element.getAttribute("href");
    cleanups.push(() => {
      if (previousHref === null) {
        element.removeAttribute("href");
        return;
      }

      element.setAttribute("href", previousHref);
    });
  } else {
    element = document.createElement("link");
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    head.appendChild(element);
    cleanups.push(() => element?.remove());
  }

  element.setAttribute("href", href);
};

const useLiftingSeo = () => {
  useEffect(() => {
    const head = document.head;
    const cleanups: Array<() => void> = [];
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const ogImageUrl = new URL(ogImagePath, window.location.origin).toString();
    const localBusinessId = `${clinicUrl}#localbusiness`;
    const physicianId = `${clinicUrl}#physician`;
    const medicalProcedureId = `${canonicalUrl}#medical-procedure`;
    const faqId = `${canonicalUrl}#faq-schema`;

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "MedicalProcedure",
          "@id": medicalProcedureId,
          name: "Lifting facial",
          description:
            "Procedimiento de rejuvenecimiento facial para reposicionar tejidos profundos, definir mandibula y tratar la laxitud de rostro y cuello con un resultado natural.",
          howPerformed:
            "Evaluacion facial personalizada, plan quirurgico segun el grado de laxitud y lifting facial de rostro y cuello con recuperacion guiada",
          procedureType: "https://schema.org/CosmeticProcedure",
          bodyLocation: "Rostro, mandibula y cuello",
          preparation:
            "Evaluacion facial, analisis de soporte profundo, cuello, calidad de piel y armonia del perfil",
          provider: { "@id": localBusinessId },
        },
        {
          "@type": "Physician",
          "@id": physicianId,
          name: "Dr. Sebastian Torres Farr",
          description:
            "Cirujano con formacion internacional en cirugia facial y estetica. Especialista en Cirugia de Cabeza, Cuello y Maxilofacial con enfoque en rejuvenecimiento natural.",
          medicalSpecialty: "PlasticSurgery",
          memberOf: [
            { "@type": "Organization", name: "Sociedad Americana de Cirugia Plastica" },
            { "@type": "Organization", name: "Sociedad Europea de Cirugia Plastica Facial (EAFPS)" },
            { "@type": "Organization", name: "Sociedad Italiana de Cirugia Plastica (AICPE)" },
            { "@type": "Organization", name: "Colegio Medico de Chile" },
          ],
          award: [
            "Mejor Cirujano Plastico Facial 2023 - AMWC World Congress, Monaco",
            "Master en Cirugia Estetica - Fondazione Fatebenefratelli, Roma",
          ],
          worksFor: { "@id": localBusinessId },
        },
        {
          "@type": "FAQPage",
          "@id": faqId,
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${item.answer} Agenda tu evaluacion para resolver todas tus dudas.`,
            },
          })),
        },
        {
          "@type": "MedicalBusiness",
          "@id": localBusinessId,
          name: "Cirugia 360",
          description:
            "Clinica de cirugia plastica y estetica en Santiago, Chile. Especialistas en rejuvenecimiento facial, rinoplastia y lipoescultura de alta definicion.",
          url: clinicUrl,
          telephone: "+56 9 1234 5678",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Santiago",
            addressCountry: "CL",
          },
        },
      ],
    };

    document.title =
      "Lifting Facial en Chile | Rejuvenecimiento de Rostro y Cuello - Cirugia 360";
    document.documentElement.lang = "es";

    upsertMetaTag(
      head,
      'meta[name="description"]',
      { name: "description" },
      "Lifting facial para rejuvenecer rostro y cuello con resultados naturales. Reposicion de tejidos, definicion mandibular y recuperacion guiada con el Dr. Sebastian Torres Farr en Cirugia 360.",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="keywords"]',
      { name: "keywords" },
      "lifting facial, lifting facial Chile, rejuvenecimiento facial, lifting de cuello, cirugia de rostro, lifting Santiago, rejuvenecimiento de rostro y cuello, mandibula definida, lifting facial natural, Dr. Sebastian Torres Farr, Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:title"]',
      { property: "og:title" },
      "Lifting Facial en Chile - Rejuvenecimiento Natural | Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:description"]',
      { property: "og:description" },
      "Rejuvenece rostro y cuello con un lifting facial enfocado en definicion, soporte y naturalidad. Agenda tu evaluacion.",
      cleanups,
    );
    upsertMetaTag(head, 'meta[property="og:type"]', { property: "og:type" }, "website", cleanups);
    upsertMetaTag(head, 'meta[property="og:url"]', { property: "og:url" }, canonicalUrl, cleanups);
    upsertMetaTag(
      head,
      'meta[property="og:image"]',
      { property: "og:image" },
      ogImageUrl,
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:image:alt"]',
      { property: "og:image:alt" },
      "Lifting facial en Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:card"]',
      { name: "twitter:card" },
      "summary_large_image",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:title"]',
      { name: "twitter:title" },
      "Lifting Facial en Chile - Rejuvenecimiento Natural | Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      "Rejuvenece rostro y cuello con un lifting facial enfocado en definicion, soporte y naturalidad. Agenda tu evaluacion.",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:image"]',
      { name: "twitter:image" },
      ogImageUrl,
      cleanups,
    );
    upsertLinkTag(head, 'link[rel="canonical"]', { rel: "canonical" }, canonicalUrl, cleanups);

    const schemaScript = document.createElement("script");
    schemaScript.type = "application/ld+json";
    schemaScript.id = "lifting-facial-schema";
    schemaScript.text = JSON.stringify(schema);
    head.appendChild(schemaScript);
    cleanups.push(() => schemaScript.remove());

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLang;
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, []);
};

export default useLiftingSeo;
