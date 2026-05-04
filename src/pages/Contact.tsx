import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, MessageSquare, Clock, ShieldCheck,
  Zap, Globe2, CheckCircle, ArrowUpRight, Sparkles,
  BookOpen, Heart,
} from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

/* ─── Data ───────────────────────────────────────────────── */
const hours = [
  { day: 'Mon – Fri',  time: '9:00 am – 6:00 pm', active: true  },
  { day: 'Saturday',   time: '10:00 am – 4:00 pm', active: true  },
  { day: 'Sunday',     time: 'Closed',              active: false },
];

const trust = [
  { Icon: Zap,         title: 'Fast Response',   body: 'Replies within one business day — usually much faster.' },
  { Icon: MessageSquare, title: 'Human Support', body: 'Real book lovers, not bots. We genuinely care.'          },
  { Icon: ShieldCheck, title: 'Order Protected', body: 'No-questions-asked 30-day return policy on all orders.'  },
];

/* floating decorative books behind the header */
const floatingBooks = [
  { emoji: '📚', x: '8%',  y: '18%', delay: 0,    size: 'text-4xl' },
  { emoji: '📖', x: '88%', y: '12%', delay: 0.6,  size: 'text-3xl' },
  { emoji: '✉️', x: '78%', y: '68%', delay: 1.1,  size: 'text-2xl' },
  { emoji: '📗', x: '15%', y: '72%', delay: 0.3,  size: 'text-2xl' },
  { emoji: '⭐', x: '50%', y: '8%',  delay: 0.9,  size: 'text-xl'  },
];


const TrustpilotNudge = () => (
  <motion.a
    href="https://uk.trustpilot.com/review/britbooks.co.uk"
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.4, type: 'spring', stiffness: 280 }}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="inline-flex items-center gap-2.5 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm group"
  >
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#00B67A">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
    <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
      Share your experience on Trustpilot
    </span>
    <ArrowUpRight className="w-3.5 h-3.5 text-[#00B67A] opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.a>
);

/* ─── Page ───────────────────────────────────────────────── */
const ContactPage = () => {
  const [formData, setFormData]   = useState({ name: '', email: '', subject: '', message: '' });
  const [ukTime,   setUkTime]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused,  setFocused]    = useState<string | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: 'Europe/London' }).format(new Date());
    setUkTime(fmt());
    const id = setInterval(() => setUkTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title="Contact Us"
        description="Get in touch with the BritBooks team. We are here to help with questions about orders, shipping, returns, or general enquiries."
        canonical="/contact"
      />
      <TopBar />

      {/* ══════════════════════════════════════════
          HERO — dark, animated, floating elements
      ══════════════════════════════════════════ */}
      <header className="relative bg-[#0a1628] overflow-hidden">

        {/* top gold accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

        {/* animated grid */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 0.04 }} transition={{ duration: 1.5 }}
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 60px)',
          }}
        />

        {/* radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(201,168,76,0.12), transparent)' }}
        />

        {/* floating book emojis */}
        {floatingBooks.map(({ emoji, x, y, delay, size }) => (
          <motion.span
            key={emoji + x}
            className={`absolute select-none pointer-events-none ${size} opacity-15`}
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.15, scale: 1, y: [0, -12, 0] }}
            transition={{ delay, duration: 4 + delay, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          >
            {emoji}
          </motion.span>
        ))}

        <div className="relative z-10 max-w-4xl mx-auto px-5 pt-14 pb-24 text-center">

          {/* tag pill */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 border border-[#c9a84c]/25 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-xs text-[#c9a84c] font-semibold tracking-wide">UK-Based Support Team</span>
          </motion.div>

          {/* headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4">
              <span className="text-white">How can we </span>
              <span className="text-[#c9a84c]">help you?</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <p className="text-white/45 text-sm sm:text-base max-w-sm mx-auto mb-10">
              Whether you have a question about an order or need help with a title, we are ready to assist.
            </p>
          </motion.div>

          {/* live pill + email pill */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <div className="inline-flex items-center gap-2.5 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs text-white/50 font-medium">Team online · {ukTime} UK</span>
            </div>

            <motion.a
              href="mailto:customercare@britbooks.co.uk"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 border border-[#c9a84c]/30 bg-[#c9a84c]/10 rounded-full px-4 py-2 text-xs text-[#c9a84c] font-semibold hover:bg-[#c9a84c]/20 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              customercare@britbooks.co.uk
            </motion.a>
          </motion.div>
        </div>

        {/* wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12"
          style={{ backgroundColor: '#f5f0e8', clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </header>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 pb-20">

        {/* ── 2-col grid ── */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 space-y-4"
          >

            {/* Email card */}
            <div className="bg-[#0a1628] rounded-2xl p-6 overflow-hidden relative group">
              {/* shimmer */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/5 to-transparent pointer-events-none" />
              <p className="text-[10px] font-black text-[#c9a84c] uppercase tracking-widest mb-5 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Direct Contact
              </p>
              <motion.a
                href="mailto:customercare@britbooks.co.uk"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4.5 h-4.5 text-[#c9a84c]" />
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-bold text-white leading-tight break-all">customercare@britbooks.co.uk</p>
                </div>
              </motion.a>
            </div>

            {/* Hours card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="bg-white border border-[#e8e0d0] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-[#f5f0e8] border border-[#e8e0d0] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#0a1628]/40" />
                </div>
                <p className="text-[10px] font-black text-[#0a1628]/40 uppercase tracking-widest">Support Hours</p>
              </div>

              <div className="space-y-3">
                {hours.map(({ day, time, active }, i) => (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-[#0a1628]/15'}`} />
                      <span className="text-sm text-[#0a1628]/55">{day}</span>
                    </div>
                    <span className={`text-sm font-bold ${active ? 'text-[#0a1628]' : 'text-[#0a1628]/25'}`}>{time}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#e8e0d0] flex items-center gap-2 text-xs text-[#0a1628]/35">
                <Globe2 className="w-3.5 h-3.5 shrink-0" />
                All times GMT / BST
              </div>
            </motion.div>

            {/* Quick-links card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="bg-white border border-[#e8e0d0] rounded-2xl p-5 shadow-sm"
            >
              <p className="text-[10px] font-black text-[#0a1628]/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BookOpen className="w-3 h-3" /> Quick Links
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Shipping & Returns', href: '/shipping-returns' },
                  { label: 'Return Policy',       href: '/return-policy'    },
                  { label: 'FAQs',                href: '/faq'              },
                ].map(({ label, href }) => (
                  <motion.a
                    key={label}
                    href={href}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className="flex items-center justify-between group py-1.5 border-b border-[#f5f0e8] last:border-0"
                  >
                    <span className="text-sm text-[#0a1628]/65 group-hover:text-[#0a1628] transition-colors font-medium">{label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#0a1628]/20 group-hover:text-[#c9a84c] transition-colors" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: FORM ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-8 bg-white border border-[#e8e0d0] rounded-2xl shadow-sm overflow-hidden"
          >

            {/* form colour accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#e8c96a] to-[#c9a84c]" />

            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  /* ── Success ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="flex flex-col items-center justify-center py-14 text-center gap-5"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 320, damping: 18 }}
                      className="relative"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-9 h-9 text-emerald-500" />
                      </div>
                      <motion.span
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-2 -right-2 text-lg"
                      >
                        ✨
                      </motion.span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.25, ease: 'easeOut' }}
                    >
                      <h2 className="text-2xl font-black text-[#0a1628] mb-2">Message received!</h2>
                      <p className="text-[#0a1628]/50 text-sm max-w-xs leading-relaxed">
                        Thanks for reaching out. We will get back to you within one business day.
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.4, ease: 'easeOut' }}
                    >
                      <TrustpilotNudge />
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.5, ease: 'easeOut' }}
                      onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="text-xs font-bold text-[#c9a84c] hover:underline underline-offset-4"
                    >
                      Send another message
                    </motion.button>
                  </motion.div>

                ) : (
                  /* ── Form ── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="mb-7 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black text-[#0a1628]/35 uppercase tracking-widest mb-1.5">Send an Enquiry</p>
                        <h2 className="text-xl font-black text-[#0a1628]">We usually reply within a few hours</h2>
                      </div>
                      <Heart className="w-5 h-5 text-[#c9a84c]/40 shrink-0 mt-1" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                      <div className="grid sm:grid-cols-2 gap-5">
                        {[
                          { id: 'name',  label: 'Your Name',    type: 'text',  placeholder: 'Jane Smith'       },
                          { id: 'email', label: 'Email Address', type: 'email', placeholder: 'jane@example.com' },
                        ].map(({ id, label, type, placeholder }) => (
                          <div key={id} className="space-y-1.5">
                            <label htmlFor={id} className="text-[11px] font-black text-[#0a1628]/40 uppercase tracking-widest">
                              {label}
                            </label>
                            <motion.input
                              id={id} name={id} type={type} required
                              value={(formData as any)[id]}
                              onChange={handleChange}
                              onFocus={() => setFocused(id)}
                              onBlur={() => setFocused(null)}
                              placeholder={placeholder}
                              animate={{
                                boxShadow: focused === id
                                  ? '0 0 0 3px rgba(201,168,76,0.2)'
                                  : '0 0 0 0px rgba(201,168,76,0)',
                              }}
                              transition={{ duration: 0.2 }}
                              className="w-full bg-[#f5f0e8] border border-[#e8e0d0] rounded-xl px-4 py-3 text-sm text-[#0a1628] placeholder-[#0a1628]/25 focus:outline-none focus:border-[#c9a84c] focus:bg-white transition-colors"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Subject */}
                      <div className="space-y-1.5">
                        <label htmlFor="subject" className="text-[11px] font-black text-[#0a1628]/40 uppercase tracking-widest">
                          Subject
                        </label>
                        <div className="relative">
                          <motion.select
                            id="subject" name="subject" required
                            value={formData.subject}
                            onChange={handleChange}
                            onFocus={() => setFocused('subject')}
                            onBlur={() => setFocused(null)}
                            animate={{
                              boxShadow: focused === 'subject'
                                ? '0 0 0 3px rgba(201,168,76,0.2)'
                                : '0 0 0 0px rgba(201,168,76,0)',
                            }}
                            transition={{ duration: 0.2 }}
                            className="w-full bg-[#f5f0e8] border border-[#e8e0d0] rounded-xl px-4 py-3 pr-10 text-sm text-[#0a1628] focus:outline-none focus:border-[#c9a84c] focus:bg-white transition-colors appearance-none"
                          >
                            <option value="" disabled>Select a topic…</option>
                            <option value="order">Order Enquiry</option>
                            <option value="shipping">Shipping &amp; Delivery</option>
                            <option value="return">Returns &amp; Refunds</option>
                            <option value="product">Product Question</option>
                            <option value="other">Something Else</option>
                          </motion.select>
                          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                            <svg className="w-4 h-4 text-[#0a1628]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="space-y-1.5">
                        <label htmlFor="message" className="text-[11px] font-black text-[#0a1628]/40 uppercase tracking-widest">
                          Message
                        </label>
                        <motion.textarea
                          id="message" name="message" rows={5} required
                          value={formData.message}
                          onChange={handleChange}
                          onFocus={() => setFocused('message')}
                          onBlur={() => setFocused(null)}
                          placeholder="Tell us how we can help…"
                          animate={{
                            boxShadow: focused === 'message'
                              ? '0 0 0 3px rgba(201,168,76,0.2)'
                              : '0 0 0 0px rgba(201,168,76,0)',
                          }}
                          transition={{ duration: 0.2 }}
                          className="w-full bg-[#f5f0e8] border border-[#e8e0d0] rounded-xl px-4 py-3 text-sm text-[#0a1628] placeholder-[#0a1628]/25 focus:outline-none focus:border-[#c9a84c] focus:bg-white transition-colors resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-4">
                        <p className="text-xs text-[#0a1628]/35 max-w-[200px] leading-snug">
                          We will never share your details with third parties.
                        </p>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="shrink-0 inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#0d1f3c] text-black text-sm font-bold px-7 py-3.5 rounded-xl transition-colors shadow-md group"
                        >
                          Send Message
                          <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── Trust strip ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 grid sm:grid-cols-3 gap-4"
        >
          {trust.map(({ Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(10,22,40,0.10)' }}
              className="bg-white border border-[#e8e0d0] rounded-2xl p-5 shadow-sm flex gap-4 cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#c9a84c]" />
              </div>
              <div>
                <p className="font-black text-[#0a1628] text-sm mb-1">{title}</p>
                <p className="text-xs text-[#0a1628]/50 leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </motion.section>

      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
