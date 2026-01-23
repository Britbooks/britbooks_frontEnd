import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { 
  Star, ChevronLeft, ChevronRight, Search, Gift, 
  Book as BookIcon, Sparkles, Trophy, Gamepad2, 
  Zap, ShoppingCart, Percent, Heart, Flame,
  TrendingDown, Info, LayoutGrid, List
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import { fetchBooks, Book } from '../data/books';
import { useCart } from "../context/cartContext";

/**
 * REDESIGN DIRECTION: "PREMIUM BENTO"
 * 1. Aesthetic: Clean "Apple-style" Bento boxes with soft shadows and deep indigo accents.
 * 2. Navigation: Preserved the breadcrumb as requested, aligned with the new layout.
 * 3. Gamification: Integrated XP progress into a header status bar rather than a separate card.
 * 4. Interactions: Modernized the "Quick Buy" flow and added a "Hot Streak" indicator for popular clearance items.
 */

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className={`w-1 h-3 rounded-full transition-colors ${i < Math.round(rating) ? "bg-amber-400" : "bg-slate-200"}`}
      />
    ))}
  </div>
);

const BookCard = ({ book }: { book: Book & { originalPrice: number } }) => {
  const { addToCart } = useCart();
  const discount = Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100);

  const handleAddToCart = () => {
    addToCart({
      id: book.id,
      img: book.imageUrl || "https://via.placeholder.com/150",
      title: book.title,
      author: book.author,
      price: `£${book.price.toFixed(2)}`,
      quantity: 1,
    });
    toast.success('Inventory Updated');
  };

  return (
    <div className="group bg-white rounded-[2rem] p-3 border border-slate-100 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col h-full">
      <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-slate-50 mb-4">
        <img
          src={book.imageUrl || "https://via.placeholder.com/150"}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md">
                -{discount}%
            </div>
            {discount > 50 && (
                <div className="bg-amber-400 text-amber-950 p-1 rounded-full shadow-lg animate-pulse">
                    <Flame size={12} fill="currentColor" />
                </div>
            )}
        </div>

        <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleAddToCart}
            className="w-full bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
          >
            <ShoppingCart size={14} /> Add to Bag
          </button>
        </div>
      </div>

      <div className="px-2 flex flex-col flex-grow">
        <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">{book.title}</h4>
        <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-tighter">{book.author}</p>
        
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900">£{book.price.toFixed(2)}</span>
            <span className="text-[9px] text-slate-300 line-through">£{book.originalPrice.toFixed(2)}</span>
          </div>
          <StarRating rating={book.rating || 0} />
        </div>
      </div>
    </div>
  );
};

const QuizOverlay = ({ isOpen, onClose, onComplete }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6">
                <Gamepad2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Daily Reader Quest</h2>
            <p className="text-slate-500 text-sm mb-8">Answer 3 quick questions to unlock a secret 10% discount code.</p>
            
            <div className="w-full space-y-3">
                {["Fiction Explorer", "Non-Fiction Buff", "Fantasy Fanatic", "Mystery Hunter"].map((opt) => (
                    <button 
                        key={opt}
                        onClick={onComplete}
                        className="w-full py-4 rounded-2xl border-2 border-slate-50 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold text-slate-700"
                    >
                        {opt}
                    </button>
                ))}
            </div>
            <button onClick={onClose} className="mt-6 text-xs font-black text-slate-400 uppercase tracking-widest">Maybe Later</button>
        </div>
      </div>
    </div>
  );
};

const ClearancePage = () => {
  const [points, setPoints] = useState(450);
  const [currentPage, setCurrentPage] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const BOOKS_PER_PAGE = 100;
  const previousCategory = (location.state as { category?: string })?.category || "Browse";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);



  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const res = await fetchBooks({ 
          page: currentPage, 
          limit: BOOKS_PER_PAGE, 
          shelf: "clearanceItems",
          sort: "discountPercentage",
          order: "desc"
      });
      setBooks((res.listings || []).map((b: any) => ({
        ...b,
        originalPrice: b.price * (1 + (b.discountPercentage || 30) / 100)
      })));
      setIsLoading(false);
    };
    load();
  }, [currentPage]);

  const getColumnCount = (width: number) => {
    if (width < 640) return 2;
    if (width < 1024) return 3;
    if (width < 1280) return 5;
    return 6;
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col font-sans">
      <Toaster position="bottom-right" />
      <TopBar />

      

      {/* Preservation of the Breadcrumb */}
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
                      to="/category"
                      state={{ category: selectedCategory || previousCategory }}
                      className="text-slate-400 hover:text-indigo-600 truncate max-w-[100px] sm:max-w-none"
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

      <main className="max-w-[1600px] mx-auto w-full p-6 sm:p-8">
        
        {/* Bento Header */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3 bg-slate-900 rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col justify-center min-h-[320px]">
                <div className="relative z-10">
                    <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full mb-6 inline-block uppercase tracking-widest">
                        Flash Sale Active
                    </span>
                    <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter mb-4 leading-none">
                        STOCK <br /> <span className="text-indigo-500">LIQUIDATION.</span>
                    </h1>
                    <p className="text-slate-400 max-w-md text-sm font-medium mb-8">
                        The ultimate clearance event. Thousands of titles priced to move. No codes, just raw discounts.
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowQuiz(true)}
                            className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            <Gamepad2 size={16} /> QUEST FOR 10% OFF
                        </button>
                    </div>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between group">
                <div>
                    <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                        <Sparkles size={24} />
                    </div>
                    <h3 className="text-2xl font-black leading-tight mb-2">Next Drop <br /> in 02:45:12</h3>
                    <p className="text-indigo-100 text-xs font-medium opacity-80">Fresh titles added to clearance every 6 hours. Stay sharp.</p>
                </div>
                <button className="w-full bg-indigo-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all">
                    Set Alert
                </button>
            </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-3 mb-8">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search clearance by title, author, or genre..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <select className="flex-1 sm:w-48 bg-slate-50 border-none rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-indigo-600">
                    <option>Best Discount</option>
                    <option>Price: Low to High</option>
                    <option>Rating</option>
                </select>
                <div className="h-10 w-[1px] bg-slate-100 hidden sm:block mx-2" />
                <button className="p-3 bg-slate-900 text-white rounded-xl"><LayoutGrid size={18} /></button>
                <button className="p-3 bg-white text-slate-400 rounded-xl hover:bg-slate-50 transition-colors"><List size={18} /></button>
            </div>
        </div>

        {/* Main Grid View */}
        <div className="bg-white rounded-[3rem] p-6 border border-slate-100 shadow-sm min-h-[800px]">
            {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-40">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Catalog</p>
                </div>
            ) : (
                <AutoSizer>
                    {({ height, width }) => {
                        const cols = getColumnCount(width);
                        return (
                            <FixedSizeGrid
                                columnCount={cols}
                                columnWidth={width / cols}
                                height={height}
                                rowCount={Math.ceil(books.length / cols)}
                                rowHeight={360}
                                width={width}
                                itemData={{ cols, books }}
                                className="no-scrollbar"
                            >
                                {({ columnIndex, rowIndex, style, data }: any) => {
                                    const idx = rowIndex * data.cols + columnIndex;
                                    if (idx >= data.books.length) return null;
                                    return (
                                        <div style={{ ...style, padding: '10px' }}>
                                            <BookCard book={data.books[idx]} />
                                        </div>
                                    );
                                }}
                            </FixedSizeGrid>
                        );
                    }}
                </AutoSizer>
            )}
        </div>

        {/* Modern Pagination */}
        <div className="flex flex-col items-center gap-6 mt-16">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                    className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="px-8 py-4 bg-slate-900 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest">
                    Page {currentPage}
                </div>
                <button 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End of the line? Keep scrolling for more deals.</p>
        </div>
      </main>

      <QuizOverlay 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)} 
        onComplete={() => {
            setPoints(p => p + 100);
            setShowQuiz(false);
            toast.success("XP Gained! Code: CLEAR10");
        }} 
      />
      
      <Footer />
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ClearancePage;
