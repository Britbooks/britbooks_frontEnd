import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Zap, Flame, Tag, ChevronLeft, ChevronRight,
  Book as BookIcon, SlidersHorizontal, X, Sparkles, Clock
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import { fetchBooks } from '../data/books';
import BookCard from '../components/BookCard';

// ─── Countdown timer ────────────────────────────────────────────────────────
const useCountdown = (endDate: Date | null) => {
  const calc = () => {
    if (!endDate) return null;
    const diff = endDate.getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    const totalSecs = Math.floor(diff / 1000);
    return {
      h: Math.floor(totalSecs / 3600),
      m: Math.floor((totalSecs % 3600) / 60),
      s: totalSecs % 60,
      expired: false,
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    if (!endDate) return;
    setTime(calc());
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [endDate]);

  return time;
};

const Chip = ({ v, label }: { v: number | string; label: string }) => (
  <div className="flex flex-col items-center bg-white/10 border border-white/20 rounded-xl px-3 py-2 min-w-[52px]">
    <span className="text-white font-black text-xl leading-none tabular-nums">
      {String(v).padStart(2, '0')}
    </span>
    <span className="text-white/50 text-[9px] uppercase tracking-widest mt-0.5">{label}</span>
  </div>
);

// ─── Scrolling deal ticker ───────────────────────────────────────────────────
const DealTicker = ({ books }: { books: any[] }) => {
  if (!books.length) return null;
  const items = [...books, ...books];
  return (
    <div className="relative overflow-hidden bg-[#c9a84c] py-2">
      <div className="flex gap-8 animate-ticker whitespace-nowrap">
        {items.map((b, i) => (
          <span key={i} className="flex items-center gap-2 text-[#0a1628] font-black text-xs flex-shrink-0">
            <Flame size={11} fill="currentColor" />
            {b.title} — £{Number(b.price).toFixed(2)}
            <span className="mx-2 opacity-40">·</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const SORTS = [
  { val: 'discount', label: 'Best Deal' },
  { val: 'price_asc', label: 'Price ↑' },
  { val: 'price_desc', label: 'Price ↓' },
];

const ClearancePage = () => {
  const routerLocation = useLocation();
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('discount');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saleEndDate, setSaleEndDate] = useState<Date | null>(null);
  const countdown = useCountdown(saleEndDate);
  const BOOKS_PER_PAGE = 100;
  const PAGE_SIZE = 24;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetchBooks({ page: 1, limit: BOOKS_PER_PAGE, shelf: 'clearanceItems' });
        const mapped = (res?.listings || []).map((b: any) => {
          const salePrice = b.discountedPrice && b.discountedPrice < b.price
            ? b.discountedPrice
            : b.discountPercentage > 0
              ? Math.round(b.price * (1 - b.discountPercentage / 100) * 100) / 100
              : b.price;
          return { ...b, price: salePrice, originalPrice: b.price };
        });
        setBooks(mapped);
        // Use the earliest validUntil across all clearance listings as the sale end time
        const dates = mapped
          .map((b: any) => b.discountValidUntil)
          .filter(Boolean) as Date[];
        if (dates.length) {
          setSaleEndDate(new Date(Math.min(...dates.map(d => d.getTime()))));
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...books];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q));
    }
    if (sort === 'discount') list.sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0));
    else if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    return list;
  }, [books, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxDiscount = books.length ? Math.max(...books.map(b => b.discountPercentage ?? 0)) : 60;
  const minPrice = books.length ? Math.min(...books.map(b => b.price)).toFixed(2) : '0.99';

  return (
    <div className="bg-[#f5f5f7] min-h-screen flex flex-col font-sans">
      <SEOHead
        title="Clearance Books"
        description="Huge savings on clearance books at BritBooks. Grab quality second-hand books at the lowest prices — while stocks last!"
        canonical="/clearance"
      />
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />
      <TopBar />

      {/* ── Deal ticker ── */}
      {!isLoading && books.length > 0 && <DealTicker books={books.slice(0, 10)} />}

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0a1628 0%,#1a2d4f 60%,#0f1f3a 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: '#c9a84c', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: '#c9a84c', filter: 'blur(60px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#c9a84c,transparent)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-14 sm:py-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">

            {/* Left: Text */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-[#c9a84c] text-white text-[11px] font-black px-4 py-1.5 rounded-full mb-5"
              >
                <Zap size={11} fill="currentColor" /> CLEARANCE SALE — LIVE NOW
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-5xl sm:text-7xl font-black text-white leading-none tracking-tighter mb-4"
              >
                UP TO <span style={{ color: '#c9a84c' }}>{maxDiscount}%</span><br />OFF.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-white text-base max-w-md mb-8"
              >
                Thousands of titles cleared out. No codes, no catches — just seriously low prices while stock lasts.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-wrap gap-3"
              >
                {[
                  { icon: <BookIcon size={14} />, label: `${books.length || '100+'} titles` },
                  { icon: <Tag size={14} />, label: `From £${minPrice}` },
                  { icon: <Sparkles size={14} />, label: 'No codes needed' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-white text-xs font-semibold">
                    <span style={{ color: '#c9a84c' }}>{s.icon}</span>
                    {s.label}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Countdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-sm flex-shrink-0"
            >
              <div className="flex items-center justify-center gap-1.5 text-white text-xs font-black uppercase tracking-widest mb-4">
                <Clock size={12} /> Sale Ends In
              </div>
              {!countdown ? (
                <p className="text-white/40 text-sm font-medium">Loading…</p>
              ) : countdown.expired ? (
                <p className="text-[#c9a84c] font-black text-sm">Sale has ended</p>
              ) : (
                <div className="flex text-white items-center gap-2">
                  <Chip v={countdown.h} label="hrs" />
                  <span className="text-white font-black text-xl">:</span>
                  <Chip v={countdown.m} label="min" />
                  <span className="text-white font-black text-xl">:</span>
                  <Chip v={countdown.s} label="sec" />
                </div>
              )}
              {saleEndDate && !countdown?.expired && (
                <p className="text-white/30 text-[10px] mt-4 uppercase tracking-wider">
                  Ends {saleEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FILTER / SEARCH BAR
      ══════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clearance…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#c9a84c]/50 transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort pills */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {SORTS.map(s => (
              <button
                key={s.val}
                onClick={() => { setSort(s.val); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: sort === s.val ? '#0a1628' : 'transparent',
                  color: sort === s.val ? '#fff' : '#6b7280',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Mobile sort button */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600"
          >
            <SlidersHorizontal size={13} /> Sort
          </button>

          {/* Result count */}
          <span className="ml-auto text-xs text-gray-400 font-medium hidden sm:block">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Mobile sort drawer */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-100 sm:hidden"
            >
              <div className="flex gap-2 px-4 py-3">
                {SORTS.map(s => (
                  <button
                    key={s.val}
                    onClick={() => { setSort(s.val); setFiltersOpen(false); setPage(1); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: sort === s.val ? '#0a1628' : '#f3f4f6',
                      color: sort === s.val ? '#fff' : '#374151',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════
          BOOK GRID
      ══════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-10 h-10 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Loading clearance deals…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-3 bg-white rounded-3xl border border-gray-100">
            <BookIcon size={48} className="text-gray-200" />
            <p className="font-bold text-gray-600">
              {search ? `No results for "${search}"` : 'No clearance items right now'}
            </p>
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="text-sm font-bold text-[#c9a84c] hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Section label */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full" style={{ background: '#c9a84c' }} />
                <h2 className="font-black text-gray-900 text-lg">
                  Clearance Deals
                  <span className="ml-2 text-sm font-medium text-gray-400">({filtered.length} items)</span>
                </h2>
              </div>
              {sort === 'discount' && (
                <span className="text-xs text-gray-400 font-medium hidden sm:block">Sorted by biggest discount first</span>
              )}
            </div>

            <motion.div
              key={sort + search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {visible.map((book, i) => (
                <motion.div
                  key={book.id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                >
                  <BookCard
                    id={book.id}
                    img={book.imageUrl}
                    title={book.title}
                    author={book.author}
                    price={`£${Number(book.price).toFixed(2)}`}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition shadow-sm"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 7) {
                      if (page <= 4) p = i + 1;
                      else if (page >= totalPages - 3) p = totalPages - 6 + i;
                      else p = page - 3 + i;
                    }
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
                        style={page === p
                          ? { background: '#c9a84c', color: '#0a1628' }
                          : { background: '#fff', border: '1px solid #e5e7eb', color: '#374151' }
                        }
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0a1628] hover:opacity-90 disabled:opacity-30 transition shadow-sm"
                  style={{ background: '#c9a84c' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        .animate-ticker:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
};

export default ClearancePage;
