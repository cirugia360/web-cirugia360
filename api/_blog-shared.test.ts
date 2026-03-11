/** @vitest-environment node */

import { createHmac } from "node:crypto";
import {
  ensureUniqueSlug,
  slugify,
  stripLeadingHeading,
  verifyAutoSeoSignature,
} from "./_blog-shared.js";

describe("blog shared helpers", () => {
  it("removes the leading h1 when it matches the title", () => {
    const html = "<h1>Como elegir a tu cirujano</h1><p>Contenido del articulo.</p>";

    expect(stripLeadingHeading(html, "Como elegir a tu cirujano")).toBe(
      "<p>Contenido del articulo.</p>",
    );
  });

  it("keeps the h1 when it does not match the article title", () => {
    const html = "<h1>Otro encabezado</h1><p>Contenido del articulo.</p>";

    expect(stripLeadingHeading(html, "Como elegir a tu cirujano")).toBe(html);
  });

  it("creates unique slugs for different AutoSEO ids", () => {
    const posts = [
      { slug: "rinoplastia-premium", auto_seo_id: 1 },
      { slug: "rinoplastia-premium-2", auto_seo_id: 2 },
    ];

    expect(ensureUniqueSlug("Rinoplastia Premium", posts, 3)).toBe("rinoplastia-premium-3");
    expect(ensureUniqueSlug("Rinoplastia Premium", posts, 1)).toBe("rinoplastia-premium");
  });

  it("slugifies accents and spaces", () => {
    expect(slugify("Subcision Magic en Chile")).toBe("subcision-magic-en-chile");
    expect(slugify("Marcacion nivel dios")).toBe("marcacion-nivel-dios");
  });

  it("verifies the HMAC signature using the raw body", () => {
    const body = JSON.stringify({ event: "article.published", id: 42 });
    const secret = "super-secret";
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyAutoSeoSignature(body, signature, secret)).toBe(true);
    expect(verifyAutoSeoSignature(body, `${signature}0`, secret)).toBe(false);
  });
});
