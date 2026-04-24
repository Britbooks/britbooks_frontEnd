import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Mail, HelpCircle, Search, MessageSquare } from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

const faqs = [
  { category: 'Orders & Delivery', q: 'How long does shipping take?', a: 'Standard delivery within the UK takes 2–4 working days. Express next-day delivery is available at checkout. International shipping typically takes 7–14 days.' },
  { category: 'Orders & Delivery', q: 'How do I track my order?', a: 'Once your order ships you will receive a tracking link by email. You can also view real-time status from the My Orders section of your account dashboard.' },
  { category: 'Returns', q: 'What is your return policy?', a: 'We accept returns within 30 days of receipt for books in their original, unused condition. Start a return from your account or email support@britbooks.co.uk with your order number.' },
  { category: 'Returns', q: 'Who covers return shipping costs?', a: 'You cover return postage unless the item arrived damaged or defective, in which case we will arrange a free collection.' },
  { category: 'Account', q: 'How do I create an account?', a: 'Click Sign Up in the top navigation, fill in your name, email, and password, and follow the prompts. It takes less than a minute.' },
  { category: 'Account', q: 'Can I change my email address?', a: 'Email addresses are locked for security. If you need yours changed, please contact support@britbooks.co.uk and our team will assist you promptly.' },
  { category: 'Selling', q: 'How do I sell my books on BritBooks?', a: 'Go to Sell Books, enter the ISBN and receive an instant valuation. We collect from your door free of charge and transfer payment within 5 working days.' },
  { category: 'Selling', q: 'Do you offer bulk or business accounts?', a: 'Yes. We offer volume pricing, dedicated account managers, and priority support for business customers. Contact us for a tailored quote.' },
  { category: 'Payments', q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, American Express, and PayPal. All payments are protected by 256-bit SSL encryption.' },
];

const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];

const FAQPage = () => {
  const [open, setOpen] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = faqs.filter(f => {
    const matchesCat = activeCategory === 'All' || f.category === activeCategory;
    const matchesSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about BritBooks — orders, shipping, returns, payments, and more. Get the help you need quickly."
        canonical="/faq"
      />
      <TopBar />

      {/* Hero */}
      <header className="bg-[#0a1628] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 80px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 80px)' }} />
        <div className="max-w-3xl mx-auto px-5 py-14 text-center relative z-10">
          <div className="inline-flex items-center gap-2 border border-[#c9a84c]/25 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-5">
            <HelpCircle className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-xs text-[#c9a84c] font-semibold tracking-wide">Help centre</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Frequently Asked<br /><span className="text-[#c9a84c]">Questions</span>
          </h1>
          <p className="text-white/40 text-sm sm:text-base max-w-md mx-auto mb-8">
            Quick answers to everything BritBooks. Can't find what you need? Our team is one message away.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/6 border border-white/12 rounded-2xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8" style={{ backgroundColor: '#f5f0e8', clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeCategory === cat ? 'bg-[#0a1628] text-white shadow-md' : 'bg-white border border-[#e8e0d0] text-[#0a1628]/60 hover:text-[#0a1628]'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[#0a1628]/40 font-semibold text-sm mb-2">No results for "{search}"</p>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="text-xs text-[#c9a84c] font-bold hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e8e0d0] overflow-hidden shadow-sm">
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left">
                  <HelpCircle className={`w-4 h-4 shrink-0 transition-colors ${open === i ? 'text-[#c9a84c]' : 'text-[#0a1628]/25'}`} />
                  <span className="flex-1 font-semibold text-[#0a1628] text-sm sm:text-base leading-snug">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#0a1628]/30 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180 text-[#c9a84c]' : ''}`} />
                </button>
                {open === i && (
                  <div className="px-5 pb-5 border-t border-[#e8e0d0]">
                    <p className="pt-4 text-sm text-[#0a1628]/60 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Still need help CTA */}
        <div className="mt-10 bg-[#0a1628] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-[#c9a84c]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm sm:text-base mb-0.5">Still have questions?</p>
            <p className="text-white/40 text-xs sm:text-sm">Our UK support team replies within two hours on weekdays.</p>
          </div>
          <Link to="/contact"
            className="shrink-0 inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-bold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            <Mail className="w-4 h-4" /> Contact us
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
