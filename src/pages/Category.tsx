import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  Filter,
  ShoppingBag,
  LayoutGrid,
  Search,
  ArrowRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";

import { fetchBooks, fetchCategories, Book, ApiCategory } from "../data/books";
import { useCart } from "../context/cartContext";

// ── UTILITIES ────────────────────────────────────────────────────────────

const formatBooksForDisplay = (books: Book[]) => {
  return books.map((book) => ({
    id: book.id,
    img: book.imageUrl || "https://via.placeholder.com/150",
    title: book.title,
    author: book.author,
    price: `£${book.price.toFixed(2)}`,
    rating: book.rating || 0,
    condition: book.condition,
  }));
};

// ── COMPONENTS ───────────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={10}
        className={i < Math.round(rating) ? "text-amber-400" : "text-gray-200"}
        fill={i < Math.round(rating) ? "currentColor" : "none"}
      />
    ))}
  </div>
);

const BookCard = ({ id, img, title, author, price, rating, condition }: any) => {
  const { addToCart } = useCart();

  const handleAddToBasket = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ id, img, title, author, price, quantity: 1 });
    toast.success(`Added ${title} to basket`, {
      style: { borderRadius: "15px", fontWeight: "bold" },
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-500/20 hover:shadow-lg transition-all p-3 flex flex-col">
      <Link to={`/browse/${id}`} className="relative aspect-[3/4] overflow-hidden rounded-xl mb-3 bg-gray-50">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/95 text-[8px] font-black uppercase rounded-md shadow-sm">
          {condition}
        </div>
      </Link>
      <div className="flex-grow">
        <h3 className="font-black text-[13px] text-gray-900 line-clamp-1 mb-0.5">{title}</h3>
        <p className="text-gray-400 text-[11px] mb-2 font-bold">{author}</p>
        <StarRating rating={rating} />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-blue-600 font-black text-sm">{price}</span>
        <button
          onClick={handleAddToBasket}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ShoppingBag size={14} />
          Basket
        </button>
      </div>
    </div>
  );
};

// ── MAIN PAGE ────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  
  useEffect(() => {
    setSelectedCategory(searchParams.get('category'));
  }, [searchParams]);
  
  useEffect(() => {
    if (selectedCategory) {
      setSearchParams({ category: selectedCategory }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [selectedCategory, setSearchParams]);

  // Random header background
  const getRandomHeaderBg = () => {
    const seed = Math.floor(Math.random() * 10000);
    return `https://picsum.photos/seed/${seed}/1600/900`;
  };

  const [headerBg, setHeaderBg] = useState(getRandomHeaderBg());

  useEffect(() => {
    setHeaderBg(getRandomHeaderBg());
  }, [selectedCategory]);

  const LIMIT = 16;

  // Load categories once (on mount)
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {
      toast.error("Failed to load categories");
    });
  }, []);

  // Reset when category changes
  useEffect(() => {
    setPage(1);
    setBooks([]);
    setHasMore(true);
    setTotalBooks(0);
  }, [selectedCategory]);

  // Load books
  useEffect(() => {
    const loadBooks = async () => {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const queryParams = {
          page,
          limit: LIMIT,
          ...(selectedCategory ? { filters: { category: selectedCategory } } : {}),
        };

        const { books: newBooks, total } = await fetchBooks(queryParams);

        const formatted = formatBooksForDisplay(newBooks);

        setBooks((prev) => (page === 1 ? formatted : [...prev, ...formatted]));
        setTotalBooks(total);
        setHasMore(newBooks.length === LIMIT && page * LIMIT < total);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load books");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    loadBooks();
  }, [page, selectedCategory]);

  const handleLoadMore = () => {
    if (!isLoadingMore) setPage((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Toaster position="bottom-right" />

      {/* Header */}
      <header
        className="relative pt-14 pb-12 px-6 md:px-8 overflow-hidden"
        style={{
          backgroundImage: `url(${headerBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />

        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
            <div>
              <span className="text-white/90 font-black text-white uppercase tracking-[0.3em] mb-2 block">
                Premium Marketplace
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-xl capitalize">
                {selectedCategory || "The Library"}
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/40 w-full md:w-auto md:min-w-[380px] max-w-md">
              <Search className="ml-3 text-white" size={20} />
              <input
                type="text"
                placeholder="Search curated titles..."
                className="flex-1 h-10 outline-none font-bold text-white bg-transparent"
              />
              <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl text-white font-black transition-colors">
                Find
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-50 bg-white lg:relative lg:z-0 lg:block
              w-full lg:w-72 xl:w-80 
              transform transition-transform duration-300
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
            `}
          >
            <div className="lg:sticky lg:top-24 h-screen lg:h-[calc(100vh-6rem)] lg:pr-6 flex flex-col">
              <div className="flex items-center justify-between mb-6 lg:mb-8 px-2 lg:px-0">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="text-blue-600" size={18} />
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                    Categories
                  </h4>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 bg-gray-50 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-2 lg:px-0">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold mb-3
                    transition-all duration-200 flex-shrink-0
                    ${!selectedCategory ? "bg-blue-600 text-white shadow-lg shadow-blue-100/50" : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"}
                  `}
                >
                  View All Books
                </button>

                <div className="flex-1 overflow-y-auto -mr-3 pr-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                  <div className="space-y-1.5 pb-10">
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setIsSidebarOpen(false);
                        }}
                        className={`
                          w-full flex justify-between items-center px-4 py-3.5 rounded-xl text-sm font-bold 
                          transition-all duration-200
                          ${selectedCategory === cat.name ? "bg-blue-600 text-white shadow-lg shadow-blue-100/50" : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"}
                        `}
                      >
                        <span className="capitalize truncate max-w-[75%]">{cat.name}</span>
                        <span
                          className={`text-xs min-w-[2.5rem] text-right font-medium ${
                            selectedCategory === cat.name ? "text-white/90" : "text-gray-500"
                          }`}
                        >
                          {cat.count ?? "?"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-auto border-t border-gray-100 space-y-5 pb-6 lg:pb-4 px-2 lg:px-0">
                {/* Promo cards can go here */}
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 flex-wrap gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                <Filter size={14} /> Refine
              </button>

              <div className="flex items-center gap-6">
                <p className="text-[11px] font-black text-gray-600 uppercase tracking-widest">
                  Showing {books.length} of {totalBooks || categories.length ? "many" : "?"} books
                </p>
                <select className="bg-gray-50 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg outline-none">
                  <option>Newest First</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>

            {isLoading && page === 1 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <h2 className="text-2xl font-bold mb-4">No books found</h2>
                <p className="mb-6 max-w-md mx-auto">
                  This category might be temporarily empty, or we're having trouble loading listings. Try another category or check back later!
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setPage(1);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                >
                  View All Books
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {books.map((book) => (
                    <BookCard key={book.id} {...book} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-16 flex justify-center pt-12 pb-20">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className={`
                        group flex items-center gap-4 px-10 py-5 
                        bg-white border-2 border-gray-200 rounded-[20px] 
                        font-black text-sm uppercase tracking-[0.2em] 
                        hover:border-gray-900 hover:shadow-lg transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {isLoadingMore ? "Loading..." : "Load More Books"}
                      {!isLoadingMore && <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />}
                    </button>
                  </div>
                )}

                {!hasMore && (
                  <div className="text-center text-gray-500 py-16 text-sm font-medium">
                    You've reached the end of the collection ✨
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}