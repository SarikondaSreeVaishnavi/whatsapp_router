import RouteBadge from "./RouteBadge.jsx";

export default function MessageBubble({ message, isOwn, showSender }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1.5`}>
      <div
        className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${
          isOwn ? "bg-bubbleOut rounded-tr-none" : "bg-bubbleIn rounded-tl-none"
        }`}
      >
        {showSender && !isOwn && (
          <p className="text-xs font-semibold text-brand-700 mb-0.5">{message.sender?.displayName}</p>
        )}

        {message.media?.url && message.media.kind === "image" && (
          <img src={message.media.url} alt="attachment" className="rounded-md mb-1 max-h-64 object-cover" />
        )}
        {message.media?.url && message.media.kind === "voice" && (
          <audio controls src={message.media.url} className="mb-1 max-w-full" />
        )}

        {message.text && <p className="text-sm text-ink whitespace-pre-wrap break-words">{message.text}</p>}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-muted">{time}</span>
        </div>

        {!isOwn && message.route && (
          <div className="mt-1.5 pt-1.5 border-t border-black/5">
            <RouteBadge route={message.route} />
          </div>
        )}
      </div>
    </div>
  );
}
