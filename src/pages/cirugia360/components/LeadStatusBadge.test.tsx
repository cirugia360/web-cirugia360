import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { STATUS_LABELS } from "../lib/status";
import type { DashboardLead } from "../lib/types";

const makeLead = (status: string): DashboardLead => ({
  id: status,
  createdAt: "2026-04-24T10:00:00.000Z",
  updatedAt: new Date().toISOString(),
  status,
  salesCallStatus: null,
  customerCallStatus: null,
  fullName: "Paciente Test",
  phone: "+56912345678",
  email: null,
  procedureInterest: "Rinoplastia",
  message: null,
  sourceUrl: null,
  assignedAgentName: null,
  assignedAgentEmail: null,
  agentAttempts: 0,
  dispatchScheduledAt: null,
  callbackContext: null,
  customerConnectedAt: null,
  completedAt: null,
  lastError: null,
  pipelineStage: "nuevo",
  pipelineOutcome: "active",
  pipelineOutcomeReasonCode: null,
  pipelineOutcomeReason: null,
  pipelineValue: 0,
  recordingUrl: null,
  transcriptionText: null,
  notes: [],
});

describe("LeadStatusBadge", () => {
  it.each(Object.entries(STATUS_LABELS))("renders %s as %s", (status, config) => {
    render(<LeadStatusBadge lead={makeLead(status)} />);

    expect(screen.getByText(config.label)).toBeInTheDocument();
  });

  it("shows a readable fallback for unknown statuses", () => {
    render(<LeadStatusBadge lead={makeLead("custom_status")} />);

    expect(screen.getByText("Custom Status")).toBeInTheDocument();
  });

  it("shows stale agent calls as expired attempts", () => {
    render(
      <LeadStatusBadge
        lead={{
          ...makeLead("dialing_agent"),
          updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        }}
      />,
    );

    expect(screen.getByText("Intento vencido")).toBeInTheDocument();
  });
});
