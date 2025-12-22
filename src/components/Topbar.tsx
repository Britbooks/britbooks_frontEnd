"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { fetchCategories } from "../data/books"; // Assuming your API utility is in this path
import toast from 'react-hot-toast';

// --- SVG ICONS --- //
const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ShoppingCartIcon = (props) => (
  <svg
    {...props}
    className={`text-red-500 ${props.className || ''}`}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const BookmarkIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

const MenuIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const UserIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ChevronDown = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const StarIcon = ({ filled, rating }) => (
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

// --- Search Result Card --- //
const SearchResultCard = ({ id, imageUrl, title, author, price, rating, onSelect }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const numericPrice = typeof price === "string" ? parseFloat(price.replace("£", "")) : price;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({
      id,
      imageUrl,
      title,
      author,
      price: `£${numericPrice.toFixed(2)}`,
      quantity: 1,
    });
    toast.success(`${title} added to your basket!`);
  };

  const handleClick = () => {
    if (id && id !== 'unknown') {
      navigate(`/browse/${id}`);
      onSelect();
    }
  };

  return (
    <div className="flex items-center p-2 border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={handleClick}>
      <img src={imageUrl || "https://via.placeholder.com/150"} alt={title} className="w-12 h-16 object-cover rounded-md mr-3" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        <p className="text-xs text-gray-500">{author}</p>
        <div className="flex items-center text-gray-300">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} filled={i < Math.round(rating)} rating={rating} />
          ))}
        </div>
        <p className="text-sm font-bold text-gray-900">£{numericPrice.toFixed(2)}</p>
      </div>
      <button onClick={handleAddToCart} className="bg-red-600 text-white font-medium px-2 py-1 rounded-md text-xs hover:bg-red-700">
        Add to Basket
      </button>
    </div>
  );
};

// --- TOPBAR COMPONENT --- //
const TopBar = () => {
  const authContext = React.useContext(AuthContext);
  const { cartCount } = useCart();
  const user = authContext?.auth.user;
  const logout = authContext?.logout;
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // States for Categories Modal
  const [categories, setCategories] = useState([]);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  
  const searchRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Fetch Categories from your API utility
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories for modal", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        clearSearch();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsLoading(true);
        setError(null);
        fetch(`https://britbooks-api-production.up.railway.app/api/market/search?keyword=${encodeURIComponent(searchQuery)}`)
          .then((response) => {
            if (!response.ok) throw new Error('Search request failed');
            return response.json();
          })
          .then((data) => {
            const results = Array.isArray(data) ? data : data.results || [];
            const mappedResults = results.map((book) => ({
              id: book._id || book.bookId || book.id || 'unknown',
              imageUrl: book.imageUrl || book.coverImage || book.samplePageUrls?.[0] || '',
              title: book.title || book.name || 'Untitled',
              author: book.author || book.authors || 'Unknown Author',
              price: book.price || 0,
              rating: book.rating || 0,
            }));
            setSearchResults(mappedResults);
            setIsLoading(false);
          })
          .catch((err) => {
            setError('Failed to fetch search results. Please try again.');
            setIsLoading(false);
          });
      } else {
        setSearchResults([]);
        setError(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleInputChange = (e) => setSearchQuery(e.target.value);

  const navLinks = (
    <>
      <Link to="/" onClick={toggleMobileMenu} className={`py-3 ${isActive('/') ? 'text-red-600' : 'hover:text-red-600'}`}>Home</Link>
      <Link to="/category" onClick={toggleMobileMenu} className={`py-3 ${isActive('/category') ? 'text-red-600' : 'hover:text-red-600'}`}>Shop by Category</Link>
      <Link to="/popular-books" onClick={toggleMobileMenu} className={`py-3 ${isActive('/popular-books') ? 'text-red-600' : 'hover:text-red-600'}`}>Popular Books</Link>
      <Link to="/new-arrivals" onClick={toggleMobileMenu} className={`py-3 ${isActive('/new-arrivals') ? 'text-red-600' : 'hover:text-red-600'}`}>New Arrivals</Link>
      <Link to="/bestsellers" onClick={toggleMobileMenu} className={`py-3 ${isActive('/bestsellers') ? 'text-red-600' : 'hover:text-red-600'}`}>Best Sellers</Link>
      <Link to="/clearance" onClick={toggleMobileMenu} className={`py-3 ${isActive('/clearance') ? 'text-red-600' : 'hover:text-red-600'}`}>Clearance</Link>
      <Link to="/help" onClick={toggleMobileMenu} className={`py-3 ${isActive('/help') ? 'text-red-600' : 'hover:text-red-600'}`}>Contact Us</Link>
    </>
  );

  return (
    <header className="shadow-md sticky top-0 z-50">
      {/* ==================== MOBILE TOPBAR ==================== */}
      <div className="sm:hidden bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <button onClick={toggleMobileMenu} className="p-2">
            <MenuIcon className="h-6 w-6 text-gray-700" />
          </button>
          <Link to="/">
            <img src="/logobrit.png" alt="BritBooks Logo" className="h-10" />
          </Link>
          <Link to="/checkout" className="p-2 relative">
            <ShoppingCartIcon className="h-6 w-6 text-red-500" />
            <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs text-center">{cartCount}</span>
          </Link>
        </div>

        <div className="px-4 pb-4" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search For Books..."
              className="w-full py-2 px-4 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={handleInputChange}
            />
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          {searchQuery.trim() && (
            <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg max-h-96 overflow-y-auto z-40">
              {isLoading && <p className="p-4 text-center text-gray-500">Loading...</p>}
              {error && <p className="p-4 text-center text-red-500">{error}</p>}
              {!isLoading && !error && searchResults.length === 0 && (
                <p className="p-4 text-center text-gray-500">No results found.</p>
              )}
              {searchResults.map((book) => (
                <SearchResultCard
                  key={book.id}
                  id={book.id}
                  imageUrl={book.imageUrl}
                  title={book.title}
                  author={book.author}
                  price={`£${book.price.toFixed(2)}`}
                  rating={book.rating}
                  onSelect={clearSearch}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== MOBILE MENU ==================== */}
      <div className={`fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out sm:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link to="/">
              <img src="/logobrit.png" alt="BritBooks Logo" className="h-10" />
            </Link>
            <button onClick={toggleMobileMenu} className="p-2">
              <XIcon className="h-6 w-6 text-gray-700" />
            </button>
          </div>
          <nav className="flex flex-col p-4 space-y-4 text-lg font-medium">
            {navLinks}
          </nav>
          <div className="mt-auto p-4 border-t text-center text-red-600 font-bold">
            Phone 01234 567890
          </div>
        </div>
      </div>

      {/* Top Bar (Welcome + Account) */}
      <div className="bg-indigo-900 text-white px-4 py-1">
        <div className="container mx-auto flex justify-between items-center text-xs">
          <span>{user ? `Welcome back, ${user.fullName}!` : 'Sign in to explore more!'}</span>
          <nav className="flex space-x-4 md:space-x-6 items-center">
            {user ? (
              <>
                <Link to="/settings" className="hover:text-gray-300 flex items-center space-x-1">
                  <UserIcon className="w-5 h-5" />
                </Link>
                <Link to="/wishlist" className="hover:text-gray-300 flex items-center">
                  <BookmarkIcon className="w-5 h-5" />
                </Link>
                <button onClick={logout} className="hover:text-gray-300 focus:outline-none">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-300">Sign In</Link>
                <Link to="/signup" className="hover:text-gray-300">Register</Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* DESKTOP MIDDLE BAR */}
      <div className="bg-white px-1 py-1">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center relative">
          <div className="hidden sm:block absolute top-0 left-0 h-36 sm:h-40 z-10">
            <Link to="/" className="block w-auto h-full">
              <img src="/logobrit.png" alt="BritBooks Logo" className="h-full w-auto object-contain" />
            </Link>
          </div>
          
          <div className="hidden sm:block h-24 sm:h-24 w-44 sm:w-60 flex-shrink-0"></div>

          <div className="hidden sm:block w-full sm:max-w-lg mx-0 sm:mx-4 mt-2 sm:mt-0 relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search For Books"
                className="w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                value={searchQuery}
                onChange={handleInputChange}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <SearchIcon className="h-5 w-5 -mt-2" />
              </button>
            </div>
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full bg-white border border-gray-200 shadow-lg max-h-96 overflow-y-auto z-50 mt-2">
                {isLoading && <p className="p-4 text-gray-500 text-center">Loading...</p>}
                {error && <p className="p-4 text-red-500 text-center">{error}</p>}
                {!isLoading && !error && searchResults.length === 0 && (
                  <p className="p-4 text-gray-500 text-center">No results found.</p>
                )}
                {searchResults.map((book) => (
                  <SearchResultCard
                    key={book.id}
                    id={book.id}
                    imageUrl={book.imageUrl}
                    title={book.title}
                    author={book.author}
                    price={`£${book.price.toFixed(2)}`}
                    rating={book.rating}
                    onSelect={clearSearch}
                  />
                ))}
              </div>
            )}
          </div>

           <div className="hidden sm:block text-red-600 font-bold text-lg mt-2 sm:mt-0">
            📞 01234 567890
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t border-gray-200 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row sm:items-center h-12 sm:h-16 relative">
          <div className="hidden sm:block h-12 sm:h-16 w-44 sm:w-60 flex-shrink-0"></div>

          <nav className="hidden sm:flex flex-1 justify-between items-center font-medium text-gray-600">
            <div className="flex space-x-8">
              <Link to="/" className={`py-3 ${isActive('/') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}> Home </Link>
              
              {/* SHOP BY CATEGORY WITH MEGA MODAL (World of Books Style) */}
              <div 
                className="h-full flex items-center"
                onMouseEnter={() => setIsCategoryHovered(true)}
                onMouseLeave={() => setIsCategoryHovered(false)}
              >
                <Link 
                  to="/category" 
                  className={`py-3 flex items-center space-x-1 ${isActive('/category') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}
                >
                  <span>Shop by Category</span>
                  <ChevronDown className={`transition-transform duration-200 ${isCategoryHovered ? 'rotate-180' : ''}`} />
                </Link>

                {/* THE MEGA MODAL */}
                {isCategoryHovered && categories.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-4 gap-12 p-10">
                      {/* Sidebar Section */}
                      <div className="col-span-1 border-r border-gray-100 pr-8">
                        <h3 className="text-red-600 text-lg font-black mb-4 normal-case">Top Categories</h3>
                        <p className="text-gray-400 text-xs normal-case font-normal mb-6 leading-relaxed">
                          Discover thousands of used books across hundreds of genres.
                        </p>
                        <Link to="/category" className="bg-red-600 text-white px-4 py-2 rounded text-xs inline-block hover:bg-red-700 transition-colors uppercase font-bold tracking-wider">
                          View All
                        </Link>
                      </div>
                      
                      {/* Categories Grid Section */}
                      <div className="col-span-3 grid grid-cols-3 gap-y-4 gap-x-8">
                        {categories.map((cat) => (
                          <Link 
                            key={cat}
                            to={`/category?genre=${encodeURIComponent(cat)}`}
                            className="text-[13px] text-gray-600 hover:text-red-600 transition-colors font-medium normal-case flex items-center group"
                            onClick={() => setIsCategoryHovered(false)}
                          >
                            <span className="w-1 h-1 bg-red-600 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                            {cat}
                          </Link>
                        ))}
                      </div>
                    </div>
                    {/* Bottom Promo Strip */}
                    <div className="bg-gray-50 py-3 px-10 text-center border-t border-gray-100">
                      <span className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">Fast Delivery on all UK orders</span>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/popular-books" className={`py-3 ${isActive('/popular-books') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}> Popular Books </Link>
              <Link to="/new-arrivals" className={`py-3 ${isActive('/new-arrivals') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}> New Arrivals </Link>
              <Link to="/bestsellers" className={`py-3 ${isActive('/bestsellers') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}> Best Sellers </Link>
              <Link to="/clearance" className={`py-3 ${isActive('/clearance') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}> Clearance </Link>
              <Link to="/help" className={`py-3 ${isActive('/help') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}> Contact Us </Link>
            </div>
            <Link to="/checkout" className="flex items-center space-x-2 text-gray-700">
              <ShoppingCartIcon className="h-6 w-6 text-gray-600" />
              <span>Cart {cartCount} Items</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default TopBar;