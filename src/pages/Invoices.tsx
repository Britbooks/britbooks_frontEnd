import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, Download, ExternalLink, 
  FileText, CheckCircle2, Clock3, ArrowUpRight, 
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://britbooks-api-production-8ebd.up.railway.app";
const ITEMS_PER_PAGE = 5;

interface Invoice {
  invoiceId: string;
  orderId: string;
  total: number;
  currency: string;
  status: "paid" | "pending" | "cancelled";
  paidAt: string;
  createdAt: string;
  itemCount: number;
  downloadUrl: string;
}

const formatGBP = (val: number) => 
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(val);

const formatDate = (dateStr: string) => 
  new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function InvoicesPage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!auth?.token || !auth?.userId) {
      setLoading(false);
      return;
    }
    axios.get(`${API_BASE}/api/invoices/user/${auth.userId}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    .then(res => setInvoices(res.data?.data ?? []))
    .catch(() => setInvoices([]))
    .finally(() => setLoading(false));
  }, [auth]);

  // Filter and Paginate
  const filtered = useMemo(() => 
    invoices.filter(inv => inv.invoiceId.toLowerCase().includes(search.toLowerCase())), 
  [invoices, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDownload = async (url: string, id: string) => {
    try {
      const response = await axios.get(`${API_BASE}${url}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `invoice-${id.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF Download Error", err);
    }
  };

  if (!auth?.token) return <AuthWall navigate={navigate} />;

  return (
    <div className="min-h-screen bg-white text-slate-900  font-sans selection:bg-indigo-50">
      <TopBar />

      <main className="max-w-5xl mx-auto  px-6 py-16 sm:py-24">
        <header className="mb-16 border-b  border-slate-100 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-12 bg-indigo-600"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Archive 2026</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900 mb-4">
            Billing & <span className="text-slate-400">Invoices.</span>
          </h1>
          <p className="text-slate-500 max-w-xl text-lg leading-relaxed">
            Review your purchase history and download VAT-compliant receipts.
          </p>
        </header>

        <div className="relative mb-10">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Search by ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-b border-slate-200 py-4 pl-8 text-lg font-medium placeholder:text-slate-200 focus:outline-none focus:border-indigo-600 transition-colors"
          />
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(n => <div key={n} className="h-16 w-full bg-slate-50 animate-pulse rounded-lg" />)}
          </div>
        ) : paginatedInvoices.length === 0 ? (
          <div className="py-32 text-center border border-dashed border-slate-100 rounded-3xl">
            <FileText className="mx-auto text-slate-100 mb-4" size={64} />
            <h3 className="text-xl font-bold text-slate-400">No records found</h3>
          </div>
        ) : (
          <>
            <div className="flex flex-col border-t border-slate-100">
              {paginatedInvoices.map((inv) => (
                <InvoiceRow 
                  key={inv.invoiceId} 
                  inv={inv} 
                  isExpanded={expandedId === inv.invoiceId}
                  onToggle={() => setExpandedId(expandedId === inv.invoiceId ? null : inv.invoiceId)}
                  onDownload={() => handleDownload(inv.downloadUrl, inv.invoiceId)}
                  onViewOrder={() => navigate(`/order/${inv.orderId}`)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${currentPage === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-900 hover:text-indigo-600'}`}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Page {currentPage} <span className="mx-2 text-slate-200">/</span> {totalPages}
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${currentPage === totalPages ? 'text-slate-200 cursor-not-allowed' : 'text-slate-900 hover:text-indigo-600'}`}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
                <ExternalLink size={16} />
             </div>
             <p className="text-sm text-slate-500 font-medium">
               Need a CSV of all billing history? <span className="text-indigo-600 cursor-pointer hover:underline">Request Export</span>
             </p>
          </div>
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            BritBooks Ltd · VAT GB 123 456 789
          </div>
        </footer>
      </main>

      <Footer />
    </div>
  );
}

// --- List Component ---

function InvoiceRow({ inv, isExpanded, onToggle, onDownload, onViewOrder }: any) {
  return (
    <div className={`transition-all duration-300 ${isExpanded ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/20'}`}>
      <div 
        onClick={onToggle}
        className="flex items-center justify-between px-2 py-8 border-b border-slate-100 cursor-pointer group"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 flex-grow gap-4">
          <div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Reference</div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">#{inv.invoiceId.slice(-8).toUpperCase()}</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Date</div>
            <div className="text-sm font-medium text-slate-600">{formatDate(inv.paidAt || inv.createdAt)}</div>
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Items</div>
            <div className="text-sm font-medium text-slate-600">{inv.itemCount} Units</div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 text-right">Total</div>
            <div className="text-lg font-black text-slate-900">{formatGBP(inv.total)}</div>
          </div>
          <ChevronDown 
            size={18} 
            className={`text-slate-200 transition-all duration-500 ${isExpanded ? 'rotate-180 text-indigo-600' : 'group-hover:text-slate-400'}`} 
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/50"
          >
            <div className="px-2 py-10 grid md:grid-cols-2 gap-12 border-b border-slate-100">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-emerald-600">
                   <CheckCircle2 size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Transaction Verified</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                  Official invoice for order <span className="font-bold text-slate-900">{inv.orderId}</span>. 
                  Includes VAT breakdown and shipping details.
                </p>
                <div className="flex gap-4">
                  <button onClick={onViewOrder} className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-indigo-600 transition-colors">
                    Manage Order <ArrowUpRight size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button onClick={onDownload} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-indigo-600 transition-colors">
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">
                  <span>Breakdown</span>
                  <span>GBP</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-500">Subtotal (Net)</span>
                  <span className="text-slate-900 font-bold">{formatGBP(inv.total * 0.833)}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-500">Tax (VAT 20%)</span>
                  <span className="text-slate-900 font-bold">{formatGBP(inv.total * 0.167)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Total Charged</span>
                  <span className="text-2xl font-black text-slate-900">{formatGBP(inv.total)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthWall({ navigate }: any) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8">
        <Clock3 className="text-slate-300" size={32} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Identity Verification</h2>
      <p className="text-slate-500 max-w-sm mb-10 text-lg leading-relaxed text-center">Billing data is restricted. Please authenticate to access your financial history.</p>
      <button 
        onClick={() => navigate("/login")}
        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 shadow-xl shadow-slate-100 transition-all text-sm uppercase tracking-widest"
      >
        Continue to Login
      </button>
    </div>
  );
}