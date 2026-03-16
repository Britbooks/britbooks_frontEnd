import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/footer';
import TopBar from '../components/Topbar';
import { fetchBooks, fetchCategories, Book } from '../data/books';
import { useRecentlyViewed } from '../context/viewManager';
import BookCard from "../components/BookCard";


import { useCart } from '../context/cartContext';
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { MD5 } from "crypto-js";

// Interface for BookCard props
interface BookCardProps {
  id: string;
  img: string;
  title: string;
  author: string;
  price: string;
}


interface BookShelfProps {
  title: string;
  fetchParams?: any;
}

// Convert API books to homepage format
const generatePlaceholderImage = (book: {
  title: string;
  isbn?: string;
  genre?: string;
}) => {
  const seed = book.isbn || book.title;
  const hash = MD5(seed).toString().slice(0, 8);
  return `https://picsum.photos/seed/book-${hash}/300/450`;
};

const formatBooksForHomepage = (books: Book[]): BookCardProps[] => {
  return books.map(book => ({
    id: book.id,
    img: book.imageUrl?.trim() || generatePlaceholderImage(book),
    title: book.title,
    author: book.author,
    price: `£${book.price.toFixed(2)}`,
  }));
};

// --- Reusable Components ---
const getCategoryPlaceholderImage = (categoryName: string) => {
  switch (categoryName.toLowerCase()) {
    case "children's books":
      return "http://choicetextileimages.blob.core.windows.net/img-1/stand_1004118_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D";
    case "fiction":
      return "http://choicetextileimages.blob.core.windows.net/img-1/stand_1547728_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D";
    case "non-fiction":
      return "http://choicetextileimages.blob.core.windows.net/img-1/stand_1022627_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D";
    case "biography & memoir":
      return "http://choicetextileimages.blob.core.windows.net/img-1/stand_423514_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D";
    default:
      return `https://picsum.photos/seed/${encodeURIComponent(categoryName)}/600/800`;
  }
};



const CategoryCard = ({ 
  name, 
  count, 
  onOpenModal 
}: { 
  name: string; 
  count: number; 
  onOpenModal: (category: string) => void;
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const placeholderImage = getCategoryPlaceholderImage(name);

  return (
    <motion.button
      ref={ref}
      onClick={() => onOpenModal(name)}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.07 }}
      className="flex-shrink-0 w-40 h-40 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all relative group cursor-pointer"
    >
      <img 
        src={placeholderImage}
        alt={name}
        className="w-full h-full object-cover opacity-60"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-black/90 group-hover:bg-black/70 transition-all duration-300" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-left">
        <h3 className="text-2xl font-bold leading-tight drop-shadow-lg">
          {name}
        </h3>
     
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 
        group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
        <span className="text-4xl font-bold tracking-wider text-white drop-shadow-2xl">
          EXPLORE →
        </span>
      </div>
    </motion.button>
  );
};

const BookShelf: React.FC<BookShelfProps> = ({ title, fetchParams }) => {
  const [books, setBooks] = useState<BookCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const pageCache = useRef<Map<number, BookCardProps[]>>(new Map());

  // Responsive items per page
  const getItemsPerPage = () => {
    if (typeof window === 'undefined') return 5;
    return window.innerWidth < 640 ? 2 : 5;
  };

  useEffect(() => {
    const handleResize = () => {
      const newItems = getItemsPerPage();
      if (newItems !== itemsPerPage) {
        setItemsPerPage(newItems);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // run once on mount

    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]);

  // Reset when itemsPerPage or fetchParams change
  useEffect(() => {
    pageCache.current.clear();
    setCurrentPage(1);
    setBooks([]);
    setTotalBooks(0);
    setError(null);
    loadPage(1);
  }, [itemsPerPage, fetchParams]);

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (pageCache.current.has(pageNum)) {
        setBooks(pageCache.current.get(pageNum)!);
        setCurrentPage(pageNum);
        return;
      }

      const setLoading = pageNum === 1 ? setIsLoading : setIsLoadingMore;
      setLoading(true);

      try {
        const { listings: fetchedBooks, meta } = await fetchBooks({
          page: pageNum,
          limit: itemsPerPage,
          ...fetchParams,
        });

        const formatted = formatBooksForHomepage(fetchedBooks || []);

        pageCache.current.set(pageNum, formatted);

        setBooks(formatted);
        setTotalBooks(meta?.count || 0);
        setCurrentPage(pageNum);
        setError(null);
      } catch (err) {
        console.error('Failed to load books:', err);
        setError(`Failed to load ${title.toLowerCase()}. Please try again.`);
      } finally {
        setLoading(false);
      }
    },
    [fetchParams, itemsPerPage, title]
  );

  const totalPages = Math.ceil(totalBooks / itemsPerPage) || 1;

  // Fill with placeholders to maintain grid shape
  const displayedBooks = [...books];
  while (displayedBooks.length < itemsPerPage && !isLoading && !error) {
    displayedBooks.push(null as any);
  }

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────

  if (isLoading && currentPage === 1) {
    return (
      <section className="py-8 animate-on-scroll">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">{title}</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          {[...Array(itemsPerPage)].map((_, i) => (
            <div
              key={i}
              className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-gray-300 to-gray-100 animate-pulse shadow-sm"
            >
              {/* Spooky book cover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-300/40 via-indigo-300/30 to-blue-300/20" />

              {/* Spine */}
              <div className="absolute left-1/2 top-1/5 -translate-x-1/2 w-4 h-3/5 bg-gray-500/70 rounded-full" />

              {/* Tiny skeleton arms/ribs */}
              <div className="absolute left-[25%] top-[45%] w-2.5 h-4 bg-gray-600/60 rounded-full" />
              <div className="absolute right-[25%] top-[45%] w-2.5 h-4 bg-gray-600/60 rounded-full" />

              {/* Skull eyes */}
              <div className="absolute top-[18%] left-1/2 -translate-x-1/2 flex gap-5">
                <div className="w-4 h-4 bg-black/50 rounded-full" />
                <div className="w-4 h-4 bg-black/50 rounded-full" />
              </div>

              {/* Title placeholder lines */}
              <div className="absolute bottom-8 left-5 right-5 space-y-2.5">
                <div className="h-3.5 bg-gray-500/60 rounded w-4/5" />
                <div className="h-3 bg-gray-400/50 rounded w-2/3" />
              </div>

              {/* Floating "boo!" */}
              <div className="absolute -top-2 -right-2 text-5xl font-black text-white/25 rotate-12 animate-bounce-slow pointer-events-none">
                boo!
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 animate-on-scroll">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">{title}</h2>
        <p className="text-red-600 text-center font-medium animate-pulse">{error}</p>
      </section>
    );
  }

  return (
    <section className="py-8 animate-on-scroll">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-blue-800 transition-all duration-500">
          {title}
        </h2>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <button
            onClick={() => currentPage > 1 && loadPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoadingMore}
            className={`
              p-3 bg-white border border-gray-300 rounded-full shadow-sm 
              hover:shadow-lg hover:scale-110 active:scale-95 
              disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed
              transition-all duration-300
            `}
            aria-label="Previous page"
          >
            <ChevronLeft size={24} className="transition-transform duration-300" />
          </button>

          <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
            Page {currentPage} of {totalPages}
            {totalBooks > 0 && ` • ${totalBooks.toLocaleString()} books`}
          </span>

          <button
            onClick={() => currentPage < totalPages && loadPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoadingMore}
            className={`
              p-3 bg-white border border-gray-300 rounded-full shadow-sm 
              hover:shadow-lg hover:scale-110 active:scale-95 
              disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed
              transition-all duration-300
            `}
            aria-label="Next page"
          >
            <ChevronRight size={24} className="transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Main books grid */}
      <div
        className={`
          grid grid-cols-2 gap-6 md:grid-cols-5
          ${isLoadingMore ? 'opacity-70' : 'opacity-100'}
          transition-opacity duration-500
        `}
      >
        {displayedBooks.map((book, idx) =>
          book ? (
            <div
              key={book.id}
              className={`
                transform transition-all duration-600 ease-out
                ${isLoadingMore ? 'opacity-0 translate-y-10 scale-95' : 'opacity-100 translate-y-0 scale-100'}
              `}
              style={{ transitionDelay: `${idx * 90}ms` }}
            >
              <BookCard {...book} />
            </div>
          ) : (
            <div
              key={`placeholder-${idx}`}
              className="w-full aspect-[3/4] rounded-xl bg-gray-50 border border-dashed border-gray-300 opacity-40"
            />
          )
        )}
      </div>

      {/* Loading more – spooky skeletons again */}
      {isLoadingMore && (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5 mt-10">
          {[...Array(itemsPerPage)].map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-gray-300 to-gray-100 animate-pulse shadow-sm"
              style={{ animationDelay: `${idx * 140}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-300/35 via-indigo-300/25 to-blue-300/15" />
              <div className="absolute left-1/2 top-1/5 -translate-x-1/2 w-4 h-3/5 bg-gray-500/70 rounded-full" />
              <div className="absolute left-[25%] top-[45%] w-2.5 h-4 bg-gray-600/60 rounded-full" />
              <div className="absolute right-[25%] top-[45%] w-2.5 h-4 bg-gray-600/60 rounded-full" />
              <div className="absolute top-[18%] left-1/2 -translate-x-1/2 flex gap-5">
                <div className="w-4 h-4 bg-black/50 rounded-full" />
                <div className="w-4 h-4 bg-black/50 rounded-full" />
              </div>
              <div className="absolute bottom-8 left-5 right-5 space-y-2.5">
                <div className="h-3.5 bg-gray-500/60 rounded w-4/5" />
                <div className="h-3 bg-gray-400/50 rounded w-2/3" />
              </div>
              <div className="absolute -top-2 -right-2 text-5xl font-black text-white/25 rotate-12 animate-bounce-slow pointer-events-none">
                boo!
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && books.length === 0 && !error && (
        <p className="text-center text-gray-500 py-16 text-lg font-medium animate-fade-in">
          No {title.toLowerCase()} available right now.
        </p>
      )}

      {/* Summary */}
      {books.length > 0 && !isLoadingMore && (
        <p className="text-center text-sm text-gray-500 mt-10 animate-slide-up">
          Showing {books.length} of {totalBooks.toLocaleString()} books
        </p>
      )}
    </section>
  );
};
const RecentlyViewedShelf = () => {
  const { recentlyViewed } = useRecentlyViewed();
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(recentlyViewed.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const displayedBooks = recentlyViewed.slice(start, start + itemsPerPage);

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="py-8 animate-on-scroll">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800">Recently Viewed</h2>

        {totalPages > 1 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white border rounded-full shadow hover:shadow-md disabled:opacity-50 transition"
            >
              <ChevronLeft size={24} />
            </button>

            <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-3 bg-white border rounded-full shadow hover:shadow-md disabled:opacity-50 transition"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {displayedBooks.map(book => (
          <BookCard key={book.id} {...book} />
        ))}
      </div>

      {displayedBooks.length === 0 && recentlyViewed.length > 0 && (
        <p className="text-center text-gray-500 py-12 text-lg">
          No books to show on this page
        </p>
      )}
    </section>
  );
};

// --- Main Homepage Component ---

const Homepage = () => {
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [currentCategorySlug, setCurrentCategorySlug] = useState('');
  const [modalBooks, setModalBooks] = useState<BookCardProps[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hoveredMainCat, setHoveredMainCat] = useState<CategoryNode | null>(null);
  const { recentlyViewed } = useRecentlyViewed();


  const BOOKS_PER_PAGE = 24;
  const observer = useRef<IntersectionObserver | null>(null);

  const openCategoryModal = async (category: string) => {
    setSelectedCategory(category);
    setModalOpen(true);
    setModalLoading(true);
    setModalBooks([]);
    // No need for page / hasMore in preview mode
  
    try {
      const reqBody = {
        page: 1,
        limit: 12,           // ← Changed: only 12 books for preview
        category: category === "All Books" ? undefined : category,
        sort: "createdAt",
        order: "desc",
      };
  
      const response = await fetchBooks(reqBody);
      const books = response.listings || [];
      const formatted = formatBooksForHomepage(books);
  
      setModalBooks(formatted);
      console.log(`Preview loaded ${formatted.length} books for "${category}"`);
    } catch (err) {
      console.error("Category preview fetch failed:", err);
      toast.error("Could not load category preview");
    } finally {
      setModalLoading(false);
    }
  };

  const loadMoreBooks = useCallback(async () => {
    if (isLoadingMore || !hasMoreBooks || !selectedCategory) return;
    setIsLoadingMore(true);
  
    try {
      const reqBody = {
        page: modalPage + 1,
        limit: BOOKS_PER_PAGE,
        category: selectedCategory === "All Books" ? undefined : selectedCategory,
        sort: "createdAt",
        order: "desc",
      };
  
      const response = await fetchBooks(reqBody);
  
      const newBooks = response.listings || [];
      const formatted = formatBooksForHomepage(newBooks);
  
      setModalBooks(prev => [...prev, ...formatted]);
      setModalPage(p => p + 1);
      setHasMoreBooks(newBooks.length === BOOKS_PER_PAGE);
    } catch (err) {
      console.error("Load more failed:", err);
      toast.error("Failed to load more books");
    } finally {
      setIsLoadingMore(false);
    }
  }, [modalPage, selectedCategory, isLoadingMore, hasMoreBooks]);
  
  const lastBookRef = useCallback((node: HTMLDivElement | null) => {
    if (modalLoading || isLoadingMore || !hasMoreBooks) {
      if (observer.current) observer.current.disconnect();
      return;
    }
  
    if (observer.current) observer.current.disconnect();
  
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreBooks && !isLoadingMore) {
          loadMoreBooks();
        }
      },
      { 
        root: document.querySelector('.modal-content-scroll'),
        rootMargin: "100px",
        threshold: 0.1
      }
    );
  
    if (node) observer.current.observe(node);
  }, [modalLoading, isLoadingMore, hasMoreBooks, loadMoreBooks]);
  
  const goToPage = async (page: number) => {
    if (page === modalPage || isLoadingMore || !selectedCategory) return;
  
    setIsLoadingMore(true);
  
    try {
      const reqBody = {
        page,
        limit: BOOKS_PER_PAGE,
        category: selectedCategory === "All Books" ? undefined : selectedCategory,
        sort: "createdAt",
        order: "desc",
      };
  
      const response = await fetchBooks(reqBody);
  
      const books = response.listings || [];
      setModalBooks(formatBooksForHomepage(books));
  
      setModalPage(page);
      setHasMoreBooks(books.length === BOOKS_PER_PAGE);
    } catch (err) {
      console.error("Go to page failed:", err);
      toast.error("Failed to load page");
    } finally {
      setIsLoadingMore(false);
    }
  };
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
  
      try {
        const realCategories = await fetchCategories();
  
        if (!realCategories.length) {
          setCategories([]);
          return;
        }
  
        const totalBooks = realCategories.reduce(
          (sum, cat) => sum + (cat.count || 0),
          0
        );
  
        const sorted = realCategories
          .filter(cat => cat.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 18);
  
        setCategories([
          { name: "All Books", slug: "all", count: totalBooks },
          ...sorted,
        ]);
  
      } catch (err) {
        console.error("Failed to load categories", err);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
  
    loadCategories();
  }, []);
 // ← This closes the useEffect correctly

  // ── Now handleScroll comes AFTER the useEffect ─────────────────────────────
  const handleScroll = (direction: 'left' | 'right') => {
    if (categoryRef.current) {
      const scrollAmount = 160;
      categoryRef.current.scrollLeft += direction === 'right' ? scrollAmount : -scrollAmount;
    }
  };

  const CategoryModal = () => {
    if (!modalOpen) return null;
  
    const categorySlug =
      selectedCategory === "All Books"
        ? "all"
        : selectedCategory
            ?.toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || "";
  
    return (
      // Overlay – does NOT scroll, captures clicks to close
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-10 sm:pt-16 px-4 overflow-y-auto"
        onClick={() => setModalOpen(false)}
      >
        {/* Modal card */}
        <div
          className="
            bg-white rounded-2xl shadow-2xl
            w-full max-w-4xl
            max-h-[85vh]
            flex flex-col
            my-4 sm:my-8               // breathing room top/bottom
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header – fixed / non-scrolling */}
          <div className="shrink-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative rounded-t-2xl">
            <div className="px-5 py-5 sm:py-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {selectedCategory}
              </h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">
                Quality used books • Quick preview
              </p>
  
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/25 hover:bg-white/40 rounded-full p-2 transition"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
  
          {/* Scrollable books/content area */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-50">
            <div className="p-5 sm:p-6">
              {modalLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-200 rounded-xl aspect-[3/4] animate-pulse shadow-sm"
                    />
                  ))}
                </div>
              ) : modalBooks.length > 0 ? (
                <div className="space-y-8 sm:space-y-10">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6">
                    {modalBooks.slice(0, 12).map((book) => (
                      <BookCard key={book.id} {...book} />
                    ))}
                  </div>
  
                  <div className="text-center pb-4 sm:pb-6">
  <Link
    to={`/category?category=${encodeURIComponent(selectedCategory || '')}`}
    onClick={() => setModalOpen(false)}
    className="
      inline-block px-7 sm:px-8 py-3 
      bg-gradient-to-r from-purple-600 to-pink-600 
      text-white text-base font-bold 
      rounded-full hover:shadow-xl hover:scale-105 
      transition duration-300
    "
  >
    View Full Collection →
  </Link>
</div>
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                    Nothing here yet in {selectedCategory}
                  </h3>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-8 py-3 bg-gray-800 text-white text-base font-bold rounded-full hover:bg-gray-900 transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
  
          {/* Mobile-only bottom bar */}
          <div className="shrink-0 p-4 bg-white border-t md:hidden">
            <button
              onClick={() => setModalOpen(false)}
              className="w-full py-3.5 bg-black text-white text-base font-bold rounded-xl hover:bg-gray-900 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  const shelfFetchParams = {
    newArrivals: {
      shelf: "newArrivals",
      label: "New Arrivals",
      sort: "createdAt",
      order: "desc",
      filters: { stock: { $gt: 0 } },
    },
  
    popularBooks: {
      shelf: "popularBooks",
      label: "Popular Books",
      sort: "rating",
      order: "desc",
      filters: {},
    },
  
    bestSellers: {
      shelf: "bestSellers",
      label: "Best Sellers",
      sort: "salesCount",
      order: "desc",
      filters: { stock: { $gt: 0 } },
    },
  
    childrensBooks: {
      shelf: "childrensBooks",
      label: "Children's Books",
      sort: "createdAt",
      order: "desc",
      filters: { category: "Children's Books" },
    },
  
    clearanceItems: {
      shelf: "clearanceItems",
      label: "Clearance Items",
      sort: "discount.value",
      order: "desc",
      filters: {
        "discount.isActive": true,
        "discount.value": { $gte: 10 },
      },
    },
  
   
  };
  
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #9ca3af;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }

        .category-section {
          background: linear-gradient(45deg, #1e40af, #3b82f6);
          padding: 1rem 0;
          color: white;
        }

        .category-section h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .category-card {
          width: 10rem;
          height: 10rem;
          margin: 0 0.5rem;
          overflow: hidden;
          position: relative;
        }

        .category-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.7;
        }

        .category-card span {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.875rem;
          font-weight: 600;
        }
      `}</style>
      <div className="bg-white">
        <TopBar />
        
        <main className="container mx-auto px-4 sm:px-8">
          {/* Hero Section */}
          <section className="sm:block hidden relative text-white my-4 sm:my-8 py-12 sm:py-20 px-4 sm:px-12 rounded-lg overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
            >
              <source
                src="https://media.istockphoto.com/id/1302273587/video/laptop-on-a-table-at-the-end-of-an-aisle-of-books-in-a-library.mp4?s=mp4-640x640-is&k=20&c=HERTtG3ibKF0poAWZ8NrgIPbph1408m0jYwVOhS8mIM="
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-black opacity-50 rounded-lg"></div>
            <div className="relative z-10 text-center sm:text-left">
              <div className="animate-on-scroll">
                <h1 className="text-2xl sm:text-5xl font-bold leading-tight">
                  Best Used Book Platform <br className="block sm:hidden" /> in the UK
                </h1>
                <p className="text-gray-300 mt-2 text-sm sm:text-base">
                  Discover thousands of quality pre-owned books at unbeatable prices.
                </p>
              </div>
            </div>
          </section>

          {/* Welcome Section */}
          <div className="max-w-7xl mx-auto py-9 sm:py-1 px-4 sm:px-69 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-16">
            <div className="w-full sm:w-1/2 flex justify-center sm:justify-start">
              <img
                src="https://media.istockphoto.com/id/185266132/photo/portrait-of-a-cute-teenage-girl.jpg?s=612x612&w=0&k=20&c=7oyxKo75xTGO_k5v2zsCBeu7GWG-7eryUyyu42o8Ra0="
                alt="Woman Reading"
                className="w-full max-w-4xl sm:max-w-3xl object-contain"
              />
            </div>
            <div className="w-full sm:w-1/2 sm:py-10">
              <h2 className="text-3xl sm:text-5xl font-light leading-tight mb-4 sm:mb-6">
                Welcome to <span className="font-bold text-blue-900">brit</span>
                <span className="font-bold text-red-600">books </span>
                <br className="block sm:hidden" />
                <span className="font-bold text-gray-900">online books</span> super store
              </h2>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                the UK’s most trusted platform for high-quality secondhand books. Our mission is simple: to make reading more affordable, sustainable, and accessible to everyone. 
                Whether you’re a curious student hunting for academic texts, a parent looking for bedtime stories, or an avid reader building your personal library, we’ve got shelves filled just for you.
              </p>
            </div>
          </div>

          {/* Shop by Category Section */}
          <section className="category-section animate-on-scroll">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              <h3 className="text-white">Shop by Category</h3>
              <div className="relative flex items-center">
                <button onClick={() => handleScroll('left')} className="absolute left-0 z-10 p-2 bg-white bg-opacity-50 rounded-full hover:bg-opacity-75 transition-all disabled:opacity-50" disabled={!categoryRef.current || categoryRef.current.scrollLeft <= 0}>
                  <ChevronLeft size={24} />
                </button>
                <div ref={categoryRef} className="flex overflow-x-auto space-x-4 py-4 scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
                  {categories.length === 0 ? (
                    Array.from({ length: 7 }).map((_, i) => (
                      <div key={`skeleton-${i}`} className="flex-shrink-0 w-40 h-40 bg-gray-700 rounded-lg overflow-hidden shadow-md animate-pulse">
                        <div className="w-full h-full bg-gray-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-6 bg-gray-500 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    categories.map((category) => (
                      <CategoryCard 
                        key={category.name}
                        name={category.name}
                        count={category.count}
                        onOpenModal={openCategoryModal}
                      />
                    ))
                  )}
                  <Link to="/category" className="flex-shrink-0 w-40 h-40 bg-blue-700 text-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span className="text-sm font-semibold">Show All Categories</span>
                    </div>
                  </Link>
                </div>
                <button onClick={() => handleScroll('right')} className="absolute right-0 z-10 p-2 bg-white bg-opacity-50 rounded-full hover:bg-opacity-75 transition-all disabled:opacity-50" disabled={!categoryRef.current || categoryRef.current.scrollLeft >= categoryRef.current.scrollWidth - categoryRef.current.clientWidth}>
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </section>

          <div className="w-full mx-auto px-4 sm:px-8">
            {/* Book Shelves */}
            <BookShelf title="New Arrivals" fetchParams={shelfFetchParams.newArrivals} />
            <BookShelf title="Popular Books" fetchParams={shelfFetchParams.popularBooks} />
            <div className="py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { title: "Top 10 Best Sellers", image: "https://cdn-icons-png.flaticon.com/512/2331/2331970.png", link: "/bestsellers" },
                { title: "Order now and get 10% discount for limited time", image: "https://cdn-icons-png.flaticon.com/512/1042/1042306.png", link: "/clearance" },
                { title: "Special discount for students", image: "https://cdn-icons-png.flaticon.com/512/3036/3036996.png", link: "/special-offers" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="relative h-48 sm:h-56 rounded-lg overflow-hidden text-white flex flex-col items-center justify-center text-center"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#00000088',
                  }}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                  <div className="relative z-10 p-4">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">{item.title}</h3>
                    <Link to={item.link}>
                      <button className="bg-white text-black px-4 sm:px-6 py-2 rounded-full hover:bg-gray-200 transition text-sm sm:text-base">
                        SHOP NOW!
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <BookShelf title="Best Sellers" fetchParams={shelfFetchParams.bestSellers} />
            <BookShelf title="Children's Books" fetchParams={shelfFetchParams.childrensBooks} />
            <BookShelf title="Clearance Items" fetchParams={shelfFetchParams.clearanceItems} />
            <RecentlyViewedShelf />

          
          </div>

          {/* Promotional Banners */}
          <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { title: "Free Shipping", subtitle: "Orders Over £100", image: "https://media.istockphoto.com/id/1309243817/vector/fast-delivery-truck-with-motion-lines-online-delivery-express-delivery-quick-move-fast.jpg?s=612x612&w=0&k=20&c=l2JlE6VQ4uRS6jABMS558puDgTyhEJW0bSiPhbBgXMc=" },
              { title: "Money Guarantee", subtitle: "30 Day Money Back Guarantee", image: "https://media.istockphoto.com/id/1129401378/photo/a-hand-with-protective-shield-containing-a-currency-unit-inside.jpg?s=612x612&w=0&k=20&c=R3Y_IIp64RvH7g7YmDDirCwiu3QbFRE1KDV8X-R1peo=" },
              { title: "Secure Payment", subtitle: "All Cards Accepted", image: "https://media.istockphoto.com/id/2078490118/photo/businessman-using-laptop-to-online-payment-banking-and-online-shopping-financial-transaction.jpg?s=612x612&w=0&k=20&c=1x2G24ANsWxG4YW6ZaoeFPEzjmKFE4ZlohVQSwbjGj8=" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative h-48 sm:h-56 rounded-lg overflow-hidden text-white flex items-center justify-center text-center"
                style={{
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <div className="relative z-10 p-4">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </main>

        <Footer />
      </div>
      <CategoryModal /> 
    </>
  );
};

export default Homepage;