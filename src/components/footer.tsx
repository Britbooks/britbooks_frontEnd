import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaPinterestP, FaInstagram } from 'react-icons/fa';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, BookOpen, ChevronDown } from 'lucide-react';
import axios from 'axios';

/* ── New Arrivals Ticker ───────────────────────────────────────── */
const NewArrivalsTicker = () => {
  const [titles, setTitles] = useState<string[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.post('https://britbooks-api-production-8ebd.up.railway.app/api/market/admin/listings', {
      shelf: 'newArrivals', page: 1, limit: 20,
    }).then(({ data }) => {
      const names: string[] = (data.listings ?? [])
        .map((b: any) => b.title?.replace(/\s*\(\d+\)$/, '').trim())
        .filter(Boolean);
      setTitles(names);
    }).catch(() => {});
  }, []);

  if (!titles.length) return null;

  // Duplicate for seamless loop
  const items = [...titles, ...titles];

  return (
    <div className="border-b border-gray-800 bg-gray-900/80 overflow-hidden py-3 relative">
      {/* fade edges */}
      <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex gap-0 whitespace-nowrap"
        style={{ animation: 'ticker 40s linear infinite' }}
      >
        {items.map((title, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 text-sm text-gray-400">
            <BookOpen className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-medium">{title}</span>
            <span className="text-gray-700 ml-2">·</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

/* ── Mobile accordion section ─────────────────────────────────── */
const AccordionSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 px-6 text-left"
      >
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
};

/* ── Mobile footer ─────────────────────────────────────────────── */
const MobileFooter = ({ email, setEmail, subscribed, handleSubscribe }: {
  email: string; setEmail: (v: string) => void;
  subscribed: boolean; handleSubscribe: (e: React.FormEvent) => void;
}) => (
  <div className="lg:hidden bg-gray-900 text-white">

    {/* Brand block */}
    <div className="flex flex-col items-center text-center px-6 pt-10 pb-8 border-b border-gray-800">
      <Link to="/">
        <img src="/logobrit3.png" alt="BritBooks" className="h-16 w-auto object-contain mb-4 brightness-0 invert" />
      </Link>
      <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
        Quality used books at unbeatable prices with fast UK delivery.
      </p>
      {/* Socials */}
      <div className="flex items-center gap-3 mb-6">
        {[
          { icon: FaFacebookF,  label: 'Facebook'  },
          { icon: FaTwitter,    label: 'Twitter'   },
          { icon: FaPinterestP, label: 'Pinterest' },
          { icon: FaInstagram,  label: 'Instagram' },
        ].map(({ icon: Icon, label }) => (
          <a key={label} href="#" aria-label={label}
            className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-red-600 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <Icon size={15} />
          </a>
        ))}
      </div>
      {/* Newsletter */}
      {subscribed ? (
        <div className="flex items-center gap-2 px-5 py-3 bg-green-600/20 border border-green-500/30 rounded-xl text-sm text-green-400 font-semibold w-full justify-center">
          <ShieldCheck className="w-4 h-4 shrink-0" /> You're subscribed — 25% off applied!
        </div>
      ) : (
        <div className="w-full bg-blue-900 rounded-2xl px-4 py-5">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-3 text-center">
            Get <span className="text-red-400">25% off</span> your first order
          </p>
          <form onSubmit={handleSubscribe} className="flex">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full pl-10 pr-3 py-3 bg-white text-gray-800 rounded-l-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 font-bold text-sm rounded-r-xl transition-colors flex items-center gap-1 shrink-0">
              Join <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>

    {/* Accordion links */}
    <AccordionSection title="Customer Support">
      <ul className="space-y-3.5">
        {[
          { label: 'Get in Touch',       to: '/contact'          },
          { label: 'FAQs',               to: '/faq'              },
          { label: 'Shipping & Returns', to: '/shipping-returns' },
          { label: 'Return Policy',      to: '/return-policy'    },
          { label: 'Privacy Policy',     to: '/privacy-policy'   },
          { label: 'Cookies Policy',     to: '/cookies'          },
        ].map(({ label, to }) => (
          <li key={label}><Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
        ))}
      </ul>
    </AccordionSection>

    <AccordionSection title="My Account">
      <ul className="space-y-3.5">
        {[
          { label: 'Shopping Cart',  to: '/checkout'  },
          { label: 'Order History',  to: '/orders'    },
          { label: 'Wishlist',       to: '/wishlist'  },
          { label: 'My Invoices',    to: '/invoices'  },
          { label: 'Credit Slips',   to: '/credits'   },
          { label: 'My Addresses',   to: '/addresses' },
        ].map(({ label, to }) => (
          <li key={label}><Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
        ))}
      </ul>
    </AccordionSection>

    <AccordionSection title="Explore">
      <ul className="space-y-3.5">
        {[
          { label: 'New Arrivals',   to: '/new-arrivals'   },
          { label: 'Best Sellers',   to: '/bestsellers'    },
          { label: 'Special Offers', to: '/special-offers' },
          { label: 'Clearance',      to: '/clearance'      },
          { label: 'Popular Books',  to: '/popular-books'  },
          { label: 'Browse All',     to: '/category'       },
        ].map(({ label, to }) => (
          <li key={label}><Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
        ))}
      </ul>
    </AccordionSection>

    {/* Contact strip */}
    <div className="px-6 py-6 border-b border-gray-800 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Contact Us</h3>
      <div className="flex items-center gap-3">
        <Phone className="w-4 h-4 text-red-500 shrink-0" />
        <a href="tel:02089046479" className="text-sm text-gray-400">0208 904 6479</a>
      </div>
      <div className="flex items-center gap-3">
        <Mail className="w-4 h-4 text-red-500 shrink-0" />
        <a href="mailto:customercare@britbooks.co.uk" className="text-sm text-gray-400">customercare@britbooks.co.uk</a>
      </div>
      <div className="flex items-start gap-3">
        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-400">London, United Kingdom</p>
      </div>
    </div>

    {/* Bottom */}
    <div className="px-6 py-6 flex flex-col items-center gap-4">
      {/* Payment badges */}
      <div className="flex items-center gap-2">
        <div className="h-7 px-3 bg-white rounded flex items-center justify-center">
          <svg viewBox="0 0 80 20" className="h-4 w-auto"><text x="0" y="15" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="#003087">Pay</text><text x="24" y="15" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="#009cde">Pal</text></svg>
        </div>
        <div className="h-7 px-3 bg-white rounded flex items-center justify-center">
          <svg viewBox="0 0 60 20" className="h-4 w-auto"><text x="0" y="15" fontFamily="Arial" fontWeight="900" fontSize="16" fill="#1a1f71" letterSpacing="-1">VISA</text></svg>
        </div>
        <div className="h-7 px-2 bg-white rounded flex items-center justify-center">
          <svg viewBox="0 0 38 24" className="h-5 w-auto"><circle cx="13" cy="12" r="10" fill="#eb001b" /><circle cx="25" cy="12" r="10" fill="#f79e1b" /><path d="M19 5.4a10 10 0 0 1 0 13.2A10 10 0 0 1 19 5.4z" fill="#ff5f00" /></svg>
        </div>
        <div className="h-7 px-3 bg-[#2557d6] rounded flex items-center justify-center">
          <svg viewBox="0 0 60 20" className="h-3.5 w-auto"><text x="0" y="14" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="white" letterSpacing="0.5">AMEX</text></svg>
        </div>
      </div>
      <p className="text-gray-600 text-xs text-center">
        © {new Date().getFullYear()} BritBooks. All rights reserved.{' '}
        <a href="https://excelclone.co.uk" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">excelclone.co.uk</a>
      </p>
    </div>
  </div>
);

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-gray-900 text-white font-sans">

      {/* ── Live new arrivals ticker (both) ── */}
      <NewArrivalsTicker />

      {/* ══ MOBILE FOOTER ══ */}
      <MobileFooter email={email} setEmail={setEmail} subscribed={subscribed} handleSubscribe={handleSubscribe} />

      {/* ══ DESKTOP FOOTER ══ */}
      {/* ── Newsletter ── */}
      <div className="hidden lg:block bg-blue-900 border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-semibold text-sm md:text-base text-center md:text-left">
              SIGN UP FOR NEWSLETTER & GET{' '}
              <span className="text-red-400 font-black">25% OFF</span> YOUR FIRST ORDER
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-green-600/20 border border-green-500/30 rounded-lg text-sm text-green-400 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" /> You're subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full pl-10 pr-4 py-2.5 text-gray-800 bg-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 font-bold text-sm rounded-r-md transition-colors flex items-center gap-1.5 shrink-0"
                >
                  Subscribe <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="hidden lg:block w-full px-8 md:px-16 xl:px-28 py-20">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-0">

          {/* Brand — extreme left */}
          <div className="w-full lg:w-60 shrink-0">
            <Link to="/">
              <img src="/logobrit3.png" alt="BritBooks" className="h-20 w-auto object-contain mb-3 -ml-4" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your trusted destination for quality used books at unbeatable prices. Explore our vast collection and enjoy fast delivery.
            </p>
            <Link to="/about" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mt-3 transition-colors">
              Learn more <ArrowRight className="w-3 h-3" />
            </Link>
            <div className="flex items-center gap-3 mt-8">
              {[
                { icon: FaFacebookF,  label: 'Facebook'  },
                { icon: FaTwitter,    label: 'Twitter'   },
                { icon: FaPinterestP, label: 'Pinterest' },
                { icon: FaInstagram,  label: 'Instagram' },
              ].map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-red-600 border border-gray-700 hover:border-red-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Middle three — evenly spread */}
          <div className="flex flex-col sm:flex-row flex-1 justify-around gap-12 sm:gap-0 px-0 lg:px-16 xl:px-24">

            {/* Customer Support */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6">Customer Support</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Get in Touch',       to: '/contact'          },
                  { label: 'FAQs',               to: '/faq'              },
                  { label: 'Shipping & Returns', to: '/shipping-returns' },
                  { label: 'Return Policy',      to: '/return-policy'    },
                  { label: 'Privacy Policy',     to: '/privacy-policy'   },
                  { label: 'Cookies Policy',     to: '/cookies'          },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* My Account */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6">My Account</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Shopping Cart',  to: '/checkout'  },
                  { label: 'Order History',  to: '/orders'    },
                  { label: 'Wishlist',       to: '/wishlist'  },
                  { label: 'My Invoices',    to: '/invoices'  },
                  { label: 'Credit Slips',   to: '/credits'   },
                  { label: 'My Addresses',   to: '/addresses' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6">Contact Us</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400 leading-relaxed">London, United Kingdom</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-red-500 shrink-0" />
                  <a href="tel:02089046479" className="text-sm text-gray-400 hover:text-white transition-colors">0208 904 6479</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-red-500 shrink-0" />
                  <a href="mailto:hello@britbooks.co.uk" className="text-sm text-gray-400 hover:text-white transition-colors">customercare@britbooks.co.uk</a>
                </div>
              </div>
            </div>

          </div>

          {/* Explore — extreme right */}
          <div className="w-full lg:w-40 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6">Explore</h3>
            <ul className="space-y-4">
              {[
                { label: 'New Arrivals',   to: '/new-arrivals'   },
                { label: 'Best Sellers',   to: '/bestsellers'    },
                { label: 'Special Offers', to: '/special-offers' },
                { label: 'Clearance',      to: '/clearance'      },
                { label: 'Popular Books',  to: '/popular-books'  },
                { label: 'Browse All',     to: '/category'       },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar (desktop only) ── */}
      <div className="hidden lg:block border-t border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-7 flex flex-col md:flex-row items-center justify-between gap-5">
          <p className="text-gray-500 text-xs text-center md:text-left">
            © {new Date().getFullYear()} BritBooks. All rights reserved. Designed by{' '}
            <a href="https://excelclone.co.uk" target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors underline underline-offset-2">
              excelclone.co.uk
            </a>
          </p>

          {/* Payment badges */}
          <div className="flex items-center gap-2">
            {/* PayPal */}
            <div className="h-7 px-3 bg-white rounded flex items-center justify-center">
              <svg viewBox="0 0 80 20" className="h-4 w-auto" aria-label="PayPal">
                <text x="0" y="15" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="#003087">Pay</text>
                <text x="24" y="15" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="#009cde">Pal</text>
              </svg>
            </div>
            {/* Visa */}
            <div className="h-7 px-3 bg-white rounded flex items-center justify-center">
              <svg viewBox="0 0 60 20" className="h-4 w-auto" aria-label="Visa">
                <text x="0" y="15" fontFamily="Arial" fontWeight="900" fontSize="16" fill="#1a1f71" letterSpacing="-1">VISA</text>
              </svg>
            </div>
            {/* Mastercard */}
            <div className="h-7 px-2 bg-white rounded flex items-center justify-center gap-1">
              <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-label="Mastercard">
                <circle cx="13" cy="12" r="10" fill="#eb001b" />
                <circle cx="25" cy="12" r="10" fill="#f79e1b" />
                <path d="M19 5.4a10 10 0 0 1 0 13.2A10 10 0 0 1 19 5.4z" fill="#ff5f00" />
              </svg>
            </div>
            {/* Amex */}
            <div className="h-7 px-3 bg-[#2557d6] rounded flex items-center justify-center">
              <svg viewBox="0 0 60 20" className="h-3.5 w-auto" aria-label="American Express">
                <text x="0" y="14" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="white" letterSpacing="0.5">AMEX</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
