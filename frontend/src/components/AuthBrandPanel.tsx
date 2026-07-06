"use client";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronLeft } from 'lucide-react';

const NAVY = '#0a1628';
const RED  = '#c42b1c';

const SLIDES = [
  {
    emoji:    '📚',
    tag:      'New Arrivals',
    headline: ['Fresh reads,', 'every week.'],
    sub:      'Discover the latest titles across every genre — debut novels, chart-toppers, and hidden gems added daily.',
    stat:     { value: '2,000+', label: 'New titles added every week' },
    bg:       'linear-gradient(150deg, #fdf8f0 0%, #faf3e8 55%, #f3ece0 100%)',
    accent:   NAVY,
  },
  {
    emoji:    '🏷️',
    tag:      'Special Offers',
    headline: ['Up to 60%', 'off today.'],
    sub:      'Clearance deals on thousands of titles — plus spin our prize wheel to unlock extra discount codes.',
    stat:     { value: '60% off', label: 'On selected clearance titles' },
    bg:       'linear-gradient(150deg, #fdf8f0 0%, #fff5f3 55%, #fde8e5 100%)',
    accent:   RED,
  },
  {
    emoji:    '🚚',
    tag:      'Free UK Delivery',
    headline: ['Free delivery', 'on every order.'],
    sub:      'Orders over £10 ship free across the UK. Fast dispatch, tracked delivery — books at your door in days.',
    stat:     { value: '£10', label: 'Minimum order for free shipping' },
    bg:       'linear-gradient(150deg, #fdf8f0 0%, #eef3fd 55%, #e2ecfe 100%)',
    accent:   NAVY,
  },
  {
    emoji:    '🏆',
    tag:      '500,000+ Titles',
    headline: ['Half a million', 'books in stock.'],
    sub:      'From rare first editions to today\'s bestsellers — whatever you\'re looking for, BritBooks has it.',
    stat:     { value: '4.9 ★', label: 'Average customer rating' },
    bg:       'linear-gradient(150deg, #fdf8f0 0%, #fdf2f5 55%, #fde0e8 100%)',
    accent:   RED,
  },
];

const SPARKS = [
  { x: '7%',  dur: 13, delay: 0   },
  { x: '21%', dur: 16, delay: 3.5 },
  { x: '39%', dur: 11, delay: 7   },
  { x: '57%', dur: 14, delay: 1.5 },
  { x: '73%', dur: 12, delay: 5   },
  { x: '87%', dur: 15, delay: 9   },
];

const AuthBrandPanel: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[current];
  const isRed = slide.accent === RED;

  return (
    <div className="hidden lg:flex lg:w-[70%] flex-col relative overflow-hidden select-none"
      style={{ background: '#fdf8f0' }}>

      {/* Slide background */}
      <AnimatePresence mode="wait">
        <motion.div key={`bg-${current}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: slide.bg }} />
      </AnimatePresence>

      {/* Ambient glow orb — top right */}
      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: slide.accent, filter: 'blur(140px)' }} />

      {/* Ambient glow orb — bottom left */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: slide.accent, filter: 'blur(100px)' }} />

      {/* Rising sparks */}
      {SPARKS.map((s, i) => (
        <motion.div key={i} className="absolute w-[3px] h-[3px] rounded-full pointer-events-none"
          style={{ background: slide.accent, left: s.x, bottom: '-2%', opacity: 0.4 }}
          animate={{ y: [0, -1100], opacity: [0, 0.5, 0.5, 0] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'linear' }} />
      ))}

      {/* Subtle dot-grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.04,
          backgroundImage: `radial-gradient(circle, ${slide.accent} 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }} />

      {/* Giant watermark emoji */}
      <AnimatePresence mode="wait">
        <motion.div key={`emoji-${current}`}
          initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
          animate={{ opacity: 0.07, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 1.3, rotate: 8 }}
          transition={{ duration: 0.7 }}
          className="absolute bottom-4 right-8 text-[260px] leading-none pointer-events-none">
          {slide.emoji}
        </motion.div>
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-12 pt-10">
        <Link to="/" className="block">
          <img src="/logobrit.png" alt="BritBooks" className="h-14 w-auto object-contain" />
        </Link>
        <Link to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: `${NAVY}55` }}
          onMouseEnter={e => (e.currentTarget.style.color = `${NAVY}99`)}
          onMouseLeave={e => (e.currentTarget.style.color = `${NAVY}55`)}>
          <ChevronLeft className="w-3 h-3" /> Back to store
        </Link>
      </div>

      {/* ── SLIDE CONTENT ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 xl:px-20">
        <AnimatePresence mode="wait">
          <motion.div key={`content-${current}`}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>

            {/* Tag pill */}
            <motion.div
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
              style={{
                background: isRed ? 'rgba(196,43,28,0.07)' : 'rgba(10,22,40,0.06)',
                border: `1px solid ${slide.accent}30`,
              }}>
              <span className="text-sm leading-none">{slide.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: slide.accent }}>{slide.tag}</span>
            </motion.div>

            {/* Rule */}
            <motion.div
              initial={{ width: 0 }} animate={{ width: 52 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="h-[3px] rounded-full mb-7"
              style={{ background: `linear-gradient(90deg, ${slide.accent}, ${slide.accent}44)` }} />

            {/* Headline */}
            <h1 className="font-black leading-[1.02] mb-6"
              style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', color: NAVY }}>
              {slide.headline[0]}<br />
              <span style={{
                background: isRed
                  ? `linear-gradient(90deg, ${RED} 0%, #e8604f 100%)`
                  : `linear-gradient(90deg, ${NAVY} 0%, #1a4080 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {slide.headline[1]}
              </span>
            </h1>

            {/* Sub text */}
            <p className="text-lg leading-relaxed mb-10 max-w-2xl"
              style={{ color: `${NAVY}88` }}>
              {slide.sub}
            </p>

            {/* Stat badge */}
            <div className="inline-flex items-center gap-4 rounded-2xl px-7 py-4"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: `1px solid ${slide.accent}25`,
                boxShadow: `0 4px 24px ${slide.accent}10`,
              }}>
              <p className="text-4xl font-black" style={{ color: slide.accent }}>{slide.stat.value}</p>
              <div className="w-px h-8" style={{ background: `${NAVY}14` }} />
              <p className="text-sm leading-snug max-w-[160px]" style={{ color: `${NAVY}70` }}>{slide.stat.label}</p>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="relative z-10 px-12 py-8 flex items-center justify-between">

        {/* Slide dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-400"
              style={{
                width:      i === current ? 28 : 8,
                height:     8,
                borderRadius: 4,
                background: i === current ? slide.accent : `${NAVY}28`,
                opacity:    i === current ? 1 : 0.6,
              }} />
          ))}
        </div>

        {/* Trust badge */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: `${NAVY}40` }} />
          <span className="text-[11px] font-medium" style={{ color: `${NAVY}50` }}>
            256-bit SSL · Trusted by 2M+ readers
          </span>
        </div>

      </div>
    </div>
  );
};

export default AuthBrandPanel;
