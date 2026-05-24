import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/footer';
import { Menu, X } from 'lucide-react';
import SEOHead from '../components/SEOHead';

// --- SVG ICONS ---
const DownloadIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);
const MailIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
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

// --- MOCK DATA ---
const pressReleases = [
  {
    date: 'June 15, 2024',
    title: 'BritBooks Launches New Initiative to Save One Million Books from Landfill',
    summary: 'Today, BritBooks announced its "Million Book Rescue" campaign, a nationwide effort to encourage recycling and re-homing of used books, furthering its commitment to sustainability.'
  },
  {
    date: 'May 02, 2024',
    title: 'BritBooks Reports Record Growth as Demand for Second-Hand Books Soars',
    summary: 'The UK-based online bookstore has seen a 200% increase in sales over the last fiscal year, signaling a major shift in consumer habits towards sustainable and affordable reading.'
  },
  {
    date: 'March 20, 2024',
    title: 'New Partnership with UK Libraries to Promote Digital Literacy',
    summary: 'BritBooks is proud to partner with local libraries across the United Kingdom to provide resources and funding for digital literacy programs, helping to bridge the technology gap.'
  },
];

const mediaLogos = [
  { name: 'The Guardian', url: 'https://upload.wikimedia.org/wikipedia/commons/7/75/The_Guardian_2018.svg' },
  { name: 'BBC News', url: 'https://ichef.bbci.co.uk/images/ic/400x225/p09xtmrn.jpg' },
  { name: 'TechCrunch', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/TechCrunch_logo.svg/640px-TechCrunch_logo.svg.png' },
  { name: 'Forbes', url: 'https://cdn.freebiesupply.com/logos/large/2x/forbes-logo-png-transparent.png' },
];

// --- Main Press Page Component ---
const PressPage = () => {
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

  return (
    <div className="bg-white font-sans">
      <SEOHead
        title="Press & Media"
        description="BritBooks press room — media resources, press releases, brand assets, and contact information for journalists and media partners."
        canonical="/press"
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
      <header className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <div className="animate-on-scroll">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-800">Press & Media</h1>
            <p className="mt-4 text-base sm:text-lg md:text-xl max-w-3xl mx-auto text-gray-600">Welcome to the BritBooks press room. Here you'll find the latest news, announcements, and resources about our mission to change the world, one book at a time.</p>
          </div>
        </div>
      </header>

      <main>
        {/* As Seen In Section */}
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-6 sm:px-8">
            <h3 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider animate-on-scroll">As Seen In</h3>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              {mediaLogos.map((logo, index) => (
                <div key={index} className="flex justify-center animate-on-scroll" style={{animationDelay: `${index * 100}ms`}}>
                  <img className="h-8 md:h-10 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all" src={logo.url} alt={logo.name} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Press Releases Section */}
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center animate-on-scroll mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Latest News</h2>
              <p className="mt-4 text-lg text-gray-600">Stay up to date with our journey.</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="divide-y divide-gray-200">
                {pressReleases.map((release, index) => (
                  <div key={index} className="py-8 animate-on-scroll">
                    <p className="text-sm text-gray-500">{release.date}</p>
                    <h3 className="mt-2 text-xl font-bold text-red-600 hover:underline">
                      <Link to="#">{release.title}</Link>
                    </h3>
                    <p className="mt-3 text-gray-600">{release.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Media Kit & Contact Section */}
        <section className="bg-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-on-scroll">
              <h2 className="text-3xl font-bold text-gray-800">Media Resources</h2>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                For all media inquiries, please get in touch with our communications team. Download our media kit for access to our brand assets, company information, and high-resolution images.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <a href="#" className="bg-red-600 text-white px-8 py-3 rounded-md font-semibold text-center hover:bg-red-700 transition-transform hover:scale-105 inline-flex items-center justify-center">
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  Download Media Kit
                </a>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg animate-on-scroll" style={{animationDelay: '150ms'}}>
              <h3 className="text-2xl font-bold text-gray-800">Contact Us</h3>
              <p className="mt-2 text-gray-600">For journalists, bloggers, and media professionals.</p>
              <div className="mt-6">
                <p className="font-semibold">Media Inquiries</p>
                <a href="mailto:press@britbooks.co.uk" className="text-red-600 hover:underline flex items-center mt-1">
                  <MailIcon className="h-5 w-5 mr-2" />
                  press@britbooks.co.uk
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PressPage;