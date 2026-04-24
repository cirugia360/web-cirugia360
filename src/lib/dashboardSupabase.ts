import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let client: ReturnType<typeof createClient> | null = null;

export const getDashboardSupabaseConfigError = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return "Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para abrir el dashboard.";
  }

  return null;
};

export const getDashboardSupabase = () => {
  const configError = getDashboardSupabaseConfigError();

  if (configError) {
    throw new Error(configError);
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return client;
};

export const getDashboardAccessToken = async () => {
  const supabase = getDashboardSupabase();
  let { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session) {
    return "";
  }

  if (data.session.expires_at && data.session.expires_at * 1000 - Date.now() < 60_000) {
    const refreshed = await supabase.auth.refreshSession();
    data = refreshed.data;
    error = refreshed.error;

    if (error) {
      throw error;
    }
  }

  return data.session?.access_token || "";
};

export const subscribeDashboardSession = (
  callback: (session: Session | null) => void,
) => {
  const supabase = getDashboardSupabase();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));

  return () => data.subscription.unsubscribe();
};
