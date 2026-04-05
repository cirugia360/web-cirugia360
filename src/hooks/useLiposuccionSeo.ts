import { useEffect } from "react";
import { canonicalUrl, clinicUrl, faqItems, ogImagePath } from "@/pages/liposuccionData";

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

const useLiposuccionSeo = () => {
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
          name: "Liposuccion",
          description:
            "Cirugia de contorno corporal para remover grasa localizada y modelar zonas como abdomen, cintura, espalda, brazos o muslos con un resultado natural.",
          howPerformed:
            "Evaluacion corporal personalizada, plan por zonas o contorno amplio y recuperacion guiada segun anatomia, volumen y calidad de piel",
          procedureType: "https://schema.org/CosmeticProcedure",
          bodyLocation: "Abdomen, cintura, espalda, brazos, muslos y contorno corporal",
          preparation:
            "Evaluacion de grasa localizada, elasticidad de la piel, proporciones y objetivos esteticos",
          provider: { "@id": localBusinessId },
        },
        {
          "@type": "Physician",
          "@id": physicianId,
          name: "Dr. Sebastian Torres Farr",
          description:
            "Cirujano con formacion internacional en contorno corporal y estetica. Especialista en Cirugia de Cabeza, Cuello y Maxilofacial con enfoque en resultados naturales y proporcionados.",
          medicalSpecialty: "PlasticSurgery",
          memberOf: [
            { "@type": "Organization", name: "Sociedad Americana de Cirugia Plastica" },
            { "@type": "Organization", name: "Sociedad Europea de Cirugia Plastica Facial (EAFPS)" },
            { "@type": "Organization", name: "Sociedad Italiana de Cirugia Plastica (AICPE)" },
            { "@type": "Organization", name: "Colegio Medico de Chile" },
          ],
          award: [
            "Mejor Cirujano Plastico Facial 2023 - AMWC World Congress, Monaco",
            "Master en Contorno Corporal Total Definer - Bogota, Colombia",
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
            "Clinica de cirugia plastica y estetica en Santiago, Chile. Especialistas en contorno corporal, liposuccion, rejuvenecimiento facial y rinoplastia.",
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
      "Liposuccion en Chile | Contorno Corporal con Resultado Natural - Cirugia 360";
    document.documentElement.lang = "es";

    upsertMetaTag(
      head,
      'meta[name="description"]',
      { name: "description" },
      "Liposuccion para corregir grasa localizada y mejorar el contorno corporal con resultado natural. Evaluacion personalizada con el Dr. Sebastian Torres Farr en Cirugia 360.",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="keywords"]',
      { name: "keywords" },
      "liposuccion, liposuccion Chile, lipoescultura, grasa localizada, contorno corporal, liposuccion abdomen, liposuccion cintura, lipo 360, liposuccion Santiago, Dr. Sebastian Torres Farr, Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:title"]',
      { property: "og:title" },
      "Liposuccion en Chile - Contorno Corporal Natural | Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:description"]',
      { property: "og:description" },
      "Corrige grasa localizada y mejora tu silueta con una liposuccion enfocada en proporciones, armonia y naturalidad.",
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
      "Liposuccion en Cirugia 360",
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
      "Liposuccion en Chile - Contorno Corporal Natural | Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      "Corrige grasa localizada y mejora tu silueta con una liposuccion enfocada en proporciones, armonia y naturalidad.",
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
    schemaScript.id = "liposuccion-schema";
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

export default useLiposuccionSeo;
