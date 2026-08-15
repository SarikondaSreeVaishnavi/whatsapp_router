import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function checkValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(errors.array()[0].msg);
    err.status = 400;
    throw err;
  }
}

export const signup = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { username, displayName, email, password, accountType } = req.body;

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return res.status(409).json({ error: "That username or email is already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username,
    displayName,
    email,
    passwordHash,
    accountType: accountType === "business" ? "business" : "personal",
  });

  const token = signToken(user._id);
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
  res.status(201).json({ user: user.toSafeJSON() });
});

export const login = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { identifier, password } = req.body; // username or email

  const user = await User.findOne({
    $or: [{ username: identifier.toLowerCase() }, { email: identifier.toLowerCase() }],
  });

  // Same generic error whether the user doesn't exist or the password is
  // wrong - avoids leaking which usernames/emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid username/email or password" });
  }

  const token = signToken(user._id);
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
  res.json({ user: user.toSafeJSON() });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: user.toSafeJSON() });
});
