import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isHuman = message.sender === "human";

  return (
    <div
      data-testid="message-bubble"
      className={`flex ${isHuman ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isHuman
            ? "bg-indigo-600 text-white rounded-br-md"
            : "bg-white/10 text-neutral-200 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <time
          data-testid="message-timestamp"
          className={`block mt-1 text-[10px] ${
            isHuman ? "text-indigo-200/60" : "text-neutral-500"
          }`}
          dateTime={message.timestamp}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}
