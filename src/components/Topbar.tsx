"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { fetchCategories, CategoryNode } from "../data/books";
import toast from 'react-hot-toast';
import {
  Home, Grid3X3, TrendingUp, Sparkles, Trophy, Tag,
  MessageCircle, ChevronRight, Package, Heart as HeartIcon,
  Settings, LogOut, LogIn, UserPlus, Truck, Zap, Gift,
  Instagram, Twitter, Facebook, Mail
} from 'lucide-react';

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
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const [hoveredMainCat, setHoveredMainCat] = useState<CategoryNode | null>(null);

  // ─── NEW STATES FOR MOBILE CATEGORY DROPDOWN ───
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);

  const searchRef = useRef(null);
  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Optional: close category dropdown when closing main menu
    if (isMobileMenuOpen) setIsMobileCategoriesOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
        if (data.length > 0) setHoveredMainCat(data[0]);
      } catch (err) {
        console.error("Failed to load categories", err);
        toast.error("Failed to load categories");
        setCategories([]);
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
        fetch(`https://britbooks-api-production-8ebd.up.railway.app/api/market/search?keyword=${encodeURIComponent(searchQuery)}`)
          .then((response) => {
            if (!response.ok) throw new Error('Search request failed');
            return response.json();
          })
          .then((data) => {
            const results = Array.isArray(data) ? data : data.results || [];
            const mappedResults = results.map((book) => ({
              id: book._id || book.bookId || book.id || "unknown",
            
              imageUrl:
                book.coverImageUrl ||     // your DB field
                book.imageUrl ||
                book.coverImage ||
                book.thumbnail ||
                book.samplePageUrls?.[0] ||
                "https://via.placeholder.com/120x180?text=No+Cover",
            
              title: book.title || book.name || "Untitled",
              author: book.author || book.authors || "Unknown Author",
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


  return (
    <header className="sticky top-0 z-50">
      {/* ==================== MOBILE TOPBAR ==================== */}
      <div className="sm:hidden flex flex-col" style={{ boxShadow: '0 2px 16px rgba(10,22,40,0.10)' }}>

      

        {/* Main Bar */}
        <div className="bg-white flex items-center px-3 py-2.5 gap-2">
          {/* Hamburger */}
          <motion.button
            whileTap={{ scale: 0.84 }}
            onClick={toggleMobileMenu}
            className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0"
          >
            <MenuIcon className="h-5 w-5 text-gray-700" />
          </motion.button>

          {/* Logo - centred */}
          <div className="flex-1 flex justify-center">
            <Link to="/">
              <img src="/logobrit.png" alt="BritBooks" className="h-9 object-contain" />
            </Link>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.div whileTap={{ scale: 0.84 }}>
              <Link to="/wishlist" className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HeartIcon size={18} className="text-gray-600" />
              </Link>
            </motion.div>
            <motion.div whileTap={{ scale: 0.84 }}>
              <Link to="/checkout" className="w-10 h-10 rounded-2xl bg-[#0a1628] flex items-center justify-center relative">
                <ShoppingCartIcon className="h-5 w-5 text-white" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white px-3 pb-3" ref={searchRef}>
          <div className="relative">
            <SearchIcon className="absolute  -mt-24  left-3.5  -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search books, authors, genres…"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-2xl text-[13px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:bg-white transition-all"
              value={searchQuery}
              onChange={handleInputChange}
            />
            {searchQuery ? (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center"
              >
                <XIcon className="h-3 w-3 text-white" />
              </button>
            ) : null}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="absolute left-3 right-3 mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl max-h-96 overflow-y-auto z-40"
                style={{ boxShadow: '0 8px 32px rgba(10,22,40,0.14)' }}
              >
                {isLoading && (
                  <div className="p-5 flex items-center justify-center gap-3 text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0a1628] rounded-full animate-spin" />
                    <span className="text-sm font-medium">Searching…</span>
                  </div>
                )}
                {error && <p className="p-4 text-center text-red-500 text-sm">{error}</p>}
                {!isLoading && !error && searchResults.length === 0 && (
                  <p className="p-5 text-center text-gray-400 text-sm font-medium">No results found for "{searchQuery}"</p>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ==================== MOBILE MENU ==================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
              onClick={toggleMobileMenu}
            />

            {/* Drawer Panel */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-sm bg-white flex flex-col sm:hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <Link to="/" onClick={toggleMobileMenu}>
                  <img src="/logobrit.png" alt="BritBooks Logo" className="h-9" />
                </Link>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={toggleMobileMenu}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <XIcon className="h-5 w-5 text-gray-600" />
                </motion.button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">

                {/* User Account Strip */}
                <div className="px-5 py-4 bg-[#0a1628]">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#c9a84c] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0a1628] font-black text-sm">
                          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{user.fullName}</p>
                        <p className="text-[#c9a84c] text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        to="/login"
                        onClick={toggleMobileMenu}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] text-[#0a1628] font-black text-xs py-2.5 rounded-xl"
                      >
                        <LogIn size={14} /> Sign In
                      </Link>
                      <Link
                        to="/signup"
                        onClick={toggleMobileMenu}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white font-bold text-xs py-2.5 rounded-xl border border-white/20"
                      >
                        <UserPlus size={14} /> Register
                      </Link>
                    </div>
                  )}
                </div>

                {/* Flash Deal Ad Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mx-4 mt-4 rounded-2xl overflow-hidden relative"
                  style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96a 100%)' }}
                >
                  <Link to="/clearance" onClick={toggleMobileMenu} className="flex items-center p-4 gap-3">
                    <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap size={20} className="text-[#0a1628]" fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[#0a1628] font-black text-sm leading-tight">Flash Sale Live</p>
                      <p className="text-[#0a1628]/70 text-xs font-medium">Up to 60% off clearance titles</p>
                    </div>
                    <ChevronRight size={18} className="text-[#0a1628]/60 ml-auto flex-shrink-0" />
                  </Link>
                </motion.div>

                {/* Main Navigation */}
                <nav className="px-3 pt-4 pb-2">
                  <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Browse</p>

                  {[
                    { to: '/', icon: Home, label: 'Home', color: '#6366f1' },
                    { to: '/popular-books', icon: TrendingUp, label: 'Popular Books', color: '#10b981' },
                    { to: '/new-arrivals', icon: Sparkles, label: 'New Arrivals', color: '#f59e0b' },
                    { to: '/bestsellers', icon: Trophy, label: 'Best Sellers', color: '#ef4444' },
                    { to: '/clearance', icon: Tag, label: 'Clearance', color: '#8b5cf6' },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + idx * 0.05 }}
                    >
                      <Link
                        to={item.to}
                        onClick={toggleMobileMenu}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-colors ${
                          isActive(item.to) ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${item.color}18` }}
                        >
                          <item.icon size={16} style={{ color: item.color }} />
                        </div>
                        <span className="font-semibold text-sm">{item.label}</span>
                        {isActive(item.to) && <ChevronRight size={14} className="ml-auto text-red-400" />}
                      </Link>
                    </motion.div>
                  ))}

                  {/* Shop by Category Accordion */}
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.33 }}
                  >
                    <button
                      onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1 w-full hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-50">
                        <Grid3X3 size={16} className="text-orange-500" />
                      </div>
                      <span className="font-semibold text-sm">Shop by Category</span>
                      <motion.div
                        animate={{ rotate: isMobileCategoriesOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-auto"
                      >
                        <ChevronRight size={14} className="text-gray-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isMobileCategoriesOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-5 pb-2 flex flex-col gap-0.5">
                            {categories.map((cat, i) => (
                              <motion.div
                                key={cat.name}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                              >
                                <Link
                                  to={`/category?category=${encodeURIComponent(cat.name)}`}
                                  onClick={toggleMobileMenu}
                                  className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                  {cat.name}
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </nav>

                {/* Free Shipping Promo Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mx-4 mt-2 mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Truck size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-emerald-800 font-bold text-sm">Free Delivery</p>
                    <p className="text-emerald-600 text-xs">On orders of 4+ books. Always.</p>
                  </div>
                </motion.div>

                {/* Account Section */}
                {user && (
                  <nav className="px-3 pb-2">
                    <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My Account</p>
                    {[
                      { to: '/settings', icon: Settings, label: 'Account Settings', color: '#6b7280' },
                      { to: '/wishlist', icon: HeartIcon, label: 'Wishlist', color: '#ec4899' },
                      { to: '/orders', icon: Package, label: 'My Orders', color: '#3b82f6' },
                    ].map((item, idx) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={toggleMobileMenu}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1 hover:bg-gray-50 text-gray-700 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${item.color}18` }}
                        >
                          <item.icon size={16} style={{ color: item.color }} />
                        </div>
                        <span className="font-semibold text-sm">{item.label}</span>
                      </Link>
                    ))}
                    <button
                      onClick={() => { logout?.(); toggleMobileMenu(); }}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1 hover:bg-red-50 text-red-500 transition-colors w-full"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
                        <LogOut size={16} className="text-red-500" />
                      </div>
                      <span className="font-semibold text-sm">Sign Out</span>
                    </button>
                  </nav>
                )}

                {/* Help */}
                <nav className="px-3 pb-4">
                  <Link
                    to="/help"
                    onClick={toggleMobileMenu}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                      <MessageCircle size={16} className="text-blue-500" />
                    </div>
                    <span className="font-semibold text-sm">Contact Us</span>
                  </Link>
                </nav>
              </div>

              {/* Footer Strip */}
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <a
                  href="mailto:customercare@britbooks.co.uk"
                  className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-3"
                >
                  <Mail size={13} className="text-red-500" />
                  customercare@britbooks.co.uk
                </a>
                <div className="flex gap-4">
                  {[
                    { icon: Instagram, href: '#', color: '#e1306c' },
                    { icon: Twitter, href: '#', color: '#1da1f2' },
                    { icon: Facebook, href: '#', color: '#1877f2' },
                  ].map(({ icon: Icon, href, color }, i) => (
                    <motion.a
                      key={i}
                      href={href}
                      whileTap={{ scale: 0.88 }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-gray-200 shadow-sm"
                    >
                      <Icon size={15} style={{ color }} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Bar */}
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
                <button onClick={logout} className="hover:text-gray-300 focus:outline-none">Logout</button>
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
              <img src="/logobrit.png" alt="BritBooks Logo" className="h-full w-auto object-contain mt-7 ml-[5cm] " />
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
                  <SearchResultCard key={book.id} {...book} price={`£${book.price.toFixed(2)}`} onSelect={clearSearch} />
                ))}
              </div>
            )}
          </div>
          <div className="hidden sm:block text-blue-600 font-bold text-lg mt-2 sm:mt-0 flex items-center gap-2">
  📧 customercare@britbooks.co.uk  
</div>
        </div>
      </div>

      {/* Navigation & Modern Mega Modal */}
      <div className="bg-white border-t border-gray-200 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row sm:items-center h-12 sm:h-16 relative">

          {/* Keep this spacer so logo doesn't overlap nav */}
          <div className="hidden sm:block h-12 sm:h-16 w-44 sm:w-60 flex-shrink-0"></div>

          <nav className="hidden sm:flex flex-1 justify-center items-center font-medium text-gray-600">

            <div className="flex items-center justify-between w-full max-w-5xl">

              <div className="flex space-x-8">
                <Link to="/" className={`py-3 ${isActive('/') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  Home
                </Link>

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

                  {isCategoryHovered && categories.length > 0 && (
                    <div className="absolute top-full left-[-240px] w-[1000px] bg-white shadow-2xl z-[100] animate-in fade-in slide-in-from-top-1 duration-200 flex border border-gray-100 rounded-b-xl overflow-hidden min-h-[450px]">
                      
                      <div className="w-1/3 bg-gray-50/80 border-r border-gray-100">
                        <div className="py-4">
                          {categories.map((cat) => (
                            <div
                              key={cat.name}
                              onMouseEnter={() => setHoveredMainCat(cat)}
                              onClick={() => {
                                setIsCategoryHovered(false);
                                navigate(`/category?category=${encodeURIComponent(cat.name)}`);
                              }}
                              className={`px-8 py-3 cursor-pointer flex items-center justify-between transition-all ${
                                hoveredMainCat?.name === cat.name 
                                ? 'bg-white text-red-600 font-bold shadow-sm' 
                                : 'text-gray-600 hover:bg-white hover:text-red-500'
                              }`}
                            >
                              <span className="text-sm uppercase tracking-wide">{cat.name}</span>
                              <ChevronDown className="-rotate-90 w-3 h-3 opacity-40" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="w-2/3 p-10 flex flex-col justify-between bg-white">
                        <div>
                          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-8">
                            <h3 className="text-2xl font-serif italic text-gray-900">{hoveredMainCat?.name}</h3>
                            <Link 
                              to={`/category?category=${encodeURIComponent(hoveredMainCat?.name || '')}`}
                              className="text-xs font-bold text-red-600 uppercase tracking-widest hover:underline"
                              onClick={() => setIsCategoryHovered(false)}
                            >
                              View All {hoveredMainCat?.name}
                            </Link>
                          </div>

                          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                            {hoveredMainCat?.children?.map((sub) => (
                              <Link
                                key={sub.name}
                                to={`/category?category=${encodeURIComponent(hoveredMainCat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                                onClick={() => setIsCategoryHovered(false)}
                                className="text-gray-500 hover:text-red-600 transition-colors text-[15px] border-b border-transparent hover:border-red-100 py-1"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>

                        <div className="mt-12 p-6 bg-red-50 rounded-xl flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-red-600 font-bold text-sm">Monthly Recommendation</span>
                            <span className="text-gray-700 text-xs mt-1">Check out our best-selling {hoveredMainCat?.name} titles this week.</span>
                          </div>
                          <button className="bg-red-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
                            Shop Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/popular-books" className={`py-3 ${isActive('/popular-books') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  Popular Books
                </Link>
                <Link to="/new-arrivals" className={`py-3 ${isActive('/new-arrivals') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  New Arrivals
                </Link>
                <Link to="/bestsellers" className={`py-3 ${isActive('/bestsellers') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  Best Sellers
                </Link>
                <Link to="/clearance" className={`py-3 ${isActive('/clearance') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  Clearance
                </Link>
                <Link to="/help" className={`py-3 ${isActive('/help') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  Contact Us
                </Link>
              </div>

              <Link to="/checkout" className="flex items-center space-x-2 text-gray-700 whitespace-nowrap">
                <ShoppingCartIcon className="h-6 w-6 text-gray-600" />
                <span>Cart {cartCount} Items</span>
              </Link>

            </div>
          </nav>

        </div>
      </div>
    </header>
  );
};

export default TopBar;