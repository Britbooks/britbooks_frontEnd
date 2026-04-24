import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/footer';
import { Menu, X } from 'lucide-react';
import SEOHead from '../components/SEOHead';


const LeafIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 4 13H2a10 10 0 0 0 10 10zM2 13a10 10 0 0 1 10-10 7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5 8 8 0 0 0-8 8z"></path>
  </svg>
);
const RecycleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 19l-4-4 4-4"/><path d="M3 15h14.5A4.5 4.5 0 0 0 22 10.5V10"/><path d="M17 5l4 4-4 4"/><path d="M21 9H6.5A4.5 4.5 0 0 0 2 13.5V14"/>
  </svg>
);
const PackageIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);
const TwitterIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.39.106-.803.163-1.227.163-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path>
  </svg>
);
const FacebookIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path>
  </svg>
);
const InstagramIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.358-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
  </svg>
);
const SearchIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const UserCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"/><circle cx="12" cy="10" r="3"/><circle cx="12" cy="12" r="10"/></svg>;
const ShoppingCartIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;

// --- TopBar Component (Inlined) ---
const TopBar = () => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    return (
        <header className="h-auto sm:h-20 px-4 sm:px-8 border-b sticky top-0 bg-white z-20 flex items-center">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 py-4 sm:py-0 relative w-full">
          
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
            <div className="flex justify-between w-full sm:w-auto items-center">
              <Link to="/">
                <div className="flex items-center justify-center space-x-2">
                  <div className="bg-red-600 text-white font-bold text-2xl w-12 h-12 flex items-center justify-center rounded-md">B</div>
                  <span className="text-2xl sm:text-3xl font-bold">BritBooks</span>
                </div>
              </Link>
      
              {/* Hamburger button - only on mobile */}
              <button
                className="sm:hidden p-2"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
      
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search books, authors, or genres..."
                className="pl-10 pr-4 py-2 border rounded-full w-full"
              />
            </div>
          </div>
      
          {/* DESKTOP NAV */}
          <div className="hidden sm:flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <Link to="/explore" className="text-gray-600 header-btn text-center sm:text-left">Explore</Link>
            <Link to="/login" className="text-gray-600 header-btn text-center sm:text-left">Login</Link>
            <Link to="/signup" className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold btn-hover-effect text-center sm:text-left w-full sm:w-auto">Sign Up</Link>
          </div>
        </div>
      
        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="sm:hidden w-full border-t">
            <div className="flex flex-col space-y-2 py-4">
              <Link to="/explore" className="text-gray-600 text-center" onClick={() => setMenuOpen(false)}>Explore</Link>
              <Link to="/login" className="text-gray-600 text-center" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold text-center w-full" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </div>
          </div>
        )}
      </header>
    );
};

// --- Main Sustainability Page Component ---
const SustainabilityPage = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const stats = [
    { value: '1M+', label: 'Books Re-Homed' },
    { value: '500+', label: 'Tonnes of Waste Saved' },
    { value: '10,000+', label: 'Trees Preserved' },
  ];

  const commitments = [
    { icon: RecycleIcon, title: 'Circular Economy', description: 'Every book purchased from BritBooks is a vote for a circular economy. By giving books a second, third, or fourth life, we drastically reduce the need for new resources and keep valuable materials in circulation.' },
    { icon: LeafIcon, title: 'Reducing Our Footprint', description: 'We\'re committed to minimizing our environmental impact. This means optimizing our logistics, using energy-efficient servers, and constantly seeking new ways to reduce our carbon footprint across all operations.'},
    { icon: PackageIcon, title: 'Eco-Friendly Packaging', description: 'Your books arrive in packaging that’s as green as it is protective. We use 100% recyclable and biodegradable materials, ensuring that your purchase is gentle on the planet from our shelf to your door.' },
  ];

  return (
    <div className="bg-white font-sans">
      <SEOHead
        title="Sustainability"
        description="BritBooks is committed to sustainable reading. Learn how buying second-hand books reduces waste and supports a greener planet."
        canonical="/sustainability"
      />
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
      `}</style>

      <TopBar />

      {/* Hero Section */}
      <header className="relative h-[50vh] min-h-[400px]">
        <img src="https://images.unsplash.com/photo-1530538987395-032d1800fdd4?q=80&w=2070&auto=format&fit=crop" alt="A book resting on a mossy log in a forest" className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white p-4 animate-on-scroll">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold">Give Books a New Chapter</h1>
            <p className="mt-4 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto">Join us in our mission to make reading sustainable. Every book you buy or sell helps the planet.</p>
          </div>
        </div>
      </header>

      <main>
        {/* Our Commitment Section */}
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center animate-on-scroll">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Our Commitment to a Greener World</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">We're not just a bookstore; we're a movement. Our core mission is to reduce waste and promote a circular economy for books, ensuring every story can be enjoyed for generations to come.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
              {commitments.map((item, index) => (
                <div key={index} className="text-center p-6 animate-on-scroll" style={{animationDelay: `${index * 150}ms`}}>
                  <div className="flex items-center justify-center h-16 w-16 mx-auto bg-red-100 text-red-600 rounded-full">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Statistics Section */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6 sm:px-8">
            <div className="text-center animate-on-scroll mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Our Impact, By the Numbers</h2>
              <p className="mt-4 text-lg text-gray-600">Your choices make a real difference. Here's what we've achieved together.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index} className="p-6 animate-on-scroll" style={{animationDelay: `${index * 150}ms`}}>
                  <p className="text-5xl md:text-6xl font-extrabold text-red-600">{stat.value}</p>
                  <p className="mt-2 text-lg font-semibold text-gray-700">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How You Help Section */}
        <section className="bg-red-50 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-on-scroll">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">You're the Hero of This Story</h2>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">Every time you choose a used book over a new one, you're making a powerful statement. You're saving a tree, reducing water usage, and cutting down on the carbon emissions from manufacturing and shipping. You are an essential part of the BritBooks community and a champion for a more sustainable future.</p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/browse" className="bg-red-600 text-white px-8 py-3 rounded-md font-semibold text-center hover:bg-red-700 transition-transform hover:scale-105">
                  Shop Sustainably
                </Link>
                <Link to="/sell" className="bg-white text-red-600 border-2 border-red-600 px-8 py-3 rounded-md font-semibold text-center hover:bg-red-100 transition-colors">
                  Sell Your Books
                </Link>
              </div>
            </div>
            <div className="animate-on-scroll" style={{animationDelay: '150ms'}}>
              <img src="https://media.istockphoto.com/id/1597407164/photo/exchange-student-walking-outdoors-in-london-and-drinking-coffee.jpg?s=612x612&w=0&k=20&c=TPi19lctyFDH0LXVdQ29nz6DU2yd0II9w7NTSlhb5ug=" alt="A person holding an open book with a plant growing out of it" className="rounded-lg shadow-xl"/>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SustainabilityPage;