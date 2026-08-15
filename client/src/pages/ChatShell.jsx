import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import SmartInbox from "../components/SmartInbox.jsx";
import NewChatModal from "../components/NewChatModal.jsx";
import NewGroupModal from "../components/NewGroupModal.jsx";

export default function ChatShell() {
  const { user } = useAuth();
  const socket = useSocket();

  const [view, setView] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null); // { type, user|group }
  const [messages, setMessages] = useState([]);
  const [inbox, setInbox] = useState({ notify: [], digest: [], mute: [] });
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  const activeKey = active
    ? active.type === "personal"
      ? `personal:${active.user.id || active.user._id}`
      : `group:${active.group.id || active.group._id}`
    : null;

  const refreshConversations = useCallback(() => {
    api.get("/api/messages/conversations").then((data) => setConversations(data.conversations));
  }, []);

  const refreshInbox = useCallback(() => {
    api.get("/api/messages/inbox").then(setInbox);
  }, []);

  useEffect(() => {
    refreshConversations();
    refreshInbox();
  }, [refreshConversations, refreshInbox]);

  // live updates
  useEffect(() => {
    if (!socket) return;
    function onNew({ message, route }) {
      refreshConversations();
      refreshInbox();

      const isActivePersonal =
        active?.type === "personal" &&
        message.conversationType === "personal" &&
        (message.sender.id === active.user.id || message.sender.id === active.user._id);
      const isActiveGroup =
        active?.type === "group" &&
        message.conversationType === "group" &&
        String(message.group) === String(active.group.id || active.group._id);

      if (isActivePersonal || isActiveGroup) {
        setMessages((prev) => [...prev, { ...message, route }]);
        api.post(`/api/messages/${message.id}/open`).catch(() => {});
      }
    }
    socket.on("message:new", onNew);
    return () => socket.off("message:new", onNew);
  }, [socket, active, refreshConversations, refreshInbox]);

  async function selectConversation(c) {
    setActive(c);
    setView("chats");
    const params =
      c.type === "personal"
        ? `type=personal&withUserId=${c.user.id || c.user._id}`
        : `type=group&groupId=${c.group.id || c.group._id}`;
    const data = await api.get(`/api/messages/conversation?${params}`);
    setMessages(data.messages);
    // mark all received messages in this thread as opened
    data.messages
      .filter((m) => m.route && !m.route.status?.opened)
      .forEach((m) => api.post(`/api/messages/${m._id || m.id}/open`).catch(() => {}));
  }

  async function sendMessage({ text, file }) {
    const form = new FormData();
    form.append("conversationType", active.type);
    if (active.type === "personal") form.append("recipientId", active.user.id || active.user._id);
    else form.append("groupId", active.group.id || active.group._id);
    form.append("text", text || "");
    if (file) form.append("media", file);

    const data = await api.postForm("/api/messages", form);
    setMessages((prev) => [...prev, data.message]);
    refreshConversations();
  }

  async function toggleMute() {
    if (active?.type !== "group") return;
    const id = active.group.id || active.group._id;
    await api.post(`/api/groups/${id}/mute`);
    setActive((a) => ({ ...a, muted: !a.muted }));
  }

  async function handleDismiss(item) {
    await api.post(`/api/messages/${item.message.id}/dismiss`);
    refreshInbox();
  }

  async function handleReport(item) {
    await api.post(`/api/messages/${item.message.id}/report`);
    refreshInbox();
  }

  function jumpToConversation(item) {
    if (item.group) {
      selectConversation({ type: "group", group: item.group });
    } else {
      selectConversation({ type: "personal", user: item.message.sender });
    }
  }

  async function handlePickUser(u) {
    setShowNewChat(false);
    await selectConversation({ type: "personal", user: u });
  }

  async function handleCreateGroup(payload) {
    const data = await api.post("/api/groups", payload);
    setShowNewGroup(false);
    refreshConversations();
    await selectConversation({ type: "group", group: { ...data.group, id: data.group._id } });
  }

  return (
    <div className="h-screen w-screen flex bg-panel">
      <Sidebar
        view={view}
        setView={setView}
        conversations={conversations}
        activeKey={activeKey}
        onSelectConversation={selectConversation}
        onOpenNewChat={() => setShowNewChat(true)}
        onOpenNewGroup={() => setShowNewGroup(true)}
        inboxCounts={{ notify: inbox.notify.length }}
      />

      {view === "chats" ? (
        <ChatWindow
          conversation={active}
          messages={messages}
          currentUserId={user.id}
          onSend={sendMessage}
          onToggleMute={toggleMute}
        />
      ) : (
        <SmartInbox
          inbox={inbox}
          onDismiss={handleDismiss}
          onReport={handleReport}
          onJumpToConversation={jumpToConversation}
        />
      )}

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onPick={handlePickUser} />}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} onCreate={handleCreateGroup} />}
    </div>
  );
}
