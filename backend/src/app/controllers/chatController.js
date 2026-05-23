import ChatService from "../services/chatService.js";

// ---------------------------
// Create or get chat thread
// ---------------------------
export const createOrGetChat = async (req, res) => {
  try {
    const { userId, subject, description } = req.body;

    if (!userId || !subject || !description) {
      return res.status(400).json({ error: "userId, subject, and description are required" });
    }

    const chat = await ChatService.createOrGetChat(userId, subject, description);

    res.json(chat);
  } catch (err) {
    console.error("❌ createOrGetChat error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------
// Send message
// ---------------------------
export const sendMessage = async (req, res) => {
  try {
    const { chatId, senderId, message } = req.body;
    if (!chatId || !senderId || !message) {
      return res.status(400).json({ error: "chatId, senderId, and message are required" });
    }

    const chat = await ChatService.sendMessage(chatId, senderId, message);
    res.json(chat);
  } catch (err) {
    console.error("❌ sendMessage error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------
// Get chat messages with pagination
// ---------------------------
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    const messagesData = await ChatService.getChatMessages(chatId, page, limit);
    res.json(messagesData);
  } catch (err) {
    console.error("❌ getChatMessages error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------
// Mark messages as read
// ---------------------------
export const markMessagesRead = async (req, res) => {
  try {
    const { chatId, adminId } = req.body;
    if (!chatId || !adminId) return res.status(400).json({ error: "chatId and adminId required" });

    const chat = await ChatService.markMessagesRead(chatId, adminId);
    res.json(chat);
  } catch (err) {
    console.error("❌ markMessagesRead error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------
// Admin: get all chats
// ---------------------------
export const getAllChatsForAdmin = async (req, res) => {
  try {
    const chats = await ChatService.getAllChatsForAdmin();
    res.json(chats);
  } catch (err) {
    console.error("❌ getAllChatsForAdmin error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------
// User: get their chat
// ---------------------------
export const getUserChat = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const chats = await ChatService.getUserChat(userId);

    res.json({
      success: true,
      total: chats.length,
      data: chats,
    });
  } catch (err) {
    console.error("❌ getUserChat error:", err);
    res.status(500).json({ error: err.message });
  }


};

export const resolveChat = async (req, res) => {
  try {
    const { chatId } = req.body;
    const adminId = req.user._id; // from token

    // 🔒 Allow only admins
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admins only.",
      });
    }

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: "chatId required",
      });
    }

    const chat = await ChatService.resolveChat(chatId, adminId);

    res.json({
      success: true,
      message: "Chat resolved successfully",
      data: chat,
    });
  } catch (err) {
    console.error("❌ resolveChat error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const reopenChat = async (req, res) => {
  try {
    const { chatId } = req.body;
    const adminId = req.user._id;

    // 🔒 Only admins can reopen
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Access denied. Admins only." });
    }

    if (!chatId) {
      return res.status(400).json({ success: false, error: "chatId required" });
    }

    const chat = await ChatService.reopenChat(chatId, adminId);

    res.json({
      success: true,
      message: "Chat reopened successfully",
      data: chat,
    });
  } catch (err) {
    console.error("❌ reopenChat error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
export const escalateChat = async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: "chatId required"
      });
    }

    const chat = await ChatService.escalateChat(chatId);

    res.json({
      success: true,
      message: "Chat escalated",
      data: chat
    });
  } catch (err) {
    console.error("❌ escalateChat error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const pinChat = async (req, res) => {
  try {
    const { chatId, value } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: "chatId required",
      });
    }

    const chat = await ChatService.pinChat(chatId, value);

    res.json({
      success: true,
      message: value ? "Chat pinned" : "Chat unpinned",
      data: chat,
    });
  } catch (err) {
    console.error("❌ pinChat error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const assignAdmin = async (req, res) => {
  try {
    const { chatId } = req.body;
    const adminId = req.user.userId;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: "chatId required",
      });
    }

    const chat = await ChatService.assignAdmin(chatId, adminId);

    res.json({
      success: true,
      message: "Admin assigned",
      data: chat,
    });
  } catch (err) {
    console.error("❌ assignAdmin error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};