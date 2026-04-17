import React, { useState, useEffect, useRef } from "react";
import GlobalSearchBar from "../components/GlobalSearchBar";
import { Link, useNavigate } from "react-router-dom";
import {
  Star, ChevronLeft, ChevronRight, Search, Flame,
  Book as BookIcon, TrendingUp, Zap, SlidersHorizontal,
  BookOpen, Heart, Award, Sparkles, Coffee, Globe,
  Music, Microscope, X, ChevronDown
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import BookCard from "../components/BookCard";


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

// ─── Category icon mapping ────────────────────────────────────────────────────
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
      {/* Rank badge */}
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
  const BOOKS_PER_PAGE = 14;
  const { state, actions } = useBookPulse(BOOKS_PER_PAGE);
  const totalPages = Math.ceil(state.totalBooks / BOOKS_PER_PAGE);
  const trendingBook = state.books[state.trendingIndex];
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const trendRef = useRef<HTMLDivElement>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="bg-[#FBFBFE] min-h-screen font-sans selection:bg-indigo-100">
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />

      {/* ═══════════════════════════════════════
          MOBILE VIEW
      ═══════════════════════════════════════ */}
      <div className="sm:hidden flex flex-col min-h-screen bg-[#f8f8fb]">
        <TopBar />

        {/* ── Sticky App Header ── */}
        <div className="sticky top-0 z-40 bg-[#0d1b3e] px-4 pb-0 pt-4 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white/40 text-[11px] font-medium">{greeting} 👋</p>
              <h1 className="text-white font-black text-2xl tracking-tight flex items-center gap-2">
                Popular <span className="text-indigo-400">Reads</span>
                <Flame size={20} className="text-orange-400" style={{ animation: "flamePulse 1.5s ease-in-out infinite" }} />
              </h1>
            </div>
            <button
              onClick={() => setMobileSearchOpen(v => !v)}
              className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mt-1 active:scale-90 transition-transform"
            >
              {mobileSearchOpen ? <X size={18} className="text-white" /> : <Search size={18} className="text-white" />}
            </button>
          </div>

          {/* Search expand */}
          {mobileSearchOpen && (
            <div className="pb-3" style={{ animation: "slideDown 0.2s ease" }}>
              <GlobalSearchBar variant="dark" placeholder="Search books, authors…" />
            </div>
          )}

          {/* Genre Pills */}
          <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { actions.setSelectedCategory(null); actions.setCurrentPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all
                ${!state.selectedCategory ? "bg-indigo-500 text-white" : "bg-white/10 text-white/70"}`}
            >
              <Zap size={11} /> All
            </button>
            {state.categories.slice(0, 10).map(cat => (
              <button
                key={cat.id}
                onClick={() => { actions.setSelectedCategory(cat.name); actions.setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all
                  ${state.selectedCategory === cat.name ? "bg-indigo-500 text-white" : "bg-white/10 text-white/70"}`}
              >
                {getCatIcon(cat.name)} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Trending Carousel ── */}
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
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="snap-start flex-shrink-0 w-[72vw] h-[230px] rounded-3xl bg-gray-200 animate-pulse" />
                ))
              : state.books.slice(0, 8).map((book, i) => (
                  <MobileTrendCard key={book.id || i} book={book} index={i} />
                ))
            }
          </div>
          {/* Scroll hint dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {Array(Math.min(state.books.slice(0, 8).length, 8)).fill(0).map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i === 0 ? "w-4 h-1.5 bg-indigo-600" : "w-1.5 h-1.5 bg-gray-300"}`} />
            ))}
          </div>
        </div>

        {/* ── All Books Grid ── */}
        <div className="px-4 mt-6 flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <span className="font-black text-sm text-gray-900">All Books</span>
            </div>
            <button
              onClick={() => setMobileSortOpen(v => !v)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl px-3 py-1.5 text-[11px] font-bold text-gray-700 shadow-sm"
            >
              <SlidersHorizontal size={12} />
              {state.sortBy === "rating" ? "Top Rated" : state.sortBy === "priceLowHigh" ? "Price ↑" : "Price ↓"}
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Sort dropdown */}
          {mobileSortOpen && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-4 overflow-hidden" style={{ animation: "slideDown 0.15s ease" }}>
              {[
                { val: "rating", label: "Top Rated", icon: <Star size={14} /> },
                { val: "priceLowHigh", label: "Price: Low to High", icon: <TrendingUp size={14} /> },
                { val: "priceHighLow", label: "Price: High to Low", icon: <ChevronDown size={14} /> },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => { actions.setSortBy(opt.val); actions.setCurrentPage(1); setMobileSortOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-left transition
                    ${state.sortBy === opt.val ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                >
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
                        {rank <= 3 && (
                          <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-lg pointer-events-none
                            ${rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-gray-400" : "bg-amber-700"}`}>
                            {rank}
                          </div>
                        )}
                        {rank > 3 && (
                          <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full pointer-events-none">
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
                      </div>
                    );
                  })
              }
            </div>
          )}
        </div>

        {/* ── Floating Pagination Bar ── */}
        {totalPages > 1 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => { actions.setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={state.currentPage === 1}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform"
              >
                <ChevronLeft size={18} /> Prev
              </button>

              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400 font-medium">Page</span>
                <span className="font-black text-gray-900 text-lg leading-tight">{state.currentPage}<span className="text-gray-400 font-medium text-sm">/{totalPages}</span></span>
              </div>

              <button
                onClick={() => { actions.setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={state.currentPage === totalPages}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          DESKTOP VIEW
      ═══════════════════════════════════════ */}
      <div className="hidden sm:block">
        <TopBar />

        {/* Hero */}
        <header className="relative pt-10 pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold tracking-widest uppercase">
                  <TrendingUp size={14} /> The Reader's Pulse
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-slate-900 tracking-tight">
                  Discover <span className="text-indigo-600">Popular</span> Stories.
                </h1>
                <p className="text-base sm:text-lg text-slate-500 max-w-lg leading-relaxed">
                  Explore the titles topping charts this week across all genres, curated by our community of bibliophiles.
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                  <div className="relative z-10 flex items-start gap-6">
                    <div className="w-24 h-36 bg-slate-800 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 transition-transform group-hover:-rotate-2">
                      {trendingBook?.imageUrl && <img src={trendingBook.imageUrl} alt="Trend" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={12} fill="currentColor" /> Live Trend
                      </span>
                      <h3 className="text-xl font-bold leading-tight line-clamp-2">{trendingBook?.title || "Curating trends..."}</h3>
                      <p className="text-slate-400 text-sm">by {trendingBook?.author || "..."}</p>
                      <button className="pt-2 text-white font-bold text-sm border-b-2 border-indigo-500 hover:text-indigo-400 transition-colors">
                        Quick View
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                    <div key={state.trendingIndex} className="h-full bg-indigo-500 origin-left animate-[progress_6s_linear_forwards]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <section className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-y border-slate-100 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <GlobalSearchBar variant="light" placeholder="Search titles, authors…" />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => actions.setSelectedCategory(null)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${!state.selectedCategory ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Genres
              </button>
              {state.categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => actions.setSelectedCategory(cat.name)}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${state.selectedCategory === cat.name ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <SlidersHorizontal size={16} className="ml-3 text-slate-400" />
              <select
                className="bg-transparent border-none text-xs font-bold uppercase py-2 focus:ring-0 cursor-pointer"
                value={state.sortBy}
                onChange={(e) => actions.setSortBy(e.target.value)}
              >
                <option value="rating">Top Rated</option>
                <option value="priceLowHigh">Lowest Price</option>
                <option value="priceHighLow">Highest Price</option>
              </select>
            </div>
          </div>
        </section>

        {/* Grid */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          {state.books.length === 0 && !state.isLoading ? (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <BookIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800">No matches found</h2>
              <p className="text-slate-500">Try broadening your search or choosing a different genre.</p>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {state.isLoading
                ? Array(10).fill(0).map((_, i) => <BookCardSkeleton key={i} />)
                : state.books.map(book => (
                    <BookCard
                      key={book.id}
                      id={book.id}
                      img={book.imageUrl}
                      title={book.title}
                      author={book.author}
                      price={book.price}
                    />
                  ))
              }
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-20 flex justify-center">
              <div className="flex items-center gap-2 bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
                <button
                  disabled={state.currentPage === 1}
                  onClick={() => actions.setCurrentPage(p => p - 1)}
                  className="p-3 rounded-2xl hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="px-6 text-sm font-bold tracking-widest text-slate-400">
                  <span className="text-slate-900">{state.currentPage}</span> / {totalPages}
                </span>
                <button
                  disabled={state.currentPage === totalPages}
                  onClick={() => actions.setCurrentPage(p => p + 1)}
                  className="p-3 rounded-2xl hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>

      <style>{`
        @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flamePulse { 0%, 100% { transform: scale(1) rotate(-5deg); } 50% { transform: scale(1.2) rotate(5deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

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
