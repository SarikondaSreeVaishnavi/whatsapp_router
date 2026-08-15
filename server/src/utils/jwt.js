import jwt from "jsonwebtoken";

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export const AUTH_COOKIE_NAME = "wr_token";

export function authCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true, // not readable by client-side JS -> mitigates XSS token theft
    secure: isProd, // HTTPS-only in production
    sameSite: isProd ? "none" : "lax", // CSRF mitigation; 'lax' works for same-site dev proxy
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
