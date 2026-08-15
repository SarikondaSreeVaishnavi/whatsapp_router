import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json({ users: [] });

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({
    _id: { $ne: req.userId },
    $or: [
      { username: new RegExp(escaped, "i") },
      { displayName: new RegExp(escaped, "i") },
    ],
  })
    .limit(15)
    .select("username displayName accountType verified avatarColor");

  res.json({ users });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["displayName", "dndWindow", "avatarColor", "officialDomain"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.userId, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ user: user.toSafeJSON() });
});
