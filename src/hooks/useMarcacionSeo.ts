import { useEffect } from "react";
import marcacionHero from "@/assets/marcacion-hero.jpg";
import { canonicalUrl, faqItems } from "@/pages/marcacionData";

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

export const useMarcacionSeo = () => {
  useEffect(() => {
    const head = document.head;
    const cleanups: Array<() => void> = [];
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const ogImageUrl = new URL(marcacionHero, window.location.origin).toString();

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "MedicalProcedure",
          "@id": `${canonicalUrl}#medical-procedure`,
          name: "Lipoescultura de Alta Definición - Marcación Nivel Dios",
          description:
            "Procedimiento de lipoescultura de alta definición con marcación abdominal 3D, Renuvion, BodyTite y UGRAFT para redefinir el contorno corporal.",
          howPerformed:
            "Combinación de lipoescultura de alta definición, retracción con Renuvion y BodyTite, y lipotransferencia UGRAFT según la anatomía y objetivos del paciente.",
          procedureType: "https://schema.org/CosmeticProcedure",
          bodyLocation: "Abdomen, cintura y contorno corporal",
          provider: { "@id": "https://cirugia360.cl/#localbusiness" },
        },
        {
          "@type": "Physician",
          "@id": "https://cirugia360.cl/#physician",
          name: "Dr. Sebastián Torres Farr",
          description:
            "Cirujano pionero en marcación de alta definición en Latinoamérica con más de 1.500 casos exitosos.",
          medicalSpecialty: "PlasticSurgery",
          areaServed: "Chile",
          memberOf: "Colegio Médico de Chile",
          worksFor: { "@id": "https://cirugia360.cl/#localbusiness" },
        },
        {
          "@type": "LocalBusiness",
          "@id": "https://cirugia360.cl/#localbusiness",
          name: "Cirugía 360",
          description:
            "Centro de cirugía de contorno corporal y lipoescultura de alta definición en Santiago, Chile.",
          url: canonicalUrl,
          telephone: "+56 9 1234 5678",
          email: "contacto@cirugia360.cl",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Santiago",
            addressCountry: "CL",
          },
        },
        {
          "@type": "FAQPage",
          "@id": `${canonicalUrl}#faq-schema`,
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
      ],
    };

    document.title =
      "Lipoescultura de Alta Definición en Chile | Marcación Abdominal 3D — Cirugía 360";
    document.documentElement.lang = "es";

    upsertMetaTag(
      head,
      'meta[name="description"]',
      { name: "description" },
      "Lipoescultura de alta definición con marcación abdominal 3D, Renuvion, BodyTite y UGRAFT. Dr. Sebastián Torres Farr, pionero en Latinoamérica. +1.500 casos exitosos. Agenda tu evaluación en Cirugía 360.",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="keywords"]',
      { name: "keywords" },
      "lipoescultura, lipoescultura de alta definición, marcación abdominal, lipo de alta definición, lipo HD, marcación nivel dios, liposucción, abdomen definido, cirugía 360, Dr. Sebastián Torres Farr, Santiago Chile, six pack, definición muscular, Renuvion, BodyTite, UGRAFT",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:title"]',
      { property: "og:title" },
      "Lipoescultura de Alta Definición — Marcación Nivel Dios | Cirugía 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[property="og:description"]',
      { property: "og:description" },
      "Transforma tu contorno corporal con la técnica de marcación abdominal más avanzada de Latinoamérica. +1.500 casos exitosos.",
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
      "Lipoescultura de Alta Definición — Marcación Nivel Dios | Cirugía 360",
      cleanups,
    );
    upsertMetaTag(
      head,
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      "Transforma tu contorno corporal con la técnica de marcación abdominal más avanzada de Latinoamérica. +1.500 casos exitosos.",
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
    schemaScript.id = "marcacion-nivel-dios-schema";
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

export default useMarcacionSeo;
