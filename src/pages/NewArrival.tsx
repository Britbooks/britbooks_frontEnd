import React, { useState, useEffect } from "react";
import { 
  Search, ChevronLeft, ChevronRight, 
  Clock, ArrowRight 
} from "lucide-react";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { fetchBooks, fetchCategories } from "../data/books";
import BookCard from "../components/BookCard";

const NewArrivalsPage: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchBooks({ 
          page, 
          category, 
          search, 
          limit: 12, 
          sort: "createdAt", 
          order: "desc" 
        });
        // Ensure we are getting the correct array from the response
        setBooks(res.listings || res.books || []);
      } catch (err) {
        console.error("Error loading books:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, category, search]);

  return (
    <div className="bg-[#fcfcfd] min-h-screen text-slate-900 font-sans selection:bg-indigo-100">
      <TopBar />

      <header className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Freshly Catalogued</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-serif italic text-slate-900 tracking-tight mb-12">
            The New <span className="font-sans not-italic font-black text-indigo-600">Standard.</span>
          </h1>

          <div className="w-full max-w-2xl relative group">
            <div className="absolute inset-0 bg-indigo-500/10 blur-2xl group-focus-within:blur-3xl transition-all opacity-0 group-focus-within:opacity-100" />
            <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden transition-all focus-within:border-indigo-300">
              <div className="pl-6 text-slate-400">
                <Search size={22} />
              </div>
              <input 
                type="text"
                placeholder="Find your next obsession..."
                className="w-full px-4 py-6 outline-none text-lg bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="pr-3">
                <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="sticky top-4 z-40 mb-16 flex flex-col md:flex-row items-center justify-between gap-4 p-2 bg-white/80 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
            <button 
              onClick={() => setCategory(null)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!category ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Everything
            </button>
            {categories.map((cat: any) => (
              <button 
                key={cat._id}
                onClick={() => setCategory(cat.name)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${category === cat.name ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          <div className="hidden md:flex items-center gap-6 px-4">
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Clock size={14} className="text-indigo-500" /> Live Update: 2m ago
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-10">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] bg-slate-200/60 rounded-2xl animate-pulse" />
                <div className="h-4 bg-slate-200/60 rounded w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-8 gap-y-16">
            {books.map((book) => (
              <BookCard 
              key={book.id}
              id={book.id}
                img={book.imageUrl}
                title={book.title}
                author={book.author}
                price={book.price}
              />
            ))}
          </div>
        )}

        {/* Pagination Logic */}
        <div className="mt-32 flex flex-col items-center gap-8">
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => {
                setPage(p => p - 1);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center px-6 py-3 bg-slate-50 rounded-full text-sm font-bold border border-slate-100">
              <span className="text-slate-400">Page</span>
              <span className="mx-2 text-slate-900">{page}</span>
            </div>

            <button 
              onClick={() => {
                setPage(p => p + 1);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Back to Top
          </button>
        </div>
      </main>

      <Footer />
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default NewArrivalsPage;