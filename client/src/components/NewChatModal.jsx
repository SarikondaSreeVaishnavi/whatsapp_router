import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Avatar } from "./Sidebar.jsx";

export default function NewChatModal({ onClose, onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      api
        .get(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        .then((data) => setResults(data.users))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <Modal onClose={onClose} title="New chat">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username or name"
        className="w-full rounded-lg bg-panel px-3 py-2 text-sm focus:outline-none mb-3"
      />
      {loading && <p className="text-xs text-muted">Searching...</p>}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {results.map((u) => (
          <button
            key={u._id}
            onClick={() => onPick(u)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-panel transition text-left"
          >
            <Avatar name={u.displayName} color={u.avatarColor} size={36} />
            <div>
              <p className="text-sm font-medium text-ink">
                {u.displayName} {u.verified && <span className="text-brand-600 text-xs">✓</span>}
              </p>
              <p className="text-xs text-muted">
                @{u.username} {u.accountType === "business" && "· Business"}
              </p>
            </div>
          </button>
        ))}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <p className="text-xs text-muted px-2">No users found.</p>
        )}
      </div>
    </Modal>
  );
}

export function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
