import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "../components/SEOHead";
import {
  ChevronLeft, ChevronRight, TrendingUp, X, Flame,
  BookOpen, Star, Crown, Truck, Sparkles, ArrowRight
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import BookCard from "../components/BookCard";

interface Book {
  _id?: string;
  id?: string;
  title: string;
  author: string;
  price: number | string;
  imageUrl?: string;
}

/* ────────────────────────────────────────────────────────────────
   AD DATA
──────────────────────────────────────────────────────────────── */
const VIDEO_AD =
  "https://media.istockphoto.com/id/1359537152/video/open-book-with-flying-pages-on-background-with-bokeh.mp4?s=mp4-640x640-is&k=20&c=K0WuxONJAeYOqEiJRIzYRVToD8dCedQI9mUHkNnHvDI=";

const HERO_ADS = [
  {
    type: "picture" as const,
    tag: "☀️  Summer Sale",
    headline: "40% Off\nClassic Fiction",
    sub: "Hand-picked titles, brilliantly priced this summer.",
    cta: "Shop the sale",
    img: "https://media.istockphoto.com/id/1147544807/photo/books-on-a-shelf.jpg?s=612x612&w=0&k=20&c=xITyFpfEqFyJZ7TDmgKCo5lWxkCPBYqnJbLkFbS3xZA=",
  },
  {
    type: "video" as const,
    tag: "🔥  Trending Now",
    headline: "Britain's\nHottest Reads",
    sub: "Updated daily based on real UK sales data.",
    cta: "Browse the list",
    video: VIDEO_AD,
  },
  {
    type: "picture" as const,
    tag: "📚  Staff Picks",
    headline: "Our Team's\nFavourites",
    sub: "Curated by Britain's most passionate book lovers.",
    cta: "Browse picks",
    img: "https://media.istockphoto.com/id/2227776949/photo/preschool-teacher-in-classroom-greeting-new-student.jpg?s=612x612&w=0&k=20&c=MNTCY2-12ywiOfbG5DFN2sxJ-VuGSIegSU6oGB9GMh8=",
  },
  {
    type: "animated" as const,
    tag: "🚚  Free Delivery",
    headline: "Free UK\nDelivery",
    sub: "On every order over £15 — no discount code needed.",
    cta: "Start shopping",
    bg: "#004225",
  },
  {
    type: "picture" as const,
    tag: "⭐  New Arrivals",
    headline: "Fresh Off\nthe Press",
    sub: "This week's most anticipated new releases.",
    cta: "See new arrivals",
    img: "https://media.istockphoto.com/id/509690394/photo/old-books-in-the-library.jpg?s=612x612&w=0&k=20&c=0QMhGHB8P6GlKBJzMqAcGgRdxjbXnHB0nZRLIuFoqpw=",
  },
];

type Ad = (typeof HERO_ADS)[number];
const AD_DURATION = 5000; // ms per slide

/* ────────────────────────────────────────────────────────────────
   AD CAROUSEL
──────────────────────────────────────────────────────────────── */
function AdCarousel() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimers = (idx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += 100 / (AD_DURATION / 50);
      setProgress(Math.min(p, 100));
    }, 50);
    intervalRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % HERO_ADS.length;
        startTimers(next);
        return next;
      });
    }, AD_DURATION);
  };

  useEffect(() => {
    startTimers(0);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const goTo = (i: number) => {
    setActive(i);
    startTimers(i);
  };

  const ad = HERO_ADS[active];

  return (
    <div className="relative h-full w-full rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 select-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-30 h-[3px] bg-white/10">
        <motion.div
          className="h-full bg-[#c9a84c]"
          style={{ width: `${progress}%` }}
          transition={{ ease: "linear" }}
        />
      </div>

      {/* Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* Background layer */}
          {ad.type === "video" && (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay muted loop playsInline
              src={(ad as Extract<Ad, { type: "video" }>).video}
            />
          )}
          {ad.type === "picture" && (
            <img
              className="absolute inset-0 w-full h-full object-cover"
              src={(ad as Extract<Ad, { type: "picture" }>).img}
              alt={ad.headline.replace("\n", " ")}
            />
          )}
          {ad.type === "animated" && (
            <div
              className="absolute inset-0"
              style={{ background: (ad as Extract<Ad, { type: "animated" }>).bg }}
            >
              {/* Animated orbs */}
              {[
                { w: 260, h: 260, x: "-20%", y: "-20%", d: 4 },
                { w: 200, h: 200, x: "60%", y: "50%", d: 6 },
                { w: 150, h: 150, x: "10%", y: "60%", d: 5 },
              ].map((orb, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-[#c9a84c]/20 blur-3xl"
                  style={{ width: orb.w, height: orb.h, left: orb.x, top: orb.y }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: orb.d, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
              {/* Floating book icons */}
              {["📖", "📚", "✨", "🏆", "📕"].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl opacity-20 select-none"
                  style={{
                    left: `${15 + i * 18}%`,
                    top: `${10 + (i % 3) * 25}%`,
                  }}
                  animate={{ y: [0, -18, 0], rotate: [0, i % 2 === 0 ? 8 : -8, 0] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/95 via-[#0a1628]/40 to-[#0a1628]/10" />

          {/* Ad content */}
          <div className="absolute inset-0 flex flex-col justify-end p-7">
            {/* Tag pill */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center self-start gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3.5 py-1.5 mb-4"
            >
              <span className="text-[11px] font-bold text-white/90 tracking-wide">{ad.tag}</span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl font-black text-white leading-[1.08] tracking-tight mb-2 whitespace-pre-line"
            >
              {ad.headline}
            </motion.h2>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-white/55 leading-relaxed mb-5 max-w-[280px]"
            >
              {ad.sub}
            </motion.p>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="self-start flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#c9a84c]/25"
            >
              {ad.cta} <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* "AD" label */}
          <div className="absolute top-4 right-4 text-[9px] font-black text-white/25 tracking-widest uppercase">Ad</div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots + arrows */}
      <div className="absolute bottom-4 right-5 z-30 flex items-center gap-3">
        {/* Prev/Next */}
        <button
          onClick={() => goTo((active - 1 + HERO_ADS.length) % HERO_ADS.length)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-white" />
        </button>
        <div className="flex items-center gap-1.5">
          {HERO_ADS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${i === active ? "w-5 h-1.5 bg-[#c9a84c]" : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50"}`}
            />
          ))}
        </div>
        <button
          onClick={() => goTo((active + 1) % HERO_ADS.length)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

const BookCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-[#e8e0d0] p-3 space-y-3 animate-pulse">
    <div className="aspect-[2/3] bg-[#f5f0e8] rounded-xl" />
    <div className="h-3.5 bg-[#f5f0e8] w-3/4 rounded" />
    <div className="h-3 bg-[#f5f0e8] w-1/2 rounded" />
  </div>
);

const BestsellersPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const location = useLocation();
  const [totalBooks, setTotalBooks] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentBestsellers, setRecentBestsellers] = useState<Book[]>([]);

  const BOOKS_PER_PAGE = 12;

  useEffect(() => {
    const fetchBestsellers = async () => {
      setIsLoading(true);
      try {
        const reqBody = {
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          shelf: "bestSellers",
          sort: "purchases",
          order: "desc",
          ...(selectedCategory && { category: selectedCategory }),
        };
        const response = await fetchBooks(reqBody);
        setBooks(Array.isArray(response?.listings) ? response.listings : []);
        setTotalBooks(response?.meta?.count || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBestsellers();
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    const fetchRecentTop = async () => {
      try {
        const response = await fetchBooks({ page: 1, limit: 5, shelf: "bestSellers", sort: "purchases", order: "desc" });
        if (Array.isArray(response?.listings)) setRecentBestsellers(response.listings);
      } catch (err) {
        console.error("Failed to fetch recent bestsellers", err);
      }
    };
    fetchRecentTop();
  }, []);

  useEffect(() => {
    if (recentBestsellers.length === 0) return;
    const showPopup = () => {
      toast(
        (t) => (
          <div className="w-72">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-[#c9a84c]" />
                <span className="font-bold text-sm text-[#0a1628]">Trending this week</span>
              </div>
              <button onClick={() => toast.dismiss(t.id)} className="text-[#0a1628]/30 hover:text-[#0a1628]/60">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-[#0a1628]/40 mb-3">Britain's five hottest reads right now:</p>
            <ul className="space-y-1.5 text-sm">
              {recentBestsellers.map((book, i) => (
                <li key={book._id || book.id} className="flex items-center gap-2">
                  <span className="font-black text-[#c9a84c] w-5 text-right text-xs">#{i + 1}</span>
                  <span className="font-semibold text-[#0a1628] truncate text-xs">{book.title}</span>
                  <span className="text-[#0a1628]/40 text-xs italic truncate">— {book.author}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-[#e8e0d0] text-[10px] text-[#0a1628]/40 font-medium">
              Updated daily · See full list below
            </div>
          </div>
        ),
        {
          duration: 8000,
          position: "bottom-right",
          style: {
            background: "#fff",
            border: "1px solid #e8e0d0",
            borderRadius: 16,
            boxShadow: "0 20px 40px -8px rgba(10,22,40,0.15)",
            padding: 16,
          },
        }
      );
    };
    showPopup();
    const interval = setInterval(showPopup, 45000);
    return () => clearInterval(interval);
  }, [recentBestsellers]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const fetched = await fetchCategories();
        setCategories(fetched.map((cat) => ({ id: cat._id, name: cat.name })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategoryData();
  }, []);

  const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#f5f0e8" }}>
      <SEOHead
        title="Bestselling Books"
        description="Shop the bestselling books at BritBooks. The most popular titles chosen by thousands of readers — all at unbeatable prices with fast UK delivery."
        canonical="/bestsellers"
      />
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Toaster position="bottom-right" />
      <TopBar />

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <header className="relative bg-[#0a1628] overflow-hidden">
        {/* Subtle grid watermark */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 80px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 80px)",
          }}
        />
        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 text-center relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-10">
            <Link to="/" className="text-white/30 hover:text-white/60 transition-colors">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-[#c9a84c]">Bestsellers</span>
          </nav>

          {/* Crown icon */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
              <Crown className="w-7 h-7 text-[#c9a84c]" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 border border-[#c9a84c]/25 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-6">
              <span className="text-base">🇬🇧</span>
              <span className="text-xs text-[#c9a84c] font-semibold tracking-wide">Britain's best reads</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            </div>

            <h1 className="text-5xl sm:text-6xl xl:text-[72px] font-black text-white tracking-[-0.03em] leading-[1.02] mb-5">
              The Nation's<br />
              <span className="text-[#c9a84c]">Favourites.</span>
            </h1>
            <p className="text-white/40 text-base md:text-lg max-w-lg mx-auto">
              Britain's most-loved books, ranked by real readers. Updated daily.
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
            className="flex items-center justify-center gap-8 mt-12 pt-10 border-t border-white/8"
          >
            {[
              { icon: <BookOpen className="w-3.5 h-3.5" />, val: "Daily", label: "new arrivals" },
              { icon: <Star className="w-3.5 h-3.5" />, val: "4.8★", label: "avg. rating" },
              { icon: <TrendingUp className="w-3.5 h-3.5" />, val: "Daily", label: "updated" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-[#c9a84c]">
                  {s.icon}
                  <span className="text-sm font-black text-white">{s.val}</span>
                </div>
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom curve into cream */}
        <div className="absolute bottom-0 left-0 right-0 h-10" style={{ backgroundColor: "#f5f0e8", clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </header>

      {/* ══════════════════════════════════════════════════════
          CATEGORY FILTER
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-6">
        <div className="sticky top-4 z-40 flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#e8e0d0] shadow-lg shadow-[#0a1628]/8 px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            <button
              onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                !selectedCategory
                  ? "bg-[#0a1628] text-white shadow-md"
                  : "text-[#0a1628]/50 hover:text-[#0a1628] hover:bg-[#f5f0e8]"
              }`}
            >
              All Genres
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.name
                    ? "bg-[#c9a84c] text-[#0a1628] shadow-md"
                    : "text-[#0a1628]/50 hover:text-[#0a1628] hover:bg-[#f5f0e8]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {selectedCategory && (
            <button
              onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
              className="shrink-0 flex items-center gap-1.5 text-xs text-[#0a1628]/40 hover:text-[#0a1628] transition-colors pl-3 border-l border-[#e8e0d0]"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          BOOKS GRID
      ══════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 pb-28">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-[#0a1628]/10" />
          <p className="text-[10px] font-bold text-[#0a1628]/40 uppercase tracking-[0.15em]">
            {selectedCategory ? `${selectedCategory} · ` : ""}
            {isLoading ? "Loading…" : selectedCategory || "All Best Sellers"}
          </p>
          <div className="h-px flex-1 bg-[#0a1628]/10" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
          {isLoading
            ? [...Array(12)].map((_, i) => <BookCardSkeleton key={i} />)
            : books.map((book, index) => {
                const rank = (currentPage - 1) * BOOKS_PER_PAGE + index + 1;
                const isTop3 = rank <= 3;
                return (
                  <motion.div
                    key={book.id || book._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="relative group"
                  >
                    {/* Rank badge */}
                    <div
                      className={`absolute -top-3 -left-2 z-30 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border shadow-sm transition-all duration-200 group-hover:scale-110 ${
                        isTop3
                          ? "bg-[#c9a84c] text-[#0a1628] border-[#c9a84c] shadow-[#c9a84c]/30"
                          : "bg-white text-[#0a1628]/60 border-[#e8e0d0] group-hover:bg-[#0a1628] group-hover:text-white group-hover:border-[#0a1628]"
                      }`}
                    >
                      #{rank}
                    </div>
                    {/* Top-3 crown indicator */}
                    {isTop3 && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                        <Crown className="w-3.5 h-3.5 text-[#c9a84c] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <BookCard
                      id={book._id || book.id || ""}
                      img={book.imageUrl || ""}
                      title={book.title}
                      author={book.author}
                      price={typeof book.price === "number" ? `£${book.price.toFixed(2)}` : book.price}
                    />
                  </motion.div>
                );
              })}
        </div>

        {/* ══════════════════════════════════════════════════════
            PAGINATION
        ══════════════════════════════════════════════════════ */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-20 flex justify-center">
            <nav className="inline-flex items-center gap-1 p-1.5 bg-white border border-[#e8e0d0] rounded-2xl shadow-md shadow-[#0a1628]/8">
              <button
                onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl hover:bg-[#f5f0e8] disabled:opacity-20 transition-all text-[#0a1628]"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "…" ? (
                      <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-[#0a1628]/30 font-bold">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => { setCurrentPage(item as number); window.scrollTo(0, 0); }}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          currentPage === item
                            ? "bg-[#0a1628] text-white shadow-sm"
                            : "text-[#0a1628]/50 hover:bg-[#f5f0e8] hover:text-[#0a1628]"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl hover:bg-[#f5f0e8] disabled:opacity-20 transition-all text-[#0a1628]"
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BestsellersPage;
