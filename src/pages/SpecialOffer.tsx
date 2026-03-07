import React, { useState, useEffect } from "react";
import { Star, ShoppingBasket, Zap, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";
import { fetchBooks } from "../data/books";
import { useCart } from "../context/cartContext";

// ── Countdown (added subtle urgency pulse when low) ─────────────────────────
const Countdown = ({ seconds }: { seconds: number }) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  const urgent = seconds > 0 && seconds < 600; // last 10 minutes

  return (
    <div
      className={`flex gap-1 font-mono font-bold text-sm bg-black/10 backdrop-blur-md px-3 py-1 rounded-full transition-all ${
        urgent ? "text-red-600 animate-pulse" : ""
      }`}
    >
      <span>{pad(hours)}</span>:<span>{pad(minutes)}</span>:<span>{pad(secs)}</span>
    </div>
  );
};

const SpecialOffersPage = () => {
  const { addToCart, cart } = useCart();
  const [timers, setTimers] = useState({ fiction: 86400, fantasy: 43200, nonFiction: 21600 });
  const [data, setData] = useState({ fiction: [], fantasy: [], nonFiction: [], deal: null });
  const [visible, setVisible] = useState({ fiction: 8, fantasy: 8, nonFiction: 8 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [fic, fan, non, random] = await Promise.all([
          fetchBooks({ limit: 32, filters: { genre: "Literary Fiction" } }),
          fetchBooks({ limit: 32, filters: { genre: "Fantasy" } }),
          fetchBooks({ limit: 32, filters: { genre: "Non-Fiction" } }),
          fetchBooks({ limit: 1, sort: "random" }),
        ]);

        setData({
          fiction: fic.listings.map(b => ({ ...b, disc: 0.6 })),
          fantasy: fan.listings.map(b => ({ ...b, disc: 0.5 })),
          nonFiction: non.listings.map(b => ({ ...b, disc: 0.7 })),
          deal: random.listings[0] ? { ...random.listings[0], disc: 0.6 } : null,
        });
      } finally {
        setLoading(false);
      }
    };
    loadAll();

    const interval = setInterval(() => {
      setTimers(prev => ({
        fiction: Math.max(0, prev.fiction - 1),
        fantasy: Math.max(0, prev.fantasy - 1),
        nonFiction: Math.max(0, prev.nonFiction - 1),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const cartCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);
  const progress = Math.min((cartCount / 4) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-indigo-600 text-xl font-medium flex items-center gap-3">
          <Zap className="animate-spin" size={20} />
          Loading deals...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
      <Toaster position="bottom-center" />
      <TopBar />

      {/* --- HERO SECTION (unchanged) --- */}
      <header className="relative pt-10 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-600 shadow-sm mb-6">
            <Zap size={14} fill="currentColor" className="animate-pulse" />
            Flash Sale Now Live
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6">
            The Book <span className="text-indigo-600 underline decoration-indigo-200">Event</span> of 2026.
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            Curated collections at prices you won't see again. Grab your favorites before the clock hits zero.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 -mt-12 space-y-20 pb-20">
        
        {/* --- DEAL OF THE HOUR BENTO (mostly unchanged + tiny animation) --- */}
        {data.deal && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" />
              <img 
                src={data.deal.imageUrl} 
                className="w-48 h-72 object-cover rounded-xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500" 
                alt={data.deal.title} 
              />
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="bg-red-500 px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">Deal of the Hour</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={14} className="animate-spin-slow" /> <Countdown seconds={3600} />
                  </div>
                </div>
                <h2 className="text-3xl font-bold">{data.deal.title}</h2>
                <p className="text-slate-400 text-lg">by {data.deal.author}</p>
                <div className="flex items-center justify-center md:justify-start gap-4 py-4">
                  <span className="text-4xl font-black text-white">£{(data.deal.price * 0.6).toFixed(2)}</span>
                  <span className="text-xl text-slate-500 line-through">£{data.deal.price.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => {
                    addToCart?.(data.deal);
                    toast.success("Added to basket!");
                  }}
                  className="w-full md:w-auto bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  Claim This Deal <ArrowRight size={18} className="animate-bounce-x" />
                </button>
              </div>
            </div>

            {/* --- QUEST CARD (unchanged) --- */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Free Shipping Quest</h3>
                <p className="text-slate-500 text-sm">Add 4 books to your basket to unlock worldwide free delivery.</p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex justify-between text-sm font-bold">
                  <span>{progress === 100 ? "Unlocked!" : `${cartCount}/4 Books`}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- Fiction Frenzy (added load more) --- */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Fiction Frenzy</h2>
              <p className="text-slate-500">The world's most gripping stories, now 40% off.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-400">Ends In:</span>
              <Countdown seconds={timers.fiction} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {data.fiction.slice(0, visible.fiction).map((book: any) => (
              <ModernBookCard key={book.id} book={book} />
            ))}
          </div>

          {visible.fiction < data.fiction.length && (
            <div className="text-center mt-10">
              <button
                onClick={() => setVisible(prev => ({ ...prev, fiction: prev.fiction + 8 }))}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                Load More <ArrowRight size={18} />
              </button>
            </div>
          )}
        </section>

        {/* --- Fantasy (same pattern) --- */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Fantasy</h2>
              <p className="text-slate-500">Magical worlds and epic tales, now 50% off.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-400">Ends In:</span>
              <Countdown seconds={timers.fantasy} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {data.fantasy.slice(0, visible.fantasy).map((book: any) => (
              <ModernBookCard key={book.id} book={book} />
            ))}
          </div>

          {visible.fantasy < data.fantasy.length && (
            <div className="text-center mt-10">
              <button
                onClick={() => setVisible(prev => ({ ...prev, fantasy: prev.fantasy + 8 }))}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                Load More <ArrowRight size={18} />
              </button>
            </div>
          )}
        </section>

        {/* --- Non-Fiction (same pattern) --- */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Non-Fiction</h2>
              <p className="text-slate-500">Knowledge and insight, now up to 70% off.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-400">Ends In:</span>
              <Countdown seconds={timers.nonFiction} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {data.nonFiction.slice(0, visible.nonFiction).map((book: any) => (
              <ModernBookCard key={book.id} book={book} />
            ))}
          </div>

          {visible.nonFiction < data.nonFiction.length && (
            <div className="text-center mt-10">
              <button
                onClick={() => setVisible(prev => ({ ...prev, nonFiction: prev.nonFiction + 8 }))}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                Load More <ArrowRight size={18} />
              </button>
            </div>
          )}
        </section>

      </main>
      <Footer />
    </div>
  );
};

// ModernBookCard — added subtle icon animation on hover
const ModernBookCard = ({ book }: { book: any }) => (
  <div className="group relative bg-white border border-slate-100 rounded-2xl p-3 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1">
    <div className="relative aspect-[2/3] overflow-hidden rounded-xl mb-4">
      <img 
        src={book.imageUrl} 
        alt={book.title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black shadow-sm animate-pulse">
        -{Math.round((1 - book.disc) * 100)}%
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <button 
          onClick={() => toast.success("Added to basket!")}
          className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
        >
          <ShoppingBasket size={14} className="group-hover:animate-bounce" /> ADD TO BASKET
        </button>
      </div>
    </div>
    <div className="px-1 space-y-1">
      <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{book.title}</h4>
      <p className="text-xs text-slate-400">{book.author}</p>
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col">
          <span className="text-base font-black text-slate-900">£{(book.price * book.disc).toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 line-through font-medium">£{book.price.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1 text-amber-400">
          <Star size={12} fill="currentColor" className="animate-pulse" />
          <span className="text-xs font-bold text-slate-700">{book.rating || "4.5"}</span>
        </div>
      </div>
    </div>
  </div>
);

export default SpecialOffersPage;