import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sidebar({
  view, setView,
  conversations, activeKey, onSelectConversation,
  onOpenNewChat, onOpenNewGroup,
  inboxCounts,
}) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((c) => {
    const name = c.type === "personal" ? c.user?.displayName : c.group?.name;
    return name?.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="w-[380px] shrink-0 border-r border-gray-200 bg-white flex flex-col">
      {/* header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-4 bg-panel">
        <div className="flex items-center gap-2">
          <Avatar name={user?.displayName} color={user?.avatarColor} size={38} />
          <div>
            <p className="text-sm font-semibold text-ink leading-tight">{user?.displayName}</p>
            <p className="text-xs text-muted leading-tight">@{user?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton title="New chat" onClick={onOpenNewChat}>💬</IconButton>
          <IconButton title="New group" onClick={onOpenNewGroup}>👥</IconButton>
          <IconButton title="Log out" onClick={logout}>⎋</IconButton>
        </div>
      </div>

      {/* view toggle */}
      <div className="flex border-b border-gray-200">
        <TabButton active={view === "chats"} onClick={() => setView("chats")}>
          Chats
        </TabButton>
        <TabButton active={view === "inbox"} onClick={() => setView("inbox")}>
          Smart Inbox
          {inboxCounts?.notify > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-brand-500 text-white text-[10px] px-1">
              {inboxCounts.notify}
            </span>
          )}
        </TabButton>
      </div>

      {view === "chats" && (
        <>
          <div className="p-2 shrink-0">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or start a new chat"
              className="w-full rounded-lg bg-panel px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted mt-10 px-6">
                No conversations yet — tap 💬 to message someone.
              </p>
            )}
            {filtered.map((c) => {
              const key = c.type === "personal" ? `personal:${c.user.id}` : `group:${c.group.id}`;
              const name = c.type === "personal" ? c.user.displayName : c.group.name;
              const active = key === activeKey;
              return (
                <button
                  key={key}
                  onClick={() => onSelectConversation(c)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-panel transition ${
                    active ? "bg-panel" : ""
                  }`}
                >
                  <Avatar name={name} color={c.user?.avatarColor} size={44} icon={c.type === "group" ? "👥" : null} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-ink truncate">{name}</p>
                      {c.user?.verified && <span className="text-brand-600 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-muted truncate">
                      {c.lastMessage?.mediaKind ? `[${c.lastMessage.mediaKind}] ` : ""}
                      {c.lastMessage?.text || (c.type === "group" ? `${c.group.groupType} group` : "Say hello 👋")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium transition ${
        active ? "text-brand-700 border-b-2 border-brand-500" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/5 text-sm transition"
    >
      {children}
    </button>
  );
}

export function Avatar({ name, color = "#6366f1", size = 40, icon }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {icon || initials}
    </div>
  );
}
