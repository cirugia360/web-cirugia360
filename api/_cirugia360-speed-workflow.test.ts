import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  claimDueSpeedLeads: vi.fn(),
  findLeadForPaymentCallback: vi.fn(),
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
  extractBookingReference,
  extractExternalReferenceCandidates,
  extractPaymentReference,
  isPositivePaymentStatus,
} from "./_cirugia360-speed-workflow.js";

beforeEach(() => {
  let insertedLead = null;

  vi.clearAllMocks();
  dbMocks.insertSpeedLead.mockImplementation(async (lead) => {
    insertedLead = lead;
    return lead;
  });
  dbMocks.insertSpeedLeadEvent.mockResolvedValue(undefined);
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
