import React, { useState, useEffect } from "react";
import { Zap, Clock, ShieldCheck, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";
import SEOHead from "../components/SEOHead";
import { fetchBooks, fetchCategories, SHELVES } from "../data/books";
import { useCart } from "../context/cartContext";
import BookCard from "../components/BookCard";

const Countdown = ({ seconds }: { seconds: number }) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const urgent = seconds > 0 && seconds < 600;

  return (
    <div className={`flex gap-1 font-mono font-bold text-lg bg-white px-5 py-2.5 rounded-2xl shadow transition-all ${urgent ? "text-red-600 animate-pulse" : "text-slate-800"}`}>
      <span>{pad(hours)}</span>:<span>{pad(minutes)}</span>:<span>{pad(secs)}</span>
    </div>
  );
};

const SpecialOffersPage = () => {
  const { addToCart, cart } = useCart();
  const [shelfData, setShelfData] = useState<{ [key: string]: any[] }>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<{ [key: string]: any[] }>({});
  const [subcategoryData, setSubcategoryData] = useState<{ [key: string]: { [sub: string]: any[] } }>({});
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const [deal, setDeal] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState<{ [key: string]: number }>({});
  const [expandedSubs, setExpandedSubs] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedCats = await fetchCategories();
        setCategories(fetchedCats.slice(0, 8));

        const seenBookIds = new Set<string>();

        // Hero Deal
        const dealRes = await fetchBooks({ limit: 1, sort: "random" });
        const heroDeal = dealRes?.listings?.[0] || null;
        if (heroDeal) {
          seenBookIds.add(heroDeal.id);
          setDeal(heroDeal);
        }

        const newShelfData: { [key: string]: any[] } = {};
        const newTimers: { [key: string]: number } = {};
        const newVisible: { [key: string]: number } = {};

        // Load 7+ real shelves using SHELVES
        const shelvesToLoad = [...SHELVES, { key: "popularBooks", label: "Hot Right Now" }];

        for (const shelf of shelvesToLoad) {
          const res = await fetchBooks({
            shelf: shelf.key,
            limit: 28,
          });

          const books = (res?.listings || [])
            .filter((book: any) => !seenBookIds.has(book.id))
            .slice(0, 24);

          newShelfData[shelf.key] = books;
          newTimers[shelf.key] = Math.floor(Math.random() * 64800) + 21600; // 6–24 hours
          newVisible[shelf.key] = 12;
        }

        // Load categories + subcategories
        const catResults: { [key: string]: any[] } = {};
        const subResults: { [key: string]: { [sub: string]: any[] } } = {};

        for (const cat of fetchedCats.slice(0, 6)) {
          const catRes = await fetchBooks({ limit: 20, filters: { category: cat.name } });
          catResults[cat.name] = (catRes?.listings || []).filter((b: any) => !seenBookIds.has(b.id));

          if (cat.children?.length) {
            subResults[cat.name] = {};
            for (const sub of cat.children.slice(0, 3)) {
              const subRes = await fetchBooks({
                limit: 15,
                filters: { category: cat.name, subcategory: sub.name },
              });
              const subBooks = (subRes?.listings || []).filter((b: any) => !seenBookIds.has(b.id));
              if (subBooks.length > 0) subResults[cat.name][sub.name] = subBooks;
            }
          }
        }

        setShelfData(newShelfData);
        setCategoryData(catResults);
        setSubcategoryData(subResults);
        setTimers(newTimers);
        setVisibleCount(newVisible);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((k) => (updated[k] = Math.max(0, updated[k] - 1)));
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const cartCount = (cart || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const progress = Math.min((cartCount / 4) * 100, 100);

  const handleAddToCart = (book: any) => {
    addToCart?.(book);
    toast.success("Added to cart ✓", { position: "bottom-center" });
  };

  const toggleSub = (catName: string) => {
    setExpandedSubs((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-4 text-xl">
          <Zap className="animate-spin" size={28} /> Loading deals...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <SEOHead
        title="Special Offers & Deals"
        description="Save big with BritBooks' special offers. Browse limited-time book deals, flash sales, and exclusive discounts on quality books."
        canonical="/special-offers"
      />
      <Toaster position="bottom-center" />
      <TopBar />

      {/* Hero Flash Deal */}
      <header className="bg-gradient-to-br from-rose-50 to-orange-50 pt-16 pb-20">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 bg-white text-orange-600 px-6 py-2 rounded-full font-bold text-sm shadow mb-8">
            <Clock size={20} /> LIMITED TIME DEALS
          </div>

          {deal && (
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="relative">
                  <img 
                    src={deal.imageUrl} 
                    className="w-full h-full object-cover" 
                    alt={deal.title} 
                  />
                  <div className="absolute top-6 right-6 bg-red-500 text-white text-xs font-black px-5 py-2 rounded-full animate-pulse">
                    ENDS SOON
                  </div>
                </div>

                <div className="p-5 sm:p-10 md:p-14 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <Countdown seconds={3600} />
                  </div>

                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 sm:mb-6">{deal.title}</h1>

                  <div className="flex items-baseline gap-4 mb-6 sm:mb-10">
                    <span className="text-4xl sm:text-6xl font-black">£{deal.price.toFixed(2)}</span>
                    <span className="text-xl sm:text-3xl line-through text-slate-400">
                      £{(deal.price * 1.85).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(deal)}
                    className="bg-black hover:bg-zinc-800 text-white font-bold text-xl py-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
                  >
                    ADD TO CART <ArrowRight size={26} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 space-y-24">
        {/* Free Shipping Progress Bar */}
        <div className="bg-white border border-emerald-300 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex items-center gap-5">
            <ShieldCheck size={52} className="text-emerald-600" />
            <div>
              <div className="text-2xl font-bold">Free Shipping</div>
              <div className="text-slate-600">Add {Math.max(0, 4 - cartCount)} more books to qualify</div>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-emerald-500 transition-all duration-700" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>{cartCount}/4 books</span>
              <span className="text-emerald-600">{Math.round(progress)}% done</span>
            </div>
          </div>
        </div>

        {/* Main Shelves */}
        {Object.keys(shelfData).map((shelfKey) => {
          const books = shelfData[shelfKey] || [];
          const shelfInfo = SHELVES.find(s => s.key === shelfKey) || { label: shelfKey.replace(/([A-Z])/g, " $1").trim() };
          if (books.length === 0) return null;

          return (
            <section key={shelfKey} className="space-y-8">
              <div className="flex items-end justify-between border-b pb-6">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{shelfInfo.label}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm">Ends in</span>
                  <Countdown seconds={timers[shelfKey] || 0} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                {books.slice(0, visibleCount[shelfKey]).map((book: any) => (
                  <BookCard
                    key={book.id}
                    id={book.id}
                    img={book.imageUrl}
                    title={book.title}
                    author={book.author}
                    price={book.price}                    // ← Real price shown
                    originalPrice={Math.round(book.price * 1.85)} // ← Fake higher price for illusion
                    onAddToCart={() => handleAddToCart(book)}
                  />
                ))}
              </div>

              {visibleCount[shelfKey] < books.length && (
                <div className="text-center">
                  <button
                    onClick={() => setVisibleCount(p => ({ ...p, [shelfKey]: p[shelfKey] + 12 }))}
                    className="border-2 border-slate-300 hover:border-black hover:bg-black hover:text-white font-semibold px-12 py-4 rounded-2xl transition-all"
                  >
                    SHOW MORE
                  </button>
                </div>
              )}
            </section>
          );
        })}

        {/* Category + Subcategory Sections */}
        {categories.map((cat) => {
          const books = categoryData[cat.name] || [];
          const subs = subcategoryData[cat.name] || {};
          if (books.length === 0) return null;

          return (
            <section key={cat.name} className="pt-12 border-t">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl sm:text-4xl font-black">{cat.name}</h2>
                {Object.keys(subs).length > 0 && (
                  <button
                    onClick={() => toggleSub(cat.name)}
                    className="flex items-center gap-2 text-slate-600 hover:text-black"
                  >
                    View subcategories {expandedSubs[cat.name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                {books.slice(0, 12).map((book: any) => (
                  <BookCard
                    key={book.id}
                    id={book.id}
                    img={book.imageUrl}
                    title={book.title}
                    author={book.author}
                    price={book.price}
                    originalPrice={Math.round(book.price * 1.85)}
                    onAddToCart={() => handleAddToCart(book)}
                  />
                ))}
              </div>

              {expandedSubs[cat.name] && Object.keys(subs).length > 0 && (
                <div className="mt-16 space-y-16">
                  {Object.entries(subs).map(([subName, subBooks]) => (
                    <div key={subName}>
                      <h3 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8">{subName}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                        {subBooks.map((book: any) => (
                          <BookCard
                            key={book.id}
                            id={book.id}
                            img={book.imageUrl}
                            title={book.title}
                            author={book.author}
                            price={book.price}
                            originalPrice={Math.round(book.price * 1.85)}
                            onAddToCart={() => handleAddToCart(book)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      <Footer />
    </div>
  );
};

export default SpecialOffersPage;