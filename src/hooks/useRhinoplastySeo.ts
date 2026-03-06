import { useEffect } from "react";
import { canonicalUrl, faqItems } from "@/pages/rhinoplastyData";

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

const useRhinoplastySeo = () => {
  useEffect(() => {
    const head = document.head;
    const cleanups: Array<() => void> = [];
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const ogImageUrl = new URL("/images/rhinoplasty/torres-rhinoplasty-og.jpg", window.location.origin).toString();

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "MedicalProcedure",
          "@id": `${canonicalUrl}#medical-procedure`,
          name: "Rinoplastia - Torres Rhinoplasty",
          description:
            "Rinoplastia abierta con simulacion 3D previa y tecnologia ultrasonica mini invasiva. Resultados esteticos naturales y mejora funcional respiratoria.",
          howPerformed:
            "Tecnica abierta con simulacion 3D, instrumentos ultrasonicos mini invasivos y evaluacion funcional integral",
          procedureType: "https://schema.org/CosmeticProcedure",
          bodyLocation: "Nariz",
          preparation:
            "Evaluacion facial personalizada, analisis funcional respiratorio y simulacion 3D del resultado",
          provider: { "@id": "https://cirugia360.cl/#localbusiness" },
        },
        {
          "@type": "Physician",
          "@id": "https://cirugia360.cl/#physician",
          name: "Dr. Sebastian Torres Farr",
          description:
            "Cirujano plastico facial con +5.000 rinoplastias realizadas. Medico PUC Chile, especialista en Cirugia Cabeza y Cuello (Universita di Messina, Italia), Master en Rinoplastia (Universita Cattolica di Roma).",
          medicalSpecialty: "PlasticSurgery",
          memberOf: [
            { "@type": "Organization", name: "Sociedad Americana de Cirugia Plastica" },
            { "@type": "Organization", name: "Sociedad Europea de Cirugia Plastica Facial (EAFPS)" },
            { "@type": "Organization", name: "Sociedad Italiana de Cirugia Plastica (AICPE)" },
            { "@type": "Organization", name: "Colegio Medico de Chile" },
          ],
          award: [
            "Mejor Cirujano Plastico Facial 2023 - AMWC World Congress, Monaco",
            "Mejor Cirujano EACMFS 2010 - Brujas, Belgica",
            "Premio Antiaging Medical Congress Roma 2015",
            "Premio Folador SIES Bolonia 2015",
          ],
          worksFor: { "@id": "https://cirugia360.cl/#localbusiness" },
        },
        {
          "@type": "FAQPage",
          "@id": `${canonicalUrl}#faq-schema`,
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
          "@id": "https://cirugia360.cl/#localbusiness",
          name: "Cirugia 360",
          description:
            "Clinica de cirugia plastica y estetica en Santiago, Chile. Especialistas en rinoplastia, lipoescultura de alta definicion y rejuvenecimiento facial.",
          url: canonicalUrl,
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
      "Rinoplastia en Chile | Cirugia de Nariz con Simulacion 3D - Torres Rhinoplasty | Cirugia 360";
    document.documentElement.lang = "es";

    upsertMetaTag(
      head,
      'meta[name="description"]',
      { name: "description" },
      "Rinoplastia abierta con simulacion 3D y tecnologia ultrasonica. Dr. Sebastian Torres Farr: +5.000 rinoplastias, tasa de revision menor al 1%. Resultados naturales, estetica y funcion respiratoria. Agenda tu evaluacion en Cirugia 360.",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="keywords"]',
      { name: "keywords" },
      "rinoplastia, rinoplastia Chile, cirugia de nariz, rinoplastia abierta, rinoplastia Santiago, nariz operada, Torres Rhinoplasty, cirugia 360, simulacion 3D rinoplastia, rinoplastia ultrasonica, Dr. Sebastian Torres Farr, rinoplastia estetica, rinoplastia funcional, operacion de nariz, rinoplastia antes y despues, costo rinoplastia Chile",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:title"]',
      { property: "og:title" },
      "Rinoplastia en Chile - Torres Rhinoplasty con Simulacion 3D | Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:description"]',
      { property: "og:description" },
      "Resultados naturales que armonizan tu rostro. +5.000 rinoplastias exitosas con el Dr. Torres Farr. Simulacion 3D + tecnologia ultrasonica.",
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
      'meta[name="twitter:card"]',
      { name: "twitter:card" },
      "summary_large_image",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:title"]',
      { name: "twitter:title" },
      "Rinoplastia en Chile - Torres Rhinoplasty con Simulacion 3D | Cirugia 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      "Resultados naturales que armonizan tu rostro. +5.000 rinoplastias exitosas con el Dr. Torres Farr. Simulacion 3D + tecnologia ultrasonica.",
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
    schemaScript.id = "torres-rhinoplasty-schema";
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

export default useRhinoplastySeo;
