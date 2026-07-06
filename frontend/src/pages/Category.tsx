import React, { useState, useEffect, useRef } from "react";
import HeroSearchBar from "../components/HeroSearchBar";
import { Link, useSearchParams } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import {
  ChevronDown, ChevronUp, LayoutGrid, Search, X,
  ArrowRight, SlidersHorizontal, ChevronRight, Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";
import { fetchBooks, fetchCategories, Book, CategoryNode } from "../data/books";
import { useCart } from "../context/cartContext";
import BookCard from "../components/BookCard";

// ── CONSTANTS ────────────────────────────────────────────────────────────

const CONDITIONS = [
  { value: null,         label: "Any Condition" },
  { value: "new",        label: "New" },
  { value: "like new",   label: "Like New" },
  { value: "very good",  label: "Very Good" },
  { value: "good",       label: "Good" },
  { value: "acceptable", label: "Acceptable" },
];

const SORT_OPTIONS = [
  { value: "newest",       label: "Newest First",        sort: "listedAt", order: "desc" },
  { value: "price-asc",    label: "Price: Low to High",  sort: "price",    order: "asc"  },
  { value: "price-desc",   label: "Price: High to Low",  sort: "price",    order: "desc" },
  { value: "best-selling", label: "Best Selling",        sort: "purchases",order: "desc" },
];

// ── UTILITIES ────────────────────────────────────────────────────────────

const formatBooksForDisplay = (books: Book[]) =>
  books.map((book) => ({
    id: book.id,
    img: book.imageUrl?.trim() || "https://via.placeholder.com/150",
    title: book.title,
    author: book.author,
    price: `£${book.price.toFixed(2)}`,
    rating: book.rating || 0,
    condition: book.condition,
  }));

const computeCategoryCount = (cat: CategoryNode) => {
  if (cat.count !== undefined) return cat.count;
  if (!cat.children?.length) return 0;
  return cat.children.reduce((sum, sub) => sum + (sub.count || 0), 0);
};

// ── MAIN PAGE ────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("category"));
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(searchParams.get("subcategory") || null);
  const [condition, setCondition] = useState<string | null>(searchParams.get("condition") || null);
  const [priceMin, setPriceMin] = useState<string>(searchParams.get("priceMin") || "");
  const [priceMax, setPriceMax] = useState<string>(searchParams.get("priceMax") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");

  const priceMinRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMaxRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSortOption = SORT_OPTIONS.find(o => o.value === sortBy) ?? SORT_OPTIONS[0];

  // Active filter count badge
  const activeFilterCount = [condition, priceMin, priceMax].filter(Boolean).length;

  // ── URL sync ──────────────────────────────────────────────────────────

  useEffect(() => {
    setSelectedCategory(searchParams.get("category"));
    setSelectedSubcategory(searchParams.get("subcategory") || null);
    setCondition(searchParams.get("condition") || null);
    setPriceMin(searchParams.get("priceMin") || "");
    setPriceMax(searchParams.get("priceMax") || "");
    setSortBy(searchParams.get("sort") || "newest");
  }, [searchParams]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedCategory)   params.category   = selectedCategory;
    if (selectedSubcategory) params.subcategory = selectedSubcategory;
    if (condition)           params.condition  = condition;
    if (priceMin)            params.priceMin   = priceMin;
    if (priceMax)            params.priceMax   = priceMax;
    if (sortBy !== "newest") params.sort       = sortBy;
    setSearchParams(params, { replace: true });
  }, [selectedCategory, selectedSubcategory, condition, priceMin, priceMax, sortBy]);

  // ── Reset when filters change ─────────────────────────────────────────

  useEffect(() => {
    setPage(1);
    setBooks([]);
    setHasMore(true);
  }, [selectedCategory, selectedSubcategory, condition, priceMin, priceMax, sortBy]);

  // ── Load categories once ──────────────────────────────────────────────

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  // ── Load books ────────────────────────────────────────────────────────

  useEffect(() => {
    const loadBooks = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params: any = {
          page,
          limit: 16,
          sort: activeSortOption.sort,
          order: activeSortOption.order,
        };

        if (selectedCategory)   params.category    = selectedCategory;
        if (selectedSubcategory) params.subcategory = selectedSubcategory;
        if (condition)           params.condition   = condition;
        if (priceMin)            params.priceMin    = parseFloat(priceMin);
        if (priceMax)            params.priceMax    = parseFloat(priceMax);

        const result = await fetchBooks(params);
        const fetched = result.listings || [];
        const formatted = formatBooksForDisplay(fetched);

        setBooks(prev => isFirstPage ? formatted : [...prev, ...formatted]);
        setHasMore(fetched.length === 16);
      } catch (err) {
        console.error("[Browse] Load failed:", err);
        toast.error("Could not load books");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    if (categories.length > 0 || !selectedCategory) loadBooks();
  }, [page, selectedCategory, selectedSubcategory, condition, priceMin, priceMax, sortBy, categories]);

  // ── Helpers ───────────────────────────────────────────────────────────

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setCondition(null);
    setPriceMin("");
    setPriceMax("");
    setSortBy("newest");
  };

  const toggleExpand = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const activeCat = categories.find(c => c.name === selectedCategory);
  const headerBg = `https://picsum.photos/seed/${(selectedCategory ?? "all").replace(/\s/g, "")}x/1600/900`;

  // ── SHARED FILTER PANEL (used in sidebar + mobile sheet) ─────────────

  const FilterPanel = () => (
    <div className="space-y-6">

      {/* Sort */}
      <div>
        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Sort By</h4>
        <div className="space-y-1">
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setSortBy(opt.value)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                sortBy === opt.value
                  ? "bg-blue-600 text-white font-bold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div className="pt-5 border-t border-gray-100">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Condition</h4>
        <div className="space-y-1">
          {CONDITIONS.map(c => (
            <button key={c.label} onClick={() => setCondition(c.value)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                condition === c.value
                  ? "bg-blue-600 text-white font-bold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="pt-5 border-t border-gray-100">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">£</span>
            <input type="number" placeholder="Min" min="0" value={priceMin}
              onChange={e => setPriceMin(e.target.value)}
              className="w-full pl-7 pr-2 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0a1628] transition-all"
            />
          </div>
          <span className="text-gray-300 font-bold">—</span>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">£</span>
            <input type="number" placeholder="Max" min="0" value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              className="w-full pl-7 pr-2 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0a1628] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Clear filters */}
      {(condition || priceMin || priceMax || sortBy !== "newest") && (
        <button onClick={() => { setCondition(null); setPriceMin(""); setPriceMax(""); setSortBy("newest"); }}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:border-red-300 hover:text-red-500 transition-all">
          Clear Filters
        </button>
      )}
    </div>
  );

  // ── ACTIVE FILTER CHIPS ───────────────────────────────────────────────

  const ActiveChips = () => (
    <div className="flex flex-wrap items-center gap-2">
      {selectedCategory && (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1628] text-white text-xs font-bold rounded-full">
          {selectedCategory}
          <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}>
            <X size={11} />
          </button>
        </span>
      )}
      {selectedSubcategory && (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1628]/80 text-white text-xs font-bold rounded-full">
          {selectedSubcategory}
          <button onClick={() => setSelectedSubcategory(null)}><X size={11} /></button>
        </span>
      )}
      {condition && (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
          {CONDITIONS.find(c => c.value === condition)?.label}
          <button onClick={() => setCondition(null)}><X size={11} /></button>
        </span>
      )}
      {(priceMin || priceMax) && (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
          £{priceMin || "0"} – £{priceMax || "∞"}
          <button onClick={() => { setPriceMin(""); setPriceMax(""); }}><X size={11} /></button>
        </span>
      )}
      {sortBy !== "newest" && (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
          {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
          <button onClick={() => setSortBy("newest")}><X size={11} /></button>
        </span>
      )}
    </div>
  );

  const hasActiveFilters = !!(selectedCategory || selectedSubcategory || condition || priceMin || priceMax || sortBy !== "newest");

  // ── RENDER ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEOHead
        title="Browse Books by Category"
        description="Explore our wide range of book categories at BritBooks. Find fiction, non-fiction, children's books, self-help, and more at great prices."
        canonical="/category"
      />
      <TopBar />
      <Toaster position="bottom-right" />

      {/* ════════════════════════════════════════════════════════
          MOBILE LAYOUT
      ════════════════════════════════════════════════════════ */}
      <div className="sm:hidden flex flex-col min-h-screen">

        {/* Mobile header */}
        <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Browse</p>
              <h1 className="text-xl font-black text-gray-900 capitalize leading-tight">
                {selectedSubcategory || selectedCategory || "All Books"}
              </h1>
            </div>
          </div>
          <HeroSearchBar placeholder="Search titles, authors…" accent="blue" />
        </div>

        {/* Category chip rail */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <motion.button whileTap={{ scale: 0.92 }}
              onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all ${
                !selectedCategory ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
              }`}>All</motion.button>
            {categories.map(cat => (
              <motion.button key={cat.name} whileTap={{ scale: 0.92 }}
                onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all capitalize ${
                  selectedCategory === cat.name ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
                }`}>{cat.name}</motion.button>
            ))}
          </div>

          {/* Subcategory chips */}
          <AnimatePresence>
            {(activeCat?.children?.length ?? 0) > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-gray-50">
                <div className="flex gap-2 px-4 py-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {activeCat?.children?.map(sub => (
                    <motion.button key={sub.name} whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedSubcategory(sub.name === selectedSubcategory ? null : sub.name)}
                      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all capitalize ${
                        selectedSubcategory === sub.name
                          ? "bg-[#c9a84c] text-black border-[#c9a84c]"
                          : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}>{sub.name}</motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile filter / sort bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
          <span className="text-xs text-gray-500 font-medium">
            {books.length} {books.length === 1 ? "book" : "books"}
          </span>
          <button onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-1.5 text-xs font-black text-[#0a1628] px-3 py-1.5 rounded-full border border-gray-200 bg-white relative">
            <SlidersHorizontal size={13} />
            Sort & Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#c9a84c] text-black text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active chips (mobile) */}
        {hasActiveFilters && (
          <div className="px-4 py-2 bg-white border-b border-gray-50 flex flex-wrap gap-1.5">
            <ActiveChips />
          </div>
        )}

        {/* Book grid */}
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
              <p className="text-sm text-gray-400 mb-6">Try adjusting your filters.</p>
              <button onClick={clearAllFilters}
                className="bg-[#c9a84c] text-black font-black px-6 py-3 rounded-2xl text-sm">
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {books.map(book => <BookCard key={book.id} {...book} />)}
              </div>
              {isLoadingMore && (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-[#0a1628] rounded-full animate-spin" />
                </div>
              )}
              {hasMore && !isLoadingMore && (
                <div className="mt-6 px-2">
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setPage(p => p + 1)}
                    className="w-full py-4 bg-[#c9a84c] text-black font-black rounded-2xl text-sm">
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

        {/* Mobile filter bottom sheet */}
        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={() => setShowMobileFilters(false)} />
              <motion.div key="sheet"
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between z-10">
                  <h3 className="text-base font-black text-gray-900">Sort & Filter</h3>
                  <button onClick={() => setShowMobileFilters(false)}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
                <div className="px-6 py-5">
                  <FilterPanel />
                </div>
                <div className="sticky bottom-0 bg-white px-6 pb-8 pt-3 border-t border-gray-100">
                  <button onClick={() => setShowMobileFilters(false)}
                    className="w-full py-4 rounded-2xl font-black text-sm text-[#0a1628]"
                    style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96a)" }}>
                    Show Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════════════════
          DESKTOP LAYOUT
      ════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block">
        {/* Hero header */}
        <header
          className="relative pt-14 pb-12 px-6 md:px-8 overflow-hidden"
          style={{
            backgroundImage: `url(${headerBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
          <div className="relative z-10 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
              <div>
                <span className="text-white font-black uppercase tracking-[0.3em] mb-2 block">
                  Premium Marketplace
                </span>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-xl capitalize">
                  {selectedSubcategory || selectedCategory || "All Books"}
                </h1>
              </div>
              <div className="w-full md:w-auto">
                <HeroSearchBar placeholder="Search titles, authors…" accent="blue" />
              </div>
            </div>
          </div>
        </header>

        <main className="w-full px-6 sm:px-8 py-10 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

            {/* ── Sidebar ── */}
            <aside className={`
              fixed inset-y-0 left-0 z-50 bg-white lg:relative lg:z-0 lg:block
              w-80 max-w-[85vw] lg:w-72 xl:w-80
              transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
            `}>
              <div className="lg:sticky lg:top-20 h-screen lg:h-[calc(100vh-5rem)] lg:pr-4 flex flex-col px-4 lg:px-0 overflow-y-auto">
                <div className="flex items-center justify-between mb-6 lg:mb-8 pt-6 lg:pt-0">
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="text-[#0a1628]" size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Categories</h4>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2.5 bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                {/* Category list */}
                <div className="space-y-1 mb-2">
                  <button
                    onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setIsSidebarOpen(false); }}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold ${
                      !selectedCategory ? "bg-blue-600 text-white shadow-md" : "text-gray-800 hover:bg-gray-50"
                    }`}>All Books</button>
                  {categories.map(cat => (
                    <div key={cat.name}>
                      <button
                        onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(null); toggleExpand(cat.name); setIsSidebarOpen(false); }}
                        className={`w-full flex justify-between items-center px-5 py-3.5 rounded-xl text-sm font-semibold ${
                          selectedCategory === cat.name
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-gray-800 hover:bg-gray-50"
                        }`}>
                        <span className="capitalize">{cat.name}</span>
                        {(cat.children?.length ?? 0) > 0 && (
                          <span className="text-xs opacity-70 ml-2">
                            {expandedCategories.has(cat.name) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </button>
                      {expandedCategories.has(cat.name) && (cat.children?.length ?? 0) > 0 && (
                        <div className="ml-6 mt-1 space-y-0.5">
                          {cat.children?.map(sub => (
                            <button key={sub.name}
                              onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(sub.name); setIsSidebarOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                                selectedSubcategory === sub.name
                                  ? "bg-blue-600 text-white font-bold"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}>{sub.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-4" />

                {/* Filter panel */}
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal size={15} className="text-[#0a1628]" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Filters</h4>
                  {activeFilterCount > 0 && (
                    <span className="ml-auto text-[10px] font-black bg-[#c9a84c] text-[#0a1628] px-2 py-0.5 rounded-full">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
                <FilterPanel />

                <div className="pb-10" />
              </div>
            </aside>

            {/* ── Results ── */}
            <div className="flex-1">
              {/* Results bar */}
              <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100 gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm text-gray-500 font-medium">
                    Showing <strong className="text-gray-900">{books.length}</strong> results
                  </p>
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters}
                      className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-full border border-red-200 hover:border-red-300 transition-all">
                      Clear all
                    </button>
                  )}
                </div>
                {/* Mobile sidebar toggle */}
                <button onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700">
                  <SlidersHorizontal size={15} /> Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-[#c9a84c] text-[#0a1628] text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="mb-5">
                  <ActiveChips />
                </div>
              )}

              {/* Book grid */}
              {isLoading && page === 1 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-24 text-gray-600">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                    <Search size={28} className="text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">No books found</h2>
                  <p className="mb-8 max-w-md mx-auto text-gray-400">Try changing your filters or browse all books.</p>
                  <button onClick={clearAllFilters}
                    className="bg-[#0a1628] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#0d1f38] transition-all">
                    View All Books
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                    {books.map(book => <BookCard key={book.id} {...book} />)}
                  </div>
                  {hasMore && (
                    <div className="mt-16 flex justify-center pb-20">
                      <button onClick={() => setPage(p => p + 1)} disabled={isLoadingMore}
                        className="flex items-center gap-3 px-10 py-4 border-2 border-gray-300 rounded-full font-semibold text-sm uppercase tracking-wide hover:border-[#0a1628] hover:text-[#0a1628] transition-all disabled:opacity-50">
                        {isLoadingMore ? "Loading..." : "Load More"}
                        {!isLoadingMore && <ArrowRight size={18} />}
                      </button>
                    </div>
                  )}
                  {!hasMore && books.length > 0 && (
                    <div className="text-center text-gray-400 py-16 text-sm">
                      You've reached the end ✨
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
