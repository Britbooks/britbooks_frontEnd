import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Star, ChevronLeft, ChevronRight, Search, Filter, Brain, 
  Flame, PenTool, ChefHat, Palette, Laugh, Building, 
  Award, Users, Zap, Book as BookIcon, Info, TrendingUp, ShoppingBag, Eye
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories, Book } from "../data/books";
import { useCart } from "../context/cartContext";

// --- Functional logic and mock preserved exactly as requested ---
const mockFetchBooks = async ({ page, limit, filters, sort, order }: any) => {
  const category = filters?.category || "Fiction";
  return {
    books: Array(limit).fill(0).map((_, i) => ({
      id: `${page}-${i}`,
      title: `Book ${i + 1} (Page ${page})`,
      author: "Author Name",
      category,
      price: 10 + i,
      rating: 4 + Math.random(),
      imageUrl: "https://via.placeholder.com/150",
      stock: Math.random() > 0.1 ? 10 : 0,
      popularityReason: `High ratings and trending on X due to recent reviews.`,
    })),
    total: 600000,
  };
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={12}
        className={i < Math.round(rating) ? "text-amber-400" : "text-slate-200"}
        fill={i < Math.round(rating) ? "currentColor" : "none"}
      />
    ))}
  </div>
);

const BookCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 animate-pulse">
    <div className="aspect-[3/4] bg-slate-100 rounded-xl" />
    <div className="h-4 bg-slate-100 w-3/4 rounded" />
    <div className="h-3 bg-slate-100 w-1/2 rounded" />
  </div>
);

// --- Styled Components ---

const BookCard: React.FC<{ book: any; rank: number }> = React.memo(({ book, rank }) => {
  const { addToCart } = useCart();
  const isTopTen = rank <= 10;

  const handleAddToCart = () => {
    addToCart({
      id: book.id,
      img: book.imageUrl || "https://via.placeholder.com/150",
      title: book.title,
      author: book.author,
      price: `£${book.price.toFixed(2)}`,
      quantity: 1,
    });
    toast.success(`${book.title} in basket!`, {
      style: { borderRadius: '12px', background: '#1e293b', color: '#fff' }
    });
  };

  const showPopularityReason = () => {
    toast((t) => (
      <div className="bg-white p-4 rounded-xl max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={18} className="text-indigo-600" />
          <h4 className="font-bold text-slate-900">Why # {rank}?</h4>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          {book.popularityReason || "This title is currently gaining massive traction across major reading communities and social platforms."}
        </p>
        <button 
          onClick={() => toast.dismiss(t.id)}
          className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    ), { duration: 5000 });
  };

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-2 flex flex-col h-full ${
      isTopTen ? "border-amber-200" : "border-slate-100"
    }`}>
      <div className="relative aspect-[3/4] m-3 overflow-hidden rounded-xl bg-slate-50">
        <Link to={`/browse/${book.id}`}>
          <img
            src={book.imageUrl || "https://via.placeholder.com/150"}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>
        <div className={`absolute top-0 left-0 px-3 py-1.5 text-xs font-black rounded-br-xl shadow-lg ${
          isTopTen ? "bg-amber-400 text-amber-950" : "bg-slate-900 text-white"
        }`}>
          #{rank}
        </div>
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 px-4">
          <Link to={`/browse/${book.id}`} className="w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <button className="w-full bg-white text-slate-900 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Eye size={14} /> Quick View
            </button>
          </Link>
          <button 
            onClick={handleAddToCart}
            disabled={book.stock === 0}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 disabled:bg-slate-500"
          >
            <ShoppingBag size={14} /> {book.stock === 0 ? "Out of Stock" : "Add to Bag"}
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col flex-grow">
        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
          {book.title}
        </h4>
        <p className="text-[11px] text-slate-400 font-medium mb-3">{book.author}</p>
        
        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900">£{book.price.toFixed(2)}</span>
            <StarRating rating={book.rating || 0} />
          </div>
          <button 
            onClick={showPopularityReason}
            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Info size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

const PopularBooksPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(600000);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousCategory = (location.state as { category?: string })?.category || "Browse";

  const BOOKS_PER_PAGE = 105;

  // Logic blocks remain untouched for functionality
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories.map((cat: any) => ({
          id: cat._id, name: cat.name
        })));
      } catch (err) { console.error(err); }
    };
    fetchCategoryData();
  }, []);

  useEffect(() => {
    const fetchPopularBooks = async () => {
      setIsLoading(true);
      setError(null);
  
      try {
        const reqBody: Record<string, any> = {
          page: currentPage,
          limit: BOOKS_PER_PAGE,
        };
  
        // Only add fields when they have meaningful values
        if (selectedCategory) {
          reqBody.category = selectedCategory;
        }
  
        if (searchTerm.trim()) {
          reqBody.search = searchTerm.trim();   // assuming backend supports "search"
        }
  
        // Sort / order logic (kept exactly as you had it)
        reqBody.sort = sortBy.includes("price") ? "price" : sortBy;
        reqBody.order =
          sortBy === "priceHighLow"
            ? "desc"
            : sortBy === "title"
              ? "asc"
              : "desc";
  
        console.log("→ Sending to /listings:", JSON.stringify(reqBody, null, 2));
  
        let result;
        try {
          result = await fetchBooks(reqBody);
        } catch (apiError) {
          console.warn("[PopularBooks] API failed → using mock", apiError);
          result = await mockFetchBooks(reqBody);
        }
  
        const fetched = result.listings || result.books || [];
        setBooks(fetched);
        setTotalBooks(result.meta?.count || result.total || 600000);
        setIsLoading(false);
      } catch (err: any) {
        console.error("[PopularBooks] Fetch crashed:", err);
        setError("Unable to load popular titles. Please try again.");
        setIsLoading(false);
      }
    };
  
    fetchPopularBooks();
  }, [currentPage, selectedCategory, searchTerm, sortBy]);

  const totalPages = Math.min(Math.ceil(totalBooks / BOOKS_PER_PAGE), 600);
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
      
      <Toaster position="bottom-right" />
      <TopBar />

      <div className="bg-white border-b border-slate-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
    <nav aria-label="Breadcrumb" className="flex items-center justify-end text-[11px] font-black uppercase tracking-widest">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li className="flex items-center">
          <Link to="/" className="flex items-center text-slate-400 hover:text-indigo-600 transition">
            HOME
          </Link>
        </li>
        <li className="text-slate-300">/</li>

        {/* Only show category crumb when there is an active category */}
        {(selectedCategory || (previousCategory && previousCategory !== "Browse")) && (
          <>
            <li className="flex items-center">
              <Link
                to={`/category?category=${encodeURIComponent(
                  selectedCategory || previousCategory
                )}`}
                state={{ category: selectedCategory || previousCategory }}
                className="text-slate-400 hover:text-indigo-600 transition-colors truncate max-w-[140px] sm:max-w-[220px] md:max-w-none"
              >
                {selectedCategory || previousCategory}
              </Link>
            </li>
            <li className="text-slate-300">/</li>
          </>
        )}

        <li className="text-slate-900 border-b-2 border-indigo-500 pb-0.5">
          POPULAR BOOKS
        </li>
      </ol>
    </nav>
  </div>
</div>

      {/* Modern Gradient Hero */}
      <div className="relative overflow-hidden bg-slate-950 py-20 px-6">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent)]" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest uppercase mb-6">
            <TrendingUp size={12} /> Community Favorites
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            What's Everyone <span className="text-indigo-500 italic">Reading?</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Real-time rankings based on sales, reviews, and community engagement. 
            Updated hourly to bring you the pulse of the literary world.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-8 pb-20">
        
        {/* Modern Filter Bar */}
        <div className="sticky top-20 z-40 -mt-10 mb-12">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-2xl p-3 md:p-5 flex flex-col lg:flex-row items-center gap-4">
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Find a title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:flex-1">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                All Genres
              </button>
              {categories.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === c.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="rating">Top Rated</option>
                <option value="title">Alphabetical</option>
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
              </select>
              
              {isLiveUpdating && (
                <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-black text-rose-500 uppercase">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Grid System */}
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {isLoading ? (
            [...Array(21)].map((_, i) => <BookCardSkeleton key={i} />)
          ) : (
            books.map((book, index) => (
              <BookCard 
                key={book.id} 
                book={book} 
                rank={(currentPage - 1) * BOOKS_PER_PAGE + index + 1} 
              />
            ))
          )}
        </div>

        {/* Pagination UI */}
        {!isLoading && (
          <div className="mt-20 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm">
                <span className="text-indigo-600">{currentPage}</span>
                <span className="mx-2 text-slate-300">/</span>
                <span className="text-slate-500">{totalPages}</span>
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Browse catalog</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PopularBooksPage;
