import { useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { LayoutDashboard, RefreshCcw } from "lucide-react";
import {
  getDashboardSupabase,
  getDashboardSupabaseConfigError,
} from "@/lib/dashboardSupabase";

export const LoginPanel = ({ onReady, banner }: { onReady: (session: Session) => void; banner?: string }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const configError = getDashboardSupabaseConfigError();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = getDashboardSupabase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.session) {
        throw signInError || new Error("No pudimos iniciar sesion.");
      }

      onReady(data.session);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "No pudimos iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-dashboard-page-muted px-4 py-12 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-md place-items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Cirugia360
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Dashboard comercial</h1>
          </div>

          {banner ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
              {banner}
            </div>
          ) : null}

          {configError ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {configError}
            </div>
          ) : null}

          <label className="mb-3 block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="mb-4 block text-sm font-medium">
            Password
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={Boolean(configError) || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />}
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
};
