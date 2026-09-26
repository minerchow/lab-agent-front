/**
 * 对话消息角色
 */
export type ChatRole = "system" | "user" | "assistant";

/**
 * 单条对话消息
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * 对话请求参数
 */
export interface ChatRequest {
  messages: ChatMessage[];
}
