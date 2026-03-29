import { sendHtml } from "../_blog-shared.js";
import { extractPaymentRedirectFromHtml, isFlowPaymentUrl, toHttpUrl } from "../_reservo.js";

const RESERVO_PAYMENT_HOSTS = new Set(["reservo.cl", "www.reservo.cl"]);

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getAllowedReservoUrl = (value) => {
  const normalized = toHttpUrl(value);

  if (!normalized) {
    return "";
  }

  try {
    const url = new URL(normalized);
    return RESERVO_PAYMENT_HOSTS.has(url.hostname.toLowerCase()) ? url.toString() : "";
  } catch {
    return "";
  }
};

const isReservoPaymentUrl = (value) => Boolean(getAllowedReservoUrl(value));

const buildGetUrlWithFields = (url, fields) => {
  const normalized = toHttpUrl(url);

  if (!normalized) {
    return "";
  }

  try {
    const nextUrl = new URL(normalized);

    Object.entries(fields || {}).forEach(([key, value]) => {
      const name = String(key || "").trim();

      if (!name) {
        return;
      }

      nextUrl.searchParams.set(name, String(value || ""));
    });

    return nextUrl.toString();
  } catch {
    return "";
  }
};

const redirectTo = (response, location) => {
  response.statusCode = 302;
  response.setHeader("Location", location);
  response.end();
};

const buildAutoSubmitHtml = (redirect) => {
  const hiddenInputs = Object.entries(redirect.fields || {})
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirigiendo al pago</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f6f4ef;
        color: #1e293b;
        font-family: Inter, Arial, sans-serif;
      }

      .card {
        width: min(92vw, 32rem);
        padding: 2rem;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 1.5rem;
        background: white;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
        text-align: center;
      }

      h1 {
        margin: 0 0 0.75rem;
        font-size: 1.5rem;
      }

      p {
        margin: 0;
        line-height: 1.6;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Redirigiendo al pago</h1>
      <p>Estamos conectando tu reserva con la pasarela de pago segura.</p>
    </main>
    <form id="payment-bridge-form" method="${escapeHtml(redirect.method)}" action="${escapeHtml(redirect.url)}">
      ${hiddenInputs}
    </form>
    <script>
      window.setTimeout(function () {
        document.getElementById("payment-bridge-form").submit();
      }, 50);
    </script>
  </body>
</html>`;
};

const buildBridgeHtml = (html, pageUrl) => {
  const baseTag = `<base href="${escapeHtml(pageUrl)}" />`;
  const bridgeScript = `
    <script>
      (function () {
        const flowHostPattern = /(^|\\.)flow\\.cl$/i;
        const toAbsoluteUrl = (value) => {
          try {
            return new URL(value || "", document.baseURI).toString();
          } catch {
            return "";
          }
        };
        const isFlowUrl = (value) => {
          try {
            const url = new URL(toAbsoluteUrl(value));
            return flowHostPattern.test(url.hostname);
          } catch {
            return false;
          }
        };
        const scoreForm = (form) => {
          const action = toAbsoluteUrl(form.getAttribute("action") || window.location.href);
          const text = (form.innerText || form.textContent || "").toLowerCase();
          let score = 0;
          if (isFlowUrl(action)) score += 100;
          if (/realizar\\s+pago/.test(text)) score += 50;
          if (/pagar|payment|flow|wflow/.test(text)) score += 25;
          if (form.querySelector('input[type="radio"], input[type="hidden"]')) score += 10;
          return { form, action, score };
        };
        const chooseBestForm = () =>
          Array.from(document.forms)
            .map(scoreForm)
            .sort((left, right) => right.score - left.score)[0];
        const triggerPayment = () => {
          const best = chooseBestForm();
          if (best && best.score > 0) {
            const firstRadio = best.form.querySelector('input[type="radio"]');
            if (firstRadio && !firstRadio.checked) {
              firstRadio.checked = true;
            }
            best.form.submit();
            return true;
          }
          const button = Array.from(
            document.querySelectorAll('input[type="submit"], button, a')
          ).find((element) => {
            const text = (element.value || element.innerText || element.textContent || "").toLowerCase();
            const href = element.getAttribute("href") || element.getAttribute("onclick") || "";
            return /realizar\\s+pago|pagar/.test(text) || /flow|wflow/.test(text) || /flow\\.cl/i.test(href);
          });
          if (button) {
            if (button.tagName === "A") {
              window.location.assign(toAbsoluteUrl(button.getAttribute("href") || ""));
              return true;
            }
            button.click();
            return true;
          }
          return false;
        };
        const boot = () => {
          triggerPayment();
          window.setTimeout(triggerPayment, 250);
          window.setTimeout(triggerPayment, 1000);
        };
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        } else {
          boot();
        }
      })();
    </script>
  `;
  const overlayMarkup = `
    <div style="position:fixed;inset:0;display:grid;place-items:center;background:rgba(246,244,239,.94);z-index:2147483647;font-family:Inter,Arial,sans-serif;">
      <div style="width:min(92vw,32rem);padding:2rem;border:1px solid rgba(15,23,42,.08);border-radius:1.5rem;background:#fff;box-shadow:0 24px 60px rgba(15,23,42,.08);text-align:center;color:#1e293b;">
        <h1 style="margin:0 0 .75rem;font-size:1.5rem;">Redirigiendo al pago</h1>
        <p style="margin:0;line-height:1.6;color:#475569;">Estamos conectando tu reserva con la pasarela de pago segura.</p>
      </div>
    </div>
  `;

  let nextHtml = html;

  if (/<head\b[^>]*>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<head\b[^>]*>/i, (match) => `${match}\n${baseTag}`);
  } else {
    nextHtml = `${baseTag}\n${nextHtml}`;
  }

  if (/<body\b[^>]*>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<body\b([^>]*)>/i, `<body$1>\n${overlayMarkup}`);
  } else {
    nextHtml = `<!doctype html><html><head>${baseTag}</head><body>${overlayMarkup}${nextHtml}</body></html>`;
  }

  if (/<\/body>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<\/body>/i, `${bridgeScript}\n</body>`);
  } else {
    nextHtml = `${nextHtml}\n${bridgeScript}`;
  }

  return nextHtml;
};

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendHtml(response, 405, "<p>Metodo no permitido.</p>");
    return;
  }

  const targetParam = Array.isArray(request.query?.target) ? request.query.target[0] : request.query?.target;
  const targetUrl = getAllowedReservoUrl(targetParam);

  if (!targetUrl) {
    sendHtml(response, 400, "<p>URL de pago invalida.</p>");
    return;
  }

  try {
    const remoteResponse = await fetch(targetUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; Cirugia360PaymentBridge/1.0)",
      },
      redirect: "follow",
    });

    if (!remoteResponse.ok) {
      sendHtml(response, 502, "<p>No se pudo cargar la pagina de pago.</p>");
      return;
    }

    const finalUrl = toHttpUrl(remoteResponse.url) || targetUrl;

    if (isFlowPaymentUrl(finalUrl)) {
      redirectTo(response, finalUrl);
      return;
    }

    const html = await remoteResponse.text();
    const redirect = extractPaymentRedirectFromHtml(html, finalUrl);

    if (redirect) {
      if (redirect.method === "GET") {
        const getUrl = buildGetUrlWithFields(redirect.url, redirect.fields);

        if (getUrl && !isReservoPaymentUrl(getUrl)) {
          redirectTo(response, getUrl);
          return;
        }
      }

      sendHtml(response, 200, buildAutoSubmitHtml(redirect));
      return;
    }

    sendHtml(response, 200, buildBridgeHtml(html, finalUrl));
  } catch (error) {
    console.error("Reservo payment bridge error", error);
    sendHtml(response, 502, "<p>No se pudo completar la redireccion al pago.</p>");
  }
}
