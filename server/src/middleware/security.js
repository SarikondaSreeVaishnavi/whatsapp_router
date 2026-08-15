import rateLimit from "express-rate-limit";

// Tight limit on auth endpoints specifically - the highest-value target
// for credential stuffing / brute force.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

// Looser general limit so normal chat usage never gets throttled, while
// still capping abuse/scripted flooding.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
