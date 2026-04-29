import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  claimDueSpeedLeads: vi.fn(),
  claimQueuedSpeedLeads: vi.fn(),
  claimStaleAgentCallLeads: vi.fn(),
  findLeadForPaymentCallback: vi.fn(),
  getSpeedAdminClient: vi.fn(),
  getSpeedLeadById: vi.fn(),
  hasActiveLeadForAgent: vi.fn(),
  insertSpeedLead: vi.fn(),
  insertSpeedLeadEvent: vi.fn(),
  updateSpeedLead: vi.fn(),
}));

vi.mock("./_cirugia360-speed-db.js", () => dbMocks);

vi.mock("./_cirugia360-speed-twilio.js", () => ({
  buildLeadSummaryText: (lead) =>
    [lead.full_name, lead.procedure_interest, lead.message].filter(Boolean).join(" | "),
  createTwilioClient: vi.fn(() => ({
    calls: {
      create: vi.fn(),
    },
  })),
}));

import {
  createBookingLeadFromBooking,
  createContactLead,
  dispatchDueLeads,
  extractBookingReference,
  extractExternalReferenceCandidates,
  extractPaymentReference,
  isPositivePaymentStatus,
  scheduleLeadForNextAttempt,
  tryNextAgent,
} from "./_cirugia360-speed-workflow.js";

beforeEach(() => {
  let insertedLead = null;

  vi.clearAllMocks();
  dbMocks.insertSpeedLead.mockImplementation(async (lead) => {
    insertedLead = lead;
    return lead;
  });
  dbMocks.insertSpeedLeadEvent.mockResolvedValue(undefined);
  dbMocks.getSpeedAdminClient.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, event_name: "tracking" },
        error: null,
      }),
    })),
  });
  dbMocks.claimStaleAgentCallLeads.mockResolvedValue([]);
  dbMocks.hasActiveLeadForAgent.mockResolvedValue(true);
  dbMocks.updateSpeedLead.mockImplementation(async (leadId, updates) => ({
    ...(insertedLead || {}),
    ...updates,
    id: leadId,
  }));
});

describe("cirugia360 speed-to-lead payment references", () => {
  const payload = {
    reserva: {
      uuid: "appt-123",
      venta: {
        folio: "sale-456",
      },
    },
    payment_url: "https://flow.cl/app/web/pay.php?token=abc",
    nested: {
      order_id: "order-789",
    },
  };

  it("extracts a payment reference", () => {
    expect(extractPaymentReference(payload)).toBe("sale-456");
  });

  it("extracts a booking reference", () => {
    expect(extractBookingReference(payload)).toBe("appt-123");
  });

  it("collects unique external reference candidates without URLs", () => {
    expect(extractExternalReferenceCandidates(payload)).toEqual([
      "appt-123",
      "sale-456",
      "order-789",
    ]);
  });
});

describe("cirugia360 speed-to-lead positive payment statuses", () => {
  it("accepts positive statuses", () => {
    expect(isPositivePaymentStatus("approved")).toBe(true);
    expect(isPositivePaymentStatus("paid")).toBe(true);
    expect(isPositivePaymentStatus("pagado")).toBe(true);
  });

  it("rejects non-positive statuses", () => {
    expect(isPositivePaymentStatus("pending")).toBe(false);
    expect(isPositivePaymentStatus("failed")).toBe(false);
    expect(isPositivePaymentStatus("")).toBe(false);
  });
});

describe("cirugia360 speed-to-lead contact leads", () => {
  const config = {
    defaultCountryDialCode: "56",
    retryDelaySeconds: 180,
    agentCallCooldownSeconds: 180,
    salesAgents: [{ id: "agent-1", name: "Asesora 1", phone: "+56912345678" }],
    twilioConfigured: false,
    twilioPhoneNumber: "+56229146709",
    appUrl: "https://example.com",
  };

  it("creates contact leads without requiring a payment status variable", async () => {
    const result = await createContactLead(
      {
        fullName: "Thomas Weisskapp",
        phone: "+56 9 9237 2299",
        email: "tweisskapp@gmail.com",
        procedure: "Evaluacion",
        message: "Quiero que me contacten.",
        sourceUrl: "https://example.com",
        metadata: {},
      },
      config,
    );

    expect(dbMocks.insertSpeedLead).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_kind: "contact_request",
        trigger_source: "contact_request",
        payment_status: "not_required",
      }),
    );
    expect(result).toMatchObject({
      callStarted: false,
      queued: true,
      warning: "No habia una asesora libre en este instante. El lead quedo en cola.",
    });
  });
});

describe("cirugia360 speed-to-lead booking leads", () => {
  const config = {
    defaultCountryDialCode: "56",
    retryDelaySeconds: 180,
    agentCallCooldownSeconds: 180,
    salesAgents: [{ id: "agent-1", name: "Asesora 1", phone: "+56912345678" }],
    twilioConfigured: false,
    twilioPhoneNumber: "+56229146709",
    appUrl: "https://example.com",
  };

  it("uses the selected procedure interest instead of the Reservo consultation name", async () => {
    await createBookingLeadFromBooking(
      {
        bookingPayload: {
          appointmentType: "presencial",
          procedureInterest: "Rinoplastia",
          personal: {
            firstName: "Thomas",
            lastName1: "Weisskapp",
            lastName2: "Test",
            phone: "+56 9 9237 2299",
            email: "tweisskapp@gmail.com",
          },
        },
        bookingResponse: {
          option: {
            procedureName: "Consulta Medica Dr. Sebastian Torres - Presencial o a Distancia",
            label: "Evaluacion con el Dr. Torres",
          },
          selectedSlot: {
            date: "2026-04-24",
            time: "10:00",
          },
          source: {
            reserva: {
              uuid: "booking-123",
            },
          },
        },
        sourceUrl: "https://example.com",
      },
      config,
    );

    expect(dbMocks.insertSpeedLead).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_kind: "booking_request",
        procedure_interest: "Rinoplastia",
      }),
    );
  });
});

describe("cirugia360 speed-to-lead inactive-agent pause", () => {
  const baseLead = {
    id: "lead-1",
    status: "scheduled",
    payment_status: "not_required",
    assigned_agent_name: "Maria",
    assigned_agent_phone: "+56911111111",
    assigned_agent_email: "maria@clinic.cl",
    agent_attempts: 1,
    metadata: {
      routing: {
        attemptedAgentIds: [],
        currentAssignedAgentId: "agent-1",
        nextStartAgentId: null,
      },
    },
  };

  it("pauses the lead and keeps the assignment when the asesora está inactiva", async () => {
    const config = {
      defaultCountryDialCode: "56",
      retryDelaySeconds: 180,
      agentCallCooldownSeconds: 180,
      salesAgents: [
        { id: "agent-1", name: "Maria", phone: "+56911111111", email: "maria@clinic.cl", active: false },
        { id: "agent-2", name: "Ana", phone: "+56922222222", email: "ana@clinic.cl", active: true },
      ],
      twilioConfigured: false,
      twilioPhoneNumber: "+56229146709",
      appUrl: "https://example.com",
      queuePaused: false,
    };

    dbMocks.claimDueSpeedLeads.mockResolvedValueOnce([baseLead]);
    dbMocks.getSpeedLeadById.mockResolvedValueOnce(baseLead);

    const result = await dispatchDueLeads(config, 10);

    expect(result.pausedInactiveAgent).toBe(1);
    expect(result.rescheduled).toBe(1);
    expect(result.dispatched).toBe(0);

    // Debe reprogramar sin modificar la asignación actual.
    const updates = dbMocks.updateSpeedLead.mock.calls.map(([, patch]) => patch);
    const touchedAssignment = updates.some(
      (patch) =>
        Object.prototype.hasOwnProperty.call(patch, "assigned_agent_name") ||
        Object.prototype.hasOwnProperty.call(patch, "assigned_agent_phone") ||
        Object.prototype.hasOwnProperty.call(patch, "assigned_agent_email"),
    );

    expect(touchedAssignment).toBe(false);

    const eventNames = dbMocks.insertSpeedLeadEvent.mock.calls.map(([, eventType]) => eventType);
    expect(eventNames).toContain("sales_call.paused_inactive_agent");
  });
});

describe("cirugia360 speed-to-lead single-agent retry", () => {
  const lead = {
    id: "lead-single-agent",
    status: "dialing_agent",
    payment_status: "not_required",
    assigned_agent_name: "Maria",
    assigned_agent_phone: "+56911111111",
    assigned_agent_email: "maria@clinic.cl",
    agent_attempts: 1,
    metadata: {
      routing: {
        attemptedAgentIds: ["agent-1"],
        currentAssignedAgentId: "agent-1",
        nextStartAgentId: null,
      },
    },
  };

  const config = {
    defaultCountryDialCode: "56",
    retryDelaySeconds: 180,
    agentCallCooldownSeconds: 180,
    salesAgents: [
      { id: "agent-1", name: "Maria", phone: "+56911111111", email: "maria@clinic.cl", active: true },
    ],
    twilioConfigured: false,
    twilioPhoneNumber: "+56229146709",
    appUrl: "https://example.com",
    queuePaused: false,
  };

  it("keeps the assigned asesora when she is the only created agent and misses the call", async () => {
    const result = await tryNextAgent(lead, config, "La asesora no contesto la llamada.");

    expect(result).toBe("scheduled");
    expect(dbMocks.updateSpeedLead).toHaveBeenCalledWith(
      "lead-single-agent",
      expect.objectContaining({
        assigned_agent_name: "Maria",
        assigned_agent_phone: "+56911111111",
        assigned_agent_email: "maria@clinic.cl",
        status: "scheduled",
        sales_call_status: "scheduled",
        twilio_sales_call_sid: null,
        last_error: "La asesora no contesto la llamada.",
      }),
    );
  });

  it("does not clear the assigned asesora when the only agent is inactive during scheduling", async () => {
    const result = await scheduleLeadForNextAttempt(
      lead,
      {
        ...config,
        salesAgents: [{ ...config.salesAgents[0], active: false }],
      },
      { reason: "La asesora esta pausada." },
    );

    expect(result.kind).toBe("scheduled");
    expect(dbMocks.updateSpeedLead).toHaveBeenCalledWith(
      "lead-single-agent",
      expect.objectContaining({
        assigned_agent_name: "Maria",
        assigned_agent_phone: "+56911111111",
        assigned_agent_email: "maria@clinic.cl",
        status: "scheduled",
        sales_call_status: "scheduled",
      }),
    );
  });
});

describe("cirugia360 strict agent priority", () => {
  const lead = {
    id: "lead-priority",
    status: "received",
    payment_status: "not_required",
    assigned_agent_name: null,
    assigned_agent_phone: null,
    assigned_agent_email: null,
    agent_attempts: 0,
    metadata: {
      routing: {
        attemptedAgentIds: [],
        currentAssignedAgentId: null,
        nextStartAgentId: null,
      },
    },
  };

  const config = {
    defaultCountryDialCode: "56",
    retryDelaySeconds: 180,
    agentCallCooldownSeconds: 180,
    salesAgents: [
      { id: "agent-1", name: "Prioridad 1", phone: "+56911111111", email: "uno@clinic.cl", active: true },
      { id: "agent-2", name: "Prioridad 2", phone: "+56922222222", email: "dos@clinic.cl", active: true },
    ],
    twilioConfigured: false,
    twilioPhoneNumber: "+56229146709",
    appUrl: "https://example.com",
    queuePaused: false,
  };

  it("waits for the first active agent instead of falling through to the next one", async () => {
    dbMocks.hasActiveLeadForAgent.mockResolvedValueOnce(true);

    const result = await scheduleLeadForNextAttempt(lead, config, {
      reason: "Lead nuevo.",
      referenceTime: new Date("2026-04-27T12:00:00.000Z"),
    });

    expect(result.kind).toBe("scheduled");
    expect(dbMocks.hasActiveLeadForAgent).toHaveBeenCalledTimes(1);
    expect(dbMocks.hasActiveLeadForAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        agentPhone: "+56911111111",
      }),
    );
    expect(dbMocks.updateSpeedLead).toHaveBeenCalledWith(
      "lead-priority",
      expect.objectContaining({
        assigned_agent_name: "Prioridad 1",
        assigned_agent_email: "uno@clinic.cl",
        status: "scheduled",
      }),
    );
  });

  it("uses the next priority only when the higher priority agent is inactive", async () => {
    dbMocks.hasActiveLeadForAgent.mockResolvedValueOnce(false);

    const result = await scheduleLeadForNextAttempt(
      lead,
      {
        ...config,
        salesAgents: [
          { ...config.salesAgents[0], active: false },
          config.salesAgents[1],
        ],
      },
      { reason: "Lead nuevo." },
    );

    expect(result.kind).toBe("dispatch");
    expect(dbMocks.hasActiveLeadForAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        agentPhone: "+56922222222",
      }),
    );
  });
});
