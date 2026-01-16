
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Filter, Brain, Flame, PenTool, ChefHat, Palette, Laugh, Building, Award, Users, Zap, Book as BookIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories, Book } from "../data/books";
import { useCart } from "../context/cartContext";

// --- SVG ICONS ---
const TwitterIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.39.106-.803.163-1.227.163-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path>
  </svg>
);
const FacebookIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path>
  </svg>
);
const InstagramIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.358-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
  </svg>
);

// --- Reusable Components ---

// Star Rating Component
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
    <div className="relative bg-gray-200 p-2 flex-shrink-0 h-48"></div>
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
  book: Book;
}

const BookCard: React.FC<BookCardProps> = React.memo(({ book }) => {
  const { addToCart } = useCart();
  const numericPrice = book.price;
  const isNew = book.releaseDate
    ? new Date(book.releaseDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    : false;

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

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden transform hover:-translate-y-1 relative border border-gray-200 h-full">
      <div className="relative bg-gray-100 p-2 flex-shrink-0">
        <Link to={`/browse/${book.id}`} className="block">
          <img
            src={book.imageUrl || "https://via.placeholder.com/150"}
            alt={book.title}
            loading="lazy"
            className="w-full h-48 object-cover mx-auto transition-transform duration-300 group-hover:scale-105 rounded-t-lg"
          />
        </Link>
        {isNew && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            New
          </div>
        )}
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
        <p className="text-xs text-gray-500 mb-1">{book.category}</p>
        <div className="mb-1">
          <StarRating rating={book.rating || 0} />
        </div>
        <p className="text-sm font-bold text-gray-900 mt-auto mb-2">£{numericPrice.toFixed(2)}</p>
        <button
          onClick={handleAddToCart}
          className="w-full bg-red-600 text-white font-medium py-1 rounded-full hover:bg-red-700 transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={book.stock === 0}
        >
          {book.stock === 0 ? "OUT OF STOCK" : "ADD TO BASKET"}
        </button>
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
      <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700">Filter by Category</label>
      <select
        id="categoryFilter"
        value={selectedCategory || ""}
        onChange={(e) => setSelectedCategory(e.target.value || null)}
        className="appearance-none bg-gradient-to-r from-red-50 to-red-100 text-gray-800 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200 transition-all duration-300 cursor-pointer pr-10"
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

// Why Shop Section Data
const whyShopPoints = [
  { title: "Fresh Stories", description: "Discover the latest books hot off the press.", icon: BookIcon },
  { title: "Sustainable Reading", description: "Support eco-friendly practices with pre-loved and new books.", icon: Star },
  { title: "Curated Selection", description: "Handpicked titles to spark your imagination.", icon: Award },
];

// Main New Arrivals Page Component
const NewArrivalsPage: React.FC = () => {
  const { addToCart } = useCart();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [totalBooks] = useState(3000000); // Over 3 million books for 28,571 pages with 105 per page
  const [categories, setCategories] = useState<{ id: string; name: string; imageUrl: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const BOOKS_PER_PAGE = 105; // Match BestsellersPage
  const FEATURED_BOOKS_LIMIT = 7; // 7 books for featured section
  const previousCategory = (location.state as { category?: string })?.category || "Browse";


  // Handle scroll for featured books
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? 240 : 200; // ~240px for mobile, ~200px for desktop
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      });
    }
  };

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
  }, []);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch main books
        const { books: mainBooks } = await fetchBooks({
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          sort: "createdAt",
          order: "desc",
          filters: selectedCategory ? { category: selectedCategory } : undefined,
        });
        setBooks(mainBooks);

        // Fetch featured books (top 7 newest, no category filter)
        const { books: featured } = await fetchBooks({
          page: 1,
          limit: FEATURED_BOOKS_LIMIT,
          sort: "createdAt",
          order: "desc",
        });
        setFeaturedBooks(featured);

        setIsLoading(false);
      } catch (err) {
        setError("Failed to load new arrivals. Please try again.");
        setIsLoading(false);
        console.error("❌ Failed to fetch new arrivals:", err instanceof Error ? err.message : err);
      }
    };
    fetchNewArrivals();
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const fetchedCategories = await fetchCategories();
  
        const categoryObjects = fetchedCategories.map((cat, index) => ({
          id: cat._id,
          name: cat.name,
          imageUrl: `https://picsum.photos/seed/category-${cat.slug || cat._id || index}/300/200`,
        }));
  
        setCategories(categoryObjects);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
      }
    };
  
    fetchCategoryData();
  }, []);

  const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE); // ~28,571 pages
  const paginatedBooks = useMemo(() => books, [books]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const visiblePages = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (error) {
    return (
      <div className="bg-gray-50 font-sans min-h-screen text-gray-800">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <TopBar />
        <div className="container mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 font-sans min-h-screen text-gray-800">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
        .animate-pulse { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .hero-section {
          background-image: url('https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
        }
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(35, 39, 47, 0.7));
          z-index: 1;
        }
        .hero-section > * {
          position: relative;
          z-index: 2;
        }
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
        .scroll-container {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .scroll-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari */
        }
        @media (max-width: 767px) {
          .scroll-container {
            padding: 0 8px; /* Reduced padding for mobile */
          }
          .scroll-container > div {
            width: 66.67% !important; /* Show ~1.5 cards on mobile */
          }
          .scroll-button {
            padding: 0.25rem; /* Smaller buttons on mobile */
          }
        }
        @media (min-width: 768px) {
          .scroll-container {
            justify-content: center; /* Center book cards on desktop */
            max-width: 100%; /* Ensure container respects max-width */
          }
          .scroll-container > div {
            min-width: 150px; /* Ensure cards don't shrink too much */
          }
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
              <li className="text-gray-900 font-semibold">New Arrivals</li>
            </ol>
          </nav>
        </div>
      </div>

      <main>
        {/* Hero Section */}
        <header className="hero-section text-white py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center animate-on-scroll">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">New Arrivals</h1>
            <p className="text-base md:text-xl max-w-3xl mx-auto text-gray-200">
              Explore the newest additions to the BritBooks collection — fresh stories, new adventures, and timeless classics waiting for you.
            </p>
          </div>
        </header>

        {/* Featured Books Section */}
        <section className="py-6 md:py-10 bg-gradient-to-b from-white to-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 animate-on-scroll gap-4">
              <h2 className="text-xl md:text-3xl font-bold text-gray-800">
                {window.innerWidth < 768 ? "Featured New Arrivals" : "Featured Books"}
              </h2>
              <div className="flex space-x-2 self-end md:self-auto">
                <button
                  onClick={() => handleScroll('left')}
                  className="p-2 md:p-2 border rounded-full text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 scroll-button"
                  disabled={scrollContainerRef.current?.scrollLeft === 0}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} className="md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="p-2 md:p-2 border rounded-full text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 scroll-button"
                  disabled={
                    scrollContainerRef.current?.scrollLeft ===
                    (scrollContainerRef.current?.scrollWidth - scrollContainerRef.current?.clientWidth)
                  }
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>
            <div
              className="flex overflow-x-auto scroll-container gap-4 animate-on-scroll snap-x snap-mandatory"
              ref={scrollContainerRef}
            >
              {isLoading ? (
                [...Array(FEATURED_BOOKS_LIMIT)].map((_, i) => <BookCardSkeleton key={i} />)
              ) : featuredBooks.length === 0 ? (
                <p className="text-center text-gray-500 py-6 w-full">No featured books available.</p>
              ) : (
                featuredBooks.map((book) => (
                  <div className="flex-shrink-2 min-w-80px] md:min-w-[80px] lg:min-w-[60px] snap-center">
                  <BookCard book={book} />
                </div>
                
                ))
              )}
            </div>
          </div>
        </section>

        {/* Why Shop New Arrivals Section */}
        <section className="py-8 md:py-10 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center animate-on-scroll mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Why Shop New Arrivals?</h2>
              <p className="mt-1 text-base text-gray-600">Explore the benefits of diving into our latest collection.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {whyShopPoints.map((point, index) => (
                <div
                  key={index}
                  className="animate-on-scroll bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <point.icon className="h-8 w-8 text-red-600 mb-2 animate-pulse" />
                  <h3 className="text-lg font-bold text-gray-800">{point.title}</h3>
                  <p className="mt-1 text-gray-600">{point.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* New Arrivals Section */}
        <section className="py-6 md:py-10 bg-gradient-to-b from-white to-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 animate-on-scroll gap-4">
              <h2 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Star size={24} className="text-yellow-400" />
                Latest Arrivals
                {selectedCategory && (
                  <span className="text-sm font-normal text-gray-500"> in {selectedCategory}</span>
                )}
              </h2>
              <CategoryFilterWidget
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {isLoading ? (
                [...Array(BOOKS_PER_PAGE)].map((_, i) => <BookCardSkeleton key={i} />)
              ) : paginatedBooks.length === 0 ? (
                <p className="text-center text-gray-500 py-6 col-span-full">
                  No new arrivals available{selectedCategory ? ` in ${selectedCategory}` : ""}.
                </p>
              ) : (
                paginatedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))
              )}
            </div>
            {totalBooks > BOOKS_PER_PAGE && (
              <div className="mt-4 md:mt-8 flex justify-center items-center space-x-2 md:space-x-3 flex-wrap gap-y-2">
                <button
                  onClick={() => handlePageChange(1)}
                  className="p-2 border rounded-full disabled:opacity-50 text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={currentPage === 1}
                  aria-label="First Page"
                >
                  <span className="sr-only">First Page</span>
                  <ChevronLeft size={20} className="rotate-180" />
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-2 border rounded-full disabled:opacity-50 text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={20} />
                </button>
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-button ${currentPage === page ? "active" : ""}`}
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > visiblePages[visiblePages.length - 1] && (
                  <span className="text-gray-500">...</span>
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-2 border rounded-full disabled:opacity-50 text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={currentPage === totalPages}
                  aria-label="Next Page"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="p-2 border rounded-full disabled:opacity-50 text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={currentPage === totalPages}
                  aria-label="Last Page"
                >
                  <span className="sr-only">Last Page</span>
                  <ChevronRight size={20} />
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NewArrivalsPage;
