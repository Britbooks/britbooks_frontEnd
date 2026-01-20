"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { MD5 } from "crypto-js";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import {
  Heart,
  Facebook,
  Twitter,
  Instagram,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useCart } from "../context/cartContext";
import { Book, fetchBooks } from "../data/books";
import { generatePlaceholderImage } from "../data/books";

// --- SVG ICONS ---
const StarIcon = ({ filled, rating }: { filled: boolean; rating: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "#facc15" : "#d1d5db"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={filled ? "text-yellow-400" : "text-gray-300"}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// --- Book Card Component ---
const BookCard = ({ id, imageUrl, title, author, price, rating, isbn, genre }: Book & { price: string }) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const numericPrice = typeof price === "string" ? parseFloat(price.replace("£", "")) : price;

  const fallbackImage = "https://placehold.co/300x450?text=Book+Cover";
  const displayImage = imageError ? fallbackImage : imageUrl;

  const handleAddToCart = () => {
    addToCart({
      id,
      imageUrl: displayImage,
      title,
      author,
      price: `£${numericPrice.toFixed(2)}`,
      quantity: 1,
    });
    toast.success(`${title} added to your basket!`);
  };

  return (
    <div className="group relative flex-shrink-0 w-[180px] text-left">
      <div className="relative">
        <Link to={`/browse/${id}`}>
          <img
            src={displayImage}
            alt={title}
            className="w-full h-48 object-cover mb-3 rounded-md transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </Link>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <Link to={`/browse/${id}`}>
            <button className="bg-white text-gray-900 px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-4 transition-all duration-300 hover:bg-gray-200">
              QUICK VIEW
            </button>
          </Link>
        </div>
      </div>

      {/* Text container with more generous padding */}
      <div className="px-2 pb-3 pt-1 flex flex-col items-start">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 leading-tight">{title}</h3>
        <p className="text-gray-500 text-xs mb-2">{author}</p>
        <div className="flex items-center text-gray-300 mb-3">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} filled={i < Math.round(rating || 0)} rating={rating || 0} />
          ))}
        </div>
        <p className="text-lg font-bold text-gray-900 mb-3">£{numericPrice.toFixed(2)}</p>
        <button
          onClick={handleAddToCart}
          className="bg-red-600 text-white font-medium px-3 py-1.5 rounded-md text-xs w-full transition-colors hover:bg-red-700"
        >
          ADD TO BASKET
        </button>
      </div>
    </div>
  );
};
// --- BookShelf Component with Pagination ---
const BookShelf = ({ title, fetchParams, currentBookId }: { title: string; fetchParams: any; currentBookId: string }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 5;
  const maxPages = 20;

  useEffect(() => {
    const fetchShelfBooks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { books: fetchedBooks } = await fetchBooks({
          page: 1,
          limit: 10,
          ...fetchParams,
        });
        const filteredBooks = fetchedBooks.filter((book) => book.id !== currentBookId);
        setBooks(filteredBooks);
        setIsLoading(false);
      } catch (err) {
        setError(`Failed to load ${title.toLowerCase()}. Please try again.`);
        setIsLoading(false);
        console.error(`❌ Failed to fetch ${title}:`, err instanceof Error ? err.message : err);
      }
    };
    fetchShelfBooks();
  }, [fetchParams, title, currentBookId]);

  const totalPages = Math.min(Math.ceil(books.length / booksPerPage), maxPages);
  const startIndex = (currentPage - 1) * booksPerPage;
  const paginatedBooks = books.slice(startIndex, startIndex + booksPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (isLoading) {
    return (
      <section className="py-6">
        <h2 className="text-xl font-bold text-blue-800 mb-4">{title}</h2>
        <p className="text-gray-500 text-center">Loading {title.toLowerCase()}...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6">
        <h2 className="text-xl font-bold text-blue-800 mb-4">{title}</h2>
        <p className="text-red-500 text-center">{error}</p>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-800">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {paginatedBooks.map((book) => (
          <BookCard
            key={book.id}
            {...book}
            price={`£${book.price.toFixed(2)}`}
          />
        ))}
      </div>
      {paginatedBooks.length === 0 && (
        <p className="text-center text-gray-500 py-4">No {title.toLowerCase()} available.</p>
      )}
    </section>
  );
};

// --- Main Component ---
const BrowseCategoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "info" | "reviews">("details");

  const previousCategory = (location.state as { category?: string })?.category || "Browse";
  const FALLBACK_IMAGE = "https://placehold.co/300x450?text=Book+Cover";

  useEffect(() => {
    const findBookById = async () => {
      setIsLoading(true);    
      setError(null);
      try {
        const response = await axios.get(
          `https://britbooks-api-production.up.railway.app/api/market/${id}`
        );
  
        if (!response.data.success || !response.data.listing) {
          throw new Error("Book not found");
        }
  
        const data = response.data.listing;
  
        // Generate the SAME placeholder as in fetchBooks()
        const placeholderImage = generatePlaceholderImage({
          title: data.title || "book",
          isbn: data.isbn || data.title || "unknown",
          category: data.category || "default",   // ← fixed: use category
        });
  
        const foundBook: Book = {
          id: String(data._id || data.id),
          title: data.title || "Untitled Book",
          author: data.author || "Unknown Author",
          price: data.price || 0,
          imageUrl: placeholderImage,
          category: data.category || "General",   // ← fixed: use category consistently
          condition: data.condition || "Good",
          description: data.description || data.notes || "",
          stock: data.stock ?? 1,
          rating: data.rating || 4.5,
          isbn: data.isbn || "",
          pages: data.pages || 300,
          releaseDate: data.listedAt || "",
        };
  
        setBook(foundBook);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load book details.");
        setIsLoading(false);
        console.error("Failed to fetch book:", err);
        toast.error("Book not found");
      }
    };
  
    findBookById();
  }, [id]);

  const handleAddToCart = () => {
    if (book) {
      addToCart({
        id: book.id,
        imageUrl: book.imageUrl,
        title: book.title,
        author: book.author,
        price: `£${book.price.toFixed(2)}`,
        quantity: quantity,
      });
      toast.success(`${quantity} x ${book.title} added to your basket!`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <TopBar />
        <div className="container mx-auto px-4 sm:px-8 py-8 text-center">
          <p className="text-gray-500 text-lg">Loading book details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <TopBar />
        <div className="container mx-auto px-4 sm:px-8 py-8 text-center">
          <p className="text-red-500 text-lg">{error || "Book not found. It may not be available."}</p>
          <button
            onClick={() => navigate("/category")}
            className="text-blue-600 hover:underline mt-4"
          >
            Back to Browse
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <TopBar />
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center justify-end text-sm font-medium">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600 transition">
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                  Home
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </li>
              <li>
                <Link
                  to={`/category?category=${encodeURIComponent(book?.category || "Books")}`}   // ← fixed
                  className="text-gray-700 hover:text-blue-600 capitalize font-medium transition"
                >
                  {book?.category || "Books"}   
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </li>
              <li className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-md lg:max-w-none">
                {book?.title}
              </li>
            </ol>
          </nav>
        </div>
      </div>
      <main className="container mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            {book.imageUrl === FALLBACK_IMAGE ? (
              <div className="w-full h-80 bg-gray-200 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-500 text-center p-4">
                <div>
                  <div className="text-4xl font-bold mb-2">No Cover</div>
                  <div className="text-sm">Book Cover Unavailable</div>
                </div>
              </div>
            ) : (
              <img
                src={book.imageUrl}
                alt={`Cover of ${book.title}`}
                className="w-full h-80 object-contain rounded-lg shadow-sm"
                onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                loading="lazy"
              />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{book.title}</h1>
            <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
            <div className="flex items-center mb-3 text-sm">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} filled={i < Math.round(book.rating || 0)} rating={book.rating || 0} />
                ))}
              </div>
              <a
                href="#reviews"
                className="ml-2 text-gray-500 hover:text-red-600 underline"
              >
                {book.rating ? `${book.rating.toFixed(1)} (${book.reviews || 5} Reviews)` : "No Reviews"}
              </a>
              <a
                href="#add-review"
                className="ml-2 text-gray-500 hover:text-red-600 underline"
              >
                Add Your Review
              </a>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-3">
              £{book.price.toFixed(2)}
            </p>
            <div className="text-sm mb-3">
              <span className="text-green-600 font-semibold">{book.stock > 0 ? "IN STOCK" : "OUT OF STOCK"}</span>
              <span className="text-gray-500 ml-2">SKU: {book.isbn || `BBW0${book.id}`}</span>
            </div>
            {book.description ? (
              <p className="text-gray-600 leading-relaxed mb-3">
                {book.description.substring(0, 150)}...
              </p>
            ) : (
              <p className="text-gray-400 italic mb-3">
                No description available for this book.
              </p>
            )}
            <div className="mb-3">
              <span className="font-semibold">Condition: </span>
              <span className="text-gray-700">{book.condition}</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center">
                <span className="mr-2 font-semibold text-gray-700">Qty:</span>
                <div className="flex items-center border rounded">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-2 py-1 text-base hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly
                    className="w-10 text-center border-l border-r focus:outline-none py-1"
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(book.stock, q + 1))}
                    className="px-2 py-1 text-base hover:bg-gray-100"
                    disabled={quantity >= book.stock}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                className="bg-red-600 text-white font-bold px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                disabled={book.stock === 0}
              >
                <ShoppingCart size={16} />
                ADD TO BASKET
              </button>
            </div>
            <div className="flex items-center gap-6 mb-3">
              <button className="flex items-center text-gray-600 hover:text-red-600">
                <Heart size={18} className="mr-1" /> Add to Wish List
              </button>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-semibold mr-2">Share</span>
                <div className="flex gap-2">
                  <a href="#" className="p-1 rounded-full border hover:bg-gray-100">
                    <Facebook size={14} />
                  </a>
                  <a href="#" className="p-1 rounded-full border hover:bg-gray-100">
                    <Twitter size={14} />
                  </a>
                  <a href="#" className="p-1 rounded-full border hover:bg-gray-100">
                    <Instagram size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border rounded-md">
          <div className="border-b bg-gray-50 rounded-t-md">
            <nav className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 text-sm font-semibold rounded-md ${
                  activeTab === "details" ? "bg-white shadow" : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`px-4 py-2 text-sm font-semibold rounded-md ${
                  activeTab === "info" ? "bg-white shadow" : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Additional Information
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-2 text-sm font-semibold rounded-md ${
                  activeTab === "reviews" ? "bg-white shadow" : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Reviews ({book.rating ? book.reviews || 5 : 0})
              </button>
            </nav>
          </div>
          <div className="p-4 text-gray-600 leading-relaxed">
            {activeTab === "details" && <p>{book.description || "No description available."}</p>}
            {activeTab === "info" && (
              <ul>
                <li><span className="font-semibold">ISBN:</span> {book.isbn || "N/A"}</li>
                <li><span className="font-semibold">Pages:</span> {book.pages || "N/A"}</li>
                <li><span className="font-semibold">Release Date:</span> {book.releaseDate || "N/A"}</li>
                <li><span className="font-semibold">Category:</span> {book.category || "N/A"}</li> {/* ← fixed label */}
              </ul>
            )}
            {activeTab === "reviews" && (
              <p>{book.rating ? "Customer reviews would be listed here." : "No reviews available."}</p>
            )}
          </div>
        </div>
        <BookShelf
          title="You may also like"
          fetchParams={{ filters: { category: book.category }, sort: "rating", order: "desc" }}   // ← fixed: category
          currentBookId={id}
        />
        <BookShelf
          title="Related Products"
          fetchParams={{ filters: { category: book.category }, sort: "createdAt", order: "desc" }}   // ← fixed: category
          currentBookId={id}
        />
      </main>
      <Footer />
    </div>
  );
};

export default BrowseCategoryDetail;