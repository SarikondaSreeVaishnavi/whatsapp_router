import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchUsers, updateProfile } from "../controllers/userController.js";

const router = Router();

router.use(requireAuth);
router.get("/search", searchUsers);
router.patch("/me", updateProfile);

export default router;
