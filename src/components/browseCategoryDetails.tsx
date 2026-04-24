"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import SEOHead, { buildBookSchema, buildBreadcrumbSchema } from "./SEOHead";
import ReviewSection from "./ReviewSection";
import { getListingReviewSummary } from "../services/reviewService";
import {
  Heart, Facebook, Twitter, Instagram,
  ChevronLeft, ChevronRight, ShoppingCart,
  ShoppingBag, Star, Package, BookOpen,
  Share2, Check, Minus, Plus, X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useCart } from "../context/cartContext";
import { Book, fetchBooks } from "../data/books";
import { generatePlaceholderImage } from "../data/books";
import { useRecentlyViewed } from "../context/viewManager";
import BookCard from "./BookCard";
import { useWishlist } from "../context/wishlistContext";

const FALLBACK = "https://placehold.co/300x450?text=Book+Cover";

/* ─────────────────────────────────────────────────────────────────
   STAR RATING
───────────────────────────────────────────────────────────────── */
const Stars = ({ rating = 0, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24"
        fill={i < Math.round(rating) ? "currentColor" : "none"}
        stroke={i < Math.round(rating) ? "#facc15" : "#d1d5db"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={i < Math.round(rating) ? "text-yellow-400" : "text-gray-300"}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   BOOK SHELF (horizontal scroll on mobile, grid on desktop)
───────────────────────────────────────────────────────────────── */
const BookShelf = ({ title, fetchParams, currentBookId }: {
  title: string; fetchParams: any; currentBookId: string;
}) => {
  const [books, setBooks]   = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const perPage = 5;

  useEffect(() => {
    setLoading(true);
    fetchBooks({ page: 1, limit: 10, ...fetchParams })
      .then(({ listings }) => {
        setBooks((Array.isArray(listings) ? listings : []).filter(b => b?.id && b.id !== currentBookId));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchParams, currentBookId]);

  const totalPages = Math.ceil(books.length / perPage);
  const visible    = books.slice((page - 1) * perPage, page * perPage);

  if (loading) return (
    <section className="py-5">
      <p className="text-sm font-black text-[#0a1628] mb-3">{title}</p>
      {/* Mobile skeleton strip */}
      <div className="flex gap-3 overflow-hidden sm:hidden">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-28 animate-pulse space-y-2">
            <div className="aspect-[2/3] bg-gray-200 rounded-2xl" />
            <div className="h-2.5 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
      {/* Desktop skeleton */}
      <div className="hidden sm:grid grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="aspect-[2/3] bg-gray-200 rounded-xl" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );

  if (!books.length) return null;

  return (
    <section className="py-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-black text-[#0a1628] uppercase tracking-wider">{title}</p>
        <div className="hidden sm:flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 disabled:opacity-30">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-400 px-1">{page}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 disabled:opacity-30">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="sm:hidden -mx-4 px-4 overflow-x-auto flex gap-3 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {books.map(book => (
          <div key={book.id} className="flex-shrink-0 w-28">
            <BookCard
              id={book.id}
              img={book.imageUrl}
              title={book.title}
              author={book.author}
              price={`£${typeof book.price === "number" ? book.price.toFixed(2) : book.price}`}
            />
          </div>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden sm:grid grid-cols-3 md:grid-cols-5 gap-4">
        {visible.map(book => (
          <BookCard
            key={book.id}
            id={book.id}
            img={book.imageUrl}
            title={book.title}
            author={book.author}
            price={`£${typeof book.price === "number" ? book.price.toFixed(2) : book.price}`}
          />
        ))}
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MOBILE LOADING SKELETON
───────────────────────────────────────────────────────────────── */
const MobileSkeleton = () => (
  <div className="sm:hidden animate-pulse">
    {/* Hero */}
    <div className="h-72 bg-gray-200" />
    <div className="px-4 pt-5 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-4/5" />
      <div className="h-4 bg-gray-200 rounded w-2/5" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        <div className="h-6 bg-gray-200 rounded-full w-16" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-1/3 mt-2" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
const BrowseCategoryDetail = () => {
  const { id }        = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const location      = useLocation();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToRecentlyViewed } = useRecentlyViewed();

  const [book, setBook]         = useState<Book | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "info" | "reviews">("details");
  const [imgErr, setImgErr]     = useState(false);
  const [added, setAdded]       = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating]     = useState(0);

  const inWishlist = book ? isInWishlist(book.id) : false;
  const previousCategory = (location.state as { category?: string })?.category || "Browse";

  /* fetch book */
  useEffect(() => {
    setLoading(true);
    axios.get(`https://britbooks-api-production-8ebd.up.railway.app/api/market/${id}`)
      .then(({ data }) => {
        if (!data.success || !data.listing) throw new Error("not found");
        const d = data.listing;
        const placeholder = generatePlaceholderImage({ title: d.title, isbn: d.isbn || d.title, category: d.category });
        let title = (d.title || "Untitled").trim().replace(/\s*\(\d+\)$/, "");
        setBook({
          id: String(d._id || d.id),
          title,
          author: d.author || "Unknown Author",
          price: d.price || 0,
          imageUrl: d.coverImageUrl || placeholder,
          category: d.category || "General",
          condition: d.condition || "Good",
          description: typeof d.notes === "string" ? d.notes.trim() : "",
          stock: d.stock ?? 1,
          rating: d.rating || 4.5,
          isbn: d.isbn || "",
          pages: d.pages || 300,
          releaseDate: d.listedAt || "",
        });
      })
      .catch(() => { setError("Failed to load book details."); toast.error("Book not found"); })
      .finally(() => setLoading(false));
  }, [id]);

  /* recently viewed */
  useEffect(() => {
    if (book) addToRecentlyViewed({ id: book.id, img: book.imageUrl || generatePlaceholderImage(book), title: book.title, author: book.author, price: `£${book.price.toFixed(2)}` });
  }, [book]);

  /* review summary — load alongside book, update header rating */
  useEffect(() => {
    if (!id) return;
    getListingReviewSummary(id)
      .then((s) => { setAvgRating(s.averageRating); setReviewCount(s.reviewCount); })
      .catch(() => {});
  }, [id]);

  const handleAddToCart = () => {
    if (!book) return;
    addToCart({ id: book.id, img: book.imageUrl || FALLBACK, title: book.title, author: book.author, price: `£${book.price.toFixed(2)}`, quantity });
    toast.success(`${quantity} × ${book.title} added!`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    if (!book) return;
    inWishlist ? removeFromWishlist(book.id) : addToWishlist({ id: book.id, img: book.imageUrl, title: book.title, author: book.author, price: `£${book.price.toFixed(2)}` });
  };

  /* ── LOADING ── */
  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <TopBar />
      <MobileSkeleton />
      {/* Desktop skeleton */}
      <div className="hidden sm:block container mx-auto px-4 sm:px-8 py-8 animate-pulse">
        <div className="flex gap-8">
          <div className="w-1/3 aspect-[2/3] bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-4 pt-2">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="flex gap-3 pt-4">
              <div className="h-12 bg-gray-200 rounded-xl w-36" />
              <div className="h-12 bg-gray-200 rounded-xl w-36" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  /* ── ERROR ── */
  if (error || !book) return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <TopBar />
      <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
          <BookOpen className="w-7 h-7 text-gray-300" />
        </div>
        <p className="text-gray-800 font-black text-lg mb-1">Book not found</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={() => navigate("/category")}
          className="bg-[#0a1628] text-white font-bold px-6 py-3 rounded-2xl text-sm">
          Back to Browse
        </button>
      </div>
      <Footer />
    </div>
  );

  const cover = imgErr ? FALLBACK : book.imageUrl;

  const bookDesc = book.description
    ? book.description.slice(0, 160)
    : `Buy "${book.title}" by ${book.author} — ${book.condition ?? "Good"} condition, only £${book.price.toFixed(2)}. Fast UK delivery from BritBooks.`;

  const seoStructuredData = [
    ...buildBookSchema({
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      image: book.imageUrl,
      isbn: book.isbn,
      price: book.price,
      condition: book.condition,
      availability: book.stock > 0 ? "InStock" : "OutOfStock",
      category: book.category,
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Browse", url: "/category" },
      ...(book.category ? [{ name: book.category, url: `/category` }] : []),
      { name: book.title, url: `/browse/${book.id}` },
    ]),
  ];

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <SEOHead
        title={`${book.title} by ${book.author}`}
        description={bookDesc}
        canonical={`/browse/${book.id}`}
        image={book.imageUrl}
        type="book"
        structuredData={seoStructuredData}
      />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <TopBar />

      {/* ══════════════════════════════════════════════════════
          MOBILE LAYOUT
      ══════════════════════════════════════════════════════ */}
      <div className="sm:hidden">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden" style={{ minHeight: 340 }}>
          {/* Blurred bg */}
          <div className="absolute inset-0 scale-110">
            <img src={cover} alt="" className="w-full h-full object-cover" onError={() => setImgErr(true)} />
            <div className="absolute inset-0 bg-[#0a1628]/75 backdrop-blur-xl" />
          </div>

          {/* Top nav */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest truncate mx-3 max-w-[160px]">
              {book.category}
            </span>
            <button
              onClick={handleWishlist}
              className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
              style={{ background: inWishlist ? "#c9a84c" : "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Heart size={17} className={inWishlist ? "fill-[#0a1628] text-[#0a1628]" : "text-white"} />
            </button>
          </div>

          {/* Cover */}
          <div className="relative z-10 flex justify-center pt-4 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="w-36 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10" style={{ aspectRatio: "2/3" }}>
                <img
                  src={cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={() => setImgErr(true)}
                  loading="lazy"
                />
              </div>
              {/* Condition badge */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#c9a84c] text-[#0a1628] text-[9px] font-black px-3 py-1 rounded-full shadow-md">
                {book.condition}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── MAIN INFO CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 -mt-5 mx-3 bg-white rounded-[24px] shadow-xl border border-gray-100 px-5 pt-6 pb-5"
        >
          {/* Stock */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
              book.stock > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            }`}>
              {book.stock > 0 ? `In Stock` : "Out of Stock"}
            </span>
            {book.isbn && (
              <span className="text-[10px] text-gray-400 font-medium">ISBN {book.isbn}</span>
            )}
          </div>

          {/* Title + author */}
          <h1 className="text-xl font-black text-gray-900 leading-tight tracking-tight mb-1 line-clamp-3">
            {book.title}
          </h1>
          <p className="text-sm text-gray-400 font-medium mb-3">by {book.author}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <Stars rating={avgRating} size={15} />
            <span className="text-xs font-bold text-gray-500">{avgRating > 0 ? avgRating.toFixed(1) : "No rating"}</span>
            <span className="text-xs text-gray-400">{reviewCount > 0 ? `(${reviewCount} review${reviewCount !== 1 ? "s" : ""})` : ""}</span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-5">
            <span className="text-3xl font-black text-[#0a1628]">£{book.price.toFixed(2)}</span>
          </div>

          {/* Qty stepper */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</span>
            <div className="flex items-center gap-0 bg-gray-100 rounded-2xl p-1">
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center disabled:opacity-30">
                <Minus size={14} className="text-gray-700" />
              </motion.button>
              <span className="w-10 text-center text-sm font-black text-gray-800">{quantity}</span>
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => setQuantity(q => Math.min(book.stock, q + 1))}
                disabled={quantity >= book.stock}
                className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center disabled:opacity-30">
                <Plus size={14} className="text-gray-700" />
              </motion.button>
            </div>
          </div>

          {/* Share */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-semibold">Share</span>
            {[
              { icon: <Facebook size={14} />, href: "#" },
              { icon: <Twitter size={14} />, href: "#" },
              { icon: <Instagram size={14} />, href: "#" },
            ].map((s, i) => (
              <a key={i} href={s.href}
                className="w-8 h-8 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
                {s.icon}
              </a>
            ))}
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-3 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Tab pills */}
          <div className="flex gap-1 p-1.5 bg-gray-50 border-b border-gray-100">
            {(["details", "info", "reviews"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  activeTab === tab
                    ? "bg-white text-[#0a1628] shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "reviews" ? `Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}` : tab === "info" ? "Info" : tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="px-5 py-4 text-sm text-gray-600 leading-relaxed"
            >
              {activeTab === "details" && (
                <p>{book.description || "No description available for this book."}</p>
              )}
              {activeTab === "info" && (
                <div className="space-y-3">
                  {[
                    { label: "ISBN", value: book.isbn || "N/A" },
                    { label: "Pages", value: book.pages || "N/A" },
                    { label: "Category", value: book.category || "N/A" },
                    { label: "Condition", value: book.condition || "N/A" },
                    { label: "Listed", value: book.releaseDate ? new Date(book.releaseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider">{label}</span>
                      <span className="text-sm font-semibold text-gray-700 text-right max-w-[60%] truncate">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="py-2">
                  <ReviewSection listingId={id!} variant="mobile" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── RELATED SHELVES ── */}
        <div className="mx-3 mt-4 pb-32 space-y-2">
          <BookShelf
            title="You may also like"
            fetchParams={{ category: book.category, sort: "purchases", order: "desc", limit: 10 }}
            currentBookId={id!}
          />
          <BookShelf
            title={`More in ${book.category}`}
            fetchParams={{ category: book.category, sort: "listedAt", order: "desc", limit: 10 }}
            currentBookId={id!}
          />
        </div>

        {/* ── STICKY BOTTOM BAR ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-white border-t border-gray-100"
          style={{ boxShadow: "0 -8px 32px rgba(10,22,40,0.10)" }}>
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleWishlist}
              className="w-13 h-13 w-12 h-12 flex-shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: inWishlist ? "#c9a84c" : "#e5e7eb",
                background: inWishlist ? "#c9a84c" : "white",
              }}
            >
              <Heart
                size={18}
                className={inWishlist ? "fill-[#0a1628] text-[#0a1628]" : "text-gray-400"}
              />
            </motion.button>

            {/* Add to basket */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={book.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-40"
              style={{ background: added ? "#16a34a" : "#0a1628", color: "white" }}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span key="added" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2">
                    <Check size={17} /> Added to basket
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2">
                    <ShoppingBag size={17} />
                    {book.stock === 0 ? "Out of Stock" : `Add to Basket · £${(book.price * quantity).toFixed(2)}`}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP LAYOUT (unchanged)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden sm:block">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center justify-end gap-2 text-sm font-medium">
              <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600 transition">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Home
              </Link>
              <ChevronRight size={14} className="text-gray-300" />
              <Link to={`/category?category=${encodeURIComponent(book.category)}`}
                className="text-gray-500 hover:text-blue-600 capitalize transition">
                {book.category}
              </Link>
              <ChevronRight size={14} className="text-gray-300" />
              <span className="text-gray-900 font-semibold truncate max-w-xs">{book.title}</span>
            </nav>
          </div>
        </div>

        <main className="container mx-auto px-4 sm:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              {cover === FALLBACK ? (
                <div className="w-full h-80 bg-gray-200 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-500 text-center p-4">
                  <div>
                    <div className="text-4xl font-bold mb-2">No Cover</div>
                    <div className="text-sm">Book Cover Unavailable</div>
                  </div>
                </div>
              ) : (
                <img src={cover} alt={book.title}
                  className="w-full h-80 object-contain rounded-lg shadow-sm"
                  onError={() => setImgErr(true)} loading="lazy" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{book.title}</h1>
              <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
              <div className="flex items-center mb-3 text-sm gap-2">
                <Stars rating={avgRating} />
                <button onClick={() => setActiveTab("reviews")} className="text-gray-500 hover:text-[#0a1628] underline">
                  {avgRating > 0 ? `${avgRating.toFixed(1)} · ${reviewCount} review${reviewCount !== 1 ? "s" : ""}` : "No reviews yet"}
                </button>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-3">£{book.price.toFixed(2)}</p>
              <div className="text-sm mb-3">
                <span className={`font-semibold ${book.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                  {book.stock > 0 ? "IN STOCK" : "OUT OF STOCK"}
                </span>
                <span className="text-gray-500 ml-2">ISBN: {book.isbn || `BBW0${book.id}`}</span>
              </div>
              {book.description ? (
                <p className="text-gray-600 leading-relaxed mb-3">{book.description.slice(0, 150)}{book.description.length > 150 && "..."}</p>
              ) : (
                <p className="text-gray-400 italic mb-3">No description available.</p>
              )}
              <div className="mb-3">
                <span className="font-semibold">Condition: </span>
                <span className="text-gray-700">{book.condition}</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center">
                  <span className="mr-2 font-semibold text-gray-700">Qty:</span>
                  <div className="flex items-center border rounded">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-2 py-1 text-base hover:bg-gray-100">-</button>
                    <input type="text" value={quantity} readOnly className="w-10 text-center border-l border-r focus:outline-none py-1" />
                    <button onClick={() => setQuantity(q => Math.min(book.stock, q + 1))} className="px-2 py-1 text-base hover:bg-gray-100" disabled={quantity >= book.stock}>+</button>
                  </div>
                </div>
                <button onClick={handleAddToCart} disabled={book.stock === 0}
                  className="bg-red-600 text-white font-bold px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50">
                  <ShoppingCart size={16} /> ADD TO BASKET
                </button>
              </div>
              <div className="flex items-center gap-6 mb-3">
                <button onClick={handleWishlist} className="flex items-center text-gray-600 hover:text-red-600">
                  <Heart size={18} className="mr-1" /> Add to Wish List
                </button>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-semibold mr-2">Share</span>
                  <div className="flex gap-2">
                    <a href="#" className="p-1 rounded-full border hover:bg-gray-100"><Facebook size={14} /></a>
                    <a href="#" className="p-1 rounded-full border hover:bg-gray-100"><Twitter size={14} /></a>
                    <a href="#" className="p-1 rounded-full border hover:bg-gray-100"><Instagram size={14} /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border rounded-md">
            <div className="border-b bg-gray-50 rounded-t-md">
              <nav className="flex space-x-1 p-2">
                {(["details", "info", "reviews"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === tab ? "bg-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>
                    {tab === "details" ? "Details" : tab === "info" ? "Additional Information" : `Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}`}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4 text-gray-600 leading-relaxed">
              {activeTab === "details" && <p>{book.description || "No description available."}</p>}
              {activeTab === "info" && (
                <ul className="space-y-2">
                  <li><span className="font-semibold">ISBN:</span> {book.isbn || "N/A"}</li>
                  <li><span className="font-semibold">Pages:</span> {book.pages || "N/A"}</li>
                  <li><span className="font-semibold">Release Date:</span> {book.releaseDate ? String(book.releaseDate).split("T")[0] : "N/A"}</li>
                  <li><span className="font-semibold">Category:</span> {book.category || "N/A"}</li>
                </ul>
              )}
              {activeTab === "reviews" && (
                <ReviewSection listingId={id!} variant="desktop" />
              )}
            </div>
          </div>

          <BookShelf title="You may also like"
            fetchParams={{ category: book.category, sort: "purchases", order: "desc", limit: 10 }}
            currentBookId={id!} />
          <BookShelf title="Related Products"
            fetchParams={{ category: book.category || "General", sort: "listedAt", order: "desc", limit: 10 }}
            currentBookId={id!} />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default BrowseCategoryDetail;
