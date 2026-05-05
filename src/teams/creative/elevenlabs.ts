import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito ElevenLabs: 10000 caracteres/mês
const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

function elHeaders(): Record<string, string> {
  return {
    "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
    "Content-Type": "application/json",
  };
}

export const creativeElevenlabsTts: ToolDefinition = {
  name: "creative_elevenlabs_tts",
  description: "Converter texto para voz com ElevenLabs",
  inputSchema: z.object({
    text: z.string(),
    voiceId: z.string().default("21m00Tcm4TlvDq8ikWAM"),
    modelId: z.string().default("eleven_multilingual_v2"),
    stability: z.number().default(0.5),
    similarityBoost: z.number().default(0.75),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${ELEVENLABS_API}/text-to-speech/${input.voiceId}`,
        {
          text: input.text,
          model_id: input.modelId,
          voice_settings: {
            stability: input.stability,
            similarity_boost: input.similarityBoost,
          },
        },
        elHeaders()
      );
      return makeSuccessResponse(taskId, { audio: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const creativeElevenlabsGetVoices: ToolDefinition = {
  name: "creative_elevenlabs_get_voices",
  description: "Listar vozes disponíveis no ElevenLabs",
  inputSchema: z.object({}),
  execute: async (): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${ELEVENLABS_API}/voices`,
        undefined,
        elHeaders()
      );
      return makeSuccessResponse(taskId, { voices: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const creativeElevenlabsTools: ToolDefinition[] = [
  creativeElevenlabsTts,
  creativeElevenlabsGetVoices,
];
