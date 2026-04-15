"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Send,
  Zap,
  Globe,
  Users,
  Award,
} from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import Footer from "../components/footer";
import TopBar from "../components/Topbar";
import { useAuth } from "../context/authContext";

const API_BASE = "https://britbooks-api-production-8ebd.up.railway.app/api/chat";
const PER_PAGE = 5;
const VIDEO_SRC =
  "https://media.istockphoto.com/id/1919183911/video/chatbot-ai-online-assistant-support-symbol-loop-digital-concept.mp4?s=mp4-640x640-is&k=20&c=Y1twA0JDp3uAQPe0Ap5RH3aZTi3yNwy5ThqSZdm5QXM=";

type View = "inbox" | "newticket" | "chat";

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ────────────────────────────────────────────────────────────────
   CHAT WIDGET
──────────────────────────────────────────────────────────────── */
interface SharedChatState {
  view: View;
  chatId: string | null;
  messages: any[];
  threads: any[];
  page: number;
  form: { subject: string; description: string };
  loading: boolean;
}

interface ChatWidgetProps {
  userId?: string;
  token?: string;
  onClose?: () => void;
  newChatTrigger?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  // Shared state (lifted to parent so panel + expanded stay in sync)
  shared: SharedChatState;
  onSharedChange: (s: Partial<SharedChatState>) => void;
}

function ChatWidget({ userId, token, onClose, newChatTrigger = 0, expanded = false, onToggleExpand, shared, onSharedChange }: ChatWidgetProps) {
  const { view, chatId, messages, threads, page, form, loading } = shared;
  const setView = (v: View) => onSharedChange({ view: v });
  const setChatId = (id: string | null) => onSharedChange({ chatId: id });
  const setMessages = (msgs: any[]) => onSharedChange({ messages: msgs });
  const setThreads = (t: any[]) => onSharedChange({ threads: t });
  const setPage = (p: number) => onSharedChange({ page: p });
  const setForm = (f: { subject: string; description: string }) => onSharedChange({ form: f });
  const setLoading = (l: boolean) => onSharedChange({ loading: l });

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const headers = { Authorization: `Bearer ${token}` };
  const totalPages = Math.ceil(threads.length / PER_PAGE);
  const visible = threads.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const loadThreads = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/user/${userId}`, { headers });
      const d = res.data?.data || res.data?.threads || res.data || [];
      setThreads(Array.isArray(d) ? d : []);
    } catch { setThreads([]); }
  }, [userId, token]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  useEffect(() => {
    if (newChatTrigger > 0) {
      setView("newticket");
      setForm({ subject: "", description: "" });
      setChatId(null);
      setMessages([]);
    }
  }, [newChatTrigger]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const openThread = async (id: string) => {
    setLoading(true); setChatId(id); setView("chat");
    try {
      const res = await axios.get(`${API_BASE}/${id}/messages`, { headers });
      const msgs = res.data?.messages || res.data || [];
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch { toast.error("Could not load messages"); }
    finally { setLoading(false); }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Please log in");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/create`, { userId, ...form }, { headers });
      setChatId(res.data._id); setMessages(res.data.messages || []);
      setView("chat"); loadThreads();
    } catch { toast.error("Failed to create ticket"); }
    finally { setLoading(false); }
  };

  const send = async () => {
    if (!input.trim() || !chatId) return;
    const msg = input;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    // Optimistic: show message immediately as "sending"
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      _id: tempId, senderId: userId, message: msg,
      createdAt: new Date().toISOString(), status: "sending",
    };
    setMessages([...messages, optimistic]);

    try {
      const res = await axios.post(`${API_BASE}/send`, { chatId, senderId: userId, message: msg }, { headers });
      // Replace with server messages (includes agent reply if any)
      setMessages(res.data.messages || []);
      setTyping(false);
    } catch {
      toast.error("Failed to send");
      // Remove optimistic message on failure and restore input
      setMessages(messages.filter((m: any) => m._id !== tempId));
      setInput(msg);
    }
  };

  const resize = () => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 96) + "px";
  };

  /* INBOX */
  if (view === "inbox") return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-5 shrink-0 bg-gradient-to-br from-red-600 to-red-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-xs font-black text-white">BB</div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-red-700" />
            </div>
            <div>
              <p className="text-[10px] text-red-200 font-bold tracking-widest uppercase">BritBooks Support</p>
              <p className="text-base font-bold text-white leading-none">Customer Care</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-400/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-300">Online</span>
            </div>
            {onToggleExpand && (
              <button onClick={onToggleExpand} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title={expanded ? "Collapse" : "Expand"}>
                {expanded ? <ArrowsPointingInIcon className="w-4 h-4 text-white/70" /> : <ArrowsPointingOutIcon className="w-4 h-4 text-white/70" />}
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <XMarkIcon className="w-4 h-4 text-white/70" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-red-100/80 leading-relaxed">How can we help you today?</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white border border-gray-100 shadow flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a conversation and we'll reply promptly.</p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-1.5">
            {visible.map((t) => (
              <button key={t._id} onClick={() => openThread(t._id)}
                className="w-full text-left p-4 bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all group flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-red-600 transition-colors">{t.subject || t.title || t.topic || "New conversation"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.createdAt ? fmtDate(t.createdAt) : "Active"}</p>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`rounded-full transition-all duration-200 ${i === page ? "w-5 h-1.5 bg-red-500" : "w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <button onClick={() => setView("newticket")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-sm font-bold tracking-wide transition-all duration-200">
          <PlusIcon className="w-4 h-4" /> New conversation
        </button>
      </div>
    </div>
  );

  /* NEW TICKET */
  if (view === "newticket") return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-5 shrink-0 bg-gradient-to-br from-red-600 to-red-800 flex items-center gap-3">
        <button onClick={() => setView("inbox")} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 text-white" />
        </button>
        <p className="text-sm font-bold text-white flex-1">New conversation</p>
        {onToggleExpand && (
          <button onClick={onToggleExpand} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            {expanded ? <ArrowsPointingInIcon className="w-4 h-4 text-white/70" /> : <ArrowsPointingOutIcon className="w-4 h-4 text-white/70" />}
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <XMarkIcon className="w-4 h-4 text-white/70" />
          </button>
        )}
      </div>
      <form onSubmit={createTicket} className="flex flex-col flex-1 p-5 gap-4 bg-gray-50 overflow-y-auto">
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Subject</label>
          <input required placeholder="e.g. Order Issue, Account Help"
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
            value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div className="flex-1 flex flex-col min-h-[120px]">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Details</label>
          <textarea required placeholder="Describe your issue in detail"
            className="flex-1 px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 resize-none transition-all"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-wide transition-all shadow-sm disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send message</>}
        </button>
      </form>
    </div>
  );

  /* CHAT */
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 shrink-0 bg-gradient-to-br from-red-600 to-red-800 flex items-center gap-3">
        <button onClick={() => { setView("inbox"); setChatId(null); setMessages([]); }}
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 text-white" />
        </button>
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-xs font-black text-white">BB</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-red-800" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-tight">BritBooks Support</p>
          <p className="text-[10px] text-emerald-300 font-semibold">Online now</p>
        </div>
        <button onClick={() => { setView("newticket"); setChatId(null); setMessages([]); setForm({ subject: "", description: "" }); }}
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
          <PlusIcon className="w-4 h-4 text-white" />
        </button>
        {onToggleExpand && (
          <button onClick={onToggleExpand} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title={expanded ? "Collapse" : "Expand"}>
            {expanded ? <ArrowsPointingInIcon className="w-4 h-4 text-white/70" /> : <ArrowsPointingOutIcon className="w-4 h-4 text-white/70" />}
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <XMarkIcon className="w-4 h-4 text-white/70" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-2 bg-gray-50">
        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No messages yet</div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === userId;
            const isSending = msg.status === "sending";
            // A message is "read" if the agent replied after it
            const hasAgentReplyAfter = messages.slice(i + 1).some((m: any) => m.senderId !== userId);
            return (
              <motion.div key={msg._id ?? i}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white text-[9px] font-black flex items-center justify-center shrink-0">BB</div>
                )}
                <div className={`max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                    ? "bg-red-600 text-white rounded-br-sm shadow-sm shadow-red-200"
                    : "bg-white text-gray-700 border border-gray-100 rounded-bl-sm shadow-sm"}`}>
                    {msg.message}
                  </div>
                  {isMe && (
                    <div className={`flex items-center gap-1 mt-1 ${isSending ? "opacity-50" : "opacity-100"}`}>
                      <span className="text-[10px] text-gray-400">
                        {msg.createdAt ? fmtDate(msg.createdAt) : ""}
                      </span>
                      {/* Ticks */}
                      {isSending ? (
                        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 11" fill="none">
                          <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg className={`w-4.5 h-3.5 ${hasAgentReplyAfter ? "text-blue-500" : "text-gray-400"}`} style={{ width: 18, height: 14 }} viewBox="0 0 22 11" fill="none">
                          <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 5.5L11 9.5L19 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white text-[9px] font-black flex items-center justify-center shrink-0">BB</div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 shadow-sm">
              {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <textarea ref={taRef} rows={1} value={input}
            onChange={e => { setInput(e.target.value); resize(); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Write a message"
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 resize-none py-0.5"
            style={{ maxHeight: 96 }} />
          <button onClick={send} disabled={!input.trim()}
            className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-30 transition-all shrink-0 mb-0.5">
            <PaperAirplaneIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   FAQ
──────────────────────────────────────────────────────────────── */
const faqs = [
  { q: "How do I track my order?", a: "Track your order from the My Orders section in your account dashboard with real-time status updates." },
  { q: "What is your return policy?", a: "We accept returns within 30 days of receipt, provided the book is in its original condition with no marks or damage." },
  { q: "How do I sell my books on BritBooks?", a: "Navigate to Sell Books, enter the ISBN and receive an instant valuation. We collect from your door at no charge." },
  { q: "What payment methods do you accept?", a: "Visa, Mastercard, American Express, and PayPal. All transactions are protected by 256-bit SSL encryption." },
  { q: "How long does delivery take?", a: "Standard delivery takes 2 to 4 working days. Express next-day delivery is available at checkout." },
  { q: "Do you offer business or bulk accounts?", a: "Yes. We offer dedicated account managers, volume pricing, and priority support for business customers. Contact our team to learn more." },
];

function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: i * 0.04 }}
      className={`border-b border-gray-100 last:border-0 transition-all`}
    >
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-5 text-left py-5 group">
        <span className={`text-xs font-black tabular-nums transition-colors shrink-0 ${open ? "text-red-600" : "text-gray-300 group-hover:text-red-400"}`}>
          {String(i + 1).padStart(2, "0")}
        </span>
        <span className={`flex-1 text-sm font-semibold transition-colors ${open ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"}`}>{q}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-all duration-300 shrink-0 ${open ? "rotate-180 text-red-500" : "text-gray-300"}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }} className="overflow-hidden">
            <p className="pb-5 text-sm text-gray-500 leading-relaxed pl-9">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────────── */
export default function HelpAndSupportPage() {
  const { auth } = useAuth();
  const [mobileChat, setMobileChat] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [searchQ, setSearchQ] = useState("");
  const desktopPanelRef = useRef<HTMLDivElement>(null);

  // Shared state kept here so panel ↔ expanded stay in sync
  const [chatShared, setChatShared] = useState<SharedChatState>({
    view: "inbox", chatId: null, messages: [], threads: [], page: 0,
    form: { subject: "", description: "" }, loading: false,
  });
  const updateChatShared = (patch: Partial<SharedChatState>) =>
    setChatShared(prev => ({ ...prev, ...patch }));

  const filteredFaqs = faqs.filter(f =>
    !searchQ || f.q.toLowerCase().includes(searchQ.toLowerCase()) || f.a.toLowerCase().includes(searchQ.toLowerCase())
  );

  const openNewChat = () => {
    setNewChatTrigger(n => n + 1);
    setMobileChat(true);
    desktopPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Toaster position="top-center" />
      <TopBar />

      {/* ════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 min-h-[88vh] items-center gap-12 lg:gap-20 py-16">

            {/* Left — text */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700 tracking-wide">Support team available now</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-black text-gray-900 tracking-tight leading-[1.03] mb-6">
                World-class<br />
                support for<br />
                <span className="text-red-600">every customer.</span>
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
                From first-time buyers to enterprise partners — our dedicated team is here with the answers you need, when you need them.
              </p>

              {/* Search */}
              <div className="relative max-w-lg mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input type="text" placeholder="Search help articles and FAQs" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  className="w-full pl-14 pr-12 py-4.5 py-[18px] bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all shadow-sm" />
                {searchQ && (
                  <button onClick={() => setSearchQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={openNewChat}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl transition-all shadow-md shadow-red-100 hover:shadow-red-200">
                  <MessageSquare className="w-4 h-4" /> Chat with support
                </button>
                <a href="mailto:support@britbooks.co.uk"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded-2xl transition-all">
                  <Mail className="w-4 h-4" /> Email us
                </a>
              </div>
            </motion.div>

            {/* Right — video */}
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="order-1 lg:order-2 relative hidden lg:block">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-300/60 lg:h-[580px]">
                <video className="w-full h-full object-cover" autoPlay muted loop playsInline>
                  <source src={VIDEO_SRC} type="video/mp4" />
                </video>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Bottom overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Enterprise ready</p>
                      <div className="flex gap-2.5">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                          <ShieldCheckIcon className="w-4 h-4 text-white" />
                          <span className="text-white text-xs font-bold">256-bit SSL</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                          <ClockIcon className="w-4 h-4 text-white" />
                          <span className="text-white text-xs font-bold">24 / 7</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={openNewChat}
                      className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all shadow-lg">
                      Get help <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating metric card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -left-6 hidden lg:block bg-white rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 px-5 py-4"
              >
                <p className="text-3xl font-black text-gray-900">98%</p>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">Customer satisfaction rate</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════════ */}
      <section className="bg-gray-900 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-gray-700">
            {[
              { icon: <Zap className="w-5 h-5 text-amber-400" />, stat: "< 2 hours", label: "Average first response" },
              { icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, stat: "50,000+", label: "Tickets resolved this year" },
              { icon: <Users className="w-5 h-5 text-blue-400" />, stat: "2M+", label: "Customers supported" },
              { icon: <Award className="w-5 h-5 text-purple-400" />, stat: "24 / 7", label: "Always available" },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="lg:px-10 first:pl-0 last:pr-0 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{s.icon}</div>
                <div>
                  <p className="text-2xl font-black text-white">{s.stat}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════ */}
      <section className="bg-[#f7f7f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex gap-10 items-start">

            {/* Left */}
            <div className="flex-1 min-w-0 space-y-8">

              {/* Section heading */}
              <div>
                <h2 className="text-2xl font-black text-gray-900">Get in touch</h2>
                <p className="text-gray-400 text-sm mt-1">Choose the channel that works best for you.</p>
              </div>

              {/* Contact cards */}
              <div className="grid sm:grid-cols-2 gap-5">
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
                  className="bg-white rounded-3xl border border-gray-100 p-7 flex flex-col gap-5 hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-200">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-700">Live now</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-lg mb-1.5">Live Chat</p>
                    <p className="text-gray-400 text-sm leading-relaxed">Connect instantly with our support specialists. Real answers from real people — no bots.</p>
                  </div>
                  <button onClick={openNewChat}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold tracking-wide transition-all shadow-sm shadow-red-100 flex items-center justify-center gap-2">
                    Start a conversation <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                  className="bg-white rounded-3xl border border-gray-100 p-7 flex flex-col gap-5 hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-md shadow-gray-200">
                      <Mail className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700">Replies in 24h</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-lg mb-1.5">Email Support</p>
                    <p className="text-gray-400 text-sm leading-relaxed">Send a detailed message to our team. Perfect for complex queries or documentation requests.</p>
                  </div>
                  <a href="mailto:support@britbooks.co.uk"
                    className="block text-center w-full py-3.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2">
                    Send an email <ArrowRightIcon className="w-4 h-4" />
                  </a>
                </motion.div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Frequently asked questions</p>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Search result label */}
              {searchQ && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Showing results for <span className="font-bold text-gray-900">"{searchQ}"</span></p>
                  <button onClick={() => setSearchQ("")} className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors">Clear</button>
                </div>
              )}

              {/* FAQ */}
              {filteredFaqs.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-14 text-center">
                  <Search className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-base font-bold text-gray-600">No results for "{searchQ}"</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try different keywords or{" "}
                    <button onClick={openNewChat} className="text-red-600 hover:text-red-700 font-bold underline underline-offset-2">start a chat</button>.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 px-8 divide-y divide-gray-50">
                  {filteredFaqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} i={i} />)}
                </div>
              )}

              {/* Enterprise CTA strip */}
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="relative bg-gray-900 rounded-3xl p-8 sm:p-10 overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div
                  className="absolute inset-0 opacity-5"
                  style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Enterprise</span>
                  </div>
                  <p className="text-xl font-black text-white">Need a dedicated account manager?</p>
                  <p className="text-gray-400 text-sm mt-1">We support businesses of all sizes with priority support and tailored solutions.</p>
                </div>
                <button onClick={openNewChat}
                  className="relative shrink-0 flex items-center gap-2 px-7 py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-red-900/30">
                  Contact enterprise team <ArrowRightIcon className="w-4 h-4" />
                </button>
              </motion.div>
            </div>

            {/* Right — sticky chat panel (desktop) */}
            <div ref={desktopPanelRef}
              className="hidden lg:block w-[380px] xl:w-[410px] shrink-0 sticky top-6 h-[620px] rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/60 overflow-hidden bg-white">
              <ChatWidget
                userId={auth.user?.userId}
                token={auth.token ?? undefined}
                newChatTrigger={newChatTrigger}
                expanded={false}
                onToggleExpand={() => setChatExpanded(true)}
                shared={chatShared}
                onSharedChange={updateChatShared}
              />
            </div>

            {/* Expanded chat overlay (desktop) */}
            <AnimatePresence>
              {chatExpanded && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setChatExpanded(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden lg:block"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    className="fixed inset-0 z-50 hidden lg:flex items-center justify-center p-8"
                  >
                    <div className="w-full max-w-3xl h-[82vh] rounded-3xl border border-gray-200 shadow-2xl overflow-hidden bg-white flex flex-col">
                      <ChatWidget
                        userId={auth.user?.userId}
                        token={auth.token ?? undefined}
                        newChatTrigger={newChatTrigger}
                        expanded={true}
                        onToggleExpand={() => setChatExpanded(false)}
                        onClose={() => setChatExpanded(false)}
                        shared={chatShared}
                        onSharedChange={updateChatShared}
                      />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />

      {/* Mobile FAB */}
      <AnimatePresence>
        {!mobileChat && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.94 }}
            onClick={openNewChat}
            className="fixed bottom-6 right-5 w-14 h-14 bg-red-600 rounded-2xl shadow-xl shadow-red-200 flex items-center justify-center z-40 lg:hidden">
            <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {mobileChat && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileChat(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 h-[88vh] bg-white rounded-t-3xl overflow-hidden flex flex-col lg:hidden shadow-2xl">
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="flex-1 min-h-0">
                <ChatWidget userId={auth.user?.userId} token={auth.token ?? undefined}
                  onClose={() => setMobileChat(false)} newChatTrigger={newChatTrigger}
                  shared={chatShared} onSharedChange={updateChatShared} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
