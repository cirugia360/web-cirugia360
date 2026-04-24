import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, DashboardApiError, SessionExpiredError } from "./api";

const refreshSession = vi.fn();

vi.mock("@/lib/dashboardSupabase", () => ({
  getDashboardAccessToken: vi.fn(async () => "token-123"),
  getDashboardSupabase: vi.fn(() => ({
    auth: {
      refreshSession,
    },
  })),
}));

describe("apiRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the data payload on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 }),
      ),
    );

    await expect(apiRequest<{ ok: boolean }>("/ok")).resolves.toEqual({ ok: true });
  });

  it("exposes response status for API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ success: false, error: "Conflicto" }), { status: 409 }),
      ),
    );

    await expect(apiRequest("/conflict")).rejects.toMatchObject({
      name: "DashboardApiError",
      status: 409,
      message: "Conflicto",
    } satisfies Partial<DashboardApiError>);
  });

  it("refreshes once on 401 and retries the request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { retried: true } }), { status: 200 }));

    refreshSession.mockResolvedValue({ data: { session: { access_token: "new-token" } }, error: null });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest<{ retried: boolean }>("/retry")).resolves.toEqual({ retried: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws SessionExpiredError when refresh fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ success: false }), { status: 401 })),
    );
    refreshSession.mockResolvedValue({ data: { session: null }, error: new Error("expired") });

    await expect(apiRequest("/expired")).rejects.toBeInstanceOf(SessionExpiredError);
  });
});
