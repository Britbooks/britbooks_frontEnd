import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, Clock, ShieldCheck, Zap, Globe2,
  CheckCircle, ArrowUpRight, MessageSquare, BookOpen,
  Phone, MapPin, Star, Heart,
} from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

// ─── Static data ──────────────────────────────────────────────────────────────
const HOURS = [
  { day: 'Monday – Friday', time: '9:00 am – 6:00 pm', open: true  },
  { day: 'Saturday',        time: '10:00 am – 4:00 pm', open: true  },
  { day: 'Sunday',          time: 'Closed',              open: false },
];

const TRUST = [
  {
    Icon: Zap,
    color: 'bg-amber-100 text-amber-600',
    title: 'Fast Response',
    body: 'Replies within one business day — usually much faster.',
  },
  {
    Icon: MessageSquare,
    color: 'bg-blue-100 text-blue-600',
    title: 'Human Support',
    body: 'Real book lovers, not bots. We genuinely care about every order.',
  },
  {
    Icon: ShieldCheck,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Order Protected',
    body: 'No-questions-asked 30-day return policy on all orders.',
  },
];

const FAQ_LINKS = [
  { label: 'Track my order',      href: '/orders'           },
  { label: 'Shipping & Delivery', href: '/shipping-returns' },
  { label: 'Returns & Refunds',   href: '/return-policy'    },
  { label: 'Browse FAQs',         href: '/faq'              },
];

// ─── Stagger helpers ──────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as any },
});

// ─── Trustpilot nudge ─────────────────────────────────────────────────────────
const TrustpilotNudge = () => (
  <motion.a
    href="https://uk.trustpilot.com/review/britbooks.co.uk"
    target="_blank"
    rel="noopener noreferrer"
    {...fadeUp(0.35)}
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

// ─── Page ─────────────────────────────────────────────────────────────────────
const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [ukTime,   setUkTime]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);
  const [heroBg]                = useState(() =>
    `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/1600/900`
  );

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: 'Europe/London' }).format(new Date());
    setUkTime(fmt());
    const id = setInterval(() => setUkTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const subjectLabels: Record<string, string> = {
    order: 'Order Enquiry', shipping: 'Shipping & Delivery',
    return: 'Returns & Refunds', product: 'Product Question', other: 'General Enquiry',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const label   = subjectLabels[formData.subject] || formData.subject;
    const subject = encodeURIComponent(`[BritBooks] ${label}`);
    const body    = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`);
    const a = document.createElement('a');
    a.href = `mailto:customercare@britbooks.co.uk?subject=${subject}&body=${body}`;
    a.click();
    setSubmitted(true);
  };

  const inputClass = (id: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 ${
      focused === id
        ? 'border-[#0a1628] bg-white shadow-[0_0_0_3px_rgba(10,22,40,0.08)]'
        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <SEOHead
        title="Contact Us"
        description="Get in touch with the BritBooks team — help with orders, shipping, returns, or any question about your books."
        canonical="/contact"
      />
      <TopBar />

      {/* ── Hero (PopularBooks style) ─────────────────────────────────── */}
      <header
        className="relative pt-14 pb-12 px-6 md:px-8 overflow-hidden bg-[#0d1b3e]"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 to-black/50" />
        <div className="relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
            {/* Left: title */}
            <motion.div {...fadeUp(0)}>
              <span className="text-white font-black uppercase tracking-[0.3em] mb-2 block text-sm">
                BritBooks · UK Book Store
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-xl">
                Contact Us
              </h1>
              <p className="text-white/55 text-sm mt-3 max-w-xs">
                Our team of book lovers is here to help — usually within a few hours.
              </p>
            </motion.div>

            {/* Right: live status + email */}
            <motion.div {...fadeUp(0.15)} className="flex flex-col gap-3 items-start md:items-end shrink-0">
              {/* Live indicator */}
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs text-white/70 font-medium">Team online · {ukTime} UK</span>
              </div>

              {/* Email CTA */}
              <motion.a
                href="mailto:customercare@britbooks.co.uk"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 bg-white text-gray-900 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4 text-[#0a1628]" />
                customercare@britbooks.co.uk
              </motion.a>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 w-full px-4 sm:px-6 py-12 pb-16">

        <div className="grid lg:grid-cols-5 gap-6 items-start">

          {/* ── Left sidebar ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Contact info card */}
            <motion.div {...fadeUp(0.1)} className="bg-[#0a1628] rounded-2xl overflow-hidden">
              {/* Subtle top accent */}
              <div className="h-1 bg-gradient-to-r from-[#c9a84c] via-[#e8c96a] to-[#c9a84c]" />

              <div className="p-6 space-y-5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Get In Touch</p>

                {/* Email */}
                <motion.a
                  href="mailto:customercare@britbooks.co.uk"
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/15 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#c9a84c]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Email</p>
                    <p className="text-sm font-bold text-white group-hover:text-[#c9a84c] transition-colors leading-tight">
                      customercare@britbooks.co.uk
                    </p>
                  </div>
                </motion.a>

                {/* Location */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-white/40" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Based in</p>
                    <p className="text-sm font-bold text-white/80">United Kingdom</p>
                  </div>
                </div>

                {/* Response time */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-white/40" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Response time</p>
                    <p className="text-sm font-bold text-white/80">Within 1 business day</p>
                  </div>
                </div>
              </div>

              {/* Stars rating */}
              <div className="px-6 pb-6 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-3.5 h-3.5 text-[#c9a84c]" fill="#c9a84c" />
                  ))}
                </div>
                <span className="text-[11px] text-white/35 font-medium">Rated Excellent by our readers</span>
              </div>
            </motion.div>

            {/* Support hours card */}
            <motion.div {...fadeUp(0.2)} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Support Hours</p>
              </div>

              <div className="space-y-3">
                {HOURS.map(({ day, time, open }, i) => (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.07 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${open ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                      <span className="text-sm text-gray-500">{day}</span>
                    </div>
                    <span className={`text-sm font-bold ${open ? 'text-gray-900' : 'text-gray-300'}`}>{time}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <Globe2 className="w-3.5 h-3.5 shrink-0" />
                All times GMT / BST
              </div>
            </motion.div>

            {/* Quick links card */}
            <motion.div {...fadeUp(0.28)} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Self-Service</p>
              </div>
              <div className="space-y-1">
                {FAQ_LINKS.map(({ label, href }, i) => (
                  <motion.a
                    key={label}
                    href={href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.32 + i * 0.06 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 group"
                  >
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">{label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0a1628] transition-colors" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right: form ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#0a1628] via-[#1a3a6b] to-[#0a1628]" />

            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  /* ── Success state ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="flex flex-col items-center justify-center py-16 text-center gap-5"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
                      className="relative"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-9 h-9 text-emerald-500" />
                      </div>
                      <motion.span
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-2 -right-2 text-xl"
                      >
                        ✨
                      </motion.span>
                    </motion.div>

                    <motion.div {...fadeUp(0.2)}>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">Message received!</h2>
                      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                        Thanks for reaching out. We'll get back to you within one business day.
                      </p>
                    </motion.div>

                    <TrustpilotNudge />

                    <motion.button
                      {...fadeUp(0.5)}
                      onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="text-xs font-bold text-gray-400 hover:text-gray-700 underline underline-offset-4 transition-colors"
                    >
                      Send another message
                    </motion.button>
                  </motion.div>

                ) : (
                  /* ── Form ── */
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-8">
                      <div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Send an Enquiry</p>
                        <h2 className="text-xl font-black text-gray-900">We usually reply within a few hours</h2>
                        <p className="text-sm text-gray-400 mt-1">Fill in the form and we'll be in touch shortly.</p>
                      </div>
                      <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#0a1628] flex items-center justify-center">
                        <Heart className="w-5 h-5 text-[#c9a84c]" />
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                      {/* Name + Email row */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { id: 'name',  label: 'Your Name',     type: 'text',  placeholder: 'Jane Smith'        },
                          { id: 'email', label: 'Email Address',  type: 'email', placeholder: 'jane@example.com'  },
                        ].map(({ id, label, type, placeholder }, i) => (
                          <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.07 }}
                            className="space-y-1.5"
                          >
                            <label htmlFor={id} className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                              {label}
                            </label>
                            <input
                              id={id} name={id} type={type} required
                              value={(formData as any)[id]}
                              onChange={handleChange}
                              onFocus={() => setFocused(id)}
                              onBlur={() => setFocused(null)}
                              placeholder={placeholder}
                              className={inputClass(id)}
                            />
                          </motion.div>
                        ))}
                      </div>

                      {/* Subject */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22 }}
                        className="space-y-1.5"
                      >
                        <label htmlFor="subject" className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                          Subject
                        </label>
                        <div className="relative">
                          <select
                            id="subject" name="subject" required
                            value={formData.subject}
                            onChange={handleChange}
                            onFocus={() => setFocused('subject')}
                            onBlur={() => setFocused(null)}
                            className={inputClass('subject') + ' appearance-none pr-10 cursor-pointer'}
                          >
                            <option value="" disabled>Select a topic…</option>
                            <option value="order">Order Enquiry</option>
                            <option value="shipping">Shipping &amp; Delivery</option>
                            <option value="return">Returns &amp; Refunds</option>
                            <option value="product">Product Question</option>
                            <option value="other">Something Else</option>
                          </select>
                          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </motion.div>

                      {/* Message */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28 }}
                        className="space-y-1.5"
                      >
                        <label htmlFor="message" className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                          Message
                        </label>
                        <textarea
                          id="message" name="message" rows={5} required
                          value={formData.message}
                          onChange={handleChange}
                          onFocus={() => setFocused('message')}
                          onBlur={() => setFocused(null)}
                          placeholder="Tell us how we can help you…"
                          className={inputClass('message') + ' resize-none'}
                        />
                      </motion.div>

                      {/* Footer row */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.34 }}
                        className="flex items-center justify-between gap-4 pt-1"
                      >
                        <p className="text-xs text-gray-400 leading-snug max-w-[200px]">
                          Your details are never shared with third parties.
                        </p>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(10,22,40,0.2)' }}
                          whileTap={{ scale: 0.97 }}
                          className="shrink-0 inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#c9a84c] text-[#c9a84c] hover:text-[#0a1628] text-sm font-bold px-7 py-3.5 rounded-xl transition-all shadow-md group border border-[#c9a84c]/30"
                        >
                          Send Message
                          <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </motion.button>
                      </motion.div>

                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── Trust strip ───────────────────────────────────────────── */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {TRUST.map(({ Icon, color, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.45 }}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(10,22,40,0.08)' }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex gap-4 cursor-default"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Image strip ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 grid grid-cols-3 gap-3 rounded-2xl overflow-hidden"
        >
          {[
            'https://picsum.photos/seed/books1/600/300',
            'https://picsum.photos/seed/library2/600/300',
            'https://picsum.photos/seed/reading3/600/300',
          ].map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl aspect-video">
              <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-[#0a1628]/30" />
            </div>
          ))}
        </motion.div>

      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
