import { createClient } from "@supabase/supabase-js";
import { getSpeedAdminClient } from "./_cirugia360-speed-db.js";
import { getHeader, normalizeEmail, normalizeText, sendJson } from "./_cirugia360-speed-shared.js";

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

const getAdminEmails = () =>
  normalizeText(process.env.CIRUGIA360_DASHBOARD_ADMIN_EMAILS || process.env.DASHBOARD_ADMIN_EMAILS)
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

export const getDashboardUserRole = (user) => {
  const email = normalizeEmail(user?.email);
  const metadataRole = normalizeText(
    user?.app_metadata?.c360_role ||
      user?.app_metadata?.dashboard_role ||
      user?.user_metadata?.c360_role ||
      user?.user_metadata?.dashboard_role,
  ).toLowerCase();

  if (metadataRole === "admin" || getAdminEmails().includes(email)) {
    return "admin";
  }

  return "agent";
};

export const getDashboardUserContext = (user) => ({
  id: user?.id || null,
  email: normalizeEmail(user?.email),
  role: getDashboardUserRole(user),
});

export const requireDashboardAdmin = (user, response) => {
  const context = getDashboardUserContext(user);

  if (context.role !== "admin") {
    sendJson(response, 403, {
      success: false,
      error: "Solo la cuenta admin puede realizar esta accion.",
    });
    return null;
  }

  return context;
};

export const canAccessLead = (user, lead) => {
  const context = getDashboardUserContext(user);

  if (context.role === "admin") {
    return true;
  }

  return normalizeEmail(lead?.assigned_agent_email) === context.email;
};

export const sendForbiddenLead = (response) =>
  sendJson(response, 403, {
    success: false,
    error: "No tienes acceso a este lead.",
  });

export const getDashboardAuthAdminClient = () => {
  const client = getSpeedAdminClient();

  if (!client.auth?.admin) {
    throw new Error("El cliente admin de Supabase no permite administrar usuarios.");
  }

  return client;
};
