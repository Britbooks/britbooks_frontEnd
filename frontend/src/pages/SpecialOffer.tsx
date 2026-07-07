import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Gift, Star, Flame, Sparkles,
  ShoppingCart, ChevronRight, RotateCcw, Trophy, X, Check,
  ArrowRight, Lock, Loader2, LogIn,
  BookOpen, Heart, Globe, Tag, Timer,
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

// ─── MysteryBox (UNCHANGED) ──────────────────────────────────────────────────
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

// ─── Deal Card ────────────────────────────────────────────────────────────────
const DealCard = ({ book, timer }: { book: any; timer: number }) => {
  const { addToCart }     = useCart();
  const navigate          = useNavigate();
  const was               = fakeWas(book.price);
  const saving            = pct(book.price, was);
  const [added, setAdded] = useState(false);
  const urgent            = timer > 0 && timer < 600;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({ id: book.id, img: book.imageUrl, title: book.title, author: book.author, price: `£${book.price.toFixed(2)}`, quantity: 1 });
    setAdded(true);
    toast.success("Added to basket!");
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={() => navigate(`/browse/${book.id}`)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer flex flex-col"
    >
      <div className="relative overflow-hidden" style={{ paddingBottom: "133%" }}>
        <img
          src={book.imageUrl}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
        />
        {/* Savings badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            -{saving}%
          </span>
        </div>
        {/* Timer — only when urgent */}
        {urgent && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-red-600 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
            <Timer size={8} /> {pad(Math.floor(timer / 60))}m
          </div>
        )}
        {/* Cart hover button */}
        <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={handleAdd}
            className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-colors ${
              added ? "bg-emerald-500 text-white" : "bg-[#0a1628] hover:bg-red-600 text-white"
            }`}
          >
            {added ? <><Check size={12} /> Added!</> : <><ShoppingCart size={12} /> Add to Basket</>}
          </button>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug mb-0.5">{book.title}</p>
          <p className="text-[10px] text-gray-400 truncate">{book.author}</p>
        </div>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="font-black text-gray-900 text-sm">£{book.price.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400 line-through">£{was.toFixed(2)}</span>
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

// ─── Mobile snap-scroll deal card ─────────────────────────────────────────────
const MobileHeroDealCard = ({ book, timer }: { book: any; timer: number }) => {
  const { addToCart } = useCart();
  const navigate      = useNavigate();
  const was           = fakeWas(book.price);
  const saving        = pct(book.price, was);

  return (
    <div
      className="snap-start flex-shrink-0 w-[72vw] relative rounded-3xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
      style={{ height: 240 }}
      onClick={() => navigate(`/browse/${book.id}`)}
    >
      <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
        -{saving}%
      </div>
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
            className="p-2 bg-white text-[#0a1628] rounded-xl active:scale-90 transition-all"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const getCatIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("fiction") || n.includes("novel")) return <BookOpen size={13} />;
  if (n.includes("romance") || n.includes("love"))  return <Heart size={13} />;
  if (n.includes("history") || n.includes("world")) return <Globe size={13} />;
  return <Tag size={13} />;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const SpecialOffersPage = () => {
  const [books, setBooks]             = useState<any[]>([]);
  const [flashBooks, setFlashBooks]   = useState<any[]>([]);
  const [heroBook, setHeroBook]       = useState<any | null>(null);
  const [categories, setCategories]   = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [timers, setTimers]           = useState<number[]>([]);
  const [heroTimer, setHeroTimer]     = useState(7200);
  const [loading, setLoading]         = useState(true);
  const [activeGame, setActiveGame]   = useState<"wheel" | "scratch" | "mystery" | null>(null);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [heroBg]                      = useState(() => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/1600/900`);
  const { addToCart }                 = useCart();

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <img
        src="/logobritr.png"
        alt=""
        className="w-40 h-auto select-none"
        style={{ animation: "brit-logo-breathe 2.2s ease-in-out infinite" }}
        draggable={false}
      />
      <div className="flex gap-2.5 mt-8">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#1e3a8a", animation: "brit-dot-bounce 1.1s ease-in-out infinite", animationDelay: "0s" }} />
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#dc2626", animation: "brit-dot-bounce 1.1s ease-in-out infinite", animationDelay: "0.15s" }} />
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#1e3a8a", animation: "brit-dot-bounce 1.1s ease-in-out infinite", animationDelay: "0.3s" }} />
      </div>
      <p className="mt-5 font-bold uppercase text-[#94918a]" style={{ fontSize: 11, letterSpacing: "0.28em" }}>
        Unwrapping today's deals
      </p>
    </div>
  );

  const GAME_TABS = [
    { key: "wheel",   icon: RotateCcw, label: "Spin & Win",   desc: "Spin the wheel for a discount code" },
    { key: "scratch", icon: Sparkles,  label: "Scratch Card",  desc: "Scratch to reveal a surprise reward" },
    { key: "mystery", icon: Gift,      label: "Mystery Box",   desc: "Pick a box for a hidden book deal"  },
  ] as const;

  return (
    <div className="min-h-screen bg-white font-sans">
      <SEOHead
        title="Special Offers & Flash Sales"
        description="Save on quality used books at BritBooks — clearance deals, flash sales and daily discount rewards."
        canonical="/special-offers"
      />
      <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: "12px", fontWeight: 600, fontSize: "13px" } }} />

      {/* ══════════════════════════════════════
          MOBILE
      ══════════════════════════════════════ */}
      <div className="sm:hidden flex flex-col min-h-screen bg-[#f8f8fb]">
        <TopBar />

        {/* Sticky header */}
        <div className="sticky top-0 z-40 bg-[#0d1b3e] px-4 pb-0 pt-4 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={11} className="text-red-400" fill="currentColor" />
                <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">Flash Sale</span>
              </div>
              <h1 className="text-white font-black text-2xl tracking-tight">
                Special <span className="text-amber-400">Offers</span>
              </h1>
            </div>
            <div className="text-right mt-1">
              <p className="text-white/30 text-[8px] font-medium uppercase tracking-widest mb-1">Resets in</p>
              <Countdown seconds={heroTimer} />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCat(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${!selectedCat ? "bg-red-600 text-white" : "bg-white/10 text-white/70"}`}
            >
              All
            </button>
            {categories.slice(0, 10).map(cat => (
              <button key={cat.id}
                onClick={() => setSelectedCat(selectedCat === cat.name ? null : cat.name)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold capitalize transition-all ${selectedCat === cat.name ? "bg-red-600 text-white" : "bg-white/10 text-white/70"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Featured deals horizontal scroll */}
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-red-600 rounded-full" />
            <span className="font-black text-sm text-gray-900">Featured Deals</span>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {[heroBook, ...books.slice(0, 5)].filter(Boolean).map((book, i) => (
              <MobileHeroDealCard key={book.id} book={book} timer={i === 0 ? heroTimer : timers[i] ?? 3600} />
            ))}
          </div>
        </div>

        {/* Win Rewards accordion */}
        <div className="px-4 mt-5">
          <button
            onClick={() => setRewardsOpen(v => !v)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                <Gift size={16} className="text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-gray-900">Win a Reward</p>
                <p className="text-[10px] text-gray-400">Spin · Scratch · Mystery Box</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-gray-400 transition-transform ${rewardsOpen ? "rotate-90" : ""}`} />
          </button>

          <AnimatePresence>
            {rewardsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-2xl px-4 pb-5 pt-4">
                  {/* Game selector */}
                  <div className="flex gap-2 mb-4">
                    {GAME_TABS.map(({ key, icon: Icon, label }) => (
                      <button key={key}
                        onClick={() => setActiveGame(activeGame === key ? null : key)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                          activeGame === key
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-gray-100 bg-gray-50 text-gray-500"
                        }`}
                      >
                        <Icon size={16} />
                        {label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    {activeGame && (
                      <motion.div key={activeGame} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {activeGame === "wheel"   && <SpinWheel />}
                        {activeGame === "scratch" && <ScratchCard />}
                        {activeGame === "mystery" && <MysteryBox books={flashBooks} />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!activeGame && (
                    <p className="text-center text-xs text-gray-400 py-2">Select a game above to win a discount code</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* All deals grid */}
        <div className="px-4 mt-6 pb-28">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-amber-400 rounded-full" />
            <span className="font-black text-sm text-gray-900">
              {selectedCat ? selectedCat : "All Deals"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredBooks.slice(0, 20).map((book, i) => (
              <DealCard key={book.id} book={book} timer={i === 0 ? heroTimer : timers[i] ?? 3600} />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP
      ══════════════════════════════════════ */}
      <div className="hidden sm:block min-h-screen">
        <TopBar />

        {/* ── Hero ── */}
        <header
          className="relative pt-14 pb-12 px-6 md:px-8 overflow-hidden bg-[#0d1b3e]"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40" />
          <div className="relative z-10 max-w-[1440px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Flame size={13} className="text-red-400" fill="currentColor" />
                  <span className="text-white font-black uppercase tracking-[0.3em] block text-sm">
                    Flash Sale · Up to 55% Off
                  </span>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-xl">
                  Special Offers
                </h1>
                <p className="text-white/50 text-sm mt-2">Clearance deals · New arrivals · Daily rewards</p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                <div className="flex items-center gap-4 text-white">
                  <div className="text-center">
                    <p className="text-2xl font-black">{allDealBooks.length}+</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Books on sale</p>
                  </div>
                  <div className="w-px h-8 bg-white/15" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-red-400">Free</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">UK delivery £15+</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">Sale resets in</p>
                  <Countdown seconds={heroTimer} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Win Rewards strip ── */}
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0 mr-2">
                <Gift size={16} className="text-amber-500" />
                <span className="text-sm font-black text-gray-900">Win a Reward</span>
                <span className="text-[10px] font-semibold text-gray-400 ml-1">· resets daily</span>
              </div>
              <div className="flex gap-3 flex-1">
                {GAME_TABS.map(({ key, icon: Icon, label, desc }) => (
                  <button key={key}
                    onClick={() => setActiveGame(activeGame === key ? null : key)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex-1 justify-center ${
                      activeGame === key
                        ? "bg-white border-amber-300 text-amber-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active game panel */}
            <AnimatePresence>
              {activeGame && (
                <motion.div
                  key={activeGame}
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 max-w-sm mx-auto shadow-sm">
                    {activeGame === "wheel"   && <SpinWheel />}
                    {activeGame === "scratch" && <ScratchCard />}
                    {activeGame === "mystery" && <MysteryBox books={flashBooks} />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Flash Deals (new arrivals) ── */}
        {flashBooks.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={13} className="text-red-500" fill="currentColor" />
                  <span className="text-xs font-black uppercase tracking-widest text-red-500">New Arrivals</span>
                </div>
                <h2 className="text-xl font-black text-gray-900">Latest Deals</h2>
              </div>
              <Link to="/new-arrivals" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 font-semibold transition-colors">
                See all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
              {flashBooks.map((book, i) => (
                <DealCard key={book.id} book={book} timer={timers[i] ?? 3600} />
              ))}
            </div>
          </section>
        )}

        {/* ── Divider ── */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-t border-gray-100" />
        </div>

        {/* ── All Deals: sidebar + grid ── */}
        <section className="max-w-6xl mx-auto px-6 py-10 pb-16">
          <div className="flex gap-8 items-start">

            {/* Sidebar */}
            <aside className="w-48 flex-shrink-0 hidden lg:block">
              <div className="sticky top-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Filter by Genre</h4>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setSelectedCat(null)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${!selectedCat ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    <Star size={13} /> All Deals
                  </button>
                  {categories.map(cat => (
                    <button key={cat.id}
                      onClick={() => setSelectedCat(selectedCat === cat.name ? null : cat.name)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all capitalize ${
                        selectedCat === cat.name ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {getCatIcon(cat.name)} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {selectedCat ? selectedCat : "Clearance & Popular Picks"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">{filteredBooks.length} books on sale</p>
                </div>
              </div>

              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                {loading
                  ? Array(8).fill(0).map((_, i) => <DealCardSkeleton key={i} />)
                  : filteredBooks.slice(0, 20).map((book, i) => (
                      <DealCard key={book.id} book={book} timer={i === 0 ? heroTimer : timers[i + 1] ?? 3600} />
                    ))
                }
              </div>

              <div className="text-center mt-10">
                <Link to="/clearance"
                  className="inline-flex items-center gap-2 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-bold px-8 py-3 rounded-2xl transition-all text-sm">
                  Browse All Clearance <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Delivery banner ── */}
        <div className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-black text-gray-900 text-lg">Free UK Delivery on orders over £15</p>
              <p className="text-gray-400 text-sm mt-0.5">No code needed — applied automatically at checkout</p>
            </div>
            <Link to="/signup"
              className="shrink-0 flex items-center gap-2 bg-gray-900 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-2xl transition-all text-sm whitespace-nowrap">
              Join BritBooks <ArrowRight size={15} />
            </Link>
          </div>
        </div>

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
