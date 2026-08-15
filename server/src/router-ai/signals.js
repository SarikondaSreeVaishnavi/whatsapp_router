import MessageRoute from "../models/MessageRoute.js";
import {
  RISK_PATTERNS, INJECTION_PATTERNS, URGENCY_PATTERNS, ORDER_PATTERNS,
  anyMatch, countMatches,
} from "./patterns.js";

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** Past routes this recipient has for messages from this exact sender
 * (personal) or in this exact group - the "same_context" evidence set
 * from the Python version. Most recent first. */
export async function sameContextHistory({ recipientId, senderId, groupId, limit = 25 }) {
  const query = { recipient: recipientId };
  if (groupId) query.group = groupId;
  else query.sender = senderId;
  return MessageRoute.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}

function summarizeReactions(routes) {
  const n = routes.length;
  let dismissed = 0, reported = 0, opened = 0, replied = 0;
  for (const r of routes) {
    if (r.status?.dismissedAt) dismissed += 1;
    if (r.status?.reportedAt) reported += 1;
    if (r.status?.opened) opened += 1;
    if (r.status?.repliedAt) replied += 1;
  }
  return { n, dismissed, reported, opened, replied };
}

export async function computeFatigue({ recipientId, senderId, groupId }) {
  const history = await sameContextHistory({ recipientId, senderId, groupId });
  const s = summarizeReactions(history);
  if (s.n === 0) return { fatigue: 0, summary: s, notes: [] };
  const bad = s.dismissed + s.reported * 2;
  const fatigue = clamp((bad / Math.max(1, s.n)) * 0.8);
  const notes = [];
  if (s.reported) notes.push("similar past messages from this sender were reported by you");
  else if (s.dismissed) notes.push("similar past messages were dismissed without opening");
  else if (s.opened || s.replied) notes.push("you've engaged with messages like this before");
  return { fatigue, summary: s, notes };
}

export function computeBusinessTrust(sender, reactionSummary) {
  const notes = [];
  let trust = 0.5;

  if (sender.verified) {
    trust += 0.15;
    notes.push("verified business account");
  } else {
    trust -= 0.2;
    notes.push("unverified business account");
  }

  const ageDays = (Date.now() - new Date(sender.createdAt).getTime()) / 86400000;
  if (ageDays < 14) {
    trust -= 0.15;
    notes.push("recently created business account");
  }

  if ((sender.reportsCount || 0) >= 5) {
    trust -= 0.2;
    notes.push(`${sender.reportsCount} reports from other users`);
  }

  if (reactionSummary.n > 0 && (reactionSummary.opened || reactionSummary.replied)) {
    trust += 0.15;
    notes.push("you have an existing relationship with this business");
  } else if (reactionSummary.n === 0) {
    trust -= 0.1;
    notes.push("no prior relationship with this business on record");
  }

  return { trust: clamp(trust), notes };
}

export function computeGroupTrust(group, senderMember, recipientMember) {
  const notes = [];
  let trust = 0.5;
  const muted = !!recipientMember?.muted;

  if (senderMember?.role === "admin") {
    trust += 0.25;
    notes.push("sent by a group admin");
  }
  if (group.groupType) notes.push(`${group.groupType} group`);
  if (muted) {
    trust -= 0.3;
    notes.push("you have muted this group");
  }

  return { trust: clamp(trust), muted, notes };
}

export function computePersonalTrust(reactionSummary) {
  const notes = [];
  let trust = 0.5;
  if (reactionSummary.n > 0 && reactionSummary.replied > 0) {
    trust += 0.25;
    notes.push("you've replied to this sender before");
  } else if (reactionSummary.n === 0) {
    notes.push("no prior interaction history with this sender");
  }
  return { trust: clamp(trust), notes };
}

export function computeUrgency(fullText, { conversationType, forwardedCount, hasActiveBizRelationship }) {
  const notes = [];
  let urgency = 0;

  if (anyMatch(URGENCY_PATTERNS, fullText)) {
    urgency += 0.55;
    notes.push("contains time-sensitive / action-needed language");
  }
  if (forwardedCount > 0) urgency -= 0.1;
  if (forwardedCount === 0 && conversationType === "personal") urgency += 0.1;

  if (conversationType === "business" && anyMatch(ORDER_PATTERNS, fullText) && hasActiveBizRelationship) {
    urgency += 0.6;
    notes.push("status update tied to an active relationship with this business");
  }

  return { urgency: clamp(urgency), notes };
}

export function computeRisk(fullText, { conversationType, verified, reactionCount }) {
  const notes = [];
  const injection = anyMatch(INJECTION_PATTERNS, fullText);
  let risk = 0;

  const riskHits = countMatches(RISK_PATTERNS, fullText);
  if (riskHits) {
    risk += Math.min(0.85, 0.22 * riskHits + (riskHits >= 2 ? 0.2 : 0));
    notes.push("contains urgent verification/payment pressure language");
  }
  if (injection) {
    risk += 0.5;
    notes.push("message attempts to instruct the router directly");
  }
  if (conversationType === "business" && !verified && riskHits) {
    risk += 0.2;
  }
  if (conversationType === "personal" && riskHits && reactionCount === 0) {
    risk += 0.2;
    notes.push("first message from this sender, asking for a sensitive action");
  }

  return { risk: clamp(risk), injection, notes };
}
