import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Clock, Gift, Star, Flame, Sparkles,
  ShoppingCart, ChevronRight, RotateCcw, Trophy, X, Check,
  ArrowRight, Lock,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";
import SEOHead from "../components/SEOHead";
import { fetchBooks } from "../data/books";
import { useCart } from "../context/cartContext";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
/** Generate a believable fake "was" price — always higher than real */
const fakeWas = (real: number) => {
  const multipliers = [1.4, 1.5, 1.6, 1.75, 1.85, 2.0, 2.2];
  const m = multipliers[Math.floor(real * 7) % multipliers.length];
  return parseFloat((real * m).toFixed(2));
};

const pct = (real: number, was: number) => Math.round(((was - real) / was) * 100);

const pad = (n: number) => n.toString().padStart(2, "0");

/* ── Countdown ── */
const Countdown = ({ seconds }: { seconds: number }) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const urgent = seconds > 0 && seconds < 600;
  return (
    <div className={`flex items-center gap-1 font-mono font-black text-sm ${urgent ? "text-red-500 animate-pulse" : "text-gray-800"}`}>
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <React.Fragment key={i}>
          <span className="bg-gray-900 text-white px-2 py-1 rounded-lg">{v}</span>
          {i < 2 && <span className="text-gray-500">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SPIN THE WHEEL
───────────────────────────────────────────────────────────────── */
const PRIZES = [
  { label: "10% OFF",      color: "#ef4444", code: "SPIN10"  },
  { label: "FREE SHIP",    color: "#3b82f6", code: "FREESHIP" },
  { label: "15% OFF",      color: "#f59e0b", code: "SPIN15"  },
  { label: "TRY AGAIN",    color: "#6b7280", code: null       },
  { label: "20% OFF",      color: "#10b981", code: "SPIN20"  },
  { label: "5% OFF",       color: "#8b5cf6", code: "SPIN5"   },
  { label: "£2 OFF",       color: "#ec4899", code: "TWO0FF"  },
  { label: "TRY AGAIN",    color: "#6b7280", code: null       },
];

const SpinWheel = () => {
  const [spinning, setSpinning]   = useState(false);
  const [rotation, setRotation]   = useState(0);
  const [result, setResult]       = useState<typeof PRIZES[0] | null>(null);
  const [used, setUsed]           = useState(false);
  const [copied, setCopied]       = useState(false);
  const canvasRef                 = useRef<HTMLCanvasElement>(null);
  const slices                    = PRIZES.length;
  const arc                       = (2 * Math.PI) / slices;

  const drawWheel = (rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r  = cx - 4;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    PRIZES.forEach((prize, i) => {
      const start = rot + i * arc - Math.PI / 2;
      const end   = start + arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(prize.label, r - 10, 4);
      ctx.restore();
    });

    // Centre circle
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#0a1628";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => { drawWheel(0); }, []);

  const spin = () => {
    if (spinning || used) return;
    setResult(null);
    setSpinning(true);

    const extra   = 5 + Math.floor(Math.random() * 5); // 5–9 full spins
    const winner  = Math.floor(Math.random() * slices);
    // Angle to land the winner at 12 o'clock (top = pointer)
    const target  = -(winner * arc + arc / 2) + Math.PI / 2;
    const total   = extra * 2 * Math.PI + target;
    const totalMs = 4000;
    const start   = performance.now();
    const startRot = rotation;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / totalMs, 1);
      // ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const cur = startRot + total * ease;
      setRotation(cur);
      drawWheel(cur);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setUsed(true);
        setResult(PRIZES[winner]);
      }
    };
    requestAnimationFrame(animate);
  };

  const copy = () => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Pointer */}
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg" />
        </div>
        <canvas ref={canvasRef} width={260} height={260} className="rounded-full shadow-2xl" />
      </div>

      <button
        onClick={spin}
        disabled={spinning || used}
        className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm transition-all ${
          used ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95"
        }`}
      >
        <RotateCcw size={16} className={spinning ? "animate-spin" : ""} />
        {spinning ? "Spinning…" : used ? "Already spun!" : "SPIN TO WIN"}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-lg p-5 text-center"
          >
            {result.code ? (
              <>
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-black text-gray-900 text-lg mb-1">You won {result.label}!</p>
                <p className="text-gray-400 text-xs mb-3">Use this code at checkout</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-2.5 font-mono font-bold text-gray-800 tracking-widest text-sm">
                    {result.code}
                  </div>
                  <button onClick={copy} className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors">
                    {copied ? <Check size={16} /> : <Gift size={16} />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <X className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="font-bold text-gray-500">Better luck next time!</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SCRATCH CARD
───────────────────────────────────────────────────────────────── */
const SCRATCH_PRIZES = ["12% OFF", "FREE SHIP", "£3 OFF", "8% OFF", "MYSTERY BOOK", "15% OFF"];
const SCRATCH_CODES  = ["SCRATCH12", "FREESHIP", "THREE0FF", "SCRATCH8", "MYSTBOOK", "SCRATCH15"];

const ScratchCard = () => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [prize]                 = useState(() => Math.floor(Math.random() * SCRATCH_PRIZES.length));
  const [scratched, setScratched] = useState(0);
  const [copied, setCopied]     = useState(false);
  const isDrawing               = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    ctx.fillStyle = "#374151";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✦ SCRATCH HERE ✦", canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = "11px sans-serif";
    ctx.fillText("Reveal your prize", canvas.width / 2, canvas.height / 2 + 10);
  }, []);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const cx     = (x - rect.left) * (canvas.width / rect.width);
    const cy     = (y - rect.top)  * (canvas.height / rect.height);
    const ctx    = canvas.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fill();

    // Check coverage
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent++;
    const pctScratched = (transparent / (canvas.width * canvas.height)) * 100;
    setScratched(pctScratched);
    if (pctScratched > 55 && !revealed) setRevealed(true);
  };

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => { isDrawing.current = true; scratch(e.clientX, e.clientY); },
    onMouseMove: (e: React.MouseEvent) => { if (isDrawing.current) scratch(e.clientX, e.clientY); },
    onMouseUp:   () => { isDrawing.current = false; },
    onMouseLeave: () => { isDrawing.current = false; },
    onTouchStart: (e: React.TouchEvent) => { isDrawing.current = true; scratch(e.touches[0].clientX, e.touches[0].clientY); },
    onTouchMove:  (e: React.TouchEvent) => { if (isDrawing.current) scratch(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); },
    onTouchEnd:   () => { isDrawing.current = false; },
  };

  const copy = () => {
    navigator.clipboard.writeText(SCRATCH_CODES[prize]).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-64 h-36 rounded-2xl overflow-hidden shadow-xl select-none cursor-crosshair">
        {/* Prize underneath */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-400 flex flex-col items-center justify-center">
          <Trophy className="w-8 h-8 text-white mb-1" />
          <p className="font-black text-white text-xl">{SCRATCH_PRIZES[prize]}</p>
        </div>
        {/* Scratch layer */}
        <canvas
          ref={canvasRef}
          width={256} height={144}
          className="absolute inset-0 w-full h-full touch-none"
          {...handlers}
        />
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-orange-400 transition-all duration-300 rounded-full" style={{ width: `${Math.min(scratched, 100)}%` }} />
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-md p-4 text-center">
            <p className="font-black text-gray-900 mb-1">You scratched <span className="text-orange-500">{SCRATCH_PRIZES[prize]}</span>!</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-3 py-2 font-mono font-bold text-gray-800 tracking-widest text-sm">
                {SCRATCH_CODES[prize]}
              </div>
              <button onClick={copy} className="p-2.5 bg-orange-400 text-white rounded-xl hover:bg-orange-500 transition-colors">
                {copied ? <Check size={15} /> : <Gift size={15} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MYSTERY BOX
───────────────────────────────────────────────────────────────── */
const MysteryBox = ({ books }: { books: any[] }) => {
  const [opened, setOpened]     = useState<number | null>(null);
  const [revealed, setRevealed] = useState<any | null>(null);
  const { addToCart }           = useCart();

  const open = (i: number) => {
    if (opened !== null) return;
    setOpened(i);
    const book = books[Math.floor(Math.random() * books.length)];
    setRevealed(book);
  };

  const reset = () => { setOpened(null); setRevealed(null); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.93 }}
            onClick={() => open(i)}
            disabled={opened !== null}
            className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-sm font-bold ${
              opened === i
                ? "border-yellow-400 bg-yellow-50 text-yellow-600"
                : opened !== null
                ? "border-gray-100 bg-gray-50 text-gray-300"
                : "border-gray-200 bg-white hover:border-yellow-400 hover:bg-yellow-50 text-gray-600 cursor-pointer shadow-sm"
            }`}
          >
            <span className="text-3xl">{opened === i ? "📖" : "🎁"}</span>
            {opened === i ? "Revealed!" : `Box ${i + 1}`}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
          >
            <div className="flex gap-4 p-4">
              <img src={revealed.imageUrl} alt={revealed.title}
                className="w-16 h-24 object-cover rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-sm truncate">{revealed.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{revealed.author}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-black text-gray-900 text-lg">£{revealed.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-400 line-through">£{fakeWas(revealed.price).toFixed(2)}</span>
                  <span className="text-[10px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                    -{pct(revealed.price, fakeWas(revealed.price))}%
                  </span>
                </div>
                <button
                  onClick={() => {
                    addToCart({ id: revealed.id, img: revealed.imageUrl, title: revealed.title, author: revealed.author, price: `£${revealed.price.toFixed(2)}`, quantity: 1 });
                    toast.success("Added to basket!");
                  }}
                  className="mt-3 flex items-center gap-1.5 bg-gray-900 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  <ShoppingCart size={12} /> Add to basket
                </button>
              </div>
            </div>
            <button onClick={reset} className="w-full py-2.5 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 transition-colors">
              Try again →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   DEAL CARD
───────────────────────────────────────────────────────────────── */
const DealCard = ({ book, timer }: { book: any; timer: number }) => {
  const { addToCart }   = useCart();
  const was             = fakeWas(book.price);
  const saving          = pct(book.price, was);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({ id: book.id, img: book.imageUrl, title: book.title, author: book.author, price: `£${book.price.toFixed(2)}`, quantity: 1 });
    setAdded(true);
    toast.success("Added to basket!");
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
    >
      <div className="relative">
        <img src={book.imageUrl} alt={book.title} className="w-full h-44 object-cover" />
        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
          -{saving}%
        </div>
        <div className="absolute bottom-2 right-2">
          <Countdown seconds={timer} />
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug flex-1">{book.title}</p>
        <p className="text-xs text-gray-400 mt-1 mb-2">{book.author}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-gray-900">£{book.price.toFixed(2)}</span>
            <span className="text-xs text-gray-400 line-through ml-1.5">£{was.toFixed(2)}</span>
          </div>
          <button
            onClick={handleAdd}
            className={`p-2 rounded-xl transition-all text-white ${added ? "bg-emerald-500" : "bg-gray-900 hover:bg-red-600"}`}
          >
            {added ? <Check size={14} /> : <ShoppingCart size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */
const SpecialOffersPage = () => {
  const [books, setBooks]       = useState<any[]>([]);
  const [flashBooks, setFlashBooks] = useState<any[]>([]);
  const [heroBook, setHeroBook] = useState<any | null>(null);
  const [timers, setTimers]     = useState<number[]>([]);
  const [heroTimer, setHeroTimer] = useState(7200);
  const [loading, setLoading]   = useState(true);
  const [activeGame, setActiveGame] = useState<"wheel" | "scratch" | "mystery" | null>(null);
  const { addToCart }           = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const [clearance, popular, newArr] = await Promise.all([
          fetchBooks({ shelf: "clearanceItems", limit: 20 }),
          fetchBooks({ shelf: "popularBooks",   limit: 20 }),
          fetchBooks({ shelf: "newArrivals",    limit: 12 }),
        ]);
        const all = [
          ...(clearance?.listings ?? []),
          ...(popular?.listings   ?? []),
        ];
        const unique = Array.from(new Map(all.map(b => [b.id, b])).values());
        setHeroBook(unique[0] ?? null);
        setBooks(unique.slice(1));
        setFlashBooks((newArr?.listings ?? []).slice(0, 8));
        setTimers(unique.slice(1, 25).map(() => Math.floor(Math.random() * 64800) + 7200));
      } catch {}
      finally { setLoading(false); }
    };
    load();

    const iv = setInterval(() => {
      setHeroTimer(t => Math.max(0, t - 1));
      setTimers(ts => ts.map(t => Math.max(0, t - 1)));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading deals…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f4ef] font-sans">
      <SEOHead
        title="Special Offers & Deals"
        description="Win books, spin the wheel, scratch to reveal — BritBooks special offers with real savings on quality used books."
        canonical="/special-offers"
      />
      <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: "12px", fontWeight: 600, fontSize: "13px" } }} />
      <TopBar />

      {/* ══ HERO ══ */}
      {heroBook && (
        <section className="bg-gradient-to-br from-[#0a1628] to-[#1a2d4a] text-white pt-16 pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">

              {/* Left text */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold mb-6">
                  <Flame size={12} /> FLASH SALE — ENDS IN
                  <Countdown seconds={heroTimer} />
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-black leading-tight mb-4">
                  Today's<br /><span className="text-black">Top Deal</span>
                </h1>
                <p className="text-black text-lg mb-2 line-clamp-2">{heroBook.title}</p>
                <p className="text-black text-sm mb-8">by {heroBook.author}</p>
                <div className="flex items-baseline gap-4 mb-8 justify-center lg:justify-start">
                  <span className="text-5xl font-black text-black">£{heroBook.price.toFixed(2)}</span>
                  <span className="text-2xl text-black line-through">£{fakeWas(heroBook.price).toFixed(2)}</span>
                  <span className="bg-red-500 text-black text-sm font-black px-3 py-1.5 rounded-full">
                    SAVE {pct(heroBook.price, fakeWas(heroBook.price))}%
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <button
                    onClick={() => {
                      addToCart({ id: heroBook.id, img: heroBook.imageUrl, title: heroBook.title, author: heroBook.author, price: `£${heroBook.price.toFixed(2)}`, quantity: 1 });
                      toast.success("Added to basket!");
                    }}
                    className="flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#d4b860] text-[#0a1628] font-black px-8 py-4 rounded-2xl transition-all active:scale-95"
                  >
                    <ShoppingCart size={18} /> Add to Basket
                  </button>
                  <Link to={`/browse/${heroBook.id}`}
                    className="flex items-center justify-center gap-2 border border-white/20 hover:border-white/50 text-white font-bold px-8 py-4 rounded-2xl transition-all">
                    View Book <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Book cover */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-[#c9a84c]/20 rounded-3xl blur-2xl scale-110" />
                <div className="relative w-56 lg:w-72">
                  <img src={heroBook.imageUrl} alt={heroBook.title}
                    className="w-full rounded-3xl shadow-2xl ring-1 ring-white/10" />
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <p className="text-white font-black text-xs leading-none">SAVE</p>
                      <p className="text-white font-black text-sm">{pct(heroBook.price, fakeWas(heroBook.price))}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ GAMES SECTION ══ */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Game tabs */}
          <div className="grid grid-cols-3 border-b border-gray-100">
            {[
              { key: "wheel",   icon: RotateCcw, label: "Spin & Win"   },
              { key: "scratch", icon: Sparkles,  label: "Scratch Card"  },
              { key: "mystery", icon: Gift,       label: "Mystery Box"  },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key}
                onClick={() => setActiveGame(activeGame === key as any ? null : key as any)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-4 px-3 text-sm font-bold transition-all border-b-2 ${
                  activeGame === key
                    ? "border-red-600 text-red-600 bg-red-50"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden text-xs">{label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeGame && (
              <motion.div
                key={activeGame}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-8 max-w-sm mx-auto">
                  {activeGame === "wheel"   && <SpinWheel />}
                  {activeGame === "scratch" && <ScratchCard />}
                  {activeGame === "mystery" && <MysteryBox books={flashBooks} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!activeGame && (
            <div className="py-8 text-center text-gray-400 text-sm">
              <Gift size={28} className="mx-auto mb-2 text-gray-200" />
              Pick a game above to win discount codes &amp; book deals
            </div>
          )}
        </div>
      </section>

      {/* ══ FLASH DEALS GRID ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-red-500" />
              <span className="text-xs font-black uppercase tracking-widest text-red-500">Flash Deals</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900">New Arrivals on Sale</h2>
          </div>
          <Link to="/new-arrivals" className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {flashBooks.map((book, i) => (
            <DealCard key={book.id} book={book} timer={timers[i] ?? 3600} />
          ))}
        </div>
      </section>

      {/* ══ MAIN DEALS GRID ══ */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-2 mb-2">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-black uppercase tracking-widest text-yellow-600">All Deals</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-8">Clearance &amp; Popular Picks</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.slice(0, 20).map((book, i) => (
            <DealCard key={book.id} book={book} timer={timers[i] ?? 3600} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/clearance"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-red-600 text-white font-bold px-8 py-4 rounded-2xl transition-all">
            View All Clearance <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ══ PROMO BANNER ══ */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-[#0a1628] to-[#1a2d4a] rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-[#c9a84c]" />
              <span className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest">Members only</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Free UK Delivery</h3>
            <p className="text-white/50 text-sm">On all orders over £15 — no code needed</p>
          </div>
          <Link to="/signup"
            className="shrink-0 flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b860] text-[#0a1628] font-black px-8 py-4 rounded-2xl transition-all whitespace-nowrap">
            Join Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SpecialOffersPage;
