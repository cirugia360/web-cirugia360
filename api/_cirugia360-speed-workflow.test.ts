import { describe, expect, it } from "vitest";
import {
  extractBookingReference,
  extractExternalReferenceCandidates,
  extractPaymentReference,
  isPositivePaymentStatus,
} from "./_cirugia360-speed-workflow.js";

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
