import Group from "../models/Group.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listMyGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ "members.user": req.userId })
    .populate("members.user", "username displayName avatarColor")
    .sort({ updatedAt: -1 });
  res.json({ groups });
});

export const createGroup = asyncHandler(async (req, res) => {
  const { name, groupType, memberIds = [] } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Group name is required" });
  }

  const uniqueMemberIds = [...new Set(memberIds.filter((id) => id !== req.userId))];

  const group = await Group.create({
    name: name.trim(),
    groupType: groupType || "other",
    createdBy: req.userId,
    members: [
      { user: req.userId, role: "admin" },
      ...uniqueMemberIds.map((id) => ({ user: id, role: "member" })),
    ],
  });

  await group.populate("members.user", "username displayName avatarColor");
  res.status(201).json({ group });
});

export const toggleMute = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const member = group.memberEntry(req.userId);
  if (!member) return res.status(403).json({ error: "You are not a member of this group" });

  member.muted = !member.muted;
  await group.save();
  res.json({ muted: member.muted });
});

export const addMember = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const requester = group.memberEntry(req.userId);
  if (!requester || requester.role !== "admin") {
    return res.status(403).json({ error: "Only group admins can add members" });
  }

  const { userId } = req.body;
  if (group.memberEntry(userId)) {
    return res.status(409).json({ error: "That user is already a member" });
  }

  group.members.push({ user: userId, role: "member" });
  await group.save();
  await group.populate("members.user", "username displayName avatarColor");
  res.json({ group });
});
