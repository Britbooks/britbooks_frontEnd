import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/Topbar'; // Added TopBar import
import Footer from '../components/footer';
import { Menu, X } from 'lucide-react';


// --- SVG ICONS ---
const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const UserCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"/><circle cx="12" cy="10" r="3"/><circle cx="12" cy="12" r="10"/>
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
const MailIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);
const PhoneIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);
const MapPinIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
  </svg>
);
const SparkleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"></path>
  </svg>
);

// --- Mock Data for Why Contact Us Section ---
const contactReasons = [
  { title: 'Customer Support', description: 'Have questions about your order? Our team is here to help.', icon: MailIcon },
  { title: 'Feedback', description: 'Share your thoughts to help us improve your experience.', icon: SparkleIcon },
  { title: 'Partnerships', description: 'Interested in collaborating? Let’s talk about opportunities.', icon: MapPinIcon },
];

// --- Contact Page Component ---
const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState(null);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission (replace with actual API call in production)
    setTimeout(() => {
      setFormStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  return (
    <div className="bg-gray-50 font-sans">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
        .animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
        .animate-pulse { animation: pulse 1.5s infinite; }
        .header-btn:hover { transform: scale(1.05); }
        .btn-hover-effect:hover { transform: scale(1.05); }
        .bg-contact-gif { background-image: url('https://media.istockphoto.com/id/2162666822/video/top-down-view-of-employees-working-in-office-utilizing-artificial-intelligence-productivity.mp4?s=mp4-640x640-is&k=20&c=utMN0sLwYNa7VH9oFHHKLjr-UbFtou_9hi6nFRvxz48='); background-size: cover; background-position: center; }
        .input-focus { transition: all 0.3s ease; }
        .input-focus:focus { transform: scale(1.02); box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }
      `}</style>

      <TopBar />
      

      <main>
        {/* Hero Section */}
        <header className="bg-contact-gif bg-gray-100 pt-12 pb-16 relative">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative">
            <div className="text-center animate-on-scroll">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <MailIcon className="h-8 w-8 text-red-600 animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-500">Contact Us</h1>
              </div>
              <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-gray-200">We’re here to help! Reach out with questions, feedback, or partnership inquiries, and we’ll get back to you promptly.</p>
            </div>
          </div>
        </header>

        {/* Contact Form and Info Section */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="animate-on-scroll">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 input-focus"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 input-focus"
                      placeholder="Your email"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 input-focus"
                      placeholder="Subject of your message"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 input-focus"
                      rows="5"
                      placeholder="Your message"
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-8 py-3 rounded-md font-semibold flex items-center space-x-2 hover:bg-red-700 transition-transform hover:scale-105"
                  >
                    <MailIcon className="h-5 w-5" />
                    <span>Send Message</span>
                  </button>
                  {formStatus === 'success' && (
                    <p className="text-green-600 mt-4 animate-pulse">Message sent successfully!</p>
                  )}
                </form>
              </div>
              {/* Contact Information */}
              <div className="animate-on-scroll" style={{animationDelay: '150ms'}}>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Get in Touch</h2>
                <p className="text-gray-600 mb-8">We’d love to hear from you. Here’s how you can reach us directly.</p>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <MailIcon className="h-6 w-6 text-red-600 animate-pulse" />
                    <div>
                      <p className="font-semibold text-gray-800">Email</p>
                      <a href="mailto:support@britbooks.co.uk" className="text-red-600 hover:underline">support@britbooks.co.uk</a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <PhoneIcon className="h-6 w-6 text-red-600 animate-pulse" />
                    <div>
                      <p className="font-semibold text-gray-800">Phone</p>
                      <a href="tel:+441234567890" className="text-red-600 hover:underline">+44 123 456 7890</a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <MapPinIcon className="h-6 w-6 text-red-600 animate-pulse" />
                    <div>
                      <p className="font-semibold text-gray-800">Address</p>
                      <p className="text-gray-600">123 Book Street, London, UK, EC1A 1BB</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <p className="font-semibold text-gray-800 mb-2">Follow Us</p>
                  <div className="flex space-x-4">
                    <a href="https://twitter.com" className="text-gray-600 hover:text-blue-400"><TwitterIcon className="h-6 w-6" /></a>
                    <a href="https://facebook.com" className="text-gray-600 hover:text-blue-800"><FacebookIcon className="h-6 w-6" /></a>
                    <a href="https://instagram.com" className="text-gray-600 hover:text-pink-500"><InstagramIcon className="h-6 w-6" /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Contact Us Section */}
        <section className="py-16 sm:py-20 bg-gray-100">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center animate-on-scroll mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Why Contact Us?</h2>
              <p className="mt-4 text-lg text-gray-600">We’re here to support your reading journey.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {contactReasons.map((reason, index) => (
                <div key={index} className="animate-on-scroll bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300" style={{animationDelay: `${index * 100}ms`}}>
                  <reason.icon className="h-10 w-10 text-red-600 mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-gray-800">{reason.title}</h3>
                  <p className="mt-2 text-gray-600">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;