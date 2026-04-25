import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaPinterestP, FaInstagram } from 'react-icons/fa';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';

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

      {/* ── Trust bar ── */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck,       label: 'Free UK Delivery',  sub: 'On orders over £25'    },
              { icon: RotateCcw,   label: 'Easy Returns',      sub: '30-day return policy'  },
              { icon: ShieldCheck, label: 'Secure Payments',   sub: '256-bit SSL encrypted' },
              { icon: Headphones,  label: 'Expert Support',    sub: 'Mon–Fri, 9am–5pm'     },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/60 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Newsletter ── */}
      <div className="bg-blue-900 border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5">
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
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/">
              <img src="/logobrit3.png" alt="BritBooks" className="h-20 w-auto object-contain mb-3 -ml-4" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your trusted destination for quality used books at unbeatable prices. Explore our vast collection and enjoy fast delivery.
            </p>
            <Link to="/about" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors">
              Learn more <ArrowRight className="w-3 h-3" />
            </Link>

            {/* Socials */}
            <div className="flex items-center gap-3 mt-5">
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

          {/* Customer Support */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Customer Support</h3>
            <ul className="space-y-2.5">
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
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">My Account</h3>
            <ul className="space-y-2.5">
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
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-400 leading-relaxed">London, United Kingdom</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <a href="tel:02089046479" className="text-sm text-gray-400 hover:text-white transition-colors">
                  0208 904 6479
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <a href="mailto:hello@britbooks.co.uk" className="text-sm text-gray-400 hover:text-white transition-colors">
                  hello@britbooks.co.uk
                </a>
              </div>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Explore</h3>
            <ul className="space-y-2.5">
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

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs text-center md:text-left">
            © {new Date().getFullYear()} BritBooks. All rights reserved. Designed by{' '}
            <a href="https://excelclone.co.uk" target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors underline underline-offset-2">
              excelclone.co.uk
            </a>
          </p>

          {/* Payment icons */}
          <div className="flex items-center gap-2">
            {[
              { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png', alt: 'PayPal' },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png', alt: 'Visa' },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png', alt: 'Mastercard' },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/200px-American_Express_logo.svg.png', alt: 'Amex' },
            ].map(({ src, alt }) => (
              <div key={alt} className="h-7 px-2.5 bg-white rounded flex items-center justify-center">
                <img src={src} alt={alt} className="h-4 w-auto object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
