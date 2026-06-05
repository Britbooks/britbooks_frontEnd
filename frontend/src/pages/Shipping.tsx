import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Package, Globe, Clock, Mail, RefreshCw,
  ShieldCheck, CheckCircle, ArrowRight, ChevronDown, Zap, Sparkles,
} from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

/* ─────────────────────────────────────────────────────────── */
/*  Data                                                        */
/* ─────────────────────────────────────────────────────────── */

const shippingOptions = [
  {
    id: 'standard',
    Icon: Truck,
    label: 'Standard',
    speed: '3–5 Business Days',
    price: 'From £2.99',
    highlight: 'Free over £15',
    color: '#c9a84c',
    bullets: [
      'Dispatched within one business day',
      'Royal Mail or DPD tracked delivery',
      'Signature required on orders over £50',
      'Available to all UK mainland addresses',
    ],
  },
  {
    id: 'express',
    Icon: Zap,
    label: 'Express',
    speed: '1–2 Business Days',
    price: 'From £5.99',
    highlight: 'Order before 1 pm',
    color: '#e86c2c',
    bullets: [
      'Same-day dispatch Mon–Fri before 1 pm',
      'DPD delivery with a one-hour window',
      'Full end-to-end tracking included',
      'Available on the vast majority of stock',
    ],
  },
  {
    id: 'international',
    Icon: Globe,
    label: 'International',
    speed: '7–14 Business Days',
    price: 'Calculated at checkout',
    highlight: 'Ships worldwide',
    color: '#3b82f6',
    bullets: [
      'Europe, USA, Canada, Australia & more',
      'No hidden fees — cost shown at checkout',
      'Tracking provided where carrier allows',
      "Customs duties are the buyer's responsibility",
    ],
  },
];

const returnSteps = [
  {
    n: '01',
    Icon: Mail,
    title: 'Email us',
    body: <>Email <a href="mailto:customercare@britbooks.co.uk" className="text-[#c9a84c] font-semibold hover:underline">customercare@britbooks.co.uk</a> with your order number and reason for return.</>,
  },
  {
    n: '02',
    Icon: Package,
    title: 'Receive your RMA',
    body: 'We will send a Return Merchandise Authorisation number and full packing instructions within one business day.',
  },
  {
    n: '03',
    Icon: RefreshCw,
    title: 'Ship it back',
    body: 'Pack the item securely, write the RMA number on the outside, and post within 14 days of receiving it.',
  },
  {
    n: '04',
    Icon: CheckCircle,
    title: 'Refund issued',
    body: 'Once we receive and inspect the item, your refund is processed in 5–7 business days.',
  },
];

const returnConditions = [
  'Books must be unused and in resalable condition.',
  'Return within 30 days of delivery.',
  'Include your order number or receipt.',
  'Personalised items cannot be returned.',
  'You cover return shipping unless the item was damaged or defective.',
  'Original outbound shipping costs are non-refundable.',
  'Items returned without an RMA number may face delays or refusal.',
];

/* ─── Floating icon config ───────────────────────────────── */
const floatingIcons = [
  { Icon: Truck,       color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-100',   x: '5%',  y: '15%', size: 'w-13 h-13', delay: 0,    dur: 4.5 },
  { Icon: Globe,       color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-100',    x: '84%', y: '10%', size: 'w-11 h-11', delay: 0.8,  dur: 5   },
  { Icon: Zap,         color: 'text-orange-500',  bg: 'bg-orange-50',  border: 'border-orange-100',  x: '88%', y: '58%', size: 'w-10 h-10', delay: 1.4,  dur: 4   },
  { Icon: Package,     color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', x: '5%',  y: '65%', size: 'w-10 h-10', delay: 0.3,  dur: 5.5 },
  { Icon: RefreshCw,   color: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-100',  x: '76%', y: '72%', size: 'w-9 h-9',   delay: 1.1,  dur: 3.8 },
  { Icon: ShieldCheck, color: 'text-teal-500',    bg: 'bg-teal-50',    border: 'border-teal-100',    x: '18%', y: '76%', size: 'w-9 h-9',   delay: 1.9,  dur: 4.6 },
];

/* ─────────────────────────────────────────────────────────── */
/*  Sub-components                                              */
/* ─────────────────────────────────────────────────────────── */

const ShippingCard = ({
  opt, open, toggle,
}: {
  opt: (typeof shippingOptions)[0]; open: boolean; toggle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="bg-white rounded-2xl border border-[#e8e0d0] overflow-hidden shadow-sm transition-shadow hover:shadow-md"
    style={{ borderTop: `3px solid ${opt.color}` }}
  >
    <div className="px-6 pt-6 pb-4 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${opt.color}18` }}>
        <opt.Icon className="w-5 h-5" style={{ color: opt.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: opt.color }}>{opt.label}</span>
          <span className="text-[10px] font-bold text-[#0a1628]/40 bg-[#f5f0e8] border border-[#e8e0d0] rounded-full px-2.5 py-0.5">{opt.speed}</span>
        </div>
        <p className="text-lg font-black text-[#0a1628] leading-tight">{opt.price}</p>
        <p className="text-xs text-[#0a1628]/50 mt-0.5">{opt.highlight}</p>
      </div>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="shrink-0 mt-0.5 w-7 h-7 rounded-full border border-[#e8e0d0] flex items-center justify-center text-[#0a1628]/30 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors"
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>

    <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? '400px' : '0px' }}>
      <div className="px-6 pb-6 border-t border-[#e8e0d0] pt-4">
        <ul className="space-y-2.5">
          {opt.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#0a1628]/70">
              <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${opt.color}18`, border: `1px solid ${opt.color}40` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt.color }} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────── */
/*  Page                                                        */
/* ─────────────────────────────────────────────────────────── */

const sidebarSections = [
  { id: 'delivery',  label: 'Delivery Options',   Icon: Truck,     color: 'text-amber-600',   bg: 'bg-amber-50'   },
  { id: 'returns',   label: 'Returns Policy',      Icon: RefreshCw, color: 'text-purple-600',  bg: 'bg-purple-50'  },
];

const ShippingReturnsPage: React.FC = () => {
  const [openCard, setOpenCard] = useState<string | null>('standard');
  const [activeSection, setActiveSection] = useState('delivery');

  const toggle = (id: string) => setOpenCard(prev => (prev === id ? null : id));

  const handleSidebarClick = (id: string) => {
    setActiveSection(id);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <SEOHead
        title="Shipping & Returns"
        description="Learn about BritBooks shipping options, delivery times, and our hassle-free 30-day returns policy for all book orders."
        canonical="/shipping-returns"
      />
      <TopBar />

      {/* ══════════════════════════════════════════
          HERO — white bg, animated icons
      ══════════════════════════════════════════ */}
      <header className="relative overflow-hidden bg-white border-b border-[#f0ebe0]">

        {/* dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle, #c9a84c22 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* top gold line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }} />

        {/* floating icons — desktop only */}
        {floatingIcons.map(({ Icon, color, bg, border, x, y, size, delay, dur }, i) => (
          <motion.div
            key={i}
            className={`absolute hidden lg:flex items-center justify-center rounded-2xl border shadow-lg ${bg} ${border} ${size}`}
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1, y: [0, -14, 0], rotate: [0, i % 2 === 0 ? 5 : -5, 0] }}
            transition={{
              opacity: { delay, duration: 0.6 },
              scale:   { delay, duration: 0.6 },
              y:       { delay, duration: dur, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
              rotate:  { delay, duration: dur * 1.3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
            }}
          >
            <Icon className={`w-1/2 h-1/2 ${color}`} />
          </motion.div>
        ))}

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pt-16 pb-20 lg:pt-20 lg:pb-28 flex flex-col items-center text-center">

          {/* central icon with pulse */}
          <div className="relative mb-8">
            <motion.div className="absolute rounded-3xl border-2 border-[#c9a84c]/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ inset: '-10px' }} />
            <motion.div className="absolute rounded-3xl border border-[#c9a84c]/15"
              animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              style={{ inset: '-20px' }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: 'backOut' }}
              className="w-20 h-20 bg-[#0a1628] rounded-3xl flex items-center justify-center shadow-xl shadow-[#0a1628]/20"
            >
              <Truck className="w-9 h-9 text-[#c9a84c]" />
            </motion.div>
          </div>

          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="inline-flex items-center gap-2 border border-[#c9a84c]/30 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-xs text-[#c9a84c] font-bold tracking-wide uppercase">UK &amp; International Delivery</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-black text-[#0a1628] tracking-tight leading-[1.08] mb-4 max-w-2xl"
          >
            Shipping &amp;{' '}
            <span className="text-[#c9a84c]">Returns</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[#0a1628]/50 text-base lg:text-lg max-w-lg leading-relaxed mb-8"
          >
            Everything you need to know — from choosing a delivery option to starting a return.
          </motion.p>

          {/* stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.38 }}
            className="flex gap-3 flex-wrap justify-center"
          >
            {[
              { label: 'Free shipping over £15' },
              { label: 'Order by 1pm for same-day dispatch' },
              { label: '30-day easy returns' },
            ].map(({ label }) => (
              <div key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f0e8] border border-[#e8e0d0] rounded-full text-xs font-semibold text-[#0a1628]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] shrink-0" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          MAIN — two-column on desktop
      ══════════════════════════════════════════ */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-10 pb-24 bg-white">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

          {/* ── Sidebar (desktop only) ── */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl border border-[#e8e0d0] shadow-sm overflow-hidden"
            >
              <div className="px-5 pt-5 pb-3 border-b border-[#f0ebe0]">
                <p className="text-[10px] font-black text-[#0a1628]/30 uppercase tracking-widest">Sections</p>
              </div>
              <nav className="p-2">
                {sidebarSections.map(s => {
                  const isActive = activeSection === s.id;
                  return (
                    <motion.button
                      key={s.id}
                      whileHover={{ x: isActive ? 0 : 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSidebarClick(s.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left mb-0.5 transition-all duration-200 ${
                        isActive ? 'bg-[#0a1628] shadow-md' : 'hover:bg-[#f5f0e8]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/10' : s.bg}`}>
                        <s.Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c9a84c]' : s.color}`} />
                      </div>
                      <span className={`flex-1 text-sm font-semibold ${isActive ? 'text-[#c9a84c]' : 'text-[#0a1628]/65'}`}>{s.label}</span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* quick info */}
              <div className="px-5 pb-4 pt-1 space-y-2.5">
                {[
                  { icon: <Clock className="w-3.5 h-3.5 text-[#c9a84c]" />, text: 'Cut-off 1pm Mon–Fri' },
                  { icon: <ShieldCheck className="w-3.5 h-3.5 text-[#c9a84c]" />, text: '30-day return window' },
                ].map(({ icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-[#f5f0e8] rounded-xl px-3 py-2.5">
                    {icon}
                    <span className="text-xs font-semibold text-[#0a1628]/65">{text}</span>
                  </div>
                ))}
              </div>

              {/* sidebar CTA */}
              <div className="m-3 mt-0 bg-[#0a1628] rounded-2xl p-4">
                <div className="w-8 h-8 bg-[#c9a84c]/15 rounded-xl flex items-center justify-center mb-3">
                  <Mail className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <p className="text-[#c9a84c] font-bold text-sm mb-1">Need help?</p>
                <p className="text-[#f5f0e8]/50 text-xs leading-relaxed mb-3">Our team replies within 2 hours on weekdays.</p>
                <Link
                  to="/contact"
                  className="flex items-center justify-center gap-1.5 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-xs font-black px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact Us
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 space-y-14">

            {/* ── Delivery Options ── */}
            <section id="delivery">
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <p className="text-[10px] font-black text-[#0a1628]/40 uppercase tracking-widest mb-1.5">Delivery Options</p>
                <h2 className="text-2xl lg:text-3xl font-black text-[#0a1628]">How fast will my order arrive?</h2>
              </motion.div>

              <div className="grid sm:grid-cols-3 gap-4">
                {shippingOptions.map(opt => (
                  <ShippingCard
                    key={opt.id}
                    opt={opt}
                    open={openCard === opt.id}
                    toggle={() => toggle(opt.id)}
                  />
                ))}
              </div>

              <div className="mt-5 flex items-start gap-3 bg-[#f5f0e8] border border-[#e8e0d0] rounded-xl px-4 py-3.5">
                <Clock className="w-4 h-4 text-[#0a1628]/40 mt-0.5 shrink-0" />
                <p className="text-sm text-[#0a1628]/60">
                  <strong className="text-[#0a1628]">Dispatch cut-off:</strong> orders placed before 1 pm Monday–Friday are dispatched the same day. Orders placed after 1 pm or on weekends are dispatched the next business day.
                </p>
              </div>
            </section>

            {/* ── Divider ── */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[#e8e0d0]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0a1628]/30">Returns Policy</span>
              <div className="flex-1 h-px bg-[#e8e0d0]" />
            </div>

            {/* ── Returns ── */}
            <section id="returns" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <p className="text-[10px] font-black text-[#0a1628]/40 uppercase tracking-widest mb-1.5">30-Day Hassle-Free Returns</p>
                <h2 className="text-2xl lg:text-3xl font-black text-[#0a1628]">Need to return something?</h2>
                <p className="text-[#0a1628]/55 text-sm mt-2 max-w-xl">
                  Return most unused books within 30 days of delivery for a full refund or exchange. Items must be in their original, resalable condition.
                </p>
              </motion.div>

              {/* Steps */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {returnSteps.map((step, idx) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.07 }}
                    className="bg-white rounded-2xl border border-[#e8e0d0] p-5 shadow-sm relative hover:shadow-md transition-shadow"
                  >
                    {idx < returnSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 -right-2 w-4 h-px bg-[#e8e0d0] z-10" />
                    )}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0a1628] flex items-center justify-center">
                        <step.Icon className="w-4 h-4 text-[#c9a84c]" />
                      </div>
                      <span className="text-[10px] font-black text-[#0a1628]/25 tracking-widest">{step.n}</span>
                    </div>
                    <p className="font-bold text-[#0a1628] text-sm mb-1.5">{step.title}</p>
                    <p className="text-xs text-[#0a1628]/55 leading-relaxed">{step.body}</p>
                  </motion.div>
                ))}
              </div>

              {/* Start a Return CTA */}
              <Link
                to="/support"
                className="inline-flex items-center gap-2.5 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                Start a Return
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Conditions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white border border-[#e8e0d0] rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#f5f0e8] border border-[#e8e0d0] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-[#0a1628]/50" />
                  </div>
                  <h3 className="font-bold text-[#0a1628] text-sm">Return Conditions</h3>
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                  {returnConditions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#0a1628]/65">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </section>

            {/* ── Bottom CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="relative bg-[#0a1628] rounded-3xl p-7 lg:p-8 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 50% 90% at 90% 50%, rgba(201,168,76,0.1), transparent)' }} />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#c9a84c]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#c9a84c] text-base mb-0.5">Still unsure?</p>
                    <p className="text-[#f5f0e8]/45 text-sm">Our team is happy to help with any shipping or returns query. Usually replies within a few hours on business days.</p>
                  </div>
                  <Link
                    to="/contact"
                    className="shrink-0 inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-black px-6 py-3.5 rounded-2xl transition-colors whitespace-nowrap shadow-lg"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Us
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShippingReturnsPage;
