import { anyMatch, PROMOTION_PATTERNS, FORWARD_GREETING_PATTERNS, URGENCY_PATTERNS } from "./patterns.js";

/**
 * Same priority order as the Python engine's _decide():
 *   1. risk/injection -> mute, scam                (safety always wins)
 *   2. group muted AND NOT (urgent + directly addressed) -> mute
 *   3. cold business promo (no relationship) -> mute, promotion
 *   4. urgency + adequate trust -> notify
 *   5. fatigue / opted-out pattern -> mute
 *   6. otherwise -> digest
 */
export function decide({
  category, // 'personal' | 'group' | 'business'
  trust, urgency, risk, fatigue, injection,
  groupMuted, directlyAddressed,
  hasActiveBizRelationship,
  fullText,
}) {
  const t = fullText.toLowerCase();

  if (injection || risk >= 0.5) {
    return { action: "mute", messageType: "scam", confidence: round(0.75 + Math.min(0.15, risk * 0.2)) };
  }

  if (category === "group" && groupMuted && !(urgency >= 0.55 && directlyAddressed)) {
    const mtype = anyMatch(FORWARD_GREETING_PATTERNS, t) ? "greeting" : "unknown";
    return { action: "mute", messageType: mtype, confidence: round(Math.min(0.9, 0.7 + 0.15 * fatigue)) };
  }

  const coldPromo =
    category === "business" &&
    !hasActiveBizRelationship &&
    anyMatch(PROMOTION_PATTERNS, t) &&
    urgency < 0.55;
  if (coldPromo) {
    return { action: "mute", messageType: "promotion", confidence: 0.72 };
  }

  if (urgency >= 0.55 && trust >= 0.4) {
    let mtype;
    if (category === "business") {
      mtype = "business_update";
    } else if (category === "group" && anyMatch([/consent/i, /circular/i, /field trip/i, /school/i, /\bbus\b/i, /supply/i, /meeting/i, /event/i], t)) {
      mtype = "event";
    } else if (category === "personal") {
      mtype = anyMatch(URGENCY_PATTERNS.slice(0, 3), t) ? "urgent" : "personal";
    } else {
      mtype = "urgent";
    }
    return { action: "notify", messageType: mtype, confidence: round(Math.min(0.95, 0.7 + 0.2 * trust)) };
  }

  if (fatigue >= 0.5 || (category === "business" && trust <= 0.25)) {
    let mtype;
    if (anyMatch(PROMOTION_PATTERNS, t)) mtype = "promotion";
    else if (anyMatch(FORWARD_GREETING_PATTERNS, t)) mtype = "greeting";
    else mtype = "spam";
    return { action: "mute", messageType: mtype, confidence: round(Math.min(0.9, 0.7 + 0.15 * fatigue)) };
  }

  let mtype;
  if (anyMatch(PROMOTION_PATTERNS, t)) mtype = "promotion";
  else if (category === "business") mtype = "business_update";
  else if (anyMatch(FORWARD_GREETING_PATTERNS, t)) mtype = "greeting";
  else if (!fullText.trim()) mtype = "unknown";
  else mtype = category === "personal" ? "personal" : "unknown";

  return { action: "digest", messageType: mtype, confidence: round(Math.min(0.9, 0.55 + 0.2 * trust)) };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export function buildReason(action, messageType, notes, mediaKind) {
  const base = notes.length ? notes.slice(0, 2).join("; ") : "based on sender, content, and history";
  const templates = {
    "mute:scam": `Message shows scam signals (${base}); muted to protect you.`,
    "mute:promotion": `Promotional content you typically don't engage with (${base}); muted.`,
    "mute:spam": `Low-value or unwanted content (${base}); muted.`,
    "mute:greeting": `Low-value greeting/chain content (${base}); muted.`,
    "mute:unknown": `Message from a muted or low-signal context (${base}); muted.`,
    "notify:urgent": `Time-sensitive message from a trusted sender (${base}); notifying now.`,
    "notify:business_update": `Relevant, time-sensitive update (${base}); notifying now.`,
    "notify:event": `Same-day/operational update you likely need (${base}); notifying now.`,
    "notify:personal": `Direct message needing your attention (${base}); notifying now.`,
    "digest:promotion": `Promotional but not urgent (${base}); moved to digest.`,
    "digest:business_update": `Legitimate update, not urgent (${base}); moved to digest.`,
    "digest:greeting": `Harmless greeting (${base}); moved to digest.`,
    "digest:personal": `Safe, low-urgency message (${base}); moved to digest.`,
    "digest:unknown": `No urgency or risk signal found (${base}); moved to digest.`,
  };
  let reason = templates[`${action}:${messageType}`] || `${cap(action)} based on: ${base}.`;
  if (mediaKind === "image") reason += " (image attached, content not yet OCR'd in this build)";
  if (mediaKind === "voice") reason += " (voice note attached, content not yet transcribed in this build)";
  return reason;
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
