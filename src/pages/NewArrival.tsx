import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, X, Sparkles,
  PackageOpen, ArrowRight, BookOpen, TrendingUp, SlidersHorizontal, Tag
} from "lucide-react";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import BookCard from "../components/BookCard";
import SEOHead from "../components/SEOHead";
import GlobalSearchBar from "../components/GlobalSearchBar";

const priceStr = (p: any) => (typeof p === "number" ? `£${p.toFixed(2)}` : p ?? "");

/* ─────────────────────────────────────────────────────────────────
   MARQUEE
───────────────────────────────────────────────────────────────── */
function Marquee({ items }: { items: string[] }) {
  const text = items.length ? items : Array(12).fill("New Arrivals");
  const rep  = [...text, ...text];
  return (
    <div className="overflow-hidden select-none">
      <motion.div
        className="flex items-center whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
      >
        {rep.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-[11px] font-bold text-white/35 uppercase tracking-widest px-5">
            <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />{t}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   COUNTER
───────────────────────────────────────────────────────────────── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => {
    if (!inView) return;
    let n = 0;
    const step = target / 50;
    const id = setInterval(() => {
      n += step;
      if (n >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(n));
    }, 25);
    return () => clearInterval(id);
  }, [inView, target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────────
   DELIVERY SCENE — floating books + road + animated truck
───────────────────────────────────────────────────────────────── */
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=300&q=80",
];

/* Truck SVG — side view, pointing right */
function TruckSVG({ scale = 1 }: { scale?: number }) {
  const w = 210 * scale;
  const h = 72 * scale;
  return (
    <svg width={w} height={h} viewBox="0 0 210 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trailer body */}
      <rect x="2" y="6" width="136" height="46" rx="5" fill="#0f2040" stroke="#c9a84c" strokeWidth="1.5"/>
      {/* Trailer panel lines */}
      <line x1="2" y1="29" x2="138" y2="29" stroke="#c9a84c" strokeWidth="0.6" strokeOpacity="0.3"/>
      <line x1="46" y1="6" x2="46" y2="52" stroke="#c9a84c" strokeWidth="0.6" strokeOpacity="0.2"/>
      <line x1="92" y1="6" x2="92" y2="52" stroke="#c9a84c" strokeWidth="0.6" strokeOpacity="0.2"/>
      {/* Book icon on trailer */}
      <rect x="52" y="13" width="32" height="22" rx="3" fill="#c9a84c" fillOpacity="0.12" stroke="#c9a84c" strokeWidth="0.8" strokeOpacity="0.4"/>
      <text x="59" y="28" fontSize="11" fill="#c9a84c" fillOpacity="0.7" fontFamily="serif">📚</text>
      {/* Cab body */}
      <rect x="138" y="14" width="58" height="38" rx="5" fill="#132038"/>
      {/* Cab roof */}
      <path d="M142 14 Q160 2 196 14" fill="#132038" stroke="#c9a84c" strokeWidth="1" strokeOpacity="0.5"/>
      {/* Windshield */}
      <rect x="155" y="18" width="34" height="22" rx="3" fill="#3b82f6" fillOpacity="0.45" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.5"/>
      {/* Cab-trailer join */}
      <rect x="136" y="18" width="6" height="34" rx="2" fill="#0a1628"/>
      {/* Front bumper */}
      <rect x="193" y="44" width="14" height="7" rx="2" fill="#c9a84c" fillOpacity="0.7"/>
      {/* Headlight */}
      <ellipse cx="203" cy="36" rx="5" ry="4" fill="#fbbf24" fillOpacity="0.9"/>
      <ellipse cx="203" cy="36" rx="2.5" ry="2" fill="#fef9c3"/>
      {/* Exhaust stack */}
      <rect x="141" y="0" width="5" height="16" rx="2.5" fill="#374151"/>
      {/* Smoke puffs from exhaust */}
      <motion.circle cx="143" cy="-4" r="4" fill="white" fillOpacity="0.12"
        animate={{ y: [-4, -18], opacity: [0.12, 0], scale: [1, 2] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut", delay: 0 }} />
      <motion.circle cx="145" cy="-2" r="2.5" fill="white" fillOpacity="0.1"
        animate={{ y: [-2, -14], opacity: [0.1, 0], scale: [1, 1.8] }}
        transition={{ repeat: Infinity, duration: 1.0, ease: "easeOut", delay: 0.4 }} />

      {/* Rear wheel */}
      <circle cx="32" cy="58" r="13" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
      <circle cx="32" cy="58" r="6" fill="#0f172a"/>
      <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        style={{ transformOrigin: "32px 58px" }}>
        <line x1="32" y1="45" x2="32" y2="71" stroke="#475569" strokeWidth="1.5"/>
        <line x1="19" y1="58" x2="45" y2="58" stroke="#475569" strokeWidth="1.5"/>
        <line x1="23" y1="49" x2="41" y2="67" stroke="#475569" strokeWidth="1"/>
        <line x1="41" y1="49" x2="23" y2="67" stroke="#475569" strokeWidth="1"/>
      </motion.g>

      {/* Middle wheel */}
      <circle cx="108" cy="58" r="13" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
      <circle cx="108" cy="58" r="6" fill="#0f172a"/>
      <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        style={{ transformOrigin: "108px 58px" }}>
        <line x1="108" y1="45" x2="108" y2="71" stroke="#475569" strokeWidth="1.5"/>
        <line x1="95" y1="58" x2="121" y2="58" stroke="#475569" strokeWidth="1.5"/>
        <line x1="99" y1="49" x2="117" y2="67" stroke="#475569" strokeWidth="1"/>
        <line x1="117" y1="49" x2="99" y2="67" stroke="#475569" strokeWidth="1"/>
      </motion.g>

      {/* Front wheel */}
      <circle cx="178" cy="58" r="13" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
      <circle cx="178" cy="58" r="6" fill="#0f172a"/>
      <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        style={{ transformOrigin: "178px 58px" }}>
        <line x1="178" y1="45" x2="178" y2="71" stroke="#475569" strokeWidth="1.5"/>
        <line x1="165" y1="58" x2="191" y2="58" stroke="#475569" strokeWidth="1.5"/>
        <line x1="169" y1="49" x2="187" y2="67" stroke="#475569" strokeWidth="1"/>
        <line x1="187" y1="49" x2="169" y2="67" stroke="#475569" strokeWidth="1"/>
      </motion.g>
    </svg>
  );
}

/* Road with animated dashes */
function Road({ width }: { width: number }) {
  const dashCount = Math.ceil(width / 48) + 2;
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ width, height: 32, background: "#1e293b" }}>
      {/* Road edge lines */}
      <div className="absolute top-1.5 left-0 right-0 h-px bg-white/10" />
      <div className="absolute bottom-1.5 left-0 right-0 h-px bg-white/10" />
      {/* Animated center dashes */}
      <div className="absolute inset-0 flex items-center overflow-hidden">
        <motion.div
          className="flex items-center gap-6 flex-shrink-0"
          animate={{ x: ["0%", `-${100 / 2}%`] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
          style={{ width: `${dashCount * 48 * 2}px` }}
        >
          {Array(dashCount * 2).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0 h-[3px] w-8 rounded-full bg-[#c9a84c] opacity-50" />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function DeliveryScene({ covers }: { covers: string[] }) {
  const imgs = covers.length >= 5 ? covers.slice(0, 5) : [
    ...covers, ...PLACEHOLDERS.slice(covers.length, 5),
  ];

  const desktopCards = [
    { rotate: -22, x: -130, y: 20,  z: 10, scale: 0.72, dur: 4.5, del: 0 },
    { rotate: -10, x: -60,  y: -20, z: 20, scale: 0.86, dur: 3.9, del: 0.3 },
    { rotate:  2,  x:  20,  y: -38, z: 40, scale: 1,    dur: 4.2, del: 0.6 },
    { rotate: 13, x:  100, y: -16, z: 30, scale: 0.84, dur: 4.8, del: 0.9 },
    { rotate: 24, x:  168, y: 18,  z: 15, scale: 0.70, dur: 3.7, del: 1.2 },
  ];

  const mobileCards = [
    { rotate: -14, x: -55, y: 8,  z: 10, scale: 0.82, dur: 4.2, del: 0 },
    { rotate:  4,  x:  10, y: -18, z: 30, scale: 1,   dur: 3.8, del: 0.6 },
    { rotate: 18, x:  72, y: 16,  z: 20, scale: 0.78, dur: 4.6, del: 1.1 },
  ];

  const BookItem = ({ c, img, i, bookW }: { c: typeof desktopCards[0]; img: string; i: number; bookW: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 50, rotate: c.rotate * 0.3 }}
      animate={{ opacity: 1, y: 0, rotate: c.rotate }}
      transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute", left: "50%", top: "50%", zIndex: c.z,
        transform: `translateX(calc(-50% + ${c.x}px)) translateY(calc(-50% + ${c.y}px)) rotate(${c.rotate}deg) scale(${c.scale})`,
      }}
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: c.dur, ease: "easeInOut", delay: c.del }}
        className="relative"
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15"
          style={{ width: bookW, aspectRatio: "2/3" }}>
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy"
            onError={e => { e.currentTarget.src = PLACEHOLDERS[i % PLACEHOLDERS.length]; }} />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/18 to-transparent pointer-events-none" />
      </motion.div>
    </motion.div>
  );

  return (
    <>
      {/* ── DESKTOP ── */}
      <div className="hidden lg:flex flex-col items-center gap-0">
        {/* Books area */}
        <div className="relative" style={{ width: 420, height: 300 }}>
          {desktopCards.map((c, i) => <BookItem key={i} c={c} img={imgs[i]} i={i} bookW={116} />)}
          <div className="absolute inset-0 -z-10 blur-3xl opacity-25"
            style={{ background: "radial-gradient(ellipse at center, #c9a84c 0%, transparent 68%)" }} />
        </div>

        {/* Road + truck */}
        <div className="relative" style={{ width: 420 }}>
          {/* "NEW ARRIVALS DELIVERY" label */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">New arrivals delivery</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <Road width={420} />

          {/* Truck driving along the road */}
          <div className="absolute top-7 left-0 right-0 overflow-hidden" style={{ height: 72 }}>
            {/* Speed lines behind truck */}
            <motion.div
              className="absolute top-4 flex flex-col gap-1.5"
              animate={{ x: ["-260px", "500px"] }}
              transition={{ repeat: Infinity, duration: 5, ease: [0.25, 0.1, 0.25, 1], times: [0, 1] }}
            >
              {[40, 28, 20, 32].map((len, i) => (
                <div key={i} className="h-px rounded-full bg-white/12" style={{ width: len }} />
              ))}
            </motion.div>

            {/* Truck */}
            <motion.div
              className="absolute top-0"
              animate={{
                x: ["-220px", "160px", "160px", "500px"],
              }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: ["easeOut", "linear", "easeIn", "easeIn"],
                times: [0, 0.48, 0.65, 1],
              }}
            >
              <TruckSVG scale={0.95} />
            </motion.div>
          </div>

          {/* Ground shadow under road */}
          <div className="mt-1 mx-4 h-2 rounded-full blur-sm opacity-30 bg-black" />
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="lg:hidden flex flex-col items-center gap-0">
        <div className="relative" style={{ width: 230, height: 230 }}>
          {mobileCards.map((c, i) => <BookItem key={i} c={c} img={imgs[i]} i={i} bookW={90} />)}
          <div className="absolute inset-0 -z-10 blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)" }} />
        </div>

        {/* Road + truck (mobile) */}
        <div className="relative" style={{ width: 260 }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">delivery</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>
          <Road width={260} />
          <div className="absolute top-7 left-0 right-0 overflow-hidden" style={{ height: 52 }}>
            <motion.div
              className="absolute top-0"
              animate={{ x: ["-180px", "100px", "100px", "320px"] }}
              transition={{
                repeat: Infinity, duration: 4.5,
                ease: ["easeOut", "linear", "easeIn", "easeIn"],
                times: [0, 0.46, 0.62, 1],
              }}
            >
              <TruckSVG scale={0.65} />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FEATURED SPOTLIGHT CARD
───────────────────────────────────────────────────────────────── */
function FeaturedCard({ book }: { book: any }) {
  const [err, setErr]  = useState(false);
  const ref            = useRef<HTMLDivElement>(null);
  const inView         = useInView(ref, { once: true, margin: "-80px" });
  const cover          = err ? `https://picsum.photos/seed/${book._id}/300/450` : book.imageUrl;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl overflow-hidden border border-white/8 shadow-2xl"
      style={{ background: "linear-gradient(130deg,#0a1628 0%,#132038 60%,#1a2d4a 100%)" }}
    >
      {/* Blurred bg */}
      <div className="absolute inset-0">
        <img src={cover} alt="" className="w-full h-full object-cover opacity-10 scale-110 blur-sm" onError={() => setErr(true)} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/80 to-[#0a1628]/50" />
      </div>
      {/* Left gold bar */}
      <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-transparent via-[#c9a84c] to-transparent rounded-r-full" />

      <div className="relative z-10 flex gap-6 lg:gap-10 p-6 lg:p-10 items-center">
        {/* Cover */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.18, duration: 0.6 }}
          className="flex-shrink-0"
        >
          <div className="relative w-32 lg:w-44 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-2 ring-white/10"
            style={{ aspectRatio: "2/3" }}>
            <img src={cover} alt={book.title} className="w-full h-full object-cover"
              onError={() => setErr(true)} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.25 }}
            className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a84c] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9a84c]" />
            </span>
            <span className="text-[11px] font-black text-[#c9a84c] uppercase tracking-[0.22em]">#1 Spotlight This Week</span>
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
            className="text-2xl lg:text-4xl font-black text-white leading-tight tracking-tight mb-2 line-clamp-2">
            {book.title}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.36 }}
            className="text-sm lg:text-base text-white/40 font-medium mb-4">
            by {book.author}
          </motion.p>
          {book.description && (
            <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.42 }}
              className="text-sm text-white/45 leading-relaxed line-clamp-3 mb-6 max-w-xl">
              {book.description}
            </motion.p>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.48 }}
            className="flex items-center gap-5 flex-wrap">
            <span className="text-3xl lg:text-4xl font-black text-white">{priceStr(book.price)}</span>
            <a href={`/browse/${book._id || book.id}`}
              className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b557] text-[#0a1628] font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-[#c9a84c]/20 transition-colors">
              View book <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-xs text-white/25 font-medium hidden lg:block">
              Just arrived · Available now
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ANIMATED CARD WRAPPER
───────────────────────────────────────────────────────────────── */
function AnimatedCard({ book, index }: { book: any; index: number }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.38, delay: (index % 5) * 0.055, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      <div className="absolute -top-1.5 -right-1.5 z-20 flex items-center gap-0.5 bg-[#c9a84c] text-[#0a1628] text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <Sparkles className="w-2 h-2" /> NEW
      </div>
      <BookCard
        id={book._id || book.id || ""}
        img={book.imageUrl || ""}
        title={book.title}
        author={book.author}
        price={priceStr(book.price)}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SKELETONS
───────────────────────────────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="aspect-[2/3] bg-gray-200 rounded-2xl" />
    <div className="h-3 bg-gray-200 rounded w-3/4" />
    <div className="h-3 bg-gray-200 rounded w-1/2" />
  </div>
);

const FeaturedSkeleton = () => (
  <div className="rounded-3xl overflow-hidden animate-pulse bg-gray-200 h-52 lg:h-64 mb-10" />
);

/* ─────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────── */
const NewArrivalsPage: React.FC = () => {
  const [books, setBooks]             = useState<any[]>([]);
  const [categories, setCategories]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [category, setCategory]       = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchOpen, setSearchOpen]   = useState(false);
  const gridRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    fetchBooks({ page, category, search, limit: 12, sort: "createdAt", order: "desc" })
      .then(r => setBooks(r.listings || r.books || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, category, search]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    if (searchOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    setSearchOpen(false);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearAll = () => { setSearch(""); setSearchInput(""); setCategory(null); setPage(1); };

  const covers      = books.map(b => b.imageUrl).filter(Boolean);
  const marqueeText = books.map(b => `${b.title}${b.author ? " — " + b.author : ""}`);
  const featured    = books[0] ?? null;
  const gridBooks   = page === 1 && !search ? books.slice(1) : books;

  return (
    <div className="min-h-screen bg-[#f7f4ef] font-sans">
      <SEOHead
        title="New Arrivals"
        description="Discover the latest books just added to BritBooks. Fresh stock arriving daily — fiction, non-fiction, children's books, and more at great prices."
        canonical="/new-arrivals"
      />
      <style>{`.no-sb::-webkit-scrollbar{display:none}.no-sb{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <TopBar />

      {/* ══════════════════════════════════════════════════════
          MOBILE APP LAYOUT  (hidden on sm+)
      ══════════════════════════════════════════════════════ */}
      <div className="sm:hidden bg-white min-h-screen">

        {/* ── Sticky search bar ── */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
          <GlobalSearchBar
            variant="light"
            placeholder="Search new arrivals…"
          />
        </div>

        {/* ── Page heading ── */}
        <div className="px-4 pt-5 pb-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-widest mb-1">BritBooks</p>
            <h1 className="text-[26px] font-black text-gray-900 tracking-tight leading-none">New Arrivals</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600">Updated weekly</span>
          </div>
        </div>

        {/* ── Featured snap-scroll carousel ── */}
        {(!search && page === 1) && (
          <div className="mb-5">
            {loading ? (
              <div className="px-4">
                <div className="rounded-3xl bg-gray-100 animate-pulse" style={{ height: 210 }} />
              </div>
            ) : books.length > 0 ? (
              <>
                <div className="flex gap-3 px-4 overflow-x-auto no-sb snap-x snap-mandatory">
                  {books.slice(0, 5).map((book, i) => (
                    <motion.a
                      key={book._id || book.id}
                      href={`/browse/${book._id || book.id}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-shrink-0 snap-start rounded-3xl overflow-hidden relative shadow-lg"
                      style={{ width: "calc(100vw - 48px)", height: 210 }}
                    >
                      <img src={book.imageUrl || PLACEHOLDERS[i % 5]} alt={book.title}
                        className="absolute inset-0 w-full h-full object-cover brightness-50"
                        onError={e => { e.currentTarget.src = PLACEHOLDERS[i % 5]; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Gold badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#c9a84c] rounded-full px-2.5 py-1">
                        <Sparkles className="w-2.5 h-2.5 text-[#0a1628]" />
                        <span className="text-[9px] font-bold text-black text-[#0a1628] uppercase tracking-widest">New Arrival</span>
                      </div>
                      {/* Count pill */}
                      <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <span className="text-[11px] font-black text-white">{i + 1}</span>
                      </div>
                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-[15px] font-black text-white leading-tight line-clamp-1 mb-0.5">{book.title}</p>
                        <p className="text-xs text-white/50 font-medium mb-3">by {book.author}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black  text-white text-[#c9a84c]">{priceStr(book.price)}</span>
                          <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                            <span className="text-[11px] font-bold text-white">View</span>
                            <ArrowRight className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
                {/* Dot indicators */}
                <div className="flex justify-center gap-1.5 mt-3 px-4">
                  {books.slice(0, 5).map((_, i) => (
                    <div key={i}
                      className={`rounded-full transition-all duration-300 ${i === 0 ? "w-5 h-1.5 bg-[#c9a84c]" : "w-1.5 h-1.5 bg-gray-200"}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── Genre chips ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-4 overflow-x-auto no-sb pb-1">
            <button onClick={() => { setCategory(null); setPage(1); }}
              className={`flex-shrink-0 h-9 px-5 rounded-full text-xs font-black transition-all ${
                !category ? "bg-[#0a1628] text-white shadow-sm" : "bg-gray-100 text-gray-500"
              }`}>All</button>
            {categories.map((c: any) => (
              <button key={c._id}
                onClick={() => { setCategory(c.name); setPage(1); }}
                className={`flex-shrink-0 h-9 px-5 rounded-full text-xs font-black transition-all ${
                  category === c.name ? "bg-[#c9a84c] text-[#0a1628] shadow-sm" : "bg-gray-100 text-gray-500"
                }`}>{c.name}</button>
            ))}
          </div>
        </div>

        {/* ── Delivery mini banner ── */}
        {!search && page === 1 && (
          <div className="mx-4 mb-5 rounded-2xl bg-[#0a1628] px-4 py-3 flex items-center gap-3 overflow-hidden">
            <div className="relative w-14 h-6 flex-shrink-0 overflow-hidden">
              <motion.div
                animate={{ x: ["-70px", "12px", "12px", "72px"] }}
                transition={{ repeat: Infinity, duration: 4, times: [0, 0.44, 0.64, 1], ease: "linear" }}
                className="absolute top-0"
              >
                <TruckSVG scale={0.32} />
              </motion.div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#c9a84c]/30" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white leading-tight">Fresh titles delivered weekly</p>
              <p className="text-[9px] text-white/35 font-medium mt-0.5">1,200+ new books every month</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#c9a84c]/15 border border-[#c9a84c]/25 flex items-center justify-center flex-shrink-0">
              <PackageOpen className="w-4 h-4 text-[#c9a84c]" />
            </div>
          </div>
        )}

        {/* ── Browse grid ── */}
        <div className="px-4" ref={gridRef}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[15px] font-black text-gray-900">
              {search ? `"${search}"` : category ?? "All New Arrivals"}
            </p>
            <div className="flex items-center gap-2">
              {!loading && (
                <span className="text-xs text-gray-400 font-medium">
                  {books.length}{books.length >= 12 ? "+" : ""} books
                </span>
              )}
              {(search || category) && (
                <button onClick={clearAll}
                  className="flex items-center gap-1 h-7 px-3 rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array(8).fill(0).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : books.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center gap-4 text-center">
              <PackageOpen className="w-12 h-12 text-gray-200" />
              <p className="font-black text-gray-700">Nothing here yet</p>
              <p className="text-sm text-gray-400">Try a different genre or clear your search</p>
              <button onClick={clearAll}
                className="bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-2xl">
                Reset
              </button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {(page === 1 && !search ? books.slice(1) : books).map((book, i) => (
                  <AnimatedCard key={book._id || book.id} book={book} index={i} />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8 mb-12 flex items-center justify-center gap-3">
                <button disabled={page === 1}
                  onClick={() => { setPage(p => p - 1); gridRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="flex items-center gap-1.5 h-11 px-5 rounded-2xl bg-gray-100 text-sm font-bold text-gray-500 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="w-11 h-11 rounded-2xl bg-[#0a1628] text-white flex items-center justify-center text-sm font-black shadow-lg">
                  {page}
                </span>
                <button disabled={books.length < 12}
                  onClick={() => { setPage(p => p + 1); gridRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="flex items-center gap-1.5 h-11 px-5 rounded-2xl bg-gray-100 text-sm font-bold text-gray-500 disabled:opacity-30">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* ── end mobile ── */}

      {/* ══════════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden on mobile)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden sm:block">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0a1628] overflow-hidden">
        {/* dot grid */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* gold top line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
        {/* glows */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#c9a84c]/6 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-blue-800/8 blur-3xl pointer-events-none" />

        {/* breadcrumb — extreme right */}
        <motion.nav
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="hidden lg:flex absolute top-6 right-16 z-20 items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
        >
          <a href="/" className="text-white/25 hover:text-white/55 transition-colors">Home</a>
          <span className="text-white/15">/</span>
          <span className="text-[#c9a84c]">New Arrivals</span>
        </motion.nav>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 lg:px-16
                        flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-0
                        pt-12 sm:pt-16 lg:pt-24 pb-20 sm:pb-24 lg:pb-28">

          {/* ── LEFT ── */}
          <div className="flex-1 lg:pr-16">
            {/* badge */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-[#c9a84c]/10 border border-[#c9a84c]/22 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a84c] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#c9a84c]" />
              </span>
              <span className="text-[11px] font-bold text-[#c9a84c] tracking-widest uppercase">Updated every week</span>
            </motion.div>

            {/* headline */}
            <div className="mb-5 overflow-hidden">
              {["Fresh", "Off", "The", "Shelf."].map((word, i) => (
                <motion.span key={word}
                  initial={{ y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.65, delay: 0.18 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  className={`inline-block mr-3 sm:mr-4 font-black tracking-[-0.03em] leading-[1.05]
                    text-4xl sm:text-5xl lg:text-6xl xl:text-7xl
                    ${i === 3 ? "text-[#c9a84c]" : "text-white"}`}>
                  {word}
                </motion.span>
              ))}
            </div>

            {/* subtext */}
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}
              className="text-white/40 text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg mb-10">
              Every week hundreds of new titles land on our shelves — from debut voices to returning favourites.
              Discover what's just arrived.
            </motion.p>

            {/* stats */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.64 }}
              className="flex items-center gap-8 lg:gap-12 mb-10 pb-10 border-b border-white/8">
              {[
                { icon: <BookOpen className="w-4 h-4" />, val: 1200, suf: "+", label: "New monthly" },
                { icon: <TrendingUp className="w-4 h-4" />, val: 52, suf: "×", label: "Updates a year" },
                { icon: <Sparkles className="w-4 h-4" />, val: 40, suf: "+", label: "Genres" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#c9a84c]">
                    {s.icon}
                    <span className="text-xl lg:text-2xl font-black text-white tabular-nums">
                      <Counter target={s.val} suffix={s.suf} />
                    </span>
                  </div>
                  <span className="text-[10px] text-white/25 uppercase tracking-widest font-bold">{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}
              className="flex items-center gap-3 flex-wrap mb-5">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1628] font-black text-sm px-7 py-3.5 rounded-2xl shadow-xl shadow-[#c9a84c]/20">
                Browse all <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {/* Inline search bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="max-w-md"
            >
              <GlobalSearchBar variant="dark" placeholder="Search titles, authors, genres…" />
            </motion.div>
          </div>

          {/* ── RIGHT: floating books ── */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.28, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0 flex justify-center lg:justify-end w-full lg:w-auto"
          >
            <DeliveryScene covers={covers} />
          </motion.div>
        </div>

        {/* bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#f7f4ef]"
          style={{ clipPath: "ellipse(58% 100% at 50% 100%)" }} />
      </section>

      {/* ══════════════════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════════════════ */}
      <div className="bg-[#0a1628] border-y border-white/5 py-3 overflow-hidden">
        <Marquee items={marqueeText} />
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-10 lg:pt-14 pb-32">

        {/* ── desktop: 2-column (sidebar + main) ── */}
        <div className="flex gap-10 xl:gap-14 items-start">

          {/* ─────── SIDEBAR (desktop only) ─────── */}
          <aside className="hidden lg:flex flex-col gap-2 w-52 xl:w-60 flex-shrink-0 sticky top-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Filter by genre</span>
            </div>

            {/* All button */}
            <button
              onClick={() => { setCategory(null); setPage(1); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-left transition-all ${
                !category
                  ? "bg-[#0a1628] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white"
              }`}
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              All Genres
            </button>

            {/* Category buttons */}
            {categories.map((c: any) => (
              <button key={c._id}
                onClick={() => { setCategory(c.name); setPage(1); }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-left transition-all ${
                  category === c.name
                    ? "bg-[#c9a84c] text-[#0a1628] shadow-md"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white"
                }`}
              >
                <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            ))}

            {category && (
              <button onClick={clearAll}
                className="flex items-center gap-2 mt-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear filter
              </button>
            )}

            {/* Divider */}
            <div className="my-4 h-px bg-gray-200" />

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live catalogue</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed px-1 mt-1">
              New titles are added automatically every week from our network of sellers.
            </p>
          </aside>

          {/* ─────── MAIN ─────── */}
          <div className="flex-1 min-w-0" ref={gridRef}>

            {/* Section header row */}
            <div className="flex items-end justify-between mb-6 lg:mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                  {search ? `"${search}"` : category ?? "New Arrivals"}
                </h2>
                {!loading && (
                  <p className="text-sm text-gray-400 font-medium mt-1">
                    {books.length}{books.length === 12 ? "+" : ""} {books.length === 1 ? "title" : "titles"} found
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSearchOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
                    search ? "bg-[#c9a84c] border-[#c9a84c] text-[#0a1628]" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{search ? `"${search}"` : "Search"}</span>
                </button>
                {(search || category) && (
                  <button onClick={clearAll}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Mobile-only category chips */}
            <div className="lg:hidden relative -mx-4 mb-6">
              <div className="flex items-center gap-2 px-4 overflow-x-auto no-sb pb-1">
                <button onClick={() => { setCategory(null); setPage(1); }}
                  className={`flex-shrink-0 h-9 px-4 rounded-2xl text-xs font-bold border transition-all ${
                    !category ? "bg-[#0a1628] text-white border-[#0a1628]" : "bg-white text-gray-500 border-gray-200"
                  }`}>
                  All
                </button>
                {categories.map((c: any) => (
                  <button key={c._id} onClick={() => { setCategory(c.name); setPage(1); }}
                    className={`flex-shrink-0 h-9 px-4 rounded-2xl text-xs font-bold border transition-all ${
                      category === c.name ? "bg-[#c9a84c] text-[#0a1628] border-[#c9a84c]" : "bg-white text-gray-500 border-gray-200"
                    }`}>
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-[#f7f4ef] to-transparent pointer-events-none" />
            </div>

            {/* Featured spotlight */}
            {loading ? (
              <FeaturedSkeleton />
            ) : (featured && !search && page === 1) && (
              <div className="mb-8 lg:mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">This Week's Spotlight</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <FeaturedCard book={featured} />
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {Array(page === 1 ? 11 : 12).fill(0).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : books.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="py-28 flex flex-col items-center gap-5 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <PackageOpen className="w-9 h-9 text-gray-300" />
                </div>
                <div>
                  <p className="text-lg font-black text-gray-800 mb-1">Nothing found</p>
                  <p className="text-sm text-gray-400">Try a different genre or search term</p>
                </div>
                <button onClick={clearAll}
                  className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1628] font-bold text-sm px-6 py-3 rounded-2xl">
                  <X className="w-4 h-4" /> Clear filters
                </button>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  {gridBooks.map((book, i) => (
                    <AnimatedCard key={book._id || book.id} book={book} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-14 flex items-center justify-center gap-2">
                  <button disabled={page === 1}
                    onClick={() => { setPage(p => p - 1); gridRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                    className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-25 hover:border-gray-300 transition-all shadow-sm">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {[page - 1, page, page + 1].filter(p => p > 0).map(p => (
                    <button key={p}
                      onClick={() => { setPage(p); gridRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                      className={`w-11 h-11 rounded-2xl text-sm font-bold transition-all border ${
                        p === page ? "bg-[#0a1628] text-white border-[#0a1628] shadow-md" : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      }`}>
                      {p}
                    </button>
                  ))}
                  <button disabled={books.length < 12}
                    onClick={() => { setPage(p => p + 1); gridRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                    className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-25 hover:border-gray-300 transition-all shadow-sm">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#0a1628] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 py-14">
          <div className="grid grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden">
            {[
              { icon: <BookOpen className="w-5 h-5" />, val: 1200, suf: "+", label: "New titles monthly" },
              { icon: <TrendingUp className="w-5 h-5" />, val: 40, suf: "+", label: "Genres covered" },
              { icon: <Sparkles className="w-5 h-5" />, val: 52, suf: "×", label: "Updates per year" },
            ].map((s, i) => (
              <div key={i} className="bg-[#0a1628] flex flex-col items-center gap-3 py-10 px-6 text-center">
                <div className="w-10 h-10 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/15 flex items-center justify-center text-[#c9a84c]">
                  {s.icon}
                </div>
                <p className="text-white font-black text-2xl lg:text-3xl tabular-nums">
                  <Counter target={s.val} suffix={s.suf} />
                </p>
                <p className="text-white/25 text-[10px] uppercase tracking-widest font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      </div>
      {/* ── end desktop ── */}

      {/* ══════════════════════════════════════════════════════
          SEARCH OVERLAY  (shared)
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-md flex items-start justify-center px-4"
            style={{ paddingTop: "clamp(100px, 20vh, 220px)" }}
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              {/* Search input card */}
              <form onSubmit={submitSearch}
                className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 shadow-2xl shadow-black/30">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search titles, authors, genres…"
                  className="flex-1 text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none"
                />
                {searchInput && (
                  <button type="button" onClick={() => setSearchInput("")}
                    className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
                <button type="submit"
                  className="bg-[#0a1628] hover:bg-[#132038] text-white text-sm font-black px-5 py-2.5 rounded-xl flex-shrink-0 transition-colors">
                  Search
                </button>
              </form>
              {/* Quick hint */}
              <p className="text-center text-white/30 text-xs mt-3 font-medium">
                Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/50 font-mono text-[10px]">Esc</kbd> or tap outside to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default NewArrivalsPage;
