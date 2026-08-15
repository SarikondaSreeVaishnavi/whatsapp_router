import {
  computeFatigue, computeBusinessTrust, computeGroupTrust, computePersonalTrust,
  computeUrgency, computeRisk, sameContextHistory,
} from "./signals.js";
import { decide, buildReason } from "./decide.js";

/**
 * Routes one message for one recipient. Called once per personal message,
 * and once per group member for a group message (each member can get a
 * different decision based on their own trust/mute/fatigue state).
 *
 * @param {object} params
 * @param {import('../models/Message.js').default} params.message
 * @param {import('../models/User.js').default} params.sender
 * @param {import('../models/User.js').default} params.recipient
 * @param {import('../models/Group.js').default|null} params.group
 */
export async function routeMessage({ message, sender, recipient, group }) {
  const fullText = (message.text || "").trim();
  const category = group ? "group" : sender.accountType === "business" ? "business" : "personal";

  const senderId = sender._id;
  const recipientId = recipient._id;
  const groupId = group?._id || null;

  const { fatigue, summary, notes: fatigueNotes } = await computeFatigue({
    recipientId, senderId, groupId,
  });

  let trust, trustNotes, groupMuted = false;
  let hasActiveBizRelationship = summary.n > 0 && (summary.opened > 0 || summary.replied > 0);

  if (category === "business") {
    ({ trust, notes: trustNotes } = computeBusinessTrust(sender, summary));
  } else if (category === "group") {
    const senderMember = group.memberEntry(senderId);
    const recipientMember = group.memberEntry(recipientId);
    const r = computeGroupTrust(group, senderMember, recipientMember);
    trust = r.trust;
    trustNotes = r.notes;
    groupMuted = r.muted;
  } else {
    ({ trust, notes: trustNotes } = computePersonalTrust(summary));
  }

  const { urgency, notes: urgencyNotes } = computeUrgency(fullText, {
    conversationType: category,
    forwardedCount: message.forwardedCount || 0,
    hasActiveBizRelationship,
  });

  const { risk, injection, notes: riskNotes } = computeRisk(fullText, {
    conversationType: category,
    verified: sender.verified,
    reactionCount: summary.n,
  });

  const directlyAddressed =
    urgency >= 0.5 &&
    (new RegExp(`@${escapeRegex(recipient.username)}\\b`, "i").test(fullText) ||
      /\byou\b|\byour\b/i.test(fullText));

  const result = decide({
    category, trust, urgency, risk, fatigue, injection,
    groupMuted, directlyAddressed, hasActiveBizRelationship, fullText,
  });

  const allNotes = [...riskNotes, ...trustNotes, ...urgencyNotes, ...fatigueNotes];
  const reason = buildReason(result.action, result.messageType, allNotes, message.media?.kind);

  // Evidence: same-context history rows with a notable reaction, most
  // relevant first.
  const history = await sameContextHistory({ recipientId, senderId, groupId, limit: 10 });
  const evidenceMessageIds = history
    .filter((r) => r.status?.opened || r.status?.repliedAt || r.status?.dismissedAt || r.status?.reportedAt)
    .slice(0, 3)
    .map((r) => r.message);

  return {
    action: result.action,
    messageType: result.messageType,
    reason,
    confidence: result.confidence,
    evidenceMessageIds,
    signals: { trust: round(trust), urgency: round(urgency), risk: round(risk), fatigue: round(fatigue), injection },
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
