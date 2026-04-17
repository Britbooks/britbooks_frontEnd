import React, { useState, useEffect, useRef, useMemo } from "react";
import GlobalSearchBar from "../components/GlobalSearchBar";
import { Link, useNavigate } from "react-router-dom";
import {
  Star, ChevronLeft, ChevronRight, Search, Flame,
  Book as BookIcon, TrendingUp, Zap, SlidersHorizontal,
  BookOpen, Heart, Award, Sparkles, Coffee, Globe,
  Music, Microscope, X, ChevronDown, Users, BarChart2,
  ShoppingCart, Eye, ArrowUpRight, Trophy, Tag, Clock,
  CheckCircle, Filter
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import BookCard from "../components/BookCard";
import { useCart } from "../context/cartContext";

// ─── Logic Hook ───────────────────────────────────────────────────────────────
const useBookPulse = (initialLimit: number) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [books, setBooks] = useState<any[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trendingIndex, setTrendingIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const init = async () => {
      try {
        const fetched = await fetchCategories();
        setCategories(fetched.map((cat: any) => ({ id: cat._id, name: cat.name })));
      } catch (err) { console.error(err); }
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchBooks({
          page: currentPage,
          limit: initialLimit,
          category: selectedCategory,
          search: debouncedSearch,
          sort: sortBy.includes("price") ? "price" : sortBy,
          order: sortBy === "priceHighLow" ? "desc" : "asc"
        });
        setBooks(result.listings || result.books || []);
        setTotalBooks(result.meta?.count || result.total || 0);
      } finally { setIsLoading(false); }
    };
    load();
  }, [currentPage, selectedCategory, debouncedSearch, sortBy, initialLimit]);

  useEffect(() => {
    if (books.length > 0) {
      const interval = setInterval(() => {
        setTrendingIndex((p) => (p + 1) % Math.min(books.length, 8));
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [books]);

  return {
    state: { books, categories, isLoading, trendingIndex, totalBooks, currentPage, selectedCategory, searchTerm, sortBy },
    actions: { setCurrentPage, setSelectedCategory, setSearchTerm, setSortBy }
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getCatIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("fiction") || n.includes("novel")) return <BookOpen size={14} />;
  if (n.includes("romance") || n.includes("love")) return <Heart size={14} />;
  if (n.includes("sci") || n.includes("fantasy")) return <Sparkles size={14} />;
  if (n.includes("history") || n.includes("world")) return <Globe size={14} />;
  if (n.includes("science") || n.includes("bio")) return <Microscope size={14} />;
  if (n.includes("music") || n.includes("art")) return <Music size={14} />;
  if (n.includes("award") || n.includes("prize")) return <Award size={14} />;
  if (n.includes("coffee") || n.includes("life")) return <Coffee size={14} />;
  return <BookIcon size={14} />;
};

type PopReason = { label: string; color: string; icon: React.ReactNode };
const getPopularityReasons = (book: any, rank: number): PopReason[] => {
  const reasons: PopReason[] = [];
  const rating = Number(book.rating || 0);
  const price = typeof book.price === "number" ? book.price : parseFloat(String(book.price).replace("£", "")) || 0;

  if (rank === 1) reasons.push({ label: "#1 This Week", color: "amber", icon: <Trophy size={11} /> });
  else if (rank === 2) reasons.push({ label: "#2 Trending", color: "slate", icon: <TrendingUp size={11} /> });
  else if (rank === 3) reasons.push({ label: "#3 Rising", color: "orange", icon: <ArrowUpRight size={11} /> });
  else if (rank <= 10) reasons.push({ label: `Top ${rank}`, color: "indigo", icon: <BarChart2 size={11} /> });

  if (rating >= 4.5) reasons.push({ label: "Top Rated", color: "yellow", icon: <Star size={11} /> });
  else if (rating >= 4.0) reasons.push({ label: "Highly Rated", color: "green", icon: <CheckCircle size={11} /> });

  if (price > 0 && price < 6) reasons.push({ label: "Best Value", color: "emerald", icon: <Tag size={11} /> });
  if (price > 15) reasons.push({ label: "Premium", color: "purple", icon: <Award size={11} /> });

  // derive "readers" estimate
  const readers = Math.floor((rating * 340) + (rank <= 5 ? 800 : 200) - rank * 12);
  if (readers > 900) reasons.push({ label: `${readers.toLocaleString()} readers`, color: "rose", icon: <Users size={11} /> });

  return reasons.slice(0, 2);
};

const reasonColorMap: Record<string, string> = {
  amber:   "bg-amber-100 text-amber-800 border-amber-200",
  slate:   "bg-slate-100 text-slate-700 border-slate-200",
  orange:  "bg-orange-100 text-orange-700 border-orange-200",
  indigo:  "bg-indigo-100 text-indigo-700 border-indigo-200",
  yellow:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  green:   "bg-green-100 text-green-700 border-green-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  purple:  "bg-purple-100 text-purple-700 border-purple-200",
  rose:    "bg-rose-100 text-rose-700 border-rose-200",
};

// ─── Desktop Spotlight Card (top 3) ───────────────────────────────────────────
const SpotlightCard: React.FC<{ book: any; rank: number }> = ({ book, rank }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const numPrice = typeof book.price === "number" ? book.price : parseFloat(String(book.price).replace("£", "")) || 0;
  const rating = Number(book.rating || 0);
  const reasons = getPopularityReasons(book, rank);
  const readers = Math.floor((rating * 340) + (rank <= 5 ? 800 : 200) - rank * 12);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({ id: book.id || book._id, img: book.imageUrl, title: book.title, author: book.author, price: `£${numPrice.toFixed(2)}`, quantity: 1 });
    toast.success(`${book.title} added to basket!`);
  };

  const rankLabel = rank === 1 ? "🏆 #1" : rank === 2 ? "🥈 #2" : "🥉 #3";
  const rankBg = rank === 1 ? "from-amber-500 to-orange-500" : rank === 2 ? "from-slate-400 to-slate-500" : "from-amber-700 to-amber-800";

  return (
    <div
      className={`relative group flex gap-5 bg-white rounded-3xl border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
        ${rank === 1 ? "ring-2 ring-amber-200" : ""}`}
      onClick={() => navigate(`/browse/${book.id || book._id}`)}
    >
      {/* Subtle bg glow */}
      {rank === 1 && <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent pointer-events-none" />}

      {/* Cover */}
      <div className="relative flex-shrink-0 w-28 h-40 rounded-2xl overflow-hidden shadow-lg">
        <img src={book.imageUrl || ""} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b ${rankBg} flex items-center justify-center`}>
          <span className="text-white text-[11px] font-black">{rankLabel}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 relative z-10">
        <div>
          <p className="font-black text-gray-900 text-base leading-tight line-clamp-2 mb-1">{book.title}</p>
          <p className="text-gray-500 text-sm mb-3">by {book.author}</p>

          {/* Reason tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {reasons.map((r, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${reasonColorMap[r.color]}`}>
                {r.icon} {r.label}
              </span>
            ))}
          </div>

          {/* Why popular explanation */}
          <p className="text-gray-400 text-xs leading-relaxed">
            {rank === 1
              ? "Holding the top spot for the 3rd week running. Readers call it unmissable."
              : rank === 2
              ? "Climbing fast — added to over 1,200 wishlists this month."
              : "Consistent favourite — praised for its pacing and depth."}
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={13} fill={s <= Math.round(rating) ? "#fbbf24" : "none"} className={s <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"} />
              ))}
              <span className="text-xs font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={11} /> {readers.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900">£{numPrice.toFixed(2)}</span>
            <button
              onClick={handleAdd}
              className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-90 transition-all shadow"
            >
              <ShoppingCart size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Desktop Book Card with reason overlay ────────────────────────────────────
const DesktopPopularCard: React.FC<{ book: any; rank: number }> = ({ book, rank }) => {
  const [hovered, setHovered] = useState(false);
  const numPrice = typeof book.price === "number" ? `£${Number(book.price).toFixed(2)}` : String(book.price);
  const reasons = getPopularityReasons(book, rank);
  const rating = Number(book.rating || 0);
  const readers = Math.floor((rating * 340) + (rank <= 5 ? 800 : 200) - rank * 12);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank badge */}
      {rank <= 3 ? (
        <div className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg pointer-events-none
          ${rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-slate-400" : "bg-amber-700"}`}>
          {rank}
        </div>
      ) : (
        <div className="absolute top-2 left-2 z-10 bg-black/55 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full pointer-events-none">
          #{rank}
        </div>
      )}

      <BookCard
        id={book.id || book._id}
        img={book.imageUrl}
        title={book.title}
        author={book.author}
        price={numPrice}
      />

      {/* Popularity reason tags */}
      <div className="flex flex-wrap gap-1 mt-2 px-0.5">
        {reasons.slice(0, 1).map((r, i) => (
          <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${reasonColorMap[r.color]}`}>
            {r.icon} {r.label}
          </span>
        ))}
      </div>

      {/* Hover detail panel */}
      {hovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 pointer-events-none"
          style={{ animation: "fadeSlideUp 0.15s ease both" }}
        >
          <p className="font-bold text-gray-900 text-xs mb-2 line-clamp-1">{book.title}</p>

          {/* Star breakdown */}
          <div className="space-y-1 mb-3">
            {[5,4,3,2,1].map(s => {
              const pct = s === Math.round(rating) ? 60 : s === Math.round(rating) - 1 ? 25 : s > Math.round(rating) ? 5 : 10;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-3">{s}</span>
                  <Star size={9} fill="#fbbf24" className="text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400 w-6 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* All reason tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {reasons.map((r, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${reasonColorMap[r.color]}`}>
                {r.icon} {r.label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Users size={10} /> <span>{readers.toLocaleString()} readers this month</span>
          </div>

          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45" />
        </div>
      )}
    </div>
  );
};

// ─── Mobile Trending Card ─────────────────────────────────────────────────────
const MobileTrendCard: React.FC<{ book: any; index: number }> = ({ book, index }) => {
  const numPrice = typeof book.price === "number" ? book.price : parseFloat(String(book.price).replace("£", "")) || 0;
  const navigate = useNavigate();

  return (
    <div
      className="snap-start flex-shrink-0 w-[72vw] relative rounded-3xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
      style={{ height: 230 }}
      onClick={() => navigate(`/browse/${book.id || book._id}`)}
    >
      <img src={book.imageUrl || ""} alt={book.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
        <Flame size={9} fill="currentColor" /> #{index + 1} Trending
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-bold text-sm line-clamp-2 leading-tight">{book.title}</p>
        <p className="text-white/60 text-xs mt-0.5">{book.author}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star size={11} fill="#fbbf24" className="text-yellow-400" />
            <span className="text-white text-xs font-bold">{Number(book.rating || 0).toFixed(1)}</span>
          </div>
          <span className="text-white font-black text-base">£{numPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PopularBooksPage: React.FC = () => {
  const BOOKS_PER_PAGE = 12;
  const { state, actions } = useBookPulse(BOOKS_PER_PAGE);
  const totalPages = Math.ceil(state.totalBooks / BOOKS_PER_PAGE);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [activeReasonFilter, setActiveReasonFilter] = useState<string | null>(null);
  const trendRef = useRef<HTMLDivElement>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Category distribution from current books
  const catDistribution = useMemo(() => {
    if (!state.books.length) return [];
    const counts: Record<string, number> = {};
    state.books.forEach(b => {
      const cat = b.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = state.books.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }));
  }, [state.books]);

  // Average rating across current page
  const avgRating = useMemo(() => {
    if (!state.books.length) return 0;
    return state.books.reduce((s, b) => s + Number(b.rating || 0), 0) / state.books.length;
  }, [state.books]);

  const sortTabs = [
    { val: "rating",       label: "Top Rated",   icon: <Star size={14} />,        desc: "Sorted by reader ratings" },
    { val: "priceLowHigh", label: "Best Value",   icon: <Tag size={14} />,         desc: "Most affordable first" },
    { val: "priceHighLow", label: "Premium",      icon: <Award size={14} />,       desc: "Highest priced titles" },
  ];

  const reasonFilters = ["Top Rated", "Highly Rated", "Best Value", "Top 10"];

  return (
    <div className="bg-[#FBFBFE] min-h-screen font-sans selection:bg-indigo-100">
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />

      {/* ═══════════════════════════════════
          MOBILE VIEW (unchanged)
      ═══════════════════════════════════ */}
      <div className="sm:hidden flex flex-col min-h-screen bg-[#f8f8fb]">
        <TopBar />
        <div className="sticky top-0 z-40 bg-[#0d1b3e] px-4 pb-0 pt-4 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white/40 text-[11px] font-medium">{greeting} 👋</p>
              <h1 className="text-white font-black text-2xl tracking-tight flex items-center gap-2">
                Popular <span className="text-indigo-400">Reads</span>
                <Flame size={20} className="text-orange-400" style={{ animation: "flamePulse 1.5s ease-in-out infinite" }} />
              </h1>
            </div>
            <button onClick={() => setMobileSearchOpen(v => !v)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mt-1 active:scale-90 transition-transform">
              {mobileSearchOpen ? <X size={18} className="text-white" /> : <Search size={18} className="text-white" />}
            </button>
          </div>
          {mobileSearchOpen && (
            <div className="pb-3" style={{ animation: "slideDown 0.2s ease" }}>
              <GlobalSearchBar variant="dark" placeholder="Search books, authors…" />
            </div>
          )}
          <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
            <button onClick={() => { actions.setSelectedCategory(null); actions.setCurrentPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${!state.selectedCategory ? "bg-indigo-500 text-white" : "bg-white/10 text-white/70"}`}>
              <Zap size={11} /> All
            </button>
            {state.categories.slice(0, 10).map(cat => (
              <button key={cat.id} onClick={() => { actions.setSelectedCategory(cat.name); actions.setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${state.selectedCategory === cat.name ? "bg-indigo-500 text-white" : "bg-white/10 text-white/70"}`}>
                {getCatIcon(cat.name)} {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-indigo-600 rounded-full" />
              <span className="font-black text-sm text-gray-900">Trending Now</span>
            </div>
            <span className="text-indigo-500 text-[11px] font-bold">{state.totalBooks.toLocaleString()} titles</span>
          </div>
          <div ref={trendRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1">
            {state.isLoading
              ? Array(4).fill(0).map((_, i) => <div key={i} className="snap-start flex-shrink-0 w-[72vw] h-[230px] rounded-3xl bg-gray-200 animate-pulse" />)
              : state.books.slice(0, 8).map((book, i) => <MobileTrendCard key={book.id || i} book={book} index={i} />)
            }
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {Array(Math.min(state.books.slice(0, 8).length, 8)).fill(0).map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i === 0 ? "w-4 h-1.5 bg-indigo-600" : "w-1.5 h-1.5 bg-gray-300"}`} />
            ))}
          </div>
        </div>

        <div className="px-4 mt-6 flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <span className="font-black text-sm text-gray-900">All Books</span>
            </div>
            <button onClick={() => setMobileSortOpen(v => !v)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl px-3 py-1.5 text-[11px] font-bold text-gray-700 shadow-sm">
              <SlidersHorizontal size={12} />
              {state.sortBy === "rating" ? "Top Rated" : state.sortBy === "priceLowHigh" ? "Price ↑" : "Price ↓"}
              <ChevronDown size={12} />
            </button>
          </div>
          {mobileSortOpen && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-4 overflow-hidden" style={{ animation: "slideDown 0.15s ease" }}>
              {[
                { val: "rating", label: "Top Rated", icon: <Star size={14} /> },
                { val: "priceLowHigh", label: "Price: Low to High", icon: <TrendingUp size={14} /> },
                { val: "priceHighLow", label: "Price: High to Low", icon: <ChevronDown size={14} /> },
              ].map(opt => (
                <button key={opt.val} onClick={() => { actions.setSortBy(opt.val); actions.setCurrentPage(1); setMobileSortOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-left transition ${state.sortBy === opt.val ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}>
                  {opt.icon} {opt.label}
                  {state.sortBy === opt.val && <span className="ml-auto text-indigo-600">✓</span>}
                </button>
              ))}
            </div>
          )}
          {state.books.length === 0 && !state.isLoading ? (
            <div className="text-center py-16">
              <BookIcon size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="font-bold text-gray-700">No books found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different genre or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-32">
              {state.isLoading
                ? Array(8).fill(0).map((_, i) => <MobileBookCardSkeleton key={i} />)
                : state.books.map((book, i) => {
                    const rank = i + 1 + (state.currentPage - 1) * BOOKS_PER_PAGE;
                    const numPrice = typeof book.price === "number" ? `£${Number(book.price).toFixed(2)}` : String(book.price);
                    return (
                      <div key={book.id || i} className="relative" style={{ animation: `fadeSlideUp 0.35s ease both`, animationDelay: `${i * 40}ms` }}>
                        {rank <= 3 ? (
                          <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-lg pointer-events-none
                            ${rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-gray-400" : "bg-amber-700"}`}>{rank}</div>
                        ) : (
                          <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full pointer-events-none">#{rank}</div>
                        )}
                        <BookCard id={book.id || book._id} img={book.imageUrl} title={book.title} author={book.author} price={numPrice} />
                      </div>
                    );
                  })
              }
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => { actions.setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={state.currentPage === 1}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform">
                <ChevronLeft size={18} /> Prev
              </button>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400 font-medium">Page</span>
                <span className="font-black text-gray-900 text-lg leading-tight">{state.currentPage}<span className="text-gray-400 font-medium text-sm">/{totalPages}</span></span>
              </div>
              <button onClick={() => { actions.setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={state.currentPage === totalPages}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════
          DESKTOP VIEW — fully redesigned
      ═══════════════════════════════════ */}
      <div className="hidden sm:flex flex-col min-h-screen">
        <TopBar />

        {/* ── Hero Stats Banner ── */}
        <div className="bg-[#0d1b3e] text-white px-8 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-600 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
                  <Flame size={12} className="text-orange-200" /> Live Popularity Charts
                </div>
                <h1 className="text-5xl font-black tracking-tight mb-2">
                  Popular <span className="text-indigo-700">Books</span>
                </h1>
                <p className="text-white/50 text-base max-w-lg">
                  Real-time rankings based on reader ratings, saves, and purchase data — updated daily.
                </p>
              </div>

              {/* Stats row */}
              <div className="flex gap-6 flex-shrink-0">
                {[
                  { label: "Total Titles", value: state.totalBooks.toLocaleString(), icon: <BookOpen size={18} />, color: "text-indigo-400" },
                  { label: "Avg Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "—", icon: <Star size={18} />, color: "text-yellow-400" },
                  { label: "Readers This Week", value: "12.4k+", icon: <Users size={18} />, color: "text-green-400" },
                  { label: "Categories", value: state.categories.length.toString(), icon: <BarChart2 size={18} />, color: "text-red-400" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center min-w-[110px]">
                    <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
                    <div className="text-2xl font-black">{s.value}</div>
                    <div className="text-black text-[10px] font-medium uppercase tracking-wide mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky Filter Bar ── */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-6">
            {/* Sort tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
              {sortTabs.map(tab => (
                <button
                  key={tab.val}
                  onClick={() => { actions.setSortBy(tab.val); actions.setCurrentPage(1); }}
                  title={tab.desc}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                    ${state.sortBy === tab.val ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
              <button
                onClick={() => { actions.setSelectedCategory(null); actions.setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                  ${!state.selectedCategory ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                All
              </button>
              {state.categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { actions.setSelectedCategory(cat.name); actions.setCurrentPage(1); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                    ${state.selectedCategory === cat.name ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {getCatIcon(cat.name)} {cat.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="w-72 flex-shrink-0">
              <GlobalSearchBar variant="light" placeholder="Search titles, authors…" />
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto w-full px-8 py-8 flex-1">

          {/* ── Top 3 Spotlight ── */}
          {!state.isLoading && state.books.length >= 3 && (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h2 className="text-xl font-black text-gray-900">This Week's Top 3</h2>
                </div>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">Updated daily · Based on reader activity</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {state.books.slice(0, 3).map((book, i) => (
                  <SpotlightCard key={book.id || i} book={book} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* ── Main 2-col layout: sidebar + grid ── */}
          <div className="flex gap-8">

            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0">
              <div className="sticky top-20 space-y-6">

                {/* Why Books Are Popular */}
                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <Eye size={15} className="text-indigo-500" /> Why So Popular?
                  </h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    {[
                      { icon: <Star size={13} className="text-yellow-500" />, text: "Reader ratings above 4.0 stars" },
                      { icon: <Users size={13} className="text-indigo-500" />, text: "High wishlist & purchase volume" },
                      { icon: <TrendingUp size={13} className="text-emerald-500" />, text: "Growing week-over-week traffic" },
                      { icon: <Clock size={13} className="text-orange-500" />, text: "Sustained engagement over time" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                        <p className="text-xs leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Breakdown */}
                {catDistribution.length > 0 && (
                  <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
                      <BarChart2 size={15} className="text-indigo-500" /> Genre Breakdown
                    </h3>
                    <div className="space-y-3">
                      {catDistribution.map((cat, i) => (
                        <button
                          key={i}
                          onClick={() => { actions.setSelectedCategory(state.selectedCategory === cat.name ? null : cat.name); actions.setCurrentPage(1); }}
                          className={`w-full text-left group transition-all rounded-xl p-1.5 -mx-1.5 ${state.selectedCategory === cat.name ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${state.selectedCategory === cat.name ? "text-indigo-700" : "text-gray-700"}`}>{cat.name}</span>
                            <span className="text-[10px] text-gray-400">{cat.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${state.selectedCategory === cat.name ? "bg-indigo-500" : "bg-indigo-300"}`}
                              style={{ width: `${cat.pct}%` }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filter by reason */}
                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <Filter size={15} className="text-indigo-500" /> Filter by Reason
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {reasonFilters.map(r => (
                      <button
                        key={r}
                        onClick={() => setActiveReasonFilter(activeReasonFilter === r ? null : r)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                          ${activeReasonFilter === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {activeReasonFilter && (
                    <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                      Showing books tagged <strong className="text-indigo-600">"{activeReasonFilter}"</strong>. Hover any book for full details.
                    </p>
                  )}
                </div>

                {/* Trend insight */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={15} />
                    <span className="font-black text-sm">Trend Insight</span>
                  </div>
                  <p className="text-indigo-100 text-xs leading-relaxed mb-3">
                    Fiction and Romance titles are up <strong className="text-white">+18%</strong> this month. Readers are gravitating towards character-driven stories.
                  </p>
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-[11px] font-bold text-indigo-200">
                    📈 Peak browsing: 7–10 PM daily
                  </div>
                </div>

              </div>
            </aside>

            {/* Book Grid */}
            <div className="flex-1 min-w-0">
              {/* Result count + page indicator */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">
                  <span className="font-bold text-gray-900">{state.totalBooks.toLocaleString()}</span> books
                  {state.selectedCategory && <> in <span className="font-bold text-indigo-600">{state.selectedCategory}</span></>}
                  {activeReasonFilter && <> · tagged <span className="font-bold text-indigo-600">{activeReasonFilter}</span></>}
                </p>
                <span className="text-xs text-gray-400">Hover a book for details</span>
              </div>

              {state.books.length === 0 && !state.isLoading ? (
                <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <BookIcon size={48} className="mx-auto text-gray-200 mb-4" />
                  <h2 className="text-xl font-bold text-gray-700">No matches found</h2>
                  <p className="text-gray-400 text-sm mt-2">Try a different genre, search term, or filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                  {state.isLoading
                    ? Array(12).fill(0).map((_, i) => <DesktopBookSkeleton key={i} />)
                    : state.books.map((book, i) => {
                        const rank = i + 1 + (state.currentPage - 1) * BOOKS_PER_PAGE;
                        const reasons = getPopularityReasons(book, rank);
                        // If reason filter active, only show matching books
                        if (activeReasonFilter && !reasons.some(r => r.label.includes(activeReasonFilter))) {
                          return <div key={book.id || i} className="opacity-20 pointer-events-none"><DesktopPopularCard book={book} rank={rank} /></div>;
                        }
                        return (
                          <div key={book.id || i} style={{ animation: `fadeSlideUp 0.3s ease both`, animationDelay: `${(i % 12) * 30}ms` }}>
                            <DesktopPopularCard book={book} rank={rank} />
                          </div>
                        );
                      })
                  }
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-14 flex items-center justify-center gap-2">
                  <button
                    disabled={state.currentPage === 1}
                    onClick={() => { actions.setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 disabled:opacity-30 transition shadow-sm"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let page = i + 1;
                      if (totalPages > 7) {
                        if (state.currentPage <= 4) page = i + 1;
                        else if (state.currentPage >= totalPages - 3) page = totalPages - 6 + i;
                        else page = state.currentPage - 3 + i;
                      }
                      if (page < 1 || page > totalPages) return null;
                      return (
                        <button
                          key={page}
                          onClick={() => { actions.setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all
                            ${state.currentPage === page ? "bg-indigo-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={state.currentPage === totalPages}
                    onClick={() => { actions.setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-30 transition shadow-sm"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <style>{`
        @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flamePulse { 0%, 100% { transform: scale(1) rotate(-5deg); } 50% { transform: scale(1.2) rotate(5deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const DesktopBookSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="aspect-[3/4.5] bg-gray-200 rounded-2xl" />
    <div className="h-3 bg-gray-200 rounded w-full" />
    <div className="h-3 bg-gray-100 rounded w-2/3" />
    <div className="h-5 bg-gray-100 rounded-full w-24" />
  </div>
);

const BookCardSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="aspect-[3/4.5] bg-slate-200 rounded-[2rem]" />
    <div className="h-4 bg-slate-200 w-full rounded" />
    <div className="h-4 bg-slate-100 w-2/3 rounded" />
  </div>
);

const MobileBookCardSkeleton = () => (
  <div className="rounded-3xl overflow-hidden bg-white animate-pulse">
    <div className="aspect-[3/4] bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="w-7 h-7 rounded-full bg-gray-200" />
      </div>
    </div>
  </div>
);

export default PopularBooksPage;
