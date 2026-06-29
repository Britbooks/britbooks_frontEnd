import React, { useState, useEffect, useRef, useMemo } from "react";
import GlobalSearchBar from "../components/GlobalSearchBar";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import {
  Star, ChevronLeft, ChevronRight, Search, Flame,
  Book as BookIcon, TrendingUp, Zap, SlidersHorizontal,
  BookOpen, Heart, Award, Sparkles, Coffee, Globe,
  Music, Microscope, X, ChevronDown, Users, BarChart2,
  ShoppingCart, ArrowUpRight, Trophy, Tag,
  CheckCircle,
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
        const SORT_MAP: Record<string, { sort: string; order: string }> = {
          rating:       { sort: "purchases", order: "desc" },
          priceLowHigh: { sort: "price",     order: "asc"  },
          priceHighLow: { sort: "price",     order: "desc" },
        };
        const { sort, order } = SORT_MAP[sortBy] ?? { sort: "purchases", order: "desc" };
        const result = await fetchBooks({
          page: currentPage,
          limit: initialLimit,
          category: selectedCategory,
          search: debouncedSearch,
          sort,
          order,
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
  if (n.includes("music") || n.includes("art")) return <BookOpen size={14} />;
  if (n.includes("award") || n.includes("prize")) return <Award size={14} />;
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

  const readers = Math.floor((rating * 340) + (rank <= 5 ? 800 : 200) - rank * 12);
  if (readers > 900) reasons.push({ label: `${readers.toLocaleString()} readers`, color: "rose", icon: <Users size={11} /> });

  return reasons.slice(0, 2);
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
      <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
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

const shimmer = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.4s ease infinite",
} as React.CSSProperties;

// ─── Desktop Hero Card ────────────────────────────────────────────────────────
const DesktopHero: React.FC<{ heroBg: string }> = ({ heroBg }) => (
  <header
    className="relative pt-14 pb-12 px-6 md:px-8 overflow-hidden"
    style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
    <div className="relative z-10 max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
        <div>
          <span className="text-white font-black uppercase tracking-[0.3em] mb-2 block">
            Britain's Bestsellers
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-xl">
            Popular Books
          </h1>
        </div>
        <div className="w-full md:w-auto md:min-w-[380px] max-w-md">
          <GlobalSearchBar variant="light" placeholder="Search titles, authors…" />
        </div>
      </div>
    </div>
  </header>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const PopularBooksPage: React.FC = () => {
  const BOOKS_PER_PAGE = 12;
  const { state, actions } = useBookPulse(BOOKS_PER_PAGE);
  const totalPages = Math.ceil(state.totalBooks / BOOKS_PER_PAGE);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const trendRef = useRef<HTMLDivElement>(null);
  const [heroBg] = useState(() => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/1600/900`);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const avgRating = useMemo(() => {
    if (!state.books.length) return 0;
    return state.books.reduce((s, b) => s + Number(b.rating || 0), 0) / state.books.length;
  }, [state.books]);

  const sortTabs = [
    { val: "rating",       label: "Top Rated",  icon: <Star size={13} /> },
    { val: "priceLowHigh", label: "Best Value", icon: <Tag size={13} /> },
    { val: "priceHighLow", label: "Premium",    icon: <Award size={13} /> },
  ];

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-red-50">
      <SEOHead
        title="Popular Books"
        description="Browse the most popular books at BritBooks, loved by readers across the UK. Find top-rated titles at great prices with fast delivery."
        canonical="/popular-books"
      />
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
                Popular <span className="text-red-400">Reads</span>
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
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${!state.selectedCategory ? "bg-red-600 text-white" : "bg-white/10 text-white/70"}`}>
              <Zap size={11} /> All
            </button>
            {state.categories.slice(0, 10).map(cat => (
              <button key={cat.id} onClick={() => { actions.setSelectedCategory(cat.name); actions.setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${state.selectedCategory === cat.name ? "bg-red-600 text-white" : "bg-white/10 text-white/70"}`}>
                {getCatIcon(cat.name)} {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-red-600 rounded-full" />
            <span className="font-black text-sm text-gray-900">Trending Now</span>
          </div>
          <div ref={trendRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1"
            style={{ opacity: state.isLoading ? 0.45 : 1, transition: "opacity 0.2s ease", pointerEvents: state.isLoading ? "none" : "auto" }}>
            {state.books.length === 0 && state.isLoading
              ? Array(4).fill(0).map((_, i) => <div key={i} className="snap-start flex-shrink-0 w-[72vw] h-[230px] rounded-3xl bg-gray-200 animate-pulse" />)
              : state.books.slice(0, 8).map((book, i) => <MobileTrendCard key={book.id || i} book={book} index={i} />)
            }
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {Array(Math.min(state.books.slice(0, 8).length, 8)).fill(0).map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i === 0 ? "w-4 h-1.5 bg-red-600" : "w-1.5 h-1.5 bg-gray-300"}`} />
            ))}
          </div>
        </div>

        <div className="px-4 mt-6 flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-red-600 rounded-full" />
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
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-left transition ${state.sortBy === opt.val ? "bg-red-50 text-red-700" : "text-gray-700 hover:bg-gray-50"}`}>
                  {opt.icon} {opt.label}
                  {state.sortBy === opt.val && <span className="ml-auto text-red-600">✓</span>}
                </button>
              ))}
            </div>
          )}
          {state.books.length === 0 && state.isLoading ? (
              <div className="grid grid-cols-2 gap-3 pb-32">
                {Array(10).fill(0).map((_, i) => <MobileBookCardSkeleton key={i} />)}
              </div>
            ) : (
              <div
                className="grid grid-cols-2 gap-3 pb-32"
                style={{ opacity: state.isLoading ? 0.45 : 1, transition: "opacity 0.2s ease", pointerEvents: state.isLoading ? "none" : "auto" }}
              >
                {state.books.map((book, i) => {
                  const rank = i + 1 + (state.currentPage - 1) * BOOKS_PER_PAGE;
                  const numPrice = typeof book.price === "number" ? `£${Number(book.price).toFixed(2)}` : String(book.price);
                  return (
                    <div key={book.id || i} className="relative">
                      {rank <= 3 ? (
                        <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-lg pointer-events-none
                          ${rank === 1 ? "bg-red-600" : rank === 2 ? "bg-[#0a1628]" : "bg-red-800"}`}>{rank}</div>
                      ) : (
                        <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full pointer-events-none">#{rank}</div>
                      )}
                      <BookCard id={book.id || book._id} img={book.imageUrl} title={book.title} author={book.author} price={numPrice} category={book.category} />
                    </div>
                  );
                })}
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
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════
          DESKTOP VIEW
      ═══════════════════════════════════ */}
      <div className="hidden sm:block min-h-screen bg-[#f7f4ef]">
        <TopBar />

        {/* ── Hero Card ── */}
        <DesktopHero heroBg={heroBg} />

        {/* ── Sidebar + Content ── */}
        <div className="w-full px-4 sm:px-6 lg:px-10 pt-10 pb-32">
          <div className="flex gap-8 lg:gap-10 items-start">

            {/* ── Left Sidebar ── */}
            <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
              <div className="sticky top-24">

                {/* Sort */}
                <div className="mb-8">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-3">Sort By</h4>
                  <div className="space-y-1">
                    {sortTabs.map(tab => (
                      <button
                        key={tab.val}
                        onClick={() => { actions.setSortBy(tab.val); actions.setCurrentPage(1); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all"
                        style={state.sortBy === tab.val
                          ? { background: "#dc2626", color: "white" }
                          : { color: "#374151" }
                        }
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100 mb-8" />

                {/* Categories */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-3">Categories</h4>
                  <div className="space-y-1">
                    {state.categories.length === 0 ? (
                      Array(8).fill(0).map((_, i) => (
                        <div key={i} className="h-10 rounded-xl mx-1" style={{ ...shimmer, width: `${70 + (i % 3) * 10}%` }} />
                      ))
                    ) : (
                      <>
                        <button
                          onClick={() => { actions.setSelectedCategory(null); actions.setCurrentPage(1); }}
                          className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all"
                          style={!state.selectedCategory ? { background: "#dc2626", color: "white" } : { color: "#374151" }}
                        >
                          All Books
                        </button>
                        {state.categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => { actions.setSelectedCategory(cat.name); actions.setCurrentPage(1); }}
                            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all capitalize"
                            style={state.selectedCategory === cat.name ? { background: "#dc2626", color: "white" } : { color: "#374151" }}
                          >
                            {getCatIcon(cat.name)} {cat.name}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>

              </div>
            </aside>

            {/* ── Book Grid ── */}
            <div className="flex-1 min-w-0">

              {/* Header row */}
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    {state.selectedCategory
                      ? <span className="capitalize">{state.selectedCategory}</span>
                      : "All popular books"
                    }
                  </p>
                  {state.totalBooks > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {state.totalBooks.toLocaleString()} titles · page {state.currentPage} of {totalPages}
                    </p>
                  )}
                </div>
              </div>

              {state.books.length === 0 && state.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10">
                  {Array(15).fill(0).map((_, i) => <DesktopBookSkeleton key={i} />)}
                </div>
              ) : state.books.length === 0 ? (
                <div className="text-center py-28 rounded-3xl border-2 border-dashed border-gray-100">
                  <BookIcon size={52} className="mx-auto text-gray-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-600">No books found</h3>
                  <p className="text-gray-400 text-sm mt-2">Try a different genre or sort order.</p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10"
                  style={{ opacity: state.isLoading ? 0.45 : 1, transition: "opacity 0.2s ease", pointerEvents: state.isLoading ? "none" : "auto" }}
                >
                  {state.books.map((book, i) => {
                    const rank = i + 1 + (state.currentPage - 1) * BOOKS_PER_PAGE;
                    const numPrice = typeof book.price === "number" ? `£${Number(book.price).toFixed(2)}` : String(book.price);
                    return (
                      <div key={book.id || i} className="relative">
                        {rank <= 3 ? (
                          <div
                            className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg pointer-events-none"
                            style={{ background: rank === 1 ? "#dc2626" : rank === 2 ? "#0a1628" : "#b91c1c", color: "white" }}
                          >
                            {rank}
                          </div>
                        ) : rank <= 10 ? (
                          <div className="absolute top-2 left-2 z-10 bg-[#0a1628]/70 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full pointer-events-none">
                            #{rank}
                          </div>
                        ) : null}
                        <BookCard
                          id={book.id || book._id}
                          img={book.imageUrl}
                          title={book.title}
                          author={book.author}
                          price={numPrice}
                          category={book.category}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-2">
                  <button
                    disabled={state.currentPage === 1}
                    onClick={() => { actions.setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-bold hover:border-gray-300 disabled:opacity-30 transition shadow-sm"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <div className="flex gap-1.5">
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
                          className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
                          style={state.currentPage === page
                            ? { background: "#dc2626", color: "white", boxShadow: "0 4px 12px rgba(220,38,38,0.35)" }
                            : { background: "white", color: "#6b7280", border: "1px solid #e5e7eb" }
                          }
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={state.currentPage === totalPages}
                    onClick={() => { actions.setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-30 transition shadow-sm"
                    style={{ background: "#dc2626", color: "white" }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>{/* end book grid col */}
          </div>{/* end flex row */}
        </div>

        <Footer />
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flamePulse { 0%, 100% { transform: scale(1) rotate(-5deg); } 50% { transform: scale(1.2) rotate(5deg); } }
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

const DesktopBookSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-3 space-y-2">
    <div className="w-full h-60 rounded" style={shimmer} />
    <div className="h-3.5 rounded w-full" style={shimmer} />
    <div className="h-3 rounded w-2/3" style={shimmer} />
    <div className="h-3 rounded w-1/3 mb-1" style={shimmer} />
    <div className="h-4 rounded w-1/4 mx-auto" style={shimmer} />
    <div className="h-8 rounded-full w-full" style={shimmer} />
  </div>
);

const MobileBookCardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden">
    <div className="aspect-[3/4]" style={shimmer} />
    <div className="pt-2 px-0.5 space-y-1.5">
      <div className="h-3 rounded w-full" style={shimmer} />
      <div className="h-3 rounded w-2/3" style={shimmer} />
      <div className="flex justify-between items-center pt-1">
        <div className="h-4 rounded w-12" style={shimmer} />
        <div className="w-7 h-7 rounded-xl" style={shimmer} />
      </div>
    </div>
  </div>
);

export default PopularBooksPage;
