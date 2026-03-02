import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Star, ChevronLeft, ChevronRight, Search, 
  Book as BookIcon, TrendingUp, Zap, Heart, Eye
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import BookCard from "../components/BookCard";

// --- Sub-components ---

const BookCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 animate-pulse">
    <div className="aspect-[3/4] bg-slate-100 rounded-xl" />
    <div className="h-4 bg-slate-100 w-3/4 rounded" />
    <div className="h-3 bg-slate-100 w-1/2 rounded" />
  </div>
);

// --- Main Page Component ---

const PopularBooksPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [books, setBooks] = useState<any[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  
  // Trending Rotation State
  const [trendingIndex, setTrendingIndex] = useState(0);

  const BOOKS_PER_PAGE = 30;

  // 1. Debounce Logic for Search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. Fetch Categories on Mount
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const fetched = await fetchCategories();
        setCategories(fetched.map((cat: any) => ({ id: cat._id, name: cat.name })));
      } catch (err) { console.error("Category fetch error:", err); }
    };
    fetchCategoryData();
    document.title = "Popular Books | Pulse";
  }, []);

  // 3. Main Data Fetch
  useEffect(() => {
    const fetchPopularBooks = async () => {
      setIsLoading(true);
      try {
        const reqBody = {
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          category: selectedCategory,
          search: debouncedSearch,
          sort: sortBy.includes("price") ? "price" : sortBy,
          order: sortBy === "priceHighLow" ? "desc" : "asc"
        };
  
        const result = await fetchBooks(reqBody);
        setBooks(result.listings || result.books || []);
        setTotalBooks(result.meta?.count || result.total || 0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPopularBooks();
  }, [currentPage, selectedCategory, debouncedSearch, sortBy]);

  // 4. Trending Rotation Logic (Every 5 Seconds)
  useEffect(() => {
    if (books.length > 0) {
      const interval = setInterval(() => {
        setTrendingIndex((prev) => (prev + 1) % Math.min(books.length, 10));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [books]);

  // 5. Derived State
  const totalPages = useMemo(() => Math.ceil(totalBooks / BOOKS_PER_PAGE), [totalBooks]);
  const trendingBook = books[trendingIndex] || null;

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col font-sans selection:bg-indigo-100">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes progress-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress { animation: progress-bar 5s linear forwards; }
      `}</style>
      
      <Toaster position="bottom-right" />
      <TopBar />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center justify-end text-[10px] font-black uppercase tracking-widest">
            <ol className="flex items-center gap-2">
              <li><Link to="/" className="text-slate-400 hover:text-indigo-600">HOME</Link></li>
              <li className="text-slate-300">/</li>
              <li className="text-slate-900 border-b-2 border-indigo-500">POPULAR</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* --- INTERACTIVE PROMO BANNER --- */}
      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-10 mb-6">
        <div className="relative overflow-hidden bg-slate-950 rounded-[2rem] border border-white/10 shadow-2xl">
          {/* Animated Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 blur-[100px] -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 blur-[100px] -ml-40 -mb-40" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-10 py-10 gap-8">
            
            {/* Left: Live Status */}
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left flex-1">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Zap size={30} className="text-white animate-pulse" fill="currentColor" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-slate-950"></span>
                </span>
              </div>

              <div className="overflow-hidden">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black tracking-widest uppercase mb-3">
                  <TrendingUp size={12} /> Trending: {selectedCategory || "All Stories"}
                </div>
                
                <div key={trendingBook?.id || 'loading'} className="transition-all duration-700 animate-in fade-in slide-in-from-bottom-3">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight line-clamp-1">
                    {trendingBook ? trendingBook.title : "Calculating Trends..."}
                  </h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">
                    {trendingBook 
                      ? <span>By <span className="text-indigo-400">{trendingBook.author}</span> — Trending 15% higher this hour.</span>
                      : "Aggregating community data for your selection."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Book Preview & Action */}
            <div className="flex items-center gap-8">
              {trendingBook && (
                <div className="hidden xl:block w-16 h-24 rounded-xl overflow-hidden shadow-2xl border border-white/10 rotate-3 transition-transform hover:rotate-0">
                  <img src={trendingBook.imageUrl} alt="cover" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col items-center lg:items-end gap-3">
                <button className="px-10 py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95">
                  View Detail
                </button>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                  Next update in <span className="text-indigo-400">5s</span>
                </p>
              </div>
            </div>
          </div>

          {/* Timer Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
            <div 
              key={trendingIndex} 
              className="h-full bg-indigo-500 animate-progress"
            />
          </div>
        </div>
      </div>

      {/* --- STICKY FILTER BAR --- */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-8 pb-20">
        <div className=" top-4 z-50 mb-12">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 flex flex-col lg:flex-row items-center gap-4">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search the pulse..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:flex-1">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${!selectedCategory ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                All
              </button>
              {categories.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === c.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="bg-slate-100 border-none rounded-xl py-3 px-4 text-xs font-black uppercase text-slate-700 w-full lg:w-auto cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="priceLowHigh">Price: Low</option>
              <option value="priceHighLow">Price: High</option>
            </select>
          </div>
        </div>

        {/* --- BOOK GRID --- */}
        {books.length === 0 && !isLoading ? (
          <div className="py-32 text-center bg-white rounded-3xl border border-slate-100 shadow-inner">
            <BookIcon size={64} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-900">No Titles Found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or category selection.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {isLoading ? (
              [...Array(14)].map((_, i) => <BookCardSkeleton key={i} />)
            ) : (
              books.map((book) => (
                <BookCard
                  key={book._id || book.id}
                  id={book._id || book.id}
                  img={book.imageUrl}  
                  title={book.title}
                  author={book.author}
                  price={typeof book.price === "number" ? `£${book.price.toFixed(2)}` : book.price}
                />
              ))
            )}
          </div>
        )}

        {/* --- PAGINATION --- */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-24 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="px-6 py-2 text-sm font-black tracking-widest text-slate-900 border-x border-slate-100">
                {currentPage} <span className="text-slate-300 mx-1">/</span> {totalPages}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">
              {totalBooks} total results found
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PopularBooksPage;