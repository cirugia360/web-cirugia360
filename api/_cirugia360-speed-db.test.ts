import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: supabaseMocks.createClient,
}));

import { claimStaleAgentCallLeads } from "./_cirugia360-speed-db.js";

describe("cirugia360 speed-to-lead stale queue claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete globalThis.__cirugia360SpeedSupabaseAdmin__;
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  });

  it("recovers stale dispatching rows as well as stale agent calls", async () => {
    const staleLead = {
      id: "lead-dispatching",
      status: "dispatching",
      updated_at: "2026-05-14T12:00:00.000Z",
    };
    const recoveredLead = {
      ...staleLead,
      sales_call_status: "stale",
      last_error: "El intento de llamada a la asesora vencio.",
    };
    const selectIn = vi.fn();
    const updateIn = vi.fn();
    let updatePayload = null;

    const selectBuilder = {
      in: selectIn.mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [staleLead], error: null }),
    };
    const updateBuilder = {
      eq: vi.fn().mockReturnThis(),
      in: updateIn.mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: recoveredLead, error: null }),
    };
    const tableBuilder = {
      select: vi.fn(() => selectBuilder),
      update: vi.fn((payload) => {
        updatePayload = payload;
        return updateBuilder;
      }),
    };

    supabaseMocks.createClient.mockReturnValue({
      from: vi.fn(() => tableBuilder),
    });

    const result = await claimStaleAgentCallLeads({
      limit: 5,
      staleBeforeIso: "2026-05-14T12:01:00.000Z",
    });

    expect(selectIn).toHaveBeenCalledWith(
      "status",
      expect.arrayContaining(["dispatching", "dialing_agent", "waiting_agent_confirmation"]),
    );
    expect(updateIn).toHaveBeenCalledWith(
      "status",
      expect.arrayContaining(["dispatching", "dialing_agent", "waiting_agent_confirmation"]),
    );
    expect(updatePayload).toMatchObject({
      status: "dispatching",
      sales_call_status: "stale",
      twilio_sales_call_sid: null,
    });
    expect(result).toEqual([recoveredLead]);
  });
});
