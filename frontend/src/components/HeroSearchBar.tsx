import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowRight } from "lucide-react";

const SEARCH_API =
  "https://britbooks-api-production-8ebd.up.railway.app/api/market/search";

interface Result {
  id: string;
  imageUrl?: string;
  title: string;
  author: string;
  price: number;
  category?: string;
}

interface DropdownStyle {
  top: number;
  left: number;
  width: number;
}

interface Props {
  placeholder?: string;
  accent?: "red" | "green" | "blue";
}

const ACCENT = {
  red:   { border: "rgba(220,38,38,0.7)",  bg: "rgba(220,38,38,0.12)",  icon: "#f87171",  shadow: "rgba(220,38,38,0.25)" },
  green: { border: "rgba(22,163,74,0.7)",  bg: "rgba(22,163,74,0.12)",  icon: "#4ade80",  shadow: "rgba(22,163,74,0.25)" },
  blue:  { border: "rgba(59,130,246,0.7)", bg: "rgba(59,130,246,0.12)", icon: "#60a5fa",  shadow: "rgba(59,130,246,0.25)" },
};

const HeroSearchBar: React.FC<Props> = ({
  placeholder = "Search books, authors, genres…",
  accent,
}) => {
  const [query, setQuery]           = useState("");
  const [focused, setFocused]       = useState(false);
  const [results, setResults]       = useState<Result[]>([]);
  const [loading, setLoading]       = useState(false);
  const [highlight, setHighlight]   = useState(-1);
  const [dropPos, setDropPos]       = useState<DropdownStyle | null>(null);

  const inputRef     = useRef<HTMLInputElement>(null);
  const pillRef      = useRef<HTMLDivElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const navigate     = useNavigate();

  const isOpen = focused && (loading || results.length > 0 || query.trim().length > 0);

  /* ── reposition portal dropdown to sit below the pill ── */
  const reposition = useCallback(() => {
    if (!pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (isOpen) reposition();
  }, [isOpen, query, reposition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen, reposition]);

  /* ── close on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedPill    = pillRef.current?.contains(target);
      const clickedPortal  = document.getElementById("hero-search-portal")?.contains(target);
      if (!clickedPill && !clickedPortal) {
        setFocused(false);
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── debounced search ── */
  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const res  = await fetch(`${SEARCH_API}?keyword=${encodeURIComponent(query.trim())}`, {
          signal: abortRef.current.signal,
        });
        const data = await res.json();
        setResults(
          (data.results || data.listings || data.books || []).slice(0, 6).map((r: any) => ({
            id:       r._id || r.id,
            imageUrl: r.coverImageUrl || r.imageUrl,
            title:    r.title,
            author:   r.author,
            price:    r.price,
            category: r.category,
          }))
        );
      } catch (err: any) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  /* ── keyboard nav ── */
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown")              { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)); }
    if (e.key === "ArrowUp")               { e.preventDefault(); setHighlight(h => Math.max(h - 1, -1)); }
    if (e.key === "Enter" && highlight >= 0) pickResult(results[highlight]);
    if (e.key === "Escape")                { setFocused(false); setResults([]); inputRef.current?.blur(); }
  };

  const pickResult = (r: Result) => {
    setFocused(false); setResults([]); setQuery("");
    navigate(`/browse/${r.id}`);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery(""); setResults([]);
    inputRef.current?.focus();
  };

  /* ── portal dropdown ── */
  const dropdown = isOpen && dropPos ? ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        id="hero-search-portal"
        key="hero-dropdown"
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top:    dropPos.top,
          left:   dropPos.left,
          width:  dropPos.width,
          zIndex: 99999,
          borderRadius: 16,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 6px 20px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        {loading && results.length === 0 ? (
          /* skeleton */
          <div className="px-4 py-4 space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 animate-pulse flex-shrink-0" style={{ width: 36, height: 52 }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ul>
              {results.map((r, i) => (
                <li key={r.id}>
                  <motion.button
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onMouseDown={() => pickResult(r)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      highlight === i ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Cover */}
                    <div className="rounded-lg overflow-hidden flex-shrink-0 bg-gray-100"
                      style={{ width: 36, height: 52 }}>
                      {r.imageUrl
                        ? <img src={r.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">📚</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-[13px] font-bold leading-tight line-clamp-1">{r.title}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-1">by {r.author}</p>
                      {r.category && (
                        <p className="text-[#c9a84c] text-[10px] font-bold mt-0.5 capitalize">{r.category}</p>
                      )}
                    </div>

                    {/* Price + arrow */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                      {typeof r.price === "number" && (
                        <span className="text-gray-900 font-black text-[13px]">£{r.price.toFixed(2)}</span>
                      )}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        highlight === i ? "bg-[#c9a84c]" : "bg-gray-100"
                      }`}>
                        <ArrowRight className={`w-3 h-3 ${highlight === i ? "text-white" : "text-gray-400"}`} />
                      </div>
                    </div>
                  </motion.button>
                  {i < results.length - 1 && <div className="mx-4 h-px bg-gray-100" />}
                </li>
              ))}
            </ul>
            <div className="px-4 py-2.5 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center">Click a result to view the book</p>
            </div>
          </>
        ) : query.trim() && !loading ? (
          <div className="px-4 py-6 text-center">
            <p className="text-gray-600 text-sm font-semibold">No results for "{query}"</p>
            <p className="text-gray-400 text-[11px] mt-1">Try a different title or author</p>
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <div className="flex justify-end">
        <motion.div
          ref={pillRef}
          animate={{ width: focused ? 520 : 320 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          style={{ maxWidth: "100%", position: "relative" }}
        >
          <div
            className="flex items-center gap-2.5 rounded-2xl px-4 py-3 cursor-text transition-all duration-200"
            style={focused ? {
              background: "#fff",
              border: `1.5px solid ${accent ? ACCENT[accent].border : "rgba(255,255,255,0.8)"}`,
              boxShadow: `0 8px 32px ${accent ? ACCENT[accent].shadow : "rgba(0,0,0,0.2)"}, 0 2px 8px rgba(0,0,0,0.08)`,
            } : {
              background: "rgba(255,255,255,0.92)",
              border: "1.5px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={() => { setFocused(true); inputRef.current?.focus(); }}
          >
            <motion.div
              animate={{ scale: focused ? 1 : 0.88, opacity: focused ? 1 : 0.65 }}
              transition={{ duration: 0.15 }}
            >
              <Search
                className="w-4 h-4 flex-shrink-0 transition-colors duration-200"
                style={{ color: focused && accent ? ACCENT[accent].border : "#9ca3af" }}
              />
            </motion.div>

            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setHighlight(-1); }}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-gray-900 text-sm placeholder-gray-400 focus:outline-none min-w-0"
            />

            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.12 }}
                  onClick={clear}
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </motion.button>
              )}
            </AnimatePresence>

            {loading && (
              <motion.div
                className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-gray-500 flex-shrink-0"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
              />
            )}
          </div>
        </motion.div>
      </div>

      {dropdown}
    </>
  );
};

export default HeroSearchBar;
