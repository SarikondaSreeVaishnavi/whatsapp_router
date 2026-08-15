import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import {
  sendMessage, getConversation, listConversations, getInbox,
  markOpened, markDismissed, markReported,
} from "../controllers/messageController.js";

const router = Router();

router.use(requireAuth);
router.post("/", upload.single("media"), sendMessage);
router.get("/conversation", getConversation);
router.get("/conversations", listConversations);
router.get("/inbox", getInbox);
router.post("/:messageId/open", markOpened);
router.post("/:messageId/dismiss", markDismissed);
router.post("/:messageId/report", markReported);

export default router;
