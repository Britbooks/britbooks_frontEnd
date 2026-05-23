import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, ShoppingBag, Star } from "lucide-react";
import { useCart } from "../context/cartContext";
import toast from "react-hot-toast";

const SEARCH_API =
  "https://britbooks-api-production-8ebd.up.railway.app/api/market/search";

interface SearchResult {
  id: string;
  imageUrl: string;
  title: string;
  author: string;
  price: number;
  rating: number;
}

interface GlobalSearchBarProps {
  variant?: "light" | "dark";
  placeholder?: string;
  className?: string;
  onSelect?: () => void;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  variant = "light",
  placeholder = "Search books, authors, genres…",
  className = "",
  onSelect,
}) => {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [open, setOpen]       = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate   = useNavigate();
  const { addToCart } = useCart();

  /* ── position the portal dropdown under the input ── */
  useEffect(() => {
    if (open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [open, query]);

  /* ── debounced fetch ── */
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); setError(null); return; }
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      fetch(`${SEARCH_API}?keyword=${encodeURIComponent(query.trim())}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => {
          const raw: any[] = Array.isArray(data) ? data : data.results ?? [];
          setResults(raw.map(b => ({
            id:       b._id || b.bookId || b.id || "unknown",
            imageUrl: b.coverImageUrl || b.imageUrl || b.coverImage || b.thumbnail || "",
            title:    b.title  || "Untitled",
            author:   b.author || "Unknown Author",
            price:    Number(b.price)  || 0,
            rating:   Number(b.rating) || 0,
          })));
          setOpen(true);
          setLoading(false);
        })
        .catch(() => { setError("Search failed. Please try again."); setLoading(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  /* ── close on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Esc to close ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") clear(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const clear = () => { setQuery(""); setResults([]); setOpen(false); };

  const handleSelect = (id: string) => {
    clear();
    navigate(`/browse/${id}`);
    onSelect?.();
  };

  const handleAddToCart = (e: React.MouseEvent, r: SearchResult) => {
    e.stopPropagation();
    addToCart({ id: r.id, img: r.imageUrl, title: r.title, author: r.author,
      price: `£${r.price.toFixed(2)}`, quantity: 1 });
    toast.success(`${r.title} added to your basket!`);
  };

  const dark = variant === "dark";

  const dropdown = open ? ReactDOM.createPortal(
    <div
      style={dropdownStyle}
      className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 p-4">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Searching…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="p-4 text-center text-sm text-red-500">{error}</p>
      )}

      {/* No results */}
      {!loading && !error && results.length === 0 && (
        <p className="p-4 text-center text-sm text-gray-400">No results for "{query}"</p>
      )}

      {/* Result rows — scrollable vertical list */}
      {!loading && results.length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          {results.map(r => (
            <div
              key={r.id}
              onClick={() => handleSelect(r.id)}
              className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Cover */}
              <img
                src={r.imageUrl || "https://via.placeholder.com/150"}
                alt={r.title}
                className="w-11 h-[60px] object-cover rounded-lg flex-shrink-0"
              />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                <p className="text-xs text-gray-500 truncate">{r.author}</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10}
                      className={i < Math.round(r.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-900 mt-0.5">£{r.price.toFixed(2)}</p>
              </div>
              {/* Add button */}
              <button
                onClick={e => handleAddToCart(e, r)}
                className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Add to Basket
              </button>
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={wrapperRef} className={`w-full ${className}`}>
      {/* Input */}
      <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
        dark
          ? "bg-white/10 border border-white/15 backdrop-blur-sm focus-within:bg-white/16 focus-within:border-white/30"
          : "bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-300 focus-within:shadow-sm"
      }`}>
        <Search className={`w-4 h-4 flex-shrink-0 ${dark ? "text-white/40" : "text-gray-400"}`} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-transparent text-sm focus:outline-none ${
            dark ? "text-white/80 placeholder-white/30" : "text-gray-800 placeholder-gray-400"
          }`}
        />
        {loading && (
          <div className={`w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0 ${
            dark ? "border-white/20 border-t-white/60" : "border-gray-200 border-t-gray-500"
          }`} />
        )}
        {query && !loading && (
          <button onClick={clear} className="flex-shrink-0">
            <X className={`w-3.5 h-3.5 ${dark ? "text-white/40" : "text-gray-400"}`} />
          </button>
        )}
      </div>

      {dropdown}
    </div>
  );
};

export default GlobalSearchBar;
