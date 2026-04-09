import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Star, ChevronLeft, ChevronRight, Search, 
  Book as BookIcon, TrendingUp, Zap, ListFilter, SlidersHorizontal
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import BookCard from "../components/BookCard";

// --- Logic Hook: Separating State from View ---
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

// --- Redesigned UI Component ---
const PopularBooksPage: React.FC = () => {
  const BOOKS_PER_PAGE = 14;
  const { state, actions } = useBookPulse(BOOKS_PER_PAGE);
  const totalPages = Math.ceil(state.totalBooks / BOOKS_PER_PAGE);
  const trendingBook = state.books[state.trendingIndex];

  return (
    <div className="bg-[#FBFBFE] min-h-screen font-sans selection:bg-indigo-100">
      <Toaster position="top-center" />
      <TopBar />

      {/* Modern Hero Section */}
      <header className="relative pt-10 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold tracking-widest uppercase">
                <TrendingUp size={14} /> The Reader's Pulse
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight">
                Discover <span className="text-indigo-600">Popular</span> Stories.
              </h1>
              <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                Explore the titles topping charts this week across all genres, 
                curated by our community of bibliophiles.
              </p>
            </div>

            {/* Featured Trending Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
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
                
                {/* Progress Bar for rotation */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                  <div key={state.trendingIndex} className="h-full bg-indigo-500 origin-left animate-[progress_6s_linear_forwards]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Filter Section */}
      <section className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-y border-slate-100 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-4 items-center">
          
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search titles, authors..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
              value={state.searchTerm}
              onChange={(e) => actions.setSearchTerm(e.target.value)}
            />
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

      {/* Main Grid Content */}
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
                  key={book._id}
                  id={book._id}
                  img={book.imageUrl}
                  title={book.title}
                  author={book.author}
                  price={book.price}
                />
              ))
            }
          </div>
        )}

        {/* Pagination */}
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

      <style>{`
        @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
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

export default PopularBooksPage;