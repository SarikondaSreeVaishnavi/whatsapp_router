import { useRef, useState } from "react";

export default function Composer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      await onSend({ text, file });
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-gray-200 bg-panel px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        className="hidden"
        id="media-input"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <label
        htmlFor="media-input"
        className="cursor-pointer text-muted hover:text-ink px-2 py-2 rounded-full hover:bg-black/5 transition"
        title="Attach image or voice note"
      >
        📎
      </label>

      <div className="flex-1">
        {file && (
          <div className="mb-1 flex items-center gap-2 text-xs text-muted bg-white rounded px-2 py-1 w-fit">
            <span>{file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="text-red-500">
              ✕
            </button>
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          rows={1}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          className="w-full resize-none rounded-lg border-0 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <button
        type="submit"
        disabled={disabled || sending || (!text.trim() && !file)}
        className="h-10 w-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center disabled:opacity-50 transition shrink-0"
        title="Send"
      >
        ➤
      </button>
    </form>
  );
}
