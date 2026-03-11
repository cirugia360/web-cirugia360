import { promises as fs } from "node:fs";
import path from "node:path";

let cachedAssets = null;

export const readClientAssets = async () => {
  if (cachedAssets) {
    return cachedAssets;
  }

  const indexPath = path.resolve(process.cwd(), "dist", "index.html");

  try {
    const html = await fs.readFile(indexPath, "utf8");
    const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"[^>]*>/g)].map(
      (match) => match[1],
    );
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"[^>]*><\/script>/g)].map(
      (match) => match[1],
    );

    cachedAssets = { styles, scripts };
    return cachedAssets;
  } catch {
    return { styles: [], scripts: [] };
  }
};
