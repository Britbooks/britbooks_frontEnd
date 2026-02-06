import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Star, ShoppingBag, 
  Sparkles, Eye, LayoutGrid, ListFilter,
  Zap, TrendingUp, Clock, Flame, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories, Book } from "../data/books";
import { useCart } from "../context/cartContext";

// --- Real-time Pulse Component ---
const LiveIndicator = () => (
  <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
    </span>
    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Live Updates</span>
  </div>
);

const BookCard = ({ book, index }: { book: Book; index: number }) => {
  const { addToCart } = useCart();
  // Simulate "people viewing" for real-time feel
  const viewers = useMemo(() => Math.floor(Math.random() * 15) + 2, []);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: book.id,
      img: book.imageUrl || "",
      title: book.title,
      author: book.author,
      price: `£${book.price.toFixed(2)}`,
      quantity: 1,
    });
    toast.success(`${book.title} added to bag!`, {
      icon: '🔥',
      style: { background: '#0f172a', color: '#fff', fontSize: '12px', borderRadius: '12px' }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group relative bg-white rounded-2xl border border-slate-200/50 p-2 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
        <Link to={`/browse/${book.id}`}>
          <img
            src={book.imageUrl || "/api/placeholder/300/400"}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>
        
        {/* Floating Real-time Stats */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.stock <= 5 && (
            <div className="bg-orange-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <Flame size={10} /> LOW STOCK
            </div>
          )}
          <div className="bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Eye size={10} /> {viewers} watching
          </div>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
           <button 
             onClick={handleAddToCart}
             className="p-3 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform shadow-xl"
           >
             <ShoppingBag size={20} />
           </button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
           <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md">
             {book.category || "General"}
           </span>
        </div>
        
        <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {book.title}
        </h4>
        <p className="text-[11px] text-slate-400 mb-3 italic">{book.author}</p>
        
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-1">
          <p className="text-lg font-black text-slate-900">£{book.price.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
             <Star size={12} fill="currentColor" />
             <span className="text-[11px] font-bold">{book.rating || "4.5"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const NewArrivalsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [mainRes, catRes] = await Promise.all([
          fetchBooks({ page: currentPage, limit: 18, sort: "createdAt", order: "desc", category: selectedCategory || undefined }),
          fetchCategories()
        ]);
        setBooks(mainRes?.listings || []);
        setCategories(catRes.map((c: any) => ({ id: c._id, name: c.name })));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentPage, selectedCategory]);

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 font-sans">
      <Toaster position="bottom-right" />
      <TopBar />

      {/* Modern Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] -mr-48" />
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[120px] -ml-48" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <LiveIndicator />
            <span className="text-slate-400 text-xs font-medium border-l pl-3 border-slate-200">
              Updated 2 mins ago
            </span>
          </motion.div>

          <div className="grid lg:grid-cols-2 items-center gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[0.9] text-slate-900 mb-6">
                THE <span className="text-indigo-600 italic">NEW</span> <br /> 
                DROP <span className="inline-block"><Sparkles className="text-amber-400" size={48} /></span>
              </h1>
              <p className="text-slate-500 text-lg max-w-md leading-relaxed mb-8">
                The latest literary masterpieces have landed. Explore the future of storytelling with our fresh arrivals.
              </p>
              <div className="flex items-center gap-4">
                 <button className="px-8 py-4 bg-slate-900  rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-200">
                   Shop Now <ArrowUpRight size={20} />
                 </button>
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      +1k
                    </div>
                 </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="hidden lg:flex justify-end"
            >
              <div className="relative w-80 h-[450px] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden p-4">
                <div className="w-20 h-6 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-10" />
                <div className="space-y-4 pt-8">
                  <div className="h-40 w-full bg-indigo-500 rounded-2xl animate-pulse" />
                  <div className="h-4 w-3/4 bg-slate-700 rounded-full" />
                  <div className="h-4 w-1/2 bg-slate-700 rounded-full" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-20 bg-slate-800 rounded-xl" />
                    <div className="h-20 bg-slate-800 rounded-xl" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 -mt-16 pb-20 relative z-20">
        {/* Category Pill Bar */}
        <nav className="sticky top-6 z-50 bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] mb-12 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${!selectedCategory ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Zap size={14} /> All New
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.name ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-4 px-4 border-l border-slate-100 ml-4">
             <TrendingUp size={18} className="text-indigo-500" />
             <ListFilter size={18} className="text-slate-400 cursor-pointer hover:text-slate-900" />
          </div>
        </nav>

        {/* Dynamic Grid */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Additions</h2>
            <div className="flex items-center gap-2 text-slate-400 mt-1">
              <Clock size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Ships within 24 hours</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <LayoutGrid size={14} className="text-indigo-600" />
            <span className="text-xs font-bold">{books.length} Items</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              Array(12).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl" />
              ))
            ) : (
              books.map((book, idx) => (
                <BookCard key={book.id} book={book} index={idx} />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Pagination Container */}
        <div className="mt-20 flex flex-col items-center gap-4">
           <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20 shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                {[1, 2, 3].map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing page {currentPage} of 10</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewArrivalsPage;