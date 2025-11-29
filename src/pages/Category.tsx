import React, { useState, useEffect, useMemo, useRef, Component, ReactNode } from "react";
import { Link, useParams , useLocation} from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, X, Filter, ShoppingBag, Eye, Tag, MessageCircle, Truck } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";
import { fetchBooks, fetchCategories, Book } from "../data/books";
import { useCart } from "../context/cartContext";

// --- Price Ranges ---
const priceRanges = [
  { label: "Under £2.99", min: 0, max: 2.99 },
  { label: "£3.00 - £5.99", min: 3, max: 5.99 },
  { label: "£6.00 - £8.99", min: 6, max: 8.99 },
  { label: "£9.00 - £11.99", min: 9, max: 11.99 },
  { label: "£12.00+", min: 12, max: Infinity },
];

// --- BookCardProps Interface ---
interface BookCardProps {
  id: string;
  img: string;
  title: string;
  author: string;
  price: string;
  rating: number;
  condition?: string;
}

// --- Convert API books to homepage format ---
const formatBooksForHomepage = (books: Book[]): BookCardProps[] => {
  return books.map(book => ({
    id: book.id,
    img: book.imageUrl || "https://via.placeholder.com/150",
    title: book.title,
    author: book.author,
    price: `£${book.price.toFixed(2)}`,
    rating: book.rating || 0,
    condition: book.condition || "new",
  }));
};

// --- Star Rating Component ---
const StarRating = ({ rating, starSize = 14 }: { rating: number; starSize?: number }) => (
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

// --- Book Card Skeleton Component ---
const BookCardSkeleton = () => (
  <div className="relative flex-shrink-0 w-full max-w-[140px] text-center border border-gray-200 rounded-lg p-2 animate-pulse">
    <div className="w-full h-48 bg-gray-200 mb-2 rounded" />
    <div className="space-y-2">
      <div className="w-3/4 h-3 bg-gray-200 mx-auto rounded" />
      <div className="w-1/2 h-2 bg-gray-200 mx-auto rounded" />
      <div className="flex justify-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-3 h-3 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="w-1/3 h-3 bg-gray-200 mx-auto rounded" />
      <div className="w-full h-6 bg-gray-200 rounded-full" />
    </div>
  </div>
);

// --- Book Card Component ---
const BookCard = ({ id, img, title, author, price, rating }: BookCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({ id, img, title, author, price, quantity: 1 });
    toast.success(`${title} added to your basket!`);
  };

  return (
    <div className="relative group flex-shrink-0 w-full max-w-[140px] text-center border border-gray-200 rounded-lg p-2 transition-shadow hover:shadow-lg">
      <div className="relative">
        <img src={img} alt={title} className="w-full h-48 object-cover mb-2 rounded" loading="lazy" />
        <div className="absolute inset-x-0 top-0 h-48 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <Link to={`/browse/${id}`}>
            <button className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-semibold opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-4 transition-all duration-300">
              QUICK VIEW
            </button>
          </Link>
        </div>
      </div>
      <h3 className="font-semibold text-xs truncate">{title}</h3>
      <p className="text-gray-500 text-xs mb-1">{author}</p>
      <div className="flex items-center justify-center mb-1">
        <StarRating rating={rating} starSize={12} />
      </div>
      <p className="text-blue-600 font-bold text-sm mb-2">{price}</p>
      <button
        onClick={handleAddToCart}
        className="bg-red-400 text-white px-3 py-1 rounded-full hover:bg-red-500 text-xs w-full transition-colors"
      >
        ADD TO BASKET
      </button>
    </div>
  );
};

// --- Book Shelf Component ---
const BookShelf = ({ title, fetchParams, onFilterClick, bookCount, initialBooks = [] }: { title: string; fetchParams: any; onFilterClick: (category: string) => void; bookCount: number; initialBooks?: BookCardProps[] }) => {
  const [books, setBooks] = useState<BookCardProps[]>(initialBooks);
  const [isLoading, setIsLoading] = useState(!initialBooks.length);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const maxPages = 20000;

  useEffect(() => {
    // Reset currentPage to 1 when fetchParams change (e.g., filters or sortBy)
    setCurrentPage(1);
  }, [fetchParams]);

  useEffect(() => {
    // Skip fetching if initialBooks are provided and we're on page 1
    if (currentPage === 1 && initialBooks.length > 0) {
      setBooks(initialBooks);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchShelfBooks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { books: fetchedBooks } = await fetchBooks({
          page: currentPage,
          limit: itemsPerPage,
          ...fetchParams
        });

        if (isMounted) {
          setBooks(formatBooksForHomepage(fetchedBooks));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(`Failed to load ${title.toLowerCase()}. Please try again.`);
          setIsLoading(false);
          console.error(`❌ Failed to fetch ${title}:`, err instanceof Error ? err.message : err);
        }
      }
    };

    fetchShelfBooks();
    return () => { isMounted = false; };
  }, [fetchParams, currentPage, initialBooks]);

  const handlePageChange = (page: number) => {
      if (page >= 1 && page <= maxPages) {
        setCurrentPage(page);
        shelfRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
     };

  return (
    <section className="py-6 sm:py-8 animate-on-scroll">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Link to={`/category/${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800 hover:text-blue-600 transition-colors cursor-pointer">
              {title}
            </h2>
          </Link>
          <span className="text-sm text-gray-500">({bookCount} books)</span>
          <button
            onClick={() => onFilterClick(title)}
            className="text-sm text-red-600 hover:underline"
          >
            Filter by {title}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-1 border rounded-md hover:bg-gray-100 text-gray-500 disabled:text-gray-300"
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {Math.min(maxPages, Math.ceil(bookCount / itemsPerPage))}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-1 border rounded-md hover:bg-gray-100 text-gray-500 disabled:text-gray-300"
            disabled={currentPage === maxPages || currentPage === Math.ceil(bookCount / itemsPerPage)}
          >
            Next
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(itemsPerPage)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))
        ) : error ? (
          <p className="text-red-500 col-span-full text-center">{error}</p>
        ) : books.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center">No {title.toLowerCase()} available.</p>
        ) : (
          books.map((book, index) => (
            <BookCard key={index} {...book} />
          ))
        )}
      </div>
    </section>
  );
};

// --- Error Boundary Component ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-8 text-center">
          <p className="text-red-500 text-lg">Something went wrong: {this.state.error}</p>
          <p className="text-gray-500 mt-2">Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Filter Sidebar Component ---
const FilterSidebar = ({
  filters,
  setFilters,
  isOpen,
  setIsOpen,
  setSortBy,
  categories,
  filterOptions,
}: {
  filters: any;
  setFilters: (filters: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setSortBy: (sortBy: string) => void;
  categories: string[];
  filterOptions: any;
}) => {
  const handleFilterClick = (filterType: string, value: string | number) => {
    setFilters((prev: any) => {
      const currentValues = Array.isArray(prev[filterType]) ? prev[filterType] : [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v: string | number) => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [filterType]: newValues.length > 0 ? newValues : undefined,
      };
    });
  };

  const handlePriceFilter = (range: { min: number; max: number }) => {
    setFilters((prev: any) => {
      const currentRanges = Array.isArray(prev.priceRanges) ? prev.priceRanges : [];
      const isSelected = currentRanges.some((r: any) => r.min === range.min && r.max === range.max);
      const newRanges = isSelected
        ? currentRanges.filter((r: any) => r.min !== range.min || r.max !== range.max)
        : [...currentRanges, range];
      return {
        ...prev,
        priceRanges: newRanges.length > 0 ? newRanges : undefined,
      };
    });
  };

  const handleClearFilterType = (filterType: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [filterType]: undefined,
    }));
  };

  const renderFilterSection = (title: string, options: Record<string, number>, filterKey: string, Icon: any) => (
    <div className="mb-6 opacity-0 animate-fadeIn">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide flex items-center">
          <Icon className="mr-2 h-4 w-4 text-red-600" /> {title}
        </h4>
        <button
          onClick={() => handleClearFilterType(filterKey)}
          className="text-xs text-red-600 hover:underline"
        >
          Clear
        </button>
      </div>
      <ul className="space-y-2">
        {Object.entries(options).map(([value, count]) => (
          <li key={value} className="flex items-center">
            <input
              type="checkbox"
              id={`${filterKey}-${value}`}
              checked={filters[filterKey]?.includes(filterKey === "rating" ? parseInt(value) : value)}
              onChange={() => handleFilterClick(filterKey, filterKey === "rating" ? parseInt(value) : value)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-all duration-200 hover:scale-110"
            />
            <label
              htmlFor={`${filterKey}-${value}`}
              className="ml-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors duration-200"
            >
              {filterKey === "rating" ? `${value} Stars` : value} <span className="text-gray-400">({count})</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );

  const campaignAds = [
    {
      id: 1,
      title: "Summer Sale - 20% Off!",
      description: "Get 20% off on all books this summer.",
      video: "https://media.istockphoto.com/id/1124580988/video/sale-discount-animation.mp4?s=mp4-640x640-is&k=20&c=2zkbq3ujo3KveLEviCLhbTiIH9C7fAaCpABvuZvHoek=",
      link: "/special-offers",
    },
    {
      id: 2,
      title: "New Arrivals",
      description: "Check out the latest books added!",
      image: "https://media.istockphoto.com/id/1351440387/fr/vectoriel/m%C3%A9gaphone-avec-banni%C3%A8re-de-bulle-vocale-whats-new-haut-parleur-label-pour-les-affaires-le.jpg?s=612x612&w=0&k=20&c=urnToNM6GlNy8rDyHl8-7uNFWKBzQs16uSxteDXvhi4=",
      link: "/new-arrivals",
    },
  ];

  const recentlyViewed = [
    { id: 1, title: "The Great Gatsby", image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1650033243i/41733839.jpg" },
    { id: 2, title: "1984", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:80cRWvX2esDaX_a0_vN_EXQXccu-ZEKCTiQeEPQ&s" },
  ];

  const topDeals = [
    { id: 1, title: "50% Off Mystery Books", link: "/deals/mystery" },
    { id: 2, title: "Buy 2 Get 1 Free", link: "/deals/buy2get1" },
  ];

  const customerReview = {
    text: "Amazing selection and fast shipping! Highly recommend!",
    author: "John D.",
    rating: 4.5,
  };

  const allPurchaseUpdates = useMemo(
    () => [
      { id: 1, book: "The Great Gatsby", units: 30, location: "Tokyo", time: "10:40 AM" },
      { id: 2, book: "1984", units: 15, location: "London", time: "10:38 AM" },
      { id: 3, book: "Dune", units: 25, location: "New York", time: "10:35 AM" },
      { id: 4, book: "Harry Potter", units: 40, location: "Sydney", time: "10:32 AM" },
      { id: 5, book: "The Hobbit", units: 12, location: "Paris", time: "10:30 AM" },
      { id: 6, book: "Project Hail Mary", units: 22, location: "Lagos", time: "10:28 AM" },
    ],
    []
  );

  const [feedUpdates, setFeedUpdates] = useState(allPurchaseUpdates.slice(0, 4));
  const nextUpdateIndex = useRef(4);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFeedUpdates((currentFeed) => {
        const nextUpdate = allPurchaseUpdates[nextUpdateIndex.current % allPurchaseUpdates.length];
        nextUpdateIndex.current += 1;
        return [{ ...nextUpdate, id: Date.now() }, ...currentFeed.slice(0, 3)];
      });
    }, 3000);
    return () => clearInterval(intervalId);
  }, [allPurchaseUpdates]);

  useEffect(() => {
    const sections = document.querySelectorAll(".animate-fadeIn");
    sections.forEach((section, index) => {
      setTimeout(() => {
        section.classList.add("opacity-100");
      }, index * 200);
    });
  }, [isOpen]);

  return (
    <>
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-red-600 text-white font-medium py-2 rounded-md flex items-center justify-center gap-2 transition-all duration-300 hover:bg-red-700 transform hover:scale-105"
        >
          <Filter size={20} />
          Filters & Offers
        </button>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b animate-slideDown">
            <h3 className="font-bold text-xl text-gray-900">Filters & Offers</h3>
            <button onClick={() => setIsOpen(false)} className="p-2 transition-transform hover:rotate-90">
              <X size={24} className="text-gray-700" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <div className="mb-8">
              {renderFilterSection("Categories", filterOptions.category, "categories", Filter)}
              {renderFilterSection("Condition", filterOptions.condition, "conditions", Filter)}
              <div className="mb-6 opacity-0 animate-fadeIn">
                <h4 className="font-medium text-gray-700 mb-2 text-sm uppercase tracking-wide flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-red-600" /> Price Range
                </h4>
                <ul className="space-y-2">
                  {priceRanges.map((range) => (
                    <li key={range.label} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`price-${range.label}`}
                        checked={filters.priceRanges?.some((r: any) => r.min === range.min && r.max === range.max)}
                        onChange={() => handlePriceFilter(range)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-all duration-200 hover:scale-110"
                      />
                      <label
                        htmlFor={`price-${range.label}`}
                        className="ml-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors duration-200"
                      >
                        {range.label} <span className="text-gray-400">({filterOptions.price.find((r: any) => r.label === range.label)?.count || 0})</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              {renderFilterSection("Rating", filterOptions.rating, "ratings", Star)}
              <div className="mb-6 opacity-0 animate-fadeIn">
                <h4 className="font-medium text-gray-700 mb-2 text-sm uppercase tracking-wide flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-red-600" /> Sort By
                </h4>
                <select
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 hover:bg-gray-100"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="rating-high-low">Rating: High to Low</option>
                </select>
              </div>
              <button
                onClick={() => setFilters({})}
                className="w-full bg-red-600 text-white font-medium py-2 rounded-md hover:bg-red-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 mt-2"
              >
                Clear All Filters
              </button>
            </div>

            <div className="mt-8 opacity-0 animate-fadeIn">
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <Tag className="mr-2 h-5 w-5 text-red-600" /> Special Offers
              </h4>
              {campaignAds.map((ad) => (
                <div
                  key={ad.id}
                  className="mb-4 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {ad.video ? (
                    <video className="w-full h-24 object-cover" autoPlay loop muted playsInline>
                      <source src={ad.video} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={ad.image} alt={ad.title} className="w-full h-24 object-cover" />
                  )}
                  <div className="p-3">
                    <h5 className="font-semibold text-gray-800 text-sm">{ad.title}</h5>
                    <p className="text-xs text-gray-600">{ad.description}</p>
                    <Link to={ad.link} className="text-red-600 text-xs font-medium hover:underline mt-1 inline-block">
                      Shop Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 opacity-0 animate-fadeIn">
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <Truck className="mr-2 h-5 w-5 text-indigo-500" /> Live Purchase Updates
              </h4>
              {feedUpdates.map((update) => (
                <div
                  key={update.id}
                  className="flex items-center gap-4 rounded-xl bg-white/60 p-3 shadow-subtle backdrop-blur-sm"
                >
                  <div className="flex-shrink-0 rounded-full bg-indigo-100 p-2">
                    <Truck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{update.units} units</span> of{" "}
                    <span className="font-medium text-gray-800">"{update.book}"</span> shipped to{" "}
                    <span className="font-medium text-indigo-500">{update.location}</span>
                    <span className="ml-2 text-xs text-gray-400">{update.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 opacity-0 animate-fadeIn">
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <Eye className="mr-2 h-5 w-5 text-red-600" /> Recently Viewed
              </h4>
              {recentlyViewed.map((book) => (
                <div key={book.id} className="flex items-center mb-4 transition-all duration-300 hover:bg-gray-100 p-2 rounded">
                  <img src={book.image} alt={book.title} className="w-12 h-12 object-cover rounded" />
                  <div className="ml-2">
                    <Link to={`/browse/${book.id}`} className="text-sm text-gray-800 hover:text-red-600">
                      {book.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 opacity-0 animate-fadeIn">
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <Tag className="mr-2 h-5 w-5 text-red-600" /> Top Deals
              </h4>
              {topDeals.map((deal) => (
                <Link
                  key={deal.id}
                  to={deal.link}
                  className="block mb-2 text-sm text-red-600 hover:underline transition-colors duration-200"
                >
                  {deal.title}
                </Link>
              ))}
            </div>

            <div className="mt-8 opacity-0 animate-fadeIn">
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-red-600" /> Customer Reviews
              </h4>
              <div className="bg-white p-3 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
                <p className="text-sm text-gray-600">{customerReview.text}</p>
                <p className="text-xs text-gray-500 mt-1">- {customerReview.author}</p>
                <div className="mt-1">
                  <StarRating rating={customerReview.rating} starSize={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block w-full lg:w-1/4 xl:w-1/5 pr-6">
        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl shadow-lg flex flex-col sticky top-4">
          <h3 className="font-bold text-xl text-gray-900 mb-4 border-b pb-2 border-red-100">Filters & Offers</h3>
          <div className="overflow-y-auto pr-2 flex-grow scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            {renderFilterSection("Categories", filterOptions.category, "categories", Filter)}
            {renderFilterSection("Condition", filterOptions.condition, "conditions", Filter)}
            <div className="mb-6 opacity-0 animate-fadeIn">
              <h4 className="font-medium text-gray-700 mb-2 text-sm uppercase tracking-wide flex items-center">
                <Filter className="mr-2 h-4 w-4 text-red-600" /> Price Range
              </h4>
              <ul className="space-y-2">
                {priceRanges.map((range) => (
                  <li key={range.label} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`price-${range.label}`}
                      checked={filters.priceRanges?.some((r: any) => r.min === range.min && r.max === range.max)}
                      onChange={() => handlePriceFilter(range)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-all duration-200 hover:scale-110"
                    />
                    <label
                      htmlFor={`price-${range.label}`}
                      className="ml-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors duration-200"
                    >
                      {range.label} <span className="text-gray-400">({filterOptions.price.find((r: any) => r.label === range.label)?.count || 0})</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            {renderFilterSection("Rating", filterOptions.rating, "ratings", Star)}
            <div className="mb-6 opacity-0 animate-fadeIn">
              <h4 className="font-medium text-gray-700 mb-2 text-sm uppercase tracking-wide flex items-center">
                <Filter className="mr-2 h-4 w-4 text-red-600" /> Sort By
              </h4>
              <select
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 hover:bg-gray-100"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating-high-low">Rating: High to Low</option>
              </select>
            </div>
            <button
              onClick={() => setFilters({})}
              className="w-full bg-red-600 text-white font-medium py-2 rounded-md hover:bg-red-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 mt-2"
              >
              Clear All Filters
            </button>
          </div>

          <div className="mt-6 border-t pt-4 border-gray-200 opacity-0 animate-fadeIn">
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <Tag className="mr-2 h-5 w-5 text-red-600" /> Special Offers
            </h4>
            {campaignAds.map((ad) => (
              <div
                key={ad.id}
                className="mb-4 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {ad.video ? (
                  <video className="w-full h-24 object-cover" autoPlay loop muted playsInline>
                    <source src={ad.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img src={ad.image} alt={ad.title} className="w-full h-24 object-cover" />
                )}
                <div className="p-3">
                  <h5 className="font-semibold text-gray-800 text-sm">{ad.title}</h5>
                  <p className="text-xs text-gray-600">{ad.description}</p>
                  <Link to={ad.link} className="text-red-600 text-xs font-medium hover:underline mt-1 inline-block">
                    Shop Now
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 border-gray-200 opacity-0 animate-fadeIn">
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <Truck className="mr-2 h-5 w-5 text-indigo-500" /> Live Purchase Updates
            </h4>
            {feedUpdates.map((update) => (
              <div
                key={update.id}
                className="flex items-center gap-4 rounded-xl bg-white/60 p-3 shadow-subtle backdrop-blur-sm"
              >
                <div className="flex-shrink-0 rounded-full bg-indigo-100 p-2">
                  <Truck className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{update.units} units</span> of{" "}
                  <span className="font-medium text-gray-800">"{update.book}"</span> shipped to{" "}
                  <span className="font-medium text-indigo-500">{update.location}</span>
                  <span className="ml-2 text-xs text-gray-400">{update.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 border-gray-200 opacity-0 animate-fadeIn">
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <Eye className="mr-2 h-5 w-5 text-red-600" /> Recently Viewed
            </h4>
            {recentlyViewed.map((book) => (
              <div key={book.id} className="flex items-center mb-4 transition-all duration-300 hover:bg-gray-100 p-2 rounded">
                <img src={book.image} alt={book.title} className="w-12 h-12 object-cover rounded" />
                <div className="ml-2">
                  <Link to={`/browse/${book.id}`} className="text-sm text-gray-800 hover:text-red-600">
                    {book.title}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 border-gray-200 opacity-0 animate-fadeIn">
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <Tag className="mr-2 h-5 w-5 text-red-600" /> Top Deals
            </h4>
            {topDeals.map((deal) => (
              <Link
                key={deal.id}
                to={deal.link}
                className="block mb-2 text-sm text-red-600 hover:underline transition-colors duration-200"
              >
                {deal.title}
              </Link>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 border-gray-200 opacity-0 animate-fadeIn">
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-red-600" /> Customer Reviews
            </h4>
            <div className="bg-white p-3 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
              <p className="text-sm text-gray-600">{customerReview.text}</p>
              <p className="text-xs text-gray-500 mt-1">- {customerReview.author}</p>
              <div className="mt-1">
                <StarRating rating={customerReview.rating} starSize={12} />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// --- Cache for storing data across mounts ---
const dataCache = {
  current: {
    categories: null as string[] | null,
    booksByCategory: null as Record<string, BookCardProps[]> | null,
    bookCounts: null as Record<string, number> | null,
  }
};

// --- Filter and sort cached books ---
const filterAndSortBooks = (books: BookCardProps[], filters: any, sortBy: string): BookCardProps[] => {
  let filteredBooks = [...books];

  // Apply category filter
  if (filters.categories?.length > 0) {
    filteredBooks = filteredBooks.filter(book => filters.categories.includes(book.category));
  }

  // Apply price filter
  if (filters.priceRanges?.length > 0) {
    filteredBooks = filteredBooks.filter(book => {
      const price = parseFloat(book.price.replace('£', ''));
      return filters.priceRanges.some((range: any) => price >= range.min && price <= range.max);
    });
  }

  // Apply rating filter
  if (filters.ratings?.length > 0) {
    filteredBooks = filteredBooks.filter(book => filters.ratings.includes(Math.round(book.rating)));
  }

  // Apply condition filter
  if (filters.conditions?.length > 0) {
    filteredBooks = filteredBooks.filter(book => book.condition && filters.conditions.includes(book.condition));
  }

  // Apply sort
  if (sortBy === 'price-low-high') {
    filteredBooks.sort((a, b) => parseFloat(a.price.replace('£', '')) - parseFloat(b.price.replace('£', '')));
  } else if (sortBy === 'price-high-low') {
    filteredBooks.sort((a, b) => parseFloat(b.price.replace('£', '')) - parseFloat(a.price.replace('£', '')));
  } else if (sortBy === 'rating-high-low') {
    filteredBooks.sort((a, b) => b.rating - a.rating);
  }

  return filteredBooks;
};

// --- Main Category Page Component ---
const CategoryBrowsePage = () => {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [categories, setCategories] = useState<string[]>([]);
  const [booksByCategory, setBooksByCategory] = useState<Record<string, BookCardProps[]>>({});
  const [bookCounts, setBookCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<{ categories?: string[], priceRanges?: { min: number, max: number }[], ratings?: number[], conditions?: string[] }>({});
  const [sortBy, setSortBy] = useState("relevance");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const location = useLocation();

  // Set initial category filter from URL
  useEffect(() => {
    if (categoryId) {
      const formattedCategory = categoryId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      setFilters((prev) => ({
        ...prev,
        categories: [formattedCategory],
      }));
      setIsFilterOpen(false);
    }
  }, [categoryId]);



  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const genre = params.get("genre");
  
    if (genre) {
      setFilters(prev => ({
        ...prev,
        categories: [genre]
      }));
    } else {
      // Optional: show all books when no genre
      setFilters(prev => ({
        ...prev,
        categories: undefined
      }));
    }
  }, [location.search]);



  // Fetch categories and first page of books, using cache if available
// --- FETCH CATEGORIES & INITIAL DATA (NO FALLBACK PLACEHOLDERS) ---
useEffect(() => {
  const fetchInitialData = async () => {
    setIsInitialLoading(true);
    setError(null);

    try {
      // 1. Fetch real categories from backend
      const realCategories = await fetchCategories();

      if (!realCategories || realCategories.length === 0) {
        throw new Error("No categories returned from server");
      }

      // Sort alphabetically for consistency
      const sortedCategories = [...realCategories].sort((a, b) => 
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );

      setCategories(sortedCategories);
      dataCache.current.categories = sortedCategories;

      // 2. Fetch first page of books for each category in parallel
      const bookPromises = sortedCategories.map(async (category) => {
        try {
          const { books, total } = await fetchBooks({
            page: 1,
            limit: 12,
            filters: { genre: category }
          });

          return {
            category,
            books: formatBooksForHomepage(books),
            total: total || books.length
          };
        } catch (err) {
          console.warn(`Failed to load books for category: ${category}`);
          return { category, books: [], total: 0 };
        }
      });

      const results = await Promise.all(bookPromises);

      // Update books by category
      const newBooksByCategory: Record<string, BookCardProps[]> = {};
      const newBookCounts: Record<string, number> = {};

      results.forEach(({ category, books, total }) => {
        newBooksByCategory[category] = books.map(book => ({
          ...book,
          category // ensure category is attached for filtering
        }));
        newBookCounts[category] = total || books.length;
      });

      setBooksByCategory(newBooksByCategory);
      setBookCounts(newBookCounts);

      // Update cache
      dataCache.current.booksByCategory = newBooksByCategory;
      dataCache.current.bookCounts = newBookCounts;

      setIsInitialLoading(false);
    } catch (err) {
      console.error("Failed to load categories or books:", err);
      setError("Unable to load categories. Please try again later.");
      setIsInitialLoading(false);

      // Optional: Show empty state instead of fake data
      setCategories([]);
      setBooksByCategory({});
      setBookCounts({});
    }
  };

  fetchInitialData();
}, []); // Only run once on mount
  // Animation for scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Filter options for sidebar
  const filterOptions = useMemo(() => {
    const categoryOptions: Record<string, number> = {};
    
    categories.forEach(cat => {
      categoryOptions[cat] = bookCounts[cat] || 0;
    });
  
    // Sort categories alphabetically
    const sortedCategoryEntries = Object.entries(categoryOptions)
      .sort(([a], [b]) => a.localeCompare(b));
  
    return {
      category: Object.fromEntries(sortedCategoryEntries),
      condition: { new: 0, "like new": 0, "very good": 0, good: 0 },
      price: priceRanges.map(r => ({ ...r, count: 0 })),
      rating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }, [categories, bookCounts]);

  // Filter and sort cached books for rendering
  const filteredBooksByCategory = useMemo(() => {
    if (!dataCache.current.booksByCategory) return booksByCategory;

    const filtered = { ...booksByCategory };
    Object.keys(filtered).forEach(category => {
      if (filters.categories?.length > 0 && !filters.categories.includes(category)) {
        filtered[category] = [];
      } else {
        filtered[category] = filterAndSortBooks(booksByCategory[category] || [], filters, sortBy);
      }
    });
    return filtered;
  }, [booksByCategory, filters, sortBy]);

  const handleFilterClick = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter((c: string) => c !== category)
        : [...(prev.categories || []), category],
    }));
    setIsFilterOpen(false);
  };

  return (
    <ErrorBoundary>
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
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #9ca3af;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fadeIn { 
          animation: fadeIn 0.5s ease-out forwards;
          transition: opacity 0.5s ease-out;
        }
        .opacity-100 {
          opacity: 1 !important;
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div className="bg-white">
        <TopBar />
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <nav aria-label="Breadcrumb" className="flex items-center justify-end text-sm font-medium">
  <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {/* Home */}
                <li className="flex items-center">
                  <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600 transition">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                    </svg>
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                </li>

                <li className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                </li>

                {/* Show current category from URL */}
                {categoryId && (
                  <>
                    <li className="flex items-center">
                      <Link
                        to="/category"
                        className="text-gray-700 hover:text-blue-600 capitalize font-medium truncate max-w-[120px] sm:max-w-none"
                      >
                        {categoryId.replace(/-/g, ' ')}
                      </Link>
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                      </svg>
                    </li>
                  </>
                )}

                {/* Final page name */}
                <li className="text-gray-900 font-semibold">
                  {categoryId ? categoryId.replace(/-/g, ' ') : "Browse"}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <main className="container mx-auto px-4 sm:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              isOpen={isFilterOpen}
              setIsOpen={setIsFilterOpen}
              setSortBy={setSortBy}
              categories={categories}
              filterOptions={filterOptions}
            />
            <div className="w-full lg:w-3/4 xl:w-4/5">
              <div className="space-y-12">
                {isInitialLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => (
                      <BookCardSkeleton key={i} />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 text-lg py-10">{error}</div>
                ) : filters.categories?.length > 0 ? (
                  filters.categories.map(category => (
                    <BookShelf
                      key={category}
                      title={category}
                      fetchParams={{ 
                        filters: { 
                          genre: category, 
                          ...(filters.priceRanges && { priceRanges: filters.priceRanges }),
                          ...(filters.ratings && { ratings: filters.ratings }),
                          ...(filters.conditions && { conditions: filters.conditions })
                        }, 
                        sortBy 
                      }}
                      onFilterClick={handleFilterClick}
                      bookCount={bookCounts[category] || 0}
                      initialBooks={filteredBooksByCategory[category] || []}
                    />
                  ))
                ) : (
                  categories.map((category) => (
                    <BookShelf
                      key={category}
                      title={category}
                      fetchParams={{ 
                        filters: { genre: category }, 
                        sortBy 
                      }}
                      onFilterClick={handleFilterClick}
                      bookCount={bookCounts[category] || 0}
                      initialBooks={filteredBooksByCategory[category] || []}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default CategoryBrowsePage;