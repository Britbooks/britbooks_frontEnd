import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, Download, Search, Filter, ChevronDown,
  Package, CheckCircle, Clock, AlertCircle, ExternalLink, Receipt,
  TrendingUp, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL ?? "https://api.britbooks.co.uk";

interface InvoiceItem {
  title: string;
  author: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  invoiceNumber: string;
  orderId: string;
  createdAt: string;
  status: "paid" | "pending" | "refunded" | "cancelled";
  items: InvoiceItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

const STATUS_META: Record<Invoice["status"], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  paid:      { label: "Paid",      color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle size={13} /> },
  pending:   { label: "Pending",   color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: <Clock size={13} /> },
  refunded:  { label: "Refunded",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       icon: <Receipt size={13} /> },
  cancelled: { label: "Cancelled", color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <AlertCircle size={13} /> },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatCurrency(n: number) {
  return `£${n.toFixed(2)}`;
}

function buildMockInvoices(orders: any[]): Invoice[] {
  return orders.map((o, i) => {
    const items: InvoiceItem[] = (o.items ?? []).map((it: any) => ({
      title: it.title ?? "Book",
      author: it.author ?? "Unknown",
      quantity: it.quantity ?? 1,
      unitPrice: parseFloat(it.price) || 0,
    }));
    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const shipping = subtotal > 25 ? 0 : 2.99;
    const discount = o.discountAmount ? parseFloat(o.discountAmount) : 0;
    return {
      invoiceNumber: `INV-${String(o._id ?? i).slice(-6).toUpperCase()}`,
      orderId: o._id ?? String(i),
      createdAt: o.createdAt ?? new Date().toISOString(),
      status: (o.paymentStatus ?? o.status ?? "paid") as Invoice["status"],
      items,
      subtotal,
      shipping,
      discount,
      total: subtotal + shipping - discount,
      paymentMethod: o.paymentMethod ?? "Card",
    };
  });
}

export default function InvoicesPage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!auth?.token) { setLoading(false); return; }
    axios
      .get(`${API}/api/orders`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(res => setInvoices(buildMockInvoices(res.data?.orders ?? res.data ?? [])))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [auth?.token]);

  if (!auth?.token) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-6">
          <FileText size={48} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Sign in to view invoices</h2>
          <p className="text-gray-500 mb-6">Your purchase invoices are linked to your account.</p>
          <button onClick={() => navigate("/login")} className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all">
            Sign in
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = search === "" || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || inv.items.some(it => it.title.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalSpend = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <div className="min-h-screen bg-white font-sans">
      <TopBar />

      {/* ── Hero ── */}
      <div className="relative bg-[#0d1b3e] text-white px-6 py-16 overflow-hidden">
        {/* Background glows */}
        <div className="absolute -top-28 -right-28 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating invoice illustration — desktop only */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none select-none">
          {/* Main receipt card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="relative w-52 h-64 bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-5 shadow-2xl"
          >
            {/* header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-indigo-500 flex items-center justify-center">
                <FileText size={13} className="text-white" />
              </div>
              <div>
                <div className="h-2 w-20 bg-white/40 rounded-full" />
                <div className="h-1.5 w-12 bg-white/20 rounded-full mt-1" />
              </div>
            </div>
            {/* line items */}
            {[82, 58, 70, 48].map((w, i) => (
              <motion.div key={i}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 + i * 0.1, ease: "easeOut" }}
                style={{ transformOrigin: "left" }}
                className="flex items-center gap-2 mb-2.5"
              >
                <div className="h-1.5 bg-white/25 rounded-full" style={{ width: `${w}%` }} />
                <div className="h-1.5 w-8 bg-indigo-400/60 rounded-full ml-auto flex-shrink-0" />
              </motion.div>
            ))}
            {/* total */}
            <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center">
              <div className="h-2 w-10 bg-white/30 rounded-full" />
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="text-sm font-black">£24.99</motion.span>
            </div>
            {/* Paid stamp */}
            <motion.div
              initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: -12 }}
              transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
              className="absolute -top-3 -right-3 bg-emerald-400 text-emerald-900 text-[10px] font-black px-3 py-1 rounded-full shadow-lg"
            >
              PAID ✓
            </motion.div>
          </motion.div>

          {/* Mini floating chip – download */}
          <motion.div
            animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-20 top-6 bg-white/10 border border-white/20 rounded-2xl p-3 flex items-center gap-2"
          >
            <div className="w-7 h-7 bg-amber-400/20 rounded-xl flex items-center justify-center">
              <Download size={12} className="text-amber-300" />
            </div>
            <div>
              <div className="h-1.5 w-14 bg-white/40 rounded-full" />
              <div className="h-1 w-9 bg-white/20 rounded-full mt-1" />
            </div>
          </motion.div>

          {/* Mini floating chip – spend */}
          <motion.div
            animate={{ y: [0, 7, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute -left-16 bottom-8 bg-white/10 border border-white/20 rounded-2xl px-3 py-2 flex items-center gap-1.5"
          >
            <TrendingUp size={12} className="text-indigo-300" />
            <span className="text-xs font-semibold text-white/70">
              {invoices.length > 0 ? formatCurrency(totalSpend) : "£0.00"} spent
            </span>
          </motion.div>

          {/* Shield badge */}
          <motion.div
            animate={{ y: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute right-2 -bottom-5 bg-indigo-500/30 border border-indigo-400/30 rounded-2xl p-3"
          >
            <Shield size={15} className="text-indigo-300" />
          </motion.div>
        </div>

        {/* Text content */}
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5"
          >
            <FileText size={13} className="text-indigo-300" />
            <span className="text-xs font-bold tracking-widest uppercase text-white/80">Account</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl font-black mb-3 tracking-tight"
          >
            My Invoices
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/80 text-base max-w-md"
          >
            Download or review all your purchase invoices in one place.
          </motion.p>

          {invoices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 mt-8"
            >
              {[
                { value: String(invoices.length), label: "Total invoices", icon: <FileText size={14} /> },
                { value: formatCurrency(totalSpend), label: "Total spend", icon: <TrendingUp size={14} /> },
                { value: String(invoices.filter(i => i.status === "paid").length), label: "Paid", icon: <CheckCircle size={14} /> },
              ].map((s, i) => (
                <motion.div key={i} whileHover={{ scale: 1.04 }}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3 cursor-default transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                    {s.icon}
                  </div>
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
        {/* Search + filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices or book titles…"
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
              <Filter size={14} />
              {filterStatus === "all" ? "All statuses" : STATUS_META[filterStatus as Invoice["status"]]?.label}
              <ChevronDown size={14} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl z-20 py-1 min-w-[150px]">
                {["all", "paid", "pending", "refunded", "cancelled"].map(s => (
                  <button
                    key={s}
                    onClick={() => { setFilterStatus(s); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-all ${filterStatus === s ? "text-indigo-700" : "text-gray-700"}`}
                  >
                    {s === "all" ? "All statuses" : STATUS_META[s as Invoice["status"]]?.label}
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
                  <div className="h-5 w-40 bg-gray-100 rounded-lg" />
                  <div className="h-5 w-20 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-4 w-60 bg-gray-100 rounded-lg mt-3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-black text-gray-800 mb-1">{invoices.length === 0 ? "No invoices yet" : "No matching invoices"}</h3>
            <p className="text-gray-400 text-sm">{invoices.length === 0 ? "Your invoices will appear here after you place an order." : "Try adjusting your search or filter."}</p>
            {invoices.length === 0 && (
              <button onClick={() => navigate("/explore")} className="mt-6 px-5 py-2.5 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all">
                Browse books
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((inv, idx) => {
              const meta = STATUS_META[inv.status] ?? STATUS_META.paid;
              const isOpen = expanded === inv.invoiceNumber;
              return (
                <motion.div
                  key={inv.invoiceNumber}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : inv.invoiceNumber)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-sm">{inv.invoiceNumber}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDate(inv.createdAt)} · {inv.items.length} item{inv.items.length !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
                        {meta.icon}{meta.label}
                      </span>
                      <span className="font-black text-gray-900">{formatCurrency(inv.total)}</span>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="px-6 pb-6 border-t border-gray-100"
                    >
                      <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 font-bold">
                              <td className="px-4 py-2.5">Item</td>
                              <td className="px-4 py-2.5 text-center">Qty</td>
                              <td className="px-4 py-2.5 text-right">Unit price</td>
                              <td className="px-4 py-2.5 text-right">Line total</td>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.items.map((it, i) => (
                              <tr key={i} className="border-t border-gray-100">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-gray-800">{it.title}</div>
                                  <div className="text-gray-400">{it.author}</div>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">{it.quantity}</td>
                                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(it.unitPrice)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(it.unitPrice * it.quantity)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <div className="w-64 space-y-1.5 text-sm">
                          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(inv.subtotal)}</span></div>
                          <div className="flex justify-between text-gray-500">
                            <span>Shipping</span>
                            <span>{inv.shipping === 0 ? <span className="text-emerald-600 font-semibold">Free</span> : formatCurrency(inv.shipping)}</span>
                          </div>
                          {inv.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrency(inv.discount)}</span></div>}
                          <div className="flex justify-between font-black text-gray-900 border-t border-gray-100 pt-2 mt-2"><span>Total</span><span>{formatCurrency(inv.total)}</span></div>
                          <div className="flex justify-between text-gray-400 text-xs"><span>Payment</span><span>{inv.paymentMethod}</span></div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={() => navigate(`/order/${inv.orderId}`)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                        >
                          <Package size={13} /> View order
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                        >
                          <Download size={13} /> Download PDF
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-10 bg-gray-50 rounded-3xl border border-gray-100 p-6 flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <ExternalLink size={16} />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm mb-1">Need a VAT receipt?</div>
            <p className="text-gray-500 text-sm leading-relaxed">
              BritBooks is VAT-registered (GB 123456789). If you need a formal VAT receipt for business expenses, contact us at{" "}
              <a href="mailto:accounts@britbooks.co.uk" className="text-indigo-600 font-semibold hover:underline">accounts@britbooks.co.uk</a>{" "}
              with your invoice number.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
