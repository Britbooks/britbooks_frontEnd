import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Download, Search, CheckCircle2,
  Clock3, XCircle, ChevronDown, ArrowUpRight,
  ChevronLeft, ChevronRight, ShieldCheck, BookMarked,
  Bookmark, Receipt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import SEOHead from "../components/SEOHead";

const API_BASE      = import.meta.env.VITE_API_URL ?? "https://britbooks-api-production-8ebd.up.railway.app";
const ITEMS_PER_PAGE = 6;
const NAVY           = "#0A1628";
const GOLD           = "#C9A84C";
const CREAM          = "#FAF7F2";

interface Invoice {
  invoiceId:   string;
  orderId:     string;
  total:       number;
  currency:    string;
  status:      "paid" | "pending" | "cancelled";
  paidAt:      string;
  createdAt:   string;
  itemCount:   number;
  downloadUrl: string;
}

const fmtGBP  = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

const fmtShort = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_MAP = {
  paid:      { label: "Paid",      Icon: CheckCircle2, color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
  pending:   { label: "Pending",   Icon: Clock3,       color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  cancelled: { label: "Cancelled", Icon: XCircle,      color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
};

const FILTERS = [
  { key: "all",       label: "All"       },
  { key: "paid",      label: "Paid"      },
  { key: "pending",   label: "Pending"   },
  { key: "cancelled", label: "Cancelled" },
] as const;

/* ── status pill ─────────────────────────────────────────── */
function StatusPill({ status }: { status: Invoice["status"] }) {
  const s    = STATUS_MAP[status] ?? STATUS_MAP.pending;
  const Icon = s.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

/* ── invoice card ────────────────────────────────────────── */
function InvoiceCard({ inv, index, isOpen, onToggle, onDownload, onViewOrder }: {
  inv: Invoice; index: number; isOpen: boolean;
  onToggle: () => void; onDownload: () => void; onViewOrder: () => void;
}) {
  const subtotal = inv.total * 0.8333;
  const vat      = inv.total * 0.1667;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        border:     `1.5px solid ${isOpen ? NAVY : "#E7E3DC"}`,
        boxShadow:  isOpen
          ? "0 8px 40px rgba(10,22,40,0.10)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* ── header row ── */}
      <button onClick={onToggle} className="w-full text-left group">
        <div className="flex items-stretch">
          {/* Book-spine accent */}
          <div
            className="w-1.5 flex-shrink-0 transition-colors duration-300"
            style={{ background: isOpen ? GOLD : "#E7E3DC" }}
          />

          <div className="flex items-center gap-4 px-5 py-4 flex-1">
            {/* Book icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isOpen ? `${NAVY}0D` : CREAM }}
            >
              <BookOpen size={18} style={{ color: isOpen ? NAVY : "#9CA3AF" }} />
            </div>

            {/* Invoice ref + date */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                Receipt
              </p>
              <p className="text-sm font-black text-gray-900 leading-tight">
                #{inv.invoiceId.slice(-10).toUpperCase()}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtShort(inv.paidAt || inv.createdAt)}</p>
            </div>

            {/* Items badge — hidden on mobile */}
            <div className="hidden sm:flex flex-col items-center flex-shrink-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Books</p>
              <div className="flex items-center gap-1">
                <Bookmark size={11} style={{ color: GOLD }} />
                <span className="text-sm font-bold text-gray-700">{inv.itemCount}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              <StatusPill status={inv.status} />
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0 min-w-[70px]">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Total</p>
              <p className="text-lg font-black" style={{ color: NAVY }}>{fmtGBP(inv.total)}</p>
            </div>

            {/* Chevron */}
            <ChevronDown
              size={16}
              strokeWidth={2.5}
              style={{
                color:     isOpen ? GOLD : "#D1D5DB",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s, color 0.2s",
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </button>

      {/* ── expanded detail ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {/* Dashed separator */}
            <div className="mx-6 border-t border-dashed border-gray-200" />

            <div className="px-6 py-5 grid sm:grid-cols-2 gap-6">
              {/* ── left: info + actions ── */}
              <div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      Order Ref
                    </p>
                    <p className="text-xs font-black text-gray-800 font-mono">
                      #{inv.orderId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      Issued
                    </p>
                    <p className="text-xs text-gray-700">{fmtDate(inv.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      Books
                    </p>
                    <p className="text-xs font-bold text-gray-700">{inv.itemCount} title{inv.itemCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      Status
                    </p>
                    <StatusPill status={inv.status} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onDownload}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide text-white"
                    style={{ background: NAVY }}
                  >
                    <Download size={13} /> Download PDF
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onViewOrder}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    View Order <ArrowUpRight size={13} />
                  </motion.button>
                </div>
              </div>

              {/* ── right: VAT breakdown ── */}
              <div
                className="rounded-xl p-4"
                style={{ background: CREAM, border: "1px solid #E7E3DC" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Receipt size={14} style={{ color: GOLD }} />
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                    VAT Receipt
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm py-2 border-b border-[#E7E3DC]">
                    <span className="text-gray-500">Subtotal (excl. VAT)</span>
                    <span className="font-bold text-gray-800">{fmtGBP(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-[#E7E3DC]">
                    <span className="text-gray-500">VAT @ 20%</span>
                    <span className="font-bold text-gray-800">{fmtGBP(vat)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: NAVY }}>
                      Total Paid
                    </span>
                    <span className="text-xl font-black" style={{ color: NAVY }}>
                      {fmtGBP(inv.total)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[#E7E3DC]">
                  <ShieldCheck size={11} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] text-gray-400">
                    UK VAT-compliant · BritBooks Ltd · VAT GB 123 456 789
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── skeleton ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-3">
      {[0.1, 0.2, 0.3, 0.4].map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: d }}
          className="bg-white rounded-2xl border border-[#E7E3DC] overflow-hidden"
        >
          <div className="flex items-stretch">
            <div className="w-1.5 bg-[#E7E3DC]" />
            <div className="flex items-center gap-4 px-5 py-4 flex-1 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 bg-gray-100 rounded w-1/5" />
                <div className="h-4 bg-gray-100 rounded w-2/5" />
                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-6 bg-gray-100 rounded-full w-14" />
              <div className="h-5 bg-gray-100 rounded w-16" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── empty state ─────────────────────────────────────────── */
function EmptyState({ search, filter }: { search: string; filter: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-[#E7E3DC] py-20 flex flex-col items-center gap-4 text-center px-6"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: CREAM }}
      >
        <BookMarked size={32} style={{ color: "#C4B99A" }} />
      </div>
      <div>
        <p className="font-black text-gray-800 text-lg mb-1">
          {search || filter !== "all" ? "No matching receipts" : "No receipts yet"}
        </p>
        <p className="text-gray-400 text-sm max-w-xs">
          {search || filter !== "all"
            ? "Try clearing your search or changing the filter."
            : "Your receipts will appear here after your first purchase. Happy reading!"}
        </p>
      </div>
    </motion.div>
  );
}

/* ── main page ───────────────────────────────────────────── */
export default function InvoicesPage() {
  const { auth }  = useAuth();
  const navigate  = useNavigate();

  const [invoices,     setInvoices]     = useState<Invoice[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [currentPage,  setCurrentPage]  = useState(1);

  useEffect(() => {
    if (!auth?.token || !auth?.userId) { setLoading(false); return; }
    axios
      .get(`${API_BASE}/api/invoices/user/${auth.userId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      .then(res => setInvoices(res.data?.data ?? []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [auth]);

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchQ = inv.invoiceId.toLowerCase().includes(search.toLowerCase());
    const matchF = activeFilter === "all" || inv.status === activeFilter;
    return matchQ && matchF;
  }), [invoices, search, activeFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(s, s + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, activeFilter]);

  const totalSpent = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  const handleExportCSV = () => {
    if (!invoices.length) return;
    const headers = ["Invoice ID", "Order ID", "Date", "Status", "Items", "Total (GBP)"];
    const rows = invoices.map(inv => [
      inv.invoiceId,
      inv.orderId,
      new Date(inv.createdAt).toLocaleDateString("en-GB"),
      inv.status,
      inv.itemCount,
      inv.total.toFixed(2),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), {
      href:     url,
      download: `britbooks-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (url: string, id: string) => {
    try {
      const res = await axios.get(`${API_BASE}${url}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
        responseType: "blob",
      });
      const a = Object.assign(document.createElement("a"), {
        href:     window.URL.createObjectURL(new Blob([res.data])),
        download: `britbooks-receipt-${id.slice(-6)}.pdf`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("PDF download failed", e);
    }
  };

  if (!auth?.token) return <AuthWall navigate={navigate} />;

  return (
    <div className="min-h-screen font-sans" style={{ background: CREAM }}>
      <SEOHead
        title="My Receipts · BritBooks"
        description="View and download your BritBooks purchase receipts."
        canonical="/invoices"
        noindex
      />
      <TopBar />

      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden" style={{ background: NAVY }}>
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-5"
          style={{ background: GOLD }} />
        <div className="absolute top-8 -left-20 w-48 h-48 rounded-full opacity-[0.03]"
          style={{ background: "#fff" }} />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 pt-10 pb-0">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-5"
          >
            <div className="h-px w-6" style={{ background: GOLD }} />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: GOLD }}>
              My Account
            </span>
          </motion.div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <BookOpen size={28} style={{ color: GOLD }} />
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  Purchase Receipts
                </h1>
              </div>
              <p className="text-white/40 text-sm font-medium pl-10">
                Your reading journey, documented.
              </p>
            </motion.div>

            {/* Stats — only when data is loaded */}
            {!loading && invoices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex gap-3 pb-1"
              >
                <div
                  className="rounded-2xl px-5 py-4 text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Receipts
                  </p>
                  <p className="text-3xl font-black text-white">{invoices.length}</p>
                </div>
                <div
                  className="rounded-2xl px-5 py-4 text-center"
                  style={{ background: "rgba(201,168,76,0.1)", border: `1px solid rgba(201,168,76,0.2)` }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: `${GOLD}99` }}>
                    Total Spent
                  </p>
                  <p className="text-3xl font-black" style={{ color: GOLD }}>{fmtGBP(totalSpent)}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Curved edge */}
        <div className="h-10 rounded-t-[2rem] mt-6" style={{ background: CREAM }} />
      </div>

      {/* ═══ CONTENT ═══ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pb-24 -mt-2">

        {/* Search + filter strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-5"
        >
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by receipt ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm font-medium border border-[#E7E3DC] focus:outline-none focus:border-gray-400 shadow-sm placeholder:text-gray-300 transition-colors"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => {
              const active = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all"
                  style={{
                    background: active ? NAVY : "#fff",
                    color:      active ? "#fff" : "#9CA3AF",
                    border:     `1.5px solid ${active ? NAVY : "#E7E3DC"}`,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Result count */}
        {!loading && (
          <p className="text-xs text-gray-400 font-semibold mb-4">
            {filtered.length === 0
              ? "No results"
              : `${filtered.length} receipt${filtered.length !== 1 ? "s" : ""}${activeFilter !== "all" && STATUS_MAP[activeFilter as keyof typeof STATUS_MAP] ? ` · ${STATUS_MAP[activeFilter as keyof typeof STATUS_MAP].label}` : ""}`
            }
          </p>
        )}

        {/* Body */}
        {loading ? (
          <Skeleton />
        ) : paginated.length === 0 ? (
          <EmptyState search={search} filter={activeFilter} />
        ) : (
          <div className="space-y-3">
            {paginated.map((inv, i) => (
              <InvoiceCard
                key={inv.invoiceId}
                inv={inv}
                index={i}
                isOpen={expandedId === inv.invoiceId}
                onToggle={() => setExpandedId(expandedId === inv.invoiceId ? null : inv.invoiceId)}
                onDownload={() => handleDownload(inv.downloadUrl, inv.invoiceId)}
                onViewOrder={() => navigate(`/order/${inv.orderId}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-center justify-center gap-2"
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-gray-400 border border-[#E7E3DC] hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className="w-9 h-9 rounded-xl text-xs font-black transition-all"
                style={{
                  background: p === currentPage ? NAVY : "#fff",
                  color:      p === currentPage ? "#fff" : "#9CA3AF",
                  border:     `1.5px solid ${p === currentPage ? NAVY : "#E7E3DC"}`,
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-gray-400 border border-[#E7E3DC] hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Footer strip */}
        <div className="mt-14 pt-6 border-t border-[#E7E3DC] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Need a full export?{" "}
            <span className="font-bold cursor-pointer hover:underline" style={{ color: NAVY }} onClick={handleExportCSV}>
              Request CSV
            </span>
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold">
            <ShieldCheck size={12} className="text-emerald-500" />
            BritBooks Ltd · VAT GB 123 456 789
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ── auth wall ───────────────────────────────────────────── */
function AuthWall({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: CREAM }}>
      <SEOHead title="My Receipts · BritBooks" description="View your BritBooks receipts." canonical="/invoices" noindex />
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ background: NAVY }}
          >
            <BookOpen size={32} style={{ color: GOLD }} />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: NAVY }}>
            Sign in to view receipts
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-10 text-base leading-relaxed">
            Your purchase receipts and billing history are available once you're signed in.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white"
            style={{ background: NAVY }}
          >
            Sign In
          </motion.button>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
