import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, Search, Gift, Book as BookIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import debounce from 'lodash.debounce';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import { fetchBooks, Book } from '../data/books';
import { useCart } from "../context/cartContext";

// --- Cache for storing books by page, search, and sort ---
const dataCache = {
  current: {
    booksByPage: {} as Record<string, (Book & { originalPrice: number })[]>,
    totalBooks: {} as Record<string, number>,
  }
};

// --- Reusable Components ---
const StarRating = ({ rating, starSize = 10 }: { rating: number; starSize?: number }) => (
  <div className="flex items-center justify-center">
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

const BookCard = ({ book }: { book: Book & { originalPrice: number } }) => {
  const { addToCart } = useCart();
  const numericPrice = book.price;
  const numericOriginalPrice = book.originalPrice;
  const discount = Math.round(((numericOriginalPrice - numericPrice) / numericOriginalPrice) * 100);

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
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden transform hover:-translate-y-0.5">
      <div className="relative">
        <Link to={`/browse/${book.id}`} className="block">
          <img
            src={book.imageUrl || "https://via.placeholder.com/150"}
            alt={book.title}
            className="w-full h-24 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <div className="absolute top-1 right-1 bg-yellow-400 text-gray-900 text-2xs font-bold px-1 py-0.5 rounded-full">
          -{discount}%
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <Link to={`/browse/${book.id}`}>
            <button className="bg-white text-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-2xs sm:text-xs font-semibold opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-2 transition-all duration-300 hover:bg-gray-200">
              QUICK VIEW
            </button>
          </Link>
        </div>
      </div>
      <div className="p-1 sm:p-2 flex flex-col flex-grow items-center text-center">
        <h4 className="font-semibold text-2xs sm:text-xs text-gray-800 h-8 leading-4 mb-0.5 sm:mb-1 line-clamp-2">{book.title}</h4>
        <p className="text-2xs text-gray-500 mb-0.5 sm:mb-1">{book.author}</p>
        <div className="mb-0.5 sm:mb-1">
          <StarRating rating={book.rating || 0} starSize={10} />
        </div>
        <div className="flex items-center gap-1 mt-auto mb-1 sm:mb-2">
          <p className="text-sm sm:text-base font-bold text-red-600">£{numericPrice.toFixed(2)}</p>
          <p className="text-gray-400 line-through text-2xs sm:text-xs">£{numericOriginalPrice.toFixed(2)}</p>
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full bg-red-600 text-white font-bold py-0.5 sm:py-1 rounded-md hover:bg-red-700 transition-colors text-2xs sm:text-xs focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500"
        >
          ADD TO BASKET
        </button>
      </div>
    </div>
  );
};

// --- Skeleton Loader for BookCard ---
const BookCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden animate-pulse">
    <div className="w-full h-24 sm:h-32 bg-gray-200" />
    <div className="p-1 sm:p-2 flex flex-col flex-grow items-center text-center">
      <div className="w-3/4 h-3 bg-gray-200 mb-1 rounded" />
      <div className="w-1/2 h-2 bg-gray-200 mb-1 rounded" />
      <div className="flex gap-0.5 mb-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-2 h-2 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="flex items-center gap-1 mb-2">
        <div className="w-8 h-3 bg-gray-200 rounded" />
        <div className="w-6 h-2 bg-gray-200 rounded" />
      </div>
      <div className="w-full h-6 bg-gray-200 rounded-md" />
    </div>
  </div>
);

// --- Quiz Modal ---
const QuizModal = ({ isOpen, onClose, onComplete }: { isOpen: boolean; onClose: () => void; onComplete: (answers: string[]) => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const questions = [
    { question: "Which genre do you enjoy most?", options: ["Fiction", "Non-Fiction", "Fantasy", "Mystery"] },
    { question: "How often do you read books?", options: ["Daily", "Weekly", "Monthly", "Rarely"] },
    { question: "What's your favorite book format?", options: ["Hardcover", "Paperback", "E-book", "Audiobook"] },
  ];

  const handleAnswer = (answer: string) => {
    setAnswers([...answers, answer]);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete(answers.concat(answer));
      setCurrentQuestion(0);
      setAnswers([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Book Lover's Quiz</h2>
        <p className="mb-4">{questions[currentQuestion].question}</p>
        <div className="grid grid-cols-2 gap-2">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 text-gray-500 hover:text-gray-700">Close</button>
      </div>
    </div>
  );
};

// --- Survey Modal ---
const SurveyModal = ({ isOpen, onClose, onComplete }: { isOpen: boolean; onClose: () => void; onComplete: (feedback: string) => void }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (feedback.trim()) {
      onComplete(feedback);
      setFeedback('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Tell Us About Your Reading!</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your favorite book or reading experience..."
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={4}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={handleSubmit} className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors">Submit</button>
        </div>
      </div>
    </div>
  );
};

// --- Clearance Page ---
const ClearancePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('discount');
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [points, setPoints] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [clearanceBooks, setClearanceBooks] = useState<(Book & { originalPrice: number })[]>([]);
  const [totalBooks, setTotalBooks] = useState(1000000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const BOOKS_PER_PAGE = 125;
  const MAX_PAGE_BUTTONS = 7;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cacheKey = useRef<string>('');

  // Debounced search handler
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  // Generate cache key
  const generateCacheKey = (page: number, search: string, sort: string) => `${page}_${search}_${sort}`;

  // Pre-fetch adjacent pages
  const preFetchPages = async (page: number, search: string, sort: string) => {
    const pagesToFetch = [page + 1, page - 1].filter(p => p > 0 && p <= Math.ceil(totalBooks / BOOKS_PER_PAGE));
    for (const p of pagesToFetch) {
      const key = generateCacheKey(p, search, sort);
      if (!dataCache.current.booksByPage[key]) {
        try {
          const { books } = await fetchBooks({
            page: p,
            limit: BOOKS_PER_PAGE,
            filters: { 
              search: search || undefined,
              discountPercentage: { $gte: 30 }  // ← MATCHES HOMEPAGE
            },
            sort: sort === 'priceLowHigh' ? 'price' : sort === 'priceHighLow' ? 'price' : sort === 'rating' ? 'rating' : 'discountPercentage',
            order: sort === 'priceHighLow' ? 'desc' : sort === 'rating' ? 'desc' : 'desc',
          });
          const booksWithDiscounts = books.map(book => ({
            ...book,
            originalPrice: book.price * (1 + (book.discountPercentage || 0) / 100),
          }));
          dataCache.current.booksByPage[key] = booksWithDiscounts;
          const keys = Object.keys(dataCache.current.booksByPage);
          if (keys.length > 5) {
            delete dataCache.current.booksByPage[keys[0]];
            delete dataCache.current.totalBooks[keys[0]];
          }
        } catch (err) {
          console.error(`Failed to pre-fetch page ${p}:`, err);
        }
      }
    }
  };

  // Fetch clearance books
  useEffect(() => {
    const fetchClearanceBooks = async () => {
      const key = generateCacheKey(currentPage, searchTerm, sortBy);
      cacheKey.current = key;

      if (dataCache.current.booksByPage[key] && dataCache.current.totalBooks[key]) {
        setClearanceBooks(dataCache.current.booksByPage[key]);
        setTotalBooks(dataCache.current.totalBooks[key]);
        setIsLoading(false);
        preFetchPages(currentPage, searchTerm, sortBy);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const { books, total } = await fetchBooks({
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          filters: { 
            search: searchTerm || undefined,
            discountPercentage: { $gte: 30 }  // ← ONLY CHANGE: Real API filter
          },
          sort: sortBy === 'priceLowHigh' ? 'price' : sortBy === 'priceHighLow' ? 'price' : sortBy === 'rating' ? 'rating' : 'discountPercentage',
          order: sortBy === 'priceHighLow' ? 'desc' : sortBy === 'rating' ? 'desc' : 'desc',
        });
        const booksWithDiscounts = books.map(book => ({
          ...book,
          originalPrice: book.price * (1 + (book.discountPercentage || 0) / 100),
        }));
        setClearanceBooks(booksWithDiscounts);
        setTotalBooks(total);
        setIsLoading(false);

        dataCache.current.booksByPage[key] = booksWithDiscounts;
        dataCache.current.totalBooks[key] = total;
        const keys = Object.keys(dataCache.current.booksByPage);
        if (keys.length > 5) {
          delete dataCache.current.booksByPage[keys[0]];
          delete dataCache.current.totalBooks[keys[0]];
        }

        preFetchPages(currentPage, searchTerm, sortBy);
      } catch (err) {
        setError("Failed to load clearance books. Please try again.");
        setIsLoading(false);
        console.error("Failed to fetch clearance books:", err instanceof Error ? err.message : err);
      }
    };
    fetchClearanceBooks();
  }, [currentPage, searchTerm, sortBy]);

  // Sort by discount (client-side fallback)
  const filteredAndSortedBooks = useMemo(() => {
    return [...clearanceBooks].sort((a, b) => {
      if (sortBy === 'discount') {
        return (b.discountPercentage || 0) - (a.discountPercentage || 0);
      }
      return 0;
    });
  }, [clearanceBooks, sortBy]);

  const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE);

  const handleJumpPage = () => {
    const page = parseInt(jumpPage);
    if (!isNaN(page) && page > 0 && page <= totalPages) {
      setCurrentPage(page);
      setJumpPage('');
      gridRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      toast.error(`Please enter a valid page number (1–${totalPages})`);
    }
  };

  const getPageButtons = () => {
    const buttons: JSX.Element[] = [];
    const halfButtons = Math.floor(MAX_PAGE_BUTTONS / 2);
    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(totalPages, startPage + MAX_PAGE_BUTTONS - 1);
    if (endPage - startPage < MAX_PAGE_BUTTONS - 1) {
      startPage = Math.max(1, endPage - MAX_PAGE_BUTTONS + 1);
    }

    if (startPage > 1) {
      buttons.push(<button key={1} onClick={() => handlePageChange(1)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-red-100 transition-colors">1</button>);
      if (startPage > 2) buttons.push(<span key="start-ellipsis" className="px-4 py-2 text-gray-500">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${i === currentPage ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-red-100'} transition-colors`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push(<span key="end-ellipsis" className="px-4 py-2 text-gray-500">...</span>);
      buttons.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-red-100 transition-colors">{totalPages}</button>);
    }

    return buttons;
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      gridRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleQuizComplete = (answers: string[]) => {
    setPoints(points + 50);
    setShowQuiz(false);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 3000);
  };

  const handleSurveyComplete = (feedback: string) => {
    setPoints(points + 30);
    setShowSurvey(false);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 3000);
  };

  const GridItem = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * 8 + columnIndex;
    if (index >= filteredAndSortedBooks.length) return null;
    return (
      <div style={{ ...style, padding: '4px' }}>
        <BookCard book={filteredAndSortedBooks[index]} />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <TopBar />
        <div className="container mx-auto px-4 sm:px-8 py-16">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
            {[...Array(BOOKS_PER_PAGE)].map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <TopBar />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-red-600 to-red-800 text-white text-center py-12 md:py-10 px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Clearance Sale</h1>
          <p className="mt-4 text-lg md:text-xl text-red-100 max-w-2xl mx-auto">
            Unbeatable prices on your next favorite book. Grab these limited-time deals before they're gone!
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={() => setShowQuiz(true)} className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-md font-semibold hover:bg-yellow-500 transition-colors">
              <BookIcon size={20} /> Take Our Quiz!
            </button>
            <button onClick={() => setShowSurvey(true)} className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-md font-semibold hover:bg-yellow-500 transition-colors">
              <Gift size={20} /> Share Your Feedback
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-2/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 -mt-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author..."
                defaultValue={searchTerm}
                onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="discount">Sort by Best Discount</option>
              <option value="priceLowHigh">Sort by Price: Low to High</option>
              <option value="priceHighLow">Sort by Price: High to Low</option>
              <option value="rating">Sort by Highest Rating</option>
            </select>
          </div>

          <div className="mb-8 bg-yellow-100 p-4 rounded-lg flex items-center gap-2">
            <Gift size={24} className="text-yellow-600" />
            <p className="text-gray-800">
              Earn <strong>{points}</strong> points! Complete quizzes and surveys for a chance to win free books!
            </p>
          </div>

          {showReward && (
            <div className="mb-8 bg-green-100 p-4 rounded-lg flex items-center gap-2 animate-bounce">
              <Gift size={24} className="text-green-600" />
              <p className="text-gray-800">Congrats! You've earned points for a chance to win a free book!</p>
            </div>
          )}

          {filteredAndSortedBooks.length > 0 ? (
            <div ref={gridRef} style={{ height: '600px' }}>
              <AutoSizer>
                {({ height, width }) => (
                  <FixedSizeGrid
                    columnCount={8}
                    columnWidth={width / 8 - 8}
                    height={height}
                    rowCount={Math.ceil(filteredAndSortedBooks.length / 8)}
                    rowHeight={280}
                    width={width}
                    className="gap-2 sm:gap-3"
                  >
                    {GridItem}
                  </FixedSizeGrid>
                )}
              </AutoSizer>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-16">
              <h3 className="text-xl font-semibold">No Books Found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}

          {totalBooks > BOOKS_PER_PAGE && (
            <div className="flex flex-col items-center mt-10 space-y-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 text-gray-700 hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  Prev
                </button>
                {getPageButtons()}
                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 text-gray-700 hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  placeholder={`1–${totalPages}`}
                  className="w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
                <button onClick={handleJumpPage} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm">
                  Go
                </button>
              </div>
              <span className="text-gray-800 font-medium text-sm">
                Page {currentPage} of {totalPages} ({totalBooks.toLocaleString()} books)
              </span>
            </div>
          )}
        </div>
      </main>
      <QuizModal isOpen={showQuiz} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />
      <SurveyModal isOpen={showSurvey} onClose={() => setShowSurvey(false)} onComplete={handleSurveyComplete} />
      <Footer />
      <style>{`
        .text-2xs { font-size: 0.65rem; line-height: 0.9rem; }
        .animate-pulse { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-bounce { animation: bounce 0.3s ease-in-out 2; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
};

export default ClearancePage;