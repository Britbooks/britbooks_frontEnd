import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Home, Search, ArrowLeft, Compass, BookMarked, Star, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";

const SUGGESTIONS = [
  { label: "Homepage",      path: "/",             icon: <Home size={15} /> },
  { label: "Explore books", path: "/explore",      icon: <Compass size={15} /> },
  { label: "New arrivals",  path: "/new-arrivals", icon: <BookOpen size={15} /> },
  { label: "Search",        path: "/explore",      icon: <Search size={15} /> },
];

// Floating book data for the background illustration
const FLOATING_BOOKS = [
  { color: "#4f46e5", rotate: -15, x: -160, y: -60,  delay: 0,    duration: 6   },
  { color: "#0ea5e9", rotate:  10, x: -100, y:  60,  delay: 0.4,  duration: 5.5 },
  { color: "#f59e0b", rotate: -5,  x:  120, y: -80,  delay: 0.8,  duration: 7   },
  { color: "#10b981", rotate:  20, x:  160, y:  40,  delay: 0.2,  duration: 5   },
  { color: "#8b5cf6", rotate: -12, x:  -60, y:  120, delay: 1.0,  duration: 6.5 },
  { color: "#ef4444", rotate:   8, x:  80,  y:  110, delay: 0.6,  duration: 4.8 },
];

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <TopBar />

      {/* ── Hero area ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">

        {/* Soft radial gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Floating scattered books in the background */}
        {FLOATING_BOOKS.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.35, y: [b.y, b.y - 12, b.y] }}
            transition={{
              opacity: { delay: 0.6 + i * 0.1, duration: 0.5 },
              y: { delay: b.delay, duration: b.duration, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              position: "absolute",
              left: `calc(50% + ${b.x}px)`,
              top: `calc(50% + ${b.y}px)`,
              rotate: `${b.rotate}deg`,
            }}
            className="w-10 h-14 rounded-lg shadow-md flex items-end justify-center pb-1"
          >
            <div className="w-10 h-14 rounded-lg shadow-md" style={{ backgroundColor: b.color + "33", border: `2px solid ${b.color}55` }} />
          </motion.div>
        ))}

        {/* Main 404 illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, type: "spring", stiffness: 100 }}
          className="relative mb-10 z-10"
        >
          {/* Outer pulsing ring */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 -m-6 rounded-full bg-indigo-200"
          />

          {/* Books stacked with depth */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Shadow book – back */}
            <motion.div
              initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="absolute w-20 h-28 rounded-xl bg-indigo-300 shadow-xl"
              style={{ transform: "rotate(-18deg) translateX(-18px) translateY(6px)" }}
            />
            {/* Middle book */}
            <motion.div
              initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="absolute w-20 h-28 rounded-xl bg-blue-400 shadow-xl"
              style={{ transform: "rotate(8deg) translateX(12px) translateY(-4px)" }}
            >
              {/* spine lines */}
              <div className="absolute left-2 top-4 bottom-4 flex flex-col gap-2">
                {[1,2,3].map(n => <div key={n} className="h-0.5 w-6 bg-white/30 rounded-full" />)}
              </div>
            </motion.div>
            {/* Front book */}
            <motion.div
              initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="absolute w-20 h-28 rounded-xl bg-amber-400 shadow-2xl flex flex-col items-center justify-center gap-1"
              style={{ transform: "rotate(-3deg) translateY(-2px)" }}
            >
              <BookMarked size={22} className="text-amber-900/60" />
              <div className="h-1 w-10 bg-amber-900/20 rounded-full" />
              <div className="h-1 w-7 bg-amber-900/20 rounded-full" />
              {/* bookmark ribbon */}
              <div className="absolute top-0 right-4 w-4 h-8 bg-red-500 rounded-b-full" />
            </motion.div>

            {/* 404 badge floating over the books */}
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 180 }}
              className="absolute -top-4 -right-6 bg-[#0d1b3e] text-white rounded-2xl px-4 py-2 shadow-2xl z-20"
            >
              <span className="text-2xl font-black tracking-tighter">404</span>
            </motion.div>

            {/* Floating star sparks */}
            {[
              { top: "-12px", left: "8px",  delay: 0.7 },
              { top: "4px",   left: "-16px", delay: 0.9 },
              { top: "70px",  left: "-22px", delay: 1.1 },
            ].map((pos, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                transition={{ delay: pos.delay, duration: 1.8, repeat: Infinity, repeatDelay: 2.5 }}
                style={{ position: "absolute", top: pos.top, left: pos.left }}
              >
                <Star size={12} className="text-amber-400 fill-amber-400" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative z-10"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Page not found
          </h1>
          <p className="text-gray-500 text-lg max-w-md leading-relaxed mb-10 mx-auto">
            This page seems to have gone missing — like a book that's been checked out and never returned.
          </p>
        </motion.div>

        {/* Suggestion chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-wrap gap-3 justify-center mb-8 relative z-10"
        >
          {SUGGESTIONS.map(s => (
            <motion.button
              key={s.path + s.label}
              whileHover={{ scale: 1.05, backgroundColor: "#111827", color: "#ffffff" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(s.path)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-2xl transition-colors duration-200"
            >
              {s.icon}
              {s.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          className="relative z-10 flex items-center gap-3 text-gray-300 mb-8"
        >
          <div className="w-16 h-px bg-gray-200" />
          <Bookmark size={12} className="text-gray-300" />
          <div className="w-16 h-px bg-gray-200" />
        </motion.div>

        {/* Go back */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate(-1)}
          className="relative z-10 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-semibold transition-all"
        >
          <ArrowLeft size={14} /> Go back
        </motion.button>
      </div>

      <Footer />
    </div>
  );
}
