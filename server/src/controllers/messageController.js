import mongoose from "mongoose";
import Message from "../models/Message.js";
import MessageRoute from "../models/MessageRoute.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { routeMessage } from "../router-ai/index.js";
import { mediaKindFromMime } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** POST /api/messages - send a message, route it for every recipient,
 * push it out over sockets in real time. */
export const sendMessage = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const { conversationType, recipientId, groupId, text = "", forwardedCount = 0 } = req.body;

  if (!conversationType || !["personal", "group"].includes(conversationType)) {
    return res.status(400).json({ error: "conversationType must be 'personal' or 'group'" });
  }
  if (!text.trim() && !req.file) {
    return res.status(400).json({ error: "Message must have text or media" });
  }

  const sender = await User.findById(req.userId);
  let group = null;
  let recipients = [];

  if (conversationType === "personal") {
    if (!recipientId) return res.status(400).json({ error: "recipientId is required" });
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: "Recipient not found" });
    recipients = [recipient];
  } else {
    if (!groupId) return res.status(400).json({ error: "groupId is required" });
    group = await Group.findById(groupId).populate("members.user", "username displayName accountType verified createdAt reportsCount avatarColor");
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!group.memberEntry(req.userId)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }
    recipients = group.members.map((m) => m.user).filter((u) => u._id.toString() !== req.userId);
  }

  const media = req.file
    ? {
        kind: mediaKindFromMime(req.file.mimetype),
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }
    : { kind: null, url: "", mimeType: "", size: 0 };

  const message = await Message.create({
    sender: sender._id,
    conversationType,
    recipient: conversationType === "personal" ? recipients[0]._id : undefined,
    group: conversationType === "group" ? group._id : undefined,
    text: text.trim(),
    media,
    forwardedCount,
  });

  // Route the message for every recipient (1 for personal, N for group).
  const routes = [];
  for (const recipient of recipients) {
    const decision = await routeMessage({ message, sender, recipient, group });
    const route = await MessageRoute.create({
      message: message._id,
      recipient: recipient._id,
      sender: sender._id,
      group: group?._id || null,
      ...decision,
    });
    routes.push({ recipient, route });

    io?.to(`user:${recipient._id}`).emit("message:new", {
      message: serializeMessage(message, sender),
      route: serializeRoute(route),
    });
  }

  // If this message is a reply within an existing thread, mark the
  // sender's own pending inbound routes from this collocutor as replied -
  // this is what feeds "you've replied to this sender before" trust on
  // future messages, without needing an explicit "mark as replied" click.
  const repliedFilter = { recipient: sender._id, "status.repliedAt": null };
  if (conversationType === "personal") repliedFilter.sender = recipients[0]._id;
  else repliedFilter.group = group._id;
  await MessageRoute.updateMany(repliedFilter, { $set: { "status.repliedAt": new Date() } });

  res.status(201).json({
    message: serializeMessage(message, sender),
    routes: routes.map((r) => serializeRoute(r.route)),
  });
});

/** GET /api/messages/conversation?type=personal&withUserId=...
 *  GET /api/messages/conversation?type=group&groupId=... */
export const getConversation = asyncHandler(async (req, res) => {
  const { type, withUserId, groupId, before, limit = 50 } = req.query;
  if (!["personal", "group"].includes(type)) {
    return res.status(400).json({ error: "type must be 'personal' or 'group'" });
  }

  const messageFilter = { conversationType: type };
  if (type === "personal") {
    if (!withUserId) return res.status(400).json({ error: "withUserId is required" });
    messageFilter.$or = [
      { sender: req.userId, recipient: withUserId },
      { sender: withUserId, recipient: req.userId },
    ];
  } else {
    if (!groupId) return res.status(400).json({ error: "groupId is required" });
    messageFilter.group = groupId;
  }
  if (before) messageFilter.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(messageFilter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate("sender", "username displayName accountType verified avatarColor")
    .lean();

  // Attach this user's own routing decision to each message they received
  // (their own sent messages don't have a route for themselves).
  const messageIds = messages.map((m) => m._id);
  const routes = await MessageRoute.find({ message: { $in: messageIds }, recipient: req.userId }).lean();
  const routeByMessage = Object.fromEntries(routes.map((r) => [r.message.toString(), r]));

  const enriched = messages
    .reverse()
    .map((m) => ({ ...m, route: routeByMessage[m._id.toString()] || null }));

  res.json({ messages: enriched });
});

/** GET /api/messages/conversations - the sidebar list: every personal
 * contact + group with recent activity, most recent first. */
export const listConversations = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);

  const personal = await Message.aggregate([
    { $match: { conversationType: "personal", $or: [{ sender: userId }, { recipient: userId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ["$sender", userId] }, "$recipient", "$sender"] },
        lastMessage: { $first: "$$ROOT" },
      },
    },
  ]);
  const otherUserIds = personal.map((p) => p._id);
  const otherUsers = await User.find({ _id: { $in: otherUserIds } }).select(
    "username displayName accountType verified avatarColor"
  );
  const userById = Object.fromEntries(otherUsers.map((u) => [u._id.toString(), u]));

  const groups = await Group.find({ "members.user": userId }).select("name groupType updatedAt");

  const personalConversations = personal
    .filter((p) => userById[p._id.toString()])
    .map((p) => ({
      type: "personal",
      user: userById[p._id.toString()],
      lastMessage: { text: p.lastMessage.text, createdAt: p.lastMessage.createdAt, mediaKind: p.lastMessage.media?.kind || null },
    }));

  const groupConversations = groups.map((g) => ({
    type: "group",
    group: { id: g._id, name: g.name, groupType: g.groupType },
    lastMessage: null,
  }));

  const all = [...personalConversations, ...groupConversations].sort(
    (a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0)
  );

  res.json({ conversations: all });
});

/** GET /api/messages/inbox - the "Smart Inbox" grouped by AI decision. */
export const getInbox = asyncHandler(async (req, res) => {
  const routes = await MessageRoute.find({ recipient: req.userId })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate({ path: "message", populate: { path: "sender", select: "username displayName accountType verified avatarColor" } })
    .populate("group", "name groupType")
    .populate("evidenceMessageIds", "text createdAt")
    .lean();

  const grouped = { notify: [], digest: [], mute: [] };
  for (const r of routes) {
    if (!r.message) continue; // message deleted, defensive skip
    grouped[r.action]?.push(serializeInboxItem(r));
  }
  res.json(grouped);
});

export const markOpened = asyncHandler(async (req, res) => {
  await MessageRoute.updateOne(
    { message: req.params.messageId, recipient: req.userId },
    { $set: { "status.opened": true, "status.openedAt": new Date() } }
  );
  res.json({ ok: true });
});

export const markDismissed = asyncHandler(async (req, res) => {
  await MessageRoute.updateOne(
    { message: req.params.messageId, recipient: req.userId },
    { $set: { "status.dismissedAt": new Date() } }
  );
  res.json({ ok: true });
});

export const markReported = asyncHandler(async (req, res) => {
  const route = await MessageRoute.findOneAndUpdate(
    { message: req.params.messageId, recipient: req.userId },
    { $set: { "status.reportedAt": new Date() } },
    { new: true }
  );
  if (route) {
    await User.updateOne({ _id: route.sender }, { $inc: { reportsCount: 1 } });
  }
  res.json({ ok: true });
});

// ---- serialization helpers -------------------------------------------------

function serializeMessage(message, sender) {
  return {
    id: message._id,
    sender: { id: sender._id, username: sender.username, displayName: sender.displayName, avatarColor: sender.avatarColor },
    conversationType: message.conversationType,
    recipient: message.recipient,
    group: message.group,
    text: message.text,
    media: message.media,
    forwardedCount: message.forwardedCount,
    createdAt: message.createdAt,
  };
}

function serializeRoute(route) {
  return {
    id: route._id,
    recipient: route.recipient,
    action: route.action,
    messageType: route.messageType,
    reason: route.reason,
    confidence: route.confidence,
    evidenceMessageIds: route.evidenceMessageIds,
    signals: route.signals,
  };
}

function serializeInboxItem(route) {
  return {
    routeId: route._id,
    action: route.action,
    messageType: route.messageType,
    reason: route.reason,
    confidence: route.confidence,
    signals: route.signals,
    status: route.status,
    evidence: (route.evidenceMessageIds || []).map((e) => ({
      id: e._id,
      text: e.text?.slice(0, 80) || "",
      createdAt: e.createdAt,
    })),
    message: {
      id: route.message._id,
      text: route.message.text,
      media: route.message.media,
      createdAt: route.message.createdAt,
      sender: route.message.sender,
    },
    group: route.group || null,
  };
}
