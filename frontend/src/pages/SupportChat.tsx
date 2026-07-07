"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeftIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
  FaceSmileIcon,
  PhotoIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircle,
  Loader2,
  MessageSquare,
  Search,
  Package,
  RotateCcw,
  Truck,
  CreditCard,
  BookOpen,
  LifeBuoy,
  UserCircle,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Send,
} from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import { useAuth } from "../context/authContext";

const API_BASE = "https://britbooks-api-production-8ebd.up.railway.app/api/chat";

type View = "inbox" | "newticket" | "chat";

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type MsgCategory = {
  label: string; icon: React.ReactNode;
  bg: string; text: string; border: string; dot: string;
  actions?: { label: string; href: string }[];
};

function detectCategory(msg: string): MsgCategory {
  const t = msg.toLowerCase();
  if (t.includes("order") || t.includes("track") || t.includes("purchase"))
    return { label: "Order Support", icon: <Package className="w-3.5 h-3.5" />, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", dot: "bg-blue-500", actions: [{ label: "View My Orders", href: "/orders" }] };
  if (t.includes("return") || t.includes("refund") || t.includes("exchange"))
    return { label: "Returns & Refunds", icon: <RotateCcw className="w-3.5 h-3.5" />, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", dot: "bg-orange-500", actions: [{ label: "Return Policy", href: "/return-policy" }] };
  if (t.includes("deliver") || t.includes("ship") || t.includes("dispatch"))
    return { label: "Shipping & Delivery", icon: <Truck className="w-3.5 h-3.5" />, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500", actions: [{ label: "Shipping Info", href: "/shipping-returns" }] };
  if (t.includes("payment") || t.includes("pay") || t.includes("card") || t.includes("billing"))
    return { label: "Payment & Billing", icon: <CreditCard className="w-3.5 h-3.5" />, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", dot: "bg-purple-500", actions: [{ label: "My Invoices", href: "/invoices" }] };
  if (t.includes("account") || t.includes("password") || t.includes("login"))
    return { label: "Account & Security", icon: <UserCircle className="w-3.5 h-3.5" />, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500", actions: [{ label: "Account Settings", href: "/settings" }] };
  if (t.includes("book") || t.includes("isbn") || t.includes("author"))
    return { label: "Books & Products", icon: <BookOpen className="w-3.5 h-3.5" />, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500", actions: [{ label: "Explore Books", href: "/explore" }] };
  if (t.includes("privacy") || t.includes("data") || t.includes("gdpr"))
    return { label: "Privacy & Security", icon: <ShieldCheck className="w-3.5 h-3.5" />, bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-100", dot: "bg-teal-500", actions: [{ label: "Privacy Policy", href: "/privacy-policy" }] };
  return { label: "Support", icon: <LifeBuoy className="w-3.5 h-3.5" />, bg: "bg-red-50", text: "text-red-700", border: "border-red-100", dot: "bg-red-500" };
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-gray-900">{p}</strong> : p);
}

function StreamingBotMessage({ text }: { text: string }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-red-100 bg-white" style={{ maxWidth: "88%" }}>
      <div className="flex items-center gap-2 px-3.5 py-2 bg-red-50 border-b border-red-100">
        <LifeBuoy className="w-3.5 h-3.5 text-red-700" />
        <span className="text-[11px] font-black text-red-700">Alex is typing</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-gray-400">Alex</span>
        </div>
      </div>
      <div className="bg-white px-4 py-3">
        {text ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {renderBold(text)}
            <span className="inline-block w-1.5 h-4 align-[-2px] ml-0.5 bg-red-500 animate-pulse" />
          </p>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: "120ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: "240ms" }} />
          </div>
        )}
      </div>
    </div>
  );
}

function SmartBotMessage({ message, time }: { message: string; time: string }) {
  const cat = detectCategory(message);
  const lines = message.split("\n").filter((l) => l.trim());
  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border ${cat.border}`} style={{ maxWidth: "88%" }}>
      <div className={`flex items-center gap-2 px-3.5 py-2 ${cat.bg} border-b ${cat.border}`}>
        <div className={cat.text}>{cat.icon}</div>
        <span className={`text-[11px] font-black ${cat.text}`}>{cat.label}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-gray-400">Alex</span>
        </div>
      </div>
      <div className="bg-white px-4 pt-3 pb-2.5 space-y-1.5">
        {lines.map((line, i) => {
          const bullet = line.match(/^[•\-*]\s+(.+)/);
          const num = line.match(/^(\d+)[.)]\s+(.+)/);
          if (num) return (
            <div key={i} className="flex gap-2.5 items-start">
              <span className={`w-5 h-5 rounded-full ${cat.bg} ${cat.text} text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5`}>{num[1]}</span>
              <p className="text-sm text-gray-700 leading-relaxed">{renderBold(num[2])}</p>
            </div>
          );
          if (bullet) return (
            <div key={i} className="flex gap-2.5 items-start">
              <div className={`w-1.5 h-1.5 rounded-full ${cat.dot} mt-[7px] shrink-0`} />
              <p className="text-sm text-gray-700 leading-relaxed">{renderBold(bullet[1])}</p>
            </div>
          );
          return <p key={i} className="text-sm text-gray-700 leading-relaxed">{renderBold(line)}</p>;
        })}
      </div>
      {cat.actions && cat.actions.length > 0 && (
        <div className={`px-4 py-2 ${cat.bg} border-t ${cat.border} flex flex-wrap gap-3`}>
          {cat.actions.map((a, i) => (
            <a key={i} href={a.href} className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${cat.text} hover:underline`}>
              <ExternalLink className="w-3 h-3" />{a.label}
            </a>
          ))}
        </div>
      )}
      <div className="bg-white px-4 py-2 flex items-center justify-between border-t border-gray-50">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] text-emerald-600 font-semibold">BritBooks AI</span>
        </div>
        <span className="text-[10px] text-gray-400">{time}</span>
      </div>
    </div>
  );
}

// ── Dot-pattern background (WhatsApp style) ──────────────────────────────────
const chatBg: React.CSSProperties = {
  backgroundColor: "#efeae2",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8bfb0' fill-opacity='0.25'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='20' r='2'/%3E%3Ccircle cx='100' cy='20' r='2'/%3E%3Ccircle cx='140' cy='20' r='2'/%3E%3Ccircle cx='180' cy='20' r='2'/%3E%3Ccircle cx='220' cy='20' r='2'/%3E%3Ccircle cx='260' cy='20' r='2'/%3E%3Ccircle cx='300' cy='20' r='2'/%3E%3Ccircle cx='340' cy='20' r='2'/%3E%3Ccircle cx='380' cy='20' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SupportChatPage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const userId = auth.user?.userId ?? auth.userId;
  const token = auth.token ?? undefined;
  const authLoading = auth.loading;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [view, setView] = useState<View>("inbox");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "" });
  const [input, setInput] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const loadThreads = useCallback(async () => {
    if (!userId) return;
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const res = await axios.get(`${API_BASE}/user/${userId}`);
      console.log("[SupportChat] threads response:", res.data);
      // API returns { success, total, data: [...chats] }
      const raw = res.data?.data ?? res.data?.threads ?? res.data ?? [];
      setThreads(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      console.error("[SupportChat] loadThreads error:", err?.response?.data ?? err?.message);
      setThreadsError("Could not load conversations");
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  }, [userId]);

  // Load threads whenever userId becomes available
  useEffect(() => {
    if (userId) loadThreads();
  }, [userId, loadThreads]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const openThread = async (id: string) => {
    setLoading(true);
    setChatId(id);
    setActiveThreadId(id);
    setView("chat");
    try {
      const res = await axios.get(`${API_BASE}/${id}/messages`, { headers });
      // API returns { messages: [...], totalMessages, page, ... }
      const msgs = res.data?.messages ?? res.data ?? [];
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch { toast.error("Could not load messages"); }
    finally { setLoading(false); }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Please log in first");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/create`, { userId, ...form }, { headers });
      const newId = res.data._id;
      setChatId(newId);
      setActiveThreadId(newId);
      setMessages(res.data.messages || []);
      setView("chat");
      loadThreads();
    } catch { toast.error("Failed to create ticket"); }
    finally { setLoading(false); }
  };

  const send = async () => {
    if (!input.trim() || !chatId) return;
    const msg = input.trim();
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const tempUserId = `temp_user_${Date.now()}`;
    const tempBotId = `temp_bot_${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { _id: tempUserId, senderId: userId, message: msg, createdAt: new Date().toISOString(), status: "sending" },
      { _id: tempBotId, senderId: "bot", senderType: "bot", message: "", createdAt: new Date().toISOString(), status: "streaming" },
    ]);

    try {
      const res = await fetch(`${API_BASE}/send-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ chatId, senderId: userId, message: msg }),
      });
      if (!res.ok || !res.body) throw new Error("stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let event: string | null = null;
      let botText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          event = null;
          let dataStr = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event: ")) event = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataStr += line.slice(6);
          }
          if (!dataStr) continue;
          let data: any;
          try { data = JSON.parse(dataStr); } catch { continue; }

          if (event === "user" && data.message) {
            setMessages(prev => prev.map(m => m._id === tempUserId ? { ...data.message, _id: tempUserId } : m));
          } else if (event === "chunk" && typeof data.text === "string") {
            botText += data.text;
            setMessages(prev => prev.map(m => m._id === tempBotId ? { ...m, message: botText } : m));
          } else if (event === "done" && Array.isArray(data.messages)) {
            setMessages(data.messages);
          } else if (event === "error") {
            throw new Error(data.message || "stream error");
          }
        }
      }
    } catch {
      toast.error("Failed to send");
      setMessages(prev => prev.filter(m => m._id !== tempUserId && m._id !== tempBotId));
      setInput(msg);
    }
  };

  const filteredThreads = threads.filter((t: any) => {
    if (!threadSearch) return true;
    const q = threadSearch.toLowerCase();
    const firstMsg = (t.messages?.[0]?.message || "").toLowerCase();
    const last = (t.lastMessage || "").toLowerCase();
    return firstMsg.includes(q) || last.includes(q);
  });

  const startNewTicket = () => {
    setForm({ subject: "", description: "" });
    setChatId(null);
    setActiveThreadId(null);
    setMessages([]);
    setView("newticket");
  };

  const goInbox = () => {
    setView("inbox");
    setChatId(null);
    setMessages([]);
  };

  // ── LEFT SIDEBAR ─────────────────────────────────────────────────────────
  const LeftSidebar = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Sidebar header */}
      <div className="bg-red-600 px-4 py-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate("/help")}
            className="p-2 -ml-1 rounded-xl hover:bg-white/20 transition-colors hidden sm:block"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={startNewTicket}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors ml-auto"
          >
            <PlusIcon className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 ring-2 ring-white/25 flex items-center justify-center text-sm font-black text-white shrink-0">
            BB
          </div>
          <div>
            <p className="text-white font-black text-lg leading-tight">Support</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-semibold">Online · replies in minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5 bg-gray-100 rounded-2xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={threadSearch}
            onChange={e => setThreadSearch(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
        {/* Not logged in */}
        {!authLoading && !userId ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 mb-1">You're not logged in</p>
              <p className="text-xs text-gray-400">Please log in to view your conversations.</p>
            </div>
            <button onClick={() => navigate("/login")}
              className="px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-2xl hover:bg-red-700 transition-colors">
              Log in
            </button>
          </div>
        ) : threadsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
          </div>
        ) : threadsError ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-3">
            <p className="text-sm text-red-500 font-medium">{threadsError}</p>
            <button onClick={loadThreads} className="text-xs text-red-600 underline">Try again</button>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 mb-1">No conversations yet</p>
              <p className="text-xs text-gray-400">Start a chat and our team will reply promptly.</p>
            </div>
            <button
              onClick={startNewTicket}
              className="mt-1 px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-2xl hover:bg-red-700 transition-colors"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredThreads.map((t: any) => (
              <button
                key={t._id}
                onClick={() => openThread(t._id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-4 hover:bg-gray-100 transition-colors ${
                  activeThreadId === t._id ? "bg-red-50 border-r-2 border-red-600" : "bg-white"
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm">
                  BB
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-sm font-bold text-gray-900 truncate pr-2">
                      {/* First message often starts with "Subject: ..." — strip the prefix */}
                      {(() => {
                        const first = t.messages?.[0]?.message || "";
                        const line = first.split("\n")[0].replace(/^Subject:\s*/i, "").trim();
                        return line || "Support Request";
                      })()}
                    </p>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {fmtDate(t.lastMessageAt || t.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {t.lastMessage || "No messages yet"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 shrink-0">
        <button
          onClick={startNewTicket}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0a1628] hover:bg-red-600 text-white text-sm font-bold tracking-wide transition-colors"
        >
          <PlusIcon className="w-4 h-4" /> New conversation
        </button>
      </div>
    </div>
  );

  // ── CHAT PANEL ────────────────────────────────────────────────────────────
  const ChatPanel = () => (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-[#0a1628] px-4 py-3 shrink-0 flex items-center gap-3 border-b border-white/10">
        {/* Back button — mobile only */}
        <button
          onClick={goInbox}
          className="sm:hidden p-2 -ml-1 rounded-xl hover:bg-white/10 transition-colors shrink-0"
        >
          <ChevronLeftIcon className="w-5 h-5 text-white" />
        </button>
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-red-600 ring-2 ring-red-400/40 flex items-center justify-center text-xs font-black text-white">
            BB
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a1628]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">BritBooks Support</p>
          <p className="text-emerald-400 text-[10px] font-semibold">Online now · Alex is here to help</p>
        </div>
        <button
          onClick={startNewTicket}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          title="New conversation"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={chatBg}>
        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center pt-6">
            <div className="bg-[#fffde7] border border-yellow-100 rounded-2xl px-5 py-3 text-xs text-yellow-700 shadow-sm text-center max-w-[80%]">
              Messages are end-to-end encrypted. No one outside this chat can read them.
            </div>
          </div>
        ) : (
          messages.map((msg: any, i: number) => {
            const sId = msg.senderId?._id ?? msg.senderId;
            const isMe = String(sId) === String(userId);
            const isSending = msg.status === "sending";
            const hasAgentReplyAfter = messages.slice(i + 1).some((m: any) => {
              const sid = m.senderId?._id ?? m.senderId;
              return String(sid) !== String(userId);
            });
            return (
              <motion.div
                key={msg._id ?? i}
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.16 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white text-[9px] font-black flex items-center justify-center shrink-0 mb-1 shadow-sm">
                    BB
                  </div>
                )}
                {isMe ? (
                  <div className="flex flex-col items-end max-w-[78%]">
                    <div className="px-4 py-2.5 text-sm leading-relaxed shadow-sm bg-[#d9fdd3] text-gray-800 rounded-tl-2xl rounded-tr-md rounded-bl-2xl rounded-br-2xl">
                      {msg.message}
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <span className="text-[10px] text-gray-400">{fmtDate(msg.createdAt)}</span>
                        {isSending
                          ? <span className="text-[10px] text-gray-400">●</span>
                          : <span className={`text-[11px] ${hasAgentReplyAfter ? "text-blue-500" : "text-gray-400"}`}>✓✓</span>
                        }
                      </div>
                    </div>
                  </div>
                ) : msg.status === "streaming" ? (
                  <StreamingBotMessage text={msg.message} />
                ) : (
                  <SmartBotMessage message={msg.message} time={fmtDate(msg.createdAt)} />
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input bar */}
      <div
        className="bg-[#f0f2f5] border-t border-gray-200 px-3 py-3 shrink-0"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-end gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors shrink-0">
            <FaceSmileIcon className="w-6 h-6" />
          </button>
          <label htmlFor="chat-photo" className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors shrink-0">
            <PhotoIcon className="w-6 h-6" />
            <input id="chat-photo" type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) toast("Photo sharing coming soon", { icon: "📷" }); }} />
          </label>
          <div className="flex-1 bg-white rounded-2xl px-4 py-2.5 flex items-end shadow-sm border border-gray-100 min-w-0">
            <textarea
              ref={taRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if (taRef.current) {
                  taRef.current.style.height = "auto";
                  taRef.current.style.height = Math.min(taRef.current.scrollHeight, 100) + "px";
                }
              }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message…"
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 resize-none py-0.5 max-h-[100px] w-full leading-relaxed"
              rows={1}
            />
          </div>
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-md shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── NEW TICKET PANEL ─────────────────────────────────────────────────────
  const NewTicketPanel = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#0a1628] px-4 py-4 shrink-0 flex items-center gap-3 border-b border-white/10">
        <button
          onClick={goInbox}
          className="sm:hidden p-2 -ml-1 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-white" />
        </button>
        <div>
          <p className="text-white font-black text-base leading-tight">New conversation</p>
          <p className="text-white/50 text-xs mt-0.5">Describe your issue and we'll get back to you</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5 min-h-0">
        <form onSubmit={createTicket} className="flex flex-col gap-4 max-w-xl">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">What can we help with?</p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Subject</label>
              <input
                required
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Order Issue, Account Help"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Details</label>
              <textarea
                required
                rows={6}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your issue in as much detail as possible…"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><PaperAirplaneIcon className="w-4 h-4" /> Send Message</>
            }
          </button>
        </form>
      </div>
    </div>
  );

  // ── DESKTOP WELCOME (right panel when no chat open) ──────────────────────
  const WelcomePanel = () => (
    <div className="flex-1 flex flex-col items-center justify-center h-full gap-5 text-center px-8" style={chatBg}>
      <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center">
        <MessageSquare className="w-9 h-9 text-red-600" />
      </div>
      <div>
        <h2 className="text-xl font-black text-gray-800 mb-2">How can we help?</h2>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          Select a conversation on the left, or start a new one and our team will reply promptly.
        </p>
      </div>
      <button
        onClick={startNewTicket}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl transition-colors shadow-md"
      >
        <PlusIcon className="w-4 h-4" /> New conversation
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col font-sans" style={{ height: "100dvh" }}>
      <Toaster position="top-center" />
      <TopBar />

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── LEFT SIDEBAR ── show on desktop always; on mobile only in inbox */}
        <div className={`
          flex-col border-r border-gray-200
          w-full sm:w-80 lg:w-96 shrink-0
          ${view !== "inbox" ? "hidden sm:flex" : "flex"}
        `}>
          <LeftSidebar />
        </div>

        {/* ── RIGHT PANEL ── show on desktop always; on mobile only when not inbox */}
        <div className={`
          flex-1 min-w-0
          ${view === "inbox" ? "hidden sm:flex" : "flex"}
          flex-col
        `}>
          {view === "chat"      && <ChatPanel />}
          {view === "newticket" && <NewTicketPanel />}
          {view === "inbox"     && <WelcomePanel />}
        </div>

      </div>
    </div>
  );
}
