import { createClient } from "@supabase/supabase-js";
import { getHeader, normalizeText, sendJson } from "./_cirugia360-speed-shared.js";

let cachedAuthClient = null;

const getSupabaseAuthKey = () =>
  normalizeText(process.env.SUPABASE_ANON_KEY) ||
  normalizeText(process.env.VITE_SUPABASE_ANON_KEY) ||
  normalizeText(process.env.SUPABASE_PUBLISHABLE_KEY) ||
  normalizeText(process.env.SUPABASE_SERVICE_ROLE_KEY);

const getDashboardAuthClient = () => {
  const supabaseUrl = normalizeText(process.env.SUPABASE_URL) || normalizeText(process.env.VITE_SUPABASE_URL);
  const supabaseKey = getSupabaseAuthKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Faltan SUPABASE_URL y SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY para validar el dashboard.",
    );
  }

  if (!cachedAuthClient) {
    cachedAuthClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedAuthClient;
};

export const getBearerToken = (request) => {
  const authorization = getHeader(request, "authorization");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return normalizeText(match?.[1]);
};

export const requireDashboardAuth = async (request, response) => {
  const token = getBearerToken(request);

  if (!token) {
    sendJson(response, 401, {
      success: false,
      error: "Debes iniciar sesion para acceder al dashboard.",
    });
    return null;
  }

  const client = getDashboardAuthClient();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data?.user) {
    sendJson(response, 401, {
      success: false,
      error: "Tu sesion del dashboard expiro o no es valida.",
    });
    return null;
  }

  return data.user;
};
