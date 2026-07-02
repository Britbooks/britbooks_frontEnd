import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Gift, Star, Flame, Sparkles,
  ShoppingCart, ChevronRight, RotateCcw, Trophy, X, Check,
  ArrowRight, Lock, Loader2, LogIn, ChevronLeft,
  BookOpen, Heart, Globe, Tag,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import Footer from "../components/footer";
import TopBar from "../components/Topbar";
import SEOHead from "../components/SEOHead";
import { fetchBooks, fetchCategories } from "../data/books";
import { useCart } from "../context/cartContext";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://britbooks-api-production-8ebd.up.railway.app";

// ─── API helpers (UNCHANGED) ──────────────────────────────────────────────────
async function fetchRewardCode(prizeKey: string): Promise<string> {
  const token = localStorage.getItem('authToken');
  const res = await axios.post(
    `${API_BASE}/api/campaigns/claim-reward`,
    { prizeKey },
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
  return res.data.code;
}

async function fetchGameStatus(game: string): Promise<{ coolingDown: boolean; remainingMs: number }> {
  const token = localStorage.getItem('authToken');
  if (!token) return { coolingDown: false, remainingMs: 0 };
  try {
    const res = await axios.get(`${API_BASE}/api/campaigns/game-status?game=${game}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return { coolingDown: false, remainingMs: 0 };
  }
}

async function recordGamePlayed(game: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  try {
    await axios.post(`${API_BASE}/api/campaigns/record-game`, { game }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
}

// ─── Helpers (UNCHANGED) ─────────────────────────────────────────────────────
const fakeWas = (real: number) => {
  const multipliers = [1.4, 1.5, 1.6, 1.75, 1.85, 2.0, 2.2];
  const m = multipliers[Math.floor(real * 7) % multipliers.length];
  return parseFloat((real * m).toFixed(2));
};
const pct = (real: number, was: number) => Math.round(((was - real) / was) * 100);
const pad = (n: number) => n.toString().padStart(2, "0");

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
function isCoolingDownLocal(key: string): boolean {
  const ts = localStorage.getItem(key);
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < COOLDOWN_MS;
}
function setCooldownLocal(key: string) {
  localStorage.setItem(key, Date.now().toString());
}
function remainingLabel(ms: number): string {
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
function cooldownRemainingLocal(key: string): string {
  const ts = localStorage.getItem(key);
  if (!ts) return "";
  const left = COOLDOWN_MS - (Date.now() - parseInt(ts, 10));
  return remainingLabel(left);
}

// ─── Countdown (UNCHANGED) ───────────────────────────────────────────────────
const Countdown = ({ seconds }: { seconds: number }) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const urgent = seconds > 0 && seconds < 600;
  return (
    <div className={`flex items-center gap-1 font-mono font-black text-sm ${urgent ? "text-red-500 animate-pulse" : "text-white"}`}>
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <React.Fragment key={i}>
          <span className="bg-white/10 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-xs">{v}</span>
          {i < 2 && <span className="text-white/40 text-xs">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── SpinWheel (UNCHANGED) ───────────────────────────────────────────────────
const PRIZES = [
  { label: "10% OFF",   color: "#ef4444", code: "SPIN10"   },
  { label: "FREE SHIP", color: "#3b82f6", code: "FREESHIP" },
  { label: "15% OFF",   color: "#f59e0b", code: "SPIN15"   },
  { label: "TRY AGAIN", color: "#6b7280", code: null        },
  { label: "20% OFF",   color: "#10b981", code: "SPIN20"   },
  { label: "5% OFF",    color: "#8b5cf6", code: "SPIN5"    },
  { label: "£2 OFF",    color: "#ec4899", code: "TWO0FF"   },
  { label: "TRY AGAIN", color: "#6b7280", code: null        },
];
const WHEEL_KEY = "bb_spin_ts";

const SpinWheel = () => {
  const [spinning, setSpinning]         = useState(false);
  const [rotation, setRotation]         = useState(0);
  const [result, setResult]             = useState<typeof PRIZES[0] | null>(null);
  const [used, setUsed]                 = useState(false);
  const [cooldownLabel, setCooldownLabel] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const [claiming, setClaiming]         = useState(false);
  const [claimedCode, setClaimedCode]   = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);
  const canvasRef                       = useRef<HTMLCanvasElement>(null);
  const slices                          = PRIZES.length;
  const arc                             = (2 * Math.PI) / slices;

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
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#0a1628";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => {
    fetchGameStatus('spin').then(s => {
      setUsed(s.coolingDown);
      if (s.remainingMs > 0) setCooldownLabel(remainingLabel(s.remainingMs));
      else if (isCoolingDownLocal(WHEEL_KEY)) {
        setUsed(true);
        setCooldownLabel(cooldownRemainingLocal(WHEEL_KEY) || "24h");
      }
    }).finally(() => setStatusLoading(false));
  }, []);

  useEffect(() => { if (!statusLoading) drawWheel(0); }, [statusLoading]);

  const spin = () => {
    if (spinning || used) return;
    setResult(null);
    setSpinning(true);
    const extra  = 5 + Math.floor(Math.random() * 5);
    const winner = Math.floor(Math.random() * slices);
    const target = -(winner * arc + arc / 2) + Math.PI / 2;
    const total  = extra * 2 * Math.PI + target;
    const totalMs = 4000;
    const start  = performance.now();
    const startRot = rotation;
    const animate = (now: number) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / totalMs, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      const cur      = startRot + total * ease;
      setRotation(cur);
      drawWheel(cur);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setUsed(true);
        setCooldownLocal(WHEEL_KEY);
        recordGamePlayed('spin');
        setResult(PRIZES[winner]);
      }
    };
    requestAnimationFrame(animate);
  };

  const copy = () => {
    if (!claimedCode) return;
    navigator.clipboard.writeText(claimedCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg" />
        </div>
        <canvas ref={canvasRef} width={260} height={260} className="rounded-full shadow-2xl" />
      </div>
      {!localStorage.getItem('authToken') ? (
        <Link to="/login" className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm bg-[#0a1628] hover:bg-[#0a1628]/80 text-white shadow-lg transition-all">
          <LogIn size={16} /> Log in to play
        </Link>
      ) : (
        <button
          onClick={spin}
          disabled={spinning || used || statusLoading}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm transition-all ${
            used ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95"
          }`}
        >
          {statusLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} className={spinning ? "animate-spin" : ""} />}
          {statusLoading ? "Loading…" : spinning ? "Spinning…" : used ? `Come back in ${cooldownLabel || "24h"}` : "SPIN TO WIN"}
        </button>
      )}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-lg p-5 text-center">
            {result.code ? (
              <>
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-black text-gray-900 text-lg mb-1">You won {result.label}!</p>
                {!claimedCode ? (
                  <>
                    <p className="text-gray-400 text-xs mb-3">Claim your reward to reveal your unique code.</p>
                    <button disabled={claiming}
                      onClick={async () => {
                        setClaiming(true);
                        try { const code = await fetchRewardCode(result.code!); setClaimedCode(code); }
                        catch { toast.error("Failed to generate code. Please try again."); }
                        finally { setClaiming(false); }
                      }}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
                      {claiming ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : "Claim Reward"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-xs mb-3">Use at checkout — valid 30 days</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-2.5 font-mono font-bold text-gray-800 tracking-widest text-sm">{claimedCode}</div>
                      <button onClick={copy} className="p-2.5 bg-[#0a1628] text-white rounded-xl hover:bg-[#0a1628]/80 transition-colors">
                        {copied ? <Check size={16} /> : <Gift size={16} />}
                      </button>
                    </div>
                  </>
                )}
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

// ─── ScratchCard (UNCHANGED) ─────────────────────────────────────────────────
const SCRATCH_PRIZES = ["12% OFF","FREE SHIP","£3 OFF","8% OFF","MYSTERY BOOK","15% OFF"];
const SCRATCH_CODES  = ["SCRATCH12","FREESHIP","THREE0FF","SCRATCH8","MYSTBOOK","SCRATCH15"];
const SCRATCH_KEY    = "bb_scratch_ts";

const ScratchCard = () => {
  const canvasRef                       = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed]         = useState(false);
  const [claiming, setClaiming]         = useState(false);
  const [claimedCode, setClaimedCode]   = useState<string | null>(null);
  const [locked, setLocked]             = useState(false);
  const [cooldownLabel, setCooldownLabel] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const [prize]                         = useState(() => Math.floor(Math.random() * SCRATCH_PRIZES.length));
  const [scratched, setScratched]       = useState(0);
  const [copied, setCopied]             = useState(false);
  const isDrawing                       = useRef(false);

  useEffect(() => {
    fetchGameStatus('scratch').then(s => {
      if (s.coolingDown) { setLocked(true); setCooldownLabel(remainingLabel(s.remainingMs) || "24h"); }
      else if (isCoolingDownLocal(SCRATCH_KEY)) { setLocked(true); setCooldownLabel(cooldownRemainingLocal(SCRATCH_KEY) || "24h"); }
    }).finally(() => setStatusLoading(false));
  }, []);

  useEffect(() => {
    if (locked || statusLoading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#374151";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✦ SCRATCH HERE ✦", canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = "11px sans-serif";
    ctx.fillText("Reveal your prize", canvas.width / 2, canvas.height / 2 + 10);
  }, [locked, statusLoading]);

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
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent++;
    const pctScratched = (transparent / (canvas.width * canvas.height)) * 100;
    setScratched(pctScratched);
    if (pctScratched > 55 && !revealed) { setRevealed(true); setCooldownLocal(SCRATCH_KEY); recordGamePlayed('scratch'); }
  };

  const handlers = {
    onMouseDown:  (e: React.MouseEvent)  => { isDrawing.current = true; scratch(e.clientX, e.clientY); },
    onMouseMove:  (e: React.MouseEvent)  => { if (isDrawing.current) scratch(e.clientX, e.clientY); },
    onMouseUp:    ()                     => { isDrawing.current = false; },
    onMouseLeave: ()                     => { isDrawing.current = false; },
    onTouchStart: (e: React.TouchEvent)  => { isDrawing.current = true; scratch(e.touches[0].clientX, e.touches[0].clientY); },
    onTouchMove:  (e: React.TouchEvent)  => { if (isDrawing.current) scratch(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); },
    onTouchEnd:   ()                     => { isDrawing.current = false; },
  };

  const copy = () => {
    if (!claimedCode) return;
    navigator.clipboard.writeText(claimedCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!localStorage.getItem('authToken')) return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <Lock className="w-10 h-10 text-gray-300" />
      <p className="font-bold text-gray-500 text-sm">Log in to play</p>
      <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0a1628] hover:bg-[#0a1628]/80 text-white transition-colors">
        <LogIn size={14} /> Sign in
      </Link>
    </div>
  );

  if (statusLoading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
    </div>
  );

  if (locked) return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <Lock className="w-10 h-10 text-gray-300" />
      <p className="font-bold text-gray-500 text-sm">Already scratched today!</p>
      <p className="text-xs text-gray-400">Come back in {cooldownLabel || "24h"}</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-64 h-36 rounded-2xl overflow-hidden shadow-xl select-none cursor-crosshair">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c] to-[#f59e0b] flex flex-col items-center justify-center">
          <Trophy className="w-8 h-8 text-white mb-1" />
          <p className="font-black text-white text-xl">{SCRATCH_PRIZES[prize]}</p>
        </div>
        <canvas ref={canvasRef} width={256} height={144} className="absolute inset-0 w-full h-full touch-none" {...handlers} />
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#c9a84c] transition-all duration-300 rounded-full" style={{ width: `${Math.min(scratched, 100)}%` }} />
      </div>
      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-md p-4 text-center">
            <p className="font-black text-gray-900 mb-1">You scratched <span className="text-[#c9a84c]">{SCRATCH_PRIZES[prize]}</span>!</p>
            {!claimedCode ? (
              <>
                <p className="text-gray-400 text-xs mb-3">Claim your reward to reveal your unique code.</p>
                <button disabled={claiming}
                  onClick={async () => {
                    setClaiming(true);
                    try { const code = await fetchRewardCode(SCRATCH_CODES[prize]); setClaimedCode(code); }
                    catch { toast.error("Failed to generate code. Please try again."); }
                    finally { setClaiming(false); }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#c9a84c] hover:bg-[#d4b860] disabled:opacity-60 text-[#0a1628] font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  {claiming ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : "Claim Reward"}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-3 py-2 font-mono font-bold text-gray-800 tracking-widest text-sm">{claimedCode}</div>
                <button onClick={copy} className="p-2.5 bg-[#c9a84c] text-[#0a1628] rounded-xl hover:bg-[#d4b860] transition-colors">
                  {copied ? <Check size={15} /> : <Gift size={15} />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── MysteryBox (UNCHANGED logic, minor style) ───────────────────────────────
const MYSTERY_KEY = "bb_mystery_ts";

const MysteryBox = ({ books }: { books: any[] }) => {
  const [opened, setOpened]     = useState<number | null>(null);
  const [revealed, setRevealed] = useState<any | null>(null);
  const [locked, setLocked]     = useState(false);
  const [cooldownLabel, setCooldownLabel] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const { addToCart }           = useCart();

  useEffect(() => {
    fetchGameStatus('mystery').then(s => {
      if (s.coolingDown) { setLocked(true); setCooldownLabel(remainingLabel(s.remainingMs) || "24h"); }
      else if (isCoolingDownLocal(MYSTERY_KEY)) { setLocked(true); setCooldownLabel(cooldownRemainingLocal(MYSTERY_KEY) || "24h"); }
    }).finally(() => setStatusLoading(false));
  }, []);

  const open = (i: number) => {
    if (opened !== null || locked) return;
    setOpened(i);
    setCooldownLocal(MYSTERY_KEY);
    recordGamePlayed('mystery');
    const book = books[Math.floor(Math.random() * books.length)];
    setRevealed(book);
  };

  const reset = () => { setOpened(null); setRevealed(null); };

  if (!localStorage.getItem('authToken')) return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <Lock className="w-10 h-10 text-gray-300" />
      <p className="font-bold text-gray-500 text-sm">Log in to play</p>
      <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0a1628] hover:bg-[#0a1628]/80 text-white transition-colors">
        <LogIn size={14} /> Sign in
      </Link>
    </div>
  );
  if (statusLoading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-8 h-8 text-gray-300 animate-spin" /></div>;
  if (locked) return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <Lock className="w-10 h-10 text-gray-300" />
      <p className="font-bold text-gray-500 text-sm">Mystery box already opened today!</p>
      <p className="text-xs text-gray-400">Come back in {cooldownLabel || "24h"}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <motion.button key={i} whileTap={{ scale: 0.93 }} onClick={() => open(i)} disabled={opened !== null}
            className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-sm font-bold ${
              opened === i ? "border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]"
              : opened !== null ? "border-gray-100 bg-gray-50 text-gray-300"
              : "border-gray-200 bg-white hover:border-[#c9a84c] hover:bg-[#c9a84c]/5 text-gray-600 cursor-pointer shadow-sm"
            }`}
          >
            <span className="text-3xl">{opened === i ? "📖" : "🎁"}</span>
            {opened === i ? "Revealed!" : `Box ${i + 1}`}
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="flex gap-4 p-4">
              <img src={revealed.imageUrl} alt={revealed.title} className="w-16 h-24 object-cover rounded-xl shrink-0" />
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
                  onClick={() => { addToCart({ id: revealed.id, img: revealed.imageUrl, title: revealed.title, author: revealed.author, price: `£${revealed.price.toFixed(2)}`, quantity: 1 }); toast.success("Added to basket!"); }}
                  className="mt-3 flex items-center gap-1.5 bg-[#0a1628] hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                  <ShoppingCart size={12} /> Add to basket
                </button>
              </div>
            </div>
            <button onClick={reset} className="w-full py-2.5 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 transition-colors">Try again →</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────
const shimmer = {
  background: "linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.4s ease infinite",
} as React.CSSProperties;

// ─── Deal Card (REDESIGNED) ───────────────────────────────────────────────────
const DealCard = ({ book, timer }: { book: any; timer: number }) => {
  const { addToCart }     = useCart();
  const navigate          = useNavigate();
  const was               = fakeWas(book.price);
  const saving            = pct(book.price, was);
  const [added, setAdded] = useState(false);
  const h = Math.floor(timer / 3600);
  const m = Math.floor((timer % 3600) / 60);
  const urgent = timer > 0 && timer < 600;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({ id: book.id, img: book.imageUrl, title: book.title, author: book.author, price: `£${book.price.toFixed(2)}`, quantity: 1 });
    setAdded(true);
    toast.success("Added to basket!");
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={() => navigate(`/browse/${book.id}`)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ paddingBottom: "133%" }}>
        <img
          src={book.imageUrl}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2">
          <span className="flex items-center gap-0.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            <Zap size={9} fill="currentColor" /> -{saving}%
          </span>
        </div>
        {/* Timer */}
        {timer > 0 && (
          <div className={`absolute bottom-2 right-2 flex items-center gap-1 font-mono text-[10px] font-black px-2 py-0.5 rounded-full ${urgent ? "bg-red-600 text-white animate-pulse" : "bg-black/60 backdrop-blur-sm text-white"}`}>
            {pad(h)}:{pad(m)}
          </div>
        )}
        {/* Add to cart overlay */}
        <div className="absolute inset-x-2 bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleAdd}
            className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-lg ${added ? "bg-emerald-500 text-white" : "bg-[#0a1628] hover:bg-red-600 text-white"}`}
          >
            {added ? <><Check size={12} /> Added!</> : <><ShoppingCart size={12} /> Add to Basket</>}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug mb-1">{book.title}</p>
          <p className="text-[10px] text-gray-400 truncate">{book.author}</p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-gray-900 text-sm">£{book.price.toFixed(2)}</span>
            <span className="text-[10px] text-gray-400 line-through">£{was.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DealCardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-white border border-gray-100">
    <div style={{ paddingBottom: "133%", position: "relative" }}>
      <div className="absolute inset-0" style={shimmer} />
    </div>
    <div className="p-3 space-y-2">
      <div className="h-3 rounded w-full" style={shimmer} />
      <div className="h-3 rounded w-2/3" style={shimmer} />
      <div className="h-3 rounded w-1/3" style={shimmer} />
    </div>
  </div>
);

// ─── Mobile hero deal card ────────────────────────────────────────────────────
const MobileHeroDealCard = ({ book, timer }: { book: any; timer: number }) => {
  const { addToCart } = useCart();
  const navigate      = useNavigate();
  const was           = fakeWas(book.price);
  const saving        = pct(book.price, was);

  return (
    <div
      className="snap-start flex-shrink-0 w-[72vw] relative rounded-3xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
      style={{ height: 260 }}
      onClick={() => navigate(`/browse/${book.id}`)}
    >
      <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Save badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
        <Zap size={9} fill="currentColor" /> -{saving}%
      </div>

      {/* Timer */}
      {timer > 0 && (
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-full">
          {pad(Math.floor(timer / 3600))}:{pad(Math.floor((timer % 3600) / 60))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-bold text-sm line-clamp-2 leading-tight mb-0.5">{book.title}</p>
        <p className="text-white/50 text-xs mb-2">{book.author}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-white font-black text-base">£{book.price.toFixed(2)}</span>
            <span className="text-white/40 text-xs line-through">£{was.toFixed(2)}</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); addToCart({ id: book.id, img: book.imageUrl, title: book.title, author: book.author, price: `£${book.price.toFixed(2)}`, quantity: 1 }); toast.success("Added!"); }}
            className="p-2 bg-[#c9a84c] hover:bg-[#d4b860] text-[#0a1628] rounded-xl active:scale-90 transition-all"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Category icon helper ─────────────────────────────────────────────────────
const getCatIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("fiction") || n.includes("novel")) return <BookOpen size={14} />;
  if (n.includes("romance") || n.includes("love"))  return <Heart size={14} />;
  if (n.includes("history") || n.includes("world")) return <Globe size={14} />;
  return <Tag size={14} />;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const SpecialOffersPage = () => {
  const [books, setBooks]           = useState<any[]>([]);
  const [flashBooks, setFlashBooks] = useState<any[]>([]);
  const [heroBook, setHeroBook]     = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [timers, setTimers]         = useState<number[]>([]);
  const [heroTimer, setHeroTimer]   = useState(7200);
  const [loading, setLoading]       = useState(true);
  const [activeGame, setActiveGame] = useState<"wheel" | "scratch" | "mystery" | null>(null);
  const { addToCart }               = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const [clearance, popular, newArr, cats] = await Promise.all([
          fetchBooks({ shelf: "clearanceItems", limit: 20 }),
          fetchBooks({ shelf: "popularBooks",   limit: 20 }),
          fetchBooks({ shelf: "newArrivals",    limit: 12 }),
          fetchCategories(),
        ]);
        const all = [
          ...(clearance?.listings ?? []),
          ...(popular?.listings   ?? []),
        ];
        const unique = Array.from(new Map(all.map((b: any) => [b.id, b])).values());
        setHeroBook(unique[0] ?? null);
        setBooks(unique.slice(1));
        setFlashBooks((newArr?.listings ?? []).slice(0, 8));
        setTimers(unique.slice(1, 25).map(() => Math.floor(Math.random() * 64800) + 7200));
        setCategories((cats ?? []).map((c: any) => ({ id: c._id, name: c.name })));
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

  const allDealBooks = heroBook ? [heroBook, ...books] : books;
  const filteredBooks = selectedCat
    ? allDealBooks.filter((b: any) => b.category === selectedCat)
    : allDealBooks;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#c9a84c] rounded-full animate-spin" />
        <p className="text-sm font-semibold text-white/50 uppercase tracking-widest">Loading deals…</p>
      </div>
    </div>
  );

  const GAME_TABS = [
    { key: "wheel",   icon: RotateCcw, label: "Spin & Win"  },
    { key: "scratch", icon: Sparkles,  label: "Scratch Card" },
    { key: "mystery", icon: Gift,      label: "Mystery Box"  },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f7f4ef] font-sans">
      <SEOHead
        title="Special Offers & Flash Sales"
        description="Win books, spin the wheel, scratch to reveal — BritBooks special offers with real savings on quality used books."
        canonical="/special-offers"
      />
      <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: "12px", fontWeight: 600, fontSize: "13px" } }} />

      {/* ══════════════════════════════════════
          MOBILE
      ══════════════════════════════════════ */}
      <div className="sm:hidden flex flex-col min-h-screen bg-[#f8f8fb]">
        <TopBar />

        {/* Sticky dark header */}
        <div className="sticky top-0 z-40 bg-[#0a1628] px-4 pb-0 pt-4 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={12} className="text-red-400" fill="currentColor" />
                <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">Flash Sale</span>
              </div>
              <h1 className="text-white font-black text-2xl tracking-tight">
                Special <span className="text-[#c9a84c]">Deals</span>
              </h1>
            </div>
            <div className="text-right mt-1">
              <p className="text-white/30 text-[8px] font-medium uppercase tracking-widest mb-1">Ends in</p>
              <Countdown seconds={heroTimer} />
            </div>
          </div>

          {/* Game pills */}
          <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
            {GAME_TABS.map(({ key, icon: Icon, label }) => (
              <button key={key}
                onClick={() => setActiveGame(activeGame === key ? null : key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  activeGame === key ? "bg-[#c9a84c] text-[#0a1628]" : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}>
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Game panel */}
        <AnimatePresence>
          {activeGame && (
            <motion.div key={activeGame}
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white border-b border-gray-100 shadow-md">
              <div className="p-6 max-w-sm mx-auto">
                {activeGame === "wheel"   && <SpinWheel />}
                {activeGame === "scratch" && <ScratchCard />}
                {activeGame === "mystery" && <MysteryBox books={flashBooks} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured deals horizontal scroll */}
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-red-600 rounded-full" />
            <span className="font-black text-sm text-gray-900">Featured Deals</span>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {loading
              ? Array(4).fill(0).map((_, i) => <div key={i} className="snap-start flex-shrink-0 w-[72vw] h-[260px] rounded-3xl bg-gray-200 animate-pulse" />)
              : [heroBook, ...books.slice(0, 5)].filter(Boolean).map((book, i) => (
                  <MobileHeroDealCard key={book.id} book={book} timer={i === 0 ? heroTimer : timers[i] ?? 3600} />
                ))
            }
          </div>
        </div>

        {/* All deals grid */}
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-[#c9a84c] rounded-full" />
            <span className="font-black text-sm text-gray-900">All Deals</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-32">
            {loading
              ? Array(8).fill(0).map((_, i) => <DealCardSkeleton key={i} />)
              : allDealBooks.slice(0, 20).map((book, i) => (
                  <DealCard key={book.id} book={book} timer={i === 0 ? heroTimer : timers[i] ?? 3600} />
                ))
            }
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP
      ══════════════════════════════════════ */}
      <div className="hidden sm:block min-h-screen">
        <TopBar />

        {/* ── Cinematic Hero ── */}
        {heroBook && (
          <section className="relative overflow-hidden" style={{ minHeight: 520 }}>
            {/* Blurred book cover as background */}
            <div className="absolute inset-0">
              <img
                src={heroBook.imageUrl}
                alt=""
                className="w-full h-full object-cover scale-110"
                style={{ filter: "blur(24px) brightness(0.25) saturate(1.4)" }}
              />
            </div>
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/70 to-[#0a1628]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" style={{ top: "60%" }} />

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 flex items-center gap-16">
              {/* Left copy */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-[11px] font-black mb-6 uppercase tracking-wider">
                  <Flame size={12} fill="currentColor" /> Flash Sale · Ends in
                  <Countdown seconds={heroTimer} />
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none mb-4">
                  Today's<br />
                  <span className="text-[#c9a84c]">Top Deal</span>
                </h1>
                <p className="text-white/80 text-xl mb-1 line-clamp-1">{heroBook.title}</p>
                <p className="text-white/40 text-sm mb-8">by {heroBook.author}</p>
                <div className="flex items-baseline gap-4 mb-8">
                  <span className="text-5xl font-black text-white">£{heroBook.price.toFixed(2)}</span>
                  <span className="text-2xl text-white/30 line-through">£{fakeWas(heroBook.price).toFixed(2)}</span>
                  <span className="bg-red-600 text-white text-sm font-black px-3 py-1.5 rounded-full">
                    SAVE {pct(heroBook.price, fakeWas(heroBook.price))}%
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { addToCart({ id: heroBook.id, img: heroBook.imageUrl, title: heroBook.title, author: heroBook.author, price: `£${heroBook.price.toFixed(2)}`, quantity: 1 }); toast.success("Added to basket!"); }}
                    className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b860] text-[#0a1628] font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg"
                  >
                    <ShoppingCart size={18} /> Add to Basket
                  </button>
                  <Link to={`/browse/${heroBook.id}`}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold px-8 py-4 rounded-2xl transition-all">
                    View Book <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Book cover */}
              <div className="relative w-52 lg:w-64 flex-shrink-0 hidden md:block">
                <div className="absolute -inset-8 bg-[#c9a84c]/15 rounded-full blur-3xl" />
                <img
                  src={heroBook.imageUrl}
                  alt={heroBook.title}
                  className="relative w-full rounded-3xl shadow-2xl ring-1 ring-white/10"
                />
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-red-600/20">
                  <div className="text-center">
                    <p className="text-white font-black text-[8px] uppercase leading-none">SAVE</p>
                    <p className="text-white font-black text-sm">{pct(heroBook.price, fakeWas(heroBook.price))}%</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Games Panel (overlapping hero) ── */}
        <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-10 pb-10">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 pt-5 pb-0 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Gift size={16} className="text-[#c9a84c]" />
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900">Win Rewards</span>
                </div>
                <p className="text-[11px] text-gray-400">Spin, scratch or pick a mystery box to get a discount code</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                Daily Reset
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-gray-100 mt-4">
              {GAME_TABS.map(({ key, icon: Icon, label }) => (
                <button key={key}
                  onClick={() => setActiveGame(activeGame === key ? null : key)}
                  className={`flex items-center justify-center gap-2 py-3.5 px-3 text-sm font-bold transition-all border-b-2 ${
                    activeGame === key
                      ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5"
                      : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                  }`}>
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeGame ? (
                <motion.div key={activeGame}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="p-8 max-w-sm mx-auto">
                    {activeGame === "wheel"   && <SpinWheel />}
                    {activeGame === "scratch" && <ScratchCard />}
                    {activeGame === "mystery" && <MysteryBox books={flashBooks} />}
                  </div>
                </motion.div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <Sparkles size={28} className="mx-auto mb-2 text-gray-200" />
                  Pick a game above to win discount codes &amp; book deals
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── Flash Deals Strip ── */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={15} className="text-red-500" fill="currentColor" />
                <span className="text-xs font-black uppercase tracking-widest text-red-500">Flash Deals</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">New Arrivals on Sale</h2>
            </div>
            <Link to="/new-arrivals" className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {flashBooks.map((book, i) => (
              <DealCard key={book.id} book={book} timer={timers[i] ?? 3600} />
            ))}
          </div>
        </section>

        {/* ── All Deals: Sidebar + Grid ── */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex gap-8 items-start">

            {/* Sidebar */}
            <aside className="w-52 flex-shrink-0 hidden lg:block">
              <div className="sticky top-24">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-3">Filter by Genre</h4>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setSelectedCat(null)}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={!selectedCat ? { background: "#dc2626", color: "white" } : { color: "#374151" }}
                  >
                    All Deals
                  </button>
                  {categories.map(cat => (
                    <button key={cat.id}
                      onClick={() => setSelectedCat(selectedCat === cat.name ? null : cat.name)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-all capitalize"
                      style={selectedCat === cat.name ? { background: "#dc2626", color: "white" } : { color: "#374151" }}
                    >
                      {getCatIcon(cat.name)} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Star size={15} className="text-[#c9a84c]" fill="currentColor" />
                    <span className="text-xs font-black uppercase tracking-widest text-[#c9a84c]">All Deals</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {selectedCat ? selectedCat : "Clearance & Popular Picks"}
                  </h2>
                </div>
                <span className="text-xs text-gray-400 font-medium">{filteredBooks.length} books</span>
              </div>

              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBooks.slice(0, 20).map((book, i) => (
                  <DealCard key={book.id} book={book} timer={i === 0 ? heroTimer : timers[i] ?? 3600} />
                ))}
              </div>

              <div className="text-center mt-10">
                <Link to="/clearance"
                  className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-red-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-md">
                  View All Clearance <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Promo Banner ── */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="relative overflow-hidden bg-[#0a1628] rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Background texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #c9a84c 0%, transparent 50%), radial-gradient(circle at 80% 20%, #dc2626 0%, transparent 40%)" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} className="text-[#c9a84c]" />
                <span className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest">Members Only</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Free UK Delivery</h3>
              <p className="text-white/40 text-sm">On all orders over £15 — no code needed</p>
            </div>
            <Link to="/signup"
              className="relative shrink-0 flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b860] text-[#0a1628] font-black px-8 py-4 rounded-2xl transition-all whitespace-nowrap shadow-lg">
              Join Free <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <Footer />
      </div>

      <style>{`
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default SpecialOffersPage;
