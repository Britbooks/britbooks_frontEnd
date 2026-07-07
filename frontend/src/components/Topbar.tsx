"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
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
  const navigate      = useNavigate();
  const numericPrice  = typeof price === "string" ? parseFloat(price.replace("£", "")) : Number(price) || 0;
  const [added, setAdded] = React.useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, img: imageUrl, title, author, price: `£${numericPrice.toFixed(2)}`, quantity: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast.success(`${title} added to basket!`, { duration: 2000 });
  };

  const handleNav = (e) => {
    e.preventDefault();
    if (id && id !== 'unknown') { navigate(`/browse/${id}`); onSelect(); }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
      onMouseDown={handleNav}
    >
      {/* Cover */}
      <div className="flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-sm"
        style={{ width: 44, height: 62 }}>
        <img
          src={imageUrl || "https://via.placeholder.com/120x180?text=📚"}
          alt={title}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/120x180?text=📚"; }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-red-600 transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">by {author}</p>
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <svg key={i} width="10" height="10" viewBox="0 0 24 24"
              fill={i < Math.round(rating) ? "#fbbf24" : "none"}
              stroke={i < Math.round(rating) ? "#fbbf24" : "#d1d5db"}
              strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
          <span className="text-[10px] text-gray-400 ml-0.5">{Number(rating || 0).toFixed(1)}</span>
        </div>
      </div>

      {/* Price + Add */}
      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        <span className="text-[14px] font-black text-gray-900">£{numericPrice.toFixed(2)}</span>
        <button
          onMouseDown={handleAddToCart}
          title={added ? 'Added!' : 'Add to basket'}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={added
            ? { background: '#16a34a', color: 'white' }
            : { background: '#dc2626', color: 'white' }
          }
        >
          {added
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <ShoppingBag size={14} />
          }
        </button>
      </div>
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

  const searchRef     = useRef(null);
  const searchPillRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused]   = useState(false);
  const [searchDropPos, setSearchDropPos]   = useState<{ top: number; left: number; width: number } | null>(null);

  const repositionDrop = useCallback(() => {
    if (!searchPillRef.current) return;
    const r = searchPillRef.current.getBoundingClientRect();
    setSearchDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (searchFocused && searchQuery.trim()) repositionDrop();
  }, [searchFocused, searchQuery, repositionDrop]);

  useEffect(() => {
    if (!searchFocused) return;
    window.addEventListener('scroll', repositionDrop, true);
    window.addEventListener('resize', repositionDrop);
    return () => {
      window.removeEventListener('scroll', repositionDrop, true);
      window.removeEventListener('resize', repositionDrop);
    };
  }, [searchFocused, repositionDrop]);

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
      const insidePill   = searchRef.current?.contains(event.target);
      const insidePortal = document.getElementById('topbar-search-portal')?.contains(event.target);
      if (!insidePill && !insidePortal) {
        clearSearch();
        setSearchFocused(false);
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
      <div className="md:hidden">

        {/* ── Main bar ── */}
        <div
          className="relative bg-white flex items-center px-4 h-14"
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
              <img src="/logobrit.png" alt="BritBooks" className="h-12 w-auto object-contain" />
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
                    <Link to="/special-offers" onClick={toggleMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c96a)' }}>
                      <div className="w-8 h-8 bg-black/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap size={16} className="text-black" fill="currentColor" />
                      </div>
                      <div className="flex-1">
                        <p className="text-black font-black text-xs">Special Offers — Great Deals</p>
                        <p className="text-black/60 text-[10px] font-medium mt-0.5">Spin, scratch &amp; win discount codes.</p>
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
                        { to: '/special-offers', icon: Tag,           label: 'Offers',       bg: '#f5f3ff', color: '#8b5cf6' },
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
                          <ChevronRight size={12} className="text-gray-300" />
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
      <div className="hidden md:block bg-indigo-900 text-white px-4 py-1">
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
      <div className="hidden md:block bg-white px-1 py-1">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center relative">
          <div className="hidden md:block absolute top-0 left-0 h-36 sm:h-40 z-10">
            <Link to="/" className="block w-auto h-full">
              <img src="/logobrit.png" alt="BritBooks Logo" className="h-full w-auto object-contain" />
            </Link>
          </div>
          <div className="hidden md:block h-24 sm:h-24 w-44 xl:w-60 flex-shrink-0"></div>
          {/* ── Animated desktop search ── */}
          <div className="hidden md:flex items-center justify-center flex-1 mx-4 mt-2 sm:mt-0" ref={searchRef}>
            <motion.div
              ref={searchPillRef}
              animate={{ width: searchFocused ? 560 : 380 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{ position: 'relative' }}
            >
              <div
                className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 cursor-text transition-shadow duration-200"
                style={searchFocused ? {
                  background: '#fff',
                  border: '1.5px solid #dc2626',
                  boxShadow: '0 0 0 3px rgba(220,38,38,0.10), 0 4px 20px rgba(0,0,0,0.08)',
                } : {
                  background: '#f3f4f6',
                  border: '1.5px solid transparent',
                  boxShadow: 'none',
                }}
                onClick={() => { setSearchFocused(true); (searchRef.current as any)?.querySelector('input')?.focus(); }}
              >
                <motion.div animate={{ scale: searchFocused ? 1 : 0.9 }} transition={{ duration: 0.15 }}>
                  <SearchIcon
                    className="h-4 w-4 flex-shrink-0 transition-colors duration-200"
                    style={{ color: searchFocused ? '#dc2626' : '#9ca3af' }}
                  />
                </motion.div>
                <input
                  type="text"
                  placeholder="Search books, authors, genres…"
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.12 }}
                      onClick={e => { e.stopPropagation(); clearSearch(); }}
                      className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                    >
                      <XIcon className="h-3 w-3 text-gray-500" />
                    </motion.button>
                  )}
                </AnimatePresence>
                {isLoading && (
                  <motion.div
                    className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-red-500 flex-shrink-0"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  />
                )}
              </div>
            </motion.div>
          </div>
          <div className="hidden xl:flex text-blue-600 font-bold text-lg mt-2 sm:mt-0 items-center gap-2">
  📧 customercare@britbooks.co.uk
</div>
        </div>
      </div>

      {/* Navigation & Modern Mega Modal — desktop only */}
      <div className="hidden md:block bg-white border-t border-gray-200 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row sm:items-center h-12 sm:h-16 relative">

          {/* Keep this spacer so logo doesn't overlap nav */}
          <div className="hidden md:block h-12 sm:h-16 w-44 xl:w-60 flex-shrink-0"></div>

          <nav className="hidden md:flex flex-1 justify-center items-center font-medium text-gray-600">

            <div className="flex items-center justify-between w-full max-w-5xl">

              <div className="flex space-x-4 xl:space-x-8">
                <Link to="/" className={`py-3 whitespace-nowrap ${isActive('/') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  Home
                </Link>

                <div
                  className="h-full flex items-center"
                  onMouseEnter={() => setIsCategoryHovered(true)}
                  onMouseLeave={() => setIsCategoryHovered(false)}
                >
                  <Link
                    to="/category"
                    className={`py-3 flex items-center space-x-1 whitespace-nowrap ${isActive('/category') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}
                  >
                    <span>Shop by Category</span>
                    <ChevronDown className={`transition-transform duration-200 ${isCategoryHovered ? 'rotate-180' : ''}`} />
                  </Link>

                  <AnimatePresence>
                  {isCategoryHovered && categories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute top-full left-0 right-0 mx-auto w-[min(1280px,96vw)] z-[100] flex rounded-2xl overflow-hidden"
                      style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)', height: 'clamp(460px, calc(100vh - 150px), 660px)' }}
                    >
                      {/* Left sidebar — dark */}
                      <div className="w-[260px] flex-shrink-0 flex flex-col min-h-0 rounded-l-2xl overflow-hidden" style={{ background: '#1c1c2e' }}>
                        <div className="px-6 pt-6 pb-3 border-b border-white/10">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Browse</p>
                        </div>
                        <div className="flex-1 min-h-0 pt-2 pb-4 overflow-y-auto">
                          {categories.map((cat) => (
                            <div
                              key={cat.name}
                              onMouseEnter={() => setHoveredMainCat(cat)}
                              onClick={() => {
                                setIsCategoryHovered(false);
                                navigate(`/category?category=${encodeURIComponent(cat.name)}`);
                              }}
                              className="group relative cursor-pointer"
                            >
                              <div className={`mx-3 my-0.5 px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-150 ${
                                hoveredMainCat?.name === cat.name
                                  ? 'bg-red-600 text-white'
                                  : 'text-white/70 hover:bg-white/8 hover:text-white'
                              }`}>
                                <span className="text-[13px] font-medium tracking-wide">{cat.name}</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-6 py-4 border-t border-white/10">
                          <Link
                            to="/category"
                            onClick={() => setIsCategoryHovered(false)}
                            className="text-xs text-white/40 hover:text-white/70 transition-colors"
                          >
                            View all categories →
                          </Link>
                        </div>
                      </div>

                      {/* Right panel — white */}
                      <div className="flex-1 min-h-0 bg-white flex flex-col rounded-r-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-10 pt-7 pb-5 border-b border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500 mb-1">Category</p>
                            <h3 className="text-xl font-bold text-gray-900">{hoveredMainCat?.name || 'Select a category'}</h3>
                          </div>
                          {hoveredMainCat && (
                            <Link
                              to={`/category?category=${encodeURIComponent(hoveredMainCat.name)}`}
                              onClick={() => setIsCategoryHovered(false)}
                              className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-full px-4 py-1.5 transition-all"
                            >
                              View All <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        {/* Subcategory grid */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-10 py-7">
                          {hoveredMainCat?.children?.length ? (
                            <div className="grid grid-cols-2 gap-x-10 gap-y-1">
                              {hoveredMainCat.children.map((sub) => (
                                <Link
                                  key={sub.name}
                                  to={`/category?category=${encodeURIComponent(hoveredMainCat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                                  onClick={() => setIsCategoryHovered(false)}
                                  className="group flex items-center gap-2.5 py-2 text-[13px] text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-red-400 transition-colors flex-shrink-0" />
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Hover a category to explore subcategories</p>
                          )}
                        </div>

                        {/* Bottom CTA banner */}
                        <div className="mx-10 mb-7 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #2d1b4e 100%)' }}>
                          <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                              <p className="text-white font-bold text-sm">Free UK Delivery</p>
                              <p className="text-white/60 text-xs mt-0.5">On all orders over £10</p>
                            </div>
                            <Link
                              to="/category"
                              onClick={() => setIsCategoryHovered(false)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Shop Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>

                <Link to="/popular-books" className={`py-3 whitespace-nowrap ${isActive('/popular-books') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  Popular Books
                </Link>
                <Link to="/new-arrivals" className={`py-3 whitespace-nowrap ${isActive('/new-arrivals') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  New Arrivals
                </Link>
                <Link to="/bestsellers" className={`py-3 whitespace-nowrap ${isActive('/bestsellers') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
                  Best Sellers
                </Link>
                <Link to="/help" className={`py-3 whitespace-nowrap ${isActive('/help') ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}`}>
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
      {/* ── Desktop search results portal ── */}
      {searchFocused && searchQuery.trim() && searchDropPos && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            id="topbar-search-portal"
            key="topbar-drop"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: searchDropPos.top,
              left: Math.max(12, searchDropPos.left + searchDropPos.width / 2 - 260),
              width: 520,
              zIndex: 99999,
              borderRadius: 20,
              background: '#fff',
              boxShadow: '0 32px 80px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - ' + (searchDropPos.top + 16) + 'px)',
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100" style={{ borderRadius: '20px 20px 0 0', background: '#fff' }}>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                {isLoading ? 'Searching…' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
              </p>
              <span className="text-[10px] text-gray-300 font-medium">britbooks.co.uk</span>
            </div>

            {/* Body */}
            {isLoading && searchResults.length === 0 ? (
              <div className="px-5 py-3 space-y-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="rounded-xl bg-gray-100 animate-pulse flex-shrink-0" style={{ width: 44, height: 62 }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded-lg animate-pulse w-1/2" />
                      <div className="h-2.5 bg-gray-100 rounded-lg animate-pulse w-1/3" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="h-4 w-12 bg-gray-100 rounded-lg animate-pulse" />
                      <div className="h-7 w-16 bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="px-5 py-8 text-center">
                <p className="text-red-500 text-sm font-semibold">Something went wrong</p>
                <p className="text-gray-400 text-xs mt-1">Please try again</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <SearchIcon className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-gray-700 text-sm font-bold">No results for "{searchQuery}"</p>
                <p className="text-gray-400 text-xs mt-1">Try a different title, author or ISBN</p>
              </div>
            ) : (
              <ul style={{ overflowY: 'auto', flex: 1, minHeight: 0 }} className="divide-y divide-gray-50">
                {searchResults.map((book, i) => (
                  <motion.li
                    key={book.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.045, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <SearchResultCard
                      {...book}
                      price={`£${Number(book.price).toFixed(2)}`}
                      onSelect={() => { clearSearch(); setSearchFocused(false); }}
                    />
                  </motion.li>
                ))}
              </ul>
            )}

            {/* Footer */}
            {!isLoading && searchResults.length > 0 && (
              <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 flex items-center justify-between" style={{ borderRadius: '0 0 20px 20px', background: '#fff' }}>
                <p className="text-[10px] text-gray-400">Click a title to view full details</p>
                <button
                  onMouseDown={() => { clearSearch(); setSearchFocused(false); navigate(`/category?search=${encodeURIComponent(searchQuery)}`); }}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  See all results →
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};

export default TopBar;