import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/footer';
import { Menu, X } from 'lucide-react';
import SEOHead from '../components/SEOHead';

// --- SVG ICONS ---
const BookOpenIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);
const UsersIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
const ZapIcon = (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
const MapPinIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const BriefcaseIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
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
const jobOpenings = [
  {
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'London, UK (Remote options)',
    description: 'Lead the development of our user-facing features, ensuring a seamless and beautiful experience for millions of book lovers.'
  },
  {
    title: 'Data Scientist, Recommendations',
    department: 'Data Science',
    location: 'Manchester, UK',
    description: 'Develop and refine the algorithms that power our book recommendation engine, helping users discover their next great read.'
  },
  {
    title: 'Logistics Coordinator',
    department: 'Operations',
    location: 'Birmingham, UK',
    description: 'Manage the flow of books from sellers to our warehouses and out to customers. A key role in our circular economy mission.'
  },
  {
    title: 'Digital Marketing Manager',
    department: 'Marketing',
    location: 'London, UK',
    description: 'Craft and execute marketing campaigns that share the BritBooks story and grow our community of readers.'
  },
];

const companyValues = [
  {
    icon: BookOpenIcon,
    title: 'Passion for Reading',
    description: 'We are readers, writers, and storytellers at heart. Our love for books fuels everything we do.'
  },
  {
    icon: UsersIcon,
    title: 'Community-Focused',
    description: 'We are building more than a company; we are building a community for everyone who believes in the power of books.'
  },
  {
    icon: ZapIcon,
    title: 'Innovate for Good',
    description: 'We use technology to solve real-world problems, from making books accessible to promoting sustainability.'
  }
];

// --- Main Careers Page Component ---
const CareersPage = () => {
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
        title="Careers at BritBooks"
        description="Join the BritBooks team and help make books accessible to everyone. Explore open roles and career opportunities at the UK's favourite book marketplace."
        canonical="/careers"
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
      <header className="relative h-[50vh] min-h-[400px] bg-gray-800">
        <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop" alt="A diverse team collaborating in a modern office" className="w-full h-full object-cover opacity-30"/>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-4 animate-on-scroll">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold">Write Your Next Chapter with Us</h1>
            <p className="mt-4 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto">Join a passionate team dedicated to changing the way the world reads.</p>
          </div>
        </div>
      </header>

      <main>
        {/* Our Values Section */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center animate-on-scroll">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Why Work at BritBooks?</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">We're a mission-driven company that values innovation, community, and a shared love for the written word. We believe that a better world is one with more readers in it.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
              {companyValues.map((item, index) => (
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

        {/* Open Positions Section */}
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center animate-on-scroll mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Current Openings</h2>
              <p className="mt-4 text-lg text-gray-600">Find your place at BritBooks. We're looking for talented people to join our team.</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {jobOpenings.map((job, index) => (
                  <div key={index} className="p-6 hover:bg-red-50 transition-colors animate-on-scroll">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                      <div>
                        <h3 className="text-xl font-bold text-red-600 hover:underline">
                          <Link to={`/careers/${job.title.toLowerCase().replace(/ /g, '-')}`}>{job.title}</Link>
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                          <div className="flex items-center"><BriefcaseIcon className="h-4 w-4 mr-1.5"/>{job.department}</div>
                          <div className="flex items-center"><MapPinIcon className="h-4 w-4 mr-1.5"/>{job.location}</div>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <Link to={`/careers/${job.title.toLowerCase().replace(/ /g, '-')}`} className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold text-center hover:bg-red-700 transition-transform hover:scale-105 inline-block">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold text-gray-800 animate-on-scroll">Don't See a Role For You?</h2>
            <p className="mt-4 text-lg text-gray-600 animate-on-scroll" style={{animationDelay: '100ms'}}>
              We're always looking for passionate, talented people. If you believe in our mission, we'd love to hear from you. Send us your CV and let us know why you want to be a part of the BritBooks story.
            </p>
            <div className="mt-8 animate-on-scroll" style={{animationDelay: '200ms'}}>
              <a href="mailto:careers@britbooks.co.uk" className="bg-gray-800 text-white px-8 py-3 rounded-md font-semibold text-center hover:bg-black transition-colors inline-block">
                Get In Touch
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CareersPage;