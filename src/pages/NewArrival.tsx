import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Star, Filter, Brain, Flame, 
  PenTool, ChefHat, Palette, Laugh, Building, Award, Users, 
  Zap, Book as BookIcon, ShoppingBag, ArrowRight, Sparkles , Eye, T
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories, Book } from "../data/books";
import { useCart } from "../context/cartContext";

/**
 * FIX IMPLEMENTED:
 * I have updated the displayCategory logic to strictly handle the "Uncategorized" string 
 * that was being injected by the fetchBooks utility. It now defaults to a clean 
 * "General" label if the category is missing or labeled as "Uncategorized".
 */

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
  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
    <div className="aspect-[3/4] bg-slate-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-200 w-3/4 rounded" />
      <div className="h-3 bg-slate-200 w-1/2 rounded" />
      <div className="h-8 bg-slate-200 w-full rounded-xl" />
    </div>
  </div>
);

const BookCard: React.FC<{ book: Book }> = React.memo(({ book }) => {
  const { addToCart } = useCart();
  const isNew = book.releaseDate 
    ? new Date(book.releaseDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
    : false;

  const handleAddToCart = () => {
    addToCart({
      id: book.id,
      img: book.imageUrl || "https://via.placeholder.com/150",
      title: book.title,
      author: book.author,
      price: `£${book.price.toFixed(2)}`,
      quantity: 1,
    });
    toast.success("Added to basket", {
      style: { borderRadius: '12px', background: '#333', color: '#fff' }
    });
  };

  /**
   * FIX: This handles the specific "Uncategorized" string returned by your fetchBooks map function.
   */
  const displayCategory = (!book.category || book.category === "Uncategorized") 
    ? "General" 
    : book.category;

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-50">
        <Link to={`/browse/${book.id}`}>
          <img
            src={book.imageUrl || "https://via.placeholder.com/150"}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>
        {isNew && (
          <div className="absolute top-3 left-3 bg-red-700 text-white text-[10px] font-bold px-1.5 py-1 rounded-full shadow-lg backdrop-blur-md">
            NEW
          </div>
        )}
 <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 px-2">
  <Link
    to={`/browse/${book.id}`}
    className="w-full translate-y-3 group-hover:translate-y-0 transition-transform duration-300"
  >
    <button className="w-full bg-white text-slate-900 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide flex items-center justify-center gap-1">
      <Eye size={10} /> View
    </button>
  </Link>

  <button
    onClick={handleAddToCart}
    disabled={book.stock === 0}
    className="w-full bg-indigo-600 text-white py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide flex items-center justify-center gap-1 translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75 disabled:bg-slate-500"
  >
    <ShoppingBag size={10} />
    {book.stock === 0 ? "Sold" : "Add"}
  </button>
</div>

      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
          {displayCategory}
        </span>
        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
          {book.title}
        </h4>
        <p className="text-xs text-slate-500 mb-3">{book.author}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-black text-slate-900">£{book.price.toFixed(2)}</span>
          <StarRating rating={book.rating || 0} />
        </div>
      </div>
    </div>
  );
});

const CategoryFilterWidget: React.FC<{
  categories: any[];
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
}> = ({ categories, selectedCategory, setSelectedCategory }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
      <button
        onClick={() => setSelectedCategory(null)}
        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
          !selectedCategory 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
          : "bg-white text-slate-600 border border-slate-100 hover:border-indigo-200"
        }`}
      >
        All Books
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.name)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
            selectedCategory === cat.name
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
            : "bg-white text-slate-600 border border-slate-100 hover:border-indigo-200"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};

const NewArrivalsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [totalBooks] = useState(3000000);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const BOOKS_PER_PAGE = 105;
  const FEATURED_BOOKS_LIMIT = 7;
  const previousCategory = (location.state as { category?: string })?.category || "Browse";

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? 240 : 300;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
      scrollContainerRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchNewArrivals = async () => {
      setIsLoading(true);
      try {
        // Main list (paginated new arrivals, filtered by category if selected)
        const mainRes = await fetchBooks({
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          sort: "createdAt",
          order: "desc",
          category: selectedCategory || undefined,     // ← flat field – this is what the backend expects
          // search: searchTerm?.trim() || undefined,  // ← add this line later if you add search
        });
        setBooks(Array.isArray(mainRes?.listings) ? mainRes.listings : []);
  
        // Featured (always unfiltered, latest only)
        const featuredRes = await fetchBooks({
          page: 1,
          limit: FEATURED_BOOKS_LIMIT,
          sort: "createdAt",
          order: "desc",
          // no category → shows newest across all categories
        });
        setFeaturedBooks(Array.isArray(featuredRes?.listings) ? featuredRes.listings : []);
  
        setIsLoading(false);
      } catch (err) {
        console.error("New Arrivals fetch failed:", err);
        setIsLoading(false);
        // Optional: setError("Failed to load new arrivals") if you have error state
      }
    };
  
    fetchNewArrivals();
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories.map((cat: any) => ({
          id: cat._id,
          name: cat.name,
        })));
      } catch (err) { console.error(err); }
    };
    fetchCategoryData();
  }, []);

  const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE);
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[#FAFAFB] min-h-screen font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Toaster position="bottom-center" />
      <TopBar />
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <nav aria-label="Breadcrumb" className="flex items-center justify-end text-[11px] font-black uppercase tracking-widest">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li><Link to="/" className="text-slate-400 hover:text-indigo-600 transition">HOME</Link></li>
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
              <li className="text-slate-900 border-b-2 border-indigo-500 pb-0.5">NEW-ARRIVALS</li>
            </ol>
          </nav>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>

      {/* Hero Header */}
      <div className="relative   overflow-hidden bg-white border-b border-slate-100 py-16 md:py-24">
        <div className="absolute   top-0 -left-4 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black tracking-widest uppercase mb-6">
              <Sparkles size={12} /> Just Updated
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
              New Stories <span className="text-indigo-600">Arriving Daily.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Discover the latest literary treasures. From trending fiction to groundbreaking non-fiction.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 pb-20">
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black flex items-center gap-2">Featured New <ChevronRight className="text-indigo-600" /></h2>
            <div className="flex gap-2">
              <button onClick={() => handleScroll('left')} className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors"><ChevronLeft size={20}/></button>
              <button onClick={() => handleScroll('right')} className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors"><ChevronRight size={20}/></button>
            </div>
          </div>
          <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto no-scrollbar snap-x pb-4">
            {isLoading ? [...Array(4)].map((_, i) => <div key={i} className="min-w-[280px]"><BookCardSkeleton /></div>) :
              featuredBooks.map(book => (
                <div key={book.id} className="min-w-[220px] md:min-w-[240px] snap-start">
                  <BookCard book={book} />
                </div>
              ))
            }
          </div>
        </section>

        <section>
          <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-2xl p-4 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CategoryFilterWidget categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Showing {books.length} Arrivals</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
            {isLoading 
              ? [...Array(14)].map((_, i) => <BookCardSkeleton key={i} />)
              : books.map(book => <BookCard key={book.id} book={book} />)
            }
          </div>

          {!isLoading && books.length > 0 && (
            <div className="mt-20 flex flex-col items-center gap-6">
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="p-3 rounded-xl bg-white border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-all"><ChevronLeft size={20} /></button>
                <div className="flex items-center px-4 py-2 bg-white border border-slate-100 rounded-xl font-bold text-sm">
                  <span className="text-indigo-600">{currentPage}</span>
                  <span className="mx-2 text-slate-300">/</span>
                  <span className="text-slate-500">{totalPages}</span>
                </div>
                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="p-3 rounded-xl bg-white border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NewArrivalsPage;
