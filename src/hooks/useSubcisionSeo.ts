import { useEffect } from "react";
import { canonicalUrl, clinicUrl, faqItems, ogImagePath } from "@/pages/subcisionData";

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

const useSubcisionSeo = () => {
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
          name: "Subcision Magic - Tratamiento Avanzado de Celulitis",
          description:
            "Tratamiento de celulitis mediante liberación de septos fibrosos con agujas de Nokor, lipoinjerto autólogo para reducir recurrencia y retracción con BodyTite y Renuvion.",
          howPerformed:
            "Marcación precisa en reposo y contracción, subcisión con Nokor, lipoinjerto autólogo y retracción cutánea con BodyTite y Renuvion",
          procedureType: "https://schema.org/CosmeticProcedure",
          bodyLocation: "Glúteos y muslos",
          preparation:
            "Evaluación personalizada del tipo de celulitis, tono de piel, laxitud y objetivos estéticos",
          provider: { "@id": localBusinessId },
        },
        {
          "@type": "Physician",
          "@id": physicianId,
          name: "Dr. Sebastián Torres Farr",
          description:
            "Referente en Subcision Magic en Latinoamérica con +4.000 pacientes tratados y más de 20 años de experiencia. Médico PUC Chile, especialista en Cirugía Cabeza y Cuello y Maxilofacial en la Università degli Studi di Messina, Italia, Master en Cirugía Estética en la Fondazione Fatebenefratelli de Roma.",
          medicalSpecialty: "PlasticSurgery",
          memberOf: [
            { "@type": "Organization", name: "Sociedad Americana de Cirugía Plástica" },
            { "@type": "Organization", name: "Sociedad Europea de Cirugía Plástica Facial (EAFPS)" },
            { "@type": "Organization", name: "Sociedad Italiana de Cirugía Plástica (AICPE)" },
            { "@type": "Organization", name: "Colegio Médico de Chile" },
            { "@type": "Organization", name: "SOCHIMCE (Miembro Honorario)" },
          ],
          award: [
            "Mejor Cirujano Plástico Facial 2023 - AMWC World Congress, Mónaco",
            "Mejor Cirujano EACMFS 2010 - Brujas, Bélgica",
            "Premio Antiaging Medical Congress Roma 2015",
            "Premio Folador SIES Boloña 2015",
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
              text: `${item.answer} Agenda tu valoración para resolver todas tus dudas.`,
            },
          })),
        },
        {
          "@type": "MedicalBusiness",
          "@id": localBusinessId,
          name: "Cirugía 360",
          description:
            "Clínica de cirugía plástica y estética en Santiago, Chile. Especialistas en tratamiento de celulitis, lipoescultura de alta definición y rinoplastia.",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Av La Dehesa 440, Of 315, Lo Barnechea",
            addressLocality: "Santiago",
            addressCountry: "CL",
          },
          telephone: "+56942204831",
          url: clinicUrl,
        },
      ],
    };

    document.title =
      "Tratamiento de Celulitis en Chile | Subcision Magic — Liberación de Septos y Lipoinjerto | Cirugía 360";
    document.documentElement.lang = "es";

    upsertMetaTag(
      head,
      'meta[name="description"]',
      { name: "description" },
      "Subcision Magic: tratamiento avanzado de celulitis con liberación de septos fibrosos, lipoinjerto autólogo y retracción con BodyTite y Renuvion. Dr. Sebastián Torres Farr: +4.000 pacientes, 20+ años de experiencia. Agenda tu valoración en Cirugía 360.",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="keywords"]',
      { name: "keywords" },
      "celulitis, tratamiento celulitis, celulitis Chile, piel de naranja, subcision, subcision magic, cirugía 360, eliminar celulitis, celulitis glúteos, celulitis muslos, Dr. Sebastián Torres Farr, Nokor, BodyTite, Renuvion, lipoinjerto celulitis, septos fibrosos, tratamiento celulitis Santiago, celulitis severa tratamiento",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:title"]',
      { property: "og:title" },
      "Tratamiento de Celulitis — Subcision Magic | Cirugía 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:description"]',
      { property: "og:description" },
      "Elimina la piel de naranja desde la raíz. +4.000 pacientes. 80-90% eliminación de lesiones. Recuperación en 4-5 días. Agenda tu valoración.",
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
      "Tratamiento de celulitis con Subcision Magic en Cirugía 360",
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
      "Tratamiento de Celulitis — Subcision Magic | Cirugía 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      "Elimina la piel de naranja desde la raíz. +4.000 pacientes. 80-90% eliminación de lesiones. Recuperación en 4-5 días. Agenda tu valoración.",
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
    schemaScript.id = "subcision-magic-schema";
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

export default useSubcisionSeo;
