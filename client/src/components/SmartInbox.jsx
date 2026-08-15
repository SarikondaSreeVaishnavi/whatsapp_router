import { useState } from "react";
import RouteBadge from "./RouteBadge.jsx";
import { Avatar } from "./Sidebar.jsx";

const SECTIONS = [
  { key: "notify", label: "Notify", hint: "Important enough to interrupt you now" },
  { key: "digest", label: "Digest", hint: "Useful, but can wait" },
  { key: "mute", label: "Muted", hint: "Low-value, repetitive, or unsafe" },
];

export default function SmartInbox({ inbox, onDismiss, onReport, onJumpToConversation }) {
  const [active, setActive] = useState("notify");
  const items = inbox?.[active] || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 chat-bg">
      <div className="h-16 shrink-0 flex items-center px-6 bg-panel border-b border-gray-200">
        <h2 className="text-sm font-semibold text-ink">Smart Inbox</h2>
      </div>

      <div className="flex gap-2 px-6 pt-4">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              active === s.key ? "bg-brand-500 text-white" : "bg-white text-muted hover:text-ink"
            }`}
          >
            {s.label}
            <span className="ml-1.5 opacity-75">({(inbox?.[s.key] || []).length})</span>
          </button>
        ))}
      </div>
      <p className="px-6 pt-2 text-xs text-muted">{SECTIONS.find((s) => s.key === active)?.hint}</p>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {items.length === 0 && <p className="text-sm text-muted text-center mt-10">Nothing here right now.</p>}
        {items.map((item) => (
          <div
            key={item.routeId}
            className="bg-white rounded-xl p-3 shadow-sm flex gap-3 cursor-pointer hover:shadow-md transition"
            onClick={() => onJumpToConversation(item)}
          >
            <Avatar
              name={item.group ? item.group.name : item.message.sender?.displayName}
              icon={item.group ? "👥" : null}
              color={item.message.sender?.avatarColor}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink truncate">
                  {item.group ? `${item.group.name} · ${item.message.sender?.displayName}` : item.message.sender?.displayName}
                </p>
                <span className="text-[10px] text-muted shrink-0">
                  {new Date(item.message.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-muted truncate mt-0.5">
                {item.message.media?.kind ? `[${item.message.media.kind}] ` : ""}
                {item.message.text || "(no text)"}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <RouteBadge route={item} />
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <SmallButton onClick={() => onDismiss(item)}>Dismiss</SmallButton>
                  <SmallButton onClick={() => onReport(item)} danger>
                    Report
                  </SmallButton>
                </div>
              </div>
              {item.evidence?.length > 0 && (
                <p className="mt-1.5 text-[10px] text-muted">
                  Based on {item.evidence.length} similar past message{item.evidence.length > 1 ? "s" : ""} from this sender
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmallButton({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2 py-1 rounded-full transition ${
        danger ? "text-red-600 hover:bg-red-50" : "text-muted hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
