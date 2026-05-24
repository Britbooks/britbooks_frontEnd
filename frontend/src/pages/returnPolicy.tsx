import React, { useState } from 'react';
import { ChevronDown, Mail, Phone, MapPin, PackageCheck, RefreshCw, FileText, Headphones } from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

const sections = [
  {
    id: 'eligibility',
    icon: <PackageCheck className="w-5 h-5" />,
    emoji: '📦',
    title: 'Return Eligibility',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-4">
          We want you to love your books. Return most new, unopened items within <strong className="text-[#0a1628]">30 days</strong> of delivery for a full refund or exchange. Items must be in original condition.
        </p>
        <ul className="space-y-2">
          {['Books must be unused and resalable.','Include your order number or receipt.','Personalised items cannot be returned.'].map((item, i) => (
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
    id: 'process',
    icon: <RefreshCw className="w-5 h-5" />,
    emoji: '🔧',
    title: 'Return Process',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-4">Ready to return? Here is how to get started:</p>
        <ol className="space-y-3">
          {[
            <>Email <a href="mailto:support@britbooks.co.uk" className="text-[#c9a84c] font-semibold hover:underline">support@britbooks.co.uk</a> with your order number and reason.</>,
            "We will send a Return Merchandise Authorisation (RMA) number and instructions.",
            'Pack your item securely with the RMA number on the outside.',
            'Ship it back within 14 days of receiving your RMA.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-[#0a1628]/70">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-[10px] font-black">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <button className="mt-5 inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          Start a return
        </button>
      </>
    ),
  },
  {
    id: 'conditions',
    icon: <FileText className="w-5 h-5" />,
    emoji: '📋',
    title: 'Return Conditions',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-4">Please keep these conditions in mind for a smooth return:</p>
        <ul className="space-y-2">
          {[
            'You cover return shipping unless the item was damaged or defective.',
            'Refunds take 7–10 business days after we receive your item.',
            'Original shipping costs are non-refundable.',
            'Items without an RMA may face delays or refusal.',
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
    icon: <Headphones className="w-5 h-5" />,
    emoji: '📞',
    title: 'Contact Us',
    content: (
      <>
        <p className="text-[#0a1628]/60 leading-relaxed mb-5">Need help with your return? Our UK team is ready to assist.</p>
        <ul className="space-y-3">
          {[
            { icon: <Mail className="w-4 h-4" />, label: 'Email', value: 'support@britbooks.co.uk', href: 'mailto:support@britbooks.co.uk' },
            { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: '01234 567 890 (Mon–Fri, 9am–5pm)', href: 'tel:01234567890' },
            { icon: <MapPin className="w-4 h-4" />, label: 'Address', value: 'BritBooks Returns, 123 Book Lane, London, UK' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#0a1628]/5 border border-[#0a1628]/10 flex items-center justify-center shrink-0 text-[#0a1628]/50">{item.icon}</span>
              <div>
                <p className="text-[10px] font-bold text-[#0a1628]/40 uppercase tracking-widest mb-0.5">{item.label}</p>
                {item.href
                  ? <a href={item.href} className="text-sm font-semibold text-[#c9a84c] hover:underline">{item.value}</a>
                  : <p className="text-sm text-[#0a1628]/70">{item.value}</p>}
              </div>
            </li>
          ))}
        </ul>
      </>
    ),
  },
];

const ReturnPolicyPage = () => {
  const [open, setOpen] = useState<string | null>('eligibility');

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title="Return Policy"
        description="BritBooks offers a simple 30-day return policy. Learn how to return books, get refunds, and contact our support team for help."
        canonical="/return-policy"
      />
      <TopBar />

      {/* Hero */}
      <header className="bg-[#0a1628] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 80px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 80px)' }} />
        <div className="max-w-3xl mx-auto px-5 py-14 text-center relative z-10">
          <div className="inline-flex items-center gap-2 border border-[#c9a84c]/25 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-5">
            <span className="text-base">🔄</span>
            <span className="text-xs text-[#c9a84c] font-semibold tracking-wide">30-day returns</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Hassle-Free<br /><span className="text-[#c9a84c]">Return Policy</span>
          </h1>
          <p className="text-white/40 text-sm sm:text-base max-w-md mx-auto">
            We are here to make returns easy and stress-free. Every book, every time.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8" style={{ backgroundColor: '#f5f0e8', clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </header>

      {/* Accordion sections */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20 space-y-3">
        {sections.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-[#e8e0d0] overflow-hidden shadow-sm">
            <button
              onClick={() => setOpen(open === s.id ? null : s.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
            >
              <span className="w-9 h-9 rounded-xl bg-[#f5f0e8] border border-[#e8e0d0] flex items-center justify-center shrink-0 text-[#0a1628]/50">
                {s.icon}
              </span>
              <span className="flex-1 font-bold text-[#0a1628] text-sm sm:text-base">{s.title}</span>
              <ChevronDown className={`w-4 h-4 text-[#0a1628]/30 transition-transform duration-200 shrink-0 ${open === s.id ? 'rotate-180 text-[#c9a84c]' : ''}`} />
            </button>
            {open === s.id && (
              <div className="px-5 pb-5 border-t border-[#e8e0d0]">
                <div className="pt-4">{s.content}</div>
              </div>
            )}
          </div>
        ))}

        {/* Bottom CTA */}
        <div className="bg-[#0a1628] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6">
          <div className="flex-1">
            <p className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest mb-1">Still unsure?</p>
            <p className="text-white font-bold text-sm">Our team is happy to guide you through the returns process.</p>
          </div>
          <a href="mailto:support@britbooks.co.uk"
            className="shrink-0 inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-bold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            <Mail className="w-4 h-4" /> Email us
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnPolicyPage;
