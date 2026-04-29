import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const META_PIXEL_NOSCRIPT_MARKER = "<!-- meta-pixel-noscript -->";
const META_PIXEL_ID_TOKEN = "__C360_META_PIXEL_ID__";

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeScriptStringContent = (value: string) => JSON.stringify(value).slice(1, -1);

const createMetaPixelNoscriptPlugin = (pixelId: string): Plugin => ({
  name: "cirugia360-meta-pixel-noscript",
  transformIndexHtml(html) {
    const nextHtml = html.replaceAll(
      META_PIXEL_ID_TOKEN,
      pixelId ? escapeScriptStringContent(pixelId) : "",
    );

    if (!pixelId) {
      return nextHtml.replace(META_PIXEL_NOSCRIPT_MARKER, "");
    }

    const safePixelId = escapeHtmlAttribute(pixelId);
    const trackingUrl = `https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`;

    return nextHtml.replace(
      META_PIXEL_NOSCRIPT_MARKER,
      `<noscript><img height="1" width="1" style="display:none" alt="" src="${trackingUrl}" data-meta-pixel-id="${safePixelId}" /></noscript>`,
    );
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const metaPixelId = (env.VITE_META_PIXEL_ID || "").trim();

  return {
    server: {
      host: "::",
      port: 3000,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
        },
      },
    },
    plugins: [
      createMetaPixelNoscriptPlugin(metaPixelId),
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
