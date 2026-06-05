import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Mail, PackageCheck, RefreshCw, FileText,
  Headphones, Scale, AlertTriangle, Sparkles, ArrowRight,
} from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

/* ─── Sections data ─────────────────────────────────────── */
const sections = [
  {
    id: 'eligibility',
    Icon: PackageCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    title: 'Return Eligibility',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-4">
          Most items can be returned within <strong className="text-[#0a1628]">30 days of delivery</strong>. Items should be returned in the same condition they were received.
        </p>
        <ul className="space-y-2">
          {[
            'Unused items must be returned unused and undamaged.',
            'Used items must not show additional wear or damage beyond original condition.',
            'Items must be returned in their original and resellable condition.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#0a1628]/70">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'legal-cancel',
    Icon: Scale,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    title: 'Your Legal Right to Cancel',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed">
          Under UK law, you have the right to cancel most orders within <strong className="text-[#0a1628]">14 days</strong> of receiving your item. If you cancel within this period, you may receive a refund. Refunds may be reduced if an item has been used more than necessary to inspect it.
        </p>
      </>
    ),
  },
  {
    id: 'process',
    Icon: RefreshCw,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    title: 'How to Return',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-4">To initiate a return, please use either of the following methods:</p>
        <ol className="space-y-3">
          {[
            <>Submit a return request through your <strong className="text-[#0a1628]">account dashboard</strong>.</>,
            <>Contact our customer support team at <a href="mailto:customercare@britbooks.co.uk" className="text-[#c9a84c] font-semibold hover:underline">customercare@britbooks.co.uk</a> with your order number.</>,
            'Return options and instructions will be provided by our Customer Care team.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-[#0a1628]/70">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#0a1628] flex items-center justify-center text-[10px] font-black text-[#c9a84c]">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </>
    ),
  },
  {
    id: 'faulty',
    Icon: AlertTriangle,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    title: 'Faulty, Damaged or Incorrect Items',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-4">
          If your item is faulty, damaged, or not as described, you may be entitled to a repair, replacement, or full refund. Please contact Customer Care as soon as possible if there is an issue with your order.
        </p>
        <p className="text-[#0a1628]/60 leading-relaxed">
          Where BritBooks accepts responsibility, a prepaid return label or reimbursement of reasonable return postage costs may be provided at our discretion.
        </p>
      </>
    ),
  },
  {
    id: 'conditions',
    Icon: FileText,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    title: 'Refunds & Return Costs',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-4">Please keep these conditions in mind:</p>
        <ul className="space-y-2">
          {[
            'Customers are responsible for return shipping costs unless the item is faulty, damaged, incorrectly supplied, or eligible for free returns.',
            'Once a return is received and inspected, refunds are usually processed within 14 days.',
            'Depending on your bank or payment provider, it may take additional time for funds to appear in your account.',
            'Refunds will be made using the original payment method where possible.',
            'BritBooks cannot guarantee the return of items sent by mistake — please ensure you return the correct item.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#0a1628]/70">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-[#0a1628]/8 border border-[#0a1628]/15 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a1628]/40" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'contact',
    Icon: Headphones,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    title: 'Contact Us',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-5">Need help with your return? Our UK team is ready to assist.</p>
        <a
          href="mailto:customercare@britbooks.co.uk"
          className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-bold px-5 py-3 rounded-xl transition-colors"
        >
          <Mail className="w-4 h-4" />
          customercare@britbooks.co.uk
        </a>
      </>
    ),
  },
];

/* ─── Floating icon config ───────────────────────────────── */
const floatingIcons = [
  { Icon: PackageCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', x: '5%',  y: '15%', size: 'w-12 h-12', delay: 0,    dur: 4.5 },
  { Icon: RefreshCw,    color: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-100',  x: '85%', y: '10%', size: 'w-10 h-10', delay: 0.7,  dur: 5   },
  { Icon: Scale,        color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-100',    x: '88%', y: '58%', size: 'w-11 h-11', delay: 1.4,  dur: 4.2 },
  { Icon: AlertTriangle,color: 'text-orange-500',  bg: 'bg-orange-50',  border: 'border-orange-100',  x: '6%',  y: '65%', size: 'w-10 h-10', delay: 0.3,  dur: 5.5 },
  { Icon: FileText,     color: 'text-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-100',    x: '78%', y: '72%', size: 'w-9 h-9',   delay: 1,    dur: 3.8 },
  { Icon: Headphones,   color: 'text-teal-500',    bg: 'bg-teal-50',    border: 'border-teal-100',    x: '18%', y: '78%', size: 'w-9 h-9',   delay: 1.8,  dur: 4.8 },
];

/* ─── Page ───────────────────────────────────────────────── */
const ReturnPolicyPage = () => {
  const [open, setOpen] = useState<string | null>('eligibility');

  const handleSidebarClick = (id: string) => {
    setOpen(id);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen font-sans bg-white">
      <SEOHead
        title="Return Policy"
        description="BritBooks offers a simple 30-day return policy. Learn how to return books, get refunds, and contact our support team for help."
        canonical="/return-policy"
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
              <RefreshCw className="w-9 h-9 text-[#c9a84c]" />
            </motion.div>
          </div>

          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="inline-flex items-center gap-2 border border-[#c9a84c]/30 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-xs text-[#c9a84c] font-bold tracking-wide uppercase">30-Day Returns</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-black text-[#0a1628] tracking-tight leading-[1.08] mb-4 max-w-2xl"
          >
            Hassle-Free{' '}
            <span className="text-[#c9a84c]">Return<br className="hidden lg:block" /> Policy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[#0a1628]/50 text-base lg:text-lg max-w-md leading-relaxed mb-8"
          >
            We are here to make returns easy and stress-free. Every book, every time.
          </motion.p>

          {/* stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.38 }}
            className="flex gap-3 flex-wrap justify-center"
          >
            {[
              { label: '30-day window' },
              { label: '14-day legal right to cancel' },
              { label: 'Original payment refund' },
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 pb-24 bg-white">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

          {/* ── Sidebar (desktop only) ── */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl border border-[#e8e0d0] shadow-sm overflow-hidden"
            >
              <div className="px-5 pt-5 pb-3 border-b border-[#f0ebe0]">
                <p className="text-[10px] font-black text-[#0a1628]/30 uppercase tracking-widest">Policy sections</p>
              </div>
              <nav className="p-2">
                {sections.map(s => {
                  const isActive = open === s.id;
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
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isActive ? 'bg-white/10' : s.iconBg
                      }`}>
                        <s.Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c9a84c]' : s.iconColor}`} />
                      </div>
                      <span className={`flex-1 text-sm font-semibold leading-tight ${isActive ? 'text-[#c9a84c]' : 'text-[#0a1628]/65'}`}>
                        {s.title}
                      </span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* sidebar CTA */}
              <div className="m-3 mt-1 bg-[#0a1628] rounded-2xl p-4">
                <div className="w-8 h-8 bg-[#c9a84c]/15 rounded-xl flex items-center justify-center mb-3">
                  <Mail className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <p className="text-[#c9a84c] font-bold text-sm mb-1">Need help?</p>
                <p className="text-[#f5f0e8]/50 text-xs leading-relaxed mb-3">Our team replies within 2 hours on weekdays.</p>
                <a
                  href="mailto:customercare@britbooks.co.uk"
                  className="flex items-center justify-center gap-1.5 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-xs font-black px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Us
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </aside>

          {/* ── Accordion content ── */}
          <div className="flex-1 min-w-0 space-y-3">
            {sections.map((s, idx) => (
              <motion.div
                key={s.id}
                id={s.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                  open === s.id
                    ? 'border-[#c9a84c]/40 shadow-[0_6px_28px_rgba(201,168,76,0.12)]'
                    : 'border-[#e8e0d0] shadow-sm hover:shadow-md hover:border-[#d0c8b8]'
                }`}
              >
                <button
                  onClick={() => setOpen(open === s.id ? null : s.id)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    open === s.id ? 'bg-[#c9a84c]/15' : s.iconBg
                  }`}>
                    <s.Icon className={`w-4 h-4 transition-colors duration-200 ${open === s.id ? 'text-[#c9a84c]' : s.iconColor}`} />
                  </div>
                  <span className={`flex-1 font-bold text-base leading-snug transition-colors duration-150 ${
                    open === s.id ? 'text-[#0a1628]' : 'text-[#0a1628]/80 group-hover:text-[#0a1628]'
                  }`}>
                    {s.title}
                  </span>
                  <motion.div
                    animate={{ rotate: open === s.id ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      open === s.id ? 'border-[#c9a84c]/40 bg-[#c9a84c]/10' : 'border-[#e8e0d0] bg-[#f5f0e8]'
                    }`}
                  >
                    <ChevronDown className={`w-4 h-4 transition-colors duration-200 ${open === s.id ? 'text-[#c9a84c]' : 'text-[#0a1628]/35'}`} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {open === s.id && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 border-t border-[#f0ebe0]">
                        <div className="flex gap-4 pt-4">
                          <div className="w-0.5 rounded-full bg-gradient-to-b from-[#c9a84c] to-[#c9a84c]/10 shrink-0 self-stretch" />
                          <div className="flex-1">{s.content}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6"
            >
              <div className="relative bg-[#0a1628] rounded-3xl p-7 lg:p-8 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 50% 90% at 90% 50%, rgba(201,168,76,0.1), transparent)' }} />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
                    <Headphones className="w-5 h-5 text-[#c9a84c]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#c9a84c] text-base mb-0.5">Still unsure about your return?</p>
                    <p className="text-[#f5f0e8]/45 text-sm">Our team is happy to guide you through the returns process.</p>
                  </div>
                  <a
                    href="mailto:customercare@britbooks.co.uk"
                    className="shrink-0 inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-black px-5 py-3 rounded-xl transition-colors whitespace-nowrap shadow-lg"
                  >
                    <Mail className="w-4 h-4" />
                    Email Us
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
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

export default ReturnPolicyPage;
