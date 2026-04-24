import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Search, ChevronDown, CheckCircle,
  Clock, AlertCircle, ArrowLeftRight, Wallet, Info, Package
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import axios from "axios";
import SEOHead from '../components/SEOHead';

const API = import.meta.env.VITE_API_URL ?? "https://api.britbooks.co.uk";

type SlipStatus = "available" | "used" | "expired" | "pending";
type SlipType = "refund" | "return" | "goodwill" | "promotional";

interface CreditSlip {
  id: string;
  code: string;
  type: SlipType;
  amount: number;
  issuedAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  status: SlipStatus;
  reason: string;
  orderId?: string;
}

const STATUS_META: Record<SlipStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  available: { label: "Available",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle size={13} /> },
  pending:   { label: "Processing", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: <Clock size={13} /> },
  used:      { label: "Used",       color: "text-gray-500",    bg: "bg-gray-50 border-gray-200",       icon: <ArrowLeftRight size={13} /> },
  expired:   { label: "Expired",    color: "text-red-600",     bg: "bg-red-50 border-red-200",         icon: <AlertCircle size={13} /> },
};

const TYPE_META: Record<SlipType, { label: string; color: string; bg: string }> = {
  refund:      { label: "Refund",      color: "text-blue-700",   bg: "bg-blue-50" },
  return:      { label: "Return",      color: "text-purple-700", bg: "bg-purple-50" },
  goodwill:    { label: "Goodwill",    color: "text-pink-700",   bg: "bg-pink-50" },
  promotional: { label: "Promotional", color: "text-amber-700",  bg: "bg-amber-50" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return `£${n.toFixed(2)}`;
}

function daysUntilExpiry(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function buildMockSlips(orders: any[]): CreditSlip[] {
  const refunds = orders.filter(o => o.status === "refunded" || o.paymentStatus === "refunded");
  return refunds.map((o, i) => ({
    id: o._id ?? String(i),
    code: `BRIT-${String(o._id ?? i).slice(-6).toUpperCase()}`,
    type: "refund" as SlipType,
    amount: parseFloat(o.totalAmount) || 0,
    issuedAt: o.updatedAt ?? o.createdAt ?? new Date().toISOString(),
    expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
    usedAt: null,
    status: "available" as SlipStatus,
    reason: "Order refund processed",
    orderId: o._id,
  }));
}

export default function CreditSlipsPage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [slips, setSlips] = useState<CreditSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.token) { setLoading(false); return; }
    axios
      .get(`${API}/api/orders`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(res => {
        const orders = res.data?.orders ?? res.data ?? [];
        setSlips(buildMockSlips(orders));
      })
      .catch(() => setSlips([]))
      .finally(() => setLoading(false));
  }, [auth?.token]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (!auth?.token) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-6">
          <CreditCard size={48} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Sign in to view credit slips</h2>
          <p className="text-gray-500 mb-6">Your refunds and store credit are linked to your account.</p>
          <button onClick={() => navigate("/login")} className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all">
            Sign in
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = slips.filter(s => {
    const matchSearch = search === "" || s.code.toLowerCase().includes(search.toLowerCase()) || s.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const availableTotal = slips.filter(s => s.status === "available").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-white font-sans">
      <SEOHead title="Credit Slips" description="View your BritBooks credit slips and refunds." canonical="/credits" noindex={true} />
      <TopBar />

      {/* ── Hero ── */}
      <div className="relative bg-[#0d1b3e] text-white px-6 py-16 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute -top-20 right-0 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating credit card illustration — desktop */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none select-none">
          {/* Credit card */}
          <motion.div
            initial={{ opacity: 0, rotateY: 40, y: 20 }}
            animate={{ opacity: 1, rotateY: 0, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-56 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700 shadow-2xl p-5 relative overflow-hidden"
          >
            {/* card shimmer */}
            <motion.div
              animate={{ x: [-200, 300] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-6 rounded-md bg-amber-300/80" />
              <Wallet size={16} className="text-white/60" />
            </div>
            <div className="text-white font-mono text-xs tracking-widest opacity-80">BRIT ···· ···· 4821</div>
            <div className="flex justify-between items-end mt-1">
              <div className="h-1.5 w-20 bg-white/30 rounded-full" />
              <div className="text-white/80 text-[10px] font-semibold">STORE CREDIT</div>
            </div>
          </motion.div>

          {/* Floating voucher chip */}
          <motion.div
            animate={{ y: [0, -9, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-20 top-4 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 flex items-center gap-2"
          >
            <div className="w-7 h-7 bg-emerald-400/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={13} className="text-emerald-300" />
            </div>
            <div>
              <div className="text-white text-xs font-black">Available</div>
              <div className="h-1 w-10 bg-white/20 rounded-full mt-1" />
            </div>
          </motion.div>

          {/* Floating amount chip */}
          <motion.div
            animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="absolute -left-14 bottom-4 bg-white/10 border border-white/20 rounded-2xl px-3 py-2 flex items-center gap-1.5"
          >
            <span className="text-emerald-300 font-black text-sm">
              {slips.length > 0 ? formatCurrency(availableTotal) : "£0.00"}
            </span>
            <span className="text-white/70 text-xs">credit</span>
          </motion.div>

          {/* Sparkle dots */}
          {[
            { top: "-12px", right: "60px", delay: 0 },
            { top: "10px",  right: "-10px", delay: 0.5 },
            { top: "90px",  right: "-14px", delay: 1.0 },
          ].map((pos, i) => (
            <motion.div key={i}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: pos.delay, repeatDelay: 1.5 }}
              style={{ top: pos.top, right: pos.right }}
              className="absolute w-3 h-3 bg-amber-300 rounded-full"
            />
          ))}
        </div>

        {/* Text + stats */}
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5"
          >
            <Wallet size={13} className="text-violet-300" />
            <span className="text-xs font-bold tracking-widest uppercase text-white/80">Account</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl font-black mb-3 tracking-tight"
          >Credit Slips</motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/80 text-base max-w-md"
          >View refunds, returns credit, and goodwill vouchers issued to your account.</motion.p>

          {slips.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 mt-8"
            >
              {[
                { value: formatCurrency(availableTotal),                               label: "Available credit", icon: <Wallet size={14} /> },
                { value: String(slips.filter(s => s.status === "available").length),   label: "Active slips",    icon: <CheckCircle size={14} /> },
                { value: String(slips.length),                                         label: "Total issued",    icon: <CreditCard size={14} /> },
              ].map((s, i) => (
                <motion.div key={i} whileHover={{ scale: 1.04 }}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3 cursor-default transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-violet-300">{s.icon}</div>
                  <div>
                    <div className="text-xl font-black leading-none">{s.value}</div>
                    <div className="text-white/70 text-xs mt-0.5">{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Search + filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or reason…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              {filterStatus === "all" ? "All statuses" : STATUS_META[filterStatus as SlipStatus]?.label}
              <ChevronDown size={14} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl z-20 py-1 min-w-[150px]">
                {["all", "available", "pending", "used", "expired"].map(s => (
                  <button
                    key={s}
                    onClick={() => { setFilterStatus(s); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-all ${filterStatus === s ? "text-indigo-700" : "text-gray-700"}`}
                  >
                    {s === "all" ? "All statuses" : STATUS_META[s as SlipStatus]?.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="rounded-3xl border border-gray-100 p-6 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-5 w-48 bg-gray-100 rounded-lg" />
                  <div className="h-5 w-20 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-4 w-64 bg-gray-100 rounded-lg mt-3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CreditCard size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-black text-gray-800 mb-1">
              {slips.length === 0 ? "No credit slips yet" : "No matching credit slips"}
            </h3>
            <p className="text-gray-400 text-sm">
              {slips.length === 0
                ? "Refunds and return credits will appear here when processed."
                : "Try adjusting your search or filter."}
            </p>
            {slips.length === 0 && (
              <button onClick={() => navigate("/orders")} className="mt-6 px-5 py-2.5 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all">
                View orders
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((slip, idx) => {
              const stickyMeta = STATUS_META[slip.status];
              const typeMeta = TYPE_META[slip.type];
              const days = slip.expiresAt ? daysUntilExpiry(slip.expiresAt) : null;
              const expiringSoon = days !== null && days <= 30 && slip.status === "available";

              return (
                <motion.div
                  key={slip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`rounded-3xl border bg-white shadow-sm overflow-hidden ${expiringSoon ? "border-amber-200" : "border-gray-100"}`}
                >
                  <div className="px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Amount circle */}
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${slip.status === "available" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                        <span className="text-[10px] font-bold leading-none">£</span>
                        <span className="text-lg font-black leading-none">{slip.amount.toFixed(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-900">{formatCurrency(slip.amount)} credit</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeMeta.bg} ${typeMeta.color}`}>{typeMeta.label}</span>
                          <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${stickyMeta.bg} ${stickyMeta.color}`}>
                            {stickyMeta.icon}{stickyMeta.label}
                          </span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">{slip.reason}</div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          <span>Issued {formatDate(slip.issuedAt)}</span>
                          {slip.expiresAt && <span className={expiringSoon ? "text-amber-600 font-semibold" : ""}>
                            {slip.status === "available" && days !== null
                              ? days <= 0 ? "Expired" : days <= 30 ? `Expires in ${days} day${days !== 1 ? "s" : ""}` : `Expires ${formatDate(slip.expiresAt)}`
                              : `Expired ${formatDate(slip.expiresAt)}`}
                          </span>}
                          {slip.usedAt && <span>Used {formatDate(slip.usedAt)}</span>}
                          {slip.orderId && <span>Order #{slip.orderId.slice(-6).toUpperCase()}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Code + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {slip.status === "available" && (
                        <>
                          <div className="font-mono text-sm font-black text-gray-800 bg-gray-100 px-4 py-2 rounded-xl tracking-wider">
                            {slip.code}
                          </div>
                          <button
                            onClick={() => handleCopy(slip.code)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${copied === slip.code ? "bg-emerald-100 text-emerald-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                          >
                            {copied === slip.code ? "Copied!" : "Copy code"}
                          </button>
                        </>
                      )}
                      {slip.orderId && (
                        <button
                          onClick={() => navigate(`/order/${slip.orderId}`)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 font-semibold transition-all"
                        >
                          <Package size={11} /> View order
                        </button>
                      )}
                    </div>
                  </div>

                  {expiringSoon && (
                    <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-700 font-semibold">
                      <Clock size={12} />
                      This credit expires in {days} day{days !== 1 ? "s" : ""}. Use it at checkout before it's gone.
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* How to use */}
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm mb-1">How to use your credit</div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Enter your credit slip code in the <strong>Discount code</strong> field at checkout. It will be applied automatically to your order total.
              </p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Info size={16} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm mb-1">Questions about your credit?</div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Contact our team at <a href="mailto:support@britbooks.co.uk" className="text-indigo-600 font-semibold hover:underline">support@britbooks.co.uk</a> — quote your slip code and we'll look into it right away.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
