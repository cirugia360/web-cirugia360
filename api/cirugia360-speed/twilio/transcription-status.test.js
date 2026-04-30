import { describe, expect, it } from "vitest";
import { buildTranscriptionUpdate } from "./transcription-status.js";

const makeLead = (overrides = {}) => ({
  transcription_sid: null,
  transcription_text: null,
  transcription_status: null,
  transcription_segments: [],
  metadata: {},
  ...overrides,
});

describe("cirugia360 transcription status", () => {
  it("stores real-time transcription content with speaker labels", () => {
    const lead = makeLead();

    const result = buildTranscriptionUpdate(lead, {
      TranscriptionEvent: "transcription-content",
      TranscriptionSid: "GT123",
      SequenceId: "2",
      Track: "outbound_track",
      Timestamp: "2026-04-30T12:00:00.000Z",
      Final: "true",
      TranscriptionData: JSON.stringify({
        transcript: "Hola, quiero una evaluacion.",
        confidence: 0.91,
      }),
    });

    expect(result.nextSegment).toMatchObject({
      speaker: "customer",
      label: "Cliente",
      text: "Hola, quiero una evaluacion.",
    });
    expect(result.updates.transcription_text).toBe("Cliente: Hola, quiero una evaluacion.");
    expect(result.updates.transcription_status).toBe("in-progress");
  });

  it("combines existing agent and customer segments in order", () => {
    const lead = makeLead({
      transcription_segments: [
        {
          id: "GT123:1:inbound_track",
          speaker: "agent",
          label: "Agente",
          track: "inbound_track",
          text: "Hola, soy la asesora.",
          timestamp: "2026-04-30T12:00:00.000Z",
          sequenceId: 1,
        },
      ],
    });

    const result = buildTranscriptionUpdate(lead, {
      TranscriptionEvent: "transcription-content",
      TranscriptionSid: "GT123",
      SequenceId: "2",
      Track: "outbound_track",
      Timestamp: "2026-04-30T12:00:02.000Z",
      Final: "true",
      TranscriptionData: JSON.stringify({ transcript: "Hola." }),
    });

    expect(result.updates.transcription_text).toBe(
      "Agente: Hola, soy la asesora.\nCliente: Hola.",
    );
  });

  it("keeps legacy transcription text when Twilio sends the old callback shape", () => {
    const result = buildTranscriptionUpdate(makeLead(), {
      TranscriptionSid: "TR123",
      TranscriptionStatus: "completed",
      TranscriptionText: "Texto antiguo de Twilio.",
    });

    expect(result.segments).toHaveLength(0);
    expect(result.updates.transcription_text).toBe("Texto antiguo de Twilio.");
    expect(result.updates.transcription_status).toBe("completed");
  });
});
