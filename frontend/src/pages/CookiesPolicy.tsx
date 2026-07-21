import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Cookie, Shield, BarChart2, Settings, Globe, Clock, CheckCircle, X, ExternalLink } from "lucide-react";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import SEOHead from "../components/SEOHead";

const cookieTypes = [
  {
    id: "essential",
    icon: <Shield size={20} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Essential Cookies",
    badge: "Always On",
    badgeColor: "bg-emerald-100 text-emerald-700",
    required: true,
    description:
      "These cookies are necessary to keep the website working properly. They enable core features such as keeping you logged in, saving your basket, and allowing secure checkout. You cannot opt out of these.",
  },
  {
    id: "analytics",
    icon: <BarChart2 size={20} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "Analytics Cookies",
    badge: "Optional",
    badgeColor: "bg-blue-100 text-blue-700",
    required: false,
    description:
      "These cookies help us analyse traffic and usage so we can improve website performance and customer experience.",
  },
  {
    id: "functional",
    icon: <Settings size={20} />,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    title: "Functionality Cookies",
    badge: "Optional",
    badgeColor: "bg-purple-100 text-purple-700",
    required: false,
    description:
      "These cookies remember your preferences and personalise your experience and content on our website.",
  },
  {
    id: "marketing",
    icon: <Globe size={20} />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    title: "Advertising Cookies",
    badge: "Optional",
    badgeColor: "bg-orange-100 text-orange-700",
    required: false,
    description:
      "These cookies support marketing and advertising. Some third-party services may also use cookies when you interact with our website.",
  },
];

const faqs = [
  { q: "What exactly is a cookie?", a: "Cookies are small files stored on your device when you visit our website. They help the website remember your preferences and work properly." },
  { q: "How do I manage or disable cookies?", a: "You can manage or disable cookies through your browser settings. Please note that some website features may not work correctly if cookies are disabled." },
  { q: "What happens if I decline optional cookies?", a: "The site will continue to work normally. You will still be able to browse, add to your basket, and checkout. Essential cookies will remain active as they are required for the website to function." },
  { q: "How do I withdraw my consent?", a: "You can withdraw consent at any time by adjusting your cookie preferences or clearing your browser cookies. Your new preferences will take effect immediately." },
];

export default function CookiesPolicyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [consent, setConsent] = useState<Record<string, boolean>>({ analytics: true, functional: true, marketing: false });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <SEOHead
        title="Cookies Policy"
        description="Learn how BritBooks uses cookies to improve your browsing experience. Manage your cookie preferences and learn about our data practices."
        canonical="/cookies"
        noindex={false}
      />
      <TopBar />

      {/* ── Hero ── */}
      <div className="relative bg-[#0d1b3e] text-white px-6 py-16 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute -top-24 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-16 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating cookie + shield illustration — desktop */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none select-none">
          {/* Central cookie */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
            className="relative"
          >
            {/* Big cookie circle */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="w-36 h-36 rounded-full bg-amber-400/20 border-2 border-amber-400/30 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl"
              >🍪</motion.div>
            </motion.div>

            {/* Orbiting badges */}
            {[
              { icon: <Shield size={14} className="text-emerald-300" />, bg: "bg-emerald-400/20 border-emerald-400/30", top: "-16px", right: "10px", delay: 0 },
              { icon: <BarChart2 size={14} className="text-blue-300" />,  bg: "bg-blue-400/20 border-blue-400/30",     top: "30px",  right: "-20px", delay: 0.3 },
              { icon: <Settings size={14} className="text-purple-300" />, bg: "bg-purple-400/20 border-purple-400/30", top: "100px", right: "-16px", delay: 0.6 },
              { icon: <Globe size={14} className="text-orange-300" />,    bg: "bg-orange-400/20 border-orange-400/30", top: "120px", right: "20px",  delay: 0.9 },
            ].map((b, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + b.delay, type: "spring" }}
                style={{ top: b.top, right: b.right }}
                className={`absolute w-9 h-9 rounded-full border flex items-center justify-center ${b.bg}`}
              >
                {b.icon}
              </motion.div>
            ))}
          </motion.div>

          {/* Floating cookie crumbs */}
          {[
            { x: -60, y: 20, size: "text-lg", delay: 1.2 },
            { x: -40, y: 100, size: "text-sm", delay: 1.5 },
            { x: 160, y: 10, size: "text-base", delay: 1.8 },
          ].map((c, i) => (
            <motion.div key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.4], y: [0, -6, 0] }}
              transition={{ delay: c.delay, duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", top: `${c.y}px`, left: `${c.x}px` }}
              className={c.size}
            >🍪</motion.div>
          ))}

          {/* Floating toggle chip */}
          <motion.div
            animate={{ y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-24 top-10 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 flex items-center gap-3"
          >
            <div className="w-10 h-5 rounded-full bg-indigo-600 relative">
              <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
            </div>
            <span className="text-xs font-semibold text-white/70">Analytics</span>
          </motion.div>

          <motion.div
            animate={{ y: [0, 6, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -left-20 bottom-0 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 flex items-center gap-3"
          >
            <div className="w-10 h-5 rounded-full bg-gray-500/50 relative">
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
            </div>
            <span className="text-xs font-semibold text-white/70">Marketing</span>
          </motion.div>
        </div>

        {/* Text */}
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6"
          >
            <Cookie size={13} className="text-amber-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-white/80">Legal</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl font-black mb-4 tracking-tight"
          >Cookie Policy</motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/80 text-lg max-w-xl leading-relaxed"
          >
            We use cookies to improve your experience. Here's exactly what we use, why we use it, and how you can control it.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 mt-6 text-sm text-white/70"
          >
            <span className="flex items-center gap-1.5"><Clock size={13} /> Last updated: May 2026</span>
            <span>·</span>
            <span>Applies to britbooks.co.uk</span>
          </motion.div>

          {/* Cookie type count pills */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 mt-6"
          >
            {[
              { label: "Essential",  color: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30" },
              { label: "Analytics",  color: "bg-blue-400/20 text-blue-300 border-blue-400/30" },
              { label: "Functional", color: "bg-purple-400/20 text-purple-300 border-purple-400/30" },
              { label: "Marketing",  color: "bg-orange-400/20 text-orange-300 border-orange-400/30" },
            ].map(p => (
              <span key={p.label} className={`text-xs font-semibold px-3 py-1 rounded-full border ${p.color}`}>
                {p.label}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 space-y-14">

        {/* Intro */}
        <section>
          <p className="text-gray-600 text-base leading-relaxed">
            Cookies are small files stored on your device when you visit our website. Brit Books uses cookies and similar technologies to keep the website working properly, remember your preferences, improve website performance, analyse traffic and usage, personalise content, and support marketing and advertising.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mt-4">
            Some third-party services may also use cookies when you interact with our website. You can manage or disable cookies through your browser settings. Please note that some website features may not work correctly if cookies are disabled.
          </p>
        </section>

        {/* Cookie Types */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-8">Types of Cookies We Use</h2>
          <div className="space-y-6">
            {cookieTypes.map((type) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-3xl border p-6 ${type.border} bg-white shadow-sm`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${type.bg} ${type.color} flex items-center justify-center`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900">{type.title}</h3>
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-0.5 ${type.badgeColor}`}>
                        {type.badge}
                      </span>
                    </div>
                  </div>
                  {!type.required && (
                    <button
                      onClick={() => setConsent(c => ({ ...c, [type.id]: !c[type.id] }))}
                      className={`flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300 relative ${consent[type.id] ? "bg-indigo-600" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${consent[type.id] ? "left-6" : "left-0.5"}`} />
                    </button>
                  )}
                  {type.required && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle size={13} /> Required
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-sm leading-relaxed">{type.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Consent preferences */}
        <section className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
          <h2 className="text-xl font-black text-gray-900 mb-2">Your Cookie Preferences</h2>
          <p className="text-gray-500 text-sm mb-6">Toggle optional cookies on or off. Essential cookies cannot be disabled as they are required for the site to function.</p>
          <div className="space-y-4 mb-6">
            {cookieTypes.filter(t => !t.required).map(type => (
              <div key={type.id} className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${type.bg} ${type.color} flex items-center justify-center`}>
                    {type.icon}
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">{type.title}</span>
                </div>
                <button
                  onClick={() => setConsent(c => ({ ...c, [type.id]: !c[type.id] }))}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${consent[type.id] ? "bg-indigo-600" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${consent[type.id] ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="px-6 py-3 bg-[#c9a84c] hover:bg-[#b8963e] text-black text-sm font-bold rounded-2xl transition-all">
              Save preferences
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
                <CheckCircle size={15} /> Preferences saved
              </span>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Common Questions</h2>
          <div className="bg-white rounded-3xl border border-gray-100 px-8 divide-y divide-gray-100 shadow-sm">
            {faqs.map((f, i) => (
              <div key={i} className="py-5">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between text-left gap-4 group">
                  <span className={`text-sm font-semibold transition-colors ${openFaq === i ? "text-indigo-700" : "text-gray-800 group-hover:text-gray-900"}`}>{f.q}</span>
                  <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${openFaq === i ? "rotate-180 text-indigo-500" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden text-sm text-gray-500 leading-relaxed mt-3">
                      {f.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="border-2 border-[#0a1628] rounded-3xl p-8">
          <h2 className="text-xl font-black text-black mb-2">Questions about this policy?</h2>
          <p className="text-black text-sm mb-5">Contact Brit Books Customer Care for any questions about this cookies policy or your personal information.</p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:customercare@britbooks.co.uk" className="flex items-center gap-2 px-5 py-3 bg-[#c9a84c] text-black rounded-2xl text-sm font-bold hover:bg-[#b8963e] transition-all">
              <ExternalLink size={14} /> customercare@britbooks.co.uk
            </a>
            <a href="/privacy-policy" className="flex items-center gap-2 px-5 py-3 border-2 border-[#0a1628] text-black rounded-2xl text-sm font-bold hover:bg-[#f5f0e8] transition-all">
              Privacy Policy →
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
