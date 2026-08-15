import { useState } from "react";

const STYLES = {
  notify: { bg: "bg-brand-100", text: "text-brand-700", dot: "bg-brand-500", label: "Notify" },
  digest: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Digest" },
  mute: { bg: "bg-gray-200", text: "text-gray-600", dot: "bg-gray-500", label: "Muted" },
};

export default function RouteBadge({ route, compact = false }) {
  const [open, setOpen] = useState(false);
  if (!route) return null;
  const style = STYLES[route.action] || STYLES.digest;

  return (
    <div className="inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text} hover:opacity-80 transition`}
        title="Click to see why"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {style.label}
        {!compact && <span className="opacity-70">· {route.messageType}</span>}
      </button>

      {open && (
        <div className="mt-1.5 max-w-xs rounded-lg border border-gray-200 bg-white p-2.5 text-xs shadow-lg">
          <p className="text-ink">{route.reason}</p>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
            <span>Confidence: {Math.round(route.confidence * 100)}%</span>
            <span className="capitalize">{route.messageType}</span>
          </div>
          {route.signals && (
            <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px] text-muted">
              <SignalPill label="trust" value={route.signals.trust} />
              <SignalPill label="urgency" value={route.signals.urgency} />
              <SignalPill label="risk" value={route.signals.risk} />
              <SignalPill label="fatigue" value={route.signals.fatigue} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignalPill({ label, value }) {
  return (
    <div className="rounded bg-gray-50 px-1 py-1 text-center">
      <div className="font-mono">{value ?? "-"}</div>
      <div>{label}</div>
    </div>
  );
}
