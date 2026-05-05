import axios, { AxiosError } from "axios";
import type { ToolResponse } from "./types.js";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 2000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  retryDelayMs: number = DEFAULT_RETRY_DELAY_MS
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRateLimit =
        err instanceof AxiosError && err.response?.status === 429;
      if (isRateLimit && attempt < maxRetries) {
        const retryAfter = err.response?.headers?.["retry-after"];
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : retryDelayMs * Math.pow(2, attempt);
        await sleep(waitMs);
        continue;
      }
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * Math.pow(2, attempt));
        continue;
      }
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function makeSuccessResponse(
  taskId: string,
  data: Record<string, unknown>
): ToolResponse {
  return { success: true, taskId, data, error: null };
}

export function makeErrorResponse(
  taskId: string,
  error: string
): ToolResponse {
  return { success: false, taskId, data: {}, error };
}

export async function httpPost(
  url: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<unknown> {
  return withRetry(async () => {
    const res = await axios.post(url, body, { headers });
    return res.data;
  });
}

export async function httpGet(
  url: string,
  params?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<unknown> {
  return withRetry(async () => {
    const res = await axios.get(url, { params, headers });
    return res.data;
  });
}

export async function httpDelete(
  url: string,
  headers?: Record<string, string>
): Promise<unknown> {
  return withRetry(async () => {
    const res = await axios.delete(url, { headers });
    return res.data;
  });
}
