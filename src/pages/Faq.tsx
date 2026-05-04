import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Mail, HelpCircle, Search,
  MessageSquare, Package, RotateCcw, User,
  ShoppingBag, CreditCard, Sparkles, ArrowRight,
} from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

/* ─── Data ───────────────────────────────────────────────── */
const categoryMeta: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  'Orders & Delivery': { Icon: Package,     color: 'text-blue-500',   bg: 'bg-blue-50'   },
  'Returns':           { Icon: RotateCcw,   color: 'text-orange-500', bg: 'bg-orange-50' },
  'Account':           { Icon: User,        color: 'text-purple-500', bg: 'bg-purple-50' },
  'Selling':           { Icon: ShoppingBag, color: 'text-emerald-500',bg: 'bg-emerald-50'},
  'Payments':          { Icon: CreditCard,  color: 'text-rose-500',   bg: 'bg-rose-50'   },
};

const faqs = [
  { category: 'Orders & Delivery', q: 'How long does shipping take?',     a: 'Standard delivery within the UK takes 2–4 working days. Express next-day delivery is available at checkout. International shipping typically takes 7–14 days.' },
  { category: 'Orders & Delivery', q: 'How do I track my order?',          a: 'Once your order ships you will receive a tracking link by email. You can also view real-time status from the My Orders section of your account dashboard.' },
  { category: 'Returns',           q: 'What is your return policy?',       a: 'We accept returns within 30 days of receipt for books in their original, unused condition. Start a return from your account or email support@britbooks.co.uk with your order number.' },
  { category: 'Returns',           q: 'Who covers return shipping costs?', a: 'You cover return postage unless the item arrived damaged or defective, in which case we will arrange a free collection.' },
  { category: 'Account',           q: 'How do I create an account?',       a: 'Click Sign Up in the top navigation, fill in your name, email, and password, and follow the prompts. It takes less than a minute.' },
  { category: 'Account',           q: 'Can I change my email address?',    a: 'Email addresses are locked for security. If you need yours changed, please contact support@britbooks.co.uk and our team will assist you promptly.' },
  { category: 'Selling',           q: 'How do I sell my books on BritBooks?', a: 'Go to Sell Books, enter the ISBN and receive an instant valuation. We collect from your door free of charge and transfer payment within 5 working days.' },
  { category: 'Selling',           q: 'Do you offer bulk or business accounts?', a: 'Yes. We offer volume pricing, dedicated account managers, and priority support for business customers. Contact us for a tailored quote.' },
  { category: 'Payments',          q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, American Express, and PayPal. All payments are protected by 256-bit SSL encryption.' },
];

const allCategories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];

/* ─── FAQ Item ───────────────────────────────────────────── */
const FAQItem = ({
  faq, index, isOpen, onToggle,
}: {
  faq: typeof faqs[0]; index: number; isOpen: boolean; onToggle: () => void;
}) => {
  const meta = categoryMeta[faq.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.05, ease: 'easeOut' }}
      className={`rounded-2xl border overflow-hidden transition-shadow duration-200 ${
        isOpen
          ? 'border-[#c9a84c]/40 shadow-[0_4px_24px_rgba(201,168,76,0.12)]'
          : 'border-[#e8e0d0] shadow-sm hover:shadow-md hover:border-[#d8d0c0]'
      } bg-white`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left group"
      >
        {/* category icon dot */}
        {meta && (
          <div className={`w-8 h-8 rounded-xl ${isOpen ? 'bg-[#c9a84c]/12' : meta.bg} flex items-center justify-center shrink-0 transition-colors duration-200`}>
            <meta.Icon className={`w-3.5 h-3.5 ${isOpen ? 'text-[#c9a84c]' : meta.color} transition-colors duration-200`} />
          </div>
        )}

        <span className={`flex-1 font-semibold text-sm sm:text-[15px] leading-snug transition-colors duration-150 ${isOpen ? 'text-[#0a1628]' : 'text-[#0a1628]/75 group-hover:text-[#0a1628]'}`}>
          {faq.q}
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-colors duration-200 ${
            isOpen ? 'border-[#c9a84c]/40 bg-[#c9a84c]/8' : 'border-[#e8e0d0] bg-[#f5f0e8]'
          }`}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-colors duration-200 ${isOpen ? 'text-[#c9a84c]' : 'text-[#0a1628]/30'}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-[#f0ebe0]">
              <div className="flex gap-3 pt-3">
                <div className="w-0.5 rounded-full bg-[#c9a84c]/30 shrink-0 self-stretch" />
                <p className="text-sm text-[#0a1628]/60 leading-relaxed">{faq.a}</p>
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

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about BritBooks — orders, shipping, returns, payments, and more."
        canonical="/faq"
      />
      <TopBar />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <header className="bg-[#0a1628] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

        {/* animated grid */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 0.035 }} transition={{ duration: 1.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 60px)',
          }}
        />

        {/* radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 100%, rgba(201,168,76,0.1), transparent)' }} />

        {/* floating question marks */}
        {[
          { char: '?', x: '6%',  y: '20%', delay: 0,   size: 'text-5xl' },
          { char: '?', x: '90%', y: '15%', delay: 0.7, size: 'text-3xl' },
          { char: '❓', x: '80%', y: '65%', delay: 1.2, size: 'text-2xl' },
          { char: '💡', x: '12%', y: '70%', delay: 0.4, size: 'text-2xl' },
        ].map(({ char, x, y, delay, size }) => (
          <motion.span
            key={char + x}
            className={`absolute select-none pointer-events-none font-black text-white/10 ${size}`}
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{ delay, duration: 4 + delay, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          >
            {char}
          </motion.span>
        ))}

        <div className="relative z-10 max-w-3xl mx-auto px-5 pt-14 pb-24 text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 border border-[#c9a84c]/25 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-xs text-[#c9a84c] font-semibold tracking-wide">Help Centre</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Got a question? <br />
              <span className="text-[#c9a84c]">We have the answer.</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: 'easeOut' }}
          >
            <p className="text-white/40 text-sm sm:text-base max-w-md mx-auto mb-8">
              Cannot find what you need? Our team is one message away.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.26, ease: 'easeOut' }}
            className="relative max-w-md mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={e => { setSearch(e.target.value); setOpenIndex(null); }}
              className="w-full pl-11 pr-4 py-3.5 bg-white/6 border border-white/10 rounded-2xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/10 transition-all"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <span className="text-white/50 text-xs">✕</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-10"
          style={{ backgroundColor: '#f5f0e8', clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </header>

      {/* ══════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════ */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 pb-20">

        {/* ── Category chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-7 no-scrollbar"
        >
          {allCategories.map(cat => {
            const meta = cat !== 'All' ? categoryMeta[cat] : null;
            const isActive = activeCategory === cat;
            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#0a1628] text-white shadow-md'
                    : 'bg-white border border-[#e8e0d0] text-[#0a1628]/55 hover:text-[#0a1628] hover:border-[#d0c8b8]'
                }`}
              >
                {meta && <meta.Icon className={`w-3 h-3 ${isActive ? 'text-[#c9a84c]' : meta.color}`} />}
                {cat}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── FAQ list ── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="py-20 text-center"
            >
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-[#0a1628]/50 font-semibold text-sm mb-3">No results for &ldquo;{search}&rdquo;</p>
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
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
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

        {/* ── Still need help CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          className="mt-10"
        >
          <div className="relative bg-[#0a1628] rounded-3xl p-7 sm:p-8 overflow-hidden">
            {/* background glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 100% 100%, rgba(201,168,76,0.08), transparent)' }} />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <motion.div
                animate={{ rotate: [0, -8, 8, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0"
              >
                <MessageSquare className="w-5 h-5 text-[#c9a84c]" />
              </motion.div>

              <div className="flex-1">
                <p className="font-black text-white text-base mb-0.5">Still have questions?</p>
                <p className="text-white/40 text-sm">Our UK support team replies within two hours on weekdays.</p>
              </div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/contact"
                  className="shrink-0 inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-black px-5 py-3 rounded-xl transition-colors whitespace-nowrap shadow-lg"
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

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
