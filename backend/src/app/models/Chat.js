import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    senderType: { 
      type: String, 
      enum: ["user", "admin", "bot"], 
      default: "user" 
    },

    receiverId: { type: String, required: true },

    message: { type: String, required: true },

    // Prevent bot duplicate replies
    relatedTo: { type: String, default: null },

    status: { 
      type: String, 
      enum: ["sent", "delivered", "read"], 
      default: "sent" 
    },

    read: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const ChatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    type: { 
      type: String, 
      enum: ["normal", "support", "group"], 
      default: "normal" 
    },

    // Support system status
    status: {
      type: String,
      enum: ["open", "assigned", "resolved", "closed"],
      default: "open"
    },

    escalated: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },

    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    resolvedAt: { type: Date, default: null },

    lastMessage: String,
    lastMessageAt: Date,

    messages: [ChatMessageSchema],

    verifiedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

// Helpful indexes for admin dashboard
ChatSchema.index({ type: 1, status: 1 });
ChatSchema.index({ escalated: 1 });
ChatSchema.index({ pinned: 1 });
ChatSchema.index({ lastMessageAt: -1 });

export default mongoose.model("Chat", ChatSchema);