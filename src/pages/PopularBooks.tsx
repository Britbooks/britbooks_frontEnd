import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, Search, Filter, Brain, Flame, PenTool, ChefHat, Palette, Laugh, Building, Award, Users, Zap, Book as BookIcon, Info } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories, Book } from "../data/books";
import { useCart } from "../context/cartContext";

// --- Mock fetchBooks for Testing (Remove in Production) ---
const mockFetchBooks = async ({ page, limit, filters, sort, order }: { page: number; limit: number; filters?: any; sort?: string; order?: string }) => {
  const genre = filters?.genre || "Fiction";
  return {
    books: Array(limit).fill(0).map((_, i) => ({
      id: `${page}-${i}`,
      title: `Book ${i + 1} (Page ${page})`,
      author: "Author Name",
      genre,
      price: 10 + i,
      rating: 4 + Math.random(),
      imageUrl: "https://via.placeholder.com/150",
      stock: Math.random() > 0.1 ? 10 : 0,
      popularityReason: `High ratings and trending on X due to recent reviews.`,
    })),
    total: 600000,
  };
};

// --- Reusable Components ---

const StarRating = ({ rating, starSize = 12 }: { rating: number; starSize?: number }) => (
  <div className="flex items-center justify-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={starSize}
        className={i < Math.round(rating) ? "text-yellow-400" : "text-gray-300"}
        fill={i < Math.round(rating) ? "currentColor" : "none"}
      />
    ))}
  </div>
);

// Book Card Skeleton Component
const BookCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden border border-gray-200 h-full animate-pulse">
    <div className="relative bg-gray-200 p-2 flex-shrink-0 h-48">
      <div className="absolute top-0 left-0 bg-gray-700 h-6 w-12 rounded-br-lg"></div>
    </div>
    <div className="p-3 flex flex-col flex-grow items-center text-center space-y-2">
      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
      <div className="flex justify-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-3 h-3 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
      <div className="w-full h-6 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

// Book Card Component
interface BookCardProps {
  book: Book & { popularityReason?: string };
  rank: number;
}

const BookCard: React.FC<BookCardProps> = React.memo(({ book, rank }) => {
  const { addToCart } = useCart();
  const numericPrice = book.price;
  const isTopTen = rank <= 10;

  const handleAddToCart = () => {
    addToCart({
      id: book.id,
      img: book.imageUrl || "https://via.placeholder.com/150",
      title: book.title,
      author: book.author,
      price: `£${numericPrice.toFixed(2)}`,
      quantity: 1,
    });
    toast.success(`${book.title} added to your basket!`);
  };

  const showPopularityReason = () => {
    const reasons = [
      `Readers can’t stop talking about "${book.title}" on social media.`,
      `"${book.title}" has received outstanding critical acclaim and award nominations.`,
      `This book is trending due to its strong word of mouth and book club picks.`,
      `High ratings and thousands of glowing reviews are boosting "${book.title}".`,
      `Featured in major newsletters and influencer recommendations this month.`,
      `The story resonates with current cultural conversations, making it widely shared.`,
      `Adaptation news (movie/TV rights) has pushed "${book.title}" into the spotlight.`,
      `Fans are calling it a must-read for the genre — driving up demand.`,
    ];
  
    const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
  
    toast(
      (t) => (
        <div className="max-w-md p-4 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-900 text-lg">
              Why is <span className="text-blue-600">"{book.title}"</span> Popular?
            </h4>
            <button
              className="ml-3 text-gray-400 hover:text-gray-600"
              onClick={() => toast.dismiss(t.id)}
            >
              X
            </button>
          </div>
  
          <div className="mt-3 space-y-2">
            <p className="text-sm text-gray-700 leading-relaxed">
              {book.popularityReason || randomReason}
            </p>
          </div>
  
          <div className="mt-4 flex justify-end">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
              onClick={() => toast.dismiss(t.id)}
            >
              Close
            </button>
          </div>
        </div>
      ),
      { duration: 7000, position: "top-center" }
    );
  };
  

  const imageUrl = book.imageUrl && book.imageUrl.startsWith("http") ? book.imageUrl : "https://via.placeholder.com/150";

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 group flex flex-col overflow-hidden transform hover:-translate-y-2 relative border ${
        isTopTen ? "border-yellow-400" : "border-gray-200"
      } h-full`}
    >
      <div className="relative bg-gray-100 p-2 flex-shrink-0">
        <Link to={`/browse/${book.id}`} className="block">
          <img
            src={imageUrl}
            alt={book.title}
            loading="lazy"
            className="w-full h-48 object-cover mx-auto transition-transform duration-300 group-hover:scale-110 rounded-t-lg"
          />
        </Link>
        <button
          onClick={showPopularityReason}
          className={`absolute top-0 left-0 text-white font-bold px-3 py-1 text-sm rounded-br-lg ${
            isTopTen ? "bg-yellow-400 text-black hover:bg-yellow-500" : "bg-gray-700 hover:bg-gray-800"
          } transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400`}
        >
          #{rank}
        </button>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <Link to={`/browse/${book.id}`}>
            <button className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-semibold opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-4 transition-all duration-300">
              QUICK VIEW
            </button>
          </Link>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-grow items-center text-center">
        <h4 className="font-semibold text-xs text-gray-800 h-10 leading-5 mb-2 line-clamp-2">{book.title}</h4>
        <p className="text-xs text-gray-500 mb-1">{book.author}</p>
        <p className="text-xs text-gray-500 mb-1">{book.genre}</p>
        <div className="mb-1">
          <StarRating rating={book.rating || 0} />
        </div>
        <p className="text-sm font-bold text-gray-900 mt-auto mb-2">£{numericPrice.toFixed(2)}</p>
        <div className="flex gap-2 w-full">
          <button
            onClick={showPopularityReason}
            className="flex-1 bg-gray-200 text-gray-700 py-1 rounded-full text-xs hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Why Popular?
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-red-600 text-white font-medium py-1 rounded-full hover:bg-red-700 transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={book.stock === 0}
          >
            {book.stock === 0 ? "OUT OF STOCK" : "ADD TO BASKET"}
          </button>
        </div>
      </div>
    </div>
  );
});

// Category Filter Widget Component
const CategoryFilterWidget: React.FC<{
  categories: { id: string; name: string; imageUrl: string }[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}> = ({ categories, selectedCategory, setSelectedCategory }) => {
  const categoryIcons: Record<string, React.ComponentType<{ size: number; className: string }>> = {
    Mindfulness: Zap,
    Technology: Zap,
    Psychology: Brain,
    "Self-Help": Users,
    Mystery: BookIcon,
    "Contemporary Fiction": BookIcon,
    Drama: BookIcon,
    Biography: Award,
    Leadership: Users,
    "Asian Literature": BookIcon,
    Entrepreneurship: Flame,
    Poetry: PenTool,
    Humor: Laugh,
    History: Building,
    Cookbooks: ChefHat,
    Art: Palette,
    Comics: BookIcon,
  };

  return (
    <div className="relative flex items-center gap-3 bg-white rounded-xl shadow-sm p-3 border border-gray-100 transition-all duration-300 hover:shadow-md">
      <Filter size={20} className="text-red-500" />
      <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700">
        Filter by Category
      </label>
      <select
        id="categoryFilter"
        value={selectedCategory || ""}
        onChange={(e) => setSelectedCategory(e.target.value || null)}
        className={`appearance-none bg-gradient-to-r from-red-50 to-red-100 text-gray-800 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200 transition-all duration-300 cursor-pointer pr-10 ${
          selectedCategory ? "ring-2 ring-red-500" : ""
        }`}
      >
        <option value="" className="flex items-center">
          <BookIcon size={16} className="inline mr-2 text-gray-500" />
          All Categories
        </option>
        {categories.map((category) => {
          const Icon = categoryIcons[category.name] || BookIcon;
          return (
            <option key={category.id} value={category.name} className="flex items-center">
              <Icon size={16} className="inline mr-2 text-gray-500" />
              {category.name}
            </option>
          );
        })}
      </select>
      <div className="absolute right-5 pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

// --- Main Popular Books Page Component ---
const BOOKS_PER_PAGE = 105;

const PopularBooksPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(600000);
  const [categories, setCategories] = useState<{ id: string; name: string; imageUrl: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const previousCategory = (location.state as { category?: string })?.category || "Browse";


  // Responsive column count
  const getColumnCount = () => {
    if (typeof window === "undefined") return 7;
    const width = window.innerWidth;
    if (width < 640) return 2;
    if (width < 768) return 3;
    if (width < 1024) return 4;
    if (width < 1280) return 5;
    if (width < 1536) return 6;
    return 7;
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        if (!Array.isArray(fetchedCategories)) throw new Error("Invalid categories response");
        const categoryObjects = fetchedCategories.map((name: string, index: number) => ({
          id: name.toLowerCase().replace(/\s+/g, "-"),
          name,
          imageUrl: `https://picsum.photos/seed/category-${index}/300/200`,
        }));
        setCategories(categoryObjects);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
      }
    };
    fetchCategoryData();
  }, []);

  // Fetch books when page, category, search, or sort changes
  useEffect(() => {
    const fetchPopularBooks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filters: { genre?: string; search?: string } = { search: searchTerm || undefined };
        if (selectedCategory) filters.genre = selectedCategory;
        const { books: fetchedBooks, total } = await (fetchBooks({
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          filters,
          sort: sortBy === "priceLowHigh" ? "price" : sortBy === "priceHighLow" ? "price" : sortBy,
          order: sortBy === "priceHighLow" ? "desc" : sortBy === "title" ? "asc" : "desc",
        }) || mockFetchBooks({
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          filters,
          sort: sortBy === "priceLowHigh" ? "price" : sortBy === "priceHighLow" ? "price" : sortBy,
          order: sortBy === "priceHighLow" ? "desc" : sortBy === "title" ? "asc" : "desc",
        }));
        if (!Array.isArray(fetchedBooks) || typeof total !== "number") throw new Error("Invalid API response");
        const validatedBooks = fetchedBooks.map((book: any) => ({
          ...book,
          imageUrl: book.imageUrl && book.imageUrl.startsWith("http") ? book.imageUrl : "https://via.placeholder.com/150",
        }));
        setBooks(validatedBooks);
        setTotalBooks(600000);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load popular books. Please try again.");
        setIsLoading(false);
        console.error("Failed to fetch popular books:", err);
      }
    };
    fetchPopularBooks();
  }, [currentPage, selectedCategory, searchTerm, sortBy]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLiveUpdating(true);
      setBooks((prevBooks) =>
        prevBooks.map((book) => ({
          ...book,
          rating: Math.min(5, Math.max(1, book.rating + (Math.random() - 0.5) * 0.2)),
          stock: Math.random() > 0.1 ? Math.max(0, book.stock + Math.floor(Math.random() * 3 - 1)) : 0,
        }))
      );
      setTimeout(() => setIsLiveUpdating(false), 1000);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [books]);

  const totalPages = Math.min(Math.ceil(totalBooks / BOOKS_PER_PAGE), 600);
  const paginatedBooks = useMemo(() => books, [books]);
  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (error) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <TopBar />
        <div className="container mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
        .animate-pulse { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-spin { animation: spin 1s linear infinite; }
        .pagination-button {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          color: #374151;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }
        .pagination-button:hover:not(:disabled) {
          background-color: #f3f4f6;
        }
        .pagination-button.active {
          background-color: #dc2626;
          color: white;
          border-color: #dc2626;
        }
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .live-update {
          background: rgba(239, 68, 68, 0.1);
          transition: background 0.5s ease;
        }
      `}</style>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <TopBar />
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <nav aria-label="Breadcrumb" className="flex items-center justify-end text-sm font-medium">
  <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li className="flex items-center">
                <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600 transition">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                  <span className="hidden sm:inline">Home</span>
                  <span className="sm:hidden">Home</span>
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </li>
              {(selectedCategory || (previousCategory && previousCategory !== "Browse")) && (
                <>
                  <li className="flex items-center">
                    <Link
                      to="/category"
                      state={{ category: selectedCategory || previousCategory }}
                      className="text-gray-700 hover:text-blue-600 capitalize font-medium truncate max-w-[120px] sm:max-w-none"
                    >
                      {selectedCategory || previousCategory}
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                  </li>
                </>
              )}
              <li className="text-gray-900 font-semibold">Popular</li>
            </ol>
          </nav>
        </div>
      </div>
      <main className="flex-1">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white text-center py-12 md:py-16 px-4 animate-on-scroll">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Find Your Next Favorite Book</h1>
          <p className="mt-4 text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">
            Browse our most popular and highly-rated titles, loved by readers like you.
          </p>
        </div>

    

        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4 relative">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search popular books by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-400 transition-all duration-200"
              />
            </div>
            <CategoryFilterWidget
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:ring-2 hover:ring-blue-400 transition-all duration-200"
            >
              <option value="rating">Sort by Highest Rating</option>
              <option value="title">Sort by Title</option>
              <option value="priceLowHigh">Sort by Price: Low to High</option>
              <option value="priceHighLow">Sort by Price: High to Low</option>
            </select>
            {isLiveUpdating && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Info size={16} className="inline mr-2 text-red-500 animate-spin" />
                <span className="text-xs text-red-500">Updating...</span>
              </div>
            )}
          </div>

          {/* RESPONSIVE GRID — ONLY CHANGE MADE */}
          <div className={`grid gap-6 animate-on-scroll ${isLiveUpdating ? "live-update" : ""} 
            grid-cols-2 
            sm:grid-cols-3 
            md:grid-cols-4 
            lg:grid-cols-5 
            xl:grid-cols-6 
            2xl:grid-cols-7`}
          >
            {isLoading ? (
              [...Array(24)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))
            ) : paginatedBooks.length === 0 ? (
              <p className="text-center text-gray-500 py-6 col-span-full">
                No books available{selectedCategory ? ` in ${selectedCategory}` : ""}.
              </p>
            ) : (
              paginatedBooks.map((book, index) => (
                <div key={book.id} className="fade-in-up opacity-0">
                  <BookCard book={book} rank={(currentPage - 1) * BOOKS_PER_PAGE + index + 1} />
                </div>
              ))
            )}
          </div>

          {totalBooks > BOOKS_PER_PAGE && (
            <div className="mt-8 flex justify-center items-center space-x-2 sm:space-x-3 flex-wrap gap-y-2 animate-on-scroll">
              <button
                onClick={() => handlePageChange(1)}
                className="p-2 border rounded-full disabled:opacity-50 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={currentPage === 1}
              >
                <span className="sr-only">First Page</span>
                <ChevronLeft size={20} className="rotate-180" />
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 border rounded-full disabled:opacity-50 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} />
              </button>
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-button ${currentPage === page ? "active" : ""}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 border rounded-full disabled:opacity-50 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                className="p-2 border rounded-full disabled:opacity-50 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Last Page</span>
                <ChevronRight size={20} />
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PopularBooksPage;