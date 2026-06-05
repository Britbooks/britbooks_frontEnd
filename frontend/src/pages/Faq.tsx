import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Mail, Search,
  MessageSquare, Package, RotateCcw, User,
  ShoppingBag, CreditCard, Sparkles, ArrowRight, Globe,
  Clock, BookOpen, HeadphonesIcon, HelpCircle,
} from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

/* ─── Data ───────────────────────────────────────────────── */
const categoryMeta: Record<string, { Icon: React.ElementType; color: string; bg: string; border: string }> = {
  'Orders & Delivery': { Icon: Package,     color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'   },
  'Returns':           { Icon: RotateCcw,   color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  'Account':           { Icon: User,        color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  'Selling':           { Icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200'},
  'Payments':          { Icon: CreditCard,  color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200'   },
  'Shipping':          { Icon: Globe,       color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200'   },
};

const faqs = [
  { category: 'Orders & Delivery', q: 'How long does delivery take?', a: 'Standard UK delivery typically arrives within 2–4 working days from the date your order is dispatched. International orders generally arrive within 7–14 working days, depending on the destination country and local customs processing. Please note that delivery times are estimates only and may vary during peak periods, public holidays, or due to circumstances outside our control.' },
  { category: 'Orders & Delivery', q: 'How can I track my order?', a: 'Once your order has been dispatched, you will receive a confirmation email containing your tracking information. You may also monitor your order status at any time by logging into your BritBooks account and visiting the "My Orders" section.' },
  { category: 'Returns', q: 'What is the BritBooks returns policy?', a: 'We accept returns within 30 days of the delivery date, provided the item is returned in its original and resellable condition. To initiate a return, please submit a return request through your account dashboard, or contact our customer support team at customercare@britbooks.co.uk with your order number. BritBooks reserves the right to refuse returns that do not meet our eligibility requirements.' },
  { category: 'Returns', q: 'Who pays for return shipping?', a: 'Customers are responsible for return shipping costs unless the item received was damaged, faulty, defective, or incorrectly supplied by BritBooks. Where BritBooks accepts responsibility for the issue, a prepaid return label or reimbursement of reasonable return postage costs may be provided at our discretion.' },
  { category: 'Account', q: 'Can I change the email address linked to my account?', a: 'For security and fraud-prevention purposes, account email addresses cannot be changed directly through the website. If you need assistance updating your registered email address, please contact our customer support team at customercare@britbooks.co.uk. Additional verification may be required before changes are processed.' },
  { category: 'Selling', q: 'Do you offer business or bulk purchase accounts?', a: 'Yes. BritBooks offers tailored pricing, volume discounts, and priority support for educational institutions, businesses, and bulk purchasers. For a customised quotation, please contact customercare@britbooks.co.uk.' },
  { category: 'Payments', q: 'Which payment methods do you accept?', a: 'We currently accept Visa, Mastercard, American Express, and PayPal. All transactions are processed securely using industry-standard encryption and payment security technologies. BritBooks does not store full payment card details on its servers.' },
  { category: 'Shipping', q: 'Do you ship to Guernsey, Jersey, or the Isle of Man?', a: 'Orders shipped to Guernsey, Jersey, and the Isle of Man are classified as international shipments and may be subject to different delivery times and shipping charges.' },
  { category: 'Shipping', q: 'Who is responsible for customs duties and import taxes?', a: "International customers may be responsible for customs duties, import taxes, or local handling charges imposed by their country's authorities. These charges are outside BritBooks' control and are the sole responsibility of the recipient." },
  { category: 'Shipping', q: 'What happens if I provide incorrect delivery details?', a: 'Customers are responsible for ensuring that delivery details are accurate at the time of purchase. BritBooks cannot accept liability for delays or losses resulting from incorrect or incomplete shipping information provided by the customer.' },
];

const allCategories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];

/* ─── Floating Icon ──────────────────────────────────────── */
const floatingIcons = [
  { Icon: Package,     color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-100',    x: '8%',   y: '18%',  size: 'w-12 h-12', delay: 0,    dur: 4.5  },
  { Icon: RotateCcw,  color: 'text-orange-500',  bg: 'bg-orange-50',  border: 'border-orange-100',  x: '82%',  y: '12%',  size: 'w-10 h-10', delay: 0.8,  dur: 5    },
  { Icon: CreditCard, color: 'text-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-100',    x: '88%',  y: '55%',  size: 'w-11 h-11', delay: 1.5,  dur: 4    },
  { Icon: Globe,      color: 'text-teal-500',    bg: 'bg-teal-50',    border: 'border-teal-100',    x: '5%',   y: '65%',  size: 'w-10 h-10', delay: 0.4,  dur: 5.5  },
  { Icon: User,       color: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-100',  x: '75%',  y: '72%',  size: 'w-9 h-9',   delay: 1.1,  dur: 3.8  },
  { Icon: ShoppingBag,color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', x: '18%',  y: '78%',  size: 'w-9 h-9',   delay: 2,    dur: 4.2  },
];

/* ─── FAQ Accordion Item ─────────────────────────────────── */
const FAQItem = ({
  faq, index, isOpen, onToggle,
}: {
  faq: typeof faqs[0]; index: number; isOpen: boolean; onToggle: () => void;
}) => {
  const meta = categoryMeta[faq.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        isOpen
          ? 'border-[#c9a84c]/50 shadow-[0_6px_32px_rgba(201,168,76,0.13)] bg-white'
          : 'border-[#e8e0d0] bg-white shadow-sm hover:shadow-md hover:border-[#d0c8b8]'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start lg:items-center gap-4 px-6 py-5 text-left group"
      >
        {meta && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 lg:mt-0 transition-colors duration-200 ${
            isOpen ? 'bg-[#c9a84c]/15' : meta.bg
          }`}>
            <meta.Icon className={`w-4 h-4 transition-colors duration-200 ${isOpen ? 'text-[#c9a84c]' : meta.color}`} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <span className={`block font-bold text-[15px] lg:text-base leading-snug transition-colors duration-150 ${
            isOpen ? 'text-[#0a1628]' : 'text-[#0a1628]/80 group-hover:text-[#0a1628]'
          }`}>
            {faq.q}
          </span>
          {!isOpen && (
            <span className={`hidden lg:inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
              {faq.category}
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
            isOpen ? 'border-[#c9a84c]/40 bg-[#c9a84c]/10' : 'border-[#e8e0d0] bg-[#f5f0e8] group-hover:border-[#c9a84c]/30'
          }`}
        >
          <ChevronDown className={`w-4 h-4 transition-colors duration-200 ${isOpen ? 'text-[#c9a84c]' : 'text-[#0a1628]/35'}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-1 border-t border-[#f0ebe0]">
              <div className="flex gap-4 pt-4">
                <div className="w-0.5 rounded-full bg-gradient-to-b from-[#c9a84c] to-[#c9a84c]/10 shrink-0 self-stretch" />
                <p className="text-[15px] text-[#0a1628]/65 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Page ───────────────────────────────────────────────── */
const FAQPage = () => {
  const [openIndex,      setOpenIndex]      = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search,         setSearch]         = useState('');

  const filtered = faqs.filter(f => {
    const matchesCat    = activeCategory === 'All' || f.category === activeCategory;
    const matchesSearch = !search
      || f.q.toLowerCase().includes(search.toLowerCase())
      || f.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const countForCat = (cat: string) =>
    cat === 'All' ? faqs.length : faqs.filter(f => f.category === cat).length;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about BritBooks — orders, shipping, returns, payments, and more."
        canonical="/faq"
      />
      <TopBar />

      {/* ══════════════════════════════════════════
          HERO — white bg, animated icons
      ══════════════════════════════════════════ */}
      <header className="relative overflow-hidden bg-white border-b border-[#f0ebe0]">

        {/* subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, #c9a84c22 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

        {/* bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }}
        />

        {/* floating category icon orbs — desktop only */}
        {floatingIcons.map(({ Icon, color, bg, border, x, y, size, delay, dur }, i) => (
          <motion.div
            key={i}
            className={`absolute hidden lg:flex items-center justify-center rounded-2xl border shadow-lg ${bg} ${border} ${size}`}
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.4, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -14, 0],
              rotate: [0, i % 2 === 0 ? 6 : -6, 0],
            }}
            transition={{
              opacity: { delay, duration: 0.6 },
              scale:   { delay, duration: 0.6 },
              y:       { delay, duration: dur, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
              rotate:  { delay, duration: dur * 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
            }}
          >
            <Icon className={`w-1/2 h-1/2 ${color}`} />
          </motion.div>
        ))}

        {/* pulsing ring behind central icon */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pt-16 pb-20 lg:pt-20 lg:pb-28 flex flex-col items-center text-center">

          {/* animated central icon cluster */}
          <div className="relative mb-8">
            {/* outer pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-[#c9a84c]/20"
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ margin: '-10px' }}
            />
            {/* inner pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl border border-[#c9a84c]/15"
              animate={{ scale: [1, 1.32, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              style={{ margin: '-18px' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: 'backOut' }}
              className="w-20 h-20 bg-[#0a1628] rounded-3xl flex items-center justify-center shadow-xl shadow-[#0a1628]/20"
            >
              <HelpCircle className="w-9 h-9 text-[#c9a84c]" />
            </motion.div>
          </div>

          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="inline-flex items-center gap-2 border border-[#c9a84c]/30 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-xs text-[#c9a84c] font-bold tracking-wide uppercase">Help Centre</span>
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-black text-[#0a1628] tracking-tight leading-[1.08] mb-4 max-w-2xl"
          >
            Got a question?{' '}
            <span className="text-[#c9a84c]">We have<br className="hidden lg:block" /> the answer.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[#0a1628]/50 text-base lg:text-lg max-w-lg leading-relaxed mb-8"
          >
            Browse answers across {Object.keys(categoryMeta).length} topics, or search below to find exactly what you need.
          </motion.p>

          {/* search bar */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            className="relative w-full max-w-lg"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0a1628]/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search questions — e.g. delivery, returns, payments…"
              value={search}
              onChange={e => { setSearch(e.target.value); setOpenIndex(null); }}
              className="w-full pl-12 pr-10 py-4 bg-[#f5f0e8] border-2 border-[#e8e0d0] rounded-2xl text-sm text-[#0a1628] placeholder-[#0a1628]/35 focus:outline-none focus:border-[#c9a84c] focus:bg-white transition-all shadow-sm"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a1628]/10 flex items-center justify-center hover:bg-[#0a1628]/20 transition-colors"
                >
                  <span className="text-[#0a1628]/50 text-xs leading-none">✕</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.48 }}
            className="flex gap-3 mt-6 flex-wrap justify-center"
          >
            {[
              { icon: <BookOpen className="w-3.5 h-3.5" />, label: '10 articles' },
              { icon: <HeadphonesIcon className="w-3.5 h-3.5" />, label: '6 categories' },
              { icon: <Clock className="w-3.5 h-3.5" />, label: '2h avg reply' },
            ].map(({ icon, label }) => (
              <div key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f0e8] border border-[#e8e0d0] rounded-full text-xs font-semibold text-[#0a1628]/60">
                <span className="text-[#c9a84c]">{icon}</span>
                {label}
              </div>
            ))}
          </motion.div>

        </div>
      </header>

      {/* ══════════════════════════════════════════
          MAIN — two-column desktop layout
      ══════════════════════════════════════════ */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-10 pb-24 bg-white">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

          {/* ── LEFT SIDEBAR (desktop only, sticky) ── */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-6">

            {/* mobile: horizontal chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden no-scrollbar">
              {allCategories.map(cat => {
                const meta = cat !== 'All' ? categoryMeta[cat] : null;
                const isActive = activeCategory === cat;
                return (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-[#0a1628] text-[#c9a84c] shadow-md'
                        : 'bg-[#f5f0e8] border border-[#e8e0d0] text-[#0a1628]/55 hover:text-[#0a1628]'
                    }`}
                  >
                    {meta && <meta.Icon className={`w-3 h-3 ${isActive ? 'text-[#c9a84c]' : meta.color}`} />}
                    {cat}
                  </motion.button>
                );
              })}
            </div>

            {/* desktop: vertical sidebar card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hidden lg:block bg-white rounded-3xl border border-[#e8e0d0] shadow-sm overflow-hidden"
            >
              <div className="px-5 pt-5 pb-3 border-b border-[#f0ebe0]">
                <p className="text-[10px] font-black text-[#0a1628]/30 uppercase tracking-widest">Browse by topic</p>
              </div>

              <nav className="p-2">
                {allCategories.map(cat => {
                  const meta = cat !== 'All' ? categoryMeta[cat] : null;
                  const isActive = activeCategory === cat;
                  const count = countForCat(cat);
                  return (
                    <motion.button
                      key={cat}
                      whileHover={{ x: isActive ? 0 : 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left mb-0.5 transition-all duration-200 ${
                        isActive
                          ? 'bg-[#0a1628] shadow-md'
                          : 'hover:bg-[#f5f0e8]'
                      }`}
                    >
                      {meta ? (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                          isActive ? 'bg-white/10' : meta.bg
                        }`}>
                          <meta.Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c9a84c]' : meta.color}`} />
                        </div>
                      ) : (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-white/10' : 'bg-[#f5f0e8]'
                        }`}>
                          <span className={`text-xs font-black ${isActive ? 'text-[#c9a84c]' : 'text-[#0a1628]/40'}`}>≡</span>
                        </div>
                      )}
                      <span className={`flex-1 text-sm font-semibold ${isActive ? 'text-[#c9a84c]' : 'text-[#0a1628]/65 group-hover:text-[#0a1628]'}`}>
                        {cat}
                      </span>
                      <span className={`text-xs font-black tabular-nums px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/15 text-[#c9a84c]' : 'bg-[#f5f0e8] text-[#0a1628]/40'
                      }`}>
                        {count}
                      </span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* sidebar contact CTA */}
              <div className="m-3 mt-1 bg-[#0a1628] rounded-2xl p-4">
                <div className="w-8 h-8 bg-[#c9a84c]/15 rounded-xl flex items-center justify-center mb-3">
                  <MessageSquare className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <p className="text-[#c9a84c] font-bold text-sm mb-1">Still need help?</p>
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

          {/* ── RIGHT: FAQ content ── */}
          <div className="flex-1 min-w-0">

            {/* result count / active filter label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex items-center justify-between mb-5"
            >
              <div>
                <h2 className="font-black text-[#0a1628] text-lg">
                  {activeCategory === 'All' ? 'All Questions' : activeCategory}
                </h2>
                <p className="text-[#0a1628]/40 text-sm mt-0.5">
                  {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                  {search && <> for &ldquo;<span className="font-semibold text-[#0a1628]/60">{search}</span>&rdquo;</>}
                </p>
              </div>
              {(search || activeCategory !== 'All') && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => { setSearch(''); setActiveCategory('All'); setOpenIndex(null); }}
                  className="text-xs font-bold text-[#c9a84c] hover:underline underline-offset-4"
                >
                  Clear filters
                </motion.button>
              )}
            </motion.div>

            {/* FAQ list */}
            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.22 }}
                  className="py-24 text-center bg-[#f5f0e8] rounded-3xl border border-[#e8e0d0]"
                >
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[#0a1628]/50 font-semibold text-sm mb-3">No results found</p>
                  <button
                    onClick={() => { setSearch(''); setActiveCategory('All'); }}
                    className="text-xs font-bold text-[#c9a84c] hover:underline underline-offset-4"
                  >
                    Clear search
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={activeCategory + search}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  {filtered.map((faq, i) => (
                    <FAQItem
                      key={faq.q}
                      faq={faq}
                      index={i}
                      isOpen={openIndex === i}
                      onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* mobile CTA */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-8 lg:hidden"
            >
              <div className="relative bg-[#0a1628] rounded-3xl p-7 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 60% 80% at 100% 100%, rgba(201,168,76,0.08), transparent)' }} />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#c9a84c]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#c9a84c] text-base mb-0.5">Still have questions?</p>
                    <p className="text-[#f5f0e8]/45 text-sm">Our UK support team replies within two hours on weekdays.</p>
                  </div>
                  <Link
                    to="/contact"
                    className="shrink-0 inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-black px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Us
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* desktop bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 hidden lg:block"
            >
              <div className="relative bg-[#0a1628] rounded-3xl p-8 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 50% 90% at 90% 50%, rgba(201,168,76,0.1), transparent)' }} />
                <div className="relative z-10 flex items-center gap-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#c9a84c] text-xl mb-1">Didn't find what you were looking for?</p>
                    <p className="text-[#f5f0e8]/45 text-sm">Our UK support team is available on weekdays and typically replies within two hours.</p>
                  </div>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] font-black px-6 py-3.5 rounded-2xl transition-colors text-sm whitespace-nowrap shadow-lg shrink-0"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Support
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Footer />
    </div>
  );
};

export default FAQPage;
