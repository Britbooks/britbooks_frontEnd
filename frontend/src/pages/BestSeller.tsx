import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "../components/SEOHead";
import {
  ChevronLeft, ChevronRight, TrendingUp, X, Flame,
  BookOpen, Star, Crown, Truck, Sparkles, ArrowRight,
  SlidersHorizontal, Tag
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import BookCard from "../components/BookCard";
import GlobalSearchBar from "../components/GlobalSearchBar";

interface Book {
  _id?: string;
  id?: string;
  title: string;
  author: string;
  price: number | string;
  imageUrl?: string;
  category?: string;
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
              className="text-sm text-white/75 leading-relaxed mb-5 max-w-[280px]"
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
  const [heroBg] = useState(() => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/1600/900`);

  const BOOKS_PER_PAGE = 15;

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
    <div className="min-h-screen font-sans bg-[#f7f4ef]">
      <SEOHead
        title="Bestselling Books"
        description="Shop the bestselling books at BritBooks. The most popular titles chosen by thousands of readers — all at unbeatable prices with fast UK delivery."
        canonical="/bestsellers"
      />
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>

      <Toaster position="bottom-right" />
      <TopBar />

      {/* HERO */}
      <header
        className="relative pt-14 pb-12 px-6 md:px-8 overflow-hidden"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
            <div>
              <span className="text-white font-black uppercase tracking-[0.3em] mb-2 block">
                Britain's Best
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-xl">
                Bestsellers
              </h1>
            </div>
            <div className="w-full md:w-auto md:min-w-[380px] max-w-md">
              <GlobalSearchBar variant="light" placeholder="Search bestsellers…" />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="w-full px-4 sm:px-6 lg:px-10 pt-10 pb-32">
        <div className="flex gap-8 xl:gap-12 items-start">

          {/* SIDEBAR */}
          <aside className="hidden lg:flex flex-col gap-2 w-52 xl:w-60 flex-shrink-0 sticky top-24">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Filter by genre</span>
            </div>

            <button
              onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-left transition-all ${
                !selectedCategory ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-white"
              }`}
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              All Genres
            </button>

            {categories.length === 0
              ? Array(8).fill(0).map((_, i) => (
                  <div key={i} className="h-10 rounded-2xl" style={{
                    width: `${70 + (i % 3) * 10}%`,
                    background: "linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s ease infinite",
                  }} />
                ))
              : categories.map((cat) => (
                  <button key={cat.id}
                    onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-left transition-all ${
                      selectedCategory === cat.name ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-white"
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))
            }

            {selectedCategory && (
              <button onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                className="flex items-center gap-2 mt-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear filter
              </button>
            )}
          </aside>

          {/* MAIN */}
          <div className="flex-1 min-w-0">
            {books.length === 0 && isLoading ? (
              <div className="flex justify-center items-center py-32">
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#0a1628", animation: "spin 0.75s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : books.length === 0 ? (
              <div className="py-24 flex flex-col items-center gap-4 text-center">
                <Crown className="w-12 h-12 text-gray-200" />
                <p className="font-black text-gray-700">No books found</p>
                <button onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                  className="bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-2xl">Reset</button>
              </div>
            ) : (
              <div style={{ opacity: isLoading ? 0.45 : 1, transition: "opacity 0.2s ease", pointerEvents: isLoading ? "none" : "auto" }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                  {books.map((book, index) => {
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
                        <div className={`absolute -top-3 -left-2 z-30 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border shadow-sm transition-all duration-200 group-hover:scale-110 ${
                          isTop3
                            ? "bg-[#dc2626] text-white border-[#dc2626]"
                            : "bg-white text-[#0a1628]/60 border-gray-200 group-hover:bg-[#0a1628] group-hover:text-white"
                        }`}>
                          #{rank}
                        </div>
                        {isTop3 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                            <Crown className="w-3.5 h-3.5 text-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                        <BookCard
                          id={book._id || book.id || ""}
                          img={book.imageUrl || ""}
                          title={book.title}
                          author={book.author}
                          price={typeof book.price === "number" ? `£${book.price.toFixed(2)}` : book.price}
                          category={book.category}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="mt-16 flex justify-center gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0); }}
                  className="flex items-center gap-1.5 h-11 px-5 rounded-2xl bg-gray-100 text-sm font-bold text-gray-500 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="w-11 h-11 rounded-2xl bg-[#0a1628] text-white flex items-center justify-center text-sm font-black shadow-lg">
                  {currentPage}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0); }}
                  className="flex items-center gap-1.5 h-11 px-5 rounded-2xl bg-gray-100 text-sm font-bold text-gray-500 disabled:opacity-30"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BestsellersPage;
