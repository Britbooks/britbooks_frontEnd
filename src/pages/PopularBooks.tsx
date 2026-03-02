import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Star, ChevronLeft, ChevronRight, Search, 
  Book as BookIcon, Info, TrendingUp, ShoppingBag, Eye, Zap
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import { useCart } from "../context/cartContext";
import BookCard from "../components/BookCard";

// --- Sub-components ---

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

// const BookCard: React.FC<{ book: any; rank: number }> = React.memo(({ book, rank }) => {
//   const { addToCart } = useCart();
  
//   // Dynamic Rank Styling
//   const getRankStyles = (r: number) => {
//     if (r === 1) return "bg-gradient-to-r from-amber-400 to-yellow-600 text-white shadow-lg shadow-amber-200";
//     if (r === 2) return "bg-gradient-to-r from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-200";
//     if (r === 3) return "bg-gradient-to-r from-orange-400 to-orange-700 text-white shadow-lg shadow-orange-200";
//     if (r <= 10) return "bg-amber-100 text-amber-900 border border-amber-200";
//     return "bg-slate-900 text-white";
//   };

//   const handleAddToCart = () => {
//     addToCart({
//       id: book.id,
//       img: book.imageUrl || "https://via.placeholder.com/150",
//       title: book.title,
//       author: book.author,
//       price: `£${book.price.toFixed(2)}`,
//       quantity: 1,
//     });
//     toast.success(`${book.title} in basket!`, {
//       style: { borderRadius: '12px', background: '#1e293b', color: '#fff' }
//     });
//   };

//   const showPopularityReason = () => {
//     toast((t) => (
//       <div className="bg-white p-4 rounded-xl max-w-sm">
//         <div className="flex items-center gap-2 mb-2">
//           <TrendingUp size={18} className="text-indigo-600" />
//           <h4 className="font-bold text-slate-900">Why Rank #{rank}?</h4>
//         </div>
//         <p className="text-sm text-slate-600 leading-relaxed">
//           {book.popularityReason || "This title is currently gaining massive traction across major reading communities."}
//         </p>
//         <button 
//           onClick={() => toast.dismiss(t.id)}
//           className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-lg transition-colors"
//         >
//           Got it
//         </button>
//       </div>
//     ), { duration: 5000 });
//   };

//   return (
//     <div className={`group relative bg-white rounded-2xl border transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-2 flex flex-col h-full ${
//       rank <= 10 ? "border-amber-200" : "border-slate-100"
//     }`}>
//       <div className="relative aspect-[3/4] m-3 overflow-hidden rounded-xl bg-slate-50">
//         <Link to={`/browse/${book.id}`}>
//           <img
//             src={book.imageUrl || "https://via.placeholder.com/150"}
//             alt={book.title}
//             loading="lazy"
//             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
//           />
//         </Link>
//         <div className={`absolute top-0 left-0 px-3 py-1.5 text-xs font-black rounded-br-xl z-10 ${getRankStyles(rank)}`}>
//           #{rank}
//         </div>
//         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 px-4 z-20">
//           <Link to={`/browse/${book.id}`} className="w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
//             <button className="w-full bg-white text-slate-900 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl">
//               <Eye size={14} /> Quick View
//             </button>
//           </Link>
//           <button 
//             onClick={handleAddToCart}
//             disabled={book.stock === 0}
//             className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 disabled:bg-slate-500 shadow-xl"
//           >
//             <ShoppingBag size={14} /> {book.stock === 0 ? "Out of Stock" : "Add to Bag"}
//           </button>
//         </div>
//       </div>

//       <div className="px-4 pb-4 flex flex-col flex-grow">
//         <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
//           {book.title}
//         </h4>
//         <p className="text-[11px] text-slate-400 font-medium mb-3">{book.author}</p>
        
//         <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
//           <div className="flex flex-col">
//             <span className="text-sm font-black text-slate-900">£{book.price.toFixed(2)}</span>
//             <StarRating rating={book.rating || 0} />
//           </div>
//           <button 
//             onClick={showPopularityReason}
//             className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
//           >
//             <Info size={16} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// });

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

  const BOOKS_PER_PAGE = 30; // Adjusted for better performance

  // Debounce Logic
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Set Document Title
  useEffect(() => {
    document.title = "Popular Books | BritBooks Pulse";
  }, []);

  // Fetch Categories
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const fetched = await fetchCategories();
        setCategories(fetched.map((cat: any) => ({ id: cat._id, name: cat.name })));
      } catch (err) { console.error("Category fetch error:", err); }
    };
    fetchCategoryData();
  }, []);

  // Main Data Fetch
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
          order: sortBy === "priceHighLow" ? "desc" : sortBy === "title" ? "asc" : "desc"
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

  const totalPages = useMemo(() => Math.ceil(totalBooks / BOOKS_PER_PAGE), [totalBooks]);

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
          50% { transform: translateY(-20px); }
        }
        .animate-float-3d { animation: float 7s ease-in-out infinite; }
      `}</style>
      
      <Toaster position="bottom-right" />
      <TopBar />

      {/* Breadcrumb Section */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center justify-end text-[11px] font-black uppercase tracking-widest">
            <ol className="flex items-center gap-2">
              <li><Link to="/" className="text-slate-400 hover:text-indigo-600">HOME</Link></li>
              <li className="text-slate-300">/</li>
              <li className="text-slate-900 border-b-2 border-indigo-500">POPULAR BOOKS</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Modern 3D Hero Section */}
      <div className="relative overflow-hidden bg-slate-950 pt-32 pb-24 px-6">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent)]" />
        
        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest uppercase mb-6">
              <TrendingUp size={12} /> Live Rankings
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-[1.1]">
              The Pulse of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 italic">Literature.</span>
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto lg:mx-0 text-lg leading-relaxed">
              Explore the most discussed, highly rated, and trending titles in the community.
            </p>
          </div>

          <div className="relative hidden lg:block animate-float-3d">
            <div className="relative z-10 w-full aspect-square bg-gradient-to-br from-indigo-500/10 to-transparent rounded-3xl border border-white/5 backdrop-blur-3xl overflow-hidden shadow-2xl flex items-center justify-center">
               <BookIcon size={120} className="absolute text-indigo-500/20" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400"><Zap size={16}/></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Trending Now</p>
                  <p className="text-sm text-white font-black">Community Choice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-8 pb-20">
        
        {/* Sticky Filter Bar */}
        <div className="sticky top-20 z-40 -mt-10 mb-12">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-xl rounded-2xl p-4 flex flex-col lg:flex-row items-center gap-4">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search trending titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:flex-1">
              <button 
                onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                All Genres
              </button>
              {categories.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => { setSelectedCategory(c.name); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === c.name ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 w-full lg:w-auto cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="rating">Top Rated</option>
              <option value="title">Alphabetical</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Book Grid */}
        {books.length === 0 && !isLoading ? (
          <div className="py-20 text-center">
            <BookIcon size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-900 font-bold">No titles found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {isLoading ? (
              [...Array(14)].map((_, i) => <BookCardSkeleton key={i} />)
            ) : (
              books.map((book, index) => (
                <BookCard
                key={book._id || book.id}
                id={book._id || book.id}
                img={book.imageUrl}  
                title={book.title}
                author={book.author}
                price={
                  typeof book.price === "number"
                    ? `£${book.price}`
                    : book.price
                }
              />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-20 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm shadow-sm">
                <span className="text-indigo-600">{currentPage}</span>
                <span className="mx-2 text-slate-300">/</span>
                <span className="text-slate-500">{totalPages}</span>
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Showing {totalBooks} items</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PopularBooksPage;