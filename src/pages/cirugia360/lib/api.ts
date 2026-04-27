import {
  getDashboardAccessToken,
  getDashboardSupabase,
} from "@/lib/dashboardSupabase";
import type { ApiResult } from "./types";

export class SessionExpiredError extends Error {
  constructor() {
    super("Tu sesión expiró, vuelve a iniciar.");
    this.name = "SessionExpiredError";
  }
}

export class DashboardApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DashboardApiError";
    this.status = status;
  }
}

export const isSessionExpiredError = (error: unknown) => error instanceof SessionExpiredError;

export const getDashboardErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof DashboardApiError) {
    if (error.status === 0) {
      return `${error.message} Revisa tu conexion e intenta nuevamente.`;
    }

    if (error.status === 409) {
      return `${error.message} Actualiza manualmente para reconciliar el estado.`;
    }

    if (error.status >= 500) {
      return `${error.message} Intenta nuevamente en unos segundos.`;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

const stringifyApiError = (error: unknown, fallback: string) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof record.error === "string") {
      return record.error;
    }

    if (typeof record.details === "string") {
      return record.details;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }

  return String(error);
};

export const apiRequest = async <T,>(path: string, options: RequestInit = {}, hasRetriedAuth = false): Promise<T> => {
  const token = await getDashboardAccessToken();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(path, {
      ...options,
      headers,
    });
  } catch {
    throw new DashboardApiError("No pudimos conectar con el servidor.", 0);
  }

  const payload = (await response.json().catch(() => null)) as ApiResult<T> | null;

  if (response.status === 401) {
    if (!hasRetriedAuth) {
      const { data, error } = await getDashboardSupabase().auth.refreshSession();

      if (!error && data.session) {
        return apiRequest<T>(path, options, true);
      }
    }

    throw new SessionExpiredError();
  }

  if (!response.ok || !payload?.success) {
    throw new DashboardApiError(
      stringifyApiError(payload?.error, "No pudimos completar la accion."),
      response.status || 0,
    );
  }

  return (payload.data ?? payload) as T;
};
