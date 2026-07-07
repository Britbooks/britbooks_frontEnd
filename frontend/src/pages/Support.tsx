"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
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

function threadTitle(t: any): string {
  if (t?.subject && String(t.subject).trim()) return String(t.subject).trim();
  const first =
    (Array.isArray(t?.messages) &&
      t.messages.find((m: any) => m?.senderType !== "bot")?.message) ||
    (Array.isArray(t?.messages) && t.messages[0]?.message) ||
    "";
  const text = String(first).trim();
  const subj = text.match(/^\s*Subject\s*[:\-–]\s*(.+)/im);
  if (subj?.[1]) {
    const line = subj[1].split(/\r?\n/)[0].trim();
    if (line) return line.length > 60 ? line.slice(0, 60).trim() + "…" : line;
  }
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) || "";
  if (firstLine) return firstLine.length > 60 ? firstLine.slice(0, 60).trim() + "…" : firstLine;
  return "New conversation";
}

function threadPreview(t: any): string {
  const raw = String(t?.lastMessage || "").trim();
  if (raw) {
    const cleaned = raw.replace(/^\s*(Subject|Description)\s*[:\-–]\s*/i, "");
    return cleaned.length > 70 ? cleaned.slice(0, 70).trim() + "…" : cleaned;
  }
  return "Tap to view messages";
}

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
function StreamingBotMessage({ text }: { text: string }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-red-100 bg-white" style={{ maxWidth: "90%" }}>
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

  // Poll active thread so admin/bot replies render without a refresh
  useEffect(() => {
    if (view !== "chat" || !chatId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await axios.get(`${API_BASE}/${chatId}/messages`, { headers });
        const incoming = res.data?.messages || [];
        if (cancelled) return;
        onSharedChange({
          messages: incoming.length !== messages.length ? incoming : messages,
        });
        if (incoming.length !== messages.length) loadThreads();
      } catch { /* silent */ }
    };
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [view, chatId, messages.length]);

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

    const tempUserId = `temp_user_${Date.now()}`;
    const tempBotId = `temp_bot_${Date.now()}`;
    const optimisticUser = { _id: tempUserId, senderId: userId, message: msg, createdAt: new Date().toISOString(), status: "sending" };
    const optimisticBot = { _id: tempBotId, senderId: "bot", senderType: "bot", message: "", createdAt: new Date().toISOString(), status: "streaming" };

    let working = [...messages, optimisticUser, optimisticBot];
    setMessages(working);

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
            working = working.map((m: any) => m._id === tempUserId ? { ...data.message, _id: tempUserId } : m);
            setMessages(working);
          } else if (event === "chunk" && typeof data.text === "string") {
            botText += data.text;
            working = working.map((m: any) => m._id === tempBotId ? { ...m, message: botText } : m);
            setMessages(working);
          } else if (event === "done" && Array.isArray(data.messages)) {
            setMessages(data.messages);
          } else if (event === "error") {
            throw new Error(data.message || "stream error");
          }
        }
      }
    } catch {
      toast.error("Failed to send");
      setMessages(messages);
      setInput(msg);
    }
  };

  const filteredThreads = threads
    .filter((t: any) =>
      !threadSearch || threadTitle(t).toLowerCase().includes(threadSearch.toLowerCase())
    )
    .sort((a: any, b: any) => {
      const ta = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
      const tb = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
      return tb - ta;
    });

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
                  ) : msg.status === "streaming" ? (
                    <StreamingBotMessage text={msg.message} />
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
                    <p className="text-sm font-semibold text-gray-900 truncate">{threadTitle(t)}</p>
                    <span className="text-[11px] text-gray-400 shrink-0 ml-2">{fmtDate(t.lastMessageAt || t.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{threadPreview(t)}</p>
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

  // Poll active thread so admin/bot replies render without a refresh
  useEffect(() => {
    if (view !== "chat" || !chatId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await axios.get(`${API_BASE}/${chatId}/messages`, { headers });
        const incoming = res.data?.messages || [];
        if (cancelled) return;
        onSharedChange({
          messages: incoming.length !== messages.length ? incoming : messages,
        });
        if (incoming.length !== messages.length) loadThreads();
      } catch { /* silent */ }
    };
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [view, chatId, messages.length]);

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
            {[...threads].sort((a: any, b: any) =>
              new Date(b.lastMessageAt || b.createdAt || 0).getTime() -
              new Date(a.lastMessageAt || a.createdAt || 0).getTime()
            ).map((t: any) => (
              <button key={t._id} onClick={() => openThread(t._id)}
                className="w-full text-left flex items-center gap-3 px-4 py-4 hover:bg-gray-100 transition-colors">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-black shrink-0">BB</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{threadTitle(t)}</p>
                    <span className="text-[11px] text-gray-400 shrink-0 ml-2">{fmtDate(t.lastMessageAt || t.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{threadPreview(t)}</p>
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
          <p className="text-sm font-bold text-black">BritBooks Support</p>
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
  { q: "How long does delivery take?", a: "Standard UK delivery typically arrives within 2–4 working days from the date your order is dispatched. International orders generally arrive within 7–14 working days, depending on the destination country and local customs processing. Please note that delivery times are estimates only and may vary during peak periods, public holidays, or due to circumstances outside our control." },
  { q: "How can I track my order?", a: "Once your order has been dispatched, you will receive a confirmation email containing your tracking information. You may also monitor your order status at any time by logging into your BritBooks account and visiting the \"My Orders\" section." },
  { q: "What is the BritBooks returns policy?", a: "We accept returns within 30 days of the delivery date, provided the item is returned in its original and resellable condition. To initiate a return, please submit a return request through your account dashboard, or contact our customer support team at customercare@britbooks.co.uk with your order number. BritBooks reserves the right to refuse returns that do not meet our eligibility requirements." },
  { q: "Who pays for return shipping?", a: "Customers are responsible for return shipping costs unless the item received was damaged, faulty, defective, or incorrectly supplied by BritBooks. Where BritBooks accepts responsibility for the issue, a prepaid return label or reimbursement of reasonable return postage costs may be provided at our discretion." },
  { q: "Which payment methods do you accept?", a: "We currently accept Visa, Mastercard, American Express, and PayPal. All transactions are processed securely using industry-standard encryption and payment security technologies. BritBooks does not store full payment card details on its servers." },
  { q: "Do you offer business or bulk purchase accounts?", a: "Yes. BritBooks offers tailored pricing, volume discounts, and priority support for educational institutions, businesses, and bulk purchasers. For a customised quotation, please contact customercare@britbooks.co.uk." },
  { q: "Can I change the email address linked to my account?", a: "For security and fraud-prevention purposes, account email addresses cannot be changed directly through the website. If you need assistance updating your registered email address, please contact our customer support team at customercare@britbooks.co.uk. Additional verification may be required before changes are processed." },
  { q: "Do you ship to Guernsey, Jersey, or the Isle of Man?", a: "Orders shipped to Guernsey, Jersey, and the Isle of Man are classified as international shipments and may be subject to different delivery times and shipping charges." },
  { q: "Who is responsible for customs duties and import taxes?", a: "International customers may be responsible for customs duties, import taxes, or local handling charges imposed by their country's authorities. These charges are outside BritBooks' control and are the sole responsibility of the recipient." },
  { q: "What happens if I provide incorrect delivery details?", a: "Customers are responsible for ensuring that delivery details are accurate at the time of purchase. BritBooks cannot accept liability for delays or losses resulting from incorrect or incomplete shipping information provided by the customer." },
];

function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.03 }}
      className={`group relative border-l-2 pl-6 sm:pl-8 py-5 sm:py-6 transition-colors ${
        open ? "border-[#0f3d2e] bg-[#faf7f2]/60" : "border-[#e6dfd0] hover:border-[#0f3d2e]/40"
      }`}
    >
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-5 text-left">
        <span
          className={`font-serif italic text-xl leading-none tabular-nums shrink-0 mt-0.5 transition-colors ${
            open ? "text-[#c1272d]" : "text-[#c9c2b1] group-hover:text-[#0f3d2e]"
          }`}
        >
          {String(i + 1).padStart(2, "0")}
        </span>
        <span
          className={`flex-1 font-serif text-lg sm:text-xl leading-snug tracking-tight ${
            open ? "text-[#1a1a1a]" : "text-[#3a3a3a] group-hover:text-[#0f3d2e]"
          }`}
        >
          {q}
        </span>
        <span
          className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            open
              ? "bg-[#0f3d2e] border-[#0f3d2e] text-white rotate-45"
              : "border-[#d8d1bf] text-[#0f3d2e] group-hover:border-[#0f3d2e]"
          }`}
        >
          <PlusIcon className="w-4 h-4" />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-4 pl-11 pr-4 text-[15px] leading-relaxed text-[#5b5546]">{a}</p>
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
  const navigate = useNavigate();
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

  // Mobile → navigate to dedicated chat page. Desktop → scroll to embedded panel.
  const openChat = () => {
    if (window.innerWidth < 640) {
      navigate("/help/chat");
    } else {
      chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const topics = [
    { icon: Package,    title: "Track an order",     copy: "Check status, dispatch and delivery updates.",  tone: "green"  },
    { icon: RotateCcw,  title: "Returns & refunds",  copy: "Send it back within 30 days, hassle-free.",     tone: "red"    },
    { icon: Truck,      title: "Shipping & delivery",copy: "UK & international rates, times and zones.",     tone: "ink"    },
    { icon: CreditCard, title: "Payment & billing",  copy: "Cards, PayPal, invoices and receipts.",          tone: "sand"   },
    { icon: UserCircle, title: "Account & sign-in",  copy: "Passwords, profile and email changes.",         tone: "green"  },
    { icon: BookOpen,   title: "Books & catalogue",  copy: "Editions, ISBNs, conditions and stock.",         tone: "red"    },
  ] as const;

  const toneStyles: Record<string, { bg: string; ring: string; icon: string; chip: string }> = {
    green: { bg: "bg-[#0f3d2e] text-[#f6f2e6]", ring: "ring-[#0f3d2e]/20", icon: "bg-[#f6f2e6] text-[#0f3d2e]", chip: "bg-[#f6f2e6]/10 text-[#f6f2e6]" },
    red:   { bg: "bg-[#c1272d] text-[#faf7f2]", ring: "ring-[#c1272d]/20", icon: "bg-[#faf7f2] text-[#c1272d]", chip: "bg-[#faf7f2]/10 text-[#faf7f2]" },
    ink:   { bg: "bg-[#1a1a1a] text-[#faf7f2]", ring: "ring-black/20",     icon: "bg-[#faf7f2] text-[#1a1a1a]", chip: "bg-[#faf7f2]/10 text-[#faf7f2]" },
    sand:  { bg: "bg-[#f0e9d6] text-[#1a1a1a]", ring: "ring-[#c1272d]/10", icon: "bg-white text-[#0f3d2e]",     chip: "bg-white/70 text-[#1a1a1a]" },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] font-sans text-[#1a1a1a]">
      <Toaster position="top-center" />
      <TopBar />

      {/* ═══════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════ */}
      <div className="sm:hidden">
        {/* Editorial hero */}
        <div className="relative px-5 pt-8 pb-10 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#0f3d2e]/5" />
          <div className="absolute top-24 -left-10 w-40 h-40 rounded-full bg-[#c1272d]/5" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c1272d]" />
              <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#5b5546]">Help desk</span>
            </div>
            <h1 className="font-serif text-[42px] leading-[1.02] tracking-tight text-[#1a1a1a] mb-3">
              How can we<br />
              <span className="italic text-[#0f3d2e]">be of service?</span>
            </h1>
            <p className="text-[15px] leading-relaxed text-[#5b5546] mb-6 max-w-xs">
              Search the archives, browse a topic, or speak with a real human on our team.
            </p>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8272]" />
              <input
                type="text"
                placeholder="Search returns, delivery, payments…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full pl-11 pr-10 py-4 bg-white border border-[#e6dfd0] rounded-full text-sm outline-none focus:border-[#0f3d2e]"
              />
              {searchQ && (
                <button onClick={() => setSearchQ("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                  <XMarkIcon className="w-4 h-4 text-[#8a8272]" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={openChat}
                className="rounded-full py-3.5 px-4 bg-[#0f3d2e] text-[#f6f2e6] text-sm font-bold flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Start chat
              </motion.button>
              <motion.a
                whileTap={{ scale: 0.96 }}
                href="mailto:customercare@britbooks.co.uk"
                className="rounded-full py-3.5 px-4 border border-[#1a1a1a] text-[#1a1a1a] text-sm font-bold flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Email us
              </motion.a>
            </div>
          </div>
        </div>

        {/* Live now strip */}
        <div className="mx-5 mb-8 flex items-center gap-3 rounded-2xl bg-[#0f3d2e] text-[#f6f2e6] px-4 py-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <p className="text-xs font-semibold flex-1">Support team is online now</p>
          <span className="text-[10px] uppercase tracking-widest opacity-80">~2 min reply</span>
        </div>

        {/* Topic mosaic */}
        <div className="px-5 mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#5b5546]">Browse topics</p>
            <span className="font-serif italic text-[#c1272d] text-sm">choose a lane →</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {topics.map((t, i) => {
              const tone = toneStyles[t.tone];
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.97 }}
                  onClick={openChat}
                  className={`relative rounded-3xl p-4 text-left ${tone.bg}`}
                >
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-3 ${tone.icon}`}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <p className="font-serif text-[15px] leading-tight mb-1">{t.title}</p>
                  <p className="text-[11px] leading-snug opacity-75">{t.copy}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Stats — quiet strip */}
        <div className="mx-5 mb-10 bg-white border border-[#e6dfd0] rounded-3xl px-5 py-6 grid grid-cols-2 gap-y-5">
          {[
            { stat: "< 2 hrs",  label: "First response" },
            { stat: "50K+",     label: "Resolved this year" },
            { stat: "2M+",      label: "Customers helped" },
            { stat: "24 / 7",   label: "Always on" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-serif text-2xl text-[#0f3d2e]">{s.stat}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#8a8272] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Meet Alex — mobile */}
        <div className="px-5 mb-10">
          <div className="rounded-3xl bg-[#0f3d2e] text-[#f6f2e6] overflow-hidden relative">
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[#c1272d]/15" />
            <div className="relative aspect-video">
              <video className="w-full h-full object-cover" autoPlay muted loop playsInline>
                <source src={VIDEO_SRC} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f3d2e] via-[#0f3d2e]/30 to-transparent" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Live</span>
              </div>
            </div>
            <div className="relative p-6 pt-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#c1272d] font-bold mb-3">The Assistant</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c1272d] to-[#8a1a20] flex items-center justify-center font-serif italic text-lg">A</div>
                <div>
                  <p className="font-serif text-2xl leading-none">Meet Alex.</p>
                  <p className="text-[11px] text-[#f6f2e6]/60 mt-1">Always-on AI assistant</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[#f6f2e6]/80 mb-4">
                Trained on the entire BritBooks catalogue and your account activity — Alex can track orders, start returns, recommend a read, and hand off to a bookseller when needed.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {[
                  { icon: Package,    label: "Track orders" },
                  { icon: RotateCcw,  label: "Start returns" },
                  { icon: BookOpen,   label: "Book picks" },
                  { icon: CreditCard, label: "Payments" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-[#f6f2e6]/80 bg-white/[0.06] rounded-xl px-3 py-2">
                    <c.icon className="w-3.5 h-3.5 text-[#f6b3b6]" /> {c.label}
                  </div>
                ))}
              </div>
              <button
                onClick={openChat}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#c1272d] text-[#faf7f2] text-sm font-bold py-3 rounded-full"
              >
                <Sparkles className="w-4 h-4" /> Chat with Alex
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}

        <div className="px-5 mb-10">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#5b5546]">Chapter three</p>
              <h2 className="font-serif text-3xl text-[#1a1a1a] mt-1">Answers, at a glance</h2>
            </div>
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="text-[#c1272d] text-xs font-bold">Clear</button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-[#e6dfd0] overflow-hidden">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} i={i} />)
            ) : (
              <div className="py-12 text-center px-4">
                <p className="text-[#8a8272] text-sm">Nothing matches that search yet.</p>
                <button onClick={openChat} className="mt-3 inline-flex items-center gap-1 text-[#0f3d2e] text-sm font-bold">
                  Ask us directly <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Still stuck footer card */}
        <div className="px-5 pb-32">
          <div className="rounded-3xl bg-[#1a1a1a] text-[#faf7f2] p-6 relative overflow-hidden">
            <Sparkles className="absolute -top-2 -right-2 w-24 h-24 text-white/5" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#c1272d] font-bold mb-2">Still stuck?</p>
            <p className="font-serif text-2xl leading-tight mb-4">A real person is one message away.</p>
            <a
              href="mailto:customercare@britbooks.co.uk"
              className="inline-flex items-center gap-2 bg-[#faf7f2] text-[#1a1a1a] text-xs font-bold px-4 py-3 rounded-full"
            >
              <Mail className="w-3.5 h-3.5" />
              customercare@britbooks.co.uk
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════════════ */}
      <div className="hidden sm:flex sm:flex-col sm:flex-1">
        {/* Editorial hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full bg-[#0f3d2e]/[0.04]" />
            <div className="absolute top-1/3 -left-24 w-[380px] h-[380px] rounded-full bg-[#c1272d]/[0.05]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-8 pt-16 pb-20">
            {/* meta strip */}
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-[#5b5546] pb-8 border-b border-[#e6dfd0]">
              <div className="flex items-center gap-8">
                <span className="font-bold">The Help Desk</span>
                <span className="hidden md:inline">Vol. 07 · Answers, kindly assembled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-emerald-700">Team online</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10 mt-14 items-start">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7">
                <p className="font-serif italic text-[#c1272d] text-xl mb-6">— Hello there.</p>
                <h1 className="font-serif text-[72px] xl:text-[92px] leading-[0.94] tracking-tight text-[#1a1a1a] mb-8">
                  How can we<br />
                  <span className="italic text-[#0f3d2e]">be of service</span><br />
                  today?
                </h1>
                <p className="text-lg leading-relaxed text-[#5b5546] mb-10 max-w-xl">
                  Every question deserves a considered reply. Search the archive, follow a chapter,
                  or ring the bell — one of our booksellers will pick up.
                </p>

                <div className="relative max-w-xl mb-6">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a8272]" />
                  <input
                    type="text"
                    placeholder="Search returns, delivery, payments, an ISBN…"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="w-full pl-16 pr-14 py-5 bg-white border border-[#e6dfd0] rounded-full text-[15px] outline-none focus:border-[#0f3d2e] shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                  />
                  {searchQ && (
                    <button
                      onClick={() => setSearchQ("")}
                      className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f6f2e6] flex items-center justify-center"
                    >
                      <XMarkIcon className="w-4 h-4 text-[#5b5546]" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={openChat}
                    className="inline-flex items-center gap-2 px-7 py-4 bg-[#0f3d2e] hover:bg-[#0a2e22] text-[#f6f2e6] text-sm font-bold rounded-full transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Speak to a bookseller
                  </button>
                  <a
                    href="mailto:customercare@britbooks.co.uk"
                    className="inline-flex items-center gap-2 px-7 py-4 border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#faf7f2] text-[#1a1a1a] text-sm font-bold rounded-full transition-colors"
                  >
                    <Mail className="w-4 h-4" /> customercare@britbooks.co.uk
                  </a>
                </div>
              </motion.div>

              {/* Newsletter-style callout column */}
              <motion.aside
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-[#e6dfd0]"
              >
                <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-[#5b5546] mb-4">Today's dispatch</p>
                <div className="space-y-6">
                  {[
                    { k: "01", t: "New: track an order without signing in", s: "Enter your order number and postcode for a full timeline." },
                    { k: "02", t: "30-day returns — no questions asked", s: "Original condition, printable label, refunded within 5 working days." },
                    { k: "03", t: "Bulk & institution accounts", s: "Volume pricing and dedicated support for schools and businesses." },
                  ].map((n) => (
                    <div key={n.k} className="flex gap-5">
                      <span className="font-serif italic text-2xl text-[#c1272d] leading-none mt-1">{n.k}</span>
                      <div>
                        <p className="font-serif text-lg leading-snug text-[#1a1a1a]">{n.t}</p>
                        <p className="text-sm text-[#5b5546] mt-1 leading-relaxed">{n.s}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.aside>
            </div>
          </div>
        </section>

        {/* Topic mosaic — asymmetric */}
        <section className="bg-[#f6f2e6] border-y border-[#e6dfd0]">
          <div className="max-w-7xl mx-auto px-8 py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-[#5b5546] mb-3">Chapter one</p>
                <h2 className="font-serif text-5xl text-[#1a1a1a] tracking-tight">Choose a lane.</h2>
              </div>
              <p className="text-sm text-[#5b5546] max-w-sm hidden md:block">
                Six familiar aisles. Tap one to jump straight into a live conversation with our team.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-4 auto-rows-[180px]">
              {topics.map((t, i) => {
                const tone = toneStyles[t.tone];
                const spans = [
                  "col-span-12 md:col-span-5 row-span-2",
                  "col-span-6 md:col-span-4",
                  "col-span-6 md:col-span-3",
                  "col-span-6 md:col-span-3",
                  "col-span-6 md:col-span-4",
                  "col-span-12 md:col-span-5",
                ];
                return (
                  <motion.button
                    key={i}
                    onClick={openChat}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    className={`${spans[i]} ${tone.bg} rounded-3xl p-7 text-left relative overflow-hidden transition-shadow shadow-sm hover:shadow-xl`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tone.icon}`}>
                        <t.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] uppercase tracking-[0.28em] px-3 py-1.5 rounded-full ${tone.chip}`}>
                        0{i + 1}
                      </span>
                    </div>
                    <p className="font-serif text-2xl leading-tight mb-2">{t.title}</p>
                    <p className="text-sm opacity-80 leading-relaxed max-w-xs">{t.copy}</p>
                    <ArrowRightIcon className="absolute bottom-6 right-6 w-5 h-5 opacity-60" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Meet Alex — AI assistant */}
        <section className="bg-[#0f3d2e] text-[#f6f2e6] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-[#c1272d]/10" />
            <div className="absolute bottom-0 -left-20 w-[360px] h-[360px] rounded-full bg-[#f6f2e6]/[0.04]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-8 py-24 grid lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-[2rem] overflow-hidden mb-8 border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
                style={{ aspectRatio: "1 / 1" }}
              >
                <video className="w-full h-full object-cover" autoPlay muted loop playsInline>
                  <source src={VIDEO_SRC} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a2b20] via-[#0a2b20]/20 to-transparent" />
                <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#f6f2e6]">Live · always on</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-[#f6f2e6]/70 font-bold">AI · v4</span>
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#c1272d] to-[#8a1a20] flex items-center justify-center text-lg font-serif italic text-[#f6f2e6] border-2 border-[#0a2b20]">A</div>
                  <div>
                    <p className="font-serif text-[#f6f2e6] text-lg leading-none">Alex</p>
                    <p className="text-[11px] text-[#f6f2e6]/70 mt-1">Ready to chat</p>
                  </div>
                </div>
              </motion.div>

              <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-[#c1272d] mb-4">The Assistant</p>
              <h2 className="font-serif text-5xl tracking-tight leading-none mb-3">Meet Alex.</h2>
              <p className="text-sm text-[#f6f2e6]/60 mb-6">Your always-on BritBooks assistant</p>
              <p className="text-lg leading-relaxed text-[#f6f2e6]/80 mb-8">
                Alex is our in-house AI assistant — trained on the entire BritBooks catalogue, our shipping and returns policy, and your account activity. Ask anything, any hour, in plain English.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openChat}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#c1272d] hover:bg-[#a51e24] text-[#faf7f2] rounded-full text-sm font-bold transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> Chat with Alex
                </button>
                <div className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/5 border border-white/10 rounded-full text-xs text-[#f6f2e6]/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Trained on BritBooks · updated daily
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-[#f6f2e6]/50 mb-6">What Alex can help with</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Package,    title: "Track your orders",       copy: "Live dispatch, courier and delivery updates — no login required if you have the order number." },
                  { icon: RotateCcw,  title: "Start a return or refund", copy: "Guided returns flow — Alex checks eligibility, prints a label, and books the pickup." },
                  { icon: BookOpen,   title: "Recommend a book",         copy: "By author, genre, mood or reading level — from our 2M+ title catalogue." },
                  { icon: CreditCard, title: "Explain a payment",        copy: "Reconcile invoices, resend receipts, walk you through a refund status." },
                  { icon: UserCircle, title: "Fix account issues",       copy: "Reset your password, verify identity, update your delivery address safely." },
                  { icon: LifeBuoy,   title: "Escalate to a human",      copy: "Anything Alex can't confidently resolve is handed to a bookseller — with full context." },
                ].map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#c1272d]/20 text-[#f6b3b6] flex items-center justify-center shrink-0">
                        <c.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-serif text-lg leading-tight mb-1">{c.title}</p>
                        <p className="text-sm text-[#f6f2e6]/65 leading-relaxed">{c.copy}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 text-xs text-[#f6f2e6]/55">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Alex never asks for card details or passwords · replies logged for quality.
              </div>
            </div>
          </div>
        </section>

        {/* Live chat panel */}
        <section ref={chatSectionRef} className="bg-[#faf7f2]">
          <div className="max-w-7xl mx-auto px-8 py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-[#5b5546] mb-3">Chapter two</p>
                <h2 className="font-serif text-5xl text-[#1a1a1a] tracking-tight">The correspondence desk.</h2>
                <p className="text-[#5b5546] text-base mt-3 max-w-xl">
                  Chat with <span className="italic text-[#0f3d2e]">Alex</span> around the clock, or continue a thread with a real bookseller during opening hours.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e6dfd0]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700">Currently online</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[28px] overflow-hidden border border-[#e6dfd0] shadow-[0_30px_60px_-30px_rgba(15,61,46,0.25)] bg-white"
              style={{ height: "680px" }}
            >
              <DesktopChatPanel
                userId={auth.user?.userId}
                token={auth.token ?? undefined}
                newChatTrigger={0}
                shared={chatShared}
                onSharedChange={updateChatShared}
              />
            </motion.div>
          </div>
        </section>

        {/* FAQ — two column editorial */}
        <section className="bg-[#f6f2e6] border-y border-[#e6dfd0]">
          <div className="max-w-7xl mx-auto px-8 py-20">
            <div className="grid lg:grid-cols-12 gap-16">
              <aside className="lg:col-span-4">
                <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-[#5b5546] mb-3">Chapter three</p>
                <h2 className="font-serif text-5xl text-[#1a1a1a] tracking-tight leading-tight mb-6">
                  Frequently<br />asked, <span className="italic text-[#c1272d]">kindly answered.</span>
                </h2>
                <p className="text-[#5b5546] leading-relaxed mb-8">
                  Ten quick reads covering the questions we hear most. Anything else — the chat desk is only a click away.
                </p>
                <div className="p-6 rounded-3xl bg-white border border-[#e6dfd0]">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { stat: "< 2 hrs",  label: "First response" },
                      { stat: "50K+",     label: "Resolved this year" },
                      { stat: "2M+",      label: "Customers helped" },
                      { stat: "24 / 7",   label: "Always available" },
                    ].map((s, i) => (
                      <div key={i}>
                        <p className="font-serif text-3xl text-[#0f3d2e] leading-none">{s.stat}</p>
                        <p className="text-[10px] uppercase tracking-widest text-[#8a8272] mt-2">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="lg:col-span-8">
                {searchQ && (
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-[#5b5546]">Showing results for <span className="italic text-[#0f3d2e]">"{searchQ}"</span></p>
                    <button onClick={() => setSearchQ("")} className="text-[#c1272d] text-xs font-bold uppercase tracking-widest">Clear</button>
                  </div>
                )}
                <div className="bg-white rounded-3xl border border-[#e6dfd0] overflow-hidden">
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} i={i} />)
                  ) : (
                    <div className="py-20 text-center px-8">
                      <p className="font-serif text-2xl text-[#1a1a1a] mb-2">No entries yet in this section.</p>
                      <p className="text-[#5b5546] mb-6">Ask the desk directly — we'll happily add it to the shelf.</p>
                      <button
                        onClick={openChat}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f3d2e] text-[#f6f2e6] text-sm font-bold"
                      >
                        Start a conversation <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom "still stuck" band */}
        <section className="bg-[#1a1a1a] text-[#faf7f2] relative overflow-hidden">
          <Sparkles className="absolute -top-6 -right-6 w-40 h-40 text-white/5" />
          <div className="max-w-7xl mx-auto px-8 py-20 grid lg:grid-cols-12 gap-10 items-center relative">
            <div className="lg:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-[#c1272d] mb-4">Postscript</p>
              <h3 className="font-serif text-5xl leading-tight tracking-tight mb-4">
                Still stuck on a page?<br />
                <span className="italic text-[#f6f2e6]/70">A real person is one message away.</span>
              </h3>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3">
              <button
                onClick={openChat}
                className="w-full inline-flex items-center justify-between px-6 py-5 rounded-2xl bg-[#c1272d] hover:bg-[#a51e24] transition-colors"
              >
                <span className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-bold">Open the chat desk</span>
                </span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
              <Link
                to="/contact"
                className="w-full inline-flex items-center justify-between px-6 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Mail className="w-5 h-5" />
                  <span className="font-bold">Send a considered email</span>
                </span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* Mobile FAB */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        onClick={openChat}
        className="fixed bottom-6 right-5 w-14 h-14 bg-[#0f3d2e] rounded-full shadow-xl flex items-center justify-center z-40 sm:hidden"
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-[#f6f2e6]" />
      </motion.button>
    </div>
  );
}
