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
  ArrowRightIcon,
  FaceSmileIcon,
  PaperClipIcon,
  PhotoIcon,
  EllipsisVerticalIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircle,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Zap,
  Users,
  Award,
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
} from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";
import { useAuth } from "../context/authContext";

const API_BASE = "https://britbooks-api-production-8ebd.up.railway.app/api/chat";
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

/* ──────────────────────────────────────────────────────────
   SMART MESSAGE — rich UI response for support/bot messages
────────────────────────────────────────────────────────── */
type MsgCategory = {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
  dot: string;
  actions?: { label: string; href: string }[];
};

function detectCategory(msg: string): MsgCategory {
  const t = msg.toLowerCase();
  if (t.includes("order") || t.includes("track") || t.includes("purchase") || t.includes("placed"))
    return {
      label: "Order Support", icon: <Package className="w-3.5 h-3.5" />,
      bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", dot: "bg-blue-500",
      actions: [{ label: "View My Orders", href: "/orders" }],
    };
  if (t.includes("return") || t.includes("refund") || t.includes("exchange") || t.includes("send back"))
    return {
      label: "Returns & Refunds", icon: <RotateCcw className="w-3.5 h-3.5" />,
      bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", dot: "bg-orange-500",
      actions: [{ label: "Return Policy", href: "/return-policy" }],
    };
  if (t.includes("deliver") || t.includes("ship") || t.includes("dispatch") || t.includes("arrival") || t.includes("working day"))
    return {
      label: "Shipping & Delivery", icon: <Truck className="w-3.5 h-3.5" />,
      bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500",
      actions: [{ label: "Shipping Info", href: "/shipping-returns" }],
    };
  if (t.includes("payment") || t.includes("pay") || t.includes("card") || t.includes("charge") || t.includes("billing") || t.includes("invoice"))
    return {
      label: "Payment & Billing", icon: <CreditCard className="w-3.5 h-3.5" />,
      bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", dot: "bg-purple-500",
      actions: [{ label: "My Invoices", href: "/invoices" }],
    };
  if (t.includes("account") || t.includes("password") || t.includes("login") || t.includes("sign in") || t.includes("profile"))
    return {
      label: "Account & Security", icon: <UserCircle className="w-3.5 h-3.5" />,
      bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500",
      actions: [{ label: "Account Settings", href: "/settings" }],
    };
  if (t.includes("book") || t.includes("isbn") || t.includes("title") || t.includes("author") || t.includes("product"))
    return {
      label: "Books & Products", icon: <BookOpen className="w-3.5 h-3.5" />,
      bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500",
      actions: [{ label: "Explore Books", href: "/explore" }],
    };
  if (t.includes("privacy") || t.includes("data") || t.includes("gdpr") || t.includes("secure") || t.includes("protect"))
    return {
      label: "Privacy & Security", icon: <ShieldCheck className="w-3.5 h-3.5" />,
      bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-100", dot: "bg-teal-500",
      actions: [{ label: "Privacy Policy", href: "/privacy-policy" }],
    };
  return {
    label: "Support", icon: <LifeBuoy className="w-3.5 h-3.5" />,
    bg: "bg-red-50", text: "text-red-700", border: "border-red-100", dot: "bg-red-500",
  };
}

// Render **bold** inline
function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="font-bold text-gray-900">{p}</strong> : p
  );
}

// ── Response-type detector ──────────────────────────────
type ResponseType = "payments" | "orders" | "order-detail" | "profile" | "general";

function getResponseType(text: string): ResponseType {
  const t = text.toLowerCase();
  const orderIds = text.match(/order #[a-f0-9]+/gi) || [];
  const boldOrderIds = text.match(/\*\*order #[a-f0-9]+\*\*/gi) || [];
  const amounts = text.match(/£[\d,.]+/g) || [];

  if (
    (t.includes("payment history") || t.includes("recent payment") || t.includes("transaction")) &&
    amounts.length >= 2
  ) return "payments";
  if ((orderIds.length >= 2 || boldOrderIds.length >= 2)) return "orders";
  if (
    (orderIds.length === 1 || boldOrderIds.length === 1) &&
    (t.includes("placed") || t.includes("status") || t.includes("total") ||
      t.includes("dispatch") || t.includes("delivery"))
  ) return "order-detail";
  if (t.includes("name:") && (t.includes("email:") || t.includes("phone:"))) return "profile";
  return "general";
}

// ── Data parsers ────────────────────────────────────────
function parsePaymentRows(text: string) {
  return text.split("\n")
    .filter((l) => /•|\-/.test(l) && /£[\d,.]+/.test(l))
    .map((line) => {
      const stripped = line.replace(/^[•\-*]\s*/, "").replace(/\*\*/g, "");
      const amount = (stripped.match(/£[\d,.]+/) || [""])[0];
      const date = (stripped.match(/\d{1,2}[\s\/]\w+[\s\/]\d{2,4}|\d{2}\/\d{2}\/\d{4}/) || [""])[0];
      const status = (stripped.match(/success|paid|failed|pending|refunded/i) || ["Unknown"])[0];
      const orderId = (stripped.match(/order #([a-f0-9]+)/i) || [null, null])[1];
      const receipt = /receipt/i.test(stripped);
      return { amount, date, status, orderId, receipt };
    }).filter((r) => r.amount);
}

function parseOrderRows(text: string) {
  return text.split("\n")
    .filter((l) => /order #[a-f0-9]+/i.test(l))
    .map((line) => {
      const stripped = line.replace(/^[•\-*]\s*/, "").replace(/\*\*/g, "");
      const idMatch = stripped.match(/order #([a-f0-9]+)/i);
      const date = (stripped.match(/\d{2}\/\d{2}\/\d{4}/) || [""])[0];
      const amount = (stripped.match(/£[\d,.]+/) || [""])[0];
      const status = (stripped.match(/ordered|dispatched|delivered|processing|cancelled|preparing|out for delivery/i) || ["Ordered"])[0];
      return { id: idMatch ? idMatch[1] : "", date, amount, status };
    }).filter((r) => r.id);
}

function parseOrderDetail(text: string) {
  const fields: { label: string; value: string }[] = [];
  const idMatch = text.match(/order #([a-f0-9]+)/i);
  const lines = text.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const kv = line.replace(/^[•\-*]\s*/, "").match(/^([^:–—]+)[:\s–—]+(.+)$/);
    if (kv) fields.push({ label: kv[1].trim().replace(/\*\*/g, ""), value: kv[2].trim().replace(/\*\*/g, "") });
  }
  return { orderId: idMatch ? idMatch[1] : "", fields };
}

function parseProfileFields(text: string) {
  return text.split("\n")
    .filter((l) => /^[•\-*]?\s*\w/.test(l) && l.includes(":"))
    .map((line) => {
      const kv = line.replace(/^[•\-*]\s*/, "").match(/^([^:]+):\s*(.+)$/);
      return kv ? { label: kv[1].trim(), value: kv[2].trim() } : null;
    })
    .filter(Boolean) as { label: string; value: string }[];
}

// ── Status badge ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes("success") || s.includes("paid") || s.includes("delivered"))
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200"><CheckCircle className="w-3 h-3" />{status}</span>;
  if (s.includes("dispatch") || s.includes("out for"))
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200"><Truck className="w-3 h-3" />{status}</span>;
  if (s.includes("cancel") || s.includes("failed"))
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">✕ {status}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">⏳ {status}</span>;
}

// Intro lines (non-bullet, non-data text)
function getIntroLines(text: string): string[] {
  return text.split("\n")
    .filter((l) => l.trim() && !/^[•\-*\d]/.test(l.trim()) && !/order #[a-f0-9]+/i.test(l))
    .slice(0, 2);
}

// ── Master SmartBotMessage ──────────────────────────────
function SmartBotMessage({ message, time }: { message: string; time: string }) {
  const type = getResponseType(message);
  const intro = getIntroLines(message);

  /* ── PAYMENT LEDGER ── */
  if (type === "payments") {
    const rows = parsePaymentRows(message);
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm border border-purple-100" style={{ maxWidth: "94%" }}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-purple-50 border-b border-purple-100">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-purple-600" /></div>
          <div>
            <p className="text-purple-900 font-black text-sm">Payment History</p>
            <p className="text-purple-400 text-[10px]">{rows.length} transaction{rows.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="ml-auto flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /><span className="text-[10px] text-purple-400 font-semibold">Alex</span></div>
        </div>

        {/* Intro */}
        {intro[0] && <div className="bg-white px-4 py-2.5 text-sm text-gray-700 border-b border-purple-50">{intro[0]}</div>}

        {/* Ledger table */}
        <div className="bg-white">
          {/* Column headers */}
          <div className="grid grid-cols-3 px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Amount</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Date</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className={`px-4 py-3 border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
              <div className="grid grid-cols-3 items-center mb-1">
                <span className="text-sm font-black text-gray-900">{row.amount}</span>
                <span className="text-xs text-gray-500">{row.date}</span>
                <StatusBadge status={row.status} />
              </div>
              {row.orderId && (
                <div className="flex items-center justify-between">
                  <a href="/orders" className="text-[11px] text-blue-600 hover:underline font-medium">Order #{row.orderId.slice(-8)}</a>
                  {row.receipt && (
                    <a href="/invoices" className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-bold hover:underline">
                      <ExternalLink className="w-2.5 h-2.5" />Receipt
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-semibold">Secure · Encrypted</span></div>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
      </div>
    );
  }

  /* ── ORDER LIST ── */
  if (type === "orders") {
    const rows = parseOrderRows(message);
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm border border-blue-100" style={{ maxWidth: "94%" }}>
        <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center"><Package className="w-4 h-4 text-blue-600" /></div>
          <div>
            <p className="text-blue-900 font-black text-sm">Your Orders</p>
            <p className="text-blue-400 text-[10px]">{rows.length} order{rows.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="ml-auto flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /><span className="text-[10px] text-blue-400 font-semibold">Alex</span></div>
        </div>

        {intro[0] && <div className="bg-white px-4 py-2.5 text-sm text-gray-700 border-b border-blue-50">{intro[0]}</div>}

        <div className="bg-white divide-y divide-gray-50">
          {rows.map((row, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <a href="/orders" className="text-sm font-black text-gray-900 hover:text-blue-600 transition-colors">
                    #{row.id.slice(-8)}
                  </a>
                  <span className="text-sm font-bold text-gray-900">{row.amount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{row.date}</span>
                  <StatusBadge status={row.status} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <a href="/orders" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
            <ExternalLink className="w-3 h-3" />View all orders
          </a>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
      </div>
    );
  }

  /* ── ORDER DETAIL ── */
  if (type === "order-detail") {
    const { orderId, fields } = parseOrderDetail(message);
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm border border-amber-100" style={{ maxWidth: "94%" }}>
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border-b border-amber-100">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></div>
          <div>
            <p className="text-amber-900 font-black text-sm">Order Details</p>
            {orderId && <p className="text-amber-400 text-[10px] font-mono">#{orderId.slice(-8)}</p>}
          </div>
          <div className="ml-auto flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /><span className="text-[10px] text-amber-500 font-semibold">Alex</span></div>
        </div>

        {intro[0] && <div className="bg-white px-4 py-2.5 text-sm text-gray-700 border-b border-amber-50">{intro[0]}</div>}

        <div className="bg-white">
          {fields.map((f, i) => {
            const isTotal = /total/i.test(f.label);
            const isStatus = /status|payment|shipping/i.test(f.label);
            return (
              <div key={i} className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-50 ${isTotal ? "bg-amber-50" : ""}`}>
                <span className={`text-xs font-bold ${isTotal ? "text-amber-700" : "text-gray-400"}`}>{f.label}</span>
                {isStatus ? (
                  <StatusBadge status={f.value} />
                ) : (
                  <span className={`text-sm font-semibold ${isTotal ? "text-amber-900 font-black" : "text-gray-700"}`}>{f.value}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <a href="/orders" className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline">
            <ExternalLink className="w-3 h-3" />Open in Orders
          </a>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
      </div>
    );
  }

  /* ── PROFILE CARD ── */
  if (type === "profile") {
    const fields = parseProfileFields(message);
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200" style={{ maxWidth: "94%" }}>
        <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"><UserCircle className="w-4 h-4 text-slate-600" /></div>
          <div><p className="text-slate-900 font-black text-sm">Your Account</p><p className="text-slate-400 text-[10px]">Profile overview</p></div>
          <div className="ml-auto flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /><span className="text-[10px] text-slate-400 font-semibold">Alex</span></div>
        </div>

        {intro[0] && <div className="bg-white px-4 py-2.5 text-sm text-gray-700 border-b border-slate-50">{intro[0]}</div>}

        <div className="bg-white divide-y divide-gray-50">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{f.label}</span>
              <span className="text-sm text-gray-700 font-medium">{f.value}</span>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <a href="/settings" className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:underline">
            <ExternalLink className="w-3 h-3" />Account Settings
          </a>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
      </div>
    );
  }

  /* ── GENERAL (fallback) ── */
  const cat = detectCategory(message);
  const lines = message.split("\n").filter((l) => l.trim());
  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border ${cat.border}`} style={{ maxWidth: "90%" }}>
      <div className={`flex items-center gap-2 px-3.5 py-2 ${cat.bg} border-b ${cat.border}`}>
        <div className={cat.text}>{cat.icon}</div>
        <span className={`text-[11px] font-black ${cat.text}`}>{cat.label}</span>
        <div className="ml-auto flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-amber-400" /><span className="text-[10px] text-gray-400">Alex</span></div>
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
        <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-semibold">BritBooks AI</span></div>
        <span className="text-[10px] text-gray-400">{time}</span>
      </div>
    </div>
  );
}

interface SharedChatState {
  view: View;
  chatId: string | null;
  messages: any[];
  threads: any[];
  form: { subject: string; description: string };
  loading: boolean;
}

/* ──────────────────────────────────────────────────────────
   WHATSAPP WEB DESKTOP PANEL (two-column, embedded in page)
────────────────────────────────────────────────────────── */
interface DesktopChatProps {
  userId?: string;
  token?: string;
  newChatTrigger?: number;
  shared: SharedChatState;
  onSharedChange: (s: Partial<SharedChatState>) => void;
}

function DesktopChatPanel({ userId, token, newChatTrigger = 0, shared, onSharedChange }: DesktopChatProps) {
  const { view, chatId, messages, threads, form, loading } = shared;
  const setView = (v: View) => onSharedChange({ view: v });
  const setChatId = (id: string | null) => onSharedChange({ chatId: id });
  const setMessages = (msgs: any[]) => onSharedChange({ messages: msgs });
  const setThreads = (t: any[]) => onSharedChange({ threads: t });
  const setForm = (f: { subject: string; description: string }) => onSharedChange({ form: f });
  const setLoading = (l: boolean) => onSharedChange({ loading: l });

  const [input, setInput] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const headers = { Authorization: `Bearer ${token}` };

  const loadThreads = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/user/${userId}`, { headers });
      const d = res.data?.data || res.data?.threads || res.data || [];
      setThreads(Array.isArray(d) ? d : []);
    } catch {
      setThreads([]);
    }
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
  }, [messages]);

  const openThread = async (id: string) => {
    setLoading(true);
    setChatId(id);
    setView("chat");
    try {
      const res = await axios.get(`${API_BASE}/${id}/messages`, { headers });
      setMessages(res.data?.messages || []);
    } catch {
      toast.error("Could not load messages");
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Please log in");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/create`, { userId, ...form }, { headers });
      setChatId(res.data._id);
      setMessages(res.data.messages || []);
      setView("chat");
      loadThreads();
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !chatId) return;
    const msg = input;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    const tempId = `temp_${Date.now()}`;
    const optimistic = { _id: tempId, senderId: userId, message: msg, createdAt: new Date().toISOString(), status: "sending" };
    setMessages([...messages, optimistic]);
    try {
      const res = await axios.post(`${API_BASE}/send`, { chatId, senderId: userId, message: msg }, { headers });
      setMessages(res.data.messages || []);
    } catch {
      toast.error("Failed to send");
      setMessages(messages.filter((m: any) => m._id !== tempId));
      setInput(msg);
    }
  };

  const filteredThreads = threads.filter((t: any) =>
    !threadSearch || (t.subject || "").toLowerCase().includes(threadSearch.toLowerCase())
  );

  /* ── RIGHT PANEL CONTENT ── */
  const renderRight = () => {
    /* Welcome screen */
    if (view === "inbox") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-[#f0f2f5]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cbd5e0' fill-opacity='0.18'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
          <div className="text-center max-w-xs">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <span className="text-3xl font-black text-red-600">BB</span>
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">BritBooks Support</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Select a conversation from the left, or start a new one to chat with our support team.
            </p>
            <button
              onClick={() => { setView("newticket"); setForm({ subject: "", description: "" }); setChatId(null); setMessages([]); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full transition-all shadow-md"
            >
              <PlusIcon className="w-4 h-4" /> New conversation
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Support team is online now
          </div>
        </div>
      );
    }

    /* New ticket form */
    if (view === "newticket") {
      return (
        <div className="flex-1 flex flex-col bg-[#f0f2f5]">
          {/* Header */}
          <div className="bg-[#f0f2f5] border-b border-gray-200 px-5 py-4 flex items-center gap-3">
            <button onClick={() => setView("inbox")} className="p-1.5 rounded-full hover:bg-gray-200 transition-colors">
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-black shadow">BB</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">BritBooks Support</p>
              <p className="text-xs text-emerald-600 font-medium">● Online</p>
            </div>
          </div>
          {/* Form */}
          <form onSubmit={createTicket} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start a new conversation</p>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Order Issue, Account Help"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Details</label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PaperAirplaneIcon className="w-4 h-4" /> Send Message</>}
              </button>
            </div>
          </form>
        </div>
      );
    }

    /* Chat view */
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat header */}
        <div className="bg-[#f0f2f5] border-b border-gray-200 px-5 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => { setView("inbox"); setChatId(null); setMessages([]); }}
            className="p-1.5 rounded-full hover:bg-gray-200 transition-colors lg:hidden"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-black shadow">BB</div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#f0f2f5]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">BritBooks Support</p>
            <p className="text-xs text-emerald-600 font-medium">Online</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setView("newticket"); setChatId(null); setMessages([]); setForm({ subject: "", description: "" }); }}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              title="New conversation"
            >
              <PlusIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
              <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-2 min-h-0"
          style={{
            backgroundColor: "#efeae2",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8bfb0' fill-opacity='0.25'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='20' r='2'/%3E%3Ccircle cx='100' cy='20' r='2'/%3E%3Ccircle cx='140' cy='20' r='2'/%3E%3Ccircle cx='180' cy='20' r='2'/%3E%3Ccircle cx='220' cy='20' r='2'/%3E%3Ccircle cx='260' cy='20' r='2'/%3E%3Ccircle cx='300' cy='20' r='2'/%3E%3Ccircle cx='340' cy='20' r='2'/%3E%3Ccircle cx='380' cy='20' r='2'/%3E%3Ccircle cx='20' cy='60' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Ccircle cx='100' cy='60' r='2'/%3E%3Ccircle cx='140' cy='60' r='2'/%3E%3Ccircle cx='180' cy='60' r='2'/%3E%3Ccircle cx='220' cy='60' r='2'/%3E%3Ccircle cx='260' cy='60' r='2'/%3E%3Ccircle cx='300' cy='60' r='2'/%3E%3Ccircle cx='340' cy='60' r='2'/%3E%3Ccircle cx='380' cy='60' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}
        >
          {loading ? (
            <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center">
              <div className="bg-[#fffde7] border border-yellow-100 rounded-xl px-5 py-3 text-xs text-yellow-700 shadow-sm">
                Messages are end-to-end encrypted. No one outside this chat can read them.
              </div>
            </div>
          ) : (
            messages.map((msg: any, i: number) => {
              const isMe = msg.senderId === userId;
              const isSending = msg.status === "sending";
              const hasAgentReplyAfter = messages.slice(i + 1).some((m: any) => m.senderId !== userId);
              return (
                <motion.div
                  key={msg._id ?? i}
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {/* AI/agent avatar */}
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white text-[9px] font-black flex items-center justify-center shrink-0 mb-1 shadow-sm">BB</div>
                  )}

                  {isMe ? (
                    /* User bubble — WhatsApp green */
                    <div className="flex flex-col items-end max-w-[72%]">
                      <div className="px-3.5 py-2.5 text-sm leading-relaxed shadow-sm bg-[#d9fdd3] text-gray-800 rounded-tl-2xl rounded-tr-md rounded-bl-2xl rounded-br-2xl">
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
                  ) : (
                    /* AI response — rich smart card */
                    <SmartBotMessage message={msg.message} time={fmtDate(msg.createdAt)} />
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-[#f0f2f5] border-t border-gray-200 px-4 py-3 shrink-0">
          <div className="flex items-end gap-2">
            {/* Emoji */}
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors shrink-0">
              <FaceSmileIcon className="w-6 h-6" />
            </button>
            {/* Attachment */}
            <div className="relative shrink-0">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    toast("File attachment coming soon", { icon: "📎" });
                    e.target.value = "";
                  }
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Attach file"
              >
                <PaperClipIcon className="w-6 h-6" />
              </button>
            </div>
            {/* Photo */}
            <div className="relative shrink-0">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="photo-attach"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    toast("Photo sharing coming soon", { icon: "📷" });
                    e.target.value = "";
                  }
                }}
              />
              <button
                onClick={() => document.getElementById("photo-attach")?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Attach photo"
              >
                <PhotoIcon className="w-6 h-6" />
              </button>
            </div>
            {/* Text Input */}
            <div className="flex-1 bg-white rounded-2xl px-4 py-2.5 flex items-end shadow-sm border border-gray-100">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (taRef.current) {
                    taRef.current.style.height = "auto";
                    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 100) + "px";
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Type a message"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 resize-none py-0.5 max-h-[100px] leading-relaxed w-full"
                rows={1}
              />
            </div>
            {/* Send / Mic */}
            {input.trim() ? (
              <button
                onClick={send}
                className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-md shrink-0"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            ) : (
              <button className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center transition-all shadow-md shrink-0">
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* ── LEFT: Thread List ── */}
      <div className="w-[320px] xl:w-[360px] border-r border-gray-200 flex flex-col bg-white shrink-0">
        {/* Header */}
        <div className="bg-[#f0f2f5] px-5 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-black shadow">BB</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">My Conversations</p>
              <p className="text-[11px] text-emerald-600">● Support is online</p>
            </div>
          </div>
          <button
            onClick={() => { setView("newticket"); setForm({ subject: "", description: "" }); setChatId(null); setMessages([]); }}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="New conversation"
          >
            <PlusIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 bg-[#f0f2f5] border-b border-gray-200">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search conversations"
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 px-6 text-center gap-3">
              <MessageSquare className="w-10 h-10 text-gray-200" />
              <p className="text-sm font-bold text-gray-600">No conversations yet</p>
              <p className="text-xs text-gray-400">Start a conversation and we'll reply promptly.</p>
              <button
                onClick={() => { setView("newticket"); setForm({ subject: "", description: "" }); }}
                className="mt-2 px-5 py-2.5 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-all"
              >
                New conversation
              </button>
            </div>
          ) : (
            filteredThreads.map((t: any) => (
              <button
                key={t._id}
                onClick={() => openThread(t._id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${chatId === t._id ? "bg-gray-100" : ""}`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm">BB</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.subject || "New conversation"}</p>
                    <span className="text-[11px] text-gray-400 shrink-0 ml-2">{fmtDate(t.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">Tap to view messages</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat / Form / Welcome ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {renderRight()}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MOBILE SINGLE-PANEL CHAT (sheet)
────────────────────────────────────────────────────────── */
interface MobileChatProps {
  userId?: string;
  token?: string;
  onClose?: () => void;
  newChatTrigger?: number;
  shared: SharedChatState;
  onSharedChange: (s: Partial<SharedChatState>) => void;
}

function MobileChatWidget({ userId, token, onClose, newChatTrigger = 0, shared, onSharedChange }: MobileChatProps) {
  const { view, chatId, messages, threads, form, loading } = shared;
  const setView = (v: View) => onSharedChange({ view: v });
  const setChatId = (id: string | null) => onSharedChange({ chatId: id });
  const setMessages = (msgs: any[]) => onSharedChange({ messages: msgs });
  const setThreads = (t: any[]) => onSharedChange({ threads: t });
  const setForm = (f: { subject: string; description: string }) => onSharedChange({ form: f });
  const setLoading = (l: boolean) => onSharedChange({ loading: l });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const headers = { Authorization: `Bearer ${token}` };

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
  }, [messages]);

  const openThread = async (id: string) => {
    setLoading(true);
    setChatId(id);
    setView("chat");
    try {
      const res = await axios.get(`${API_BASE}/${id}/messages`, { headers });
      setMessages(res.data?.messages || []);
    } catch { toast.error("Could not load messages"); }
    finally { setLoading(false); }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Please log in");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/create`, { userId, ...form }, { headers });
      setChatId(res.data._id);
      setMessages(res.data.messages || []);
      setView("chat");
      loadThreads();
    } catch { toast.error("Failed to create ticket"); }
    finally { setLoading(false); }
  };

  const send = async () => {
    if (!input.trim() || !chatId) return;
    const msg = input;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    const tempId = `temp_${Date.now()}`;
    setMessages([...messages, { _id: tempId, senderId: userId, message: msg, createdAt: new Date().toISOString(), status: "sending" }]);
    try {
      const res = await axios.post(`${API_BASE}/send`, { chatId, senderId: userId, message: msg }, { headers });
      setMessages(res.data.messages || []);
    } catch {
      toast.error("Failed to send");
      setMessages(messages.filter((m: any) => m._id !== tempId));
      setInput(msg);
    }
  };

  if (view === "inbox") return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-red-600 px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-xs font-black text-white">BB</div>
            <div>
              <p className="text-[10px] text-red-200 font-bold tracking-widest uppercase">BritBooks</p>
              <p className="text-sm font-bold text-white">Customer Support</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-400/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-300">Online</span>
            </div>
            {onClose && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20"><XMarkIcon className="w-4 h-4 text-white/70" /></button>}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 px-6 text-center gap-4">
            <MessageSquare className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-bold text-gray-700">No conversations yet</p>
            <p className="text-xs text-gray-400">Start a conversation and we'll reply promptly.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {threads.map((t: any) => (
              <button key={t._id} onClick={() => openThread(t._id)}
                className="w-full text-left flex items-center gap-3 px-4 py-4 hover:bg-gray-100 transition-colors">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-black shrink-0">BB</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.subject || "New conversation"}</p>
                    <span className="text-[11px] text-gray-400 shrink-0 ml-2">{fmtDate(t.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">Tap to view messages</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <button onClick={() => { setView("newticket"); setForm({ subject: "", description: "" }); }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-sm font-bold tracking-wide transition-all">
          <PlusIcon className="w-4 h-4" /> New conversation
        </button>
      </div>
    </div>
  );

  if (view === "newticket") return (
    <div className="flex flex-col h-full">
      <div className="bg-red-600 px-5 py-4 flex items-center gap-3 shrink-0">
        <button onClick={() => setView("inbox")} className="p-1.5 rounded-lg hover:bg-white/20"><ChevronLeftIcon className="w-4 h-4 text-white" /></button>
        <p className="text-sm font-bold text-white flex-1">New conversation</p>
        {onClose && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20"><XMarkIcon className="w-4 h-4 text-white/70" /></button>}
      </div>
      <form onSubmit={createTicket} className="flex-1 p-5 gap-4 bg-gray-50 overflow-y-auto min-h-0 flex flex-col">
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Subject</label>
          <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="e.g. Order Issue, Account Help"
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400" />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Details</label>
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your issue in detail..."
            className="flex-1 px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-red-400" />
        </div>
        <button type="submit" disabled={loading}
          className="py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PaperAirplaneIcon className="w-4 h-4" /> Send Message</>}
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="bg-red-600 px-5 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => { setView("inbox"); setChatId(null); setMessages([]); }} className="p-1.5 rounded-lg hover:bg-white/20"><ChevronLeftIcon className="w-4 h-4 text-white" /></button>
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-xs font-black text-white">BB</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-red-800" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">BritBooks Support</p>
          <p className="text-[10px] text-emerald-300 font-semibold">Online now</p>
        </div>
        <button onClick={() => { setView("newticket"); setChatId(null); setMessages([]); setForm({ subject: "", description: "" }); }} className="p-1.5 rounded-lg hover:bg-white/20"><PlusIcon className="w-4 h-4 text-white" /></button>
        {onClose && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20"><XMarkIcon className="w-4 h-4 text-white/70" /></button>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0"
        style={{ backgroundColor: "#efeae2" }}>
        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center">
            <div className="bg-[#fffde7] rounded-xl px-4 py-2.5 text-xs text-yellow-700 shadow-sm">No messages yet. Start the conversation!</div>
          </div>
        ) : (
          messages.map((msg: any, i: number) => {
            const isMe = msg.senderId === userId;
            const hasAgentReplyAfter = messages.slice(i + 1).some((m: any) => m.senderId !== userId);
            return (
              <motion.div key={msg._id ?? i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white text-[9px] font-black flex items-center justify-center shrink-0 mb-1 shadow-sm">BB</div>
                )}
                {isMe ? (
                  /* User bubble */
                  <div className="max-w-[78%] flex flex-col items-end">
                    <div className="px-3.5 py-2.5 text-sm leading-relaxed shadow-sm bg-[#d9fdd3] text-gray-800 rounded-tl-2xl rounded-tr-md rounded-bl-2xl rounded-br-2xl">
                      {msg.message}
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <span className="text-[10px] text-gray-400">{fmtDate(msg.createdAt)}</span>
                        <span className={`text-[11px] ${hasAgentReplyAfter ? "text-blue-500" : "text-gray-400"}`}>{msg.status === "sending" ? "●" : "✓✓"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* AI rich card */
                  <SmartBotMessage message={msg.message} time={fmtDate(msg.createdAt)} />
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <div className="bg-[#f0f2f5] border-t border-gray-200 px-3 py-2.5 shrink-0">
        <div className="flex items-end gap-2">
          <button className="p-2 text-gray-500"><FaceSmileIcon className="w-6 h-6" /></button>
          <label htmlFor="mobile-photo" className="p-2 text-gray-500 cursor-pointer">
            <PhotoIcon className="w-6 h-6" />
            <input id="mobile-photo" type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) toast("Photo sharing coming soon", { icon: "📷" }); }} />
          </label>
          <div className="flex-1 bg-white rounded-2xl px-4 py-2.5 flex items-end shadow-sm border border-gray-100">
            <textarea ref={taRef} value={input}
              onChange={(e) => { setInput(e.target.value); if (taRef.current) { taRef.current.style.height = "auto"; taRef.current.style.height = Math.min(taRef.current.scrollHeight, 96) + "px"; } }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message"
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 resize-none py-0.5 max-h-[96px] w-full"
              rows={1} />
          </div>
          <button onClick={send} disabled={!input.trim()}
            className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-md shrink-0">
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   FAQ
────────────────────────────────────────────────────────── */
const faqs = [
  { q: "How do I track my order?", a: "Track your order from the My Orders section in your account dashboard with real-time status updates." },
  { q: "What is your return policy?", a: "We accept returns within 30 days of receipt, provided the book is in its original condition with no marks or damage." },
  { q: "How do I sell my books on BritBooks?", a: "Navigate to Sell Books, enter the ISBN and receive an instant valuation. We collect from your door at no charge." },
  { q: "What payment methods do you accept?", a: "Visa, Mastercard, American Express, and PayPal. All transactions are protected by 256-bit SSL encryption." },
  { q: "How long does delivery take?", a: "Standard delivery takes 2 to 4 working days. Express next-day delivery is available at checkout." },
  { q: "Do you offer business or bulk accounts?", a: "Yes. We offer dedicated account managers, volume pricing, and priority support for business customers." },
];

function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-5 text-left py-5 group">
        <span className={`text-xs font-black tabular-nums ${open ? "text-red-600" : "text-gray-300 group-hover:text-red-400"}`}>{String(i + 1).padStart(2, "0")}</span>
        <span className={`flex-1 text-sm font-semibold ${open ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"}`}>{q}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-all ${open ? "rotate-180 text-red-500" : "text-gray-300"}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-5 text-sm text-gray-500 pl-9">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────── */
export default function HelpAndSupportPage() {
  const { auth } = useAuth();
  const [mobileChat, setMobileChat] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [searchQ, setSearchQ] = useState("");

  const chatSectionRef = useRef<HTMLDivElement>(null);

  const [chatShared, setChatShared] = useState<SharedChatState>({
    view: "inbox",
    chatId: null,
    messages: [],
    threads: [],
    form: { subject: "", description: "" },
    loading: false,
  });

  const updateChatShared = (patch: Partial<SharedChatState>) => setChatShared((prev) => ({ ...prev, ...patch }));

  const filteredFaqs = faqs.filter((f) =>
    !searchQ || f.q.toLowerCase().includes(searchQ.toLowerCase()) || f.a.toLowerCase().includes(searchQ.toLowerCase())
  );

  const openNewChat = () => {
    setNewChatTrigger((n) => n + 1);
    setMobileChat(true);
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Toaster position="top-center" />
      <TopBar />

      {/* HERO */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 min-h-[80vh] items-center gap-12 lg:gap-20 py-16">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700 tracking-wide">Support team available now</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-black text-gray-900 tracking-tight leading-[1.03] mb-6">
                World-class<br />support for<br />
                <span className="text-red-600">every customer.</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
                From first-time buyers to enterprise partners — our dedicated team is here with the answers you need.
              </p>
              <div className="relative max-w-lg mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search help articles and FAQs" value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-red-400" />
                {searchQ && (
                  <button onClick={() => setSearchQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={openNewChat} className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl transition-all">
                  <MessageSquare className="w-4 h-4" /> Chat with support
                </button>
                <a href="mailto:support@britbooks.co.uk" className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded-2xl transition-all">
                  <Mail className="w-4 h-4" /> Email us
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="order-1 lg:order-2 relative hidden lg:block">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-300/60 lg:h-[560px]">
                <video className="w-full h-full object-cover" autoPlay muted loop playsInline>
                  <source src={VIDEO_SRC} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <button
                    onClick={() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-3 rounded-xl"
                  >
                    Get help <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-gray-900 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-gray-700">
            {[
              { icon: <Zap className="w-5 h-5 text-amber-400" />, stat: "< 2 hours", label: "Average first response" },
              { icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, stat: "50,000+", label: "Tickets resolved this year" },
              { icon: <Users className="w-5 h-5 text-blue-400" />, stat: "2M+", label: "Customers supported" },
              { icon: <Award className="w-5 h-5 text-purple-400" />, stat: "24 / 7", label: "Always available" },
            ].map((s, i) => (
              <motion.div key={i} className="lg:px-10 flex items-start gap-4" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">{s.icon}</div>
                <div>
                  <p className="text-2xl font-black text-white">{s.stat}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESKTOP WHATSAPP WEB CHAT (embedded in page, not a modal) ── */}
      <section ref={chatSectionRef} className="hidden lg:block bg-[#f7f7f9] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">Live Support Chat</h2>
            <p className="text-gray-400 text-sm mt-1">Chat directly with our support team — select a conversation or start a new one.</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white"
            style={{ height: "680px" }}
          >
            <DesktopChatPanel
              userId={auth.user?.userId}
              token={auth.token ?? undefined}
              newChatTrigger={newChatTrigger}
              shared={chatShared}
              onSharedChange={updateChatShared}
            />
          </motion.div>
        </div>
      </section>

      {/* FAQ + CONTACT */}
      <section className="bg-[#f7f7f9] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-10 items-start">
            <div className="flex-1 min-w-0 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Get in touch</h2>
                <p className="text-gray-400 text-sm mt-1">Choose the channel that works best for you.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <motion.div className="bg-white rounded-3xl border border-gray-100 p-7 flex flex-col gap-5 hover:shadow-lg transition-all" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-700">Live now</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-lg mb-1.5">Live Chat</p>
                    <p className="text-gray-400 text-sm">Connect instantly with our support specialists.</p>
                  </div>
                  <button
                    onClick={() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold lg:block hidden"
                  >
                    Start a conversation
                  </button>
                  <button onClick={openNewChat} className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold lg:hidden">
                    Start a conversation
                  </button>
                </motion.div>

                <motion.div className="bg-white rounded-3xl border border-gray-100 p-7 flex flex-col gap-5 hover:shadow-lg transition-all" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center"><Mail className="w-6 h-6" /></div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700">Replies in 24h</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-lg mb-1.5">Email Support</p>
                    <p className="text-gray-400 text-sm">Send a detailed message to our team.</p>
                  </div>
                  <a href="mailto:support@britbooks.co.uk" className="block text-center w-full py-3.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold">Send an email</a>
                </motion.div>
              </div>

              {/* FAQ */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Frequently asked questions</p>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {searchQ && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Showing results for <span className="font-bold">"{searchQ}"</span></p>
                  <button onClick={() => setSearchQ("")} className="text-red-500 text-xs font-bold">Clear</button>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-gray-100 px-8 divide-y divide-gray-50">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} i={i} />)
                ) : (
                  <div className="py-14 text-center">
                    <p className="text-gray-500">No matching FAQs found.</p>
                    <button onClick={openNewChat} className="text-red-600 mt-3 font-bold">Start a chat instead</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Mobile FAB */}
      <AnimatePresence>
        {!mobileChat && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={openNewChat}
            className="fixed bottom-6 right-5 w-14 h-14 bg-red-600 rounded-2xl shadow-xl flex items-center justify-center z-40 lg:hidden">
            <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Chat Bottom Sheet */}
      <AnimatePresence>
        {mobileChat && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileChat(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="fixed inset-x-0 bottom-0 z-50 h-[90vh] bg-white rounded-t-3xl overflow-hidden flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0 bg-white">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <MobileChatWidget
                  userId={auth.user?.userId}
                  token={auth.token ?? undefined}
                  onClose={() => setMobileChat(false)}
                  newChatTrigger={newChatTrigger}
                  shared={chatShared}
                  onSharedChange={updateChatShared}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
