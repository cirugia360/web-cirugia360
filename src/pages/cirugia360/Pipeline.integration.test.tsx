import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cirugia360Dashboard from "../Cirugia360Dashboard";

const session = {
  user: {
    id: "user-1",
    email: "asesora@clinica.cl",
  },
};

vi.mock("@/lib/dashboardSupabase", () => ({
  getDashboardAccessToken: vi.fn(async () => "token-123"),
  getDashboardSupabaseConfigError: vi.fn(() => null),
  getDashboardSupabase: vi.fn(() => ({
    auth: {
      signOut: vi.fn(),
      refreshSession: vi.fn(async () => ({ data: { session }, error: null })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  })),
  subscribeDashboardSession: vi.fn((callback: (nextSession: typeof session) => void) => {
    callback(session);
    return vi.fn();
  }),
}));

const dashboardSnapshot = {
  generatedAt: "2026-04-24T10:00:00.000Z",
  dateRange: { dateFrom: null, dateTo: null, label: "Todo el periodo" },
  pipelineStages: [
    { id: "nuevo", label: "Nuevo" },
    { id: "contactado", label: "Contactado" },
  ],
  speedMetrics: [],
  funnelMetrics: [],
  callMetrics: [],
  agentPerformance: [],
  leads: [
    {
      id: "lead-1",
      createdAt: "2026-04-24T10:00:00.000Z",
      status: "received",
      salesCallStatus: null,
      customerCallStatus: null,
      fullName: "Paciente Optimista",
      phone: "+56912345678",
      email: null,
      procedureInterest: "Rinoplastia",
      message: null,
      sourceUrl: null,
      assignedAgentName: "Vendedora",
      assignedAgentEmail: "asesora@clinica.cl",
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
      pipelineValue: 1000000,
      recordingUrl: null,
      transcriptionText: null,
      notes: [],
    },
  ],
};

const settings = {
  businessTimeZone: "America/Santiago",
  queuePaused: false,
  agents: [],
};

describe("Pipeline optimistic updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves a lead optimistically on drag and rolls back when the API fails", async () => {
    let rejectPipelineStage: (value: Response) => void = () => {};
    const pipelineStageResponse = new Promise<Response>((resolve) => {
      rejectPipelineStage = resolve;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/api/cirugia360-speed/dashboard?resource=sales-agents")) {
          return Promise.resolve(new Response(JSON.stringify({ success: true, data: settings }), { status: 200 }));
        }

        if (url.includes("/api/cirugia360-speed/dashboard")) {
          return Promise.resolve(new Response(JSON.stringify({ success: true, data: dashboardSnapshot }), { status: 200 }));
        }

        if (url.includes("/api/cirugia360-speed/pipeline-stage") && init?.method === "POST") {
          return pipelineStageResponse;
        }

        return Promise.resolve(new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
      }),
    );

    render(<Cirugia360Dashboard />);

    const pipelineButtons = await screen.findAllByRole("button", { name: "Pipeline" });
    fireEvent.click(pipelineButtons[0]);

    const leadCard = await screen.findByText("Paciente Optimista");
    const article = leadCard.closest("article");
    const contactadoColumn = document.querySelector('[data-pipeline-stage="contactado"]');

    expect(article).not.toBeNull();
    expect(contactadoColumn).not.toBeNull();

    fireEvent.dragStart(article!, {
      dataTransfer: {
        effectAllowed: "",
        dropEffect: "",
        setData: vi.fn(),
      },
    });
    fireEvent.drop(contactadoColumn!, {
      dataTransfer: {
        dropEffect: "",
      },
    });

    await waitFor(() => {
      expect(within(contactadoColumn as HTMLElement).getByText("Paciente Optimista")).toBeInTheDocument();
    });

    rejectPipelineStage(new Response(JSON.stringify({ success: false, error: "No pudimos actualizar" }), { status: 500 }));

    const nuevoColumn = document.querySelector('[data-pipeline-stage="nuevo"]');

    await waitFor(() => {
      expect(within(nuevoColumn as HTMLElement).getByText("Paciente Optimista")).toBeInTheDocument();
    });
  });

  it("uses the backend call status returned by lead-call instead of forcing dispatching", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/api/cirugia360-speed/dashboard?resource=sales-agents")) {
          return Promise.resolve(new Response(JSON.stringify({ success: true, data: settings }), { status: 200 }));
        }

        if (url.includes("/api/cirugia360-speed/dashboard?resource=lead-call") && init?.method === "POST") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                leadId: "lead-1",
                updatedAt: "2026-04-24T10:05:00.000Z",
                callStarted: false,
                queued: false,
                status: "no_agent_available",
                salesCallStatus: "exhausted",
                customerCallStatus: null,
                customerConnectedAt: null,
                completedAt: null,
                lastError: "No encontramos una asesora disponible para este lead.",
                dispatchScheduledAt: null,
                assignedAgent: null,
                assignedAgentEmail: null,
                warning: "No encontramos una asesora disponible para este lead.",
              }),
              { status: 200 },
            ),
          );
        }

        if (url.includes("/api/cirugia360-speed/dashboard")) {
          return Promise.resolve(new Response(JSON.stringify({ success: true, data: dashboardSnapshot }), { status: 200 }));
        }

        return Promise.resolve(new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
      }),
    );

    render(<Cirugia360Dashboard />);

    const leadsButtons = await screen.findAllByRole("button", { name: "Leads" });
    fireEvent.click(leadsButtons[0]);

    const leadRow = (await screen.findByText("Paciente Optimista")).closest("tr");

    expect(leadRow).not.toBeNull();

    fireEvent.click(within(leadRow as HTMLElement).getByRole("button", { name: "Llamar" }));

    await waitFor(() => {
      expect(within(leadRow as HTMLElement).getByText("Sin asesora")).toBeInTheDocument();
    });
  });
});
