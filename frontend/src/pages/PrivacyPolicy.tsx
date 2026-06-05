"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import SEOHead from "../components/SEOHead";
import {
  Shield, Eye, FileText, Mail, Check,
  Info, Globe, UserCheck, Database,
  Clock, ExternalLink,
} from "lucide-react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const PrivacyPolicyPage = () => {
  const [activeSection, setActiveSection] = useState("intro");

  const sections = [
    { id: "intro",         title: "1. Your Privacy Matters",           icon: <Info size={18} /> },
    { id: "collect",       title: "2. Information We Collect",          icon: <Database size={18} /> },
    { id: "use",           title: "3. How We Use Your Information",     icon: <Eye size={18} /> },
    { id: "sharing",       title: "4. Sharing Your Information",        icon: <Globe size={18} /> },
    { id: "security",      title: "5. Keeping Information Secure",      icon: <Shield size={18} /> },
    { id: "international", title: "6. International Data Transfers",    icon: <Globe size={18} /> },
    { id: "retention",     title: "7. How Long We Keep Information",    icon: <Clock size={18} /> },
    { id: "rights",        title: "8. Your Rights",                     icon: <UserCheck size={18} /> },
    { id: "contact",       title: "9. Changes & Contact",               icon: <Mail size={18} /> },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top + window.pageYOffset;
      const elementHeight = elementRect.height;
      const viewportHeight = window.innerHeight;
      const offsetPosition = elementTop - (viewportHeight / 2) + (elementHeight / 2);
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans text-black">
      <SEOHead
        title="Privacy Policy"
        description="Read Brit Books' privacy policy to understand how we collect, use, and protect your personal data in compliance with UK data protection law."
        canonical="/privacy-policy"
        noindex={false}
      />
      <TopBar />

      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-12 p-6 lg:p-12 lg:pt-20">

        {/* MOBILE SECTION SELECTOR */}
        <div className="md:hidden mb-2">
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Jump to section</label>
          <select
            value={activeSection}
            onChange={e => scrollToSection(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]"
          >
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        {/* STICKY SIDEBAR */}
        <aside className="hidden md:block md:w-72 shrink-0">
          <div className="sticky top-28 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xl shadow-slate-200/40"
            >
              <p className="text-[10px] font-black text-black uppercase tracking-widest mb-5 px-2">Navigation</p>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <motion.button
                    key={section.id}
                    whileHover={{ scale: 1.04, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
                      activeSection === section.id
                        ? "bg-[#0a1628] text-[#c9a84c] shadow-lg"
                        : "text-black hover:bg-[#f5f0e8] hover:text-black"
                    }`}
                  >
                    {section.icon}
                    {section.title}
                  </motion.button>
                ))}
              </nav>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-blue-50 rounded-3xl p-6 border border-blue-100"
            >
              <p className="text-xs font-bold text-blue-600 uppercase mb-2">Need help?</p>
              <p className="text-sm text-blue-900 leading-relaxed mb-4">Questions about your personal information?</p>
              <a
                href="mailto:customercare@britbooks.co.uk"
                className="text-sm font-black text-blue-600 flex items-center gap-2 hover:gap-3 transition-all"
              >
                customercare@britbooks.co.uk <ExternalLink size={14} />
              </a>
            </motion.div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 space-y-24 pb-32">

          {/* Hero */}
          <motion.header initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <Shield size={14} /> Privacy Policy
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-7xl font-black text-black tracking-tight leading-[0.9]">
              Privacy <br /><span className="text-blue-600">is a Right.</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-base sm:text-xl text-black max-w-2xl font-medium">
              Brit Books respects your privacy and is committed to protecting your personal information. We handle your information in line with UK data protection laws, including the UK GDPR and the Data Protection Act 2018.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex items-center gap-4 text-xs font-bold text-black border-t pt-6 w-fit">
              <span>LAST UPDATED: MAY 2026</span>
            </motion.div>
          </motion.header>

          {/* 1. Your Privacy Matters */}
          <motion.section id="intro" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">1. Your Privacy Matters</h2>
            <div className="space-y-6">
              <p className="text-black leading-relaxed">
                Brit Books respects your privacy and is committed to protecting your personal information. We collect and use your information to:
              </p>
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Process orders and payments",
                  "Deliver products",
                  "Manage returns and refunds",
                  "Provide customer support",
                  "Improve our website and services",
                  "Prevent fraud and misuse",
                  "Send marketing communications where permitted by law",
                ].map((item) => (
                  <motion.div variants={fadeInUp} key={item} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-semibold text-black">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-black leading-relaxed">
                We handle your information in line with UK data protection laws, including the UK GDPR and the Data Protection Act 2018.
              </p>
            </div>
          </motion.section>

          {/* 2. Information We Collect */}
          <motion.section id="collect" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">2. Information We Collect</h2>
            <div className="space-y-6">

              <div className="p-6 rounded-2xl border border-slate-100 bg-white">
                <h3 className="text-lg font-black text-black mb-3">Information You Give Us</h3>
                <p className="text-black text-sm mb-4">When you place an order, create an account, or contact us, we may collect:</p>
                <ul className="space-y-2">
                  {["Your name", "Email address", "Phone number", "Billing and delivery addresses", "Order history", "Saved preferences and wishlists", "Customer service messages"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-black">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-white">
                <h3 className="text-lg font-black text-black mb-3">Payment Information</h3>
                <p className="text-black text-sm mb-3">Payments are securely processed by trusted payment providers. Brit Books does not store full payment card details. We may keep limited payment information such as:</p>
                <ul className="space-y-2 mb-3">
                  {["Card type", "Masked card number", "Expiry date", "Billing address", "Cardholder name"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-black">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />{item}
                    </li>
                  ))}
                </ul>
                <p className="text-black text-sm">This helps us process orders and support future purchases.</p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-white">
                <h3 className="text-lg font-black text-black mb-3">Information Collected Automatically</h3>
                <p className="text-black text-sm mb-3">When you use our website, we may automatically collect:</p>
                <ul className="space-y-2 mb-3">
                  {["IP address", "Browser and device information", "Pages viewed", "Time spent on the website", "Approximate location", "Website activity and browsing behaviour"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-black">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />{item}
                    </li>
                  ))}
                </ul>
                <p className="text-black text-sm">This helps us improve website performance, security, and customer experience.</p>
              </div>

            </div>
          </motion.section>

          {/* 3. How We Use Your Information */}
          <motion.section id="use" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">3. How We Use Your Information</h2>
            <div className="space-y-4">
              <p className="text-black">We use your information to:</p>
              <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
                {[
                  "Process and deliver orders",
                  "Provide customer support",
                  "Manage returns and refunds",
                  "Improve our website and services",
                  "Personalise your shopping experience",
                  "Detect and prevent fraud",
                  "Comply with legal obligations",
                ].map((item) => (
                  <motion.li variants={fadeInUp} key={item} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white">
                    <Check className="text-green-500 shrink-0 mt-0.5" size={18} />
                    <span className="text-black font-medium">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-blue-900 text-sm leading-relaxed">Where allowed by law, we may also send promotional emails and product recommendations. You can <strong>unsubscribe from marketing emails at any time.</strong></p>
              </div>
            </div>
          </motion.section>

          {/* 4. Sharing */}
          <motion.section id="sharing" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">4. Sharing Your Information</h2>
            <div className="space-y-5 text-black">
              <div className="p-5 rounded-2xl bg-red-50 border border-red-100 flex gap-3 items-start">
                <Shield className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-red-800 text-sm font-semibold">Brit Books does not sell your personal information.</p>
              </div>
              <p>We may share limited information with trusted third parties that help us operate our business, including:</p>
              <ul className="space-y-2 pl-2">
                {["Payment providers", "Delivery companies", "Website hosting providers", "Fraud prevention services", "Analytics and marketing providers"].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <p>These providers are required to keep your information secure and use it only for authorised purposes.</p>
              <p>We may also share information if required by law or to protect our legal rights.</p>
            </div>
          </motion.section>

          {/* 5. Security */}
          <motion.section id="security" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">5. Keeping Your Information Secure</h2>
            <div className="space-y-4 text-black">
              <p>We use appropriate technical and organisational measures to protect your personal information. This includes secure encryption technology and website security protections.</p>
              <p>Although we work hard to protect your information, no online system can be guaranteed to be completely secure.</p>
            </div>
          </motion.section>

          {/* 6. International Transfers */}
          <motion.section id="international" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">6. International Data Transfers</h2>
            <div className="space-y-4 text-black">
              <p>Some service providers may process information outside the United Kingdom. Where this happens, we use appropriate safeguards to ensure your information remains protected.</p>
            </div>
          </motion.section>

          {/* 7. Retention */}
          <motion.section id="retention" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">7. How Long We Keep Information</h2>
            <div className="space-y-4 text-black">
              <p>We keep personal information only as long as necessary to:</p>
              <ul className="space-y-2 pl-2">
                {["Provide our services", "Meet legal obligations", "Resolve disputes", "Enforce our agreements"].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>

          {/* 8. Rights */}
          <motion.section id="rights" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">8. Your Rights</h2>
            <p className="text-black mb-6">Under UK data protection law, you may have the right to:</p>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { num: "01", t: "Access",           d: "Request a copy of your personal information." },
                { num: "02", t: "Correct",          d: "Correct inaccurate information." },
                { num: "03", t: "Delete",           d: "Request deletion of your information." },
                { num: "04", t: "Restrict",         d: "Restrict or object to processing." },
                { num: "05", t: "Withdraw Consent", d: "Withdraw consent at any time." },
                { num: "06", t: "Data Copy",        d: "Request a portable copy of your data." },
              ].map((right) => (
                <motion.div key={right.t} variants={fadeInUp} className="p-5 rounded-2xl bg-[#f5f0e8] border border-[#e8e0d0]">
                  <div className="text-[#0a1628] font-black text-3xl mb-3 opacity-40">{right.num}</div>
                  <h4 className="font-black text-black mb-1">{right.t}</h4>
                  <p className="text-sm text-black">{right.d}</p>
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-8 p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <p className="text-black text-sm">You may also make a complaint to the <strong>UK Information Commissioner's Office (ICO)</strong>:{" "}
                <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.ico.org.uk</a>
              </p>
              <p className="text-black text-sm">To exercise your rights, contact Brit Books Customer Care:{" "}
                <a href="mailto:customercare@britbooks.co.uk" className="text-blue-600 hover:underline font-semibold">customercare@britbooks.co.uk</a>
              </p>
            </div>
          </motion.section>

          {/* 9. Changes & Contact */}
          <motion.section id="contact" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeInUp} className="scroll-mt-32 border-t pt-24">
            <h2 className="text-3xl font-black text-black mb-8 tracking-tight">9. Changes to This Policy</h2>
            <div className="space-y-6 text-black">
              <p>Brit Books may update this policy from time to time to reflect legal, operational, or service changes. Updated versions will always be published on this page with the latest revision date.</p>
              <div className="border-2 border-[#0a1628] rounded-3xl p-8">
                <h3 className="text-xl font-black text-black mb-2">Questions or concerns?</h3>
                <p className="text-black text-sm mb-5">Contact Brit Books Customer Care for any questions about this policy or your personal information.</p>
                <a
                  href="mailto:customercare@britbooks.co.uk"
                  className="inline-flex items-center gap-2 bg-[#c9a84c] text-black font-black text-sm px-5 py-3 rounded-xl hover:bg-[#b8963e] transition-colors"
                >
                  <Mail size={15} /> customercare@britbooks.co.uk
                </a>
              </div>
            </div>
          </motion.section>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
