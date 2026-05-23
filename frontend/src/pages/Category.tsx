import React, { useState, useEffect, useRef } from "react";
import GlobalSearchBar from "../components/GlobalSearchBar";
import { Link, useSearchParams } from "react-router-dom";
import SEOHead from "../components/SEOHead";
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
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";

import { fetchBooks, fetchCategories, Book, CategoryNode } from "../data/books";
import { useCart } from "../context/cartContext";
import BookCard from "../components/BookCard";

// ── UTILITIES ────────────────────────────────────────────────────────────

const formatBooksForDisplay = (books: Book[]) => {
  return books.map((book) => ({
    id: book.id,
    img: book.imageUrl?.trim() || "https://via.placeholder.com/150",
    title: book.title,
    author: book.author,
    price: `£${book.price.toFixed(2)}`,
    rating: book.rating || 0,
    condition: book.condition,
  }));
};

const getFilters = (
  selectedCategory: string | null,
  selectedSubcategory: string | null
) => {
  if (!selectedCategory) {
    return {};
  }

  // When subcategory is selected → send BOTH for strict filtering
  if (selectedSubcategory) {
    return {
      category: selectedCategory,
      subcategory: selectedSubcategory,
    };
  }

  // Only main category selected → filter broadly on category
  return {
    category: selectedCategory,
  };
};

const computeCategoryCount = (cat: CategoryNode) => {
  if (cat.count !== undefined) return cat.count;
  if (!cat.children || cat.children.length === 0) return cat.count || 0;
  return cat.children.reduce((sum, sub) => sum + (sub.count || 0), 0);
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

// const BookCard = ({ id, img, title, author, price, rating, condition }: any) => {
//   const { addToCart } = useCart();

//   const handleAddToBasket = (e: React.MouseEvent) => {
//     e.preventDefault();
//     addToCart({ id, img, title, author, price, quantity: 1 });
//     toast.success(`Added ${title} to basket`, {
//       style: { borderRadius: "15px", fontWeight: "bold" },
//     });
//   };

//   return (
//     <div className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-500/20 hover:shadow-lg transition-all p-3 flex flex-col">
//       <Link to={`/browse/${id}`} className="relative aspect-[3/4] overflow-hidden rounded-xl mb-3 bg-gray-50">
//         <img
//           src={img}
//           alt={title}
//           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//         />
//         {/* Condition badge removed */}
//       </Link>
//       <div className="flex-grow">
//         <h3 className="font-black text-[13px] text-gray-900 line-clamp-2 mb-1">{title}</h3>
//         <p className="text-gray-500 text-[11px] mb-2 font-medium">{author}</p>
//         <StarRating rating={rating} />
//       </div>
//       <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
//         <span className="text-blue-600 font-black text-base">{price}</span>
//         <button
//           onClick={handleAddToBasket}
//           className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
//         >
//           <ShoppingBag size={14} />
//           Basket
//         </button>
//       </div>
//     </div>
//   );
// };
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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    searchParams.get("subcategory") || null
  );

  // Sync URL → state
  useEffect(() => {
    setSelectedCategory(searchParams.get("category"));
    setSelectedSubcategory(searchParams.get("subcategory") || null);
  }, [searchParams]);

  // Sync state → URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedCategory) params.category = selectedCategory;
    if (selectedSubcategory) params.subcategory = selectedSubcategory;
    setSearchParams(params, { replace: true });
  }, [selectedCategory, selectedSubcategory, setSearchParams]);

  const getRandomHeaderBg = () => {
    const seed = Math.floor(Math.random() * 10000);
    return `https://picsum.photos/seed/${seed}/1600/900`;
  };

  const [headerBg, setHeaderBg] = useState(getRandomHeaderBg());

  useEffect(() => {
    setHeaderBg(getRandomHeaderBg());
  }, [selectedCategory, selectedSubcategory]);

  const LIMIT = 16;

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  // Reset pagination & books when filters change
  useEffect(() => {
    setPage(1);
    setBooks([]);
    setHasMore(true);
    setTotalBooks(0);
  }, [selectedCategory, selectedSubcategory]);

  // Load books
  useEffect(() => {
    const loadBooks = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params: any = {
          page,
          limit: LIMIT,
        };

        const filters = getFilters(selectedCategory, selectedSubcategory);
        Object.assign(params, filters);

        console.log("[Browse] Fetching →", params);

        const result = await fetchBooks(params);
        const fetched = result.listings || [];

        const formatted = formatBooksForDisplay(fetched);

        setBooks((prev) => (isFirstPage ? formatted : [...prev, ...formatted]));
        setTotalBooks(result.meta?.count || 0);
        setHasMore(fetched.length === LIMIT);
      } catch (err) {
        console.error("[Browse] Load failed:", err);
        toast.error("Could not load books");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    if (categories.length > 0 || !selectedCategory) {
      loadBooks();
    }
  }, [page, selectedCategory, selectedSubcategory, categories]);

  const handleLoadMore = () => {
    if (!isLoadingMore) setPage((p) => p + 1);
  };

  const toggleExpand = (catName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  // Active category's children for subcategory chips
  const activeCat = categories.find((c) => c.name === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEOHead
        title="Browse Books by Category"
        description="Explore our wide range of book categories at BritBooks. Find fiction, non-fiction, children's books, self-help, and more at great prices."
        canonical="/category"
      />
      <TopBar />
      <Toaster position="bottom-right" />

      {/* ══════════════════════════════════════════════════════
          MOBILE LAYOUT
      ══════════════════════════════════════════════════════ */}
      <div className="sm:hidden flex flex-col min-h-screen">

        {/* ── Compact mobile header ── */}
        <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Browse</p>
              <h1 className="text-xl font-black text-gray-900 capitalize leading-tight">
                {selectedSubcategory || selectedCategory || "All Books"}
              </h1>
            </div>
          </div>

          {/* Search bar */}
          <GlobalSearchBar variant="light" placeholder="Search titles, authors…" />
        </div>

        {/* ── Category chip rail ── */}
        <div className="bg-white border-b border-gray-100">
          <div
            className="flex gap-2 px-4 py-3 overflow-x-auto"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {/* All chip */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all ${
                !selectedCategory
                  ? "bg-[#0a1628] text-white border-[#0a1628]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              All
            </motion.button>

            {categories.map((cat) => (
              <motion.button
                key={cat.name}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSelectedSubcategory(null);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all capitalize ${
                  selectedCategory === cat.name
                    ? "bg-[#0a1628] text-white border-[#0a1628]"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>

          {/* ── Subcategory chip rail (visible when a category is active) ── */}
          <AnimatePresence>
            {(activeCat?.children?.length ?? 0) > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-gray-50"
              >
                <div
                  className="flex gap-2 px-4 py-2.5 overflow-x-auto"
                  style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
                >
                  {activeCat?.children?.map((sub) => (
                    <motion.button
                      key={sub.name}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedSubcategory(sub.name === selectedSubcategory ? null : sub.name)}
                      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all capitalize ${
                        selectedSubcategory === sub.name
                          ? "bg-[#c9a84c] text-black border-[#c9a84c]"
                          : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}
                    >
                      {sub.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Active filter + sort bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            {(selectedCategory || selectedSubcategory) && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full"
              >
                <X size={11} />
                {selectedSubcategory || selectedCategory}
              </motion.button>
            )}
            {!selectedCategory && !selectedSubcategory && (
              <span className="text-xs text-gray-400 font-medium">All categories</span>
            )}
          </div>
          <select className="text-xs font-bold text-gray-600 bg-transparent outline-none">
            <option>Newest</option>
            <option>Price ↑</option>
            <option>Price ↓</option>
            <option>Best Selling</option>
          </select>
        </div>

        {/* ── Book grid ── */}
        <div className="flex-1 px-3 pt-3 pb-10">
          {isLoading && page === 1 ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: 260 }} />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Search size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-black text-gray-800 mb-2">No books found</h3>
              <p className="text-sm text-gray-400 mb-6">Try a different category or clear your filters.</p>
              <button
                onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
                className="bg-[#c9a84c] text-black font-black px-6 py-3 rounded-2xl text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {books.map((book) => (
                  <BookCard key={book.id} {...book} />
                ))}
              </div>

              {isLoadingMore && (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-[#0a1628] rounded-full animate-spin" />
                </div>
              )}

              {hasMore && !isLoadingMore && (
                <div className="mt-6 px-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLoadMore}
                    className="w-full py-4 bg-[#c9a84c] text-black font-black rounded-2xl text-sm"
                  >
                    Load More Books
                  </motion.button>
                </div>
              )}

              {!hasMore && books.length > 0 && (
                <p className="text-center text-gray-400 text-xs font-bold py-8 uppercase tracking-widest">
                  You've seen them all ✨
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP LAYOUT (unchanged)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden sm:block">
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
                <span className="text-white font-black uppercase tracking-[0.3em] mb-2 block">
                  Premium Marketplace
                </span>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-xl capitalize">
                  {selectedSubcategory || selectedCategory || "All Books"}
                </h1>
              </div>
              <div className="w-full md:w-auto md:min-w-[380px] max-w-md">
                <GlobalSearchBar variant="light" placeholder="Search titles, authors…" />
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
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Categories</h4>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2.5 bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <button
                    onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setIsSidebarOpen(false); }}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold mb-2 ${
                      !selectedCategory ? "bg-blue-600 text-white shadow-md" : "text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    All Books
                  </button>
                  <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="space-y-1 pb-10">
                      {categories.map((cat) => (
                        <div key={cat.name}>
                          <button
                            onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(null); toggleExpand(cat.name); setIsSidebarOpen(false); }}
                            className={`w-full flex justify-between items-center px-5 py-3.5 rounded-xl text-sm font-semibold ${
                              selectedCategory === cat.name && !selectedSubcategory
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-800 hover:bg-gray-50"
                            }`}
                          >
                            <span className="capitalize">{cat.name}</span>
                            {cat.children?.length > 0 && (
                              <span className="text-xs opacity-70 ml-2">
                                {expandedCategories.has(cat.name) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </span>
                            )}
                          </button>
                          {expandedCategories.has(cat.name) && cat.children?.length > 0 && (
                            <div className="ml-6 mt-1 space-y-0.5">
                              {cat.children.map((sub) => (
                                <button
                                  key={sub.name}
                                  onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(sub.name); setIsSidebarOpen(false); }}
                                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                                    selectedSubcategory === sub.name
                                      ? "bg-blue-100 text-blue-800 font-semibold"
                                      : "text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  {sub.name}
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

            {/* Results */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
                <div className="flex items-center gap-5 flex-wrap">
                  <p className="text-sm text-gray-600 font-medium">
                    Showing <strong>{books.length}</strong> results
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
                  <p className="mb-8 max-w-md mx-auto">Try changing filters or browse all books.</p>
                  <button
                    onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setPage(1); }}
                    className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700"
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
                        className="flex items-center gap-3 px-10 py-4 border-2 border-gray-300 rounded-full font-semibold text-sm uppercase tracking-wide hover:border-gray-900 hover:text-gray-900 transition-all disabled:opacity-50"
                      >
                        {isLoadingMore ? "Loading..." : "Load More"}
                        {!isLoadingMore && <ArrowRight size={18} />}
                      </button>
                    </div>
                  )}
                  {!hasMore && books.length > 0 && (
                    <div className="text-center text-gray-500 py-16 text-sm">
                      End of results • You've reached the end ✨
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}