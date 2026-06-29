import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { getIO } from "../../lib/socketInstance.js";
import { callGeminiAI } from "../../lib/config/openAi.js";

// -------------------------------------
// Escalation Keywords (fallback safety)
// -------------------------------------
const ESCALATION_KEYWORDS = [
  "agent",
  "talk to agent",
  "real person",
  "human support",
  "escalate",
  "urgent",
  "frustrated",
  "angry",
  "upset",
  "mad",
  "furious",
  "annoyed",
  "disappointed",
  "payment",
  "refund",
  "wallet",
  "transaction",
  "scam",
  "fraud",
  "complaint"
];

// -------------------------------------
// Ticket Intelligence Engine
// -------------------------------------
function detectTicketIntent(message, aiReply = "") {
  const text = `${message} ${aiReply}`.toLowerCase();

  return {
    escalate:
      /agent|human|real person|urgent|complaint|fraud|scam|angry|refund issue|speak to support/.test(
        text
      ),

    resolve:
      /thank you|thanks that helps|issue resolved|problem solved|all good now|fixed|that worked/.test(
        text
      ),

    reopen:
      /still not working|issue again|not resolved|problem again|didn't help|same issue/.test(
        text
      ),

    close:
      /close ticket|end chat|that's all|no further help|goodbye/.test(text),

    pin:
      /urgent|fraud|scam|charge problem|payment issue|complaint/.test(text)
  };
}

// -------------------------------------
// Chat Service
// -------------------------------------
class ChatService {
  // ---------------------------
  // Create new support chat
  // ---------------------------
  static async createOrGetChat(userId, subject = "", description = "") {
    try {
      const initialText = (subject || description)
        ? `Subject: ${subject}\nDescription: ${description || "No description provided"}`
        : "Hello, I need help.";

      // Return existing open chat for this user if one exists
      const existing = await Chat.findOne({ participants: userId, type: "support", status: "open" });
      if (existing) return existing;

      const userMessage = {
        senderId: userId,
        senderType: "user",
        receiverId: "bot",
        message: initialText,
        status: "sent",
        createdAt: new Date(),
        relatedTo: "initial_ticket",
      };

      // Create the chat
      let chat = await Chat.create({
        participants: [userId],
        type: "support",
        status: "open",
        messages: [userMessage],
        escalated: false,
        pinned: false,
        verifiedUserId: userId,
        lastMessage: initialText,
        lastMessageAt: new Date(),
      });

      getIO()?.to(chat._id.toString()).emit("newMessage", userMessage);

      console.log(`Chat created: ${chat._id} | Generating automatic AI reply...`);

      // Generate AI reply
      let botReplyText;
      try {
        botReplyText = await callGeminiAI(initialText, chat._id.toString(), userId);
      } catch (aiErr) {
        console.error("Initial AI call failed:", aiErr);
        botReplyText = "I'm having a little trouble right now. Please try again shortly! 😔";
      }

      const botMessage = {
        senderId: "bot",
        senderType: "bot",
        receiverId: userId,
        message: botReplyText,
        relatedTo: "initial_ticket",
        status: "sent",
        createdAt: new Date(),
      };

      // Add bot message using atomic push
      chat = await Chat.findByIdAndUpdate(
        chat._id,
        {
          $push: { messages: botMessage },
          $set: {
            lastMessage: botReplyText,
            lastMessageAt: new Date(),
          }
        },
        { new: true }
      );

      // Ticket Intelligence
      const intent = detectTicketIntent(initialText, botReplyText);

      if (intent.escalate || ESCALATION_KEYWORDS.some(k => initialText.toLowerCase().includes(k))) {
        chat.escalated = true;
        chat.pinned = true;
      }
      if (intent.resolve) {
        chat.status = "resolved";
        chat.resolvedAt = new Date();
      }
      if (intent.pin) chat.pinned = true;

      await chat.save();

      // Emit bot reply
      getIO()?.to(chat._id.toString()).emit("newMessage", botMessage);

      console.log("✅ Automatic first bot reply added successfully");

      return chat;
    } catch (err) {
      console.error("createOrGetChat error:", err);
      throw err;
    }
  }
  // ---------------------------
  // Send Message - Atomic & Safe
  // ---------------------------
  static async sendMessage(chatId, senderId, message, receiverId = "bot") {
    try {
      const trimmedMessage = message.trim();
      if (!trimmedMessage) return;

      const senderType = senderId === "bot"
        ? "bot"
        : await User.findById(senderId)
            .lean()
            .then(u => u?.role === "admin" ? "admin" : "user");

      let chat = await Chat.findById(chatId);
      if (!chat) throw new Error("Chat not found");

      // ========================
      // STRONG DUPLICATE CHECK (Handles small differences)
      // ========================
      const normalizedMsg = trimmedMessage.toLowerCase().replace(/\s+/g, ' ').trim();

      const isDuplicate = chat.messages.some(m => {
        const normalizedExisting = m.message.toLowerCase().replace(/\s+/g, ' ').trim();
        return (
          m.senderId?.toString() === senderId?.toString() &&
          normalizedExisting === normalizedMsg &&
          Math.abs(new Date(m.createdAt).getTime() - Date.now()) < 20000   // 20 seconds window
        );
      });

      if (isDuplicate) {
        console.log(`[Duplicate blocked] "${trimmedMessage.substring(0, 60)}..."`);
        return chat;
      }

      // ========================
      // Add message
      // ========================
      const newMessage = {
        senderId,
        senderType,
        receiverId,
        message: trimmedMessage,
        status: "sent",
        createdAt: new Date(),
      };

      chat = await Chat.findByIdAndUpdate(
        chatId,
        { 
          $push: { messages: newMessage },
          $set: { lastMessage: trimmedMessage, lastMessageAt: new Date() }
        },
        { new: true }
      );

      getIO()?.to(chatId.toString()).emit("newMessage", newMessage);

      // ========================
      // AI Reply
      // ========================
      const adminHasResponded = chat.messages.some(m => m.senderType === "admin");
      const shouldTriggerAI = (senderType === "user" && receiverId === "bot" && !chat.assignedAdmin && !adminHasResponded);

      if (!shouldTriggerAI) return chat;

      if (chat.aiProcessing) {
        console.log("AI already processing - skipping");
        return chat;
      }

      await Chat.findByIdAndUpdate(chatId, { aiProcessing: true });

      try {
        const botReplyText = await callGeminiAI(trimmedMessage, chatId.toString(), senderId);

        const botMessage = {
          senderId: "bot",
          senderType: "bot",
          receiverId: senderId,
          message: botReplyText,
          relatedTo: trimmedMessage,
          status: "sent",
          createdAt: new Date(),
        };

        chat = await Chat.findByIdAndUpdate(
          chatId,
          {
            $push: { messages: botMessage },
            $set: {
              lastMessage: botReplyText,
              lastMessageAt: new Date(),
              aiProcessing: false
            }
          },
          { new: true }
        );

        // Ticket Intelligence
        const intent = detectTicketIntent(trimmedMessage, botReplyText);

        if (intent.escalate || ESCALATION_KEYWORDS.some(k => trimmedMessage.toLowerCase().includes(k))) {
          chat.escalated = true;
          chat.pinned = true;
        }
        if (intent.resolve && chat.status !== "resolved") {
          chat.status = "resolved";
          chat.resolvedAt = new Date();
        }
        if (intent.reopen && chat.status === "resolved") {
          chat.status = "open";
          chat.escalated = true;
        }
        if (intent.close) chat.status = "closed";
        if (intent.pin) chat.pinned = true;

        if (chat.verifiedUserId && chat.messages.length > 10) chat.pinned = true;

        await chat.save();

        getIO()?.to(chatId.toString()).emit("newMessage", botMessage);

      } catch (err) {
        console.error("AI reply error:", err);

        const fallback = {
          senderId: "bot",
          senderType: "bot",
          receiverId: senderId,
          message: "I'm having a little trouble right now. Please try again shortly! 😔",
          status: "sent",
          createdAt: new Date(),
        };

        await Chat.findByIdAndUpdate(chatId, {
          $push: { messages: fallback },
          $set: {
            aiProcessing: false,
            lastMessage: fallback.message,
            lastMessageAt: new Date()
          }
        });

        getIO()?.to(chatId.toString()).emit("newMessage", fallback);
      }

      return chat;
    } catch (err) {
      console.error("sendMessage error:", err);
      throw err;
    }
  }

  // ---------------------------
  // Get Chat Messages
  // ---------------------------
  static async getChatMessages(chatId, page = 1, limit = 30) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    const totalMessages = chat.messages.length;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      messages: chat.messages.slice(start, end),
      totalMessages,
      page,
      totalPages: Math.ceil(totalMessages / limit),
      hasMore: end < totalMessages
    };
  }

  // ---------------------------
  // Mark messages read
  // ---------------------------
  static async markMessagesRead(chatId) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    chat.messages.forEach((msg) => {
      if (msg.senderType === "user") msg.read = true;
    });

    await chat.save();
    return chat;
  }

  // ---------------------------
  // Admin: All Chats
  // ---------------------------
  static async getAllChatsForAdmin() {
    return Chat.find({ type: "support" })
      .populate("participants", "fullName email phoneNumber")
      .populate("assignedAdmin", "fullName email")
      .sort({
        status: 1,
        escalated: -1,
        pinned: -1,
        lastMessageAt: -1
      })
      .lean();
  }

  // ---------------------------
  // User Chats
  // ---------------------------
  static async getUserChat(userId) {
    return Chat.find({
      participants: userId,
      type: "support"
    })
      .sort({ lastMessageAt: -1 })
      .lean();
  }

  // ---------------------------
  // Resolve Chat
  // ---------------------------
  static async resolveChat(chatId, adminId) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    chat.status = "resolved";
    chat.resolvedBy = adminId;
    chat.resolvedAt = new Date();

    await chat.save();

    getIO()?.to(chatId).emit("chatResolved", { chatId });
    return chat;
  }

  // ---------------------------
  // Reopen Chat
  // ---------------------------
  static async reopenChat(chatId) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    chat.status = "open";
    chat.escalated = true;

    await chat.save();

    getIO()?.to(chatId).emit("chatReopened", { chatId });
    return chat;
  }

  // ---------------------------
  // Escalate Chat
  // ---------------------------
  static async escalateChat(chatId) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    chat.escalated = true;
    chat.pinned = true;

    await chat.save();

    getIO()?.emit("chatEscalated", chatId);
    return chat;
  }

  // ---------------------------
  // Pin Chat
  // ---------------------------
  static async pinChat(chatId, value) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");
  
    if (typeof value === "boolean") {
      chat.pinned = value;
    } else {
      chat.pinned = !chat.pinned; // toggle
    }
  
    await chat.save();
    return chat;
  }

  // ---------------------------
  // Assign Admin
  // ---------------------------
  static async assignAdmin(chatId, adminId) {
    console.log("🚨 adminId received:", adminId);
  
    const chat = await Chat.findById(chatId);
  
    chat.assignedAdmin = adminId;
  
    console.log("🚨 before save:", chat.assignedAdmin);
  
    await chat.save();
  
    const updated = await Chat.findById(chatId);
  
    console.log("🚨 after save:", updated.assignedAdmin);
  
    return updated;
  }
}

export default ChatService;