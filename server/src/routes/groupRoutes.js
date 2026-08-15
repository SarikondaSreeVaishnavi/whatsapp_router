import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listMyGroups, createGroup, toggleMute, addMember } from "../controllers/groupController.js";

const router = Router();

router.use(requireAuth);
router.get("/", listMyGroups);
router.post("/", createGroup);
router.post("/:id/mute", toggleMute);
router.post("/:id/members", addMember);

export default router;
