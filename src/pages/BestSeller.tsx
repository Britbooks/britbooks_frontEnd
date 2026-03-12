import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Zap, TrendingUp, ListFilter, Bookmark, X
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories, Book } from "../data/books";
import BookCard from "../components/BookCard";

const BookCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 animate-pulse">
    <div className="aspect-[2/3] bg-slate-100 rounded-xl" />
    <div className="h-4 bg-slate-100 w-3/4 rounded" />
    <div className="h-3 bg-slate-100 w-1/2 rounded" />
  </div>
);

const BestsellersPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const location = useLocation();
  const [totalBooks, setTotalBooks] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentBestsellers, setRecentBestsellers] = useState<Book[]>([]);
  
  const BOOKS_PER_PAGE = 12;
  const previousCategory = (location.state as { category?: string })?.category || "Browse";

  // Fetch main list
  useEffect(() => {
    const fetchBestsellers = async () => {
      setIsLoading(true);
      try {
        const reqBody = {
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          shelf: "bestSellers",
          sort: "rating",
          order: "desc",
          ...(selectedCategory && { category: selectedCategory })
        };
        const response = await fetchBooks(reqBody);
        setBooks(Array.isArray(response?.listings) ? response.listings : []);
        setTotalBooks(response?.total || 48); 
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBestsellers();
  }, [currentPage, selectedCategory]);

  // Fetch top 5 recent / hot bestsellers for popup (independent of pagination/category)
  useEffect(() => {
    const fetchRecentTop = async () => {
      try {
        const reqBody = {
          page: 1,
          limit: 5,
          shelf: "bestSellers",
          sort: "sales",       // assuming your API supports sorting by recent sales
          order: "desc",
          // You could also add a time filter if your backend supports it, e.g.:
          // timeframe: "last7days" or similar
        };
        const response = await fetchBooks(reqBody);
        if (Array.isArray(response?.listings)) {
          setRecentBestsellers(response.listings);
        }
      } catch (err) {
        console.error("Failed to fetch recent bestsellers", err);
      }
    };
    fetchRecentTop();
  }, []); // only once on mount

  // Popup / toast notification on interval
  useEffect(() => {
    if (recentBestsellers.length === 0) return;

    const showPopup = () => {
      const message = (
        <div className="w-80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" />
              <span className="font-bold text-sm">Hot Right Now</span>
            </div>
            <button 
              onClick={() => toast.dismiss()} 
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">Top 5 bestselling books trending this week:</p>
          <ul className="space-y-2 text-sm">
            {recentBestsellers.map((book, i) => (
              <li key={book._id || book.id} className="flex items-center gap-2">
                <span className="font-black text-indigo-600 w-5 text-right">#{i+1}</span>
                <span className="font-medium truncate">{book.title}</span>
                <span className="text-slate-400 text-xs italic">— {book.author}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-indigo-600 font-medium">
            Updated moments ago • See full list ↓
          </div>
        </div>
      );

      toast(message, {
        duration: 8000,
        position: "bottom-right",
        style: {
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '16px',
        },
      });
    };

    // Show immediately once we have data
    showPopup();

    // Then every 45 seconds
    const interval = setInterval(showPopup, 45 * 1000);

    return () => clearInterval(interval);
  }, [recentBestsellers]);

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
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <Toaster position="bottom-right" />
      <TopBar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center justify-end text-[10px] font-black uppercase tracking-widest">
            <ol className="flex items-center gap-2">
              <li><Link to="/" className="text-slate-400 hover:text-indigo-600">HOME</Link></li>
              <li className="text-slate-300">/</li>
              <li className="text-slate-900 border-b-2 border-indigo-500">BestSeller</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Slim Hero Section */}
      <header className="relative py-16 px-6 bg-slate-950 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://media.istockphoto.com/id/2210818916/photo/puzzle-with-best-seller-icons-best-seller-icon-premium-quality-product-service-medal-with.jpg?s=612x612&w=0&k=20&c=HgK8ndZeYjgD5MOvFSPKHYNlAssaesZnQiNJglv3Mog=" 
            alt="Library"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950 to-slate-950" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-4 uppercase tracking-tighter">
            <TrendingUp size={14} /> Global Rankings
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            The <span className="text-indigo-500 italic">Bestseller</span> List
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
            The books everyone is talking about, updated daily based on global sales data.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-24 relative z-20">
        
        {/* Sticky Category Filter */}
        <div className="sticky top-4 z-40 mt-12 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${!selectedCategory ? 'bg-slate-900 text-black shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              All Genres
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat.name ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          <div className="hidden md:flex items-center gap-3 border-l pl-4 border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort by</span>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ListFilter size={18} /></button>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
          {isLoading ? (
            [...Array(12)].map((_, i) => <BookCardSkeleton key={i} />)
          ) : (
            books.map((book, index) => (
              <div key={book.id || book._id} className="fade-in-up relative group" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="absolute -top-3 -left-2 z-30 bg-white border border-slate-100 shadow-sm w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black italic text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  #{((currentPage - 1) * BOOKS_PER_PAGE) + index + 1}
                </div>
                <BookCard
                  id={book._id || book.id}
                  img={book.imageUrl}  
                  title={book.title}
                  author={book.author}
                  price={typeof book.price === "number" ? `£${book.price.toFixed(2)}` : book.price}
                />
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-20 flex justify-center">
            <nav className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <button 
                onClick={() => {setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0)}}
                disabled={currentPage === 1}
                className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="px-8 flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Viewing Page</span>
                <span className="text-sm font-bold">{currentPage} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
              </div>
              <button 
                onClick={() => {setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0)}}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </nav>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BestsellersPage;