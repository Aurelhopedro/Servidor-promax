import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// YouTube Data API v3 — Limite gratuito: 10000 unidades/dia
const YT_API = "https://www.googleapis.com/youtube/v3";

function ytParams(): Record<string, string> {
  return { key: process.env.YOUTUBE_API_KEY || "" };
}

export const socialYtSearchVideos: ToolDefinition = {
  name: "social_yt_search_videos",
  description: "Pesquisar vídeos no YouTube",
  inputSchema: z.object({
    query: z.string(),
    maxResults: z.number().default(5),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(`${YT_API}/search`, {
        part: "snippet",
        q: input.query,
        maxResults: input.maxResults,
        type: "video",
        ...ytParams(),
      });
      return makeSuccessResponse(taskId, { videos: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialYtGetChannelStats: ToolDefinition = {
  name: "social_yt_get_channel_stats",
  description: "Obter estatísticas de canal YouTube",
  inputSchema: z.object({
    channelId: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(`${YT_API}/channels`, {
        part: "statistics,snippet",
        id: input.channelId,
        ...ytParams(),
      });
      return makeSuccessResponse(taskId, { channel: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialYtGetVideoStats: ToolDefinition = {
  name: "social_yt_get_video_stats",
  description: "Obter estatísticas de vídeo YouTube",
  inputSchema: z.object({
    videoId: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(`${YT_API}/videos`, {
        part: "statistics,snippet",
        id: input.videoId,
        ...ytParams(),
      });
      return makeSuccessResponse(taskId, { video: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialYoutubeTools: ToolDefinition[] = [
  socialYtSearchVideos,
  socialYtGetChannelStats,
  socialYtGetVideoStats,
];
