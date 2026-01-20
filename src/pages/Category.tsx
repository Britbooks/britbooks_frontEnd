import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  LayoutGrid,
  Search,
  ShoppingBag,
  Star,
  X,
  ArrowRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";

import { fetchBooks, fetchCategories, Book, CategoryNode } from "../data/books";
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
        <h3 className="font-black text-[13px] text-gray-900 line-clamp-2 mb-1">{title}</h3>
        <p className="text-gray-500 text-[11px] mb-2 font-medium">{author}</p>
        <StarRating rating={rating} />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-blue-600 font-black text-base">{price}</span>
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
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(
    searchParams.get("category")
  );

  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string | null>(null);

  // Sync URL ↔ state
  useEffect(() => {
    const urlCat = searchParams.get("category");
    setSelectedCategoryName(urlCat);
  }, [searchParams]);

  useEffect(() => {
    if (selectedCategoryName) {
      setSearchParams({ category: selectedCategoryName }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [selectedCategoryName, setSearchParams]);

  // Random header background
  const getRandomHeaderBg = () => {
    const seed = Math.floor(Math.random() * 10000);
    return `https://picsum.photos/seed/${seed}/1600/900`;
  };

  const [headerBg, setHeaderBg] = useState(getRandomHeaderBg());

  useEffect(() => {
    setHeaderBg(getRandomHeaderBg());
  }, [selectedCategoryName, selectedSubcategoryName]);

  const LIMIT = 16;

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {
        toast.error("Failed to load categories");
      });
  }, []);

  // Reset pagination on category/subcategory change
  useEffect(() => {
    setPage(1);
    setBooks([]);
    setHasMore(true);
    setTotalBooks(0);
  }, [selectedCategoryName, selectedSubcategoryName]);

  // Load books
  useEffect(() => {
    const loadBooks = async () => {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        let result;

        if (!selectedCategoryName) {
          result = await fetchBooks({ page, limit: LIMIT });
        } else {
          let filters: Record<string, any> = { category: selectedCategoryName };

          // If a subcategory is selected → filter on subcategory field
          if (selectedSubcategoryName) {
            filters.subcategory = selectedSubcategoryName;
          }

          const params = {
            page,
            limit: LIMIT,
            filters,
          };

          result = await fetchBooks(params);
        }

        const formatted = formatBooksForDisplay(result.books);

        setBooks((prev) => (page === 1 ? formatted : [...prev, ...formatted]));
        setTotalBooks(result.total);
        setHasMore(result.books.length === LIMIT && page * LIMIT < result.total);
      } catch (err) {
        console.error("[loadBooks] Error:", err);
        toast.error("Failed to load books");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    loadBooks();
  }, [page, selectedCategoryName, selectedSubcategoryName]);

  const handleLoadMore = () => {
    if (!isLoadingMore) setPage((prev) => prev + 1);
  };

  const toggleExpand = (catName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
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
                {selectedSubcategoryName || selectedCategoryName || "All Books"}
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/40 w-full md:w-auto md:min-w-[380px] max-w-md">
              <Search className="ml-3 text-gray-700" size={20} />
              <input
                type="text"
                placeholder="Search titles, authors..."
                className="flex-1 h-10 outline-none font-medium text-gray-800 bg-transparent placeholder:text-gray-500"
              />
              <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-black transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 sm:px-8 py-10 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Sidebar */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-50 bg-white lg:relative lg:z-0 lg:block
              w-80 max-w-[85vw] lg:w-72 xl:w-80
              transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
            `}
          >
            <div className="lg:sticky lg:top-20 h-screen lg:h-[calc(100vh-5rem)] lg:pr-4 flex flex-col px-4 lg:px-0">
              <div className="flex items-center justify-between mb-6 lg:mb-8 pt-6 lg:pt-0">
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="text-blue-600" size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">
                    Categories
                  </h4>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedCategoryName(null);
                    setSelectedSubcategoryName(null);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full text-left px-5 py-4 rounded-xl text-sm font-bold mb-2
                    transition-all
                    ${!selectedCategoryName ? "bg-blue-600 text-white shadow-md" : "text-gray-800 hover:bg-gray-50"}
                  `}
                >
                  All Books
                </button>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                  <div className="space-y-1 pb-10">
                    {categories.map((cat) => (
                      <div key={cat._id || cat.name}>
                        <button
                          onClick={() => {
                            setSelectedCategoryName(cat.name);
                            setSelectedSubcategoryName(null);
                            toggleExpand(cat.name);
                          }}
                          className={`
                            w-full flex justify-between items-center px-5 py-3.5 rounded-xl text-sm font-semibold
                            transition-all
                            ${selectedCategoryName === cat.name && !selectedSubcategoryName ? "bg-blue-600 text-white shadow-md" : "text-gray-800 hover:bg-gray-50"}
                          `}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="truncate capitalize">{cat.name}</span>
                            {cat.children?.length > 0 && (
                              <span className="text-xs opacity-70">
                                {expandedCategories.has(cat.name) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium ml-2 whitespace-nowrap opacity-90">
                            {cat.count.toLocaleString()}
                          </span>
                        </button>

                        {expandedCategories.has(cat.name) && cat.children?.length > 0 && (
                          <div className="ml-6 mt-1 space-y-0.5">
                            {cat.children.map((sub) => (
                              <button
                                key={sub._id || sub.name}
                                onClick={() => {
                                  setSelectedCategoryName(cat.name);
                                  setSelectedSubcategoryName(sub.name);
                                  setIsSidebarOpen(false);
                                }}
                                className={`
                                  w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium
                                  transition-all
                                  ${selectedSubcategoryName === sub.name ? "bg-blue-100 text-blue-800 font-semibold" : "text-gray-600 hover:bg-gray-100"}
                                `}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="truncate">{sub.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {sub.count.toLocaleString()}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results area */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
              >
                <Filter size={16} /> Filter
              </button>

              <div className="flex items-center gap-5 flex-wrap">
                <p className="text-sm text-gray-600 font-medium">
                  Showing <strong>{books.length}</strong> of{" "}
                  <strong>{totalBooks.toLocaleString()}</strong> books
                </p>

                <select className="bg-white border border-gray-200 text-sm font-medium px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Newest First</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Best Selling</option>
                </select>
              </div>
            </div>

            {isLoading && page === 1 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-24 text-gray-600">
                <h2 className="text-2xl font-bold mb-4">No books found</h2>
                <p className="mb-8 max-w-md mx-auto">
                  We couldn't find any books matching this selection right now.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategoryName(null);
                    setSelectedSubcategoryName(null);
                    setPage(1);
                  }}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  View All Books
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                  {books.map((book) => (
                    <BookCard key={book.id} {...book} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-16 flex justify-center pb-20">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className={`
                        flex items-center gap-3 px-10 py-4 
                        border-2 border-gray-300 rounded-full font-semibold text-sm uppercase tracking-wide
                        hover:border-gray-900 hover:text-gray-900 transition-all
                        disabled:opacity-50 disabled:pointer-events-none
                      `}
                    >
                      {isLoadingMore ? "Loading..." : "Load More"}
                      {!isLoadingMore && <ArrowRight size={18} />}
                    </button>
                  </div>
                )}

                {!hasMore && books.length > 0 && (
                  <div className="text-center text-gray-500 py-16 text-sm">
                    End of collection • You've seen everything ✨
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