"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/Topbar';
import SEOHead from '../components/SEOHead';

// --- SVG ICONS for MainContent ---
const MoreHorizontalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="19" cy="12" r="1"></circle>
    <circle cx="5" cy="12" r="1"></circle>
  </svg>
);

// --- MOCK DATA for MainContent ---
const topPicks = [
  {
    id: 1,
    title: 'Bestselling Fiction',
    price: 16.90,
    condition: 'Excellent Condition',
    author: 'Freddie Author',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8MxvPdy28a80cPhSNaQBfZgbOFgTHh5fo3g&s',
    category: 'Fiction',
  },
  {
    id: 2,
    title: 'Sonnets Pirate',
    price: 19.99,
    condition: 'Standard Condition',
    author: 'Wren Author',
    imageUrl: 'https://cdn.waterstones.com/override/v2/large/2928/3772/2928377277123.jpg',
    category: 'Fiction',
  },
  {
    id: 3,
    title: 'Good Reading Copy',
    price: 18.90,
    condition: 'Good Reading Copy',
    author: 'Freddie Author',
    imageUrl: 'https://harpercollins.co.uk/cdn/shop/files/x9780008588199_d5c2c20d-92e7-4cc3-9708-affff55dd9f4.jpg?v=1750762027',
    discount: '5%',
    category: 'Mystery & Thriller',
  },
  {
    id: 4,
    title: 'Chasing Courage',
    price: 16.99,
    condition: 'Good Reading Copy',
    author: 'Wren Author',
    imageUrl: 'https://i2-prod.liverpoolecho.co.uk/incoming/article29959890.ece/ALTERNATES/s1227b/0_LH_BL_180924booksoftheyear-3jpeg.jpg',
    category: 'Romance',
  },
  {
    id: 5,
    title: 'Aurora',
    price: 14.50,
    condition: 'Pristine',
    author: 'Pead',
    imageUrl: 'https://media.vogue.co.uk/photos/65bb6a61713deab30d2b19df/3:4/w_748%2Cc_limit/HMAIVOGUEUK-1224-BTTN.png',
    category: 'Science Fiction & Fantasy',
  },
];

// Mock data for category books in modal
const categoryBooks = {
  'Fiction': [
    { title: 'The Midnight Library', author: 'Matt Haig', price: 14.99, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=0B2t0MxvPdy28a80cPhSNaQBfZgbOFgTHh5fo3g&s', synopsis: 'Nora Seed explores alternate lives in a magical library.' },
    { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', price: 16.75, imageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1603206535i/54120408.jpg', synopsis: 'An Artificial Friend observes humanity in a tech-driven world.' },
  ],
  'Mystery & Thriller': [
    { title: 'The Silent Patient', author: 'Alex Michaelides', price: 13.50, imageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1668782119i/40097951.jpg', synopsis: 'A psychotherapist unravels a patient’s silence in a gripping thriller.' },
  ],
  'Romance': [
    { title: 'Chasing Courage', author: 'Wren Author', price: 16.99, imageUrl: 'https://i2-prod.liverpoolecho.co.uk/incoming/article29959890.ece/ALTERNATES/s1227b/0_LH_BL_180924booksoftheyear-3jpeg.jpg', synopsis: 'A heartfelt story of love and resilience.' },
  ],
  'Science Fiction & Fantasy': [
    { title: 'Aurora', author: 'Pead', price: 14.50, imageUrl: 'https://media.vogue.co.uk/photos/65bb6a61713deab30d2b19df/3:4/w_748%2Cc_limit/HMAIVOGUEUK-1224-BTTN.png', synopsis: 'A sci-fi epic uncovering secrets in a distant galaxy.' },
  ],
};

// --- Categories Mock Data ---
const categories = [
  {
    id: 1,
    name: 'Fiction',
    description: 'Explore gripping novels, timeless classics, and modern bestsellers.',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=0B2t0MxvPdy28a80cPhSNaQBfZgbOFgTHh5fo3g&s'
  },
  {
    id: 2,
    name: 'Non-Fiction',
    description: 'Discover biographies, history, and insightful true stories.',
    imageUrl: 'https://media.istockphoto.com/id/2164943652/photo/a-perfect-afternoon-relaxing-with-a-book-in-the-comfort-of-your-home.jpg?s=612x612&w=0&k=20&c=ikulXn_TBxOMQUhzdRsSkPbjMWavjPhKtV-7uPErvSw='
  },
  {
    id: 3,
    name: 'Children’s Books',
    description: 'Fun and educational reads for young book lovers.',
    imageUrl: 'https://harpercollins.co.uk/cdn/shop/files/x9780008588199_d5c2c20d-92e7-4cc3-9708-affff55dd9f4.jpg?v=1750762027'
  },
  {
    id: 4,
    name: 'Mystery & Thriller',
    description: 'Dive into suspenseful plots and thrilling mysteries.',
    imageUrl: 'https://i2-prod.liverpoolecho.co.uk/incoming/article29959890.ece/ALTERNATES/s1227b/0_LH_BL_180924booksoftheyear-3jpeg.jpg'
  },
  {
    id: 5,
    name: 'Romance',
    description: 'Heartwarming love stories and passionate tales.',
    imageUrl: 'https://media.vogue.co.uk/photos/65bb6a61713deab30d2b19df/3:4/w_748%2Cc_limit/HMAIVOGUEUK-1224-BTTN.png'
  },
  {
    id: 6,
    name: 'Science Fiction & Fantasy',
    description: 'Journey through imaginative worlds and epic adventures.',
    imageUrl: 'https://assets-prd.ignimgs.com/2023/05/03/hp-deathly-hallows-1683157182524.jpeg'
  },
];

// --- Hero Slides Mock Data ---
const heroSlides = [
  {
    id: 1,
    url: 'https://media.istockphoto.com/id/2166365490/photo/view-from-above-of-a-relaxed-woman-on-the-sofa-enjoying-a-peaceful-moment-with-a-captivating.jpg?s=612x612&w=0&k=20&c=U_SLD34JlNZbcgYrAViXvd23o8qGH1MPpUOxGi3Qyqs=',
    alt: 'New Arrivals',
    title: 'New Arrivals in Non-Fiction',
    buttonLabel: 'Bogdan Iacls →'
  },
  {
    id: 2,
    url: 'https://media.istockphoto.com/id/2162169941/photo/bookstore.jpg?s=612x612&w=0&k=20&c=88K0LwAVLDQT9h-xjO6QNCKLk7S1vPUZPAlU_HcOyHE=',
    alt: 'Bestsellers',
    title: 'Top Bestsellers This Month',
    buttonLabel: 'Explore Now →'
  },
  {
    id: 3,
    url: 'https://media.istockphoto.com/id/1805651010/photo/children-visiting-the-library.jpg?s=612x612&w=0&k=20&c=6A3PWXGcKp-v0qercMT5VF409W2kvyFUwPIpy5DadFI=',
    alt: 'Children’s Books',
    title: 'Fun Reads for Kids',
    buttonLabel: 'Shop Children’s →'
  },
  {
    id: 4,
    url: 'https://harpercollins.co.uk/cdn/shop/files/x9780008588199_d5c2c20d-92e7-4cc3-9708-affff55dd9f4.jpg?v=1750762027',
    alt: 'Mystery & Thriller',
    title: 'Thrilling Mysteries Await',
    buttonLabel: 'Dive In →'
  },
  {
    id: 5,
    url: 'https://i2-prod.liverpoolecho.co.uk/incoming/article29959890.ece/ALTERNATES/s1227b/0_LH_BL_180924booksoftheyear-3jpeg.jpg',
    alt: 'Special Offers',
    title: 'Save Big with Our Deals',
    buttonLabel: 'Grab Offers →'
  },
];

// --- Category Details Modal Component ---
const CategoryDetailsModal = ({ category, onClose }: { category: string | null; onClose: () => void }) => {
  if (!category) return null;

  const categoryData = categories.find(cat => cat.name === category);
  const books = categoryBooks[category] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{category}</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">{categoryData?.description}</p>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Featured Books</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {books.map((book, index) => (
                <div key={index} className="flex gap-4">
                  <img src={book.imageUrl} alt={book.title} className="w-20 h-30 sm:w-24 sm:h-36 object-cover rounded-md" />
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800">{book.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">by {book.author}</p>
                    <p className="text-xs sm:text-sm text-gray-600">£{book.price.toFixed(2)}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-3">{book.synopsis}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Link
              to={`/category`}
              className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              onClick={onClose}
            >
              Browse Category
            </Link>
            <button
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MainContent Component ---
const MainContent = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const isUserInteracted = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Define bestsellers array
  const bestsellers = [
    {
      id: 1,
      title: 'Benedict Caine',
      author: 'Crusaders Austin',
      price: 20.85,
      discount: '59% OFF',
      imageUrl: 'https://assets-prd.ignimgs.com/2023/05/03/hp-deathly-hallows-1683157182524.jpeg'
    }
  ];

  const getConditionClass = (condition: string) => {
    switch (condition) {
      case 'Excellent Condition': return 'bg-green-100 text-green-800';
      case 'Standard Condition': return 'bg-blue-100 text-blue-800';
      case 'Good Reading Copy': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSlideChange = (index: number) => {
    setActiveSlide(index);
    isUserInteracted.current = true; // Pause auto-slide on user interaction
  };

  useEffect(() => {
    if (isUserInteracted.current) return; // Skip auto-slide if user has interacted

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Slide every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <main className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-16 lg:pb-0">
      {/* Hero Section with Carousel */}
      <div className="relative h-48 sm:h-56 lg:h-64 rounded-lg overflow-hidden mb-6 lg:mb-8">
        <img
          src={heroSlides[activeSlide].url}
          alt={heroSlides[activeSlide].alt}
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ imageRendering: 'auto' }}
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center p-4 sm:p-6 lg:p-8 transition-opacity duration-500">
          <button className="bg-white/30 backdrop-blur-sm text-white text-xs py-1 px-3 rounded-full self-start mb-2">
            {heroSlides[activeSlide].buttonLabel}
          </button>
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold">{heroSlides[activeSlide].title}</h1>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideChange(index)}
              className={`w-2 h-2 rounded-full ${activeSlide === index ? 'bg-white' : 'bg-white/50'}`}
            ></button>
          ))}
        </div>
        <button className="absolute top-4 right-4">
          <MoreHorizontalIcon className="text-white" />
        </button>
      </div>

      {/* Top Picks Section */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Top Picks</h2>
        <div className="flex space-x-4 sm:space-x-6 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {topPicks.map(book => (
            <div key={book.id} className="flex-shrink-0 w-40 sm:w-48 cursor-pointer" onClick={() => setSelectedCategory(book.category)}>
              <div className="relative">
                <img src={book.imageUrl} alt={book.title} className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md" />
                {book.discount && <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{book.discount}</div>}
              </div>
              <h3 className="text-sm sm:text-base font-bold mt-2 truncate">{book.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600">£{book.price.toFixed(2)}</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getConditionClass(book.condition)}`}>{book.condition}</span>
              <p className="text-xs text-gray-500 mt-1">{book.author}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bestsellers and Why Choose Us Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Bestsellers</h2>
          {bestsellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {bestsellers.map(book => (
                <div key={book.id} className="md:col-span-1">
                  <img src={book.imageUrl} alt={book.title} className="w-full h-48 sm:h-64 object-cover rounded-lg" />
                </div>
              ))}
              <div className="md:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{bestsellers[0].title}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">by {bestsellers[0].author}</p>
                  <p className="text-gray-500 text-xs sm:text-sm">£{bestsellers[0].price.toFixed(2)}</p>
                  <div className="mt-4 flex items-baseline space-x-4">
                    <div className="bg-red-100 text-red-700 p-3 sm:p-4 rounded-lg text-center">
                      <p className="font-bold text-lg sm:text-2xl">Today's Deals</p>
                      <p className="text-2xl sm:text-4xl font-extrabold">{bestsellers[0].discount}</p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-700 p-3 sm:p-4 rounded-lg text-center">
                      <p className="font-bold text-lg sm:text-2xl">55%</p>
                      <p className="text-xs sm:text-sm">OFF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No bestsellers available.</p>
          )}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Why Choose Us</h2>
          <ul className="space-y-3 text-gray-700 text-sm sm:text-base">
            <li>FREE UK Delivery over £X</li>
            <li>Sustainable Shopping</li>
            <li>Quality Checked Books</li>
          </ul>
          <div className="mt-4 sm:mt-6">
            <h3 className="font-semibold text-sm sm:text-base mb-2">Newsletter Signup</h3>
            <input type="email" placeholder="Your email" className="w-full p-2 border rounded-md text-sm" />
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mt-6 lg:mt-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map(category => (
            <div key={category.id} className="relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 group">
              <div className="relative">
                <img src={category.imageUrl} alt={category.name} className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button className="bg-white text-gray-800 font-semibold py-1 sm:py-2 px-3 sm:px-4 rounded-full hover:bg-gray-100 transition-colors">
                    Shop Now
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">{category.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CategoryDetailsModal category={selectedCategory} onClose={() => setSelectedCategory(null)} />
    </main>
  );
};

// --- DashboardPage Component ---
const DashboardPage = () => {
  const [activeLink, setActiveLink] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans flex-col">
      <SEOHead title="My Dashboard" description="Manage your BritBooks account." canonical="/dashboard" noindex={true} />
      <TopBar />
      <MainContent />
    </div>
  );
};

export default DashboardPage;