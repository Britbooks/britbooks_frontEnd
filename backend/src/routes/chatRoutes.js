import express from "express";
import {
  createOrGetChat,
  sendMessage,
  getChatMessages,
  markMessagesRead,
  getAllChatsForAdmin,
  getUserChat,
  resolveChat,
  reopenChat,
  escalateChat,
  pinChat,
  assignAdmin
} from "../app/controllers/chatController.js";
import authMiddleware from "../app/middleware/authMiddleware.js";
import verifyTokenMiddleware from "../app/middleware/verifyTokenMiddleware.js";

const router = express.Router();

// Create or get chat thread
router.post("/create", createOrGetChat);

// Send message
router.post("/send", sendMessage);

// Get messages with pagination
router.get("/:chatId/messages", getChatMessages);

// Mark messages as read
router.post("/read", markMessagesRead);

// Admin: get all chats (auth required)
router.get("/", verifyTokenMiddleware, authMiddleware, getAllChatsForAdmin);

// User: get their chat
router.get("/user/:userId", getUserChat);

router.post("/resolve", verifyTokenMiddleware, authMiddleware, resolveChat);
router.post("/reopen", verifyTokenMiddleware, authMiddleware, reopenChat);
router.post("/escalate", verifyTokenMiddleware, authMiddleware, escalateChat);
router.post("/pin", verifyTokenMiddleware, authMiddleware, pinChat);
router.post("/assign", verifyTokenMiddleware, authMiddleware, assignAdmin);



export default router;
