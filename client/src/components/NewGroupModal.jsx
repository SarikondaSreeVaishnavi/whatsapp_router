import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Avatar } from "./Sidebar.jsx";
import { Modal } from "./NewChatModal.jsx";

const GROUP_TYPES = ["family", "school", "work", "society", "friends", "other"];

export default function NewGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState("family");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      api.get(`/api/users/search?q=${encodeURIComponent(query.trim())}`).then((data) => setResults(data.users));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function toggle(user) {
    setSelected((sel) =>
      sel.some((u) => u._id === user._id) ? sel.filter((u) => u._id !== user._id) : [...sel, user]
    );
  }

  async function submit() {
    if (!name.trim() || selected.length === 0) return;
    setBusy(true);
    try {
      await onCreate({ name, groupType, memberIds: selected.map((u) => u._id) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} title="New group">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name"
        className="w-full rounded-lg bg-panel px-3 py-2 text-sm focus:outline-none mb-2"
      />
      <select
        value={groupType}
        onChange={(e) => setGroupType(e.target.value)}
        className="w-full rounded-lg bg-panel px-3 py-2 text-sm focus:outline-none mb-3 capitalize"
      >
        {GROUP_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((u) => (
            <span key={u._id} className="text-xs bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
              {u.displayName} ✕
            </span>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Add members..."
        className="w-full rounded-lg bg-panel px-3 py-2 text-sm focus:outline-none mb-2"
      />
      <div className="space-y-1 max-h-40 overflow-y-auto mb-3">
        {results.map((u) => (
          <button
            key={u._id}
            onClick={() => toggle(u)}
            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-panel transition text-left"
          >
            <Avatar name={u.displayName} color={u.avatarColor} size={30} />
            <p className="text-sm text-ink">{u.displayName}</p>
            {selected.some((s) => s._id === u._id) && <span className="ml-auto text-brand-600">✓</span>}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={busy || !name.trim() || selected.length === 0}
        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2 text-sm transition disabled:opacity-50"
      >
        {busy ? "Creating..." : "Create group"}
      </button>
    </Modal>
  );
}
