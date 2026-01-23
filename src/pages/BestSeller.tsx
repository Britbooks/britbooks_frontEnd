import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Star, Filter, Brain, Flame, 
  PenTool, ChefHat, Palette, Laugh, Building, Award, 
  Users, Zap, Book as BookIcon, ShoppingBag, Eye, TrendingUp
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories, Book } from "../data/books";
import { useCart } from "../context/cartContext";

/**
 * REDESIGN HIGHLIGHTS:
 * - Preserved the Breadcrumb navigation as requested.
 * - Added a premium "Chart" aesthetic with indigo and slate tones.
 * - Improved card interaction with hover-state overlays.
 * - Added "Stock Urgency" indicators for low-inventory bestsellers.
 */

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={12}
        className={i < Math.round(rating) ? "text-amber-500" : "text-slate-200"}
        fill={i < Math.round(rating) ? "currentColor" : "none"}
      />
    ))}
  </div>
);

const BookCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 animate-pulse">
    <div className="aspect-[2/3] bg-slate-100 rounded-xl" />
    <div className="h-4 bg-slate-100 w-3/4 rounded" />
    <div className="h-3 bg-slate-100 w-1/2 rounded" />
  </div>
);

const BookCard: React.FC<{ book: Book; rank: number }> = React.memo(({ book, rank }) => {
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
    toast.success(`${book.title} added!`, {
      icon: '🛒',
      style: { borderRadius: '12px', background: '#1e293b', color: '#fff' },
    });
  };

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-500 hover:shadow-2xl flex flex-col h-full overflow-hidden ${
      isTopTen ? "border-amber-200 ring-1 ring-amber-50" : "border-slate-100"
    }`}>
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-50">
        <Link to={`/browse/${book.id}`} className="block h-full">
          <img
            src={book.imageUrl || "https://via.placeholder.com/150"}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>
        
        <div className={`absolute top-0 left-0 px-4 py-2 font-black text-sm rounded-br-2xl shadow-lg z-10 ${
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

      <div className="p-4 flex flex-col flex-grow">
        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight min-h-[2.5rem] mb-1">
          {book.title}
        </h4>
        <p className="text-xs text-slate-400 mb-3">{book.author}</p>
        
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900">£{book.price.toFixed(2)}</span>
            <StarRating rating={book.rating || 0} />
          </div>
          {book.stock < 10 && book.stock > 0 && (
            <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase bg-rose-50 px-2 py-1 rounded-md animate-pulse">
              <TrendingUp size={10} /> Fast Seller
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const BestsellersPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const location = useLocation();
  const [totalBooks, setTotalBooks] = useState(600000);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const BOOKS_PER_PAGE = 105;
  const previousCategory = (location.state as { category?: string })?.category || "Browse";

  useEffect(() => {
    const fetchBestsellers = async () => {
      setIsLoading(true);
      setError(null);
  
      try {
        const reqBody: Record<string, any> = {
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          sort: "rating",
          order: "desc",
        };
  
        // Add category only when it's actually selected
        if (selectedCategory) {
          reqBody.category = selectedCategory;
        }
  
     
  
        console.log("Bestsellers → Sending:", JSON.stringify(reqBody, null, 2));
  
        const response = await fetchBooks(reqBody);
  
        setBooks(Array.isArray(response?.listings) ? response.listings : []);
        setIsLoading(false);
      } catch (err) {
        console.error("Bestsellers fetch failed:", err);
        setError("Unable to load bestsellers.");
        setIsLoading(false);
      }
    };
  
    fetchBestsellers();
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const fetched = await fetchCategories();
        setCategories(fetched.map(cat => ({ id: cat._id, name: cat.name })));
      } catch (err) { console.error(err); }
    };
    fetchCategoryData();
  }, []);

  const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE);

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Toaster position="bottom-right" />
      <TopBar />

      {/* --- Breadcrumb Preserved --- */}
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
              <li className="text-slate-900 border-b-2 border-indigo-500 pb-0.5">BESTSELLERS</li>
            </ol>
          </nav>
        </div>
      </div>

      <main>
        {/* Modern Hero Section */}
        <header className="relative -mt-20 py-16 sm:py-24 px-6 bg-slate-950 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,#4f46e5,transparent)]" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              The <span className="text-indigo-500 italic">Bestseller</span> List
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Curated rankings of the books defining the cultural conversation across the nation today.
            </p>
          </div>
        </header>

        {/* Filter & Grid Section */}
        <section className="max-w-[1600px] mx-auto px-4 sm:px-8 -mt-8 pb-20 relative z-20">
          <div className="bg-white/80 backdrop-blur-xl p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-xl flex flex-col md:flex-row items-center gap-4 mb-10">
            <div className="flex items-center gap-3 px-4 border-r border-slate-100 hidden md:flex">
              <Filter size={18} className="text-indigo-600" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Filters</span>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:flex-1">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${!selectedCategory ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                All Genres
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat.name ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
            {isLoading ? (
              [...Array(21)].map((_, i) => <BookCardSkeleton key={i} />)
            ) : (
              books.map((book, index) => (
                <div key={book.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <BookCard
                    book={book}
                    rank={(currentPage - 1) * BOOKS_PER_PAGE + index + 1}
                  />
                </div>
              ))
            )}
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="mt-16 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs text-slate-900">
                  PAGE {currentPage} OF {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BestsellersPage;
