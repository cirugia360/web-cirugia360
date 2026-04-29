import { describe, expect, it } from "vitest";

import {
  didSalesCallReachAgent,
  shouldAutoDeactivateAgentForSalesStatus,
} from "./cirugia360-speed/twilio/sales-status.js";

describe("cirugia360 sales status auto-deactivation", () => {
  it("deactivates the agent when Twilio reports no-answer before the call is answered", () => {
    const lead = {
      sales_call_status: "ringing",
    };

    expect(didSalesCallReachAgent(lead)).toBe(false);
    expect(shouldAutoDeactivateAgentForSalesStatus(lead, "failed")).toBe(false);
    expect(shouldAutoDeactivateAgentForSalesStatus(lead, "no-answer")).toBe(true);
    expect(shouldAutoDeactivateAgentForSalesStatus(lead, "busy")).toBe(false);
    expect(shouldAutoDeactivateAgentForSalesStatus(lead, "canceled")).toBe(false);
  });

  it("deactivates only after the agent actually reached the prompt/answer flow", () => {
    expect(
      shouldAutoDeactivateAgentForSalesStatus(
        {
          sales_call_status: "answered",
        },
        "completed",
      ),
    ).toBe(true);

    expect(
      shouldAutoDeactivateAgentForSalesStatus(
        {
          sales_call_status: "answered",
        },
        "failed",
      ),
    ).toBe(true);
  });
});
