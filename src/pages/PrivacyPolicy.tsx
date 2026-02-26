"use client";

import React, { useState } from "react";
import { motion, useInView } from "framer-motion";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import {
  Shield, Lock, Eye, FileText, Scale, Mail, Check,
  Info, Globe, UserCheck, AlertCircle, Database, Server, RefreshCcw,
  Clock, Heart, Smartphone, ShoppingBag, ExternalLink, BookOpen, Users, CreditCard
} from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardHover = {
  rest: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  hover: { scale: 1.03, boxShadow: "0 10px 25px rgba(59,130,246,0.12)", transition: { duration: 0.3 } },
};

const PrivacyPolicyPage = () => {
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", title: "1. Introduction", icon: <Info size={18} /> },
    { id: "controller", title: "2. Who We Are", icon: <UserCheck size={18} /> },
    { id: "data-collection", title: "3. Data We Collect", icon: <Database size={18} /> },
    { id: "methods", title: "4. How We Collect Data", icon: <Smartphone size={18} /> },
    { id: "purposes", title: "5. Purposes of Processing", icon: <Eye size={18} /> },
    { id: "lawful-basis", title: "6. Lawful Basis", icon: <Scale size={18} /> },
    { id: "sharing", title: "7. Third-Party Sharing", icon: <Globe size={18} /> },
    { id: "international", title: "8. International Transfers", icon: <Server size={18} /> },
    { id: "retention", title: "9. Data Retention", icon: <Clock size={18} /> },
    { id: "children", title: "10. Children's Privacy", icon: <Users size={18} /> },
    { id: "automated-decisions", title: "11. Automated Decisions", icon: <RefreshCcw size={18} /> },
    { id: "rights", title: "12. Your UK GDPR Rights", icon: <UserCheck size={18} /> },
    { id: "cookies", title: "13. Cookies & Tracking", icon: <Lock size={18} /> },
    { id: "security", title: "14. Security Measures", icon: <Shield size={18} /> },
    { id: "vat-compliance", title: "15. VAT & Tax Compliance", icon: <CreditCard size={18} /> },
    { id: "age-restrictions", title: "16. Age-Restricted Sales", icon: <AlertCircle size={18} /> },
    { id: "changes", title: "17. Changes to Policy", icon: <FileText size={18} /> },
    { id: "complaints", title: "18. Complaints & Contact", icon: <Mail size={18} /> },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
  
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top + window.pageYOffset;
      const elementHeight = elementRect.height;
      const viewportHeight = window.innerHeight;
  
      
      const offsetPosition =
        elementTop - (viewportHeight / 2) + (elementHeight / 2);
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
  
      setActiveSection(id);
    }
  };
  

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans text-slate-800">
      <TopBar />

      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-12 p-6 lg:p-12 lg:pt-20">
        {/* STICKY SIDEBAR NAVIGATION */}
        <aside className="md:w-72 shrink-0">
          <div className="sticky top-28 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xl shadow-slate-200/40"
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 px-2">Navigation</p>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <motion.button
                    key={section.id}
                    whileHover={{ scale: 1.04, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
                      activeSection === section.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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
              <p className="text-sm text-blue-900 leading-relaxed mb-4">Questions about your rights or data?</p>
              <a
                href="mailto:privacy@britbooks.co.uk"
                className="text-sm font-black text-blue-600 flex items-center gap-2 hover:gap-3 transition-all"
              >
                Email our Privacy Team <ExternalLink size={14} />
              </a>
            </motion.div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 space-y-24 pb-32">
          {/* Hero Header */}
          <motion.header
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-6"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <Shield size={14} /> Trusted Compliance
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[0.9]">
              Privacy <br />
              <span className="text-blue-600">is a Right.</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-slate-500 max-w-2xl font-medium">
              At BritBooks, we prioritise your trust. We collect only what’s needed to deliver books and never sell your data. Our policies comply with UK GDPR, Consumer Rights Act 2015, and other regulations for online sales.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t pt-6 w-fit">
              <span>VER 2.1.0</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>LAST MODIFIED: FEB 23, 2026</span>
            </motion.div>
          </motion.header>

          {/* 1. Introduction */}
          <motion.section
            id="introduction"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">1. Introduction</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
              <p className="text-lg">
                BritBooks Online Ltd ("we", "us", "our") is committed to protecting your privacy under the UK General Data Protection Regulation (UK GDPR), Data Protection Act 2018, Privacy and Electronic Communications Regulations (PECR), and other relevant UK laws. This policy explains how we collect, use, share, and protect your personal data when you visit britbooks.co.uk, create an account, purchase physical or digital books, or sign up for updates. We also comply with the Consumer Rights Act 2015 for online sales, Consumer Contracts Regulations 2013 for distance selling, and zero-rate VAT on books as per HMRC guidelines.
              </p>
              <p>
                Our services are designed to be compliant with UK regulations for online book retailers, including age-appropriate design for children's content and effective age verification for any age-restricted materials.
              </p>
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                {[
                  "Transparent & minimal data use",
                  "Strong encryption & security",
                  "No data selling to advertisers",
                  "Full support for your GDPR rights",
                  "Compliance with Consumer Rights Act",
                  "Zero-rated VAT on books & e-books",
                ].map((item) => (
                  <motion.div variants={fadeInUp} key={item} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* 2. Who We Are */}
          <motion.section
            id="controller"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">2. Who We Are (Data Controller)</h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>
                <strong>BritBooks Online Ltd</strong><br />
                Company number: 12345678<br />
                Registered office: 456 Literary Lane, London EC2A 4AA, United Kingdom<br />
                VAT number: GB 123 4567 89
              </p>
              <p className="mt-4">
                Email: <a href="mailto:privacy@britbooks.co.uk" className="text-blue-600 hover:underline">privacy@britbooks.co.uk</a>
              </p>
              <p className="mt-2 text-sm italic">
                We act as the data controller. We have not appointed a statutory DPO but our privacy team handles all enquiries. We are registered with the ICO under reference ZA123456.
              </p>
            </div>
          </motion.section>

          {/* 3. Data We Collect */}
          <motion.section
            id="data-collection"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">3. Personal Data We Collect</h2>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: "Identity", items: ["Title", "First & last name", "Username", "Date of birth (for age-restricted content or verification)"], icon: <UserCheck className="text-blue-500" /> },
                { label: "Contact", items: ["Email address", "Billing & delivery address", "Phone number (optional)", "Postcode for VAT purposes"], icon: <Mail className="text-purple-500" /> },
                { label: "Financial", items: ["Card type & last 4 digits", "Transaction IDs", "Billing postcode (via Stripe)", "VAT exemptions if applicable"], icon: <ShoppingBag className="text-orange-500" /> },
                { label: "Technical", items: ["IP address", "Browser & device type", "OS & time zone", "Approximate location"], icon: <Smartphone className="text-pink-500" /> },
                { label: "Profile", items: ["Order history", "Wishlist", "Genre preferences", "Reviews & ratings", "Age preferences for recommendations"], icon: <Heart className="text-red-500" /> },
                { label: "Usage", items: ["Pages viewed", "Search terms", "Cart actions", "Referral sources"], icon: <Eye className="text-teal-500" /> },
              ].map((group) => (
                <motion.div
                  key={group.label}
                  variants={cardHover}
                  initial="rest"
                  whileHover="hover"
                  className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {group.icon}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-4">{group.label}</h4>
                  <ul className="space-y-3">
                    {group.items.map((i) => (
                      <li key={i} className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" /> {i}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
            <p className="mt-8 text-sm italic text-slate-500">
              We do not collect special category data (e.g. health, ethnicity) unless strictly necessary and with explicit consent. For age-restricted books, we may require date of birth for verification in line with UK laws.
            </p>
          </motion.section>

          {/* 4. How We Collect Data */}
          <motion.section
            id="methods"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">4. How We Collect Your Data</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <p>Directly from you when you:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create an account or place an order (including age verification for restricted items)</li>
                <li>Add items to wishlist or submit reviews</li>
                <li>Subscribe to newsletters or enter promotions</li>
                <li>Contact support or request refunds under Consumer Rights Act</li>
              </ul>
              <p className="mt-4">Indirectly from:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment providers (e.g. Stripe – payment confirmation and fraud checks)</li>
                <li>Shipping carriers (e.g. Royal Mail – delivery updates)</li>
                <li>Analytics tools (e.g. Google Analytics – anonymised usage for site improvement)</li>
                <li>HMRC for VAT compliance if required</li>
              </ul>
            </div>
          </motion.section>

          {/* 5. Purposes */}
          <motion.section
            id="purposes"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">5. Why We Process Your Data</h2>
            <div className="space-y-6">
              <p className="text-lg font-medium">We use your data to:</p>
              <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
                {[
                  "Process and deliver your book orders, including digital downloads",
                  "Manage your account, wishlist, and personalised recommendations",
                  "Handle payments securely, apply zero-rated VAT, and prevent fraud",
                  "Provide customer support, process returns and refunds under Consumer Rights Act 2015",
                  "Send order updates and service emails (essential communications)",
                  "Send marketing emails about new books or promotions (only with consent)",
                  "Improve our website accessibility and recommend age-appropriate books",
                  "Comply with tax, VAT, and legal obligations including HMRC audits",
                  "Verify age for restricted content in line with Online Safety Act and age-restricted sales laws",
                ].map((purpose) => (
                  <motion.li variants={fadeInUp} key={purpose} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white">
                    <Check className="text-green-500 shrink-0 mt-1" size={20} />
                    <span className="text-slate-700 font-medium">{purpose}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.section>

          {/* 6. Lawful Basis */}
          <motion.section
            id="lawful-basis"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32 bg-slate-900 rounded-[3rem] p-10 lg:p-16 text-black overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-10 flex items-center gap-4">6.
                <Scale className="text-blue-400" size={32} /> Lawful Basis for Processing
              </h2>
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { t: "Performance of Contract", d: "To fulfil orders, deliver books, process payments, and handle returns under Consumer Contracts Regulations." , l: "Art. 6(1)(b)" },
                  { t: "Consent", d: "For optional marketing emails, personalised recommendations, and age verification where required." , l: "Art. 6(1)(a)" },
                  { t: "Legal Obligation", d: "To keep purchase records for tax/VAT (HMRC), comply with Consumer Rights Act, and age-restricted sales laws." , l: "Art. 6(1)(c)" },
                  { t: "Legitimate Interests", d: "Fraud prevention, site security, basic analytics, and improving accessibility (balanced via LIA)." , l: "Art. 6(1)(f)" },
                ].map((basis) => (
                  <motion.div
                    key={basis.t}
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 transition-all"
                  >
                    <h4 className="font-black text-blue-400 uppercase text-xs tracking-widest mb-2">{basis.t}</h4>
                    <p className="text-slate-200 mb-2">{basis.d}</p>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                      {basis.l}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* 7. Sharing */}
          <motion.section
            id="sharing"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">7. Who We Share Data With</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <p>We share data only when necessary and under data processing agreements:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processors (Stripe – PCI compliant for secure transactions)</li>
                <li>Shipping partners (Royal Mail, DPD – for delivery, name/address only)</li>
                <li>Email providers (e.g. Mailchimp for consented newsletters)</li>
                <li>Analytics (Google – anonymised data for site improvement)</li>
                <li>Legal authorities (HMRC for VAT audits, courts if required by law)</li>
                <li>Age verification services (third-party providers for restricted content, if applicable)</li>
              </ul>
              <p className="mt-4 italic text-sm">We never sell personal data for marketing purposes and ensure all sharing complies with UK GDPR and Electronic Commerce Regulations.</p>
            </div>
          </motion.section>

          {/* 8. International Transfers */}
          <motion.section
            id="international"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">8. International Data Transfers</h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>Some processors (e.g. Stripe, Google) are outside the UK. We ensure adequate safeguards in line with UK GDPR:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>UK International Data Transfer Agreement (IDTA)</li>
                <li>Standard Contractual Clauses + transfer risk assessments</li>
                <li>Adequacy decisions where applicable (e.g. for EU transfers post-Brexit)</li>
              </ul>
              <p className="mt-4">Contact us for copies of safeguards. For international book sales, we comply with export regulations if applicable.</p>
            </div>
          </motion.section>

          {/* 9. Retention */}
          <motion.section
            id="retention"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">9. How Long We Keep Data</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <ul className="list-disc pl-6 space-y-2">
                <li>Order & account data → 6 years after last activity (for statute of limitations, Consumer Rights Act claims, and HMRC VAT requirements)</li>
                <li>Marketing consents → until withdrawn or inactive for 2 years</li>
                <li>Analytics (anonymised) → up to 26 months (Google default)</li>
                <li>Support queries & returns → 2 years after resolution</li>
                <li>Age verification data → deleted immediately after successful check, unless required for legal reasons</li>
              </ul>
              <p className="italic text-sm">Data is securely deleted or anonymised after retention periods, in line with UK GDPR and HMRC guidelines.</p>
            </div>
          </motion.section>

          {/* 10. Children's Privacy – New */}
          <motion.section
            id="children"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">10. Children's Privacy</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <p>In compliance with the UK GDPR and the Age Appropriate Design Code (Children's Code), we take special care with children's data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Our services are not directed at children under 13 without parental consent. The digital age of consent in the UK is 13.</li>
                <li>For users under 18, privacy settings are 'high privacy' by default: no profiling for marketing, geolocation off, minimal data collection.</li>
                <li>We do not knowingly collect data from children under 13. If discovered, we delete it immediately.</li>
                <li>For children's books or content, we provide parental controls and age-appropriate recommendations.</li>
                <li>We comply with the Online Safety Act for any content that may require age assurance.</li>
              </ul>
              <p className="italic text-sm">Parents can contact us to review or delete their child's data.</p>
            </div>
          </motion.section>

          {/* 11. Automated Decisions – New */}
          <motion.section
            id="automated-decisions"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">11. Automated Decision Making</h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>We do not use automated decision-making or profiling that produces legal effects or similarly significant impacts on you, as per UK GDPR Article 22. Recommendations (e.g., book suggestions) are based on manual oversight and do not solely rely on automation.</p>
            </div>
          </motion.section>

          {/* 12. Rights */}
          <motion.section
            id="rights"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">12. Your UK GDPR Rights</h2>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { t: "Access", d: "Request a copy of your personal data.", num: "01" },
                { t: "Rectification", d: "Correct inaccurate details.", num: "02" },
                { t: "Erasure", d: "Delete your data (right to be forgotten).", num: "03" },
                { t: "Restriction", d: "Limit processing in certain cases.", num: "04" },
                { t: "Objection", d: "Object to marketing or legitimate interest use.", num: "05" },
                { t: "Portability", d: "Receive your data in portable format.", num: "06" },
              ].map((right) => (
                <motion.div
                  key={right.t}
                  variants={cardHover}
                  initial="rest"
                  whileHover="hover"
                  className="p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all group"
                >
                  <div className="text-blue-600 font-black text-4xl mb-4 opacity-20 group-hover:opacity-100 transition-all">
                    {right.num}
                  </div>
                  <h4 className="font-black text-slate-900 mb-2">{right.t}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">{right.d}</p>
                </motion.div>
              ))}
            </motion.div>
            <p className="mt-10 text-center text-slate-600">
              Email <strong>privacy@britbooks.co.uk</strong> to exercise rights. We respond within one month (free unless excessive). These rights complement your consumer rights under the Consumer Rights Act 2015.
            </p>
          </motion.section>

          {/* 13. Cookies */}
          <motion.section
            id="cookies"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">13. Cookies & Similar Technologies</h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>We use essential cookies for site function, analytics cookies (with consent), and ensure compliance with PECR. See our full <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a> for details and controls. We do not use cookies for profiling children without consent.</p>
            </div>
          </motion.section>

          {/* 14. Security */}
          <motion.section
            id="security"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">14. How We Protect Your Data</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <ul className="list-disc pl-6 space-y-2">
                <li>TLS encryption for all traffic and data in transit</li>
                <li>Secure payment processing (PCI-DSS via Stripe)</li>
                <li>Access controls, regular security audits, and vulnerability scanning</li>
                <li>Breach response procedures in line with UK GDPR</li>
                <li>Additional safeguards for children's data, including parental notifications if applicable</li>
              </ul>
              <p className="italic text-sm">While we take strong measures, no system is 100% secure. We report breaches to the ICO within 72 hours if required.</p>
            </div>
          </motion.section>

          {/* 15. VAT & Tax Compliance – New */}
          <motion.section
            id="vat-compliance"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">15. VAT & Tax Compliance</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <p>In line with HMRC VAT Notice 701/10, physical books, printed matter, and eligible e-publications are zero-rated for VAT in the UK. We process your billing data to apply correct VAT rates:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Zero VAT on qualifying books and e-books (from 1 May 2020 for e-publications not devoted to advertising/audio/video)</li>
                <li>Standard VAT on non-qualifying items or international sales where applicable</li>
                <li>Retention of transaction records for 6 years as required by HMRC</li>
                <li>Sharing with HMRC only for audits or legal obligations</li>
              </ul>
              <p className="italic text-sm">For EU sales post-Brexit, we comply with VAT MOSS or OSS schemes if thresholds are met.</p>
            </div>
          </motion.section>

          {/* 16. Age-Restricted Sales – New */}
          <motion.section
            id="age-restrictions"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">16. Age-Restricted Sales</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <p>We comply with UK laws on age-restricted products, including the Online Safety Act and Children and Young Persons Act 1933. For books with age classifications (e.g., adult content, video games in books):</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We use effective age verification systems (e.g., date of birth checks, third-party ID verification) to prevent sales to underage users</li>
                <li>Sales of restricted items are limited to those 18+ (or appropriate age)</li>
                <li>Content is not visible until age is verified</li>
                <li>We exercise due diligence to avoid offences, including training staff and monitoring systems</li>
              </ul>
              <p className="italic text-sm">If you believe an underage sale occurred, contact us immediately. We do not sell highly restricted items like tobacco or alcohol.</p>
            </div>
          </motion.section>

          {/* 17. Changes to Policy – New */}
          <motion.section
            id="changes"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">17. Changes to this Policy</h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>We may update this policy to reflect changes in our practices or UK regulations (e.g., updates to GDPR, Online Safety Act). Changes will be posted here with the updated date. For significant changes, we will notify you via email or site notice. Continued use constitutes acceptance.</p>
            </div>
          </motion.section>

          {/* 18. Complaints & Contact */}
          <motion.section
            id="complaints"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeInUp}
            className="scroll-mt-32 border-t pt-24 text-center"
          >
            <div className="max-w-xl mx-auto space-y-8">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 leading-tight">
                Concerned? <br /> You Can Contact the ICO
              </h2>
              <p className="text-slate-600 font-medium max-w-lg mx-auto">
                If unsatisfied with our response, you have the right to complain to the UK's data protection regulator or Trading Standards for consumer issues.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://ico.org.uk/make-a-complaint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-slate-900 text-black font-black rounded-2xl shadow-xl hover:shadow-slate-300 transition-all active:scale-95 flex items-center gap-2 justify-center"
                >
                  Make ICO Complaint <ExternalLink size={16} />
                </a>
                <a
                  href="mailto:privacy@britbooks.co.uk"
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 justify-center"
                >
                  Contact BritBooks
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