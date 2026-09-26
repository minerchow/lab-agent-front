import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button, Input, Spin } from "antd";
import { useChat } from "@ai-sdk/react";
import { isReasoningUIPart, isTextUIPart } from "ai";
import { chatSseTransport } from "@/api/ai";

const { TextArea } = Input;

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: 720,
    margin: "0 auto",
    padding: 16,
    boxSizing: "border-box",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "8px 4px",
  },
  row: { display: "flex" },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  reasoning: {
    marginBottom: 8,
    padding: "6px 10px",
    borderRadius: 8,
    background: "#fafafa",
    border: "1px dashed #d9d9d9",
    color: "#8c8c8c",
    fontSize: 12,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 240,
    overflowY: "auto",
  },
  bubble: {
    maxWidth: "72%",
    padding: "8px 12px",
    borderRadius: 10,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleUser: { background: "#1677ff", color: "#fff" },
  bubbleAssistant: { background: "#f0f0f0", color: "#000" },
  bubbleError: { background: "#fff1f0", color: "#cf1322" },
  footer: { display: "flex", gap: 8, alignItems: "flex-end", paddingTop: 12 },
};

const Chat = () => {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: chatSseTransport,
  });

  const loading = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  // 还没有开始产出助手回复时，展示“正在思考”
  const showThinking = loading && lastMessage?.role !== "assistant";

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, showThinking]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendMessage({ text });
  };

  return (
    <div style={styles.page}>
      <div style={styles.list} ref={listRef}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#999", marginTop: 40 }}>
            开始和 AI 对话吧～
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.row,
              ...(message.role === "user"
                ? styles.rowUser
                : styles.rowAssistant),
            }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(message.role === "user"
                  ? styles.bubbleUser
                  : styles.bubbleAssistant),
              }}
            >
              {message.parts.filter(isReasoningUIPart).map((part, index) => (
                <div
                  key={part.id ?? `reasoning-${index}`}
                  style={styles.reasoning}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    {part.state === "streaming" && <Spin size="small" />}
                    <span>思考过程</span>
                  </div>
                  {part.text}
                </div>
              ))}
              {message.parts.filter(isTextUIPart).map((part, index) => (
                <span key={index}>{part.text}</span>
              ))}
            </div>
          </div>
        ))}
        {showThinking && (
          <div style={{ ...styles.row, ...styles.rowAssistant }}>
            <div style={{ ...styles.bubble, ...styles.bubbleAssistant }}>
              AI 正在思考…
            </div>
          </div>
        )}
        {error && (
          <div style={{ ...styles.row, ...styles.rowAssistant }}>
            <div
              style={{
                ...styles.bubble,
                ...styles.bubbleAssistant,
                ...styles.bubbleError,
              }}
            >
              {error.message}
            </div>
          </div>
        )}
      </div>
      <div style={styles.footer}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
        />
        <Button type="primary" loading={loading} onClick={handleSend}>
          发送
        </Button>
        {loading && <Button onClick={() => stop()}>停止</Button>}
      </div>
    </div>
  );
};

export default Chat;
