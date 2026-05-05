import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Replicate: créditos iniciais gratuitos, depois pay-per-use
const REPLICATE_API = "https://api.replicate.com/v1";

function repHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export const creativeReplicateRun: ToolDefinition = {
  name: "creative_replicate_run",
  description: "Executar modelo no Replicate (imagens, vídeo, áudio, etc.)",
  inputSchema: z.object({
    model: z.string().describe("owner/model:version"),
    input: z.record(z.unknown()),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const [versionPath, versionHash] = (input.model as string).split(":");
      const data = await httpPost(
        `${REPLICATE_API}/predictions`,
        {
          version: versionHash,
          input: input.input,
          model: versionPath,
        },
        repHeaders()
      );
      return makeSuccessResponse(taskId, { prediction: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const creativeReplicateGetPrediction: ToolDefinition = {
  name: "creative_replicate_get_prediction",
  description: "Obter estado de predição do Replicate",
  inputSchema: z.object({
    predictionId: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${REPLICATE_API}/predictions/${input.predictionId}`,
        undefined,
        repHeaders()
      );
      return makeSuccessResponse(taskId, { prediction: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const creativeReplicateTools: ToolDefinition[] = [
  creativeReplicateRun,
  creativeReplicateGetPrediction,
];
