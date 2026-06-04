import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types";
import { httpPost, httpGet, httpDelete, makeSuccessResponse, makeErrorResponse } from "../../utils";
import { v4 as uuidv4 } from "uuid";

const META_API = "https://graph.facebook.com/v19.0";

function metaParams(): Record<string, string> {
  return { access_token: process.env.META_ACCESS_TOKEN || "" };
}

function pageId(): string {
  return process.env.META_PAGE_ID || "";
}

export const socialFbPostText: ToolDefinition = {
  name: "social_fb_post_text",
  description: "Publicar post de texto na página Facebook",
  inputSchema: z.object({ message: z.string() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${META_API}/${pageId()}/feed`, { message: input.message, ...metaParams() });
      return makeSuccessResponse(taskId, { post: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbPostImage: ToolDefinition = {
  name: "social_fb_post_image",
  description: "Publicar post com imagem na página Facebook",
  inputSchema: z.object({ message: z.string().optional(), imageUrl: z.string().url() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${META_API}/${pageId()}/photos`, { url: input.imageUrl, message: input.message || "", ...metaParams() });
      return makeSuccessResponse(taskId, { photo: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbPostVideo: ToolDefinition = {
  name: "social_fb_post_video",
  description: "Publicar vídeo na página Facebook",
  inputSchema: z.object({ title: z.string().optional(), description: z.string().optional(), videoUrl: z.string().url() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${META_API}/${pageId()}/videos`, { file_url: input.videoUrl, title: input.title || "", description: input.description || "", ...metaParams() });
      return makeSuccessResponse(taskId, { video: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbPostReel: ToolDefinition = {
  name: "social_fb_post_reel",
  description: "Publicar Reel na página Facebook",
  inputSchema: z.object({ videoUrl: z.string().url(), description: z.string().optional() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const initData = await httpPost(`${META_API}/${pageId()}/video_reels`, { upload_phase: "start", ...metaParams() }) as Record<string, unknown>;
      const videoId = initData.video_id;
      await httpPost(`${META_API}/${videoId}`, { upload_phase: "transfer", file_url: input.videoUrl, ...metaParams() });
      const data = await httpPost(`${META_API}/${pageId()}/video_reels`, { upload_phase: "finish", video_id: videoId, description: input.description || "", ...metaParams() });
      return makeSuccessResponse(taskId, { reel: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbPostStory: ToolDefinition = {
  name: "social_fb_post_story",
  description: "Publicar Story na página Facebook",
  inputSchema: z.object({ imageUrl: z.string().url().optional(), videoUrl: z.string().url().optional() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const body: Record<string, unknown> = { ...metaParams() };
      if (input.imageUrl) {
        const photoData = await httpPost(`${META_API}/${pageId()}/photos`, { url: input.imageUrl, published: false, ...metaParams() }) as Record<string, unknown>;
        body.photo_id = photoData.id;
      }
      if (input.videoUrl) body.file_url = input.videoUrl;
      const data = await httpPost(`${META_API}/${pageId()}/stories`, body);
      return makeSuccessResponse(taskId, { story: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbSchedulePost: ToolDefinition = {
  name: "social_fb_schedule_post",
  description: "Agendar publicação na página Facebook",
  inputSchema: z.object({ message: z.string(), scheduledTime: z.number(), imageUrl: z.string().url().optional() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const body: Record<string, unknown> = { message: input.message, published: false, scheduled_publish_time: input.scheduledTime, ...metaParams() };
      const endpoint = input.imageUrl ? `${META_API}/${pageId()}/photos` : `${META_API}/${pageId()}/feed`;
      if (input.imageUrl) body.url = input.imageUrl;
      const data = await httpPost(endpoint, body);
      return makeSuccessResponse(taskId, { scheduled: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbGetPageInsights: ToolDefinition = {
  name: "social_fb_get_page_insights",
  description: "Ver métricas e insights da página Facebook",
  inputSchema: z.object({ metrics: z.array(z.string()).default(["page_impressions", "page_engaged_users", "page_fans"]), period: z.enum(["day", "week", "month"]).default("day") }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(`${META_API}/${pageId()}/insights`, { metric: (input.metrics as string[]).join(","), period: input.period, ...metaParams() });
      return makeSuccessResponse(taskId, { insights: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbReplyComment: ToolDefinition = {
  name: "social_fb_reply_comment",
  description: "Responder a um comentário no Facebook",
  inputSchema: z.object({ commentId: z.string(), message: z.string() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${META_API}/${input.commentId}/comments`, { message: input.message, ...metaParams() });
      return makeSuccessResponse(taskId, { reply: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbDeleteComment: ToolDefinition = {
  name: "social_fb_delete_comment",
  description: "Apagar comentário no Facebook",
  inputSchema: z.object({ commentId: z.string() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpDelete(`${META_API}/${input.commentId}?access_token=${process.env.META_ACCESS_TOKEN}`);
      return makeSuccessResponse(taskId, { deleted: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbLikeComment: ToolDefinition = {
  name: "social_fb_like_comment",
  description: "Dar like num comentário no Facebook",
  inputSchema: z.object({ commentId: z.string() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${META_API}/${input.commentId}/likes`, { ...metaParams() });
      return makeSuccessResponse(taskId, { liked: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbSendMessage: ToolDefinition = {
  name: "social_fb_send_message",
  description: "Enviar mensagem via Facebook Messenger",
  inputSchema: z.object({ recipientId: z.string(), message: z.string() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${META_API}/${pageId()}/messages`, { recipient: { id: input.recipientId }, message: { text: input.message }, messaging_type: "RESPONSE", ...metaParams() });
      return makeSuccessResponse(taskId, { messageSent: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbCreateEvent: ToolDefinition = {
  name: "social_fb_create_event",
  description: "Criar evento na página Facebook",
  inputSchema: z.object({ name: z.string(), description: z.string().optional(), startTime: z.string(), endTime: z.string().optional(), location: z.string().optional() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${META_API}/${pageId()}/events`, { name: input.name, description: input.description || "", start_time: input.startTime, end_time: input.endTime || "", place: input.location ? { name: input.location } : undefined, ...metaParams() });
      return makeSuccessResponse(taskId, { event: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbGetLeads: ToolDefinition = {
  name: "social_fb_get_leads",
  description: "Obter leads de formulários da página Facebook",
  inputSchema: z.object({ formId: z.string() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(`${META_API}/${input.formId}/leads`, { ...metaParams() });
      return makeSuccessResponse(taskId, { leads: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbManageGroupPost: ToolDefinition = {
  name: "social_fb_manage_group_post",
  description: "Publicar post num grupo Facebook",
  inputSchema: z.object({ groupId: z.string(), message: z.string(), imageUrl: z.string().url().optional() }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const body: Record<string, unknown> = { message: input.message, ...metaParams() };
      const endpoint = input.imageUrl ? `${META_API}/${input.groupId}/photos` : `${META_API}/${input.groupId}/feed`;
      if (input.imageUrl) body.url = input.imageUrl;
      const data = await httpPost(endpoint, body);
      return makeSuccessResponse(taskId, { groupPost: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbGetPostAnalytics: ToolDefinition = {
  name: "social_fb_get_post_analytics",
  description: "Obter métricas/analytics de um post específico no Facebook",
  inputSchema: z.object({ postId: z.string(), metrics: z.array(z.string()).default(["post_impressions", "post_engaged_users", "post_clicks"]) }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(`${META_API}/${input.postId}/insights`, { metric: (input.metrics as string[]).join(","), ...metaParams() });
      return makeSuccessResponse(taskId, { analytics: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFbBoostPost: ToolDefinition = {
  name: "social_fb_boost_post",
  description: "Impulsionar/boost um post no Facebook via Meta Ads",
  inputSchema: z.object({ postId: z.string(), budgetCents: z.number(), durationDays: z.number().default(3), targetCountries: z.array(z.string()).default(["PT", "BR"]) }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const adAccountId = `act_${process.env.META_APP_ID}`;
      const data = await httpPost(`${META_API}/${adAccountId}/adsets`, { name: `Boost_${input.postId}`, daily_budget: input.budgetCents, billing_event: "IMPRESSIONS", optimization_goal: "POST_ENGAGEMENT", promoted_object: { page_id: pageId(), post_id: input.postId }, targeting: { geo_locations: { countries: input.targetCountries } }, end_time: new Date(Date.now() + (input.durationDays as number) * 86400000).toISOString(), status: "ACTIVE", ...metaParams() });
      return makeSuccessResponse(taskId, { boost: data });
    } catch (err) { return makeErrorResponse(taskId, String(err)); }
  },
};

export const socialFacebookTools: ToolDefinition[] = [
  socialFbPostText, socialFbPostImage, socialFbPostVideo, socialFbPostReel,
  socialFbPostStory, socialFbSchedulePost, socialFbGetPageInsights,
  socialFbReplyComment, socialFbDeleteComment, socialFbLikeComment,
  socialFbSendMessage, socialFbCreateEvent, socialFbGetLeads,
  socialFbManageGroupPost, socialFbGetPostAnalytics, socialFbBoostPost,
];
