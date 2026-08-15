import { Router } from "express";
import { body } from "express-validator";
import { signup, login, logout, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/security.js";

const router = Router();

router.post(
  "/signup",
  authLimiter,
  [
    body("username")
      .trim()
      .toLowerCase()
      .matches(/^[a-z0-9_]{3,24}$/)
      .withMessage("Username must be 3-24 characters: letters, numbers, underscores only"),
    body("displayName").trim().isLength({ min: 1, max: 50 }).withMessage("Display name is required"),
    body("email").trim().isEmail().normalizeEmail().withMessage("A valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Za-z]/)
      .withMessage("Password must contain a letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),
    body("accountType").optional().isIn(["personal", "business"]),
  ],
  signup
);

router.post(
  "/login",
  authLimiter,
  [
    body("identifier").trim().notEmpty().withMessage("Username or email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
