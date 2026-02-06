import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/footer';
import TopBar from '../components/Topbar';
import { fetchBooks, fetchCategories, Book } from '../data/books';
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

const BookCard = ({ id, img, title, author, price }: BookCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({ id, img, title, author, price, quantity: 1 });
    toast.success(`${title} added to your basket!`);
  };

  return (
    <div className="relative group flex-shrink-0 w-full max-w-[180px] text-center border border-gray-200 rounded-lg p-3 transition-shadow hover:shadow-lg">
      <div className="relative">
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="w-full h-60 object-cover mb-3 rounded"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = `https://picsum.photos/seed/fallback-${id}/300/450`;
          }}
        />
        <div className="absolute inset-x-0 top-0 h-60 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-100 flex items-center justify-center">
          <Link to={`/browse/${id}`}>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-semibold opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-4 transition-all duration-100">
              QUICK VIEW
            </button>
          </Link>
        </div>
      </div>
      <h3 className="font-semibold text-sm truncate">{title}</h3>
      <p className="text-gray-500 text-xs mb-2">{author}</p>
      <div className="flex items-center justify-center text-yellow-400 mb-2">
        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p className="text-blue-600 font-bold mb-3">{price}</p>
      <button
        onClick={handleAddToCart}
        className="bg-red-400 text-white px-4 py-2 rounded-full hover:bg-red-500 text-xs w-full transition-colors"
      >
        ADD TO BASKET
      </button>
    </div>
  );
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

  const placeholderImage = `https://source.unsplash.com/600x800/?${encodeURIComponent(
    name.toLowerCase().replace(/&/g, '').replace(/\s+/g, '-')
  )},book,library,reading&sig=${name}`;

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
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = `https://picsum.photos/seed/${name}/600/800`;
        }}
      />

      <div className="absolute inset-0 bg-black/90 group-hover:bg-black/70 transition-all duration-300" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-left">
        <h3 className="text-2xl font-bold leading-tight drop-shadow-lg">
          {name}
        </h3>
        <p className="text-lg opacity-90 mt-1 drop-shadow">
          {count.toLocaleString()} books
        </p>
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

const BookShelf = ({ title, fetchParams }: { title: string; fetchParams: any }) => {
  const [books, setBooks] = useState<BookCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const itemsPerPage = 5;
  const initialLimit = 100;

  const pageCache = useRef<Map<number, BookCardProps[]>>(new Map());

  const loadPage = useCallback(async (pageNum: number, append = false) => {
    if (pageCache.current.has(pageNum)) {
      const cached = pageCache.current.get(pageNum)!;
      setBooks(prev => append ? [...prev, ...cached] : cached);
      setCurrentPage(pageNum);
      return;
    }

    if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const { listings: fetchedBooks, meta } = await fetchBooks({
        page: pageNum,
        limit: itemsPerPage,
        ...fetchParams,
      });

      const formatted = formatBooksForHomepage(fetchedBooks || []);

      pageCache.current.set(pageNum, formatted);

      if (append) {
        setBooks(prev => [...prev, ...formatted]);
      } else {
        setBooks(formatted);
      }

      setTotalBooks(meta?.count || 0);
      setCurrentPage(pageNum);
    } catch (err) {
      setError(`Failed to load ${title.toLowerCase()}.`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchParams, title]);

  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { listings: fetchedBooks, meta } = await fetchBooks({
          page: 1,
          limit: initialLimit,
          ...fetchParams,
        });

        const formatted = formatBooksForHomepage(fetchedBooks || []);
        setBooks(formatted);
        setTotalBooks(meta?.count || formatted.length);

        for (let p = 1; p <= Math.ceil(formatted.length / itemsPerPage); p++) {
          const slice = formatted.slice((p - 1) * itemsPerPage, p * itemsPerPage);
          pageCache.current.set(p, slice);
        }
      } catch (err) {
        setError(`Failed to load ${title.toLowerCase()}.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [fetchParams]);

  useEffect(() => {
    if (currentPage < Math.ceil(books.length / itemsPerPage)) return;

    const nextPage = currentPage + 1;
    if (!pageCache.current.has(nextPage)) {
      fetchBooks({
        page: nextPage,
        limit: itemsPerPage,
        ...fetchParams,
      }).then(res => {
        const formatted = formatBooksForHomepage(res.listings || []);
        pageCache.current.set(nextPage, formatted);
      }).catch(() => {});
    }
  }, [currentPage, books.length, fetchParams]);

  const totalPages = Math.max(
    Math.ceil(books.length / itemsPerPage),
    Math.ceil(totalBooks / itemsPerPage)
  );

  const paginatedBooks = books.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <section className="py-8 animate-on-scroll">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 border-2 border-dashed rounded-xl w-full aspect-[3/4] animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 animate-on-scroll">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">{title}</h2>
        <p className="text-red-600 text-center">{error}</p>
      </section>
    );
  }

  return (
    <section className="py-8 animate-on-scroll">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800">{title}</h2>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const prev = Math.max(1, currentPage - 1);
              setCurrentPage(prev);
              if (!pageCache.current.has(prev)) loadPage(prev);
            }}
            disabled={currentPage === 1}
            className="p-3 bg-white border rounded-full shadow hover:shadow-md disabled:opacity-50 transition"
          >
            <ChevronLeft size={24} />
          </button>

          <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
            {totalBooks > 0 && ` • ${totalBooks.toLocaleString()} books`}
          </span>

          <button
            onClick={() => {
              const next = currentPage + 1;
              setCurrentPage(next);
              loadPage(next, true);
            }}
            disabled={currentPage >= totalPages}
            className="p-3 bg-white border rounded-full shadow hover:shadow-md disabled:opacity-50 transition"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {paginatedBooks.map(book => (
          <BookCard key={book.id} {...book} />
        ))}
      </div>

      {isLoadingMore && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading more...</p>
        </div>
      )}

      {books.length === 0 && (
        <p className="text-center text-gray-500 py-12 text-lg">
          No {title.toLowerCase()} available right now.
        </p>
      )}

      {books.length > 0 && (
        <p className="text-center text-sm text-gray-500 mt-8">
          Showing {paginatedBooks.length} of {books.length}+ books
          {totalBooks > books.length && ` • ${totalBooks.toLocaleString()} total`}
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
        const realCategoryNames = await fetchCategories();
    
        if (realCategoryNames.length === 0) {
          console.warn("No categories found");
          setCategories([]);
          return;
        }
    
        let totalBooks = 50000;
        try {
          const totalRes = await fetchBooks({ page: 1, limit: 1 });
          totalBooks = totalRes.meta?.count || totalBooks;
        } catch (err) {
          console.warn("Failed to fetch total books count", err);
        }
    
        const categoryData = await Promise.all(
          realCategoryNames.map(async (cat: any) => {
            try {
              const { meta } = await fetchBooks({
                page: 1,
                limit: 1,
                category: cat.name,
              });
              return {
                name: cat.name,
                slug: cat.slug || cat.name
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, ''),
                count: meta?.count || 0,
              };
            } catch (err) {
              console.warn(`Failed to count books for category "${cat.name}"`, err);
              return null;
            }
          })
        );
    
        const validCategories = categoryData
          .filter((c): c is NonNullable<typeof c> => c !== null && c.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 18);
    
        const finalList = [
          { name: "All Books", slug: "all", count: totalBooks },
          ...validCategories,
        ];
    
        setCategories(finalList);
        console.log("REAL categories loaded:", finalList.map(c => `${c.name} (${c.count})`));
      } catch (err) {
        console.error("Failed to load categories", err);
        setCategories([
          { name: "All Books", slug: "all", count: 48500 },
          { name: "Fiction", slug: "fiction", count: 18200 },
          { name: "Children's Books", slug: "childrens-books", count: 9800 },
        ]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []); // ← This closes the useEffect correctly

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
  
    recentlyViewed: {
      shelf: "recentlyViewed",
      label: "Recently Viewed",
      sort: "lastViewedAt",
      order: "desc",
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
            <BookShelf title="Recently Viewed" fetchParams={shelfFetchParams.recentlyViewed} />
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