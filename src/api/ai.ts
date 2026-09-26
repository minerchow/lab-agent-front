import {
  HttpChatTransport,
  isTextUIPart,
  type PrepareSendMessagesRequest,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { ChatMessage, ChatRequest } from "@/types/ai";
import { BaseResponse } from "@/types/base";
import {
  ensureAccessToken,
  post,
  refreshTokenWithRedirect,
} from "@/utils/http";
import { tauthtsBase } from "@/config";
import { createUiMessageStream } from "@/api/sseStream";

/**
 * 发起对话
 * @param data 对话请求参数
 * @returns 助手回复消息
 */
export const chat = (data: ChatRequest): Promise<BaseResponse<ChatMessage>> => {
  return post({
    url: `${tauthtsBase()}/api/ai/chat`,
    data: data,
    config: {
      // 对话接口耗时较长，单独设置超时为 10 分钟
      timeout: 10 * 60 * 1000,
    },
  });
};

/**
 * 判断响应是否未授权：
 * 1. HTTP 状态码 401
 * 2. HTTP 200 但业务返回体 { code: 401 }
 */
const isUnauthorizedResponse = async (response: Response): Promise<boolean> => {
  if (response.status === 401) {
    return true;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return false;
  }
  try {
    const body = await response.clone().json();
    return Number(body?.code ?? body?.status) === 401;
  } catch {
    return false;
  }
};

/**
 * 携带 accessToken 的 fetch，收到 401 时刷新 accessToken 后重试一次，
 * 复刻 http.ts 中 axios 拦截器的鉴权逻辑（SSE 请求不走 axios）
 */
const fetchWithTokenRefresh: typeof globalThis.fetch = async (
  input,
  init
): Promise<Response> => {
  const doFetch = async (): Promise<Response> => {
    const token = await ensureAccessToken();
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return globalThis.fetch(input, { ...init, headers });
  };

  let response = await doFetch();

  if (await isUnauthorizedResponse(response)) {
    response.body?.cancel();
    // 刷新 accessToken（失败时清 token 并跳登录页），随后重试一次
    await refreshTokenWithRedirect();
    response = await doFetch();
  }

  return response;
};

/**
 * 对接后端 /api/ai/chatSse 的 transport
 */
class SseChatTransport extends HttpChatTransport<UIMessage> {
  protected processResponseStream(
    stream: ReadableStream<Uint8Array>
  ): ReadableStream<UIMessageChunk> {
    return createUiMessageStream(stream);
  }
}

/**
 * 后端 ChatRequest 只接受 { role, content } 结构，
 * 这里把 UIMessage 的文本部分提取出来组装请求体
 */
const prepareSendMessagesRequest: PrepareSendMessagesRequest<UIMessage> = ({
  messages,
  body,
}) => ({
  body: {
    ...body,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.parts
        .filter(isTextUIPart)
        .map((part) => part.text)
        .join(""),
    })),
  },
});

/**
 * 流式对话 transport，供 useChat 使用
 */
export const chatSseTransport = new SseChatTransport({
  api: `${tauthtsBase()}/api/ai/chatSse`,
  headers: async (): Promise<Record<string, string>> => {
    const token = await ensureAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  fetch: fetchWithTokenRefresh,
  prepareSendMessagesRequest,
});
