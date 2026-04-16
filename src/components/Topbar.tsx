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
  ShoppingBag, Settings, LogOut, LogIn, UserPlus, Truck, Zap, Gift,
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const [hoveredMainCat, setHoveredMainCat] = useState<CategoryNode | null>(null);
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

      {/* ═══════════════════════════════════════════════
          MOBILE TOPBAR — navy bar + popover menu
      ═══════════════════════════════════════════════ */}
      <div className="sm:hidden">

        {/* ── Main bar ── */}
        <div
          className="relative bg-white flex items-center px-4 py-2.5"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}
        >
          {/* Left: menu button */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={toggleMobileMenu}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: isMobileMenuOpen ? '#0a1628' : '#f3f4f6' }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.span key="x"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.13 }}
                  className="flex items-center justify-center"
                >
                  <XIcon className="h-4 w-4 text-white" />
                </motion.span>
              ) : (
                <motion.span key="menu"
                  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.13 }}
                  className="flex items-center justify-center"
                >
                  <MenuIcon className="h-4 w-4 text-gray-700" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Centre: logo — truly centred with flex */}
          <div className="flex-1 flex justify-center">
            <Link to="/">
              <img src="/logobrit.png" alt="BritBooks" className="h-9 w-auto object-contain" />
            </Link>
          </div>

          {/* Right: search + cart */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={() => setMobileSearchOpen(v => !v)}
              className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center"
            >
              <SearchIcon className="h-4 w-4 text-gray-600" />
            </motion.button>

            <motion.div whileTap={{ scale: 0.82 }} className="relative">
              <Link to="/checkout"
                className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-gray-700" />
              </Link>
              {cartCount > 0 && (
                <span className="pointer-events-none absolute -top-1 -right-1 min-w-[17px] h-[17px] px-0.5 rounded-full bg-[#c9a84c] text-black text-[9px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── Expandable search bar ── */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              key="mobilesearch"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden bg-white border-b border-gray-100"
              ref={searchRef}
            >
              <div className="px-4 py-3">
                <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3 gap-2">
                  <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search books, authors…"
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                    value={searchQuery}
                    onChange={handleInputChange}
                  />
                  {searchQuery && (
                    <button onClick={clearSearch}>
                      <XIcon className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Search results */}
                {searchQuery.trim() && (
                  <div className="mt-2 bg-white rounded-2xl border border-gray-100 overflow-hidden max-h-64 overflow-y-auto"
                    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}>
                    {isLoading && (
                      <div className="p-4 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-[#0a1628] rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Searching…</span>
                      </div>
                    )}
                    {error && <p className="p-4 text-center text-red-500 text-sm">{error}</p>}
                    {!isLoading && !error && searchResults.length === 0 && (
                      <p className="p-4 text-center text-gray-400 text-sm">No results for "{searchQuery}"</p>
                    )}
                    {searchResults.map((book) => (
                      <SearchResultCard key={book.id} id={book.id} imageUrl={book.imageUrl}
                        title={book.title} author={book.author}
                        price={`£${book.price.toFixed(2)}`} rating={book.rating}
                        onSelect={() => { clearSearch(); setMobileSearchOpen(false); }} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── POPOVER MENU — pops from the menu button (top-right origin) ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Tap-away backdrop */}
              <motion.div
                key="pop-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-40"
                onClick={toggleMobileMenu}
              />

              {/* Popover card — scales from top-right (menu button corner) */}
              <motion.div
                key="pop-menu"
                initial={{ opacity: 0, scale: 0.72, y: -8 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                exit={{   opacity: 0, scale: 0.72, y: -8  }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                style={{
                  transformOrigin: 'top right',
                  boxShadow: '0 20px 60px rgba(10,22,40,0.28), 0 4px 16px rgba(10,22,40,0.12)',
                }}
                className="fixed top-[58px] left-3 right-3 z-50 bg-white rounded-3xl overflow-hidden"
              >
                {/* Scrollable inner */}
                <div className="overflow-y-auto" style={{ maxHeight: '82vh' }}>

                  {/* User strip */}
                  <div className="bg-[#0a1628] px-4 py-4 flex items-center gap-3">
                    {user ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#c9a84c] flex items-center justify-center flex-shrink-0">
                          <span className="text-[#0a1628] font-black text-sm">
                            {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{user.fullName}</p>
                          <p className="text-[#c9a84c] text-xs truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => { logout?.(); toggleMobileMenu(); }}
                          className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                        >
                          <LogOut size={11} /> Sign out
                        </button>
                      </>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Link to="/login" onClick={toggleMobileMenu}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[#c9a84c] text-black font-black text-sm py-2.5 rounded-xl">
                          <LogIn size={14} /> Sign In
                        </Link>
                        <Link to="/signup" onClick={toggleMobileMenu}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 text-green font-bold text-sm py-2.5 rounded-xl border border-white/20">
                          <UserPlus size={14} /> Register
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Flash sale banner */}
                  <div className="p-3">
                    <Link to="/clearance" onClick={toggleMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c96a)' }}>
                      <div className="w-8 h-8 bg-black/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap size={16} className="text-black" fill="currentColor" />
                      </div>
                      <div className="flex-1">
                        <p className="text-black font-black text-xs">Flash Sale — Up to 60% off</p>
                        <p className="text-black/60 text-[10px] font-medium mt-0.5">Clearance titles. No codes needed.</p>
                      </div>
                      <ChevronRight size={14} className="text-black/40 flex-shrink-0" />
                    </Link>
                  </div>

                  {/* Quick nav — 3-column icon grid */}
                  <div className="px-3 pb-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Quick Access</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { to: '/',              icon: Home,          label: 'Home',         bg: '#eef2ff', color: '#6366f1' },
                        { to: '/popular-books', icon: TrendingUp,    label: 'Popular',      bg: '#ecfdf5', color: '#10b981' },
                        { to: '/new-arrivals',  icon: Sparkles,      label: 'New In',       bg: '#fffbeb', color: '#f59e0b' },
                        { to: '/bestsellers',   icon: Trophy,        label: 'Best Sellers', bg: '#fef2f2', color: '#ef4444' },
                        { to: '/clearance',     icon: Tag,           label: 'Clearance',    bg: '#f5f3ff', color: '#8b5cf6' },
                        { to: '/category',      icon: Grid3X3,       label: 'Categories',   bg: '#fff7ed', color: '#f97316' },
                        { to: '/wishlist',      icon: HeartIcon,     label: 'Wishlist',     bg: '#fdf2f8', color: '#ec4899' },
                        { to: '/checkout',      icon: Package,       label: 'Basket',       bg: '#f0fdf4', color: '#22c55e' },
                        { to: '/help',          icon: MessageCircle, label: 'Support',      bg: '#f0f9ff', color: '#0ea5e9' },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={toggleMobileMenu}
                          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl active:opacity-70 transition-opacity"
                          style={{ background: item.bg }}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: `${item.color}22` }}>
                            <item.icon size={15} style={{ color: item.color }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Shop by Category list */}
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Shop by Category</p>
                    <div className="bg-gray-50 rounded-2xl overflow-hidden divide-y divide-gray-100">
                      {categories.slice(0, 7).map((cat) => (
                        <Link
                          key={cat.name}
                          to={`/category?category=${encodeURIComponent(cat.name)}`}
                          onClick={toggleMobileMenu}
                          className="flex items-center justify-between px-4 py-3 active:bg-gray-100 transition-colors"
                        >
                          <span className="text-xs font-semibold text-gray-700">{cat.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400">{cat.count}</span>
                            <ChevronRight size={12} className="text-gray-300" />
                          </div>
                        </Link>
                      ))}
                      {categories.length > 7 && (
                        <Link to="/category" onClick={toggleMobileMenu}
                          className="flex items-center justify-center gap-1 px-4 py-3 text-xs font-bold text-[#c9a84c]">
                          View all <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 mt-2">
                    <a href="mailto:customercare@britbooks.co.uk"
                      className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                      <Mail size={11} /> customercare@britbooks.co.uk
                    </a>
                    <div className="flex gap-1.5">
                      {[
                        { icon: Instagram, color: '#e1306c' },
                        { icon: Twitter,   color: '#1da1f2' },
                        { icon: Facebook,  color: '#1877f2' },
                      ].map(({ icon: Icon, color }, i) => (
                        <div key={i} className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Icon size={13} style={{ color }} />
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Top Bar — desktop only */}
      <div className="hidden sm:block bg-indigo-900 text-white px-4 py-1">
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
      <div className="hidden sm:block bg-white px-1 py-1">
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

      {/* Navigation & Modern Mega Modal — desktop only */}
      <div className="hidden sm:block bg-white border-t border-gray-200 px-4">
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