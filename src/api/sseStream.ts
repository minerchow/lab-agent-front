import type { UIMessageChunk } from "ai";

/** 一条 SSE 帧（event + data） */
type SseFrame = { event: string; data: string };

/** SSE 帧之间以空行分隔，兼容 \r\n 换行 */
const FRAME_BOUNDARY = /\r?\n\r?\n/;

/**
 * 解析单条 SSE 帧，提取 event 与 data（多行 data 按规范以 \n 拼接）
 */
const parseFrame = (frame: string): SseFrame | null => {
  let event = "";
  const data: string[] = [];

  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      const value = line.slice("data:".length);
      data.push(value.startsWith(" ") ? value.slice(1) : value);
    }
  }

  if (!event && data.length === 0) {
    return null;
  }
  return { event, data: data.join("\n") };
};

/**
 * 解析后端 error 事件里的错误信息
 */
const readErrorMessage = (data: string): string => {
  if (data) {
    try {
      const payload = JSON.parse(data) as { message?: unknown };
      if (typeof payload.message === "string" && payload.message) {
        return payload.message;
      }
    } catch {
      // 后端返回的不是 JSON 时，直接把原始内容当作错误信息
    }
  }
  return data || "对话失败，请稍后重试";
};

/**
 * 把后端 chatSse 的 SSE 事件流转换成 AI SDK 的 UIMessageChunk 流，
 * 使 useChat 可以直接消费。
 *
 * 事件约定（见 lab-agent routers/ai.py）：
 * - reasoning:       思考增量文本
 * - message:         一段增量文本
 * - reset:           命中工具调用，丢弃本轮响应已流出的全部思考/正文内容
 * - reasoning_reset: 一轮思考结束，关闭当前思考块（已流出的内容保留）
 * - done:            正常结束
 * - error:           出错，data 为 { message }
 *
 * 说明：不显式发送 start-step，reset-step 因此会清空整条响应消息的全部 parts，
 * 与后端 reset 的语义（丢弃之前已推送的内容）一致。
 */
export const createUiMessageStream = (
  source: ReadableStream<Uint8Array>
): ReadableStream<UIMessageChunk> => {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const queue: UIMessageChunk[] = [];
  let buffer = "";
  /** 块 id 自增序号，保证同一消息内 part id 唯一 */
  let partSeq = 0;
  /** 当前仍在流式输出的块 id，null 表示没有进行中的块 */
  let reasoningPartId: string | null = null;
  let textPartId: string | null = null;
  let protocolDone = false;
  let sourceDone = false;

  const closeReasoning = () => {
    if (reasoningPartId == null) return;
    queue.push({ type: "reasoning-end", id: reasoningPartId });
    reasoningPartId = null;
  };

  const closeText = () => {
    if (textPartId == null) return;
    queue.push({ type: "text-end", id: textPartId });
    textPartId = null;
  };

  /** 收尾所有进行中的块（reset/error/done 之前调用） */
  const closeOpenParts = () => {
    closeReasoning();
    closeText();
  };

  const handleEvent = ({ event, data }: SseFrame) => {
    if (event === "reasoning") {
      if (!data.trim()) return;
      if (reasoningPartId == null) {
        closeText();
        reasoningPartId = `reasoning-${++partSeq}`;
        queue.push({ type: "reasoning-start", id: reasoningPartId });
      }
      queue.push({ type: "reasoning-delta", id: reasoningPartId, delta: data });
    } else if (event === "reasoning_reset") {
      // 一轮思考结束：保留已流出的思考内容，仅收尾当前思考块
      closeReasoning();
    } else if (event === "message") {
      if (!data.trim()) return;
      if (textPartId == null) {
        closeReasoning();
        textPartId = `text-${++partSeq}`;
        queue.push({ type: "text-start", id: textPartId });
      }
      queue.push({ type: "text-delta", id: textPartId, delta: data });
    } else if (event === "reset") {
      // 命中工具调用：reset-step 清空本轮响应已流出的全部 parts
      closeOpenParts();
      queue.push({ type: "reset-step" });
    } else if (event === "error") {
      closeOpenParts();
      queue.push({ type: "error", errorText: readErrorMessage(data) });
      protocolDone = true;
    } else if (event === "done") {
      closeOpenParts();
      queue.push({ type: "finish" });
      protocolDone = true;
    }
  };

  const consumeFrames = () => {
    let matched = FRAME_BOUNDARY.exec(buffer);
    while (matched && !protocolDone) {
      const frame = buffer.slice(0, matched.index);
      buffer = buffer.slice(matched.index + matched[0].length);
      const parsed = parseFrame(frame);
      if (parsed) {
        handleEvent(parsed);
      }
      matched = FRAME_BOUNDARY.exec(buffer);
    }
  };

  return new ReadableStream<UIMessageChunk>({
    async pull(controller) {
      for (;;) {
        const chunk = queue.shift();
        if (chunk) {
          controller.enqueue(chunk);
          return;
        }
        if (protocolDone) {
          controller.close();
          await reader.cancel().catch(() => undefined);
          return;
        }
        if (sourceDone) {
          // 后端没有发送 done/error 就断开了，按错误处理
          queue.push({ type: "error", errorText: "连接已断开，请稍后重试" });
          protocolDone = true;
          continue;
        }

        const { value, done } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          consumeFrames();
          // 流结束时若末尾缺少空行，最后一帧会残留在 buffer，补一次解析
          if (buffer.trim()) {
            const parsed = parseFrame(buffer);
            if (parsed && !protocolDone) {
              handleEvent(parsed);
            }
          }
          buffer = "";
          sourceDone = true;
          continue;
        }
        buffer += decoder.decode(value, { stream: true });
        consumeFrames();
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
    },
  });
};
