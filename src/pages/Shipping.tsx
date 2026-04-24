import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronLeft, ChevronRight, Star } from 'lucide-react';

import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

// --- SVG ICONS ---
const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const TruckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const PackageIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8
             a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const MailIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4
             c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9.2 9.2 0 0 1-2.89 1.1A4.52 4.52 0 0 0 16.5 0c-2.62 0-4.52 2.42-3.95 4.93A12.94 12.94 0 0 1 3 1.67a4.49 4.49 0 0 0-.6 2.28c0 1.57.8 2.95 2.02 3.75A4.4 4.4 0 0 1 2 7.2v.05c0 2.2 1.56 4.03 3.63 4.45a4.52 4.52 0 0 1-2.05.08 4.48 4.48 0 0 0 4.2 3.12A9.05 9.05 0 0 1 1 19.54 12.8 12.8 0 0 0 7.29 21c8.28 0 12.81-7.08 12.52-13.42A9.32 9.32 0 0 0 23 3z" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.675 0h-21.35C.593 0 0 .593 0 1.326v21.348C0 23.408.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.462.099 2.794.143v3.24h-1.918c-1.504 0-1.796.715-1.796 1.764v2.312h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.324-.592 1.324-1.326V1.326C24 .593 23.408 0 22.675 0z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 24 24">
    <path d="M7.75 2C4.79 2 2.25 4.54 2.25 7.5v9C2.25 19.46 4.79 22 7.75 22h8.5c2.96 0 5.5-2.54 5.5-5.5v-9C21.75 4.54 19.21 2 16.25 2h-8.5zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 1.5a2.5 2.5 0 1 0 .001 5.001A2.5 2.5 0 0 0 12 9.5zm5.25-.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
  </svg>
);


// --- TopBar is imported above ---
// --- Footer is imported above ---

// --- Mock Policy Data ---
const policies = [
  {
    category: 'Shipping',
    icon: TruckIcon,
    items: [
      {
        title: 'UK Shipping',
        description: 'Standard shipping within the UK takes 3-5 business days. Free shipping on orders over £50.',
      },
      {
        title: 'International Shipping',
        description: 'International orders take 7-14 business days, depending on the destination. Costs vary by region.',
      },
      {
        title: 'Order Tracking',
        description: 'Once shipped, you’ll receive a tracking link via email. Track your order in your account dashboard.',
      },
    ],
  },
  {
    category: 'Returns',
    icon: PackageIcon,
    items: [
      {
        title: 'Return Policy',
        description: 'Returns are accepted within 30 days of purchase for unused books in original condition.',
      },
      {
        title: 'Return Process',
        description: 'Contact support@britbooks.co.uk to initiate a return. Include your order number and reason for return.',
      },
      {
        title: 'Refunds',
        description: 'Refunds are processed within 5-7 business days after receiving the returned item.',
      },
    ],
  },
];

const ShippingReturnsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
    return () => document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.unobserve(el));
  }, []);

  const filteredPolicies = policies.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (itm) =>
        itm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itm.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  }));

  return (
    <div className="bg-gray-50 font-sans min-h-screen flex flex-col">
      <SEOHead
        title="Shipping & Returns"
        description="Learn about BritBooks shipping options, delivery times, and our hassle-free 30-day returns policy for all book orders."
        canonical="/shipping-returns"
      />
      {/* Global Styles */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
      `}</style>

      {/* TOPBAR */}
      <TopBar />

      {/* MAIN CONTENT */}
      <main className="flex-grow">
        {/* Hero */}
        <header className="bg-cover bg-center bg-shipping-gif relative pt-12 pb-16">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative">
            <motion.div
              className="text-center animate-on-scroll"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex justify-center items-center space-x-2 mb-4">
                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                  <TruckIcon className="h-8 w-8 text-red-600" />
                </motion.div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-500">
                  Shipping & Returns
                </h1>
              </div>
              <p className="mt-4 text-base sm:text-lg md:text-xl max-w-3xl mx-auto text-gray-200">
                Learn about our shipping options and return policies to ensure a seamless shopping experience with BritBooks.
              </p>
            </motion.div>
          </div>
        </header>

        {/* Search */}
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <motion.div
              className="animate-on-scroll max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <SearchIcon className="h-5 w-5" />
                  </motion.div>
                </span>
                <input
                  type="text"
                  placeholder="Search shipping or return policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-full bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Policies */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <AnimatePresence>
              {filteredPolicies.map((cat, i) =>
                cat.items.length > 0 ? (
                  <motion.div
                    key={i}
                    className="mb-12 animate-on-scroll"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.2 }}
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <cat.icon className="h-8 w-8 text-red-600" />
                      </motion.div>
                      <h2 className="text-3xl font-bold text-gray-800">{cat.category}</h2>
                    </div>
                    <div className="space-y-4">
                      {cat.items.map((item, idx) => (
                        <motion.div
                          key={idx}
                          className="bg-gray-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.2 + idx * 0.1 }}
                        >
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                          <p className="text-gray-600">{item.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : null
              )}
              {filteredPolicies.every((cat) => cat.items.length === 0) && (
                <motion.p
                  className="text-center text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  No policies found matching your search.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <motion.div
              className="text-center animate-on-scroll"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Need Further Assistance?</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                Contact our support team for help with shipping, returns, or any other inquiries.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/contact"
                  className="bg-red-600 text-white px-8 py-3 rounded-md font-semibold flex items-center space-x-2 hover:bg-red-700 transition-transform hover:scale-105"
                >
                  <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                    <MailIcon className="h-5 w-5" />
                  </motion.div>
                  <span>Contact Us</span>
                </Link>
              </div>
              <div className="mt-6 flex justify-center space-x-6">
                <a href="https://twitter.com" className="text-gray-600 hover:text-blue-400">
                  <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                    <TwitterIcon className="h-6 w-6" />
                  </motion.div>
                </a>
                <a href="https://facebook.com" className="text-gray-600 hover:text-blue-800">
                  <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                    <FacebookIcon className="h-6 w-6" />
                  </motion.div>
                </a>
                <a href="https://instagram.com" className="text-gray-600 hover:text-pink-500">
                  <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                    <InstagramIcon className="h-6 w-6" />
                  </motion.div>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default ShippingReturnsPage;
