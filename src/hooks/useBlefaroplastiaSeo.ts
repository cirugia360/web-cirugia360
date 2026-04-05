import { useEffect } from "react";
import { canonicalUrl, clinicUrl, faqItems, ogImagePath } from "@/pages/blefaroplastiaData";

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

const useBlefaroplastiaSeo = () => {
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
          name: "Blefaroplastia",
          description:
            "Cirugia de parpados para tratar exceso de piel en parpados superiores, bolsas en parpados inferiores y mirada cansada con un resultado natural.",
          howPerformed:
            "Evaluacion personalizada del contorno ocular, plan quirurgico segun parpado superior, inferior o combinado, y recuperacion guiada",
          procedureType: "https://schema.org/CosmeticProcedure",
          bodyLocation: "Parpados superiores e inferiores",
          preparation:
            "Evaluacion de exceso de piel, bolsas, antecedentes oculares, expresion y armonia de la mirada",
          provider: { "@id": localBusinessId },
        },
        {
          "@type": "Physician",
          "@id": physicianId,
          name: "Dr. Sebastian Torres Farr",
          description:
            "Cirujano con formacion internacional en cirugia facial y estetica. Especialista en Cirugia de Cabeza, Cuello y Maxilofacial con enfoque en rejuvenecimiento natural de la mirada.",
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
            "Clinica de cirugia plastica y estetica en Santiago, Chile. Especialistas en rejuvenecimiento facial, blefaroplastia, rinoplastia y lipoescultura de alta definicion.",
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
      "Blefaroplastia en Chile | Cirugia de Parpados con Resultado Natural - Cirugia 360";
    document.documentElement.lang = "es";

    upsertMetaTag(
      head,
      'meta[name="description"]',
      { name: "description" },
      "Blefaroplastia para corregir parpados pesados, exceso de piel y bolsas bajo los ojos con resultado natural. Evaluacion personalizada con el Dr. Sebastian Torres Farr en Cirugia 360.",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="keywords"]',
      { name: "keywords" },
      "blefaroplastia, blefaroplastia Chile, cirugia de parpados, parpados caidos, bolsas bajo los ojos, blefaroplastia superior, blefaroplastia inferior, rejuvenecimiento de mirada, blefaroplastia Santiago, Dr. Sebastian Torres Farr, Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:title"]',
      { property: "og:title" },
      "Blefaroplastia en Chile - Mirada Mas Fresca y Natural | Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:description"]',
      { property: "og:description" },
      "Corrige exceso de piel en parpados y bolsas bajo los ojos con una blefaroplastia enfocada en naturalidad y expresion.",
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
      "Blefaroplastia en Cirugia 360",
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
      "Blefaroplastia en Chile - Mirada Mas Fresca y Natural | Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      "Corrige exceso de piel en parpados y bolsas bajo los ojos con una blefaroplastia enfocada en naturalidad y expresion.",
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
    schemaScript.id = "blefaroplastia-schema";
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

export default useBlefaroplastiaSeo;
