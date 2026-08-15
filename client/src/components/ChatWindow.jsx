import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import Composer from "./Composer.jsx";
import { Avatar } from "./Sidebar.jsx";

export default function ChatWindow({ conversation, messages, currentUserId, onSend, onToggleMute }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center chat-bg">
        <div className="text-center text-muted">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  const name = conversation.type === "personal" ? conversation.user.displayName : conversation.group.name;
  const isGroup = conversation.type === "group";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-16 shrink-0 flex items-center justify-between px-4 bg-panel border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar name={name} color={conversation.user?.avatarColor} size={38} icon={isGroup ? "👥" : null} />
          <div>
            <p className="text-sm font-semibold text-ink leading-tight">
              {name} {conversation.user?.verified && <span className="text-brand-600 text-xs">✓</span>}
            </p>
            <p className="text-xs text-muted leading-tight">
              {isGroup ? `${conversation.group.groupType} group` : conversation.user.accountType === "business" ? "Business account" : `@${conversation.user.username}`}
            </p>
          </div>
        </div>
        {isGroup && (
          <button
            onClick={onToggleMute}
            className="text-xs text-muted hover:text-ink px-3 py-1.5 rounded-full hover:bg-black/5 transition"
          >
            {conversation.muted ? "🔔 Unmute" : "🔕 Mute"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 chat-bg">
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id || i}
            message={m}
            isOwn={m.sender?.id === currentUserId || m.sender?._id === currentUserId}
            showSender={isGroup}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <Composer onSend={onSend} />
    </div>
  );
}
