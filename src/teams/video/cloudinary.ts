import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Cloudinary: 25 créditos/mês (~25GB storage + transformações)

function getCloudinaryConfig() {
  const url = process.env.CLOUDINARY_URL || "";
  const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  return match
    ? { apiKey: match[1], apiSecret: match[2], cloudName: match[3] }
    : { apiKey: "", apiSecret: "", cloudName: "" };
}

export const videoCloudinaryUpload: ToolDefinition = {
  name: "video_cloudinary_upload",
  description: "Fazer upload de vídeo/imagem para Cloudinary",
  inputSchema: z.object({
    fileUrl: z.string().url(),
    folder: z.string().optional(),
    resourceType: z.enum(["image", "video", "raw"]).default("video"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const { apiKey, cloudName } = getCloudinaryConfig();
      const data = await httpPost(
        `https://api.cloudinary.com/v1_1/${cloudName}/${input.resourceType}/upload`,
        {
          file: input.fileUrl,
          api_key: apiKey,
          folder: input.folder || "",
          upload_preset: "ml_default",
        }
      );
      return makeSuccessResponse(taskId, { upload: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const videoCloudinaryTransform: ToolDefinition = {
  name: "video_cloudinary_transform",
  description: "Aplicar transformações a media no Cloudinary",
  inputSchema: z.object({
    publicId: z.string(),
    transformations: z.string().describe("Transformation string ex: w_400,h_300,c_fill"),
    resourceType: z.enum(["image", "video"]).default("video"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    const { cloudName } = getCloudinaryConfig();
    const url = `https://res.cloudinary.com/${cloudName}/${input.resourceType}/upload/${input.transformations}/${input.publicId}`;
    return makeSuccessResponse(taskId, { transformedUrl: url });
  },
};

export const videoCloudinaryTools: ToolDefinition[] = [
  videoCloudinaryUpload,
  videoCloudinaryTransform,
];
